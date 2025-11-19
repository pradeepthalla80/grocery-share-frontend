// ============================================
// FINAL CORRECTED VERSION
// COPY THIS TO YOUR BACKEND: routes/admin.js
// ============================================

const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const Item = require('../models/Item');
const ItemRequest = require('../models/ItemRequest');
const User = require('../models/User');
const PickupRequest = require('../models/PickupRequest');
const Message = require('../models/Message');
const Rating = require('../models/Rating');

// Get platform-wide statistics
router.get('/stats', protect, isAdmin, async (req, res) => {
  try {
    const [totalUsers, totalItems, totalRequests, activeItems, soldItems] = await Promise.all([
      User.countDocuments(),
      Item.countDocuments(),
      ItemRequest.countDocuments(),
      Item.countDocuments({ status: 'available' }),
      Item.countDocuments({ status: 'sold' })
    ]);

    res.json({
      totalUsers,
      totalItems,
      totalRequests,
      activeItems,
      soldItems
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Failed to fetch admin statistics' });
  }
});

// Get all items (admin view)
router.get('/items', protect, isAdmin, async (req, res) => {
  try {
    const items = await Item.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(items.map(item => ({
      id: item._id,
      name: item.name,
      price: item.price,
      isFree: item.isFree,
      status: item.status,
      imageURL: item.images && item.images.length > 0 ? item.images[0] : null,
      user: item.user
    })));
  } catch (error) {
    console.error('Error fetching admin items:', error);
    res.status(500).json({ message: 'Failed to fetch items' });
  }
});

// Get all requests (admin view)
router.get('/requests', protect, isAdmin, async (req, res) => {
  try {
    const requests = await ItemRequest.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching admin requests:', error);
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
});

// ============ USER MANAGEMENT ENDPOINTS ============

// Get all users with search, filter, and sort
router.get('/users', protect, isAdmin, async (req, res) => {
  try {
    const { search, role, status, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role && role !== 'all') {
      query.role = role;
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;
    
    const users = await User.find(query)
      .select('-password')
      .sort(sortOptions);
    
    const usersWithActivity = await Promise.all(
      users.map(async (user) => {
        const [itemsCount, requestsCount] = await Promise.all([
          Item.countDocuments({ userId: user._id }),
          ItemRequest.countDocuments({ userId: user._id })
        ]);
        
        return {
          ...user.toObject(),
          activityCounts: {
            items: itemsCount,
            requests: requestsCount
          }
        };
      })
    );
    
    res.json({
      users: usersWithActivity,
      total: usersWithActivity.length
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

// Get detailed user information
router.get('/users/:userId', protect, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const [recentItems, recentRequests, totalItems, totalRequests] = await Promise.all([
      Item.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('name category price isFree status createdAt'),
      ItemRequest.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('itemName category status createdAt'),
      Item.countDocuments({ userId: user._id }),
      ItemRequest.countDocuments({ userId: user._id })
    ]);
    
    const userDetail = {
      ...user.toObject(),
      activity: {
        recentItems,
        recentRequests,
        totalItems,
        totalRequests
      }
    };
    
    res.json(userDetail);
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Failed to fetch user details', error: error.message });
  }
});

// Update user role
router.put('/users/:userId/role', protect, isAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'admin', 'super_admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Cannot modify super admin role' });
    }
    
    user.role = role;
    await user.save();
    
    res.json({ 
      success: true, 
      message: 'User role updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Failed to update user role', error: error.message });
  }
});

// Delete user
router.delete('/users/:userId', protect, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.role === 'super_admin') {
      return res.status(403).json({ message: 'Cannot delete super admin' });
    }
    
    await Promise.all([
      Item.deleteMany({ userId: user._id }),
      ItemRequest.deleteMany({ userId: user._id }),
      PickupRequest.deleteMany({ $or: [{ buyerId: user._id }, { sellerId: user._id }] }),
      Message.deleteMany({ $or: [{ senderId: user._id }, { recipientId: user._id }] }),
      Rating.deleteMany({ $or: [{ raterId: user._id }, { ratedUserId: user._id }] })
    ]);
    
    await User.findByIdAndDelete(user._id);
    
    res.json({ 
      success: true, 
      message: 'User and all associated data deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
});

// Toggle store owner status
router.put('/users/:userId/store-status', protect, isAdmin, async (req, res) => {
  try {
    const { isStoreOwner } = req.body;
    
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.isStoreOwner = isStoreOwner;
    
    if (!isStoreOwner) {
      user.storeMode = false;
    }
    
    await user.save();
    
    res.json({ 
      success: true, 
      message: `Store owner status ${isStoreOwner ? 'enabled' : 'disabled'}`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isStoreOwner: user.isStoreOwner,
        storeMode: user.storeMode
      }
    });
  } catch (error) {
    console.error('Error updating store status:', error);
    res.status(500).json({ message: 'Failed to update store status', error: error.message });
  }
});

module.exports = router;
