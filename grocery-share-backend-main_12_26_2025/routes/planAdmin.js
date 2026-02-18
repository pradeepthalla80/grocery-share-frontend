const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const planAdminController = require('../controllers/planAdminController');

router.get('/settings', protect, requireAdmin, planAdminController.getSettings);
router.put('/test-mode', protect, requireAdmin, planAdminController.toggleTestMode);
router.put('/plans/:planId', protect, requireAdmin, planAdminController.updatePlan);
router.post('/plans', protect, requireAdmin, planAdminController.createPlan);
router.delete('/plans/:planId', protect, requireAdmin, planAdminController.deletePlan);
router.get('/test-mode/status', protect, planAdminController.getTestModeStatus);

module.exports = router;
