const mongoose = require('mongoose');

const miniStoreRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true },
  zipCode: { type: String, required: true },
  storeName: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  type: { type: String, enum: ['store_request', 'waitlist'], default: 'store_request' },
  notes: { type: String, default: '' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
}, { timestamps: true });

miniStoreRequestSchema.index({ zipCode: 1, status: 1 });
miniStoreRequestSchema.index({ user: 1 });

module.exports = mongoose.model('MiniStoreRequest', miniStoreRequestSchema);
