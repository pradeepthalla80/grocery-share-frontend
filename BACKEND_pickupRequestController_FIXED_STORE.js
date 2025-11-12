const PickupRequest = require('../models/PickupRequest');
const Item = require('../models/Item');
const Notification = require('../models/Notification');
const inventoryService = require('../services/inventoryService');

// Create a new pickup request
exports.createPickupRequest = async (req, res) => {
  try {
    const { itemId, message } = req.body;
    const requesterId = req.user.userId;
    
    // Fetch item with user populated
    const item = await Item.findById(itemId).populate('user', 'name email');
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Prevent requesting own items
    if (item.user._id.toString() === requesterId) {
      return res.status(400).json({ error: 'You cannot request your own item' });
    }
    
    // Check if item is available - only allow requests on 'available' items
    if (item.status !== 'available') {
      return res.status(400).json({ 
        error: `This item is no longer available (status: ${item.status})` 
      });
    }
    
    // For store items, also check if they have stock
    if (item.isStoreItem && item.quantity !== null && item.quantity <= 0) {
      return res.status(400).json({ 
        error: 'This store item is out of stock' 
      });
    }
    
    // Check if there's already a pending or awaiting_pickup request from this user
    const existingRequest = await PickupRequest.findOne({
      item: itemId,
      requester: requesterId,
      status: { $in: ['pending', 'awaiting_pickup'] }
    });
    
    if (existingRequest) {
      return res.status(400).json({ 
        error: 'You already have an active request for this item',
        existingRequest 
      });
    }
    
    // Determine request type based on item price
    const requestType = item.isFree ? 'free' : 'paid';
    
    // Create pickup request
    const pickupRequest = new PickupRequest({
      item: itemId,
      requester: requesterId,
      seller: item.user._id,
      requestType,
      message: message || null,
      status: 'pending'
    });
    
    await pickupRequest.save();
    
    // Populate before sending response
    await pickupRequest.populate([
      { path: 'item', select: 'name imageURL price isFree' },
      { path: 'requester', select: 'name email' },
      { path: 'seller', select: 'name email' }
    ]);
    
    // Create notification for seller
    const notification = new Notification({
      user: item.user._id,
      type: 'pickup_request',
      message: `You have a new pickup request for "${item.name}"`,
      relatedItem: itemId,
      relatedUser: requesterId,
      metadata: {
        requestId: pickupRequest._id,
        itemName: item.name,
        requesterName: pickupRequest.requester.name
      }
    });
    
    await notification.save();
    
    res.status(201).json({
      success: true,
      message: 'Pickup request created successfully',
      data: pickupRequest
    });
    
  } catch (error) {
    console.error('Error creating pickup request:', error);
    res.status(500).json({ 
      error: 'Failed to create pickup request',
      details: error.message 
    });
  }
};

// Get all pickup requests (for current user)
exports.getPickupRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type } = req.query; // 'sent' or 'received'
    
    let query = {};
    
    if (type === 'sent') {
      // Requests I sent (as a buyer)
      query.requester = userId;
    } else if (type === 'received') {
      // Requests I received (as a seller)
      query.seller = userId;
    } else {
      // All requests (either sent or received)
      query.$or = [
        { requester: userId },
        { seller: userId }
      ];
    }
    
    const requests = await PickupRequest.find(query)
      .populate('item', 'name imageURL price isFree location status isStoreItem quantity stockStatus')
      .populate('requester', 'name email')
      .populate('seller', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: requests
    });
    
  } catch (error) {
    console.error('Error fetching pickup requests:', error);
    res.status(500).json({ 
      error: 'Failed to fetch pickup requests',
      details: error.message 
    });
  }
};

