const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');

// Platform commission percentage (e.g., 10% = 0.10)
const PLATFORM_COMMISSION_RATE = 0.10;

// Supported countries for Stripe Connect Express
// See: https://stripe.com/docs/connect/express-accounts#supported-countries
const SUPPORTED_COUNTRIES = [
  'US', 'GB', 'CA', 'AU', 'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 
  'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'NO', 'PL', 
  'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'CH', 'NZ', 'SG', 'HK', 'JP', 'MY', 'MX', 'BR'
];

// Create a Stripe Express connected account for a seller
const createConnectedAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const { country } = req.body;
    
    // Require country to be provided - no defaults to prevent accidental US-only accounts
    if (!country) {
      return res.status(400).json({ 
        error: 'Country is required. Please select your country from the dropdown.' 
      });
    }
    
    // Validate country code
    const countryCode = country.toUpperCase();
    if (!SUPPORTED_COUNTRIES.includes(countryCode)) {
      return res.status(400).json({ 
        error: `Country '${countryCode}' is not supported for Stripe Connect. Supported countries: ${SUPPORTED_COUNTRIES.join(', ')}` 
      });
    }
    
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user already has a Stripe account
    if (user.stripeAccountId) {
      // Retrieve existing account status
      const account = await stripe.accounts.retrieve(user.stripeAccountId);
      return res.json({
        success: true,
        accountId: user.stripeAccountId,
        accountStatus: {
          detailsSubmitted: account.details_submitted,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          requirements: account.requirements
        },
        message: 'Stripe account already exists'
      });
    }

    // Create new Express connected account with dynamic country
    const account = await stripe.accounts.create({
      type: 'express',
      country: countryCode,
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      business_profile: {
        product_description: 'Selling surplus groceries on BaskMate marketplace',
      },
      metadata: {
        userId: userId.toString(),
        userName: user.name,
        platform: 'BaskMate',
        country: countryCode
      }
    });

    // Save Stripe account ID to user
    user.stripeAccountId = account.id;
    user.stripeAccountStatus = 'pending';
    await user.save();

    console.log(`Created Stripe Connect account ${account.id} for user ${userId}`);

    res.status(201).json({
      success: true,
      accountId: account.id,
      message: 'Stripe Connect account created'
    });

  } catch (error) {
    console.error('Create connected account error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create Stripe Connect account' 
    });
  }
};

// Create an account link for onboarding
const createAccountLink = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.stripeAccountId) {
      return res.status(400).json({ 
        error: 'No Stripe account found. Please create one first.' 
      });
    }

    // Get the frontend URL from environment
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5000';

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: user.stripeAccountId,
      refresh_url: `${frontendUrl}/seller/onboarding/refresh`,
      return_url: `${frontendUrl}/seller/onboarding/complete`,
      type: 'account_onboarding',
      collect: 'eventually_due',
    });

    console.log(`Created account link for user ${userId}`);

    res.json({
      success: true,
      url: accountLink.url,
      expiresAt: accountLink.expires_at
    });

  } catch (error) {
    console.error('Create account link error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create onboarding link' 
    });
  }
};

// Get connected account status
const getAccountStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.stripeAccountId) {
      return res.json({
        success: true,
        hasAccount: false,
        accountStatus: null
      });
    }

    // Retrieve account from Stripe
    const account = await stripe.accounts.retrieve(user.stripeAccountId);

    // Update user's account status
    let newStatus = 'pending';
    if (account.charges_enabled && account.payouts_enabled) {
      newStatus = 'active';
    } else if (account.details_submitted) {
      newStatus = 'pending_verification';
    }

    if (user.stripeAccountStatus !== newStatus) {
      user.stripeAccountStatus = newStatus;
      await user.save();
    }

    res.json({
      success: true,
      hasAccount: true,
      accountId: user.stripeAccountId,
      accountStatus: {
        status: newStatus,
        detailsSubmitted: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        requirements: {
          currentlyDue: account.requirements?.currently_due || [],
          eventuallyDue: account.requirements?.eventually_due || [],
          pendingVerification: account.requirements?.pending_verification || []
        }
      }
    });

  } catch (error) {
    console.error('Get account status error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get account status' 
    });
  }
};

// Create a login link for Express dashboard
const createDashboardLink = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.stripeAccountId) {
      return res.status(400).json({ 
        error: 'No Stripe account found' 
      });
    }

    // Create login link to Stripe Express dashboard
    const loginLink = await stripe.accounts.createLoginLink(user.stripeAccountId);

    res.json({
      success: true,
      url: loginLink.url
    });

  } catch (error) {
    console.error('Create dashboard link error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create dashboard link' 
    });
  }
};

// Get seller's balance/earnings
const getSellerBalance = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.stripeAccountId) {
      return res.status(400).json({ 
        error: 'No Stripe account found' 
      });
    }

    // Get balance for connected account
    const balance = await stripe.balance.retrieve({
      stripeAccount: user.stripeAccountId,
    });

    // Format balance data
    const available = balance.available.reduce((sum, b) => sum + b.amount, 0) / 100;
    const pending = balance.pending.reduce((sum, b) => sum + b.amount, 0) / 100;

    res.json({
      success: true,
      balance: {
        available: available,
        pending: pending,
        currency: balance.available[0]?.currency || 'usd'
      }
    });

  } catch (error) {
    console.error('Get seller balance error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get balance' 
    });
  }
};

// Helper function to calculate platform fee
const calculatePlatformFee = (amount) => {
  return Math.round(amount * PLATFORM_COMMISSION_RATE * 100); // Return in cents
};

// Webhook handler for Connect events
const handleConnectWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'account.updated':
      const account = event.data.object;
      console.log(`Account ${account.id} updated`);
      
      // Find user and update status
      const user = await User.findOne({ stripeAccountId: account.id });
      if (user) {
        if (account.charges_enabled && account.payouts_enabled) {
          user.stripeAccountStatus = 'active';
        } else if (account.details_submitted) {
          user.stripeAccountStatus = 'pending_verification';
        }
        await user.save();
        console.log(`Updated user ${user._id} Stripe status to ${user.stripeAccountStatus}`);
      }
      break;
      
    case 'account.application.deauthorized':
      // User disconnected their Stripe account
      const deauthorizedAccountId = event.data.object.id;
      const disconnectedUser = await User.findOne({ stripeAccountId: deauthorizedAccountId });
      if (disconnectedUser) {
        disconnectedUser.stripeAccountId = null;
        disconnectedUser.stripeAccountStatus = null;
        await disconnectedUser.save();
        console.log(`User ${disconnectedUser._id} disconnected Stripe account`);
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

module.exports = {
  createConnectedAccount,
  createAccountLink,
  getAccountStatus,
  createDashboardLink,
  getSellerBalance,
  handleConnectWebhook,
  calculatePlatformFee,
  PLATFORM_COMMISSION_RATE
};
