const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createPaymentIntent,
  confirmPayment,
  requestRefund,
  getPublishableKey
} = require('../controllers/paymentController');

router.post('/create-payment-intent', auth, createPaymentIntent);
router.post('/confirm-payment', auth, confirmPayment);
router.post('/request-refund', auth, requestRefund);
router.get('/config', getPublishableKey);

module.exports = router;
