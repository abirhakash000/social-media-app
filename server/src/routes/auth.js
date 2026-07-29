// ============================================================
// AUTHENTICATION ROUTES - Login and Register
// ============================================================

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const router = express.Router();

// ============================================================
// TEST ROUTE - Check if auth is working
// ============================================================
router.get('/test', (req, res) => {
    res.json({ message: 'Auth route is working!' });
});

// ============================================================
// REGISTER - Create new user account
// ============================================================
router.post('/register', async (req, res) => {
    try {
        const { name, username, email, password } = req.body;
        console.log('📝 Register attempt:', { name, username, email });

        // Check if user already exists
        const existingUser = await pool.query(
            'SELECT * FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        const result = await pool.query(
            `INSERT INTO users (name, username, email, password) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, name, username, email, bio, profile_picture, role, created_at`,
            [name, username, email, hashedPassword]
        );

        const user = result.rows[0];

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET || 'my_super_secret_key_12345',
            { expiresIn: '7d' }
        );

        console.log('✅ User registered:', user.email);
        console.log('🔑 Token generated for:', user.email);

        res.status(201).json({ user, token });

    } catch (error) {
        console.error('❌ Register error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================================
// LOGIN - Authenticate user
// ============================================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('🔐 Login attempt:', { email });

        // Find user by email
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            console.log('❌ User not found:', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            console.log('❌ Invalid password for:', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET || 'my_super_secret_key_12345',
            { expiresIn: '7d' }
        );

        // Remove password from response
        delete user.password;

        console.log('✅ User logged in:', user.email);
        console.log('🔑 Token generated for:', user.email);
        console.log('🔑 Token:', token.substring(0, 30) + '...');

        res.json({ user, token });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================================
// PASSWORD RESET - Request reset link
// ============================================================

// Store reset tokens temporarily (in production, use Redis or database)
const resetTokens = new Map();

// Request password reset
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        console.log('📧 Password reset request for:', email);

        // Check if user exists
        const result = await pool.query(
            'SELECT id, email FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            // Don't reveal if email exists or not (security)
            return res.json({ 
                message: 'If an account exists with this email, you will receive a reset link.' 
            });
        }

        const user = result.rows[0];

        // Generate reset token (JWT)
        const resetToken = jwt.sign(
            { userId: user.id, purpose: 'password-reset' },
            process.env.JWT_SECRET || 'my_super_secret_key_12345',
            { expiresIn: '1h' } // Token expires in 1 hour
        );

        // Store token with timestamp
        resetTokens.set(user.id, {
            token: resetToken,
            createdAt: Date.now()
        });

        // In production, send email with reset link
        // For now, log the reset link
        const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
        console.log('🔗 Reset link:', resetLink);

        res.json({ 
            message: 'If an account exists with this email, you will receive a reset link.',
            resetLink // Remove this in production
        });

    } catch (error) {
        console.error('❌ Forgot password error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Verify reset token
router.post('/verify-reset-token', async (req, res) => {
    try {
        const { token } = req.body;
        console.log('🔍 Verifying reset token');

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'my_super_secret_key_12345');
        
        if (decoded.purpose !== 'password-reset') {
            return res.status(400).json({ error: 'Invalid token' });
        }

        // Check if token exists in storage
        const storedToken = resetTokens.get(decoded.userId);
        if (!storedToken || storedToken.token !== token) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        res.json({ valid: true, userId: decoded.userId });

    } catch (error) {
        console.error('❌ Verify token error:', error);
        res.status(400).json({ error: 'Invalid or expired token' });
    }
});

// Reset password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        console.log('🔐 Resetting password');

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'my_super_secret_key_12345');
        
        if (decoded.purpose !== 'password-reset') {
            return res.status(400).json({ error: 'Invalid token' });
        }

        // Check if token exists in storage
        const storedToken = resetTokens.get(decoded.userId);
        if (!storedToken || storedToken.token !== token) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await pool.query(
            'UPDATE users SET password = $1 WHERE id = $2',
            [hashedPassword, decoded.userId]
        );

        // Remove used token
        resetTokens.delete(decoded.userId);

        console.log('✅ Password reset successful for user:', decoded.userId);
        res.json({ message: 'Password reset successfully' });

    } catch (error) {
        console.error('❌ Reset password error:', error);
        res.status(400).json({ error: 'Invalid or expired token' });
    }
});

module.exports = router;