const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const miniStoreController = require('../controllers/miniStoreController');

router.get('/availability', protect, miniStoreController.checkAvailability);
router.post('/waitlist', protect, miniStoreController.joinWaitlist);
router.post('/request', protect, miniStoreController.submitStoreRequest);

router.get('/admin/settings', protect, miniStoreController.getSettings);
router.put('/admin/settings', protect, miniStoreController.updateSettings);
router.put('/admin/zip-settings', protect, miniStoreController.updateZipSettings);
router.delete('/admin/zip-settings/:zipCode', protect, miniStoreController.deleteZipSettings);
router.get('/admin/requests', protect, miniStoreController.getRequests);
router.put('/admin/requests/:id', protect, miniStoreController.reviewRequest);

module.exports = router;
