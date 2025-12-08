const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// Helper to set HttpOnly cookie
const setAuthCookie = (res, token) => {
  res.cookie('grocery_share_token', token, {
    httpOnly: true,      // Cannot be accessed by JavaScript (XSS protection)
    secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',  // Cross-domain in production
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
    path: '/'
  });
};

// Register new user
const register = async (req, res) => {
  try {
    const { name, email, password, acceptedTerms } = req.body;
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide name, email and password' });
    }
    
    if (!acceptedTerms) {
      return res.status(400).json({ error: 'You must accept the terms and conditions' });
    }
    
    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      return res.status(400).json({ 
        error: 'Password must contain uppercase, lowercase, number, and special character' 
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Create user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      acceptedTerms: true,
      acceptedTermsAt: new Date()
    });
    
    await user.save();
    
    // Generate token
    const token = generateToken(user._id);
    
    // Set HttpOnly cookie
    setAuthCookie(res, token);
    
    res.status(201).json({
      success: true,
      token,  // Also return in response for backwards compatibility
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isStoreOwner: user.isStoreOwner,
        storeMode: user.storeMode,
        storeName: user.storeName,
        storeAgreementAccepted: user.storeAgreementAccepted,
        storeActivatedAt: user.storeActivatedAt
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate token
    const token = generateToken(user._id);
    
    // Set HttpOnly cookie
    setAuthCookie(res, token);
    
    res.json({
      success: true,
      token,  // Also return in response for backwards compatibility
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        isStoreOwner: user.isStoreOwner,
        storeMode: user.storeMode,
        storeName: user.storeName,
        storeAgreementAccepted: user.storeAgreementAccepted,
        storeActivatedAt: user.storeActivatedAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

// Google OAuth - Initiate
const googleAuth = (req, res) => {
  const redirectUri = process.env.GOOGLE_CALLBACK_URL;
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=profile email&access_type=offline&prompt=consent`;
  
  res.redirect(authUrl);
};

// Google OAuth - Callback
const googleCallback = async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
    }
    
    // Exchange code for tokens
    const { tokens } = await client.getToken({
      code,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL
    });
    
    // Verify ID token
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;
    
    // Find or create user
    let user = await User.findOne({ googleId });
    
    if (!user) {
      user = await User.findOne({ email: email.toLowerCase() });
      
      if (user) {
        // Link Google account to existing email account
        user.googleId = googleId;
        await user.save();
      } else {
        // Create new user
        user = new User({
          name,
          email: email.toLowerCase(),
          googleId,
          acceptedTerms: true,
          acceptedTermsAt: new Date()
        });
        await user.save();
      }
    }
    
    // Generate token
    const token = generateToken(user._id);
    
    // Set HttpOnly cookie
    setAuthCookie(res, token);
    
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
        bio: user.bio,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt,
        googleId: user.googleId,
        // ========== ADDED STORE MODE FIELDS - START ==========
        isStoreOwner: user.isStoreOwner,
        storeMode: user.storeMode,
        storeName: user.storeName,
        storeAgreementAccepted: user.storeAgreementAccepted,
        storeActivatedAt: user.storeActivatedAt
        // ========== ADDED STORE MODE FIELDS - END ==========
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { name, bio, location, profilePicture } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (location) user.location = location;
    if (profilePicture) user.profilePicture = profilePicture;
    
    await user.save();
    
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        location: user.location,
        profilePicture: user.profilePicture,
        isStoreOwner: user.isStoreOwner,
        storeMode: user.storeMode,
        storeName: user.storeName,
        storeAgreementAccepted: user.storeAgreementAccepted,
        storeActivatedAt: user.storeActivatedAt
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Please provide current and new password' });
    }
    
    const user = await User.findById(req.user._id);
    
    if (!user.password) {
      return res.status(400).json({ error: 'Cannot change password for Google OAuth accounts' });
    }
    
    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Validate new password
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }
    
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      return res.status(400).json({ 
        error: 'Password must contain uppercase, lowercase, number, and special character' 
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

module.exports = {
  register,
  login,
  googleAuth,
  googleCallback,
  getCurrentUser,
  updateProfile,
  changePassword
};
