const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: false  // Changed to false since some notifications may not have an item
  },
  type: {
    type: String,
    enum: [
      'nearby_free', 
      'nearby_discounted', 
      'expiring_soon', 
      'new_match',
      // ========== ADDED FOR PICKUP REQUESTS - START ==========
      'pickup_request',      // New: Someone requested your item
      'request_accepted',    // New: Seller accepted your pickup request
      'request_declined',    // New: Seller declined your pickup request
      'request_canceled',    // New: Buyer canceled their pickup request
      'exchange_completed'   // New: Pickup/exchange was completed
      // ========== ADDED FOR PICKUP REQUESTS - END ==========
    ],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  emailSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
