// ============================================
// NOTIFICATIONS ROUTES
// ============================================

const express = require('express');
const pool = require('../config/database');
const router = express.Router();

// ============================================
// MIDDLEWARE - Verify JWT Token
// ============================================
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'my_secret_key');
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// ============================================
// GET ALL NOTIFICATIONS FOR USER
// ============================================
router.get('/', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;

        const result = await pool.query(
            `SELECT n.*, u.name, u.username, u.profile_picture,
             CASE 
                 WHEN n.type = 'like' THEN (SELECT content FROM posts WHERE id = n.post_id)
                 WHEN n.type = 'comment' THEN (SELECT content FROM posts WHERE id = n.post_id)
                 ELSE NULL
             END as content_preview
             FROM notifications n
             JOIN users u ON n.from_user = u.id
             WHERE n.user_id = $1
             ORDER BY n.created_at DESC
             LIMIT 50`,
            [userId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error('❌ Get notifications error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================
// MARK NOTIFICATION AS READ
// ============================================
router.put('/:id/read', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        
        await pool.query(
            'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        res.json({ success: true });

    } catch (error) {
        console.error('❌ Mark read error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================
// MARK ALL NOTIFICATIONS AS READ
// ============================================
router.put('/read-all', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        
        await pool.query(
            'UPDATE notifications SET is_read = true WHERE user_id = $1',
            [userId]
        );

        res.json({ success: true });

    } catch (error) {
        console.error('❌ Mark all read error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================
// GET UNREAD NOTIFICATION COUNT
// ============================================
router.get('/unread-count', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;

        const result = await pool.query(
            'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
            [userId]
        );

        res.json({ count: parseInt(result.rows[0].count) });

    } catch (error) {
        console.error('❌ Unread count error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================
// CREATE NOTIFICATION (Helper Function)
// ============================================
const createNotification = async (userId, fromUserId, type, postId = null) => {
    try {
        // Don't notify yourself
        if (userId === fromUserId) return;
        
        await pool.query(
            `INSERT INTO notifications (user_id, from_user, type, post_id) 
             VALUES ($1, $2, $3, $4)`,
            [userId, fromUserId, type, postId]
        );

        console.log(`🔔 Notification created: ${type} from ${fromUserId} to ${userId}`);

    } catch (error) {
        console.error('❌ Create notification error:', error);
    }
};

module.exports = { router, createNotification };