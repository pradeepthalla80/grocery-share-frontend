const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Item = require('../models/Item');
const User = require('../models/User');
const inventoryService = require('../services/inventoryService');
const { getCommissionRate, getDynamicCommissionRate } = require('../config/plans');

// Get Stripe publishable key
const getPublishableKey = async (req, res) => {
  try {
    res.json({
      success: true,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    });
  } catch (error) {
    console.error('Get Stripe config error:', error);
    res.status(500).json({ error: 'Failed to get Stripe configuration' });
  }
};

// Create payment intent with Stripe Connect support
const createPaymentIntent = async (req, res) => {
  try {
    console.log('=== CREATE PAYMENT INTENT WITH CONNECT START ===');
    console.log('Request body:', req.body);
    
    const { itemId, includeDelivery = false } = req.body;
    
    if (!itemId) {
      return res.status(400).json({ error: 'Item ID is required' });
    }
    
    // Check authentication
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Fetch item with user populated
    const item = await Item.findById(itemId).populate('user', 'name email stripeAccountId stripeAccountStatus');
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Check if item has seller
    if (!item.user) {
      return res.status(400).json({ 
        error: 'This item does not have a seller assigned.' 
      });
    }
    
    const seller = item.user;
    
    // Check if item is available
    if (item.status !== 'available') {
      return res.status(400).json({ error: 'Item is no longer available for purchase' });
    }
    
    // For store items, check stock
    if (item.isStoreItem && item.quantity !== null && item.quantity <= 0) {
      return res.status(400).json({ error: 'This store item is out of stock' });
    }
    
    // Check if item is free
    if (item.isFree) {
      return res.status(400).json({ error: 'This is a free item and does not require payment' });
    }
    
    // Check buyer isn't buying own item
    if (item.user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'You cannot purchase your own item' });
    }
    
    // Validate delivery selection
    if (includeDelivery && !item.offerDelivery) {
      return res.status(400).json({ 
        error: 'This item does not offer delivery.' 
      });
    }
    
    // Calculate total amount
    let totalAmount = item.price;
    let deliveryFee = 0;
    
    if (includeDelivery && item.offerDelivery) {
      deliveryFee = item.deliveryFee || 0;
      totalAmount += deliveryFee;
    }
    
    // Ensure minimum charge
    if (totalAmount < 0.50) {
      return res.status(400).json({ 
        error: 'Total amount must be at least $0.50' 
      });
    }
    
    // Convert to cents for Stripe
    const amountInCents = Math.round(totalAmount * 100);
    
    // Check if seller has a connected Stripe account
    const sellerHasConnect = seller.stripeAccountId && seller.stripeAccountStatus === 'active';
    
    // CRITICAL: Block paid purchases if seller doesn't have active Stripe Connect
    // This ensures all paid transactions route funds correctly to sellers
    if (!sellerHasConnect) {
      console.log(`BLOCKED: Seller ${seller._id} does not have active Stripe Connect account`);
      return res.status(400).json({ 
        error: 'This seller has not set up their payment account yet. They cannot receive payments for paid items. Please contact the seller or try a different listing.',
        code: 'SELLER_NOT_CONNECTED',
        sellerName: seller.name
      });
    }
    
    const sellerUser = await User.findById(seller._id);
    const commissionRate = await getDynamicCommissionRate(sellerUser?.plan || 'free');
    const platformFee = Math.round(amountInCents * commissionRate);
    console.log(`Seller plan: ${sellerUser?.plan || 'free'}, Commission rate: ${(commissionRate * 100).toFixed(1)}%`);
    
    let paymentIntentParams = {
      amount: amountInCents,
      currency: 'usd',
      // Use destination charge with platform fee - seller gets paid directly
      application_fee_amount: platformFee,
      transfer_data: {
        destination: seller.stripeAccountId,
      },
      metadata: {
        itemId: item._id.toString(),
        itemName: item.name,
        itemPrice: item.price.toString(),
        includeDelivery: includeDelivery.toString(),
        deliveryFee: deliveryFee.toString(),
        totalAmount: totalAmount.toString(),
        sellerId: seller._id.toString(),
        sellerName: seller.name,
        sellerEmail: seller.email,
        buyerId: req.user._id.toString(),
        buyerName: req.user.name,
        buyerEmail: req.user.email,
        isStoreItem: (item.isStoreItem || false).toString(),
        useConnect: 'true',
        platformFee: (platformFee / 100).toFixed(2),
        sellerPayout: ((amountInCents - platformFee) / 100).toFixed(2)
      },
      description: `Purchase of ${item.name}${includeDelivery ? ' with delivery' : ''}`
    };
    
    console.log(`Using Stripe Connect: Seller ${seller._id}, Account ${seller.stripeAccountId}`);
    console.log(`Total: $${totalAmount}, Platform Fee: $${(platformFee / 100).toFixed(2)}, Seller Gets: $${((amountInCents - platformFee) / 100).toFixed(2)}`);
    
    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);
    
    console.log('PaymentIntent created:', paymentIntent.id);
    console.log('=== CREATE PAYMENT INTENT SUCCESS ===');
    
    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      totalAmount,
      itemPrice: item.price,
      deliveryIncluded: includeDelivery,
      deliveryFee,
      useConnect: sellerHasConnect,
      platformFee: sellerHasConnect ? (platformFee / 100) : null,
      sellerPayout: sellerHasConnect ? ((amountInCents - platformFee) / 100) : null,
      commissionRate: commissionRate,
      sellerPlan: sellerUser?.plan || 'free'
    });
    
  } catch (error) {
    console.error('=== CREATE PAYMENT INTENT ERROR ===');
    console.error('Error details:', error);
    res.status(500).json({ 
      error: 'Failed to create payment intent. Please try again.' 
    });
  }
};

