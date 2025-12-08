const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use MONGO_URI from environment, fallback to MONGODB_URI, then local test MongoDB
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/groceryshare';
    
    await mongoose.connect(mongoURI);
    
    console.log('✅ MongoDB connected successfully');
    console.log(`📦 Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    // Don't exit process, just log the error
    console.log('⚠️  Continuing without database connection...');
  }
};

module.exports = connectDB;
