# Payment Controller Updates for Store Item Inventory

## Problem
The payment controller marks items as 'sold' without decrementing quantity for store items. Store items should:
1. Decrement quantity by 1 when purchased
2. Update stockStatus (in_stock, low_stock, out_of_stock)
3. Stay 'available' if stock remains
4. Only get removed from listings when quantity hits 0

## Required Changes to `controllers/paymentController.js`

### 1. Add inventory service import
```javascript
const inventoryService = require('../services/inventoryService');
```

### 2. Update confirmPayment function (line ~178-189)

**Replace this:**
```javascript
// Update item status to sold
const item = await Item.findByIdAndUpdate(
  itemId,
  { 
    status: 'sold',
    buyerId: req.user._id,
    soldAt: new Date(),
    paymentIntentId: paymentIntentId,
    deliveryIncluded: includeDelivery === 'true',
    finalAmount: parseFloat(totalAmount)
  },
  { new: true }
);
```

**With this:**
```javascript
// Use inventory service for atomic stock management
const stockResult = await inventoryService.decrementStock(itemId, 1);

if (!stockResult.success && stockResult.outOfStock) {
  // Item sold out between payment intent and confirmation
  // Refund the payment automatically
  await stripe.refunds.create({
    payment_intent: paymentIntentId,
    reason: 'requested_by_customer',
    metadata: {
      reason: 'Item out of stock'
    }
  });
  
  return res.status(400).json({ 
    error: 'Item is now out of stock. Your payment has been automatically refunded.',
    refunded: true
  });
}

if (!stockResult.success) {
  return res.status(500).json({
    error: 'Failed to update inventory',
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

const item = await Item.findByIdAndUpdate(
  itemId,
  updateData,
  { new: true }
);
```

### 3. Update requestRefund function (line ~227+)

**After refund is created, add this to restore inventory:**
```javascript
// After successful refund creation
const refund = await stripe.refunds.create({
  charge: chargeId,
  reason: 'requested_by_customer',
  metadata: {
    itemId: item._id.toString(),
    reason: reason || 'No reason provided'
  }
});

// NEW: Restore inventory for store items
const stockResult = await inventoryService.incrementStock(itemId, 1);

if (!stockResult.success && !stockResult.skipQuantity) {
  console.error('Failed to restore inventory after refund:', stockResult.message);
  // Continue anyway - refund succeeded, inventory issue can be fixed manually
}

// Update item status to refunded
const updatedItem = await Item.findByIdAndUpdate(
  itemId,
  { 
    status: 'refunded',
    refundedAt: new Date(),
    refundReason: reason || 'No reason provided'
  },
  { new: true }
);
```

## Files to Create/Update

1. **Create**: `services/inventoryService.js` (provided in BACKEND_inventoryService.js)
2. **Update**: `controllers/paymentController.js` (apply changes above)
3. **Update**: `controllers/pickupRequestController.js` (provided in BACKEND_pickupRequestController_FIXED_STORE.js)

## Testing Checklist

### Store Item Purchase
- [ ] Create store item with quantity: 5
- [ ] Purchase via payment → quantity becomes 4, status stays 'available', stockStatus 'low_stock'
- [ ] Purchase 4 more → quantity becomes 0, status 'available', stockStatus 'out_of_stock'
- [ ] Try to purchase when quantity is 0 → payment auto-refunded with error

### Store Item Refund
- [ ] Purchase store item (quantity decreases)
- [ ] Request refund → quantity restored, item back to 'available'

### Regular Item Purchase
- [ ] Purchase regular item → status becomes 'sold' (no quantity involved)

### Regular Item Refund
- [ ] Refund regular item → status becomes 'refunded' (no quantity change)

## Race Condition Protection

The inventory service uses `findOneAndUpdate` with atomic `$inc` operations and stock guards:
```javascript
const updatedItem = await Item.findOneAndUpdate(
  {
    _id: itemId,
    quantity: { $gte: quantity } // Guard: ensure enough stock
  },
  {
    $inc: { quantity: -quantity } // Atomic decrement
  }
);
```

This prevents overselling if two buyers purchase the last item simultaneously.
