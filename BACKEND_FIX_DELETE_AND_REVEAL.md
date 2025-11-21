# Backend Fixes - Admin Delete & Reveal Address (Nov 21, 2025)

## 🔴 Issue 1: Admin Cannot Delete Items

**Error:** "Not authorized to delete this item" when admin tries to delete

**Root Cause:**  
Line 683 in `controllers/itemsController.js` only checks if user is the owner, doesn't check if user is admin.

**Current Code (Line 683):**
```javascript
// Check ownership (convert both to strings for comparison)
if (item.user.toString() !== req.user.userId.toString()) {
  return res.status(403).json({ error: 'Not authorized to delete this item' });
}
```

**Fixed Code:**
```javascript
// Check ownership OR admin role (convert both to strings for comparison)
const isOwner = item.user.toString() === req.user.userId.toString();
const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';

if (!isOwner && !isAdmin) {
  return res.status(403).json({ error: 'Not authorized to delete this item' });
}
```

---

## 🔴 Issue 2: Reveal Address "Not Part of Conversation" Error

**Error:** "You are not part of this conversation" when trying to reveal address

**Root Cause:**  
Line 15 in `controllers/addressController.js` doesn't properly convert ObjectId to string for comparison.

**Current Code (Line 14-16):**
```javascript
const isParticipant = conversation.participants.some(
  p => p.toString() === req.user.userId
);
```

**Fixed Code:**
```javascript
const isParticipant = conversation.participants.some(
  p => p.toString() === req.user.userId.toString()
);
```

---

## 📝 Complete Fixed Sections

### Fix 1: itemsController.js (Lines 670-697)

**Replace the entire `deleteItem` function:**

```javascript
// Delete an item (protected route - only owner or admin can delete)
const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find item
    const item = await Item.findById(id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Check ownership OR admin role (convert both to strings for comparison)
    const isOwner = item.user.toString() === req.user.userId.toString();
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to delete this item' });
    }
    
    await Item.findByIdAndDelete(id);
    
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ 
      error: 'Error deleting item',
      details: error.message 
    });
  }
};
```

### Fix 2: addressController.js (Lines 1-62)

**Replace the entire `revealAddress` function:**

```javascript
const Conversation = require('../models/Conversation');
const Item = require('../models/Item');

exports.revealAddress = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      p => p.toString() === req.user.userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ error: 'You are not part of this conversation' });
    }

    const alreadyRevealed = conversation.revealedBy.some(
      r => r.user.toString() === req.user.userId.toString()
    );

    if (alreadyRevealed) {
      return res.status(400).json({ error: 'You have already agreed to reveal the address' });
    }

    conversation.revealedBy.push({
      user: req.user.userId,
      revealedAt: new Date()
    });

    if (conversation.revealedBy.length === conversation.participants.length) {
      conversation.addressRevealed = true;
    }

    await conversation.save();

    let fullAddress = null;
    if (conversation.addressRevealed && conversation.item) {
      const item = await Item.findById(conversation.item);
      if (item) {
        fullAddress = item.address;
      }
    }

    res.json({
      message: conversation.addressRevealed 
        ? 'Address revealed to both parties' 
        : 'Waiting for other party to agree',
      addressRevealed: conversation.addressRevealed,
      address: fullAddress,
      revealedBy: conversation.revealedBy.length,
      totalParticipants: conversation.participants.length
    });
  } catch (error) {
    console.error('Reveal address error:', error);
    res.status(500).json({ error: 'Failed to reveal address' });
  }
};
```

---

## 🚀 Deployment

### Files to Update:
1. `controllers/itemsController.js` - Update deleteItem function
2. `controllers/addressController.js` - Update revealAddress function

### Deploy Commands:
```bash
git add controllers/itemsController.js controllers/addressController.js
git commit -m "Fix: Allow admin to delete items + fix reveal address participant check"
git push origin main
```

---

## ✅ Expected Results

**After Deployment:**

**Issue 1 Fixed:**
- ✅ Admin can delete any item
- ✅ Regular users can still delete their own items
- ✅ Users cannot delete other users' items (unless admin)

**Issue 2 Fixed:**
- ✅ Reveal address works correctly
- ✅ Participants can agree to reveal address
- ✅ No more "not part of conversation" errors

---

## 🧪 Testing Steps

**Test Admin Delete:**
1. Login as admin
2. Go to Admin Dashboard
3. Try to delete any item
4. Should delete successfully ✓

**Test Reveal Address:**
1. Start a conversation about an item
2. Click "Reveal Address" button
3. Should show "Waiting for other party" ✓
4. Other party clicks "Reveal Address"
5. Address should be revealed ✓

---

## 📊 Summary of Changes

| File | Function | Line | Change |
|------|----------|------|--------|
| itemsController.js | deleteItem | 683-686 | Added admin role check |
| addressController.js | revealAddress | 15-16 | Added .toString() to req.user.userId |

---

Both fixes are simple one-line additions that will resolve the errors immediately! 🎉
