const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

router.get('/view', authenticateToken, async (req, res) => {
    const { userId, userRole } = req.query;
    try {
        let result;
        if (userRole === 'landlord'){
            result = await req.pool.query(`
                SELECT mr.*, p.property_name FROM maintenance_requests mr
                JOIN properties p ON mr.property_id= p.id
                JOIN landlords l ON p.landlord_id = l.id
                WHERE l.user_id = $1 ORDER BY mr.request_date DESC
            `, [userId]);
        } else{
            result = await req.pool.query(`
                SELECT mr.*, p.property_name FROM maintenance_requests mr
                JOIN tenants t ON mr.tenant_id = t.id
                JOIN properties p ON mr.property_id = p.id
                WHERE t.user_id = $1 ORDER BY mr.request_date DESC
            `, [userId]);
        }
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', authenticateToken, async (req, res) => {
    const { property_id, tenant_id, tenant_fullname, tenant_contact, tenant_email, issue_title, issue_field, issue_description, priority, status } = req.body;
    try {
        const tenantResult = await req.pool.query(
            'SELECT id FROM tenants WHERE user_id = $1', [tenant_id]
        );
        if (tenantResult.rows.length === 0)
            return res.status(404).json({ error: "Tenant profile not found" });

        const actualTenantId = tenantResult.rows[0].id;
        const result = await req.pool.query(
            `INSERT INTO maintenance_requests (property_id, tenant_id, tenant_fullname, tenant_contact, tenant_email, issue_title, issue_field, issue_description, priority, status)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
            [property_id, actualTenantId, tenant_fullname, tenant_contact, tenant_email, issue_title, issue_field, issue_description, priority, status]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { tenant_email, issue_title, issue_field, issue_description, priority } = req.body;
    try {
        const result = await req.pool.query(
            `UPDATE maintenance_requests SET tenant_email=$1, issue_title=$2, issue_field=$3, issue_description=$4, priority=$5, updated_at=CURRENT_TIMESTAMP
             WHERE id=$6 RETURNING *`,
            [tenant_email, issue_title, issue_field, issue_description, priority, id]
        );
        if (result.rows.length === 0)
            return res.status(404).json({ error: "Request not found" });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch('/:id/status', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'in_progress', 'finished', 'cancelled'];
    if (!validStatuses.includes(status))
        return res.status(400).json({ error: "Invalid status value" });

    const client = await req.pool.connect();

    try {
        await client.query('BEGIN');

        const current = await client.query(
            'SELECT * FROM maintenance_requests WHERE id = $1', [id]
        );

        if (current.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "Request not found" });
        }
        const currentStatus = current.rows[0].status;

        if (status === 'cancelled' && currentStatus !== 'pending') {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Only pending requests can be cancelled" });
        }

        if (status === 'finished' && !['pending', 'in_progress'].includes(currentStatus)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Request cannot be marked as finished from its current status" });
        }

        const result = await client.query(
            `UPDATE maintenance_requests SET status = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2 RETURNING *`,
            [status, id]
        );

        if (status === 'finished') {
            await client.query(
                `UPDATE maintenance_requests SET resolved_date = CURRENT_TIMESTAMP
                WHERE id = $1`, [id]
            );
        }
        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await req.pool.query(
            'DELETE FROM maintenance_requests WHERE id = $1 RETURNING *', [id]
        );

        if (result.rows.length === 0)
            return res.status(404).json({ error: "Request not found" });
        res.json({ message: "Request deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;