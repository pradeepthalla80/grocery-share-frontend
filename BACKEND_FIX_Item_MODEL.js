const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [100, 'Item name cannot exceed 100 characters']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  // Category & Tags
  category: {
    type: String,
    trim: true,
    enum: [
      'Fruits', 
      'Vegetables', 
      'Dairy', 
      'Bakery', 
      'Meat', 
      'Snacks', 
      'Beverages',
      'Pantry',
      'Oils & Spices',
      'Condiments & Sauces',
      'Frozen Foods',
      'Canned Goods',
      'Grains & Pasta',
      'Seafood',
      'Desserts',
      'Baby Food',
      'Pet Food',
      'Other'
    ],
    default: 'Other'
  },
  
  customCategory: {
    type: String,
    trim: true,
    maxlength: [50, 'Custom category cannot exceed 50 characters'],
    default: null
  },
  
  tags: [{
    type: String,
    trim: true
  }],
  
  // Pricing
  isFree: {
    type: Boolean,
    default: false
  },
  
  price: {
    type: Number,
    default: 0,
    min: [0, 'Price cannot be negative'],
    max: [10000, 'Price cannot exceed $10,000']
  },
  
  // Delivery Options
  offerDelivery: {
    type: Boolean,
    default: false
  },
  
  deliveryFee: {
    type: Number,
    default: 0,
    min: [0, 'Delivery fee cannot be negative'],
    max: [50, 'Delivery fee cannot exceed $50']
  },
  
  // Images
  imageURL: {
    type: String,
    default: null
  },
  
  images: [{
    type: String
  }],
  
  // Location (GeoJSON)
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  
  address: {
    type: String,
    trim: true
  },
  
  // Expiry & Pickup
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required']
  },
  
  pickupStartTime: {
    type: String,
    trim: true
  },
  
  pickupEndTime: {
    type: String,
    trim: true
  },
  
  flexiblePickup: {
    type: Boolean,
    default: false
  },
  
  // Quantity (updated for store mode to allow 0 for out-of-stock items)
  quantity: {
    type: Number,
    default: 1,
    min: [0, 'Quantity cannot be negative']
  },
  
  unit: {
    type: String,
    trim: true,
    default: 'item'
  },
  
  // ========== ADDED FOR STORE MODE - START ==========
  isStoreItem: {
    type: Boolean,
    default: false
  },
  stockStatus: {
    type: String,
    enum: ['in_stock', 'out_of_stock', 'low_stock', 'unlimited'],
    default: null // null for regular community items
  },
  originalQuantity: {
    type: Number,
    default: null
  },
  // ========== ADDED FOR STORE MODE - END ==========
  
  // Owner/User
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Status & Payment
  status: {
    type: String,
    enum: ['available', 'sold', 'refunded', 'expired'],
    default: 'available'
  },
  
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  soldAt: {
    type: Date,
    default: null
  },
  
  // Payment Information
  paymentIntentId: {
    type: String,
    default: null
  },
  
  deliveryIncluded: {
    type: Boolean,
    default: false
  },
  
  finalAmount: {
    type: Number,
    default: null
  },
  
  // Refund Information
  refundedAt: {
    type: Date,
    default: null
  },
  
  refundReason: {
    type: String,
    default: null
  },
  
  refundId: {
    type: String,
    default: null
  },
  
  // Additional Features
  featured: {
    type: Boolean,
    default: false
  },
  
  views: {
    type: Number,
    default: 0
  },
  
  // Metadata
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
  
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Indexes for Performance
itemSchema.index({ location: '2dsphere' }); // Geospatial queries
itemSchema.index({ user: 1 }); // User's items
itemSchema.index({ status: 1 }); // Status filtering
itemSchema.index({ category: 1 }); // Category filtering
itemSchema.index({ expiryDate: 1 }); // Expiry sorting
itemSchema.index({ createdAt: -1 }); // Recent items
itemSchema.index({ buyerId: 1 }); // Buyer's purchases
// ========== ADDED FOR STORE MODE - START ==========
itemSchema.index({ isStoreItem: 1, stockStatus: 1 }); // Store item filtering
// ========== ADDED FOR STORE MODE - END ==========

// Virtual for distance (used in queries)
itemSchema.virtual('distance').get(function() {
  return this._distance;
});

// Method to check if item is expired
itemSchema.methods.isExpired = function() {
  return new Date() > this.expiryDate;
};

// Method to check if item is available
itemSchema.methods.isAvailable = function() {
  return this.status === 'available' && !this.isExpired();
};

// Pre-save hook to auto-set status to expired if needed
itemSchema.pre('save', function(next) {
  if (this.isExpired() && this.status === 'available') {
    this.status = 'expired';
  }
  next();
});

// Ensure virtuals are included in JSON
itemSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

itemSchema.set('toObject', { virtuals: true });

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
