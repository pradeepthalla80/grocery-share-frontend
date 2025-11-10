# Store Owner Mode - Backend Updates

## Overview
This document contains all backend changes needed to implement Store Owner Mode.

## Database Model Changes

### 1. User Model (`models/User.js`)
Add the following fields to your existing User schema:

```javascript
// Store Owner Mode fields
isStoreOwner: {
  type: Boolean,
  default: false
},
storeMode: {
  type: Boolean,
  default: false
},
storeName: {
  type: String,
  default: null
},
storeAgreementAccepted: {
  type: Boolean,
  default: false
},
storeActivatedAt: {
  type: Date,
  default: null
}
```

### 2. Item Model (`models/Item.js`)
Add the following fields to your existing Item schema:

```javascript
// Store Item fields
isStoreItem: {
  type: Boolean,
  default: false
},
quantity: {
  type: Number,
  default: null, // null for regular community items, number for store items
  min: 0
},
stockStatus: {
  type: String,
  enum: ['in_stock', 'out_of_stock', 'low_stock', 'unlimited'],
  default: null // null for regular community items
},
originalQuantity: {
  type: Number,
  default: null
}
```

Also update the Item schema indexes:
```javascript
itemSchema.index({ isStoreItem: 1, stockStatus: 1 });
```

### 3. New Model: StoreAgreement
Create new file: `models/StoreAgreement.js` (see BACKEND_FILES/models-StoreAgreement.js)

## API Routes

### Create new route file: `routes/store.js`
See: BACKEND_FILES/routes-store.js

### Create new controller: `controllers/storeController.js`
See: BACKEND_FILES/controllers-storeController.js

## Update `index.js` to register Store routes

Add after your existing routes:

```javascript
const storeRoutes = require('./routes/store');
app.use('/api/v1/store', storeRoutes);
```

## Update Items Controller (`controllers/itemController.js`)

### Modify `getItems` function to handle store item filtering:

```javascript
exports.getItems = async (req, res) => {
  try {
    const { lat, lng, radius = 10, keyword, category, tags, onlyStoreItems } = req.query;

    let query = {};

    // Filter by store items if requested
    if (onlyStoreItems === 'true') {
      query.isStoreItem = true;
      query.stockStatus = { $ne: 'out_of_stock' }; // Exclude out-of-stock store items
    } else {
      // Mix both community and store items
      // Exclude out-of-stock store items
      query.$or = [
        { isStoreItem: false },
        { isStoreItem: true, stockStatus: { $ne: 'out_of_stock' } }
      ];
    }

    // Existing filters for keyword, category, tags...
    if (keyword) {
      query.name = { $regex: keyword, $options: 'i' };
    }

    if (category) {
      query.category = category;
    }

    if (tags) {
      query.tags = { $in: tags.split(',') };
    }

    // Location-based search
    if (lat && lng) {
      const items = await Item.find(query)
        .populate('user', 'name email')
        .lean();

      // Calculate distances and sort
      const itemsWithDistance = items.map(item => {
        const distance = calculateDistance(
          parseFloat(lat),
          parseFloat(lng),
          item.location.coordinates[1],
          item.location.coordinates[0]
        );
        return { ...item, distance };
      });

      const filteredItems = itemsWithDistance
        .filter(item => item.distance <= parseFloat(radius))
        .sort((a, b) => a.distance - b.distance); // Closest first

      return res.json({
        success: true,
        count: filteredItems.length,
        radius: parseFloat(radius),
        items: filteredItems
      });
    }

    // Non-location based search
    const items = await Item.find(query)
      .populate('user', 'name email')
      .lean();

    res.json({
      success: true,
      count: items.length,
      items
    });

  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching items',
      error: error.message
    });
  }
};
```

### Add new function to update stock:

```javascript
exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const item = await Item.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Only owner can update stock
    if (item.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this item'
      });
    }

    // Only store items have stock
    if (!item.isStoreItem) {
      return res.status(400).json({
        success: false,
        message: 'This is not a store item'
      });
    }

    item.quantity = quantity;
    
    // Update stock status
    if (quantity === 0) {
      item.stockStatus = 'out_of_stock';
    } else if (quantity <= 5) {
      item.stockStatus = 'low_stock';
    } else {
      item.stockStatus = 'in_stock';
    }

    await item.save();

    res.json({
      success: true,
      message: 'Stock updated successfully',
      item
    });

  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating stock',
      error: error.message
    });
  }
};
```

## Update Items Route (`routes/items.js`)

Add this route:

```javascript
router.put('/:id/stock', auth, itemController.updateStock);
```

## Environment Variables

No new environment variables required. Store Owner Mode uses existing:
- MONGODB_URI
- JWT_SECRET
- STRIPE_SECRET_KEY (for transaction viewing)

## Deployment Steps

1. Copy all files from `BACKEND_FILES/` to your backend repository:
   - `models/StoreAgreement.js` (new file)
   - Update `models/User.js` with new fields
   - Update `models/Item.js` with new fields
   - `routes/store.js` (new file)
   - `controllers/storeController.js` (new file)

2. Update `index.js` to register Store routes

3. Update `controllers/itemController.js` with enhanced search logic

4. Commit and push to GitHub:
   ```bash
   git add -A
   git commit -m "feat: Add Store Owner Mode backend support"
   git push origin main
   ```

5. Render will auto-deploy your backend

## Testing

Test these endpoints after deployment:

1. **Activate Store Mode**: `POST /api/v1/store/activate`
2. **Toggle Store Mode**: `PUT /api/v1/store/toggle`
3. **Get Store Items**: `GET /api/v1/store/my-store`
4. **Search with filter**: `GET /api/v1/items?onlyStoreItems=true&lat=X&lng=Y`
5. **Update Stock**: `PUT /api/v1/items/:id/stock`

## Mobile Considerations

All API responses are JSON and work seamlessly with mobile apps. No special mobile handling needed on backend.
