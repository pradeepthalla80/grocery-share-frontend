# Overview

Grocery Share is a peer-to-peer web application designed to reduce food waste by enabling users to share, request, and exchange surplus grocery items within their local community. The platform connects individuals with excess groceries to those in need, facilitating both free and paid item listings. Key capabilities include listing items, searching for nearby groceries, real-time chat communication, and integrated map-based pickup coordination. The vision is to foster community sharing, combat food insecurity, and promote sustainable consumption habits.

# User Preferences

Preferred communication style: Simple, everyday language.

User prefers complete file updates rather than partial edits - always provide entire updated files when making backend changes.

# Recent Work Sessions

## November 8, 2025 - Session 3: Backend Price Fields Integration

### ✅ Completed & Deployed

**BACKEND (Updated on GitHub - Render Auto-Deploying):**

1. **ItemRequest Model** (`models/ItemRequest.js`)
   - Added `pricePreference` field (enum: 'free_only' or 'willing_to_pay')
   - Added `maxPrice` field (Number, min: 0)

2. **ItemRequest Controller** (`controllers/itemRequestController.js`)
   - Updated `createRequest` to save pricePreference and maxPrice from request body
   - Added NEW `updateRequest` function to handle editing requests (was missing!)
   - Both functions parse maxPrice as float

3. **ItemRequest Routes** (`routes/itemRequests.js`)
   - Added PUT route `/item-requests/:requestId` for editing (was missing!)
   - Imported `updateRequest` function from controller

**FRONTEND (Pushed to GitHub - Vercel Auto-Deploying):**

1. **RED Unread Messages** (changed from green per user request)
   - `src/components/ChatModal.tsx` - RED avatar, RED background, RED border, RED "New" badge
   - `src/components/ConversationCard.tsx` - RED left border for conversations with unread messages

2. **Notification Navigation**
   - `src/components/NotificationBell.tsx` - Clicking notification navigates to /chat, marks as read, closes dropdown

3. **Request Edit Mode Fix**
   - `src/pages/ItemRequests.tsx` - Now preserves pricePreference and maxPrice when editing (was losing them before)

### 🧪 READY FOR TESTING

**Test After Both Deployments Complete (~2 minutes):**

1. **Delete old "Cloves" request** (created before price fields were added)
2. **Create new request** with:
   - Item: Cloves
   - Payment Preference: "Willing to Pay"
   - Max Price: $6.00
3. **Verify 3 things:**
   - ✅ Request details page shows "Willing to pay up to $6.00"
   - ✅ Make an Offer modal shows TWO options (Free + Set a Price up to $6)
   - ✅ Delivery checkbox visible with fee options ($1-$5 or free)

### Files Modified (Session 3)

**Backend (via GitHub):**
- `models/ItemRequest.js` - Added pricePreference and maxPrice fields
- `controllers/itemRequestController.js` - Added price handling in create/update
- `routes/itemRequests.js` - Added PUT route for updates

**Frontend:**
- `src/components/ChatModal.tsx` - RED unread styling
- `src/components/NotificationBell.tsx` - Navigation to /chat
- `src/components/ConversationCard.tsx` - RED border for unread
- `src/pages/ItemRequests.tsx` - Preserve price fields on edit

## November 8, 2025 - Session 2: UI Polish & Notification Navigation

### ✅ Completed

1. **Changed Unread Messages to RED** (per user request)
   - Unread messages now show RED background (was green)
   - RED avatar circle for unread senders
   - RED border and "New" badge
   - Conversation cards show RED left border for unread

2. **Notification Bell Navigation**
   - Clicking notification now navigates to /chat
   - Automatically marks as read
   - Closes dropdown after click

3. **Request Price Fields Verified**
   - Form shows "Payment Preference" dropdown
   - Options: "Free Only" or "Willing to Pay"
   - When "Willing to Pay" selected, shows max price input field
   - Details page displays price correctly
   - OfferModal supports both free and paid offers with delivery

