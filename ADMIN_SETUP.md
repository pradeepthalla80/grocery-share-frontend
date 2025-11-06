# Admin/Super Admin Setup Guide

This document explains how to set up and use the admin system in Grocery Share.

## Overview

The platform supports **role-based access control** with three roles:
- `user` (default) - Regular users
- `admin` - Administrators with delete/moderation powers  
- `super_admin` - Super administrators with full control

## Frontend Implementation

### User Role Field
The User interface now includes a `role` field:
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role?: 'user' | 'admin' | 'super_admin';
  createdAt?: string;
  googleId?: string;
}
```

### Admin Utilities
- `useAdmin()` hook - Easy access to admin permissions
- Admin utility functions in `src/utils/adminUtils.ts`

### Admin Features
1. **Admin Dashboard** (`/admin` route)
   - View all items and requests
   - Platform statistics
   - Delete any content
   - Only visible to admins

2. **Admin Delete Buttons**
   - Red "Admin Controls" section on item/request details
   - Only visible to admins on content they don't own
   - Confirmation prompts for safety

3. **Admin Navigation Link**
   - Purple "Admin" link in navbar
   - Shield icon
   - Only visible to users with admin role

## ⚠️ Important: Backend Requirements

**The admin system frontend is complete but requires backend support to function fully.**

### Current Limitations (Without Backend Changes)
- Admin Dashboard shows only admin's own items/requests (not platform-wide)
- Admin delete buttons exist but may need elevated permissions on backend
- Statistics are incomplete without admin endpoints

### What the Backend MUST Implement

## Backend Setup Required

To enable admin functionality, your backend needs to:

### 1. Update User Schema
Add a `role` field to your User model:

```javascript
// MongoDB Example (Mongoose)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: {
    type: String,
    enum: ['user', 'admin', 'super_admin'],
    default: 'user'
  },
  // ... other fields
});
```

### 2. Include Role in JWT Token
When generating JWT tokens, include the user's role:

```javascript
const token = jwt.sign(
  { 
    id: user._id, 
    email: user.email,
    role: user.role  // ← Add this
  },
  process.env.JWT_SECRET
);
```

### 3. Send Role in API Responses
Include `role` in user data sent to frontend:

```javascript
// Login/Register response
res.json({
  token,
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,  // ← Add this
    createdAt: user.createdAt
  }
});
```

### 4. OAuth Callback
For Google OAuth, include role in the callback URL:

```javascript
// Backend OAuth callback handler
const callbackURL = `${process.env.FRONTEND_URL}/auth/callback?token=${token}&userId=${user._id}&name=${encodeURIComponent(user.name)}&email=${user.email}&role=${user.role}`;
```

Then update the frontend OAuth handler to read the role parameter.

### 5. Create Admin Middleware (Required)
Protect admin-only endpoints:

```javascript
const requireAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Use on admin endpoints
router.delete('/items/:id', requireAdmin, deleteItemAdmin);
router.get('/admin/items', requireAdmin, getAllItems);
router.get('/admin/requests', requireAdmin, getAllRequests);
```

### 6. Create Admin Endpoints (Required for Dashboard)

The frontend Admin Dashboard needs these endpoints:

```javascript
// GET /admin/items - Get all items (platform-wide)
router.get('/admin/items', requireAdmin, async (req, res) => {
  const items = await Item.find()
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(100);
  
  res.json({ items, count: items.length });
});

// GET /admin/requests - Get all requests (platform-wide)
router.get('/admin/requests', requireAdmin, async (req, res) => {
  const requests = await ItemRequest.find()
    .populate('user', 'name email')
    .populate('responses.user', 'name email')
    .sort({ createdAt: -1 })
    .limit(100);
  
  res.json(requests);
});

// GET /admin/stats - Get platform statistics
router.get('/admin/stats', requireAdmin, async (req, res) => {
  const [itemCount, requestCount, userCount] = await Promise.all([
    Item.countDocuments(),
    ItemRequest.countDocuments(),
    User.countDocuments()
  ]);
  
  res.json({
    totalItems: itemCount,
    totalRequests: requestCount,
    totalUsers: userCount,
    activeUsers: userCount // Can be refined with activity tracking
  });
});

// DELETE /items/:id - Allow admins to delete any item
router.delete('/items/:id', requireAdmin, async (req, res) => {
  const item = await Item.findByIdAndDelete(req.params.id);
  
  // Log admin action
  console.log(`Admin ${req.user.id} deleted item ${req.params.id}`);
  
  res.json({ message: 'Item deleted by admin' });
});

