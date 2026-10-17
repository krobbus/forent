import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
    constructStripeWebhookEvent,
    createRentCheckoutSession
} from '../services/stripe.js';

const router = express.Router();

router.get('/view', authenticateToken, async (req, res) => {
    const { userId, userRole } = req.query;
    try {
        let result;
        if (userRole === 'landlord') {
            result = await req.pool.query(`
                SELECT ph.*, p.property_name
                FROM payment_history ph
                JOIN properties p ON ph.property_id = p.id
                JOIN landlords l ON ph.landlord_id = l.id
                WHERE l.user_id = $1
                ORDER BY ph.created_at DESC
            `, [userId]);
        } else {
            result = await req.pool.query(`
                SELECT ph.*, p.property_name
                FROM payment_history ph
                JOIN properties p ON ph.property_id = p.id
                JOIN tenants t ON ph.tenant_id = t.id
                WHERE t.user_id = $1
                ORDER BY ph.created_at DESC
            `, [userId]);
        }
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', authenticateToken, async (req, res) => {
    const { property_id, tenant_id, amount, payment_method, period_covered, notes, recorded_by } = req.body;
    try {
        const tenantResult = await req.pool.query(
            'SELECT id FROM tenants WHERE user_id = $1', [tenant_id]
        );
        if (tenantResult.rows.length === 0)
            return res.status(404).json({ error: "Tenant profile not found" });

        const actualTenantId = tenantResult.rows[0].id;

        const landlordResult = await req.pool.query(
            'SELECT landlord_id FROM properties WHERE id = $1', [property_id]
        );
        if (landlordResult.rows.length === 0)
            return res.status(404).json({ error: "Property not found" });

        const actualLandlordId = landlordResult.rows[0].landlord_id;

        const result = await req.pool.query(
            `INSERT INTO payment_history 
                (property_id, tenant_id, landlord_id, amount, payment_method, period_covered, notes, recorded_by, status)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending') RETURNING *`,
            [property_id, actualTenantId, actualLandlordId, amount, payment_method, period_covered, notes, recorded_by]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/create-checkout-session', authenticateToken, async (req, res) => {
    const { property_id, tenant_id, amount, period_covered, notes, property_name } = req.body;

    try {
        const tenantResult = await req.pool.query(
            'SELECT id FROM tenants WHERE user_id = $1', [tenant_id]
        );
        if (tenantResult.rows.length === 0)
            return res.status(404).json({ error: "Tenant profile not found" });

        const actualTenantId = tenantResult.rows[0].id;

        const landlordResult = await req.pool.query(
            'SELECT landlord_id FROM properties WHERE id = $1', [property_id]
        );
        if (landlordResult.rows.length === 0)
            return res.status(404).json({ error: "Property not found" });

        const actualLandlordId = landlordResult.rows[0].landlord_id;

        const paymentResult = await req.pool.query(
            `INSERT INTO payment_history 
                (property_id, tenant_id, landlord_id, amount, payment_method, period_covered, notes, recorded_by, status)
             VALUES ($1,$2,$3,$4,'card',$5,$6,'tenant','pending') RETURNING *`,
            [property_id, actualTenantId, actualLandlordId, amount, period_covered, notes]
        );

        const paymentRecord = paymentResult.rows[0];

        const session = await createRentCheckoutSession({
            amount,
            propertyName: property_name,
            periodCovered: period_covered,
            paymentRecordId: paymentRecord.id,
            propertyId: property_id,
            tenantId: actualTenantId,
        });

        res.json({ url: session.url, payment_record_id: paymentRecord.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;
    try {
        event = constructStripeWebhookEvent(req.body, sig);
    } catch (err) {
        return res.status(400).json({ error: `Webhook error: ${err.message}` });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const paymentRecordId = session.metadata.payment_record_id;

        try {
            await req.pool.query(
                `UPDATE payment_history 
                 SET status = 'paid', payment_date = CURRENT_TIMESTAMP,
                     stripe_session_id = $1, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $2`,
                [session.id, paymentRecordId]
            );
        } catch (err) {
            console.error("Webhook DB update failed:", err.message);
            return res.status(500).json({ error: err.message });
        }
    }

    res.json({ received: true });
});

router.patch('/:id/status', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['paid', 'pending', 'failed', 'refunded'];
    if (!validStatuses.includes(status))
        return res.status(400).json({ error: "Invalid status value" });

    const client = await req.pool.connect();
    try {
        await client.query('BEGIN');

        const current = await client.query('SELECT * FROM payment_history WHERE id = $1', [id]);
        if (current.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "Payment record not found" });
        }

        const currentStatus = current.rows[0].status;
        if (currentStatus === 'paid' && status === 'paid') {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Payment is already marked as paid" });
        }

        if (status === 'refunded' && currentStatus !== 'paid') {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Only paid payments can be refunded" });
        }

        const result = await client.query(
            `UPDATE payment_history 
            SET status = $1,
                payment_date = CASE WHEN $2 = 'paid' THEN CURRENT_TIMESTAMP ELSE payment_date END,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $3 RETURNING *`,
            [status, status, id]
        );

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
            'DELETE FROM payment_history WHERE id = $1 RETURNING *', [id]
        );
        if (result.rows.length === 0)
            return res.status(404).json({ error: "Payment record not found" });
        res.json({ message: "Payment record deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;