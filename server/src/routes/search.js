// ============================================
// SEARCH ROUTES - Search Users & Posts
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
// SEARCH USERS
// ============================================
router.get('/users', verifyToken, async (req, res) => {
    try {
        const { q } = req.query;
        const userId = req.userId;

        if (!q || q.length < 2) {
            return res.json([]);
        }

        const result = await pool.query(
            `SELECT id, name, username, bio, profile_picture,
             EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = users.id) AS is_following
             FROM users 
             WHERE (name ILIKE $2 OR username ILIKE $2)
             AND id != $1
             ORDER BY 
                 CASE 
                     WHEN username ILIKE $3 THEN 1
                     WHEN name ILIKE $3 THEN 2
                     ELSE 3
                 END,
                 name ASC
             LIMIT 20`,
            [userId, `%${q}%`, `${q}%`]
        );

        res.json(result.rows);

    } catch (error) {
        console.error('❌ Search users error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================
// SEARCH POSTS
// ============================================
router.get('/posts', verifyToken, async (req, res) => {
    try {
        const { q } = req.query;
        const userId = req.userId;

        if (!q || q.length < 2) {
            return res.json([]);
        }

        const result = await pool.query(
            `SELECT p.*, u.name, u.username, u.profile_picture,
             EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $1) AS is_liked
             FROM posts p
             JOIN users u ON p.user_id = u.id
             WHERE p.content ILIKE $2
             ORDER BY p.created_at DESC
             LIMIT 20`,
            [userId, `%${q}%`]
        );

        res.json(result.rows);

    } catch (error) {
        console.error('❌ Search posts error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================
// COMBINED SEARCH (Users + Posts)
// ============================================
router.get('/all', verifyToken, async (req, res) => {
    try {
        const { q } = req.query;
        const userId = req.userId;

        if (!q || q.length < 2) {
            return res.json({ users: [], posts: [] });
        }

        // Search users
        const usersResult = await pool.query(
            `SELECT id, name, username, bio, profile_picture,
             'user' as type,
             EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = users.id) AS is_following
             FROM users 
             WHERE (name ILIKE $2 OR username ILIKE $2)
             AND id != $1
             ORDER BY 
                 CASE 
                     WHEN username ILIKE $3 THEN 1
                     WHEN name ILIKE $3 THEN 2
                     ELSE 3
                 END,
                 name ASC
             LIMIT 10`,
            [userId, `%${q}%`, `${q}%`]
        );

        // Search posts
        const postsResult = await pool.query(
            `SELECT p.*, u.name, u.username, u.profile_picture,
             'post' as type,
             EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $1) AS is_liked
             FROM posts p
             JOIN users u ON p.user_id = u.id
             WHERE p.content ILIKE $2
             ORDER BY p.created_at DESC
             LIMIT 10`,
            [userId, `%${q}%`]
        );

        res.json({
            users: usersResult.rows,
            posts: postsResult.rows
        });

    } catch (error) {
        console.error('❌ Combined search error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;