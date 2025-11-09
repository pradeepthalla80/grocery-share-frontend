# Backend API Requirements for Production Readiness

## Overview
This document outlines the backend improvements needed to make Grocery Share production-ready and fully compliant with best practices for iOS/Android app deployment.

## 1. API Versioning Structure

### Current State
- Routes use `/api/` prefix without versioning
- Example: `/api/items`, `/api/item-requests`

### Required Changes
**All routes should follow `/api/v1/` structure:**

```
/api/v1/items
/api/v1/item-requests
/api/v1/users
/api/v1/auth
/api/v1/chat
/api/v1/notifications
/api/v1/payments
/api/v1/admin
/api/v1/analytics
```

### Implementation
Update route files to include version prefix:

```javascript
// routes/index.js
const express = require('express');
const router = express.Router();

// API v1 routes
router.use('/api/v1/items', require('./items'));
router.use('/api/v1/item-requests', require('./itemRequests'));
router.use('/api/v1/users', require('./users'));
router.use('/api/v1/auth', require('./auth'));
// ... etc
```

---

## 2. Standardized JSON Responses

### Current State
Inconsistent response formats across endpoints

### Required Format
All API responses should follow this structure:

```json
{
  "success": true,
  "data": { ... },
  "message": "Success message",
  "timestamp": "2025-11-08T23:00:00.000Z"
}
```

**Error responses:**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-11-08T23:00:00.000Z"
}
```

### Implementation
Create middleware for response standardization:

```javascript
// middleware/responseFormatter.js
module.exports.successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  });
};

module.exports.errorResponse = (res, error, code = 'ERROR', statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    error,
    code,
    timestamp: new Date().toISOString()
  });
};
```

---

## 3. Admin Endpoints (Platform-Wide Data)

### Missing Endpoints
The admin dashboard currently uses user-specific endpoints. We need platform-wide admin endpoints:

#### GET /api/v1/admin/stats
Returns platform-wide statistics
```json
{
  "success": true,
  "data": {
    "totalUsers": 1247,
    "totalItems": 3892,
    "totalRequests": 1563,
    "activeUsers": 892,
    "totalTransactions": 2341
  }
}
```

#### GET /api/v1/admin/items
Returns all items across the platform (with pagination)
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 3892,
    "page": 1,
    "limit": 50
  }
}
```

#### GET /api/v1/admin/requests
Returns all requests across the platform
```json
{
  "success": true,
  "data": {
    "requests": [...],
    "total": 1563,
    "page": 1,
    "limit": 50
  }
}
```

#### GET /api/v1/admin/users
Returns all users (admin only)
```json
{
  "success": true,
  "data": {
    "users": [...],
    "total": 1247,
    "page": 1,
    "limit": 50
  }
}
```

---

## 4. Analytics Endpoint

### GET /api/v1/analytics/impact
Public endpoint showing community impact

```json
{
  "success": true,
  "data": {
    "totalUsers": 1247,
    "totalItems": 3892,
    "totalRequests": 1563,
    "foodSavedLbs": 8934,
    "activeCommunities": 47,
    "successfulShares": 2341,
    "carbonSavedKg": 4023
  }
}
```

---

## 5. User Schema Updates

### Required Fields
Ensure these fields exist in the User model:

```javascript
{
  role: {
    type: String,
    enum: ['user', 'admin', 'super_admin'],
    default: 'user'
  },
  notificationsEnabled: {
    type: Boolean,
    default: true
  },
  notificationToken: {
    type: String,
    default: null  // For push notifications (future iOS/Android)
  },
  deviceTokens: [{
    token: String,
    platform: { type: String, enum: ['ios', 'android', 'web'] },
    addedAt: { type: Date, default: Date.now }
  }]
}
```

---

## 6. MongoDB Query Optimization

### Add Indexes
```javascript
// User model
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// Item model
itemSchema.index({ user: 1, status: 1 });
itemSchema.index({ location: '2dsphere' });
itemSchema.index({ createdAt: -1 });
itemSchema.index({ status: 1, expiresAt: 1 });

// ItemRequest model
itemRequestSchema.index({ user: 1, status: 1 });
itemRequestSchema.index({ location: '2dsphere' });
itemRequestSchema.index({ status: 1, createdAt: -1 });

// Message model
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ read: 1 });
```

### Use Lean Queries
For read-only operations, use `.lean()` to improve performance:

```javascript
const items = await Item.find({ status: 'active' })
  .lean()
  .limit(50);
```

---

## 7. Error Handling

### Centralized Error Middleware
```javascript
// middleware/errorHandler.js
module.exports = (err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: Object.values(err.errors).map(e => e.message).join(', '),
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString()
    });
  }

  // Mongoose duplicate key errors
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      error: 'Duplicate entry found',
      code: 'DUPLICATE_ERROR',
      timestamp: new Date().toISOString()
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
      timestamp: new Date().toISOString()
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  });
};
```

---

## 8. Logging

### Add Request Logging
```javascript
// middleware/logger.js
const morgan = require('morgan');

module.exports = morgan('combined', {
  skip: (req, res) => res.statusCode < 400
});
```

---

## 9. Security Headers

### Add Security Middleware
```javascript
const helmet = require('helmet');
const cors = require('cors');

// In app.js
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://grocery-share.vercel.app',
  credentials: true
}));
```

---

## 10. Rate Limiting

### Protect API from Abuse
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## Summary of Priority Tasks

### High Priority (Must Have for Production)
1. ✅ API versioning (/api/v1/)
2. ✅ Standardized JSON responses
3. ✅ Admin platform-wide endpoints
4. ✅ Analytics endpoint
5. ✅ Error handling middleware
6. ✅ MongoDB indexes

### Medium Priority (Should Have)
7. ✅ User schema updates (notification fields)
8. ✅ Request logging
9. ✅ Security headers (Helmet)

### Lower Priority (Nice to Have)
10. ✅ Rate limiting
11. Query optimization with .lean()

---

## Testing Checklist

After implementing these changes:

- [ ] All endpoints return standardized JSON
- [ ] All routes use /api/v1/ prefix
- [ ] Admin can view platform-wide stats
- [ ] Analytics endpoint returns impact data
- [ ] Error responses are consistent
- [ ] MongoDB queries use proper indexes
- [ ] Security headers are in place
- [ ] Rate limiting is active

---

**Note:** Frontend API client will need to be updated to use `/api/v1/` routes after backend changes are deployed.
