const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // NEW: Parse cookies

// CORS Configuration - CRITICAL: Enable credentials
app.use(cors({
  origin: [
    'https://grocery-share-frontend.vercel.app',
    'http://localhost:5000',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,  // NEW: Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// MongoDB Connection (FIXED: Removed deprecated options)
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log('✅ MongoDB connected successfully');
  console.log('📦 Database:', mongoose.connection.db.databaseName);
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Import Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const itemRoutes = require('./routes/items');
const chatRoutes = require('./routes/chat');
const notificationRoutes = require('./routes/notifications');
const paymentRoutes = require('./routes/payment');
const itemRequestRoutes = require('./routes/itemRequests');
const ratingRoutes = require('./routes/ratings');
const adminRoutes = require('./routes/admin');
const analyticsRoutes = require('./routes/analytics');
const contactRoutes = require('./routes/contact');
const addressRoutes = require('./routes/address');
// ========== ADDED FOR STORE MODE - START ==========
const storeRoutes = require('./routes/store');
// ========== ADDED FOR STORE MODE - END ==========

// Use Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/items', itemRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/item-requests', itemRequestRoutes);
app.use('/api/v1/ratings', ratingRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/address', addressRoutes);
// ========== ADDED FOR STORE MODE - START ==========
app.use('/api/v1/store', storeRoutes);
// ========== ADDED FOR STORE MODE - END ==========

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 CORS enabled for: https://grocery-share-frontend.vercel.app, http://localhost:5000, http://localhost:3000, http://localhost:5173`);
  console.log(`📡 Ready to receive requests!`);
});
