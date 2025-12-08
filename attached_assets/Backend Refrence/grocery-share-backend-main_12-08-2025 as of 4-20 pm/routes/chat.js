const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  confirmPickup
} = require('../controllers/chatController');

// All routes require authentication
router.get('/conversations', auth, getConversations);
router.get('/conversations/:conversationId/messages', auth, getMessages);
router.post('/messages', auth, sendMessage);
router.put('/conversations/:conversationId/read', auth, markAsRead);
router.post('/conversations/:conversationId/confirm-pickup', auth, confirmPickup);

module.exports = router;