// Accept a pickup request (seller action)
exports.acceptPickupRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { deliveryMode, address, instructions } = req.body;
    const userId = req.user.userId;
    
    // Validate input
    if (!deliveryMode || !address) {
      return res.status(400).json({ 
        error: 'Delivery mode and address are required' 
      });
    }
    
    if (!['pickup', 'delivery'].includes(deliveryMode)) {
      return res.status(400).json({ 
        error: 'Invalid delivery mode. Must be "pickup" or "delivery"' 
      });
    }
    
    // Fetch the request with populated fields
    const pickupRequest = await PickupRequest.findById(requestId)
      .populate('item', 'name imageURL price isFree isStoreItem quantity stockStatus')
      .populate('requester', 'name email')
      .populate('seller', 'name email');
    
    if (!pickupRequest) {
      return res.status(404).json({ error: 'Pickup request not found' });
    }
    
    // Verify user is the seller
    if (pickupRequest.seller._id.toString() !== userId) {
      return res.status(403).json({ 
        error: 'You are not authorized to accept this request' 
      });
    }
    
    // Check if request is still pending
    if (pickupRequest.status !== 'pending') {
      return res.status(400).json({ 
        error: `Cannot accept request with status: ${pickupRequest.status}` 
      });
    }
    
    // Accept the request (this sets request status to 'awaiting_pickup')
    await pickupRequest.accept(deliveryMode, address, instructions);
    
    // Update item status to match
    await Item.findByIdAndUpdate(pickupRequest.item._id, {
      status: 'awaiting_pickup'
    });
    
    // Create notification for requester
    const notification = new Notification({
      user: pickupRequest.requester._id,
      type: 'request_accepted',
      message: `Your pickup request for "${pickupRequest.item.name}" was accepted!`,
      relatedItem: pickupRequest.item._id,
      relatedUser: userId,
      metadata: {
        requestId: pickupRequest._id,
        itemName: pickupRequest.item.name,
        deliveryMode,
        sellerAddress: address
      }
    });
    
    await notification.save();
    
    res.json({
      success: true,
      message: 'Pickup request accepted successfully',
      data: pickupRequest
    });
    
  } catch (error) {
    console.error('Error accepting pickup request:', error);
    res.status(500).json({ 
      error: 'Failed to accept pickup request',
      details: error.message 
    });
  }
};

// Decline a pickup request (seller action)
exports.declinePickupRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId;
    
    // Fetch the request
    const pickupRequest = await PickupRequest.findById(requestId)
      .populate('item', 'name')
      .populate('requester', 'name');
    
    if (!pickupRequest) {
      return res.status(404).json({ error: 'Pickup request not found' });
    }
    
    // Verify user is the seller
    if (pickupRequest.seller.toString() !== userId) {
      return res.status(403).json({ 
        error: 'You are not authorized to decline this request' 
      });
    }
    
    // Check if request is still pending
    if (pickupRequest.status !== 'pending') {
      return res.status(400).json({ 
        error: `Cannot decline request with status: ${pickupRequest.status}` 
      });
    }
    
    // Decline the request
    await pickupRequest.decline(reason);
    
    // Create notification for requester
    const notification = new Notification({
      user: pickupRequest.requester._id,
      type: 'request_declined',
      message: `Your pickup request for "${pickupRequest.item.name}" was declined`,
      relatedItem: pickupRequest.item._id,
      relatedUser: userId,
      metadata: {
        requestId: pickupRequest._id,
        itemName: pickupRequest.item.name,
        declineReason: reason || 'No reason provided'
      }
    });
    
    await notification.save();
    
    res.json({
      success: true,
      message: 'Pickup request declined',
      data: pickupRequest
    });
    
  } catch (error) {
    console.error('Error declining pickup request:', error);
    res.status(500).json({ 
      error: 'Failed to decline pickup request',
      details: error.message 
    });
  }
};

