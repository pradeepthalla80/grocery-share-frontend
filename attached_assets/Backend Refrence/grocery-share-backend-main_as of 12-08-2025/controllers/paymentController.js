const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Item = require('../models/Item');
const User = require('../models/User');
const inventoryService = require('../services/inventoryService');

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

// Create payment intent
const createPaymentIntent = async (req, res) => {
  try {
    console.log('=== CREATE PAYMENT INTENT START ===');
    console.log('Request body:', req.body);
    console.log('Authenticated user:', req.user ? req.user._id : 'NONE');
    
    const { itemId, includeDelivery = false } = req.body;
    
    if (!itemId) {
      return res.status(400).json({ error: 'Item ID is required' });
    }
    
    // Check authentication
    if (!req.user || !req.user._id) {
      console.error('User not authenticated');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Fetch item
    const item = await Item.findById(itemId);
    console.log('Item found:', item ? item._id : 'NONE');
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Check if item has seller
    if (!item.user) {
      console.error(`Item ${itemId} has no seller assigned`);
      return res.status(400).json({ 
        error: 'This item does not have a seller assigned. Please contact support.' 
      });
    }
    
    console.log('Item seller ID:', item.user);
    
    // Fetch seller info
    const seller = await User.findById(item.user);
    console.log('Seller found:', seller ? seller._id : 'NONE');
    
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }
    
    // Check if item is available
    if (item.status !== 'available') {
      return res.status(400).json({ error: 'Item is no longer available for purchase' });
    }
    
    // For store items, check stock availability
    if (item.isStoreItem && item.quantity !== null && item.quantity <= 0) {
      return res.status(400).json({ error: 'This store item is out of stock' });
    }
    
    // Check if item is free
    if (item.isFree) {
      return res.status(400).json({ error: 'This is a free item and does not require payment' });
    }
    
    // Check if buyer is trying to buy their own item
    const itemUserId = item.user.toString();
    const currentUserId = req.user._id.toString();
    
    console.log('Comparing seller vs buyer:', itemUserId, 'vs', currentUserId);
    
    if (itemUserId === currentUserId) {
      return res.status(400).json({ error: 'You cannot purchase your own item' });
    }
    
    // Validate delivery selection
    if (includeDelivery && !item.offerDelivery) {
      return res.status(400).json({ 
        error: 'This item does not offer delivery. Please select pickup only.' 
      });
    }
    
    // Calculate total amount
    let totalAmount = item.price;
    let deliveryFee = 0;
    
    if (includeDelivery && item.offerDelivery) {
      deliveryFee = item.deliveryFee || 0;
      totalAmount += deliveryFee;
    }
    
    console.log('Total calculation:', { itemPrice: item.price, deliveryFee, totalAmount });
    
    // Ensure minimum charge (Stripe requires at least $0.50)
    if (totalAmount < 0.50) {
      return res.status(400).json({ 
        error: 'Total amount must be at least $0.50' 
      });
    }
    
    // Convert to cents for Stripe
    const amountInCents = Math.round(totalAmount * 100);
    
    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
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
        isStoreItem: (item.isStoreItem || false).toString()
      },
      description: `Purchase of ${item.name}${includeDelivery ? ' with delivery' : ''}`
    });
    
    console.log('PaymentIntent created:', paymentIntent.id);
    console.log('=== CREATE PAYMENT INTENT SUCCESS ===');
    
    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      totalAmount,
      itemPrice: item.price,
      deliveryIncluded: includeDelivery,
      deliveryFee
    });
    
  } catch (error) {
    console.error('=== CREATE PAYMENT INTENT ERROR ===');
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
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
    
    // Retrieve PaymentIntent from Stripe to verify it succeeded
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment has not been completed' });
    }
    
    // SECURITY: Verify buyer matches authenticated user
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
      isStoreItem
    } = paymentIntent.metadata;
    
    // Use inventory service for atomic stock management
    const stockResult = await inventoryService.decrementStock(itemId, 1);
    
    if (!stockResult.success && stockResult.outOfStock) {
      // Item sold out between payment intent and confirmation
      // Automatically refund the payment
      const chargeId = paymentIntent.charges.data[0]?.id;
      
      if (chargeId) {
        await stripe.refunds.create({
          charge: chargeId,
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
      finalAmount: parseFloat(totalAmount)
    };
    
    // For regular items (not store items), mark as sold
    if (stockResult.skipQuantity) {
      updateData.status = 'sold';
    }
    // For store items, status stays 'available' with decremented quantity
    
    const item = await Item.findByIdAndUpdate(
      itemId,
      updateData,
      { new: true }
    );
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Get seller info safely
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
        } : null
      }
    });
    
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ 
      error: 'Failed to confirm payment. Please contact support if you were charged.' 
    });
  }
};

// Request refund
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
    
    // Check if item has user
    if (!item.user) {
      return res.status(400).json({ error: 'Item seller information is missing' });
    }
    
    // Verify user is either buyer or seller
    const isBuyer = item.buyerId && item.buyerId.toString() === req.user._id.toString();
    const isSeller = item.user.toString() === req.user._id.toString();
    
    if (!isBuyer && !isSeller) {
      return res.status(403).json({ error: 'You are not authorized to request a refund for this item' });
    }
    
    // Check if item was actually sold
    if (item.status !== 'sold' && !item.isStoreItem) {
      return res.status(400).json({ error: 'This item was not sold, no refund needed' });
    }
    
    if (!item.paymentIntentId) {
      return res.status(400).json({ error: 'No payment record found for this item' });
    }
    
    // Check if already refunded
    if (item.status === 'refunded') {
      return res.status(400).json({ error: 'This item has already been refunded' });
    }
    
    // Retrieve payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(item.paymentIntentId);
    
    if (!paymentIntent.charges.data[0]) {
      return res.status(400).json({ error: 'No charge found for this payment' });
    }
    
    const chargeId = paymentIntent.charges.data[0].id;
    
    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      charge: chargeId,
      reason: 'requested_by_customer',
      metadata: {
        itemId: item._id.toString(),
        refundReason: reason || 'No reason provided',
        refundRequestedBy: isBuyer ? 'buyer' : 'seller'
      }
    });
    
    // Restore inventory for store items
    const stockResult = await inventoryService.incrementStock(itemId, 1);
    
    if (!stockResult.success && !stockResult.skipQuantity) {
      console.error('Failed to restore inventory after refund:', stockResult.message);
      // Continue anyway - refund succeeded, inventory issue can be fixed manually
    }
    
    // Update item status - for store items, keep 'available', for regular items mark 'refunded'
    if (item.isStoreItem) {
      // Store items: return to 'available' status with restored quantity
      item.status = 'available';
      item.refundedAt = new Date();
      item.refundReason = reason;
      item.refundId = refund.id;
      // Clear payment-related fields
      item.buyerId = null;
      item.soldAt = null;
      item.paymentIntentId = null;
    } else {
      // Regular items mark as refunded
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
      error: error.message || 'Failed to process refund. Please contact support.' 
    });
  }
};

module.exports = {
  getPublishableKey,
  createPaymentIntent,
  confirmPayment,
  requestRefund
};
