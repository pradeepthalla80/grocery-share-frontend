const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  register,
  login,
  googleAuth,
  googleCallback,
  getCurrentUser,
  updateProfile,
  changePassword
} = require('../controllers/authController');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

// Protected routes
router.get('/me', auth, getCurrentUser);
router.put('/profile', auth, updateProfile);
router.put('/change-password', auth, changePassword);

// NEW: Logout endpoint to clear HttpOnly cookie
router.post('/logout', auth, async (req, res) => {
  try {
    // Clear the HttpOnly cookie
    res.cookie('grocery_share_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 0,  // Expire immediately
      path: '/'
    });
    
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

module.exports = router;