// Confirm pickup completion (buyer or seller action)
exports.confirmPickupCompletion = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.userId;
    
    // Fetch the request with populated fields
    const pickupRequest = await PickupRequest.findById(requestId)
      .populate('item', 'name imageURL price isFree isStoreItem quantity stockStatus originalQuantity')
      .populate('requester', 'name email')
      .populate('seller', 'name email');
    
    if (!pickupRequest) {
      return res.status(404).json({ error: 'Pickup request not found' });
    }
    
    // Check if user is buyer or seller
    const isBuyer = pickupRequest.requester._id.toString() === userId;
    const isSeller = pickupRequest.seller._id.toString() === userId;
    
    if (!isBuyer && !isSeller) {
      return res.status(403).json({ 
        error: 'You are not authorized to confirm this request' 
      });
    }
    
    // Check if request is in awaiting_pickup status
    if (pickupRequest.status !== 'awaiting_pickup') {
      return res.status(400).json({ 
        error: `Cannot confirm request with status: ${pickupRequest.status}` 
      });
    }
    
    // Confirm based on role
    if (isBuyer) {
      await pickupRequest.confirmByBuyer();
    } else {
      await pickupRequest.confirmBySeller();
    }
    
    // If both confirmed, complete the exchange
    if (pickupRequest.isFullyConfirmed) {
      pickupRequest.status = 'completed';
      pickupRequest.completedAt = new Date();
      await pickupRequest.save();
      
      // Use inventory service for atomic stock management
      const stockResult = await inventoryService.decrementStock(pickupRequest.item._id, 1);
      
      if (!stockResult.success) {
        // Shouldn't happen if validation is correct, but handle gracefully
        console.error('Failed to decrement stock:', stockResult.message);
        return res.status(500).json({
          error: 'Exchange completed but inventory update failed',
          details: stockResult.message
        });
      }
      
      // If it's a regular item (not store), mark as completed
      if (stockResult.skipQuantity) {
        await Item.findByIdAndUpdate(pickupRequest.item._id, {
          status: 'completed'
        });
      }
      
      // Notify both parties
      const buyerNotification = new Notification({
        user: pickupRequest.requester._id,
        type: 'exchange_completed',
        message: `Pickup completed for "${pickupRequest.item.name}"`,
        relatedItem: pickupRequest.item._id,
        relatedUser: pickupRequest.seller._id,
        metadata: {
          requestId: pickupRequest._id,
          itemName: pickupRequest.item.name
        }
      });
      
      const sellerNotification = new Notification({
        user: pickupRequest.seller._id,
        type: 'exchange_completed',
        message: `Pickup completed for "${pickupRequest.item.name}"`,
        relatedItem: pickupRequest.item._id,
        relatedUser: pickupRequest.requester._id,
        metadata: {
          requestId: pickupRequest._id,
          itemName: pickupRequest.item.name
        }
      });
      
      await Promise.all([
        buyerNotification.save(),
        sellerNotification.save()
      ]);
    }
    
    res.json({
      success: true,
      message: pickupRequest.isFullyConfirmed 
        ? 'Pickup completed successfully!' 
        : 'Confirmation recorded. Waiting for other party to confirm.',
      data: pickupRequest
    });
    
  } catch (error) {
    console.error('Error confirming pickup:', error);
    res.status(500).json({ 
      error: 'Failed to confirm pickup',
      details: error.message 
    });
  }
};

// Cancel a pickup request (requester action)
exports.cancelPickupRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.userId;
    
    // Fetch the request
    const pickupRequest = await PickupRequest.findById(requestId)
      .populate('seller', 'name');
    
    if (!pickupRequest) {
      return res.status(404).json({ error: 'Pickup request not found' });
    }
    
    // Verify user is the requester
    if (pickupRequest.requester.toString() !== userId) {
      return res.status(403).json({ 
        error: 'You are not authorized to cancel this request' 
      });
    }
    
    // Can only cancel pending or awaiting_pickup requests
    if (!['pending', 'awaiting_pickup'].includes(pickupRequest.status)) {
      return res.status(400).json({ 
        error: `Cannot cancel request with status: ${pickupRequest.status}` 
      });
    }
    
    // Fetch the full item to check its status
    const item = await Item.findById(pickupRequest.item);
    
    // If the request was accepted (awaiting_pickup), check if it's a paid/reserved store item
    const wasReserved = pickupRequest.status === 'awaiting_pickup' && item.isStoreItem;
    
    // Cancel the request
    pickupRequest.status = 'canceled';
    await pickupRequest.save();
    
    // If item was in awaiting_pickup state, reset it to available
    if (item && item.status === 'awaiting_pickup') {
      // For store items that were reserved, restore the quantity
      if (wasReserved) {
        // Note: We didn't actually decrement quantity yet (only happens on completion)
        // So just reset status to available
        await Item.findByIdAndUpdate(item._id, {
          status: 'available'
        });
      } else {
        // Regular item or store item that wasn't reserved yet
        await Item.findByIdAndUpdate(item._id, {
          status: 'available'
        });
      }
    }
    
    // Notify seller
    const notification = new Notification({
      user: pickupRequest.seller._id,
      type: 'request_canceled',
      message: `A pickup request for "${item ? item.name : 'an item'}" was canceled`,
      relatedItem: item ? item._id : pickupRequest.item,
      relatedUser: userId,
      metadata: {
        requestId: pickupRequest._id,
        itemName: item ? item.name : 'Unknown'
      }
    });
    
    await notification.save();
    
    res.json({
      success: true,
      message: 'Pickup request canceled',
      data: pickupRequest
    });
    
  } catch (error) {
    console.error('Error canceling pickup request:', error);
    res.status(500).json({ 
      error: 'Failed to cancel pickup request',
      details: error.message 
    });
  }
};

module.exports = exports;
