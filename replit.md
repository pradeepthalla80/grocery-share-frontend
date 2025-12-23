# Overview

BaskMate is a peer-to-peer web application designed to reduce food waste by enabling users to share, request, and exchange surplus grocery items within their local community. The platform aims to connect individuals with excess groceries to those in need, facilitating both free and paid item listings. Key capabilities include listing items, searching for nearby groceries, real-time chat, and map-based pickup coordination. The project's vision is to foster community sharing, combat food insecurity, and promote sustainable consumption, positioning BaskMate as "Your Emergency Pantry Next Door."

# User Preferences

Preferred communication style: Simple, everyday language.

User prefers complete file updates rather than partial edits - always provide entire updated files when making backend changes.

**CRITICAL: Git Push Command**
- ALWAYS use: `git push https://$GITHUB_TOKEN@github.com/pradeepthalla80/grocery-share-frontend.git main`
- NEVER use old embedded tokens or plain `git push`
- The `GITHUB_TOKEN` secret contains the valid PAT (expires March 2026)

**CRITICAL: Mobile-First Development**
- ALL new features and changes MUST work perfectly on mobile devices
- Test and verify mobile responsiveness for screens ≤400px
- Future goal: Convert to native mobile app for iOS and Android
- Design decisions should support eventual mobile app conversion
- Touch-friendly interfaces, mobile UX patterns, responsive layouts required

# System Architecture

## UI/UX Decisions

