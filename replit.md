# Overview

Grocery Share is a peer-to-peer web application designed to reduce food waste by enabling users to share, request, and exchange surplus grocery items within their local community. The platform connects individuals with excess groceries to those in need, facilitating both free and paid item listings. Key capabilities include listing items, searching for nearby groceries, real-time chat communication, and integrated map-based pickup coordination. The vision is to foster community sharing, combat food insecurity, and promote sustainable consumption habits.

# Recent Changes (November 6, 2025)

## Latest Session: Modern Chat Interface Redesign + OAuth Fix

### Split-View Messaging Experience
Complete redesign of the chat interface with clean, scannable message list and modern chat window.

**What Was Changed:**
1. **Messages List (Left Panel)**:
   - Single-line compact rows similar to Dashboard items
   - Circular avatars (item image or gradient user icon)
   - Each row displays: avatar, sender name, relative timestamp, item name, and last message preview
   - All information fits on one line for quick scanning
   - Selected conversation highlighted with green left border
   - Smooth hover states and transitions

2. **Chat Window (Right Panel)**:
   - Modern rounded message bubbles with subtle shadows
   - Gradient backgrounds for visual depth
   - Cleaner header with circular avatar
   - Rounded input field with improved styling
   - Different bubble shapes for sender/receiver (rounded corners)

3. **User Experience Improvements**:
   - Relative timestamps ("2 minutes ago") for better context
   - Better visual hierarchy and spacing
   - Responsive design (fixed width on larger screens)
   - Improved empty states with helpful CTAs

**Files Changed:**
- `src/pages/Chat.tsx` - Complete chat interface redesign

**Features Preserved:**
- ✅ Real-time message polling (3s for messages, 5s for conversations)
- ✅ Auto-scroll to latest message (unless user scrolls up manually)
- ✅ Reveal Address and Confirm Pickup buttons
- ✅ Rating modal integration
- ✅ Mark messages as read functionality
- ✅ New conversation handling from URL parameters

**Architect Review:** ✅ Passed
- Clean single-line scannable message rows
- Modern chat window design
- No functionality broken
- No performance concerns
- TypeScript types correct

---

### Gmail OAuth User Name Fix

**Issue Fixed:** Users logging in with Gmail OAuth were showing as "User" instead of their actual Google name.

**Solution:** Updated OAuth callback to fetch full user profile from backend `/users/me` endpoint after receiving token, ensuring real name and complete user data (including admin role) is loaded.

**Files Changed:**
- `src/pages/AuthCallback.tsx` - Now fetches user profile from backend

**How it works:**
1. Receive OAuth token from Google callback
2. Save token to enable authenticated API calls
3. Fetch complete user profile from `/users/me` endpoint
4. Use backend data (includes Google name, role, etc.)
5. Fallback to URL params if profile fetch fails

**Architect Review:** ✅ Passed
- OAuth flow works correctly
- Real user name fetched from backend
- Admin roles preserved
- Proper error handling and fallback

---

## Previous Session: Role-Based Admin System

### New Admin/Super Admin Functionality
Complete role-based access control system for platform moderation and management.

**What Was Added:**
1. **User Roles**: `user` (default), `admin`, and `super_admin` roles
2. **Admin Dashboard**: New `/admin` route with platform overview and management
3. **Admin Controls**: Delete buttons on item and request detail pages (admin-only)
4. **Admin Navigation**: Purple "Admin" link in navbar (visible only to admins)
5. **Admin Utilities**: `useAdmin` hook and permission checking functions
6. **Documentation**: Complete ADMIN_SETUP.md guide for backend integration

**Files Changed:**
- `src/context/AuthContext.tsx` - Added role field to User interface
- `src/hooks/useAdmin.ts` - New hook for admin permission checks
- `src/utils/adminUtils.ts` - Admin utility functions
- `src/pages/AdminDashboard.tsx` - Admin dashboard page
- `src/pages/ItemDetail.tsx` - Added admin delete button
- `src/pages/RequestDetail.tsx` - Added admin delete button
- `src/components/Navbar.tsx` - Added admin link for admins
- `src/App.tsx` - Added admin route
- `ADMIN_SETUP.md` - Complete setup and integration guide

**Backend Requirements:**
⚠️ Admin system requires backend support to function fully:
- Update User model with `role` field ('user' | 'admin' | 'super_admin')
- Include `role` in JWT tokens and login responses
- Create admin middleware for protected endpoints
- **Required endpoints for dashboard:**
  - `GET /admin/items` - Get all items platform-wide
  - `GET /admin/requests` - Get all requests platform-wide
  - `GET /admin/stats` - Get platform statistics
  - `DELETE /items/:id` - Allow admin delete with elevated permissions
  - `DELETE /requests/:id` - Allow admin delete with elevated permissions

**Current Limitations (until backend is updated):**
- Admin Dashboard shows only admin's own items/requests (not platform-wide data)
- Delete operations may require backend permission updates
- Statistics are incomplete without admin endpoints

**How to Make a User Admin:**
See ADMIN_SETUP.md for detailed instructions. Quickest method:
```javascript
// MongoDB direct update
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "super_admin" } }
);
```
Then logout and login to get new JWT with role.

**Architect Review:** ✅ Passed
- Permission checks are sound
- UI only shows for authorized users
- Delete functions have proper confirmations
- TypeScript types are correct
- No security issues detected
- Documentation is comprehensive
- No breaking changes to existing functionality

---

