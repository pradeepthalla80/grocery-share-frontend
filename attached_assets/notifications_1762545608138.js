const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const Item = require('../models/Item');
const ItemRequest = require('../models/ItemRequest');
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { unreadOnly } = req.query;

    let query = { userId };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    const count = await Notification.countDocuments({ userId, read: false });

    res.json({ 
      count, 
      notifications: notifications.map(n => ({
        id: n._id,
        type: n.type,
        message: n.message,
        read: n.read,
        item: n.item,
        createdAt: n.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/**
 * @swagger
 * /notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

/**
 * @swagger
 * /notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.put('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.userId, read: false },
      { read: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
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

/**
 * POST /notifications/interest
 * Send interest notification to item/request owner
 */
router.post('/interest', protect, async (req, res) => {
  try {
    const { itemId, itemName, type } = req.body;
    const userId = req.user.userId;

    if (!itemId || !itemName || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let ownerId;
    let notificationMessage;

    if (type === 'item') {
      // Find the item owner
      const item = await Item.findById(itemId);
      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }
      
      // FIXED: Use item.user instead of item.userId
      ownerId = item.user;
      notificationMessage = `Someone is interested in your item: ${itemName}`;
    } else if (type === 'request') {
      // Find the request owner
      const request = await ItemRequest.findById(itemId);
      if (!request) {
        return res.status(404).json({ error: 'Request not found' });
      }
      
      ownerId = request.userId;
      notificationMessage = `Someone is interested in fulfilling your request: ${itemName}`;
    } else {
      return res.status(400).json({ error: 'Invalid type. Must be "item" or "request"' });
    }

    // Don't send notification to yourself
    if (ownerId.toString() === userId.toString()) {
      return res.status(400).json({ error: 'Cannot send interest notification to yourself' });
    }

    // Create notification
    const notification = new Notification({
      userId: ownerId,
      type: 'new_match',
      message: notificationMessage,
      item: {
        id: itemId,
        name: itemName
      },
      read: false
    });

    await notification.save();

    res.json({ 
      message: 'Interest notification sent successfully',
      notification: {
        id: notification._id,
        message: notification.message
      }
    });
  } catch (error) {
    console.error('Error sending interest notification:', error);
    res.status(500).json({ error: 'Failed to send interest notification' });
  }
});

/**
 * POST /notifications/pickup-request
 * Send pickup request notification to seller
 */
router.post('/pickup-request', protect, async (req, res) => {
  try {
    const { itemId } = req.body;
    const userId = req.user.userId;

    if (!itemId) {
      return res.status(400).json({ error: 'Item ID is required' });
    }

    // Find the item
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // FIXED: Use item.user instead of item.userId
    // Don't send pickup request to yourself
    if (item.user.toString() === userId.toString()) {
      return res.status(400).json({ error: 'Cannot request pickup for your own item' });
    }

    // Create notification for seller
    const notification = new Notification({
      userId: item.user, // FIXED: Use item.user
      type: 'new_match',
      message: `Someone requested to pick up your item: ${item.name}`,
      item: {
        id: item._id,
        name: item.name,
        price: item.price || 0,
        isFree: item.isFree || false,
        imageURL: item.images?.[0] || item.imageURL
      },
      read: false
    });

    await notification.save();

    res.json({ 
      message: 'Pickup request sent successfully',
      notification: {
        id: notification._id,
        message: notification.message
      }
    });
  } catch (error) {
    console.error('Error sending pickup request:', error);
    res.status(500).json({ error: 'Failed to send pickup request' });
  }
});

module.exports = router;
