// ============================================
// USERS ROUTES - Profile, Follow
// ============================================

const { verifyToken } = require('../middleware/auth');
const express = require('express');
const pool = require('../config/database');
const { createNotification } = require('./notifications');
const router = express.Router();


// ============================================
// GET USER PROFILE BY USERNAME
// ============================================
router.get('/:username', verifyToken, async (req, res) => {
    try {
        const { username } = req.params;
        const currentUserId = req.userId;

        // Get user info
        const userResult = await pool.query(
            `SELECT id, name, username, email, bio, profile_picture, 
             created_at, role
             FROM users 
             WHERE username = $1`,
            [username]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userResult.rows[0];

        // Get user stats
        const statsResult = await pool.query(
            `SELECT 
                (SELECT COUNT(*) FROM posts WHERE user_id = $1) AS post_count,
                (SELECT COUNT(*) FROM follows WHERE following_id = $1) AS follower_count,
                (SELECT COUNT(*) FROM follows WHERE follower_id = $1) AS following_count,
                (SELECT COUNT(*) FROM follows WHERE follower_id = $2 AND following_id = $1) AS is_following
            `,
            [user.id, currentUserId]
        );

        const stats = statsResult.rows[0];

        // Get user's posts
        const postsResult = await pool.query(
            `SELECT p.*, 
             EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $1) AS is_liked
             FROM posts p
             WHERE p.user_id = $2
             ORDER BY p.created_at DESC`,
            [currentUserId, user.id]
        );

        res.json({
            user: {
                ...user,
                post_count: parseInt(stats.post_count),
                follower_count: parseInt(stats.follower_count),
                following_count: parseInt(stats.following_count),
                is_following: stats.is_following || false
            },
            posts: postsResult.rows
        });

    } catch (error) {
        console.error('❌ Get profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================
// UPDATE PROFILE
// ============================================
router.put('/update', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { name, bio } = req.body;

        const result = await pool.query(
            `UPDATE users 
             SET name = COALESCE($1, name), 
                 bio = COALESCE($2, bio)
             WHERE id = $3
             RETURNING id, name, username, email, bio, profile_picture`,
            [name, bio, userId]
        );

        res.json(result.rows[0]);

    } catch (error) {
        console.error('❌ Update profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================
// FOLLOW / UNFOLLOW USER
// ============================================
router.post('/:username/follow', verifyToken, async (req, res) => {
    try {
        const { username } = req.params;
        const followerId = req.userId;

        // Get target user
        const userResult = await pool.query(
            'SELECT id FROM users WHERE username = $1',
            [username]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const followingId = userResult.rows[0].id;

        // Prevent following self
        if (followerId === followingId) {
            return res.status(400).json({ error: 'Cannot follow yourself' });
        }

        // Check if already following
        const followCheck = await pool.query(
            'SELECT * FROM follows WHERE follower_id = $1 AND following_id = $2',
            [followerId, followingId]
        );

        if (followCheck.rows.length > 0) {
            // UNFOLLOW
            await pool.query(
                'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
                [followerId, followingId]
            );
            res.json({ following: false });
        } else {
            // FOLLOW
            await pool.query(
                'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)',
                [followerId, followingId]
            );
            
            // Send notification
            await createNotification(followingId, followerId, 'follow');
            
            res.json({ following: true });
        }

    } catch (error) {
        console.error('❌ Follow error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================
// GET FOLLOWERS LIST
// ============================================
router.get('/:username/followers', verifyToken, async (req, res) => {
    try {
        const { username } = req.params;
        const currentUserId = req.userId;

        const userResult = await pool.query(
            'SELECT id FROM users WHERE username = $1',
            [username]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userId = userResult.rows[0].id;

        const result = await pool.query(
            `SELECT u.id, u.name, u.username, u.bio, u.profile_picture,
             EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = u.id) AS is_following
             FROM follows f
             JOIN users u ON f.follower_id = u.id
             WHERE f.following_id = $2
             ORDER BY f.created_at DESC`,
            [currentUserId, userId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error('❌ Get followers error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================
// GET FOLLOWING LIST
// ============================================
router.get('/:username/following', verifyToken, async (req, res) => {
    try {
        const { username } = req.params;
        const currentUserId = req.userId;

        const userResult = await pool.query(
            'SELECT id FROM users WHERE username = $1',
            [username]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userId = userResult.rows[0].id;

        const result = await pool.query(
            `SELECT u.id, u.name, u.username, u.bio, u.profile_picture,
             EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = u.id) AS is_following
             FROM follows f
             JOIN users u ON f.following_id = u.id
             WHERE f.follower_id = $2
             ORDER BY f.created_at DESC`,
            [currentUserId, userId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error('❌ Get following error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;