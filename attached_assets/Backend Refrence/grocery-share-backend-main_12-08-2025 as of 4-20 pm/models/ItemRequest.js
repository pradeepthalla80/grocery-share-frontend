const mongoose = require('mongoose');

const itemRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  itemName: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  quantity: {
    type: String,
    required: [true, 'Quantity is required'],
    trim: true
  },
  category: {
    type: String,
    enum: ['produce', 'dairy', 'meat', 'bakery', 'pantry', 'frozen', 'beverages', 'other'],
    default: 'other'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: [true, 'Location coordinates are required']
    }
  },
  address: {
    type: String,
    trim: true
  },
  zipCode: {
    type: String,
    trim: true
  },
  approximateLocation: {
    type: String,
    trim: true
  },
  pricePreference: {
    type: String,
    enum: ['free_only', 'willing_to_pay'],
    default: 'free_only'
  },
  maxPrice: {
    type: Number,
    min: 0,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'fulfilled', 'cancelled'],
    default: 'active'
  },
  expiresAt: {
    type: Date,
    default: null
  },
  responses: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  preferredPickupTimes: [{
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    startTime: String,
    endTime: String
  }]
}, {
  timestamps: true
});

itemRequestSchema.index({ location: '2dsphere' });
itemRequestSchema.index({ user: 1, createdAt: -1 });
itemRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('ItemRequest', itemRequestSchema);
