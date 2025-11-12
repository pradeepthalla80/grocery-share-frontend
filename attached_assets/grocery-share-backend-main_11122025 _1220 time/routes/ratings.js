const express = require('express');
const router = express.Router();
const ratingsController = require('../controllers/ratingsController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Create a rating
router.post('/', ratingsController.createRating);

// Get ratings for a specific user
router.get('/user/:userId', ratingsController.getUserRatings);

// Get ratings given by the authenticated user
router.get('/given', ratingsController.getRatingsGiven);

// Check if user can rate another user
router.get('/can-rate', ratingsController.canRate);

module.exports = router;
