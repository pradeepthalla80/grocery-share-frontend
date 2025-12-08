const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: false
  },
  lastMessage: {
    type: String,
    default: ''
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  addressRevealed: {
    type: Boolean,
    default: false
  },
  revealedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    revealedAt: {
      type: Date,
      default: Date.now
    }
  }],
  pickupConfirmed: {
    type: Boolean,
    default: false
  },
  confirmedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    confirmedAt: {
      type: Date,
      default: Date.now
    }
  }],
  pickupCompletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
conversationSchema.index({ participants: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
