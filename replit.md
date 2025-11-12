# Overview

Grocery Share is a peer-to-peer web application designed to reduce food waste by enabling users to share, request, and exchange surplus grocery items within their local community. The platform connects individuals with excess groceries to those in need, facilitating both free and paid item listings. Key capabilities include listing items, searching for nearby groceries, real-time chat communication, and integrated map-based pickup coordination. The vision is to foster community sharing, combat food insecurity, and promote sustainable consumption habits.

# User Preferences

Preferred communication style: Simple, everyday language.

User prefers complete file updates rather than partial edits - always provide entire updated files when making backend changes.

**CRITICAL: Mobile-First Development**
- ALL new features and changes MUST work perfectly on mobile devices
- Test and verify mobile responsiveness for screens ≤400px
- Future goal: Convert to native mobile app for iOS and Android
- Design decisions should support eventual mobile app conversion
- Touch-friendly interfaces, mobile UX patterns, responsive layouts required

# System Architecture

## UI/UX Decisions

The UI is built with React 19, TypeScript, and Vite 7. Styling utilizes Tailwind CSS v4 with custom design tokens, Lucide React for iconography, and Class Variance Authority (CVA) for component variants. The chat interface features a modern modal-based design with conversation lists in a grid layout, circular avatars, rounded message bubbles, gradient backgrounds, and unread badges. Unread messages are highlighted in RED with bold text and "New" badges. The notification system uses a bell icon to show unread counts, navigating to the `/chat` page upon click. Map integration uses Leaflet v1.9 with React-Leaflet v5 and OpenStreetMap/Nominatim.

## Technical Implementations

- **State Management**: Primarily uses React Context API for global state (Authentication, Notifications, Toast messages) and React hooks for local component state.
- **Form Handling**: React Hook Form v7 integrated with Zod v4 for validation.
- **Authentication**: JWT-based authentication supporting email/password and Google OAuth. **Dual Authentication System** (Nov 11, 2025): Hybrid approach using both HttpOnly cookies (primary, more secure) AND localStorage tokens (fallback for mobile browsers). Backend sets secure HttpOnly cookies (`grocery_share_token`) for desktop browsers. Frontend saves JWT tokens to localStorage for mobile browser compatibility where cross-domain cookies are blocked (Safari iOS, Chrome Mobile incognito). Request interceptor automatically adds `Authorization: Bearer {token}` header when token exists. Frontend uses `withCredentials: true` for automatic cookie transmission. **Intelligent 401 Handling** (Nov 11, 2025): Smart response interceptor with callback pattern that skips 401 handling for OAuth flows, /auth/me checks, and login/register pages, while properly detecting mid-session expiry. Interceptor triggers AuthContext.checkAuth() callback on real session expiry, allowing ProtectedRoute to gracefully redirect. Prevents "session expired" errors during Google OAuth and eliminates immediate logout after email login. Robust role-based access control system (`user`, `admin`, `super_admin`) with an Admin Dashboard. **Enhanced for App Stores**: Strong password requirements (8+ chars, mixed case, numbers, special characters), real-time password strength indicator, password confirmation field, strict email validation, and mobile-optimized design ready for iOS/Android submission.
- **Real-time Features**: Achieved through polling for chat messages (3-second intervals) and notifications (5-second intervals), with unread counts and toast notifications.
- **Image Management**: Multi-image uploads (up to 5 per item) with Cloudinary integration.
- **API Communication**: Axios for HTTP requests, configured with `withCredentials: true` for HttpOnly cookie support, automatic JWT token injection (Bearer fallback), 30-second timeout, and intelligent error handling. Global interceptor handles network errors, timeouts, and server errors (500+) with toast notifications. Smart 401 handling uses callback pattern to distinguish between OAuth flows (skip), initial auth checks (skip), login/register flows (skip), and real mid-session expiry (trigger re-auth check). Fixed Nov 11, 2025 to prevent cascading logout during authentication flows.
- **Error Handling**: Implemented `ErrorBoundary` component for graceful error recovery and a 404 `NotFound` page.
- **Mobile Responsiveness**: Comprehensive audit ensures mobile readiness for screens ≤400px.
- **PWA/SEO**: Comprehensive meta tags (Open Graph, Twitter Card, mobile app tags), `manifest.json` with app icons and theme colors, and proper viewport settings.

