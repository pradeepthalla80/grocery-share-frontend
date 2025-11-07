// =============================================================================
// FILE: models/Notification.js
// =============================================================================
// INSTRUCTIONS:
// REPLACE the entire file with this code (or verify yours matches this):
// =============================================================================

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'nearby_free',
      'nearby_discounted',
      'expiring_soon',
      'new_match',
      'interest',           // NEW - for "Interested to Buy" button
      'pickup_request'      // NEW - for pickup requests
    ]
  },
  message: {
    type: String,
    required: true
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    default: null
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
