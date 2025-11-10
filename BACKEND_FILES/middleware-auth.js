const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Try to get token from cookie first (NEW METHOD - works with tracking prevention)
    let token = req.cookies.grocery_share_token;
    
    // Fallback to Authorization header (for backwards compatibility)
    if (!token) {
      const authHeader = req.header('Authorization');
      if (authHeader) {
        token = authHeader.replace('Bearer ', '');
      }
    }
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please login.' });
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by ID from token
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found. Please login again.' });
    }
    
    // Attach user and token to request
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token. Please login again.' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }
    
    res.status(401).json({ error: 'Authentication failed. Please login.' });
  }
};

module.exports = auth;
