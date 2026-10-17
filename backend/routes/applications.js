const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

router.get('/view', authenticateToken, async (req, res) => {
    const { userId, userRole } = req.query;
    try {
        let result;
        if (userRole === 'landlord') {
            result = await req.pool.query(`
                SELECT ra.*, p.property_name FROM rental_applications ra
                JOIN properties p ON ra.property_id = p.id
                JOIN landlords l ON p.landlord_id = l.id
                WHERE l.user_id = $1 ORDER BY ra.created_at DESC
            `, [userId]);
        } else {
            result = await req.pool.query(`
                SELECT ra.*, p.property_name FROM rental_applications ra
                JOIN tenants t ON ra.tenant_id = t.id
                JOIN properties p ON ra.property_id = p.id
                WHERE t.user_id = $1 ORDER BY ra.created_at DESC
            `, [userId]);
        }
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Server Error" });
    }
});

router.post('/', authenticateToken, async (req, res) => {
    const { property_id, tenant_id, tenant_fullname, move_in_date, tenant_contact, tenant_email, lease_term, message, status } = req.body;
    try {
        const tenantResult = await req.pool.query(
            'SELECT id FROM tenants WHERE user_id = $1', [tenant_id]
        );
        if (tenantResult.rows.length === 0)
            return res.status(404).json({ error: "Tenant profile not found" });

        const actualTenantId = tenantResult.rows[0].id;
        const result = await req.pool.query(
            `INSERT INTO rental_applications (property_id, tenant_id, tenant_fullname, move_in_date, tenant_contact, tenant_email, lease_term, message, status)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
            [property_id, actualTenantId, tenant_fullname, move_in_date, tenant_contact, tenant_email, lease_term, message, status]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { move_in_date, tenant_contact, tenant_email, lease_term, message } = req.body;
    try {
        const result = await req.pool.query(
            `UPDATE rental_applications SET move_in_date=$1, tenant_contact=$2, tenant_email=$3, lease_term=$4, message=$5, updated_at=CURRENT_TIMESTAMP
             WHERE id=$6 RETURNING *`,
            [move_in_date, tenant_contact, tenant_email, lease_term, message, id]
        );
        if (result.rows.length === 0)
            return res.status(404).json({ error: "Application not found" });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch('/:id/status', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'approved', 'rejected', 'withdrawn'];
    if (!validStatuses.includes(status))
        return res.status(400).json({ error: "Invalid status value" });

    const client = await req.pool.connect();

    try {
        await client.query('BEGIN');

        const current = await client.query(
            'SELECT * FROM rental_applications WHERE id = $1', [id]
        );

        if (current.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "Application not found" });
        }

        const currentStatus = current.rows[0].status;

        if ((status === 'approved' || status === 'rejected') && currentStatus !== 'pending') {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Only pending applications can be approved or rejected" });
        }

        if (status === 'withdrawn' && !['pending', 'approved'].includes(currentStatus)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Only pending or approved applications can be withdrawn" });
        }

        if (status === 'pending' && currentStatus !== 'pending') {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Cannot revert application back to pending" });
        }

        const result = await client.query(
            `UPDATE rental_applications SET status = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2 RETURNING *`,
            [status, id]
        );

        const application = result.rows[0];

        if (status === 'approved') {
            const tenantResult = await client.query(
                'SELECT user_id FROM tenants WHERE id = $1', [application.tenant_id]
            );

            if (tenantResult.rows.length > 0) {
                const tenantUserId = tenantResult.rows[0].user_id;

                await client.query(
                    `UPDATE properties SET tenant_id = $1, status = 'rented'
                     WHERE id = $2`,
                    [tenantUserId, application.property_id]
                );

                await client.query(
                    `UPDATE rental_applications SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
                     WHERE property_id = $1 AND id != $2 AND status = 'pending'`,
                    [application.property_id, id]
                );
            }
        } else if (status === 'rejected' || status === 'withdrawn') {
            const propertyResult = await client.query(
                'SELECT tenant_id FROM properties WHERE id = $1', [application.property_id]
            );

            if (propertyResult.rows.length > 0) {
                const tenantResult = await client.query(
                    'SELECT user_id FROM tenants WHERE id = $1', [application.tenant_id]
                );

                if (tenantResult.rows.length > 0 &&
                    propertyResult.rows[0].tenant_id === tenantResult.rows[0].user_id) {
                    await client.query(
                        `UPDATE properties SET tenant_id = NULL, status = 'available'
                         WHERE id = $1`,
                        [application.property_id]
                    );
                }
            }
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
            'DELETE FROM rental_applications WHERE id = $1 RETURNING *', [id]
        );
        
        if (result.rows.length === 0)
            return res.status(404).json({ error: "Application not found" });
        res.json({ message: "Application deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;