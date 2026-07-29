// ============================================================
// AUTH MIDDLEWARE - Verify JWT Token
// ============================================================

const jwt = require('jsonwebtoken');

// Secret key - must match the one used in auth.js
const JWT_SECRET = process.env.JWT_SECRET || 'my_super_secret_key_12345';

const verifyToken = (req, res, next) => {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    console.log('🔑 Auth Header:', authHeader);
    
    if (!authHeader) {
        console.log('❌ No Authorization header');
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    console.log('🔑 Token received:', token ? token.substring(0, 30) + '...' : 'null');

    if (!token) {
        console.log('❌ No token in Authorization header');
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        // Verify token with the same secret used in auth.js
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('✅ Token verified, userId:', decoded.userId);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        console.log('❌ Token verification failed:', error.message);
        return res.status(401).json({ error: 'Invalid token' });
    }
};

module.exports = { verifyToken };