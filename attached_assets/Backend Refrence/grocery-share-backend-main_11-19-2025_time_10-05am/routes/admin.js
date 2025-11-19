const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const ItemRequest = require('../models/ItemRequest');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

router.use(protect, requireAdmin);

router.get('/items', async (req, res) => {
  try {
    const items = await Item.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(items);
  } catch (error) {
    console.error('Error fetching admin items:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/requests', async (req, res) => {
  try {
    const requests = await ItemRequest.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(requests);
  } catch (error) {
    console.error('Error fetching admin requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalItems, totalRequests, activeItems] = await Promise.all([
      User.countDocuments(),
      Item.countDocuments(),
      ItemRequest.countDocuments(),
      Item.countDocuments({ status: 'available' })
    ]);

    res.json({
      totalUsers,
      totalItems,
      totalRequests,
      activeItems,
      soldItems: totalItems - activeItems
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
