const mongoose = require('mongoose');

const zipSettingsSchema = new mongoose.Schema({
  zipCode: { type: String, required: true },
  maxStores: { type: Number, default: 5 },
  paused: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  waitlistOnly: { type: Boolean, default: false },
  requireApproval: { type: Boolean, default: false }
}, { _id: false });

const miniStoreSettingsSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: true },
  waitlistEnabled: { type: Boolean, default: false },
  requireApproval: { type: Boolean, default: false },
  defaultMaxStoresPerZip: { type: Number, default: 10 },
  zipSettings: [zipSettingsSchema],
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('MiniStoreSettings', miniStoreSettingsSchema);
