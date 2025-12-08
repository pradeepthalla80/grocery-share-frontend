const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: '🏆'
  },
  criteria: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['sharing', 'engagement', 'community', 'milestone'],
    default: 'milestone'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Badge', badgeSchema);
