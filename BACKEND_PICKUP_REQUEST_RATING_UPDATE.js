/**
 * UPDATED getPickupRequests function with Rating Checks
 * 
 * INSTRUCTIONS:
 * 1. In your backend pickupRequestController.js, replace the existing getPickupRequests function
 * 2. Add Rating model import at the top: const Rating = require('../models/Rating');
 * 3. Deploy to Render
 * 
 * CHANGES:
 * - Added rating status checks for completed pickup requests
 * - Returns hasSellerRatedBuyer and hasBuyerRatedSeller flags
 * - Batch queries ratings for performance
 */

const Rating = require('../models/Rating'); // ADD THIS IMPORT AT TOP OF FILE

// Replace the existing getPickupRequests function with this updated version:
const getPickupRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { role, status } = req.query; // role: 'seller' or 'requester'
    
    let query = {};
    
    // Build query based on role
    if (role === 'seller') {
      query.seller = userId;
    } else if (role === 'requester') {
      query.requester = userId;
    } else {
      // Default: get all requests where user is either seller or requester
      query.$or = [
        { seller: userId },
        { requester: userId }
      ];
    }
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    const requests = await PickupRequest.find(query)
      .populate('item', 'name imageURL price isFree location address')
      .populate('requester', 'name email')
      .populate('seller', 'name email')
      .sort({ createdAt: -1 });
    
    // Filter out requests with missing data (deleted items/users)
    const validRequests = requests.filter(req => req.item && req.requester && req.seller);
    
    // NEW: For completed requests, check if users have rated each other
    // Extract all completed request item IDs
    const completedRequests = validRequests.filter(req => req.status === 'completed');
    const completedItemIds = completedRequests.map(req => req.item._id);
    
    // Batch query all ratings for completed items to avoid N+1 queries
    let ratingsMap = new Map();
    if (completedItemIds.length > 0) {
      const ratings = await Rating.find({
        item: { $in: completedItemIds }
      }).select('rater ratee item');
      
      // Build map: `${itemId}_${raterId}_${rateeId}` => true
      ratings.forEach(rating => {
        const key = `${rating.item}_${rating.rater}_${rating.ratee}`;
        ratingsMap.set(key, true);
      });
    }
    
    // Format response with rating status flags
    const formattedRequests = validRequests.map(req => {
      let hasSellerRatedBuyer = false;
      let hasBuyerRatedSeller = false;
      
      // For completed requests, check if ratings exist
      if (req.status === 'completed') {
        const itemId = req.item._id.toString();
        const sellerId = req.seller._id.toString();
        const buyerId = req.requester._id.toString();
        
        // Check if seller rated buyer
        const sellerRatedKey = `${itemId}_${sellerId}_${buyerId}`;
        hasSellerRatedBuyer = ratingsMap.has(sellerRatedKey);
        
        // Check if buyer rated seller
        const buyerRatedKey = `${itemId}_${buyerId}_${sellerId}`;
        hasBuyerRatedSeller = ratingsMap.has(buyerRatedKey);
      }
      
      return {
        id: req._id,
        item: {
          id: req.item._id,
          name: req.item.name,
          imageURL: req.item.imageURL,
          price: req.item.price,
          isFree: req.item.isFree
        },
        requester: {
          id: req.requester._id,
          name: req.requester.name,
          email: req.requester.email
        },
        seller: {
          id: req.seller._id,
          name: req.seller.name,
          email: req.seller.email
        },
        requestType: req.requestType,
        status: req.status,
        deliveryMode: req.deliveryMode,
        sellerAddress: req.sellerAddress,
        sellerInstructions: req.sellerInstructions,
        buyerConfirmed: req.buyerConfirmed,
        sellerConfirmed: req.sellerConfirmed,
        amountPaid: req.amountPaid,
        // NEW: Rating status flags
        hasSellerRatedBuyer,
        hasBuyerRatedSeller,
        createdAt: req.createdAt,
        acceptedAt: req.acceptedAt,
        completedAt: req.completedAt
      };
    });
    
    res.json({
      success: true,
      count: formattedRequests.length,
      requests: formattedRequests
    });
    
  } catch (error) {
    console.error('Get pickup requests error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch pickup requests',
      details: error.message 
    });
  }
};