## Feature Specifications

- **Delivery Options**: Integrated delivery/drop-off functionality for items and request offers, allowing users to select free or paid delivery ($1-$5 range). **Enhanced Checkout**: Buyers can now toggle delivery during checkout with live price breakdown (item + delivery = total). Payment intent automatically recreates when delivery selection changes, ensuring accurate charges. Mobile-optimized delivery toggle with responsive design ≤400px.
- **Search & Discovery**: Location-based search with radius filtering, keyword, category, and tag filtering, personalized recommendations, and trending items.
- **Listing Management**: Multi-image upload, address autocomplete with map preview, flexible pricing (free/paid), pickup time windows, and category/tag organization.
- **Communication**: One-on-one messaging via modal popup interface, conversation threads with visual RED unread badges, real-time polling, URL-driven chat entry, pre-filled messages, and an address reveal mechanism.
- **Request Management**: Full request creation with price preferences ("Free Only" or "Willing to Pay up to $X"), quantity, category, location, and validity period. Backend supports `pricePreference` and `maxPrice` fields.
- **Request Offers**: Full support for both free and paid offers with delivery options when responding to requests. OfferModal validates price against requester's max price.
- **Pickup Request/Exchange Workflow** (Nov 12, 2025): Complete end-to-end exchange system for both free and paid items. **Status Lifecycle**: PickupRequest transitions from `pending` (buyer creates request) → `awaiting_pickup` (seller accepts with address/delivery mode) → `completed` (both parties confirm). Item status syncs automatically: `available` → `awaiting_pickup` → `completed`. **Features**: Buyers create pickup requests from ItemDetail page, sellers manage requests via `/pickup-requests` page with RequestActionModal for accept/decline actions. Address reveal only after seller acceptance. Both parties confirm pickup completion before marking complete. Cancel flow properly resets items to `available` state. **Store Item Inventory** (Nov 12, 2025): Centralized inventory service with atomic stock adjustments. When store items are exchanged/purchased: quantity decrements, stockStatus updates (in_stock/low_stock/out_of_stock), items remain 'available' until quantity hits 0. Race condition protection via MongoDB atomic operations. **CRITICAL**: Payment controller updates documented but NOT YET DEPLOYED - payment workflow still marks store items as 'sold' without decrementing quantity. **Mobile-First**: Touch-friendly UI with responsive badges, action buttons, and address displays optimized for ≤400px screens. **Backend Models**: PickupRequest (status, deliveryMode, sellerAddress, buyerConfirmed, sellerConfirmed), Item status enum extended with `awaiting_pickup` and `completed`. **API Endpoints**: `/api/v1/pickup-requests` (POST create, GET list, PUT accept/decline/confirm/cancel). **Notifications**: Real-time alerts for request creation, acceptance, decline, cancellation, and completion with full item metadata.
- **Store Owner Mode**: Uber-style business model allowing verified users to sell items as micro-stores. **Legal Framework**: Users must accept comprehensive Terms & Conditions covering compliance, tax obligations, fees, and liability before activation. **UI Components**: StoreActivationSection (Profile page), StoreTermsModal (scrollable legal agreement with IP tracking), StoreDashboard (inventory management), StoreFilterToggle (Dashboard filter). **Visual Distinction**: Store items display 🛒 badge, "Store Item" label, stock count, blue gradient background (mobile-optimized). **Search Integration**: Enhanced search logic mixes community + store items, supports "Show Only Store Items" filter toggle with useEffect pattern to prevent race conditions. **Mobile-First**: All components responsive ≤400px with touch-friendly buttons and scrollable modals. **Backend Models**: User (isStoreOwner, storeMode, storeName), Item (isStoreItem, quantity, stockStatus), StoreAgreement (userId, agreedAt, ipAddress, version). **API Endpoints**: `/api/v1/store/activate`, `/api/v1/store/toggle`, `/api/v1/store/my-store`, `/api/v1/store/transactions`. **Deployment**: Frontend complete and deployed; backend files prepared in BACKEND_FILES/ folder awaiting Render deployment.
- **Gamification**: Badge system for achievements and a user rating/review system.
- **Safety & Privacy**: Addresses are hidden by default, requiring mutual consent for revealing, and a pickup confirmation workflow.
- **Analytics**: Community Impact dashboard (`/analytics` page) displaying 6 key metrics: Total Members, Items Shared, Requests Fulfilled, Food Saved (lbs), Active Communities, and Open Requests. Backend endpoint `/api/v1/analytics/impact` returns real-time data from MongoDB. Frontend includes smart fallback to demo data if backend is unavailable. Metrics calculated from User, Item, and ItemRequest collections.

