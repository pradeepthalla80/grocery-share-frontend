const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const stripeConnectController = require('../controllers/stripeConnectController');

// All routes require authentication
router.use(authenticateToken);

// Create a new Stripe Express connected account
router.post('/create-account', stripeConnectController.createConnectedAccount);

// Create an account link for onboarding
router.post('/create-account-link', stripeConnectController.createAccountLink);

// Get connected account status
router.get('/account-status', stripeConnectController.getAccountStatus);

// Create a login link to Stripe Express dashboard
router.post('/dashboard-link', stripeConnectController.createDashboardLink);

// Get seller's balance/earnings
router.get('/balance', stripeConnectController.getSellerBalance);

module.exports = router;
