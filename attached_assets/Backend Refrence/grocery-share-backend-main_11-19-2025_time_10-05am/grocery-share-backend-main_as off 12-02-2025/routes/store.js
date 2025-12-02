const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const storeController = require('../controllers/storeController');

// Get Store Owner Terms & Agreement
router.get('/terms', storeController.getStoreTerms);

// Activate Store Mode (requires authentication and terms acceptance)
router.post('/activate', auth, storeController.activateStoreMode);

// Toggle Store Mode on/off
router.put('/toggle', auth, storeController.toggleStoreMode);

// Get my store items
router.get('/my-store', auth, storeController.getMyStoreItems);

// Get store transactions
router.get('/transactions', auth, storeController.getStoreTransactions);

// Get my store agreement
router.get('/agreement', auth, storeController.getMyAgreement);

module.exports = router;