The UI is built with React 19, TypeScript, and Vite 7, using Tailwind CSS v4 with custom design tokens, Lucide React for iconography, and Class Variance Authority (CVA) for component variants. The application features an ultra-compact design system optimized for minimal space usage across all pages while maintaining mobile responsiveness and touch-friendly interactions. Accessibility is ensured with WCAG standards compliance, including minimum 36px touch targets. Branding is centralized in `src/config/branding.ts`, featuring a transparent logo, custom favicon, and a teal theme color (#1E9B7B). The chat interface is modal-based with conversation lists in a grid, circular avatars, and unread badges. Map integration uses Leaflet v1.9 with React-Leaflet v5 and OpenStreetMap/Nominatim.

## Technical Implementations

- **State Management**: Primarily React Context API for global state (Authentication, Notifications, Toast) and React hooks for local component state.
- **Form Handling**: React Hook Form v7 with Zod v4 for validation.
- **Authentication**: JWT-based authentication supporting email/password and Google OAuth, with HttpOnly cookies and localStorage tokens. Includes robust role-based access control (`user`, `admin`, `super_admin`) and intelligent 401 handling.
- **Real-time Features**: Polling for chat messages (3-second intervals) and notifications (5-second intervals).
- **Image Management**: Multi-image uploads (up to 5 per item) with Cloudinary integration, including `aspect-square` previews.
- **API Communication**: Axios for HTTP requests, configured with `withCredentials: true`, JWT token injection, a 30-second timeout, and global error handling via interceptors. Handles `FormData` payloads correctly for image uploads.
- **Geolocation Services**: Enhanced "Use Current Location" functionality with secure-context validation, permission pre-checks, timeout handling, and rich error mapping. Falls back to coordinates when reverse geocoding fails.
- **Address Formatting**: Utility functions (`src/utils/address.ts`) for context-aware address formatting (short, full, mobile) and smart filtering of unnecessary location details, including postal codes.
- **Error Handling**: `ErrorBoundary` component for graceful error recovery and a 404 `NotFound` page.
- **Mobile Responsiveness**: Comprehensive audit and design for screens ≤400px.
- **PWA/SEO**: Includes meta tags, `manifest.json`, and viewport settings.

## Feature Specifications

- **Delivery Options**: Integrated delivery/drop-off functionality with free, preset paid ($1-$5), and custom fee options.
- **Search & Discovery**: Location-based search with radius filtering, keyword, category, tag filtering, personalized recommendations, and trending items.
- **Listing Management**: Multi-image upload, address autocomplete with map preview, flexible pricing (free/paid), pickup time windows, and category/tag organization. Duplicate item prevention and custom validity periods are supported.
- **Communication**: One-on-one messaging via modal, conversation threads with visual unread badges, real-time polling, URL-driven entry, pre-filled messages, and an address reveal mechanism.
- **Request Management**: Full request creation with price preferences, quantity, category, location, and validity period. Supports responding to requests with free or paid offers and delivery options.
- **Pickup Request/Exchange Workflow**: Complete end-to-end exchange system with status transitions (`pending`, `awaiting_pickup`, `completed`), automatic item status syncing, address revelation after seller acceptance, and atomic stock adjustments for store items.
- **Store Owner Mode**: Allows verified users to sell items as micro-stores with a Store Activation Section, Store Terms Modal, Store Dashboard, and Store Filter Toggle. Store items are visually distinct.
- **Analytics**: A Community Impact dashboard (`/analytics` page) displays 6 key metrics: Total Members, Items Shared, Requests Fulfilled, Food Saved (lbs), Active Communities, and Open Requests.

## System Design Choices

- **Routing**: React Router v7 handles client-side navigation with public and protected routes.
- **Data Models**: Core entities include User, Item, PickupRequest, Message, Conversation, Notification, ItemRequest, Rating, Badge, and StoreAgreement.
- **Deployment**: Frontend on Vercel, backend on Render, both with auto-deployment from GitHub.

# External Dependencies

## Third-Party Services

- **Cloudinary**: Image hosting and optimization.
- **OpenStreetMap / Nominatim**: Geocoding service and map tiles.
- **Stripe**: Payment processing for paid item transactions.
- **Google OAuth**: Third-party authentication provider.

## Backend API

- **Base URL**: `https://grocery-share-backend.onrender.com`.
- A RESTful API requiring JWT authentication for protected endpoints, using JSON for requests and responses. It supports user management, item listings, chat, notifications, item requests, admin functionalities, analytics, and store owner mode. The API follows a `/api/v1` versioned endpoint structure with a standardized response format.
- **Backend Structure**: Uses root-level `controllers/`, `routes/`, `models/`, and `services/` folders. Main entry point is `index.js`.
- **Backend Reference Files**: Latest backend snapshot in `attached_assets/Backend Refrence/grocery-share-backend-main_as of 12-08-2025/`.

# Recent Changes (Dec 8, 2025)

## Backend Bug Fixes (DEPLOYED)
All 5 critical backend issues fixed and deployed: (1) Items endpoint 500 error, (2) Recommendations 404 error, (3) Admin delete items permission, (4) Address reveal conversation error, (5) Admin delete requests permission.

## Items Section Improvements
- Duplicate item prevention with warning and confirmation
- Dashboard button navigation at top header
- Custom validity period with datetime picker
- Address suggestions optimization for house numbers
- Minimum $3 price for paid items

## Stripe Connect Integration
Complete Stripe Connect Express integration for seller payments:
- Seller onboarding page at `/seller/onboarding`
- 10% platform commission via `application_fee_amount`
- Automatic payouts to sellers via `transfer_data`
- Seller balance/earnings display
- Stripe Express dashboard access
- **Enforcement**: Paid item listings blocked until seller has active Stripe Connect account
- **In-app modal**: When adding paid item, modal prompts user to set up Stripe Connect with country selection
- **40+ supported countries**: US, UK, Canada, EU, Australia, Japan, Singapore, etc.

**Backend Files to Deploy:**
- `BACKEND_stripeConnectController.js` → `controllers/stripeConnectController.js`
- `BACKEND_stripeConnectRoutes.js` → `routes/stripeConnectRoutes.js`
- `BACKEND_paymentController_WITH_CONNECT.js` → `controllers/paymentController.js`
- User model needs `stripeAccountId` and `stripeAccountStatus` fields (see `BACKEND_User_Model_Updates.md`)

**Stripe Dashboard Setup Required:**
1. Enable Connect in Stripe Dashboard
2. Configure Express account settings
3. Set up Connect webhooks

# Recent Changes (Dec 23, 2025)

## Mobile App - IP-Based Location (Matching Web Behavior)
- **Auto-location on startup**: App now uses IP-based geolocation (ip-api.com with ipapi.co fallback) to automatically determine user location
- **No blocking permission flow**: Items load immediately without requiring GPS permission dialog
- **GPS as optional enhancement**: Users can tap "Use GPS" button for precise location
- **24-hour location cache**: Location stored in SharedPreferences, valid for 24 hours
- **Visual indicators**: Globe icon for IP location, pin icon for GPS location
- **LocationProvider changes**: Added `initializeLocation()`, `getLocationFromIP()`, `upgradeToGPS()`, `isIPLocation` flag
- **HomeScreen**: Calls `initializeLocation()` instead of `getCurrentLocation()`
- **ItemsScreen**: Removed blocking "Enable Location" state, shows items immediately with IP location