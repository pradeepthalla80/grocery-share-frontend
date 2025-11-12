const cron = require('node-cron');
const Item = require('../models/Item');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendExpiryAlert, sendNearbyItemEmail } = require('./emailService');

// Check for expiring items (runs daily at 9 AM)
const scheduleExpiryAlerts = () => {
  cron.schedule('0 9 * * *', async () => {
    console.log('🔔 Checking for expiring items...');
    
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);
      
      const now = new Date();
      
      // Find all items expiring within 24 hours
      const expiringItems = await Item.find({
        expiryDate: {
          $gte: now,
          $lte: tomorrow
        }
      }).populate('user', 'name email notificationSettings');
      
      // Group items by user
      const itemsByUser = {};
      expiringItems.forEach(item => {
        if (!item.user) return;
        
        const userId = item.user._id.toString();
        if (!itemsByUser[userId]) {
          itemsByUser[userId] = {
            user: item.user,
            items: []
          };
        }
        itemsByUser[userId].items.push(item);
      });
      
      // Send notifications to each user
      for (const userId in itemsByUser) {
        const { user, items } = itemsByUser[userId];
        
        // Send email if enabled
        if (user.notificationSettings?.email) {
          await sendExpiryAlert(user.email, user.name, items);
        }
        
        // Create in-app notification if enabled
        if (user.notificationSettings?.inApp !== false) {
          for (const item of items) {
            await Notification.create({
              user: user._id,
              item: item._id,
              type: 'expiring_soon',
              message: `Your item "${item.name}" is expiring within 24 hours!`,
              emailSent: user.notificationSettings?.email || false
            });
          }
        }
      }
      
      console.log(`✅ Sent expiry alerts to ${Object.keys(itemsByUser).length} users`);
    } catch (error) {
      console.error('Expiry alert error:', error);
    }
  });
  
  console.log('⏰ Expiry alert cron job scheduled (daily at 9 AM)');
};

// Monitor for nearby items (runs every 30 minutes)
const scheduleNearbyItemMonitoring = () => {
  cron.schedule('*/30 * * * *', async () => {
    console.log('🔍 Checking for nearby items matching user preferences...');
    
    try {
      // Get all users with notification preferences set up
      const users = await User.find({
        'notificationSettings.inApp': true,
        'location.coordinates': { $exists: true, $ne: null }
      });
      
      for (const user of users) {
        if (!user.location || !user.location.coordinates) continue;
        
        const radiusInMeters = (user.notificationSettings.radius || 5) * 1609.34; // miles to meters
        
        // Find items within user's radius
        const query = {
          location: {
            $nearSphere: {
              $geometry: {
                type: 'Point',
                coordinates: user.location.coordinates
              },
              $maxDistance: radiusInMeters
            }
          },
          user: { $ne: user._id }, // Exclude user's own items
          createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) } // Only items from last 30 mins
        };
        
        // Filter by preferred categories if set
        if (user.notificationSettings.categories && user.notificationSettings.categories.length > 0) {
          query.category = { $in: user.notificationSettings.categories };
        }
        
        // Filter by preferred tags if set
        if (user.notificationSettings.tags && user.notificationSettings.tags.length > 0) {
          query.tags = { $in: user.notificationSettings.tags };
        }
        
        const nearbyItems = await Item.find(query).populate('user', 'name');
        
        for (const item of nearbyItems) {
          // Check if notification already exists
          const existingNotif = await Notification.findOne({
            user: user._id,
            item: item._id
          });
          
          if (existingNotif) continue; // Skip if already notified
          
          // Determine notification type
          let notifType = 'new_match';
          let message = `New item nearby: ${item.name}`;
          
          if (item.isFree) {
            notifType = 'nearby_free';
            message = `🆓 Free item nearby: ${item.name}`;
          } else if (item.price < 5) {
            notifType = 'nearby_discounted';
            message = `💰 Discounted item nearby: ${item.name} ($${item.price})`;
          }
          
          // Create in-app notification
          const notification = await Notification.create({
            user: user._id,
            item: item._id,
            type: notifType,
            message,
            emailSent: false
          });
          
          // Send email if enabled
          if (user.notificationSettings.email) {
            const emailSent = await sendNearbyItemEmail(user.email, user.name, item, notifType);
            notification.emailSent = emailSent;
            await notification.save();
          }
        }
      }
      
      console.log('✅ Nearby item monitoring complete');
    } catch (error) {
      console.error('Nearby item monitoring error:', error);
    }
  });
  
  console.log('⏰ Nearby item monitoring scheduled (every 30 minutes)');
};

// Start all notification services
const startNotificationServices = () => {
  scheduleExpiryAlerts();
  scheduleNearbyItemMonitoring();
};

module.exports = {
  startNotificationServices
};
