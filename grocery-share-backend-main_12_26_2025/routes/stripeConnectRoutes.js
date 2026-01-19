const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const stripeConnectController = require('../controllers/stripeConnectController');

// Mobile callback routes (no auth required - these are redirect URLs from Stripe)
router.get('/mobile-refresh', stripeConnectController.mobileRefresh);
router.get('/mobile-complete', stripeConnectController.mobileComplete);

// All routes below require authentication
router.use(auth);

// Create a new Stripe Express connected account
router.post('/create-account', stripeConnectController.createConnectedAccount);

// Create an account link for onboarding (web)
router.post('/create-account-link', stripeConnectController.createAccountLink);

// Mobile-specific onboarding (creates account if needed + returns URL with backend callbacks)
router.post('/mobile-onboarding', stripeConnectController.mobileOnboarding);

// Get connected account status
router.get('/account-status', stripeConnectController.getAccountStatus);

// Create a login link to Stripe Express dashboard
router.post('/dashboard-link', stripeConnectController.createDashboardLink);

// Get seller's balance/earnings
router.get('/balance', stripeConnectController.getSellerBalance);

module.exports = router;