## Previous Session: Button Visibility & OAuth Fixes

### Issues Fixed
1. **Buy Now button missing** - Payment integration wasn't visible on ItemDetail page
2. **Contact Seller section missing** - Chat option only showed for available items
3. **Gmail OAuth login failing** - 404 error calling non-existent /users/me endpoint
4. **TypeScript type errors** - Item interface missing status and buyerId fields

### Changes Made

**src/api/items.ts**
- Added `status?: 'available' | 'sold' | 'refunded'` field to Item interface
- Added `buyerId?: string` field to Item interface
- Fixes TypeScript errors when accessing item.status and item.buyerId

**src/pages/ItemDetail.tsx**
- Fixed Buy Now button visibility: Shows for paid, available, non-owned items
- Fixed Contact Seller section: Now shows for ALL non-owned items (regardless of status)
- Fixed Interested to Buy button: Shows for available items only
- Updated all visibility conditions to handle undefined status (defaults to 'available')
- Removed type casting `(item as any)` in favor of proper typed access

**src/pages/AuthCallback.tsx**
- Removed dependency on missing `/users/me` endpoint
- Now reads user data from OAuth callback URL parameters: token, userId, name, email
- Backend must send these parameters in OAuth redirect URL

**src/pages/RequestDetail.tsx**
- Interested to Offer button verified working for active requests
- Uses proper type definitions

### Architect Review
✅ All changes reviewed and approved
- Button visibility logic handles edge cases properly
- TypeScript types accurate and prevent future errors
- No security issues detected
- OAuth changes match backend contract

### Testing Checklist for User
- [ ] Buy Now button visible on paid items
- [ ] Contact Seller always shows for non-owned items
- [ ] Interested to Buy button works on available items
- [ ] Interested to Offer button works on active requests
- [ ] Gmail login works without console errors
- [ ] Payment modal opens when clicking Buy Now
- [ ] Stripe integration processes payments

### Known Dependencies
- Notification buttons require backend endpoint: `POST /notifications/interest`
- OAuth requires backend to send userId, name, email in callback URL
- Item status field must be sent by backend (or defaults to 'available')

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The frontend is built with **React 19** and **TypeScript** using **Vite 7** for fast development. **React Router v7** handles client-side navigation.

**UI & Styling**: **Tailwind CSS v4** with custom design tokens, **Lucide React** for iconography, and **Class Variance Authority (CVA)** for component variants.

**State Management**: Primarily uses **React Context API** for global state (Authentication, Notifications, Toast messages) and React hooks for local component state.

**Form Handling**: **React Hook Form v7** is integrated with **Zod v4** for robust form validation and schema definition.

**Authentication**: **JWT-based** authentication supporting email/password and **Google OAuth**. Tokens are stored in `localStorage` and automatically injected into Axios requests. Protected routes ensure secure access.

**Map Integration**: **Leaflet v1.9** with **React-Leaflet v5** provides interactive maps, utilizing **OpenStreetMap** tiles and **Nominatim** for geocoding.

**Real-time Features**: Achieved through polling for chat messages (5-second intervals) and notifications, with unread counts and toast notifications for user feedback.

**Image Management**: Supports multi-image uploads (up to 5 per item) with **Cloudinary** integration for hosting and optimization.

## Backend Integration

**API Communication**: **Axios** is used for HTTP requests, configured with a base URL and automatic JWT token injection. Global error handling includes a 401 redirect to login.

**API Structure**: The frontend interacts with a RESTful API, organized into modules for authentication, items, chat, notifications, item requests, recommendations, ratings, gamification, payments, address management, and contact forms.

## Data Models

Core entities include **User**, **Item**, **Message**, **Conversation**, **Notification**, **ItemRequest**, **Rating**, and **Badge**. Location handling prioritizes privacy, with addresses hidden until mutual consent.

## Routing Structure

**Public Routes**: `/login`, `/register`, `/auth/callback`, `/terms`, `/privacy`, `/contact`.
**Protected Routes**: `/dashboard`, `/my-items`, `/add-item`, `/edit-item/:id`, `/chat`, `/item-requests`, `/profile`.
Route protection is managed by a `ProtectedRoute` component that redirects unauthenticated users.

## Key Features

**Search & Discovery**: Location-based search with radius filtering, keyword, category, and tag filtering, personalized recommendations, and trending items.
**Listing Management**: Multi-image upload, address autocomplete with map preview, flexible pricing (free/paid), pickup time windows, and category/tag organization.
**Communication**: One-on-one messaging, conversation threads, unread indicators, real-time polling, and an address reveal mechanism.
**Gamification**: Badge system for achievements and a user rating/review system.
**Safety & Privacy**: Addresses are hidden by default, requiring mutual consent for revealing, and a pickup confirmation workflow.

# External Dependencies

## Third-Party Services

**Cloudinary**: Image hosting and optimization.
**OpenStreetMap / Nominatim**: Free geocoding service and map tiles for location functionalities.
**Stripe**: Payment processing for paid item transactions.
**Google OAuth**: Third-party authentication provider.

## Backend API

**Base URL**: `https://grocery-share-backend.onrender.com`.
A RESTful API requiring JWT authentication for protected endpoints, using JSON for requests and responses.

## Build & Deployment

**Development Tools**: ESLint, Vite dev server, TypeScript compiler.
**Production Deployment**: Vercel platform, using `vercel.json` for configuration, environment variables (`VITE_BACKEND_URL`), and SPA routing.