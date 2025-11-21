# Backend Fixes for Dashboard Errors (Nov 21, 2025)

## Issue Summary
The Dashboard is showing two backend errors:
1. **404 on `/api/v1/recommendations`** - Route not registered
2. **500 on `/api/v1/items`** - Missing geospatial index

---

## Fix 1: Register Recommendations Route

### File: `index.js`

**Add this import** (around line 52, after other route imports):
```javascript
const recommendationRoutes = require('./routes/recommendations');
```

**Add this route registration** (around line 78, after other route registrations):
```javascript
app.use('/api/v1/recommendations', recommendationRoutes);
```

### Complete Example:
```javascript
// Import Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const itemRoutes = require('./routes/items');
const chatRoutes = require('./routes/chat');
const notificationRoutes = require('./routes/notifications');
const paymentRoutes = require('./routes/payment');
const itemRequestRoutes = require('./routes/itemRequests');
const ratingRoutes = require('./routes/ratings');
const adminRoutes = require('./routes/admin');
const analyticsRoutes = require('./routes/analytics');
const contactRoutes = require('./routes/contact');
const addressRoutes = require('./routes/address');
const storeRoutes = require('./routes/store');
const pickupRequestsRoutes = require('./routes/pickupRequests');
const recommendationRoutes = require('./routes/recommendations'); // ← ADD THIS

// Use Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/items', itemRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/item-requests', itemRequestRoutes);
app.use('/api/v1/ratings', ratingRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/address', addressRoutes);
app.use('/api/v1/store', storeRoutes);
app.use('/api/v1/pickup-requests', pickupRequestsRoutes);
app.use('/api/v1/recommendations', recommendationRoutes); // ← ADD THIS
```

---

## Fix 2: Add Geospatial Index to Item Model

### File: `models/Item.js`

**Find the schema definition** and ensure this index exists at the bottom:

```javascript
// Add geospatial index for location-based queries
ItemSchema.index({ location: '2dsphere' });
```

If it's missing, add it before the `module.exports` line.

### Verify Index in MongoDB (Optional)
After deploying, you can verify the index was created:

```javascript
// In MongoDB shell or Compass:
db.items.getIndexes()

// Should show:
{
  "location_2dsphere": {
    "v": 2,
    "key": { "location": "2dsphere" },
    "name": "location_2dsphere"
  }
}
```

If the index doesn't auto-create after deployment, manually create it:
```javascript
db.items.createIndex({ location: "2dsphere" })
```

---

## Fix 3: Verify Item Data Format

Ensure all items in the database have `location` in GeoJSON format:

```javascript
{
  location: {
    type: "Point",
    coordinates: [longitude, latitude]  // [lng, lat] order is critical!
  }
}
```

**Common Issues:**
- ❌ Reversed coordinates: `[latitude, longitude]` (wrong!)
- ❌ Missing location field on old items
- ❌ Invalid GeoJSON structure

---

## Deployment Steps

1. **Update Backend Code:**
   - Add recommendations route to `index.js`
   - Add 2dsphere index to Item model

2. **Commit and Push:**
   ```bash
   git add .
   git commit -m "Fix: Register recommendations route and add geospatial index"
   git push origin main
   ```

3. **Wait for Render Auto-Deploy:**
   - Render will automatically deploy the changes
   - Monitor the deploy logs for errors

4. **Verify Fixes:**
   - Check Dashboard loads without errors
   - No more 404 on recommendations
   - No more 500 on items endpoint

---

## Testing After Deployment

Open browser console and verify:
- ✅ `GET /api/v1/items?lat=X&lng=Y&radius=50` returns 200
- ✅ `GET /api/v1/recommendations?lat=X&lng=Y&limit=6` returns 200
- ✅ Dashboard displays items without error messages

---

## Root Cause Analysis

### Why These Issues Occurred:

1. **Recommendations Route Never Registered:**
   - Route file was created but forgot to add to `index.js`
   - Classic "created but not connected" bug

2. **Missing Geospatial Index:**
   - MongoDB requires 2dsphere index for `$near` queries
   - Without it, queries fail with 500 error
   - May have been dropped during migration or never created

---

## Notes

- Both fixes are **safe** and **non-breaking**
- No database data changes required (only index addition)
- Existing items will work immediately after index creation
- The recommendations endpoint is already protected with auth middleware
