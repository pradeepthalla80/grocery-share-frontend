# Debug: Items Disappearing After Update

## Quick Test

After updating an item, check its status in the database:

**Option 1: Check via API**
```javascript
// In browser console, replace ITEM_ID with your item's ID
fetch('https://grocery-share-backend.onrender.com/api/v1/items/ITEM_ID', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(data => {
    console.log('Item status:', data.item.status);
    console.log('Full item:', data.item);
  });
```

**Option 2: Check in MongoDB directly**
Look at the item's `status` field after updating it.

---

## Likely Causes

### **Cause 1: Mongoose Pre-Save Hook**
The Item model might have a `pre('save')` hook that's changing status.

**Check:** Look in `models/Item.js` for:
```javascript
itemSchema.pre('save', function(next) {
  // Something here might be changing this.status
});
```

### **Cause 2: Default Status Value**
The Item model might have a default status that's being applied on update.

**Check:** Look in `models/Item.js` for:
```javascript
status: {
  type: String,
  default: 'pending' // or something other than 'available'
}
```

### **Cause 3: Frontend Sending Status**
The frontend update request might be sending `status` in the body.

**Check:** Look in your frontend Item update code for `status` being sent.

---

## The Fix

**In `controllers/itemsController.js`, updateItem function (line 612):**

Add this BEFORE `await item.save()`:

```javascript
// Preserve status unless explicitly changing it
// Items should stay 'available' after updates unless in active pickup flow
if (item.status !== 'awaiting_pickup' && item.status !== 'completed') {
  item.status = 'available';
}

await item.save();
```

This ensures items maintain 'available' status after updates.
