const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const { PLANS, getCommissionRate, getDynamicPlans, isTestMode } = require('../config/plans');
const planService = require('../services/planService');

const STRIPE_PRICE_IDS = {
  plus: process.env.STRIPE_PLUS_PRICE_ID || null,
  mini_store: process.env.STRIPE_MINI_STORE_PRICE_ID || null
};

const ensureStripePrices = async (planKey, interval = 'month') => {
  const cacheKey = interval === 'year' ? `${planKey}_yearly` : planKey;
  if (STRIPE_PRICE_IDS[cacheKey]) return STRIPE_PRICE_IDS[cacheKey];

  const plan = await planService.getPlanById(planKey);
  if (!plan) return null;

  const targetPrice = interval === 'year' ? plan.yearlyPrice : plan.price;
  if (!targetPrice || targetPrice <= 0) return null;

  const products = await stripe.products.list({ limit: 100 });
  const productName = `BaskMate ${plan.name}`;

  let product = products.data.find(p => p.name === productName && p.active);
  if (!product) {
    product = await stripe.products.create({
      name: productName,
      description: (plan.features || []).join(', '),
      metadata: { plan_id: planKey, platform: 'BaskMate' }
    });
    console.log(`Created Stripe product: ${product.id} for ${planKey}`);
  }

  const prices = await stripe.prices.list({ product: product.id, active: true, limit: 10 });
  let price = prices.data.find(p =>
    p.unit_amount === Math.round(targetPrice * 100) &&
    p.recurring?.interval === interval
  );

  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(targetPrice * 100),
      currency: 'usd',
      recurring: { interval },
      metadata: { plan_id: planKey, billing_interval: interval }
    });
    console.log(`Created Stripe price: ${price.id} for ${planKey} at $${targetPrice}/${interval}`);
  }

  STRIPE_PRICE_IDS[cacheKey] = price.id;
  console.log(`Stripe Price ID for ${cacheKey}: ${price.id}`);
  return price.id;
};

exports.getPlans = async (req, res) => {
  try {
    const userPlan = req.user ? (await User.findById(req.user._id))?.plan || 'free' : 'free';
    const testMode = await isTestMode();
    const allPlans = await getDynamicPlans();
    const plans = allPlans.filter(p => p.active !== false);
    res.json({
      plans,
      currentPlan: userPlan,
      testMode
    });
  } catch (err) {
    console.error('Get plans error:', err);
    res.status(500).json({ error: 'Failed to get plans' });
  }
};

exports.getCurrentSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const testMode = await isTestMode();
    const effectivePlan = testMode ? 'mini_store' : (user.plan || 'free');
    const commissionRate = await planService.getEffectiveCommissionRate(user.plan || 'free');

    res.json({
      plan: user.plan || 'free',
      effectivePlan,
      subscriptionStatus: user.subscriptionStatus,
      currentPeriodEnd: user.subscriptionCurrentPeriodEnd,
      commissionRate,
      testMode
    });
  } catch (err) {
    console.error('Get subscription error:', err);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
};

exports.createCheckoutSession = async (req, res) => {
  try {
    const { planId, interval } = req.body;
    const billingInterval = interval === 'year' ? 'year' : 'month';

    if (!planId || planId === 'free') {
      return res.status(400).json({ error: 'Invalid plan. Choose a paid plan.' });
    }

    const plan = await planService.getPlanById(planId);
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan.' });
    }

    if (billingInterval === 'year' && (!plan.yearlyPrice || plan.yearlyPrice <= 0)) {
      return res.status(400).json({ error: 'Yearly billing is not available for this plan.' });
    }

    if (billingInterval === 'month' && (!plan.price || plan.price <= 0)) {
      return res.status(400).json({ error: 'Invalid plan or plan has no price.' });
    }

    if (plan.active === false) {
      return res.status(400).json({ error: 'This plan is currently unavailable. Please choose an active plan.' });
    }

    const priceId = await ensureStripePrices(planId, billingInterval);
    if (!priceId) {
      return res.status(500).json({ error: 'Stripe price not configured for this plan' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.plan === planId && user.subscriptionStatus === 'active') {
      return res.status(400).json({ error: 'You are already on this plan' });
    }

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user._id.toString(), platform: 'BaskMate' }
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5000';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/plans?session_id={CHECKOUT_SESSION_ID}&status=success`,
      cancel_url: `${frontendUrl}/plans?status=cancelled`,
      metadata: {
        userId: user._id.toString(),
        planId: planId,
        platform: 'BaskMate'
      },
      subscription_data: {
        metadata: {
          userId: user._id.toString(),
          planId: planId,
          platform: 'BaskMate'
        }
      }
    });

    console.log(`Created checkout session ${session.id} for user ${user._id} plan ${planId}`);

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Create checkout session error:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
};

exports.cancelSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.stripeSubscriptionId) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    console.log(`Subscription ${subscription.id} set to cancel at period end for user ${user._id}`);

    res.json({
      success: true,
      message: 'Subscription will cancel at end of billing period',
      cancelAt: new Date(subscription.current_period_end * 1000)
    });
  } catch (err) {
    console.error('Cancel subscription error:', err);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET;

  let event;

  if (webhookSecret) {
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else {
    try {
      event = JSON.parse(req.body.toString());
    } catch (err) {
      return res.status(400).json({ error: 'Invalid webhook body' });
    }
    console.warn('STRIPE_SUBSCRIPTION_WEBHOOK_SECRET not set - webhook signatures not verified');
  }

  console.log(`Subscription webhook event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode !== 'subscription') break;

        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;
        if (!userId || !planId) break;

        const subscription = await stripe.subscriptions.retrieve(session.subscription);

        await User.findByIdAndUpdate(userId, {
          plan: planId,
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
          subscriptionStatus: 'active',
          subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000)
        });

        console.log(`User ${userId} subscribed to ${planId}`);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        if (!invoice.subscription) break;

        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const planId = subscription.metadata?.planId;
        const userId = subscription.metadata?.userId;
        if (!userId) break;

        await User.findByIdAndUpdate(userId, {
          subscriptionStatus: 'active',
          subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
          ...(planId && { plan: planId })
        });

        console.log(`Invoice paid for user ${userId}, subscription ${invoice.subscription}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        if (!invoice.subscription) break;

        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const userId = subscription.metadata?.userId;
        if (!userId) break;

        await User.findByIdAndUpdate(userId, {
          subscriptionStatus: 'past_due'
        });

        console.log(`Payment failed for user ${userId}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        if (!userId) break;

        const status = subscription.cancel_at_period_end ? 'canceled' :
          subscription.status === 'active' ? 'active' :
          subscription.status;

        await User.findByIdAndUpdate(userId, {
          subscriptionStatus: status,
          subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000)
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        if (!userId) break;

        await User.findByIdAndUpdate(userId, {
          plan: 'free',
          stripeSubscriptionId: null,
          subscriptionStatus: null,
          subscriptionCurrentPeriodEnd: null
        });

        console.log(`Subscription canceled for user ${userId}, reverted to free plan`);
        break;
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
  }

  res.json({ received: true });
};

exports.verifySession = async (req, res) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) return res.status(400).json({ error: 'Session ID required' });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid' && session.metadata?.userId === req.user._id.toString()) {
      const user = await User.findById(req.user._id);
      res.json({
        success: true,
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus
      });
    } else {
      res.json({ success: false, message: 'Payment not completed' });
    }
  } catch (err) {
    console.error('Verify session error:', err);
    res.status(500).json({ error: 'Failed to verify session' });
  }
};
