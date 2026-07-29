// ============================================================
// COMMENTS ROUTES
// ============================================================

const express = require('express');
const pool = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { createNotification } = require('./notifications');
const router = express.Router();

// ============================================================
// GET COMMENTS FOR A POST
// ============================================================
router.get('/:postId', async (req, res) => {
    try {
        const { postId } = req.params;

        const result = await pool.query(
            `SELECT c.*, u.name, u.username, u.profile_picture
             FROM comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.post_id = $1
             ORDER BY c.created_at ASC`,
            [postId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error('❌ Get comments error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================================
// ADD COMMENT
// ============================================================
router.post('/:postId', verifyToken, async (req, res) => {
    try {
        const { postId } = req.params;
        const { content } = req.body;
        const userId = req.userId;

        if (!content || content.length > 500) {
            return res.status(400).json({ error: 'Comment must be 1-500 characters' });
        }

        const postResult = await pool.query(
            'SELECT user_id FROM posts WHERE id = $1',
            [postId]
        );
        const postOwnerId = postResult.rows[0]?.user_id;

        const result = await pool.query(
            `INSERT INTO comments (post_id, user_id, content) 
             VALUES ($1, $2, $3) 
             RETURNING id, post_id, user_id, content, created_at`,
            [postId, userId, content]
        );

        await pool.query(
            'UPDATE posts SET comments_count = comments_count + 1 WHERE id = $1',
            [postId]
        );

        if (postOwnerId && postOwnerId !== userId) {
            await createNotification(postOwnerId, userId, 'comment', postId);
        }

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error('❌ Add comment error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================================
// DELETE COMMENT
// ============================================================
router.delete('/:commentId', verifyToken, async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.userId;

        const comment = await pool.query(
            'SELECT * FROM comments WHERE id = $1',
            [commentId]
        );

        if (comment.rows.length === 0) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (comment.rows[0].user_id !== userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await pool.query('DELETE FROM comments WHERE id = $1', [commentId]);
        res.json({ message: 'Comment deleted' });

    } catch (error) {
        console.error('❌ Delete comment error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;