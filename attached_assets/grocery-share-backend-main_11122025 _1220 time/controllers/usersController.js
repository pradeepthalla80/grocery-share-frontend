const User = require('../models/User');
const Item = require('../models/Item');
const ItemRequest = require('../models/ItemRequest');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

// Get user preferences
const getPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('notificationSettings location');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      notificationSettings: user.notificationSettings || {
        inApp: true,
        email: false,
        radius: 5,
        categories: [],
        tags: []
      },
      location: user.location && user.location.coordinates ? {
        lat: user.location.coordinates[1],
        lng: user.location.coordinates[0]
      } : null
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
};

// Update user preferences
const updatePreferences = async (req, res) => {
  try {
    const { notificationSettings, location } = req.body;
    
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (notificationSettings) {
      user.notificationSettings = {
        inApp: notificationSettings.inApp !== undefined ? notificationSettings.inApp : user.notificationSettings.inApp,
        email: notificationSettings.email !== undefined ? notificationSettings.email : user.notificationSettings.email,
        radius: notificationSettings.radius !== undefined ? notificationSettings.radius : user.notificationSettings.radius,
        categories: notificationSettings.categories !== undefined ? notificationSettings.categories : user.notificationSettings.categories,
        tags: notificationSettings.tags !== undefined ? notificationSettings.tags : user.notificationSettings.tags
      };
    }
    
    if (location && location.lat !== undefined && location.lng !== undefined) {
      user.location = {
        type: 'Point',
        coordinates: [parseFloat(location.lng), parseFloat(location.lat)]
      };
    }
    
    await user.save();
    
    res.json({
      message: 'Preferences updated successfully',
      notificationSettings: user.notificationSettings,
      location: user.location && user.location.coordinates ? {
        lat: user.location.coordinates[1],
        lng: user.location.coordinates[0]
      } : null
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { confirmPassword } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.googleId && confirmPassword) {
      const isPasswordValid = await user.comparePassword(confirmPassword);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Incorrect password' });
      }
    }

    await Item.deleteMany({ user: userId });
    
    const ItemRequestModel = mongoose.model('ItemRequest');
    await ItemRequestModel.deleteMany({ user: userId }).catch(() => {});
    
    await Notification.deleteMany({ user: userId });
    await Message.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] });
    
    const conversations = await Conversation.find({ participants: userId });
    for (const conv of conversations) {
      if (conv.participants.length === 2) {
        await Conversation.findByIdAndDelete(conv._id);
      } else {
        conv.participants = conv.participants.filter(p => p.toString() !== userId);
        await conv.save();
      }
    }

    await User.findByIdAndDelete(userId);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
};

module.exports = {
  getPreferences,
  updatePreferences,
  deleteAccount
};
