# User Model Updates for Stripe Connect

Add these fields to your User model (models/User.js):

```javascript
// Add to the userSchema definition:

// Stripe Connect fields
stripeAccountId: {
  type: String,
  default: null
},
stripeAccountStatus: {
  type: String,
  enum: ['pending', 'pending_verification', 'active', 'disabled', null],
  default: null
}
```

## Full Example

```javascript
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId;
    }
  },
  googleId: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'super_admin'],
    default: 'user'
  },
  storeMode: {
    type: Boolean,
    default: false
  },
  storeName: {
    type: String,
    default: null
  },
  storeAgreementAccepted: {
    type: Boolean,
    default: false
  },
  storeAgreementDate: {
    type: Date,
    default: null
  },
  // === ADD THESE NEW FIELDS ===
  stripeAccountId: {
    type: String,
    default: null
  },
  stripeAccountStatus: {
    type: String,
    enum: ['pending', 'pending_verification', 'active', 'disabled', null],
    default: null
  },
  // === END NEW FIELDS ===
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
```

## Index.js Routes Update

Add to your index.js:

```javascript
// Import the new routes
const stripeConnectRoutes = require('./routes/stripeConnectRoutes');

// Add the route (after other routes)
app.use('/api/v1/stripe-connect', stripeConnectRoutes);

// Add webhook endpoint (needs raw body parser)
const stripeConnectController = require('./controllers/stripeConnectController');

app.post('/api/v1/stripe-connect/webhook', 
  express.raw({ type: 'application/json' }),
  stripeConnectController.handleConnectWebhook
);
```

## Environment Variables

Add to your .env:

```
# Stripe Connect Webhook Secret (from Stripe Dashboard -> Webhooks)
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_xxxxx
```

## Stripe Dashboard Setup

1. Go to https://dashboard.stripe.com/settings/connect
2. Enable Express accounts
3. Set your platform name and branding
4. Configure payout settings
5. Set up webhooks for Connect events
