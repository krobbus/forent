import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const result = await req.pool.query(`
            SELECT p.*,
                t.first_name AS tenant_first_name,
                t.last_name AS tenant_last_name,
                t.ext_name AS tenant_ext_name
            FROM properties p
            LEFT JOIN tenants t ON p.tenant_id = t.user_id
            ORDER BY p.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("Properties fetch error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

router.get('/rented', authenticateToken, async (req, res) => {
    const { userId } = req.query;
    try {
        const result = await req.pool.query(`
            SELECT p.id, p.property_name 
            FROM properties p
            JOIN tenants t ON p.tenant_id = t.user_id
            WHERE t.user_id = $1 AND p.status = 'rented'
        `, [userId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await req.pool.query('SELECT * FROM properties WHERE id = $1', [id]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: "Property not found" });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', authenticateToken, async (req, res) => {
    const { images, name, address, price, category, landlord_id, description, bedroom_count, kitchen_count, bathroom_count, other_rooms, other_rooms_count, max_occupants, pets_allowed, amenities } = req.body;
    const otherRoomsString = Array.isArray(other_rooms) ? other_rooms.join(', ') : other_rooms;
    const amenityList = [];
    if (amenities.wifi) amenityList.push('Wifi');
    if (amenities.aircon) amenityList.push('Aircon');
    if (amenities.parking) amenityList.push('Parking');
    if (amenities.other_amenities) amenityList.push(amenities.other_amenities);

    try {
        const result = await req.pool.query(
            `INSERT INTO properties (images, property_name, address, price, category, landlord_id, description, bedroom_count, kitchen_count, bathroom_count, other_rooms, other_rooms_count, max_occupants, pets_allowed, amenities, status)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'available') RETURNING *`,
            [JSON.stringify(images || []), name, address, price, category, landlord_id, description, bedroom_count, kitchen_count, bathroom_count, otherRoomsString, other_rooms_count, max_occupants, pets_allowed, amenityList]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Database error occurred" });
    }
});

router.patch('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { images, name, address, price, description, category, bedroom_count, kitchen_count, bathroom_count, other_rooms, other_rooms_count, max_occupants, pets_allowed, amenities } = req.body;
    const otherRoomsString = Array.isArray(other_rooms) ? other_rooms.join(', ') : other_rooms;
    const amenityList = [];
    if (amenities.wifi) amenityList.push('Wifi');
    if (amenities.aircon) amenityList.push('Aircon');
    if (amenities.parking) amenityList.push('Parking');
    if (amenities.other_amenities) amenityList.push(amenities.other_amenities);

    try {
        const result = await req.pool.query(
            `UPDATE properties SET images=$1, property_name=$2, address=$3, price=$4, description=$5, category=$6,
             bedroom_count=$7, kitchen_count=$8, bathroom_count=$9, other_rooms=$10, other_rooms_count=$11,
             max_occupants=$12, pets_allowed=$13, amenities=$14 WHERE id=$15 RETURNING *`,
            [JSON.stringify(images || []), name, address, price, description, category, bedroom_count, kitchen_count, bathroom_count, otherRoomsString, other_rooms_count, max_occupants, pets_allowed, amenityList, id]
        );
        if (result.rows.length === 0)
            return res.status(404).json({ error: "Property not found" });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const propertyCheck = await req.pool.query(
            'SELECT status FROM properties WHERE id = $1', [id]
        );

        if (propertyCheck.rows.length === 0) return res.status(404).json({ error: "Property not found" });
        if (propertyCheck.rows[0].status === 'rented') return res.status(400).json({ error: "Cannot delete a property that is currently rented." });

        await req.pool.query('DELETE FROM properties WHERE id = $1', [id]);
        res.json({ message: "Property deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

router.patch('/:id/terminate', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { tenant_id, reason } = req.body;

    try {
        const propertyCheck = await req.pool.query('SELECT * FROM properties WHERE id = $1', [id]);

        if (propertyCheck.rows.length === 0) return res.status(404).json({ error: "Property not found" });

        const property = propertyCheck.rows[0];
        if (property.status !== 'rented') return res.status(400).json({ error: "Property is not currently rented" });
        if (Number(property.tenant_id) !== Number(tenant_id)) return res.status(403).json({ error: "You are not the tenant of this property" });

        await req.pool.query(
            `UPDATE properties 
             SET status = 'available', tenant_id = NULL 
             WHERE id = $1`,
            [id]
        );

        res.json({ message: "Lease terminated successfully" });
    } catch (err) {
        console.error("Termination error:", err.message);
        res.status(500).json({ error: "Server error" });
    }
});

export default router;