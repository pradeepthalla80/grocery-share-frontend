const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { register, login, changePassword } = require('../controllers/authController');
const auth = require('../middleware/auth');
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper functions for OAuth state signing
function signState(data) {
  const secret = process.env.JWT_SECRET || 'default-secret';
  const payload = JSON.stringify(data);
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return Buffer.from(JSON.stringify({ payload, signature })).toString('base64');
}

function verifyState(state) {
  try {
    const secret = process.env.JWT_SECRET || 'default-secret';
    const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
    const { payload, signature } = decoded;
    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    
    if (signature !== expectedSignature) {
      return null;
    }
    
    const data = JSON.parse(payload);
    // Check timestamp freshness (10 minutes max)
    if (Date.now() - data.ts > 10 * 60 * 1000) {
      return null;
    }
    
    return data;
  } catch (e) {
    return null;
  }
}

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: Bad request - User already exists or invalid data
 */
router.post('/register', register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *       401:
 *         description: Not authenticated
 */
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        googleId: user.googleId,
        isStoreOwner: user.isStoreOwner,
        storeMode: user.storeMode,
        storeName: user.storeName,
        storeAgreementAccepted: user.storeAgreementAccepted,
        storeActivatedAt: user.storeActivatedAt,
        stripeAccountId: user.stripeAccountId,
        stripeAccountStatus: user.stripeAccountStatus
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * @swagger
 * /auth/change-password:
 *   put:
 *     summary: Change user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Current password is incorrect or unauthorized
 */
router.put('/change-password', auth, changePassword);

router.get('/google', (req, res, next) => {
  const platform = req.query.platform === 'mobile' ? 'mobile' : 'web';
  const state = signState({ platform, ts: Date.now() });
  
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    state: state
  })(req, res, next);
});

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    // Verify state parameter is present and valid (CSRF protection)
    if (!req.query.state) {
      console.error('OAuth callback missing state parameter');
      return res.status(400).send('Invalid OAuth state: missing state parameter');
    }
    
    const stateData = verifyState(req.query.state);
    if (!stateData) {
      console.error('OAuth callback with invalid or expired state');
      return res.status(400).send('Invalid OAuth state: signature verification failed or state expired');
    }
    
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    const token = jwt.sign(
      { 
        userId: req.user._id, 
        email: req.user.email,
        role: req.user.role || 'user'
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    if (stateData.platform === 'mobile') {
      // Redirect to mobile app deep link
      const mobileCallbackUrl = `groceryshare://auth/callback?token=${token}&userId=${req.user._id}&name=${encodeURIComponent(req.user.name)}&email=${encodeURIComponent(req.user.email)}`;
      return res.redirect(mobileCallbackUrl);
    }

    // Web flow: Set HttpOnly cookie and redirect to frontend
    res.cookie('grocery_share_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
      path: '/'
    });

    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5000';
    res.redirect(`${frontendURL}/auth/callback?token=${token}&userId=${req.user._id}&name=${encodeURIComponent(req.user.name)}&email=${encodeURIComponent(req.user.email)}`);
  }
);

// Logout endpoint to clear HttpOnly cookie
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
