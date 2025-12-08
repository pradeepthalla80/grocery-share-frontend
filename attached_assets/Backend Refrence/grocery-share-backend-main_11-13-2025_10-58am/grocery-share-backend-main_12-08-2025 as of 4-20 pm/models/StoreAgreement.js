const mongoose = require('mongoose');

const storeAgreementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  agreedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  ipAddress: {
    type: String,
    required: true
  },
  version: {
    type: String,
    required: true,
    default: '1.0'
  },
  termsContent: {
    type: String,
    required: true
  },
  accepted: {
    type: Boolean,
    required: true,
    default: true
  }
}, {
  timestamps: true
});

// Index for fast user lookups
storeAgreementSchema.index({ user: 1 });

module.exports = mongoose.model('StoreAgreement', storeAgreementSchema);
