const express = require('express');
const router = express.Router();
const gamificationController = require('../controllers/gamificationController');
const { protect } = require('../middleware/auth');

// Get all badges
router.get('/badges', gamificationController.getAllBadges);

// Get user's badges
router.get('/users/:userId/badges', gamificationController.getUserBadges);

// Award badge (admin only - you can add admin middleware later)
router.post('/badges/award', protect, gamificationController.awardBadge);

module.exports = router;
