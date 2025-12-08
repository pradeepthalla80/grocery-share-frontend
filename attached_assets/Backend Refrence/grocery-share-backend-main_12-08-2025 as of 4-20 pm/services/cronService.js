const cron = require('node-cron');
const Item = require('../models/Item');
const ItemRequest = require('../models/ItemRequest');

// Clean up expired items and requests every hour
const startExpirationCleanup = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      
      // Mark expired items as inactive
      const expiredItems = await Item.updateMany(
        {
          expiresAt: { $lte: now, $ne: null },
          isActive: true
        },
        {
          $set: { isActive: false }
        }
      );
      
      // Cancel expired item requests
      const expiredRequests = await ItemRequest.updateMany(
        {
          expiresAt: { $lte: now, $ne: null },
          status: 'active'
        },
        {
          $set: { status: 'cancelled' }
        }
      );
      
      console.log(`[CRON] Expired items marked inactive: ${expiredItems.modifiedCount}`);
      console.log(`[CRON] Expired requests cancelled: ${expiredRequests.modifiedCount}`);
    } catch (error) {
      console.error('[CRON] Error cleaning up expired content:', error);
    }
  });
  
  console.log('[CRON] Expiration cleanup job scheduled (runs every hour)');
};

module.exports = { startExpirationCleanup };
