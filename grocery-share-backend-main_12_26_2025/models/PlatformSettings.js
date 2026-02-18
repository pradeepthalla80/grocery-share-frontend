const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  planId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  commissionRate: {
    type: Number,
    required: true,
    default: 0.05,
    min: 0,
    max: 1
  },
  features: [{
    type: String,
    trim: true
  }],
  stripeProductId: {
    type: String,
    default: null
  },
  stripePriceId: {
    type: String,
    default: null
  },
  active: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, { _id: false });

const platformSettingsSchema = new mongoose.Schema({
  settingsId: {
    type: String,
    default: 'global',
    unique: true
  },
  testMode: {
    type: Boolean,
    default: false
  },
  testModeUpdatedAt: {
    type: Date,
    default: null
  },
  testModeUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  plans: [planSchema]
}, {
  timestamps: true
});

const DEFAULT_PLANS = [
  {
    planId: 'free',
    name: 'Free Membership',
    price: 0,
    commissionRate: 0.05,
    features: ['List items locally', 'Browse & purchase nearby', 'Messaging & pickup coordination'],
    active: true,
    sortOrder: 0
  },
  {
    planId: 'plus',
    name: 'BaskMate Plus',
    price: 4.99,
    commissionRate: 0.03,
    features: ['Reduced transaction fees', 'Priority listing visibility', 'Seller insights & analytics', 'Trust badge'],
    active: true,
    sortOrder: 1
  },
  {
    planId: 'mini_store',
    name: 'Mini Store',
    price: 19.99,
    commissionRate: 0.02,
    features: ['Lowest transaction fees', 'Dedicated store page', 'Inventory management', 'Advanced analytics', 'Priority support'],
    active: true,
    sortOrder: 2
  }
];

platformSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne({ settingsId: 'global' });
  if (!settings) {
    settings = await this.create({
      settingsId: 'global',
      testMode: false,
      plans: DEFAULT_PLANS
    });
  }
  return settings;
};

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