## November 8, 2025 - Session 1: Complete Feature Fixes & UX Improvements

### ✅ Completed (Frontend - Ready to Deploy)

1. **Unread Message Visual Indicators**
   - Unread messages from others now display with highlighted background
   - Avatar circle for unread message senders
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
   - Border for conversations with unread messages
   - Real-time polling at 5-second intervals

### ✅ Completed (Backend - Deployed on Render)

1. **Robust Notifications Fix**
   - Handles multiple owner field names (`user`, `userId`, `owner`, `ownerId`)
   - Works with both populated and non-populated fields
   - Better error logging for debugging
   - Clear user-facing error messages
   - Fixes "Interested to Buy" button 500 errors
   - Fixes pickup request notifications
   - Uses correct schema field names (user, not userId)

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
   - Border on conversations with unread messages
   - Fixed `hasUnread` logic using nullish coalescing

# System Architecture

## UI/UX Decisions

The UI is built with React 19, TypeScript, and Vite 7. Styling utilizes Tailwind CSS v4 with custom design tokens, Lucide React for iconography, and Class Variance Authority (CVA) for component variants. 

**Chat Interface (Nov 2025 Redesign):** Modern modal-based design with conversation list in grid layout (similar to Dashboard items). Chat opens in full-screen modal with circular avatars, rounded message bubbles, gradient backgrounds, and unread badges. Unread messages show with RED highlights, RED avatar circles, bold text, and "New" badges.

**Notification System:** Bell icon shows unread count. Clicking notifications navigates to /chat page automatically.

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
- **Communication**: One-on-one messaging via modal popup interface, conversation threads with unread badges (visual RED highlights), real-time polling, URL-driven chat entry, pre-filled messages, and an address reveal mechanism.
- **Request Management**: Full request creation with price preferences ("Free Only" or "Willing to Pay up to $X"), quantity, category, location, and validity period. Request details page shows all info. BACKEND NOW SUPPORTS: pricePreference and maxPrice fields in database.
- **Request Offers**: Full support for both free and paid offers with delivery options when responding to requests. OfferModal validates price against requester's max price.
- **Gamification**: Badge system for achievements and a user rating/review system.
- **Safety & Privacy**: Addresses are hidden by default, requiring mutual consent for revealing, and a pickup confirmation workflow.

## System Design Choices

- **Routing**: React Router v7 handles client-side navigation with public and protected routes. Route protection is managed by a `ProtectedRoute` component.
- **Data Models**: Core entities include User, Item, Message, Conversation (with unreadCount), Notification, ItemRequest (with pricePreference and maxPrice), Rating, and Badge.
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
- A RESTful API requiring JWT authentication for protected endpoints, using JSON for requests and responses. The backend supports user management, item listings, chat, notifications, item requests (with price preferences), and admin functionalities.

# Known Issues & Testing

## Currently Deploying (Nov 8, Session 3)

**Backend changes** (Render deploying ~1-2 min):
- ItemRequest model now has pricePreference and maxPrice fields
- Create/Update controllers save these fields
- PUT route added for editing requests

**Frontend changes** (Vercel deploying ~30 sec):
- RED unread message styling
- Notification bell navigates to /chat
- Edit mode preserves price fields

## Next Testing Steps

After deployments complete:
1. Hard refresh browser (Ctrl+Shift+R)
2. Delete old "Cloves" request
3. Create new request with "Willing to Pay" → $6
4. Verify:
   - Details page shows "$6.00"
   - Offer modal shows paid option
   - Delivery checkbox visible

## Previous Bugs Fixed
- Distance calculation showing "0.00 miles" - FIXED
- Chat pre-fill not working - FIXED
- New conversations failing to load after first message - FIXED
- Notification polling too slow - FIXED (now 5 seconds)
- Unread message styling - FIXED (RED highlights per user request)
- Notification navigation - FIXED (clicks now go to /chat)
- Request edit losing price fields - FIXED (now preserves them)
- Backend missing price fields - FIXED (added to model/controller/routes)
