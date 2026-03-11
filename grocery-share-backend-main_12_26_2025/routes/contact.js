const express = require('express');
const router = express.Router();
const { submitContactForm, getContactMessages } = require('../controllers/contactController');
const { protect } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

router.post('/', submitContactForm);
router.get('/', protect, requireAdmin, getContactMessages);

module.exports = router;
