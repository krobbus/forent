const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

router.get('/landlords', authenticateToken, async (req, res) => {
    try {
        const result = await req.pool.query(`
            SELECT u.id as user_id, l.id as landlord_id, u.username, l.first_name, l.last_name, l.email 
            FROM users u INNER JOIN landlords l ON u.id = l.user_id
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/tenants', authenticateToken, async (req, res) => {
    try {
        const result = await req.pool.query(`
            SELECT u.id as user_id, t.id as tenant_id, u.username, t.first_name, t.last_name, t.email 
            FROM users u INNER JOIN tenants t ON u.id = t.user_id
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/landlords/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await req.pool.query(
            'SELECT l.*, u.role FROM landlords l JOIN users u ON l.user_id = u.id WHERE l.user_id = $1', [id]
        );
        if (result.rows.length === 0)
            return res.status(404).json({ error: "Profile not found" });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/tenants/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await req.pool.query(
            'SELECT t.*, u.role FROM tenants t JOIN users u ON t.user_id = u.id WHERE t.user_id = $1', [id]
        );
        if (result.rows.length === 0)
            return res.status(404).json({ error: "Profile not found" });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch('/landlords/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { first_name, middle_name, last_name, ext_name, email, contact_num } = req.body;
    try {
        const result = await req.pool.query(
            `UPDATE landlords SET first_name=$1, middle_name=$2, last_name=$3, ext_name=$4, email=$5, contact_num=$6
             WHERE user_id=$7 RETURNING *`,
            [first_name, middle_name, last_name, ext_name, email, contact_num, id]
        );
        if (result.rows.length === 0)
            return res.status(404).json({ error: "Profile not found" });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch('/tenants/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { first_name, middle_name, last_name, ext_name, email, contact_num } = req.body;
    try {
        const result = await req.pool.query(
            `UPDATE tenants SET first_name=$1, middle_name=$2, last_name=$3, ext_name=$4, email=$5, contact_num=$6
             WHERE user_id=$7 RETURNING *`,
            [first_name, middle_name, last_name, ext_name, email, contact_num, id]
        );
        if (result.rows.length === 0)
            return res.status(404).json({ error: "Profile not found" });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;