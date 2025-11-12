# Pickup Request Controller - Inventory Service Integration

## Step 1: Add Inventory Service Import

**At the top of the file** (after line 4), add:
```javascript
const PickupRequest = require('../models/PickupRequest');
const Item = require('../models/Item');
const User = require('../models/User');
const Notification = require('../models/Notification');
const inventoryService = require('../services/inventoryService');  // ← ADD THIS LINE
```

---

## Step 2: Update confirmPickupCompletion Function

**Find this code** (lines 404-408):
```javascript
// If both confirmed, update item status to completed
if (pickupRequest.status === 'completed') {
  await Item.findByIdAndUpdate(pickupRequest.item._id, {
    status: 'completed'
  });
```

**Replace with:**
```javascript
// If both confirmed, handle inventory and status updates
if (pickupRequest.status === 'completed') {
  // Use inventory service for atomic stock management
  const stockResult = await inventoryService.decrementStock(pickupRequest.item._id, 1);
  
  if (!stockResult.success && stockResult.outOfStock) {
    // Unlikely scenario: item sold out between confirmation steps
    return res.status(400).json({
      error: 'Item is no longer available',
      details: stockResult.message
    });
  }
  
  if (!stockResult.success) {
    console.error('Failed to update inventory:', stockResult.message);
    return res.status(500).json({
      error: 'Exchange completed but inventory update failed',
      details: stockResult.message
    });
  }
  
  // For regular items (not store items), mark as completed
  if (stockResult.skipQuantity) {
    await Item.findByIdAndUpdate(pickupRequest.item._id, {
      status: 'completed'
    });
  }
  // Note: Store items stay 'available' with decremented quantity
```

**Keep everything else the same** - all the notification logic after this stays unchanged.

---

## Step 3: Optional - Add Stock Check to createPickupRequest

**Find this code** (lines 29-33):
```javascript
// Check if item is available - only allow requests on 'available' items
if (item.status !== 'available') {
  return res.status(400).json({ 
    error: `This item is no longer available (status: ${item.status})` 
  });
}
```

**Add this right after** (before line 35):
```javascript
// For store items, also check if they have stock
if (item.isStoreItem && item.quantity !== null && item.quantity <= 0) {
  return res.status(400).json({ 
    error: 'This store item is out of stock' 
  });
}
```

---

## Summary of Changes

✅ **Line ~5**: Add inventory service import  
✅ **Lines ~32-37**: Add stock check for store items (optional but recommended)  
✅ **Lines ~404-408**: Replace simple status update with inventory-aware logic  

## What This Does

### For Regular Items (community sharing):
- Decrements nothing (single-use items)
- Marks item as `completed`
- ✅ Same behavior as before

### For Store Items (inventory):
- Atomically decrements quantity by 1
- Updates stockStatus (in_stock/low_stock/out_of_stock)
- Keeps item `available` if stock remains
- Only hides item when quantity hits 0
- ✅ **NEW: Proper multi-quantity support**

## Testing After Deployment

1. **Regular Item Test**: Free pickup request → complete → item marked 'completed' ✓
2. **Store Item Test**: Store item (qty: 5) → pickup → qty becomes 4, stays 'available' ✓
3. **Store Item Last One**: Store item (qty: 1) → pickup → qty becomes 0, stockStatus 'out_of_stock' ✓
