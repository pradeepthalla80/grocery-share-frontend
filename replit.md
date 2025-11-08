# Overview

Grocery Share is a peer-to-peer web application designed to reduce food waste by enabling users to share, request, and exchange surplus grocery items within their local community. The platform connects individuals with excess groceries to those in need, facilitating both free and paid item listings. Key capabilities include listing items, searching for nearby groceries, real-time chat communication, and integrated map-based pickup coordination. The vision is to foster community sharing, combat food insecurity, and promote sustainable consumption habits.

# User Preferences

Preferred communication style: Simple, everyday language.

User prefers complete file updates rather than partial edits - always provide entire updated files when making backend changes.

# Recent Work Sessions

## November 8, 2025 - Complete Feature Fixes & UX Improvements

### ✅ Completed (Frontend - Ready to Deploy)

1. **Unread Message Visual Indicators**
   - Unread messages from others now display with green-highlighted background
   - Green avatar circle for unread message senders
   - Bold text styling on unread messages
   - "New" badge appears on unread messages
   - Clear visual distinction between read and unread

2. **Request Details Already Complete**
   - Payment amounts display correctly (willing to pay up to $X.XX)
   - Free-only requests clearly marked
   - OfferModal fully supports both free and paid offers
   - Delivery/drop-off options available for responders ($1-$5 range or free)

3. **Chat UI Improvements**
   - Modal-based design with full features
   - Conversation cards in grid layout
   - Unread count badges (red on avatar)
   - Green border for conversations with unread messages
   - Real-time polling at 5-second intervals

### ✅ Completed (Backend - Deployed on Render)

1. **Robust Notifications Fix**
   - Handles multiple owner field names (`user`, `userId`, `owner`, `ownerId`)
   - Works with both populated and non-populated fields
   - Better error logging for debugging
   - Clear user-facing error messages
   - Fixes "Interested to Buy" button 500 errors
   - Fixes pickup request notifications

### Files Modified Today

**Frontend:**
- `src/components/ChatModal.tsx` - Added unread message highlighting with green background and "New" badge
- All other chat/notification files from Nov 7 still active

**Backend:**
- `src/routes/notifications.js` - Complete rewrite with robust owner field handling

## November 7, 2025 - Chat UI Redesign & Notification Fixes

### ✅ Completed (Frontend - Deployed to Vercel)

1. **Chat UI Complete Redesign**
   - Created `ChatModal.tsx` - Full-screen popup modal for messaging
   - Created `ConversationCard.tsx` - Single-line conversation cards in grid layout
   - Refactored `Chat.tsx` - Grid layout with modal-based chat interface
   - Fixed critical bug: New conversation creation properly loads after first message

2. **Notification & Unread Message Improvements**
   - Changed notification polling from 60s to 5s for real-time updates
   - Added unread message count badges on conversation cards
   - Green border on conversations with unread messages
   - Fixed `hasUnread` logic using nullish coalescing

# System Architecture

## UI/UX Decisions

The UI is built with React 19, TypeScript, and Vite 7. Styling utilizes Tailwind CSS v4 with custom design tokens, Lucide React for iconography, and Class Variance Authority (CVA) for component variants. 

**Chat Interface (Nov 2025 Redesign):** Modern modal-based design with conversation list in grid layout (similar to Dashboard items). Chat opens in full-screen modal with circular avatars, rounded message bubbles, gradient backgrounds, and unread badges. Unread messages show with green highlights, green avatar circles, bold text, and "New" badges.

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
- **Communication**: One-on-one messaging via modal popup interface, conversation threads with unread badges (visual green highlights), real-time polling, URL-driven chat entry, pre-filled messages, and an address reveal mechanism.
- **Request Offers**: Full support for both free and paid offers with delivery options when responding to requests.
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

# Known Issues & Testing

## Ready for Testing (After Render Deployment - ~2 mins)

1. **"Interested to Buy" button** - Should now work without 500 errors
2. **Notification bell** - Should show notifications with 5-second updates
3. **Unread messages** - Should show green highlights with "New" badges
4. **Request payment display** - Already showing correctly
5. **Offer modal** - Already supports paid/free offers with delivery

## Previous Bugs Fixed
- Distance calculation showing "0.00 miles" - FIXED
- Chat pre-fill not working - FIXED
- New conversations failing to load after first message - FIXED
- Notification polling too slow - FIXED (now 5 seconds)
- Unread message styling - FIXED (green highlights)
