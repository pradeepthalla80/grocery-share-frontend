# Backend Fixes Required

You need to make 3 changes to your backend at: https://github.com/pradeepthalla80/grocery-share-backend

---

## 🐛 Issue 1: Distance showing "0.00 miles" for all items

**Problem:** Backend doesn't calculate distance from user's location to each item.

**File to edit:** `controllers/itemController.js`

**In the `searchItems` function**, find where you return the items and ADD distance calculation:

```javascript
// ADD this helper function at the TOP of itemController.js (before searchItems)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// THEN in searchItems function, AFTER fetching items, ADD distance to each item:
const itemsWithDistance = items.map(item => {
  const distance = calculateDistance(
    parseFloat(lat),
    parseFloat(lng),
    item.location.lat,
    item.location.lng
  );
  
  return {
    ...item.toObject(),
    distance: distance
  };
});

// RETURN itemsWithDistance instead of items
res.json({
  count: itemsWithDistance.length,
  radius: parseFloat(radius),
  items: itemsWithDistance
});
```

---

## 🐛 Issue 2: "Interested" button failing

**Problem:** Backend missing `/notifications/interest` endpoint.

**File to edit:** `routes/notifications.js`

**ADD this new route:**

```javascript
// POST /notifications/interest - Send interest notification
router.post('/interest', auth, async (req, res) => {
  try {
    const { itemId, itemName, type } = req.body;
    
    // Find the item to get the seller's ID
    const Item = require('../models/Item');
    const item = await Item.findById(itemId);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Don't send notification to yourself
    if (item.user.toString() === req.user.id) {
      return res.status(400).json({ error: 'Cannot send interest notification to yourself' });
    }
    
    // Create notification for the seller
    const Notification = require('../models/Notification');
    const notification = new Notification({
      user: item.user, // Send to the item owner/seller
      type: 'interest',
      message: `${req.user.name} is interested in your item: ${itemName}`,
      item: itemId,
      read: false
    });
    
    await notification.save();
    
    res.json({ message: 'Interest notification sent successfully' });
  } catch (error) {
    console.error('Error sending interest notification:', error);
    res.status(500).json({ error: 'Failed to send interest notification' });
  }
});
```

---

## 🐛 Issue 3: Notifications not appearing

**Problem:** GET /notifications endpoint may not be filtering correctly.

**File to check:** `routes/notifications.js`

**Make sure the GET route looks like this:**

```javascript
// GET /notifications - Get user's notifications
router.get('/', auth, async (req, res) => {
  try {
    const { unreadOnly } = req.query;
    
    const Notification = require('../models/Notification');
    
    const query = { user: req.user.id };
    if (unreadOnly === 'true') {
      query.read = false;
    }
    
    const notifications = await Notification.find(query)
      .populate('item', 'name price isFree imageURL images')
      .sort({ createdAt: -1 })
      .limit(50);
    
    const unreadCount = await Notification.countDocuments({ 
      user: req.user.id, 
      read: false 
    });
    
    res.json({
      count: unreadCount,
      notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});
```

---

## 📝 Notification Model Check

**File:** `models/Notification.js`

Make sure it has these fields:

```javascript
const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['nearby_free', 'nearby_discounted', 'expiring_soon', 'new_match', 'interest', 'pickup_request']
  },
  message: {
    type: String,
    required: true
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    default: null
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});
```

---

## ✅ Testing After Changes

1. **Push your backend changes to GitHub**
2. **Wait for Render to auto-deploy** (3-5 minutes)
3. **On your Vercel app:**
   - Hard refresh (Ctrl+Shift+R)
   - Check if distances show correctly
   - Click "Interested to Buy" button
   - Check notifications bell icon

---

## 🚨 Important Notes

- All 3 fixes are required for the app to work properly
- Make sure `auth` middleware is imported in notifications.js: `const auth = require('../middleware/auth');`
- Notification type 'interest' must be added to the enum in Notification model
- After deploying, test with a NEW item (old items won't have distance data)
