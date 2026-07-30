// ============================================================
// MAIN SERVER FILE - With CORS Configuration
// ============================================================

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// CORS CONFIGURATION - Allow all origins
// ============================================================
app.use(cors({
    origin: '*',  // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(express.json());

// ============================================================
// ROUTES
// ============================================================
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const userRoutes = require('./routes/users');
const { router: notificationRoutes } = require('./routes/notifications');
const messageRoutes = require('./routes/messages');
const searchRoutes = require('./routes/search');

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/search', searchRoutes);

// ============================================================
// TEST ROUTE
// ============================================================
app.get('/', (req, res) => {
    res.json({ message: 'Social Media API is running!' });
});

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});