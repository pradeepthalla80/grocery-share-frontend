const mongoose = require('mongoose');

const searchLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true
  },
  keyword: {
    type: String,
    trim: true,
    index: true
  },
  category: {
    type: String,
    trim: true
  },
  tags: {
    type: [String],
    default: []
  },
  location: {
    lat: Number,
    lng: Number
  },
  radius: {
    type: Number,
    default: 10
  },
  resultsCount: {
    type: Number,
    default: 0
  },
  clickedItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item'
  }]
}, {
  timestamps: true
});

// Index for analytics and recommendations
searchLogSchema.index({ user: 1, createdAt: -1 });
searchLogSchema.index({ keyword: 1, createdAt: -1 });

module.exports = mongoose.model('SearchLog', searchLogSchema);
