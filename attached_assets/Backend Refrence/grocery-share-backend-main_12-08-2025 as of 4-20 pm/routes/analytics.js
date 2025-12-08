const express = require('express');
const router = express.Router();
const { getImpactAnalytics } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

// GET /api/v1/analytics/impact
router.get('/impact', protect, getImpactAnalytics);

module.exports = router;
