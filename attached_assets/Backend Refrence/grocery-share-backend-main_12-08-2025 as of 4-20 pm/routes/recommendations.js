const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getRecommendations,
  getTrending
} = require('../controllers/recommendationsController');

// All routes require authentication
router.get('/', auth, getRecommendations);
router.get('/trending', auth, getTrending);

module.exports = router;
