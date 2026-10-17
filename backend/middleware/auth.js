const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const token = req.cookies?.token;
    
    if (!token) return res.status(401).json({
        error: 'Access token required',
        code: 'NO_TOKEN'
    });

    jwt.verify(token, process.env.JWT_KEY, (err, user) => {
        if (err) {
            const isExpired = err.name === 'TokenExpiredError';
            return res.status(403).json({ 
                error: isExpired ? 'Token expired' : 'Invalid token',
                code: isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN'
            });
        }
        req.user = user;
        next();
    });
};

module.exports = { authenticateToken };