## System Design Choices

- **Routing**: React Router v7 handles client-side navigation with public and protected routes managed by a `ProtectedRoute` component. Store routes: `/store-dashboard` (protected), `/legal/agreements` (protected). Pickup/exchange route: `/pickup-requests` (protected).
- **Data Models**: Core entities include User (with isStoreOwner, storeMode, storeName), Item (with isStoreItem, quantity, stockStatus, status: available/awaiting_pickup/completed/sold/refunded/expired), PickupRequest (requester, seller, item, status: pending/awaiting_pickup/declined/canceled/completed, deliveryMode, sellerAddress, buyerConfirmed, sellerConfirmed), Message, Conversation (with unreadCount), Notification, ItemRequest (with pricePreference and maxPrice), Rating, Badge, and StoreAgreement (userId, agreedAt, ipAddress, version).
- **Deployment**: Frontend is deployed on Vercel, and the backend is deployed on Render, both with auto-deployment from GitHub. **Store Owner Backend Status**: Models, controllers, and routes created in BACKEND_FILES/ folder; requires manual deployment to Render (see STORE_OWNER_MODE_DEPLOYMENT.md).

# External Dependencies

## Third-Party Services

- **Cloudinary**: Image hosting and optimization.
- **OpenStreetMap / Nominatim**: Geocoding service and map tiles for location functionalities.
- **Stripe**: Payment processing for paid item transactions.
- **Google OAuth**: Third-party authentication provider.

## Backend API

- **Base URL**: `https://grocery-share-backend.onrender.com`.
- A RESTful API requiring JWT authentication for protected endpoints, using JSON for requests and responses. The backend supports user management, item listings, chat, notifications, item requests (with price preferences), admin functionalities, analytics, and store owner mode. The API follows a `/api/v1` versioned endpoint structure with a standardized response format: `{ success, data, message, error }`.
- **Backend Structure**: Backend repository uses root-level `controllers/`, `routes/`, `models/`, and `services/` folders. Main entry point is `index.js` at root level (NOT in src/). Files: `controllers/analyticsController.js`, `controllers/storeController.js`, `controllers/pickupRequestController.js`, `controllers/paymentController.js`, `routes/analytics.js`, `routes/store.js`, `routes/pickupRequests.js`, `models/StoreAgreement.js`, `models/PickupRequest.js`, `models/Item.js` (updated with new statuses), `services/inventoryService.js` (atomic stock management).
- **Deployment Status**: Backend deployed on Render with auto-deploy from GitHub. Pickup Request system deployed Nov 12, 2025 with PickupRequest model, pickupRequestController, and routes. All Store Owner Mode endpoints live and functional. Frontend deployed on Vercel.
- **Backend Reference Files**: Complete backend snapshot stored in `grocery-share-backend-Github_11-10-2015_1640pm/` folder (dated November 10, 2025, 4:40 PM). Agent uses these files as source of truth for all backend updates, provides modified files in workspace, user copies to GitHub for deployment.