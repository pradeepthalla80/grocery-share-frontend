const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const miniStoreController = require('../controllers/miniStoreController');

router.get('/availability', protect, miniStoreController.checkAvailability);
router.post('/waitlist', protect, miniStoreController.joinWaitlist);
router.post('/request', protect, miniStoreController.submitStoreRequest);

router.get('/admin/settings', protect, requireAdmin, miniStoreController.getSettings);
router.put('/admin/settings', protect, requireAdmin, miniStoreController.updateSettings);
router.put('/admin/zip-settings', protect, requireAdmin, miniStoreController.updateZipSettings);
router.delete('/admin/zip-settings/:zipCode', protect, requireAdmin, miniStoreController.deleteZipSettings);
router.get('/admin/requests', protect, requireAdmin, miniStoreController.getRequests);
router.put('/admin/requests/:id', protect, requireAdmin, miniStoreController.reviewRequest);

module.exports = router;
