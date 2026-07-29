// ============================================================
// POSTS ROUTES - Create, Read, Like, Delete, Edit
// ============================================================

const express = require('express');
const pool = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { createNotification } = require('./notifications');
const router = express.Router();

// ============================================================
// CREATE POST
// ============================================================
router.post('/', verifyToken, async (req, res) => {
    try {
        const { content, image } = req.body;
        const userId = req.userId;

        if (!content && !image) {
            return res.status(400).json({ error: 'Content or image required' });
        }

        if (content && content.length > 1000) {
            return res.status(400).json({ error: 'Content must be 1-1000 characters' });
        }

        const result = await pool.query(
            `INSERT INTO posts (user_id, content, image) 
             VALUES ($1, $2, $3) 
             RETURNING id, user_id, content, image, created_at`,
            [userId, content || '', image || null]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error('❌ Create post error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================================
// GET ALL POSTS (FEED)
// ============================================================
router.get('/', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;

        const result = await pool.query(
            `SELECT p.*, u.name, u.username, u.profile_picture,
             EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $1) AS is_liked
             FROM posts p
             JOIN users u ON p.user_id = u.id
             ORDER BY p.created_at DESC`,
            [userId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error('❌ Get posts error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================================
// LIKE / UNLIKE POST
// ============================================================
router.post('/:postId/like', verifyToken, async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.userId;

        const postResult = await pool.query(
            'SELECT user_id FROM posts WHERE id = $1',
            [postId]
        );
        const postOwnerId = postResult.rows[0]?.user_id;

        const check = await pool.query(
            'SELECT * FROM likes WHERE post_id = $1 AND user_id = $2',
            [postId, userId]
        );

        if (check.rows.length > 0) {
            await pool.query(
                'DELETE FROM likes WHERE post_id = $1 AND user_id = $2',
                [postId, userId]
            );
            await pool.query(
                'UPDATE posts SET likes_count = likes_count - 1 WHERE id = $1',
                [postId]
            );
            res.json({ liked: false });
        } else {
            await pool.query(
                'INSERT INTO likes (post_id, user_id) VALUES ($1, $2)',
                [postId, userId]
            );
            await pool.query(
                'UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1',
                [postId]
            );
            
            if (postOwnerId && postOwnerId !== userId) {
                await createNotification(postOwnerId, userId, 'like', postId);
            }
            
            res.json({ liked: true });
        }

    } catch (error) {
        console.error('❌ Like error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================================
// DELETE POST
// ============================================================
router.delete('/:postId', verifyToken, async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.userId;

        const postResult = await pool.query(
            'SELECT * FROM posts WHERE id = $1',
            [postId]
        );

        if (postResult.rows.length === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }

        if (postResult.rows[0].user_id !== userId) {
            return res.status(403).json({ error: 'Not authorized to delete this post' });
        }

        await pool.query('DELETE FROM posts WHERE id = $1', [postId]);

        res.json({ message: 'Post deleted successfully' });

    } catch (error) {
        console.error('❌ Delete post error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================================
// EDIT POST
// ============================================================
router.put('/:postId', verifyToken, async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.userId;
        const { content } = req.body;

        if (!content || content.length > 1000) {
            return res.status(400).json({ error: 'Content must be 1-1000 characters' });
        }

        const postResult = await pool.query(
            'SELECT * FROM posts WHERE id = $1',
            [postId]
        );

        if (postResult.rows.length === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }

        if (postResult.rows[0].user_id !== userId) {
            return res.status(403).json({ error: 'Not authorized to edit this post' });
        }

        const result = await pool.query(
            'UPDATE posts SET content = $1, edited_at = NOW() WHERE id = $2 RETURNING *',
            [content, postId]
        );

        res.json(result.rows[0]);

    } catch (error) {
        console.error('❌ Edit post error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;