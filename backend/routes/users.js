const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { authenticateToken } = require('../middleware/auth');

const findUserByIdentifier = async (pool, identifier) => {
    const result = await pool.query(
        `SELECT u.* FROM users u
        LEFT JOIN landlords l ON u.id = l.user_id
        LEFT JOIN tenants  t ON u.id = t.user_id
        WHERE u.username = $1 OR l.email = $1 OR t.email = $1
        LIMIT 1`,
        [identifier]
    );
    return result.rows[0] || null;
};

router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await req.pool.query(
            'SELECT id, username, role, created_at FROM users WHERE id = $1', [id]
        );
        if (result.rows.length === 0)
            return res.status(404).json({ error: "User not found" });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/reset/verify', async (req, res) => {
    const { identifier, pin } = req.body;

    if (!identifier || !pin)
        return res.status(400).json({ error: "Username/email and PIN are required" });

    try {
        const user = await findUserByIdentifier(req.pool, identifier);
        if (!user) return res.status(404).json({ error: "No account found with that username or email" });
        if (pin !== user.pin) return res.status(401).json({ error: "Incorrect PIN" });

        res.json({ verified: true, userId: user.id });
    } catch (err) {
        console.error("Reset verify error:", err.message);
        res.status(500).json({ error: "Server error" });
    }
});

router.post('/:id/verify', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { currentPassword, pin } = req.body;
    try {
        const result = await req.pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: "User not found" });

        const user = result.rows[0];
        const isPasswordMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isPasswordMatch) return res.status(401).json({ error: "Incorrect password" });
        if (pin !== user.pin) return res.status(401).json({ error: "Incorrect PIN" });

        res.json({ verified: true });
    } catch (err) {
        console.error("Verification error:", err.message);
        res.status(500).json({ error: "Server error" });
    }
});

router.patch('/:id/credentials', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { currentPassword, pin, newUsername, newPassword } = req.body;
    try {
        const userResult = await req.pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (userResult.rows.length === 0)
            return res.status(404).json({ error: "User not found" });

        const user = userResult.rows[0];
        const isPasswordMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isPasswordMatch) return res.status(401).json({ error: "Incorrect current password" });
        if (pin !== user.pin) return res.status(401).json({ error: "Incorrect PIN" });

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (newUsername) {
            const usernameCheck = await req.pool.query(
                'SELECT id FROM users WHERE username = $1 AND id != $2', [newUsername, id]
            );
            if (usernameCheck.rows.length > 0)
                return res.status(409).json({ error: "Username already taken" });
            updates.push(`username = $${paramCount++}`);
            values.push(newUsername);
        }

        if (newPassword) {
            const newHash = await bcrypt.hash(newPassword, 10);
            updates.push(`password_hash = $${paramCount++}`);
            values.push(newHash);
        }

        if (updates.length === 0)
            return res.status(400).json({ error: "No changes provided" });

        values.push(id);
        await req.pool.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}`, values
        );

        res.json({ message: "Credentials updated successfully" });
    } catch (err) {
        console.error("Credential update error:", err.message);
        res.status(500).json({ error: "Server error" });
    }
});

router.patch('/reset/credentials', async (req, res) => {
    const { identifier, pin, newUsername, newPassword } = req.body;

    if (!identifier || !pin)
        return res.status(400).json({ error: "Username/email and PIN are required" });

    try {
        const user = await findUserByIdentifier(req.pool, identifier);
        if (!user)
            return res.status(404).json({ error: "No account found with that username or email" });

        if (pin !== user.pin)
            return res.status(401).json({ error: "Incorrect PIN" });

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (newUsername) {
            const usernameCheck = await req.pool.query(
                'SELECT id FROM users WHERE username = $1 AND id != $2', [newUsername, user.id]
            );
            if (usernameCheck.rows.length > 0)
                return res.status(409).json({ error: "Username already taken" });
            updates.push(`username = $${paramCount++}`);
            values.push(newUsername);
        }

        if (newPassword) {
            const newHash = await bcrypt.hash(newPassword, 10);
            updates.push(`password_hash = $${paramCount++}`);
            values.push(newHash);
        }

        if (updates.length === 0) return res.status(400).json({ error: "No changes provided" });

        values.push(user.id);
        await req.pool.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}`, values
        );

        res.json({ message: "Credentials updated successfully" });
    } catch (err) {
        console.error("Reset credentials error:", err.message);
        res.status(500).json({ error: "Server error" });
    }
});

router.patch('/:id/credentials', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { currentPassword, pin, newUsername, newPassword } = req.body;
    try {
        const userResult = await req.pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (userResult.rows.length === 0)
            return res.status(404).json({ error: "User not found" });

        const user = userResult.rows[0];
        const isPasswordMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isPasswordMatch)
            return res.status(401).json({ error: "Incorrect current password" });
        if (pin !== user.pin)
            return res.status(401).json({ error: "Incorrect PIN" });

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (newUsername) {
            const usernameCheck = await req.pool.query(
                'SELECT id FROM users WHERE username = $1 AND id != $2', [newUsername, id]
            );
            if (usernameCheck.rows.length > 0)
                return res.status(409).json({ error: "Username already taken" });
            updates.push(`username = $${paramCount++}`);
            values.push(newUsername);
        }

        if (newPassword) {
            const newHash = await bcrypt.hash(newPassword, 10);
            updates.push(`password_hash = $${paramCount++}`);
            values.push(newHash);
        }

        if (updates.length === 0)
            return res.status(400).json({ error: "No changes provided" });

        values.push(id);
        await req.pool.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}`, values
        );

        res.json({ message: "Credentials updated successfully" });
    } catch (err) {
        console.error("Credential update error:", err.message);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;