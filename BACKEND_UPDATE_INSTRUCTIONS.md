# Backend Update Instructions - HttpOnly Cookie Authentication

## Overview
These changes fix the authentication issue with browsers that have strict tracking prevention (Edge, Safari).

---

## STEP 1: Install cookie-parser

### Go to your backend repo on GitHub
1. Open: **grocery-share-backend** repository
2. Find file: **`package.json`** (in the root folder)
3. Click the **pencil icon** to edit

### Add cookie-parser to dependencies
4. Find the `"dependencies": {` section
5. Add this line AFTER any existing dependency (don't forget the comma):
   ```json
   "cookie-parser": "^1.4.6",
   ```

**Example - Before:**
```json
"dependencies": {
  "express": "^4.18.0",
  "mongoose": "^7.0.0"
}
```

**Example - After:**
```json
"dependencies": {
  "express": "^4.18.0",
  "mongoose": "^7.0.0",
  "cookie-parser": "^1.4.6"
}
```

6. **Commit message:** `Add cookie-parser dependency`
7. Click **"Commit changes"**

---

## STEP 2: Update index.js

1. Find file: **`index.js`** (root folder, NOT in src/)
2. Click **pencil icon** to edit
3. **Select ALL content** (Ctrl+A or Cmd+A)
4. **Delete it**
5. **Copy the ENTIRE content** from file: `BACKEND_FILES/index.js`
6. **Paste it** into the empty file
7. **Commit message:** `Enable CORS credentials and cookie-parser`
8. Click **"Commit changes"**

---

## STEP 3: Update middleware/auth.js

1. Find file: **`middleware/auth.js`**
2. Click **pencil icon** to edit
3. **Select ALL content** (Ctrl+A)
4. **Delete it**
5. **Copy the ENTIRE content** from file: `BACKEND_FILES/middleware-auth.js`
6. **Paste it**
7. **Commit message:** `Update auth middleware to read cookies`
8. Click **"Commit changes"**

---

## STEP 4: Update controllers/authController.js

1. Find file: **`controllers/authController.js`**
2. Click **pencil icon** to edit
3. **Select ALL content** (Ctrl+A)
4. **Delete it**
5. **Copy the ENTIRE content** from file: `BACKEND_FILES/controllers-authController.js`
6. **Paste it**
7. **Commit message:** `Set HttpOnly cookies on login and registration`
8. Click **"Commit changes"**

---

## STEP 5: Update routes/auth.js

1. Find file: **`routes/auth.js`**
2. Click **pencil icon** to edit
3. **Select ALL content** (Ctrl+A)
4. **Delete it**
5. **Copy the ENTIRE content** from file: `BACKEND_FILES/routes-auth.js`
6. **Paste it**
7. **Commit message:** `Add logout endpoint to clear cookies`
8. Click **"Commit changes"**

---

## STEP 6: Wait for Render to Deploy

1. **Go to:** https://dashboard.render.com
2. **Find:** grocery-share-backend service
3. **Check status:** Should show "Building" then "Live"
4. **Wait:** About 2-3 minutes for deployment to complete

### You'll see in logs:
```
✅ Server running on port 10000
🔒 CORS enabled for: https://grocery-share-frontend.vercel.app
📡 Ready to receive requests!
```

---

## STEP 7: Tell Me When Done!

Once Render shows **"Live"** and deployment is complete:

**Send me this message:**
> "Backend deployed successfully"

Then I'll update the frontend to use the new cookie-based authentication!

---

## Summary of Changes

✅ **Step 1:** Added `cookie-parser` to package.json  
✅ **Step 2:** Updated index.js (enabled CORS credentials)  
✅ **Step 3:** Updated middleware/auth.js (reads from cookies)  
✅ **Step 4:** Updated controllers/authController.js (sets HttpOnly cookies)  
✅ **Step 5:** Updated routes/auth.js (added logout endpoint)  
✅ **Step 6:** Wait for Render deployment  
✅ **Step 7:** Tell me when done!

---

## Files to Copy From

All complete files are in the **`BACKEND_FILES/`** folder:

- `BACKEND_FILES/index.js` → Copy to `index.js`
- `BACKEND_FILES/middleware-auth.js` → Copy to `middleware/auth.js`
- `BACKEND_FILES/controllers-authController.js` → Copy to `controllers/authController.js`
- `BACKEND_FILES/routes-auth.js` → Copy to `routes/auth.js`

---

## Need Help?

If you get stuck on any step, tell me which step number and I'll help you!
