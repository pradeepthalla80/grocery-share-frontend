# Deployment Instructions - Item Visibility & Rating Flow Fix

## Overview
This deployment fixes two critical issues:
1. **Items disappearing after update** - Fixed item status filter
2. **Missing rating flow** - Added rating prompts after pickup completion

---

## 🎯 **Backend Deployment (CRITICAL - Deploy First!)**

### **File 1: controllers/itemsController.js**

**Line 279** - Change the status filter:

**OLD:**
```javascript
status: { $in: ['available', 'pending', 'picked_up'] }
```

**NEW:**
```javascript
status: 'available'
```

**Full context (lines 268-280):**
```javascript
// Build query filters
const query = {
  location: {
    $near: {
      $geometry: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      $maxDistance: radiusInMeters
    }
  },
  status: 'available'  // <-- CHANGE THIS LINE
};
```

**OR:** Copy entire file from `BACKEND_COMPLETE_itemsController_FIXED.js`

---

### **File 2: controllers/pickupRequestController.js**

**Step 1:** Add Rating import at the top:
```javascript
const Rating = require('../models/Rating');  // ADD THIS LINE
```

**Step 2:** Replace the entire `getPickupRequests` function

Copy the complete updated function from `BACKEND_PICKUP_REQUEST_RATING_UPDATE.js`

**Key changes:**
- Batch queries Rating collection for completed requests
- Returns `hasSellerRatedBuyer` and `hasBuyerRatedSeller` flags
- Uses efficient Map-based lookup to avoid N+1 queries

---

### **Deploy Backend:**
```bash
# In your backend repo:
git add .
git commit -m "Fix item visibility filter and add rating status flags"
git push origin main
```

**Wait for Render to deploy (~2-3 minutes)**

---

## 🎨 **Frontend Deployment (After Backend!)**

### **Files Modified:**
1. ✅ `src/pages/PickupRequests.tsx` - Added rating button and modal
2. ✅ `src/api/pickupRequests.ts` - Updated PickupRequest type

### **Deploy Frontend:**
```bash
# Frontend changes are already in your files - just commit:
git add .
git commit -m "Add rating flow after pickup completion"
git push origin main
```

**Vercel will auto-deploy (~1 minute)**

---

## ✅ **Testing Checklist**

### **Test 1: Item Visibility**
1. Create or update an item (status should be 'available')
2. Search for items in the default list
3. **Expected:** Item appears in search results
4. **Previous bug:** Item disappeared after update

### **Test 2: Rating Flow (Requires 2 Users)**

**Setup:**
1. User A lists an item
2. User B requests pickup (free or paid)
3. User A accepts pickup request
4. Both users confirm pickup completion

**Expected Behavior:**

**User A (Seller) - Selling Tab:**
- Sees "Rate {Buyer Name}" button (amber/yellow)
- Clicks button → Rating modal opens
- Submits 5-star rating
- Button changes to "🎉 Exchange Completed!"

**User B (Buyer) - Buying Tab:**
- Sees "Rate {Seller Name}" button (amber/yellow)
- Clicks button → Rating modal opens
- Submits 5-star rating
- Button changes to "🎉 Exchange Completed!"

**Rating prevents duplicates:**
- Each party can only rate once per item
- After rating, button disappears permanently

---

## 🐛 **Troubleshooting**

### **Rating button doesn't appear:**
1. Check backend deployment completed
2. Verify `hasSellerRatedBuyer` and `hasBuyerRatedSeller` fields in API response
3. Check browser console for errors

### **Items still disappearing:**
1. Verify backend line 279 was updated correctly
2. Check item status in database (should be 'available')
3. Clear browser cache

### **API Verification:**
```bash
# Check if rating flags are returned:
curl "https://grocery-share-backend.onrender.com/api/v1/pickup-requests?role=seller" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should include:
# "hasSellerRatedBuyer": false,
# "hasBuyerRatedSeller": false
```

---

## 📊 **Impact**

- ✅ Items no longer disappear from search after updates
- ✅ Both parties can rate each other after pickup
- ✅ Rating system fully integrated with pickup flow
- ✅ Prevents duplicate ratings
- ✅ Mobile-responsive rating buttons

---

## 🔄 **Rollback (If Needed)**

### **Backend Rollback:**
```bash
# Line 279: Revert to old filter (not recommended)
status: { $in: ['available', 'pending', 'picked_up'] }
```

### **Frontend Rollback:**
```bash
git revert HEAD
git push origin main
```
