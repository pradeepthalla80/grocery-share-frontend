# Backend Implementation: HttpOnly Cookie Authentication

## Overview
This guide shows how to migrate from JWT Bearer tokens to HttpOnly cookies to support browsers with strict tracking prevention (Edge, Safari).

---

## Why This Is Needed

**Problem:** Client-side storage (localStorage, cookies set by JavaScript) is blocked by strict tracking prevention in Edge/Safari.

**Solution:** Backend sets HttpOnly cookies that are automatically sent with every request, bypassing client-side storage restrictions.

---

## Backend Changes Required

### 1. Update Authentication Middleware

**File:** `middleware/auth.js` (or wherever your auth middleware is)

**Current Code (Bearer Token):**
```javascript
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new Error();
    }
    // ... verify JWT and attach user
  } catch (error) {
    res.status(401).send({ error: 'Please authenticate' });
  }
};
```

**New Code (HttpOnly Cookie):**
```javascript
const auth = async (req, res, next) => {
  try {
    // Try cookie first (new method)
    let token = req.cookies.grocery_share_token;
    
    // Fallback to Authorization header (for backwards compatibility during migration)
    if (!token) {
      token = req.header('Authorization')?.replace('Bearer ', '');
    }
    
    if (!token) {
      throw new Error('No token provided');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).send({ error: 'Please authenticate' });
  }
};
```

---

### 2. Install cookie-parser (if not already installed)

```bash
npm install cookie-parser
```

**Add to index.js (or main server file):**
```javascript
const cookieParser = require('cookie-parser');

// Add BEFORE routes
app.use(cookieParser());
```

---

### 3. Update CORS Configuration

**File:** `index.js` (main server file)

**Current CORS:**
```javascript
app.use(cors({
  origin: ['https://grocery-share-frontend.vercel.app', ...],
  credentials: false  // or not specified
}));
```

**New CORS (with credentials):**
```javascript
app.use(cors({
  origin: [
    'https://grocery-share-frontend.vercel.app',
    'http://localhost:5000',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,  // CRITICAL: Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

### 4. Update Login Endpoints to Set HttpOnly Cookies

#### A. Email/Password Login

**File:** `controllers/authController.js` (or wherever login is handled)

**Find the login function and ADD cookie setting:**
```javascript
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // ... existing validation and user lookup
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });
    
    // NEW: Set HttpOnly cookie
    res.cookie('grocery_share_token', token, {
      httpOnly: true,      // Not accessible via JavaScript (XSS protection)
      secure: true,        // HTTPS only (works on Vercel, not localhost HTTP)
      sameSite: 'none',    // Required for cross-domain (frontend on Vercel, backend on Render)
      maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
      path: '/'
    });
    
    // KEEP: Also return token in response for backwards compatibility
    res.json({
      success: true,
      token,  // Keep this during migration
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
```

#### B. Google OAuth Callback

**File:** `controllers/authController.js` (Google OAuth endpoint)

**Find the Google callback and ADD cookie setting:**
```javascript
const googleCallback = async (req, res) => {
  try {
    // ... existing Google OAuth logic to get user
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });
    
    // NEW: Set HttpOnly cookie
    res.cookie('grocery_share_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });
    
    // Redirect to frontend with token in URL (existing behavior)
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (error) {
    res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
  }
};
```

---

### 5. Add Logout Endpoint to Clear Cookie

**File:** `routes/auth.js`

**Add new logout route:**
```javascript
router.post('/logout', auth, async (req, res) => {
  try {
    // Clear the HttpOnly cookie
    res.cookie('grocery_share_token', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 0,  // Expire immediately
      path: '/'
    });
    
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});
```

---

### 6. Environment Variables

Ensure these are set in Render:

```
JWT_SECRET=your_secret_here
FRONTEND_URL=https://grocery-share-frontend.vercel.app
NODE_ENV=production
```

---

## Testing the Backend Changes

### 1. Local Testing (Development)

**Note:** `Secure: true` cookies won't work on `http://localhost`. For local testing:

```javascript
// In development only
res.cookie('grocery_share_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',  // Only secure in production
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/'
});
```

### 2. Production Testing

After deploying to Render, test:

```bash
# Login and check cookie is set
curl -X POST https://grocery-share-backend.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  -c cookies.txt -v

# Use cookie for authenticated request
curl https://grocery-share-backend.onrender.com/api/v1/users/me \
  -b cookies.txt -v
```

---

## Deployment Checklist

- [ ] Install `cookie-parser` dependency
- [ ] Update auth middleware to read from `req.cookies.grocery_share_token`
- [ ] Enable CORS with `credentials: true`
- [ ] Update login endpoint to set HttpOnly cookie
- [ ] Update Google OAuth callback to set HttpOnly cookie
- [ ] Add logout endpoint to clear cookie
- [ ] Set `secure: true` for production (HTTPS)
- [ ] Set `sameSite: 'none'` for cross-domain cookies
- [ ] Test with Postman/curl to verify cookies are set
- [ ] Deploy to Render

---

## Security Benefits

✅ **XSS Protection:** HttpOnly cookies can't be accessed by JavaScript  
✅ **CSRF Protection:** SameSite=none with proper validation  
✅ **Works with Tracking Prevention:** Cookies sent automatically, no client storage needed  
✅ **Automatic Expiration:** Browser handles cookie lifetime  

---

## Migration Strategy

**Phase 1:** Backend accepts both Bearer tokens AND cookies (backwards compatible)  
**Phase 2:** Frontend updated to use cookies (credentials: 'include')  
**Phase 3:** Remove Bearer token fallback after all users migrated  

This allows gradual rollout without breaking existing users.

---

## Common Issues

### Issue 1: Cookie not being sent
**Cause:** Missing `credentials: true` in CORS or `credentials: 'include'` in frontend fetch  
**Fix:** Ensure both backend CORS and frontend API config have credentials enabled

### Issue 2: Cookie not set on localhost
**Cause:** `Secure: true` requires HTTPS  
**Fix:** Use `secure: process.env.NODE_ENV === 'production'`

### Issue 3: Cookie blocked by browser
**Cause:** SameSite=Strict or SameSite=Lax with cross-domain  
**Fix:** Use `sameSite: 'none'` with `secure: true`

---

## Next Steps

After backend changes are deployed:
1. Frontend will be updated to use `credentials: 'include'`
2. Remove localStorage token logic
3. Auth will work seamlessly with strict tracking prevention