// DELETE /requests/:id - Allow admins to delete any request  
router.delete('/requests/:id', requireAdmin, async (req, res) => {
  const request = await ItemRequest.findByIdAndDelete(req.params.id);
  
  // Log admin action
  console.log(`Admin ${req.user.id} deleted request ${req.params.id}`);
  
  res.json({ message: 'Request deleted by admin' });
});
```

## Making a User Admin

### Method 1: Direct Database Update (Quickest)
Connect to your MongoDB database and update a user's role:

```javascript
// MongoDB Shell
db.users.updateOne(
  { email: "youremail@example.com" },
  { $set: { role: "super_admin" } }
);
```

Or using MongoDB Compass:
1. Find the user by email
2. Edit the document
3. Add field: `role: "super_admin"`
4. Save

### Method 2: Create Admin Endpoint (Secure)
Create a one-time setup endpoint (remove after creating first admin):

```javascript
// TEMPORARY - Remove after creating first admin!
router.post('/setup/create-admin', async (req, res) => {
  const { email, secretKey } = req.body;
  
  // Use a secret key for security
  if (secretKey !== process.env.ADMIN_SETUP_SECRET) {
    return res.status(403).json({ error: 'Invalid secret key' });
  }
  
  const user = await User.findOneAndUpdate(
    { email },
    { role: 'super_admin' },
    { new: true }
  );
  
  res.json({ message: 'Admin created', user });
});
```

### Method 3: Environment Variable
Set the first admin's email in environment variables:

```javascript
// On app startup
if (process.env.SUPER_ADMIN_EMAIL) {
  await User.findOneAndUpdate(
    { email: process.env.SUPER_ADMIN_EMAIL },
    { role: 'super_admin' },
    { upsert: false }
  );
}
```

## Testing Admin Access

1. Make yourself admin using one of the methods above
2. **Logout and login again** (important - frontend needs new JWT with role)
3. You should see:
   - Purple "Admin" link in navbar
   - Access to `/admin` dashboard
   - Red "Admin Controls" on items/requests you don't own

## Security Best Practices

1. **Never** expose admin status in public APIs
2. **Always** verify role on the backend for admin operations
3. **Log** all admin actions for audit trail
4. **Limit** the number of super_admin accounts (ideally 1-2)
5. **Verify** user identity before granting admin access
6. **Remove** any setup endpoints after creating first admin

## Admin Capabilities

### Current (Implemented on Frontend)
- ✅ View all items and requests
- ✅ Delete any item
- ✅ Delete any request  
- ✅ Access admin dashboard
- ✅ View platform statistics

### Recommended Backend Additions
- 📊 Analytics and reporting endpoints
- 👥 User management endpoints (ban, suspend)
- 📝 Content moderation endpoints
- 📧 Notification management
- 🔍 Advanced search/filtering for admins
- 📜 Audit log viewing

## Troubleshooting

**Problem:** Admin link not showing in navbar  
**Solution:** 
1. Check user.role is set correctly in backend
2. Verify JWT includes role field
3. Logout and login to get new JWT with role

**Problem:** "Access denied" on admin dashboard  
**Solution:** 
1. Ensure backend sends role in login/OAuth response
2. Check localStorage: `JSON.parse(localStorage.getItem('grocery_share_user'))`
3. Verify role is 'admin' or 'super_admin'

**Problem:** Delete buttons not working  
**Solution:**
1. Check backend has DELETE endpoints for items/requests
2. Verify admin middleware allows the operation
3. Check browser console for error messages

## Example: Complete Backend Admin Setup

```javascript
// 1. User Model (Mongoose)
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: {
    type: String,
    enum: ['user', 'admin', 'super_admin'],
    default: 'user'
  },
  googleId: String,
  createdAt: { type: Date, default: Date.now }
});

// 2. Middleware
const requireAdmin = (req, res, next) => {
  if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// 3. Login Route
router.post('/auth/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  // ... verify password ...
  
  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET
  );
  
  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// 4. Admin Endpoint Example
router.delete('/items/:id', requireAdmin, async (req, res) => {
  const item = await Item.findByIdAndDelete(req.params.id);
  
  // Log admin action
  await AuditLog.create({
    adminId: req.user.id,
    action: 'DELETE_ITEM',
    itemId: req.params.id,
    timestamp: new Date()
  });
  
  res.json({ message: 'Item deleted' });
});
```

## Questions?

Contact the development team or check the following files:
- `src/hooks/useAdmin.ts` - Admin hook
- `src/utils/adminUtils.ts` - Admin utilities
- `src/pages/AdminDashboard.tsx` - Admin dashboard
- `src/context/AuthContext.tsx` - User role handling
