// ============================================
// MESSAGES ROUTES - Private Chat
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
// GET ALL CONVERSATIONS
// ============================================
router.get('/conversations', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;

        const result = await pool.query(
            `SELECT DISTINCT 
                u.id, u.name, u.username, u.profile_picture,
                (SELECT content FROM messages 
                 WHERE (sender_id = $1 AND receiver_id = u.id) 
                    OR (sender_id = u.id AND receiver_id = $1)
                 ORDER BY created_at DESC LIMIT 1) AS last_message,
                (SELECT created_at FROM messages 
                 WHERE (sender_id = $1 AND receiver_id = u.id) 
                    OR (sender_id = u.id AND receiver_id = $1)
                 ORDER BY created_at DESC LIMIT 1) AS last_message_time,
                (SELECT COUNT(*) FROM messages 
                 WHERE receiver_id = $1 AND sender_id = u.id AND is_read = false) AS unread_count
            FROM users u
            WHERE u.id IN (
                SELECT sender_id FROM messages WHERE receiver_id = $1
                UNION
                SELECT receiver_id FROM messages WHERE sender_id = $1
            )
            AND u.id != $1
            ORDER BY last_message_time DESC NULLS LAST`,
            [userId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error('❌ Get conversations error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================
// GET MESSAGES BETWEEN TWO USERS
// ============================================
router.get('/:userId', verifyToken, async (req, res) => {
    try {
        const currentUserId = req.userId;
        const { userId } = req.params;

        const result = await pool.query(
            `SELECT m.*, u.name, u.username, u.profile_picture,
             CASE WHEN m.sender_id = $1 THEN 'sent' ELSE 'received' END as direction
             FROM messages m
             JOIN users u ON m.sender_id = u.id
             WHERE (m.sender_id = $1 AND m.receiver_id = $2)
                OR (m.sender_id = $2 AND m.receiver_id = $1)
             ORDER BY m.created_at ASC`,
            [currentUserId, userId]
        );

        // Mark messages as read
        await pool.query(
            `UPDATE messages 
             SET is_read = true 
             WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false`,
            [userId, currentUserId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error('❌ Get messages error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================
// SEND A MESSAGE
// ============================================
router.post('/:userId', verifyToken, async (req, res) => {
    try {
        const senderId = req.userId;
        const { userId } = req.params;
        const { content } = req.body;

        // Validate message
        if (!content || content.length > 1000) {
            return res.status(400).json({ error: 'Message must be 1-1000 characters' });
        }

        // Prevent messaging self
        if (senderId === userId) {
            return res.status(400).json({ error: 'Cannot message yourself' });
        }

        // Insert message
        const result = await pool.query(
            `INSERT INTO messages (sender_id, receiver_id, content) 
             VALUES ($1, $2, $3) 
             RETURNING id, sender_id, receiver_id, content, created_at, is_read`,
            [senderId, userId, content]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error('❌ Send message error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================
// GET UNREAD MESSAGE COUNT
// ============================================
router.get('/unread/count', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;

        const result = await pool.query(
            'SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND is_read = false',
            [userId]
        );

        res.json({ count: parseInt(result.rows[0].count) });

    } catch (error) {
        console.error('❌ Unread count error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;