// Confirm payment after successful charge
const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    
    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID is required' });
    }
    
    // Retrieve PaymentIntent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment has not been completed' });
    }
    
    // Verify buyer matches authenticated user
    if (paymentIntent.metadata.buyerId !== req.user._id.toString()) {
      return res.status(403).json({ 
        error: 'You are not authorized to confirm this payment' 
      });
    }
    
    const { 
      itemId, 
      includeDelivery, 
      deliveryFee, 
      totalAmount,
      useConnect,
      platformFee,
      sellerPayout
    } = paymentIntent.metadata;
    
    // Use inventory service for atomic stock management
    const stockResult = await inventoryService.decrementStock(itemId, 1);
    
    if (!stockResult.success && stockResult.outOfStock) {
      // Item sold out - refund
      const chargeId = paymentIntent.charges?.data?.[0]?.id || 
                       paymentIntent.latest_charge;
      
      if (chargeId) {
        await stripe.refunds.create({
          charge: typeof chargeId === 'string' ? chargeId : chargeId.id,
          reason: 'requested_by_customer',
          metadata: {
            reason: 'Item out of stock',
            itemId: itemId
          }
        });
      }
      
      return res.status(400).json({ 
        error: 'Item is now out of stock. Your payment has been automatically refunded.',
        refunded: true
      });
    }
    
    if (!stockResult.success) {
      console.error('Failed to update inventory:', stockResult.message);
      return res.status(500).json({
        error: 'Payment succeeded but inventory update failed. Please contact support.',
        details: stockResult.message
      });
    }
    
    // Update item with payment details
    let updateData = {
      buyerId: req.user._id,
      soldAt: new Date(),
      paymentIntentId: paymentIntentId,
      deliveryIncluded: includeDelivery === 'true',
      finalAmount: parseFloat(totalAmount),
      usedStripeConnect: useConnect === 'true',
      platformFee: platformFee ? parseFloat(platformFee) : null,
      sellerPayout: sellerPayout ? parseFloat(sellerPayout) : null
    };
    
    // For regular items, mark as sold
    if (stockResult.skipQuantity) {
      updateData.status = 'sold';
    }
    
    const item = await Item.findByIdAndUpdate(
      itemId,
      updateData,
      { new: true }
    );
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Get seller info
    let seller = null;
    if (item.user) {
      seller = await User.findById(item.user);
    }
    
    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      item: {
        id: item._id,
        name: item.name,
        price: item.price,
        deliveryIncluded: includeDelivery === 'true',
        deliveryFee: parseFloat(deliveryFee || 0),
        totalPaid: parseFloat(totalAmount),
        remainingStock: stockResult.remainingStock,
        seller: seller ? {
          id: seller._id,
          name: seller.name
        } : null,
        usedStripeConnect: useConnect === 'true'
      }
    });
    
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ 
      error: 'Failed to confirm payment. Please contact support if you were charged.' 
    });
  }
};

// Request refund (updated for Connect)
const requestRefund = async (req, res) => {
  try {
    const { itemId, reason } = req.body;
    
    if (!itemId) {
      return res.status(400).json({ error: 'Item ID is required' });
    }
    
    const item = await Item.findById(itemId);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    if (!item.user) {
      return res.status(400).json({ error: 'Item seller information is missing' });
    }
    
    // Verify user is either buyer or seller
    const isBuyer = item.buyerId && item.buyerId.toString() === req.user._id.toString();
    const isSeller = item.user.toString() === req.user._id.toString();
    
    if (!isBuyer && !isSeller) {
      return res.status(403).json({ error: 'You are not authorized to request a refund' });
    }
    
    // Check if item was sold
    if (item.status !== 'sold' && !item.isStoreItem) {
      return res.status(400).json({ error: 'This item was not sold' });
    }
    
    if (!item.paymentIntentId) {
      return res.status(400).json({ error: 'No payment record found' });
    }
    
    if (item.status === 'refunded') {
      return res.status(400).json({ error: 'Already refunded' });
    }
    
    // Retrieve payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(item.paymentIntentId);
    
    const chargeId = paymentIntent.charges?.data?.[0]?.id || 
                     paymentIntent.latest_charge;
    
    if (!chargeId) {
      return res.status(400).json({ error: 'No charge found' });
    }
    
    // Create refund - Stripe handles Connect refunds automatically
    const refund = await stripe.refunds.create({
      charge: typeof chargeId === 'string' ? chargeId : chargeId.id,
      reason: 'requested_by_customer',
      metadata: {
        itemId: item._id.toString(),
        refundReason: reason || 'No reason provided',
        refundRequestedBy: isBuyer ? 'buyer' : 'seller'
      }
    });
    
    // Restore inventory
    const stockResult = await inventoryService.incrementStock(itemId, 1);
    
    // Update item status
    if (item.isStoreItem) {
      item.status = 'available';
      item.refundedAt = new Date();
      item.refundReason = reason;
      item.refundId = refund.id;
      item.buyerId = null;
      item.soldAt = null;
      item.paymentIntentId = null;
    } else {
      item.status = 'refunded';
      item.refundedAt = new Date();
      item.refundReason = reason;
      item.refundId = refund.id;
    }
    await item.save();
    
    res.json({
      success: true,
      message: 'Refund processed successfully',
      amount: (refund.amount / 100).toFixed(2),
      refundId: refund.id,
      restoredStock: stockResult.success ? stockResult.remainingStock : null
    });
    
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to process refund' 
    });
  }
};

module.exports = {
  getPublishableKey,
  createPaymentIntent,
  confirmPayment,
  requestRefund
};
