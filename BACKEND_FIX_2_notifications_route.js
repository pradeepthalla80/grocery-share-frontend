// =============================================================================
// FILE: routes/notifications.js
// =============================================================================
// INSTRUCTIONS:
// 1. Make sure you have these imports at the TOP of the file:

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');
const Item = require('../models/Item');

// =============================================================================
// 2. ADD this NEW route (add it anywhere in the file, but preferably near other POST routes)
// =============================================================================

// POST /notifications/interest - Send interest notification
router.post('/interest', auth, async (req, res) => {
  try {
    const { itemId, itemName, type } = req.body;
    
    // Find the item to get the seller's ID
    const item = await Item.findById(itemId);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Don't send notification to yourself
    if (item.user.toString() === req.user.id) {
      return res.status(400).json({ error: 'Cannot send interest notification to yourself' });
    }
    
    // Create notification for the seller
    const notification = new Notification({
      user: item.user, // Send to the item owner/seller
      type: 'interest',
      message: `${req.user.name} is interested in your item: ${itemName}`,
      item: itemId,
      read: false
    });
    
    await notification.save();
    
    res.json({ message: 'Interest notification sent successfully' });
  } catch (error) {
    console.error('Error sending interest notification:', error);
    res.status(500).json({ error: 'Failed to send interest notification' });
  }
});

// =============================================================================
// 3. ADD this NEW route for pickup requests (if not already there)
// =============================================================================

// POST /notifications/pickup-request - Send pickup request notification
router.post('/pickup-request', auth, async (req, res) => {
  try {
    const { itemId } = req.body;
    
    // Find the item to get the seller's ID
    const item = await Item.findById(itemId);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Don't send notification to yourself
    if (item.user.toString() === req.user.id) {
      return res.status(400).json({ error: 'Cannot send pickup request to yourself' });
    }
    
    // Create notification for the seller
    const notification = new Notification({
      user: item.user,
      type: 'pickup_request',
      message: `${req.user.name} wants to pick up your item: ${item.name}`,
      item: itemId,
      read: false
    });
    
    await notification.save();
    
    res.json({ message: 'Pickup request sent successfully' });
  } catch (error) {
    console.error('Error sending pickup request:', error);
    res.status(500).json({ error: 'Failed to send pickup request' });
  }
});

// =============================================================================
// 4. VERIFY your GET /notifications route looks like this:
// =============================================================================

// GET /notifications - Get user's notifications
router.get('/', auth, async (req, res) => {
  try {
    const { unreadOnly } = req.query;
    
    const query = { user: req.user.id };
    if (unreadOnly === 'true') {
      query.read = false;
    }
    
    const notifications = await Notification.find(query)
      .populate('item', 'name price isFree imageURL images')
      .sort({ createdAt: -1 })
      .limit(50);
    
    const unreadCount = await Notification.countDocuments({ 
      user: req.user.id, 
      read: false 
    });
    
    res.json({
      count: unreadCount,
      notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// =============================================================================
// 5. VERIFY you have these routes for marking as read:
// =============================================================================

// PUT /notifications/:id/read - Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// PUT /notifications/read-all - Mark all notifications as read
router.put('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// DELETE /notifications/:id - Delete a notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// =============================================================================
// 6. At the BOTTOM of the file, make sure you have:
// =============================================================================

module.exports = router;
