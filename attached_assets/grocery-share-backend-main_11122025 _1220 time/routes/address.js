const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { revealAddress } = require('../controllers/addressController');

router.post('/reveal/:conversationId', auth, revealAddress);

module.exports = router;
