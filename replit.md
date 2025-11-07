# Overview

Grocery Share is a peer-to-peer web application designed to reduce food waste by enabling users to share, request, and exchange surplus grocery items within their local community. The platform connects individuals with excess groceries to those in need, facilitating both free and paid item listings. Key capabilities include listing items, searching for nearby groceries, real-time chat communication, and integrated map-based pickup coordination. The vision is to foster community sharing, combat food insecurity, and promote sustainable consumption habits.

# User Preferences

Preferred communication style: Simple, everyday language.

User prefers complete file updates rather than partial edits - always provide entire updated files when making backend changes.

# Recent Work Sessions

## November 7, 2025 - Chat UI Redesign & Notification Fixes

### ✅ Completed (Frontend - Deployed to Vercel)

1. **Chat UI Complete Redesign**
   - Created `ChatModal.tsx` - Full-screen popup modal for messaging with all features (address reveal, pickup confirmation, ratings)
   - Created `ConversationCard.tsx` - Single-line conversation cards in grid layout (like Dashboard items)
   - Refactored `Chat.tsx` - Grid layout with modal-based chat interface
   - Fixed critical bug: New conversation creation now properly loads and updates after first message
   - Preserves all features: URL-driven entry (`/chat?receiverId=...`), pre-filled messages, address reveal, pickup confirmation, ratings

2. **Notification & Unread Message Improvements**
   - Changed notification polling from 60s to 5s for real-time updates (like social media)
   - Added unread message count badges on conversation cards (red badge on avatar)
   - Green border on conversations with unread messages
   - Bolder text styling for unread conversation names/messages
   - Fixed `hasUnread` logic to properly handle `undefined` vs `0` using nullish coalescing

3. **TypeScript & Code Quality**
   - Added `unreadCount?: number` to Conversation interface in `chat.ts`
   - All LSP diagnostics resolved
   - Architect reviewed all changes

### ⚠️ PENDING (Backend - Needs Testing After Deployment)

**Issue:** "Interested to Buy" button returns 500 error from backend

**Root Cause:** `item.user` field is `undefined` when creating notification. The backend `notifications.js` tries to access `item.user._id` but populate fails or user field doesn't exist.

**Fix Provided (Not Yet Confirmed Working):**
- Updated backend `src/routes/notifications.js` with defensive code
- Lines 151 & 237 now handle both populated and non-populated user fields:
  ```javascript
  ownerId = item.user._id ? item.user._id : item.user;
  ```
- This should work whether `item.user` is an ObjectId or populated object

**Next Steps:**
1. Verify backend deployment on Render shows latest commit
2. Test "Interested to Buy" button after deployment
3. Check Render logs if still failing
4. May need to verify Item model schema has proper user field reference

### Files Modified Today

**Frontend (Live on Vercel):**
- `src/components/ChatModal.tsx` - NEW
- `src/components/ConversationCard.tsx` - NEW
- `src/pages/Chat.tsx` - REFACTORED
- `src/context/NotificationContext.tsx` - Updated polling to 5s
- `src/api/chat.ts` - Added unreadCount to Conversation interface
- `src/components/ConversationCard.tsx` - Added unread badges and styling

**Backend (User needs to verify deployment):**
- `src/routes/notifications.js` - Fixed item.user handling in /interest and /pickup-request endpoints

# System Architecture

## UI/UX Decisions

The UI is built with React 19, TypeScript, and Vite 7. Styling utilizes Tailwind CSS v4 with custom design tokens, Lucide React for iconography, and Class Variance Authority (CVA) for component variants. 

**Chat Interface (Nov 2025 Redesign):** Modern modal-based design with conversation list in grid layout (similar to Dashboard items). Chat opens in full-screen modal with circular avatars, rounded message bubbles, gradient backgrounds, and unread badges. Messages show sender initials in colored circles, with blue bubbles for user messages and white for others.

Map integration uses Leaflet v1.9 with React-Leaflet v5 and OpenStreetMap/Nominatim.

## Technical Implementations

- **State Management**: Primarily uses React Context API for global state (Authentication, Notifications, Toast messages) and React hooks for local component state.
- **Form Handling**: React Hook Form v7 integrated with Zod v4 for validation.
- **Authentication**: JWT-based authentication supporting email/password and Google OAuth. Tokens are stored in `localStorage`. Includes a robust role-based access control system (`user`, `admin`, `super_admin`) with an Admin Dashboard and restricted functionalities.
- **Real-time Features**: Achieved through polling - chat messages (3-second intervals in modal), notifications (5-second intervals), with unread counts and toast notifications. Notification bell updates in real-time with badge count.
- **Image Management**: Multi-image uploads (up to 5 per item) with Cloudinary integration.
- **API Communication**: Axios for HTTP requests, configured with automatic JWT token injection and global error handling.

## Feature Specifications

- **Delivery Options**: Integrated delivery/drop-off functionality for items and request offers, allowing users to select free or paid delivery ($1-$5 range).
- **Search & Discovery**: Location-based search with radius filtering, keyword, category, and tag filtering, personalized recommendations, and trending items.
- **Listing Management**: Multi-image upload, address autocomplete with map preview, flexible pricing (free/paid), pickup time windows, and category/tag organization.
- **Communication**: One-on-one messaging via modal popup interface, conversation threads with unread badges, real-time polling, URL-driven chat entry, pre-filled messages, and an address reveal mechanism.
- **Gamification**: Badge system for achievements and a user rating/review system.
- **Safety & Privacy**: Addresses are hidden by default, requiring mutual consent for revealing, and a pickup confirmation workflow.

## System Design Choices

- **Routing**: React Router v7 handles client-side navigation with public and protected routes. Route protection is managed by a `ProtectedRoute` component.
- **Data Models**: Core entities include User, Item, Message, Conversation (with unreadCount), Notification, ItemRequest, Rating, and Badge.
- **Deployment**: 
  - Frontend deployed on Vercel (auto-deploys from GitHub on push)
  - Backend deployed on Render (auto-deploys from GitHub on push)
  - User edits backend via GitHub web interface at https://github.com/pradeepthalla80/grocery-share-backend

# External Dependencies

## Third-Party Services

- **Cloudinary**: Image hosting and optimization.
- **OpenStreetMap / Nominatim**: Geocoding service and map tiles for location functionalities.
- **Stripe**: Payment processing for paid item transactions.
- **Google OAuth**: Third-party authentication provider.

## Backend API

- **Base URL**: `https://grocery-share-backend.onrender.com`.
- A RESTful API requiring JWT authentication for protected endpoints, using JSON for requests and responses. The backend supports user management, item listings, chat, notifications, item requests, and admin functionalities.

# Known Issues & Debugging Notes

## Active Bug (As of Nov 7, 2025)
- **"Interested to Buy" button**: Returns 500 error
- **Error**: `item.user` is undefined in backend notifications.js
- **Status**: Fix provided but not yet confirmed working after deployment
- **Location**: Backend `src/routes/notifications.js` lines 143-151 and 210-237

## Previous Bugs Fixed
- Distance calculation showing "0.00 miles" - FIXED (backend computes Haversine distance)
- "Interested to Buy" button 500 error from using `item.userId` - FIXED (changed to `item.user`)
- Chat pre-fill not working - FIXED (added to useEffect dependencies)
- New conversations failing to load after first message - FIXED (proper conversation refresh and selection)
