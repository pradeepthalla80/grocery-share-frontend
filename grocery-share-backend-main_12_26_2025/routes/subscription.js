const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const subscriptionController = require('../controllers/subscriptionController');

router.get('/plans', subscriptionController.getPlans);
router.get('/current', protect, subscriptionController.getCurrentSubscription);
router.post('/checkout', protect, subscriptionController.createCheckoutSession);
router.post('/cancel', protect, subscriptionController.cancelSubscription);
router.get('/verify', protect, subscriptionController.verifySession);

module.exports = router;
