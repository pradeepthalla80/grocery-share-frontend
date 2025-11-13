# Complete Backend Update Instructions

## File: `controllers/pickupRequestController.js`

---

## ✅ STEP 1: Add Rating Import

**At the top of the file (line 5), ADD this line:**

```javascript
const PickupRequest = require('../models/PickupRequest');
const Item = require('../models/Item');
const User = require('../models/User');
const Notification = require('../models/Notification');
const inventoryService = require('../services/inventoryService');
const Rating = require('../models/Rating');  // ← ADD THIS LINE
```

---

## ✅ STEP 2: Replace getPickupRequests Function

**Find the function starting around line 133:**

```javascript
// Get all pickup requests (filtered by role)
const getPickupRequests = async (req, res) => {
```

**Replace the ENTIRE function (from line 133 to line 207) with this:**

```javascript
// Get all pickup requests (filtered by role)
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
    
    // For completed requests, check if users have rated each other
    const completedRequestIds = requests
      .filter(req => req.status === 'completed' && req.item && req.requester && req.seller)
      .map(req => req._id);
    
    let ratingMap = new Map();
    
    if (completedRequestIds.length > 0) {
      // Batch query all ratings for completed requests
      const ratings = await Rating.find({
        item: { $in: requests.map(r => r.item?._id).filter(Boolean) }
      }).select('item rater ratee');
      
      // Build a map for quick lookup: key = "itemId-raterId-rateeId", value = true
      ratings.forEach(rating => {
        const key = `${rating.item}-${rating.rater}-${rating.ratee}`;
        ratingMap.set(key, true);
      });
    }
    
    // Format response - filter out requests with missing data (deleted items/users)
    const formattedRequests = requests
      .filter(req => req.item && req.requester && req.seller) // Skip if any critical data is null
      .map(req => {
        const baseRequest = {
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
          createdAt: req.createdAt,
          acceptedAt: req.acceptedAt,
          completedAt: req.completedAt
        };
        
        // Add rating status for completed requests
        if (req.status === 'completed') {
          const itemId = req.item._id;
          const sellerId = req.seller._id;
          const buyerId = req.requester._id;
          
          // Check if seller has rated buyer
          const sellerRatedBuyerKey = `${itemId}-${sellerId}-${buyerId}`;
          const hasSellerRatedBuyer = ratingMap.has(sellerRatedBuyerKey);
          
          // Check if buyer has rated seller
          const buyerRatedSellerKey = `${itemId}-${buyerId}-${sellerId}`;
          const hasBuyerRatedSeller = ratingMap.has(buyerRatedSellerKey);
          
          baseRequest.hasSellerRatedBuyer = hasSellerRatedBuyer;
          baseRequest.hasBuyerRatedSeller = hasBuyerRatedSeller;
        }
        
        return baseRequest;
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
```

---

## 📋 Summary

**You need to make 2 changes:**

1. **Line 6:** Add `const Rating = require('../models/Rating');`
2. **Lines 133-207:** Replace entire `getPickupRequests` function with the version above

**The rest of the file stays the same!** All other functions (createPickupRequest, acceptPickupRequest, declinePickupRequest, etc.) remain unchanged.

---

## 🚀 After Making Changes

```bash
git add .
git commit -m "Add rating status flags to pickup requests"
git push origin main
```

Wait for Render to deploy (~2-3 minutes), then deploy the frontend!
