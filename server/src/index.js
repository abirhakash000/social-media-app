// ============================================
// MAIN SERVER FILE
// ============================================

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE
// ============================================

// Enable CORS for frontend access
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));

// Parse JSON requests
app.use(express.json());

// ============================================
// ROUTES
// ============================================

// Authentication routes (Login/Register)
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Post routes (Create/Read/Like/Delete/Edit)
const postRoutes = require('./routes/posts');
app.use('/api/posts', postRoutes);

// Comment routes
const commentRoutes = require('./routes/comments');
app.use('/api/comments', commentRoutes);

// User routes (Profile/Follow)
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

// Notification routes
const { router: notificationRoutes } = require('./routes/notifications');
app.use('/api/notifications', notificationRoutes);

// Message routes (Private Chat)
const messageRoutes = require('./routes/messages');
app.use('/api/messages', messageRoutes);

// Search routes
const searchRoutes = require('./routes/search');
app.use('/api/search', searchRoutes);

// Image Upload routes (optional)
//const uploadRoutes = require('./routes/upload');
//app.use('/api/upload', uploadRoutes);

// ============================================
// TEST ROUTE
// ============================================

// Check if server is running
app.get('/', (req, res) => {
    res.json({ message: 'Social Media API is running!' });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});