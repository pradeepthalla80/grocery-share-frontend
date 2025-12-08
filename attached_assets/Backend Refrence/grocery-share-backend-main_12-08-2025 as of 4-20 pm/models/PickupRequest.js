const mongoose = require('mongoose');

const pickupRequestSchema = new mongoose.Schema({
  // Core References
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: [true, 'Item reference is required']
  },
  
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Requester reference is required']
  },
  
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Seller reference is required']
  },
  
  // Request Details
  requestType: {
    type: String,
    enum: ['free', 'paid'],
    required: true
  },
  
  // Status Tracking
  status: {
    type: String,
    enum: [
      'pending',           // Initial state - waiting for seller response
      'declined',          // Seller declined the request
      'canceled',          // Requester canceled the request
      'awaiting_pickup',   // Seller accepted - address revealed, coordinating pickup
      'completed'          // Exchange completed and confirmed by both parties
    ],
    default: 'pending'
  },
  
  // Delivery Information (filled by seller upon acceptance)
  deliveryMode: {
    type: String,
    enum: ['pickup', 'delivery'],
    default: null
  },
  
  sellerAddress: {
    type: String,
    trim: true,
    default: null
  },
  
  sellerInstructions: {
    type: String,
    trim: true,
    maxlength: [500, 'Instructions cannot exceed 500 characters'],
    default: null
  },
  
  // Completion Confirmations
  buyerConfirmed: {
    type: Boolean,
    default: false
  },
  
  sellerConfirmed: {
    type: Boolean,
    default: false
  },
  
  buyerConfirmedAt: {
    type: Date,
    default: null
  },
  
  sellerConfirmedAt: {
    type: Date,
    default: null
  },
  
  // Decline Reason (optional)
  declineReason: {
    type: String,
    trim: true,
    maxlength: [200, 'Decline reason cannot exceed 200 characters'],
    default: null
  },
  
  // Payment Information (for paid items)
  paymentIntentId: {
    type: String,
    default: null
  },
  
  amountPaid: {
    type: Number,
    default: 0,
    min: [0, 'Amount cannot be negative']
  },
  
  // Timestamps
  acceptedAt: {
    type: Date,
    default: null
  },
  
  declinedAt: {
    type: Date,
    default: null
  },
  
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true  // Adds createdAt and updatedAt automatically
});

// Indexes for faster queries
pickupRequestSchema.index({ item: 1, status: 1 });
pickupRequestSchema.index({ seller: 1, status: 1 });
pickupRequestSchema.index({ requester: 1, status: 1 });
pickupRequestSchema.index({ createdAt: -1 });

// Virtual for checking if both parties confirmed
pickupRequestSchema.virtual('isFullyConfirmed').get(function() {
  return this.buyerConfirmed && this.sellerConfirmed;
});

// Method to accept request
pickupRequestSchema.methods.accept = function(deliveryMode, address, instructions) {
  this.status = 'awaiting_pickup';  // Changed to awaiting_pickup to match workflow
  this.deliveryMode = deliveryMode;
  this.sellerAddress = address;
  this.sellerInstructions = instructions || null;
  this.acceptedAt = new Date();
  return this.save();
};

// Method to decline request
pickupRequestSchema.methods.decline = function(reason) {
  this.status = 'declined';
  this.declineReason = reason || 'Seller declined the request';
  this.declinedAt = new Date();
  return this.save();
};

// Method to confirm by buyer
pickupRequestSchema.methods.confirmByBuyer = function() {
  this.buyerConfirmed = true;
  this.buyerConfirmedAt = new Date();
  
  // If both confirmed, mark as completed
  if (this.sellerConfirmed) {
    this.status = 'completed';
    this.completedAt = new Date();
  }
  
  return this.save();
};

// Method to confirm by seller
pickupRequestSchema.methods.confirmBySeller = function() {
  this.sellerConfirmed = true;
  this.sellerConfirmedAt = new Date();
  
  // If both confirmed, mark as completed
  if (this.buyerConfirmed) {
    this.status = 'completed';
    this.completedAt = new Date();
  }
  
  return this.save();
};

// Static method to get pending requests for a seller
pickupRequestSchema.statics.getPendingForSeller = function(sellerId) {
  return this.find({ seller: sellerId, status: 'pending' })
    .populate('item', 'name imageURL price isFree')
    .populate('requester', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to get active requests for a requester
pickupRequestSchema.statics.getActiveForRequester = function(requesterId) {
  return this.find({ 
    requester: requesterId, 
    status: { $in: ['pending', 'awaiting_pickup'] }
  })
    .populate('item', 'name imageURL price isFree')
    .populate('seller', 'name email')
    .sort({ createdAt: -1 });
};

const PickupRequest = mongoose.model('PickupRequest', pickupRequestSchema);

module.exports = PickupRequest;
