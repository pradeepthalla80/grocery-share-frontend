# Overview

Grocery Share is a peer-to-peer web application designed to reduce food waste by enabling users to share, request, and exchange surplus grocery items within their local community. The platform aims to connect individuals with excess groceries to those in need, facilitating both free and paid item listings. Key capabilities include listing items, searching for nearby groceries, real-time chat, and map-based pickup coordination. The project's vision is to foster community sharing, combat food insecurity, and promote sustainable consumption.

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

The UI is built with React 19, TypeScript, and Vite 7. Styling uses Tailwind CSS v4 with custom design tokens, Lucide React for iconography, and Class Variance Authority (CVA) for component variants. The chat interface features a modern modal-based design with conversation lists in a grid, circular avatars, rounded message bubbles, gradient backgrounds, and unread badges. Notifications use a bell icon and navigate to the `/chat` page. Map integration uses Leaflet v1.9 with React-Leaflet v5 and OpenStreetMap/Nominatim.

## Technical Implementations

- **State Management**: Primarily uses React Context API for global state (Authentication, Notifications, Toast messages) and React hooks for local component state.
- **Form Handling**: React Hook Form v7 integrated with Zod v4 for validation.
- **Authentication**: JWT-based authentication supporting email/password and Google OAuth. A dual system uses HttpOnly cookies (primary) and localStorage tokens (fallback for mobile browsers). A request interceptor adds `Authorization: Bearer {token}` or `withCredentials: true`. Intelligent 401 handling prevents logout during OAuth flows and initial checks, while triggering re-authentication for genuine session expiry. Robust role-based access control (`user`, `admin`, `super_admin`) is implemented with an Admin Dashboard. Enhanced for app stores with strong password requirements, real-time strength indicators, and strict validation.
- **Real-time Features**: Achieved through polling for chat messages (3-second intervals) and notifications (5-second intervals).
- **Image Management**: Multi-image uploads (up to 5 per item) with Cloudinary integration.
- **API Communication**: Axios is used for HTTP requests, configured with `withCredentials: true`, automatic JWT token injection, a 30-second timeout, and intelligent error handling. A global interceptor manages network errors, timeouts, and server errors with toast notifications. **Critical Fix (Nov 14, 2025)**: Request interceptor now detects FormData payloads and removes the JSON Content-Type header, allowing the browser to set the correct multipart/form-data boundary for image uploads. This prevents 500 errors and auth logout during item creation.
- **Geolocation Services**: Enhanced "Use Current Location" functionality with secure-context validation (HTTPS/localhost check), permission pre-check via Permissions API, 10-second timeout handling, rich error mapping with toast notifications, and inline actionable hints for recovery. Falls back to coordinates when reverse geocoding fails. All error messages are mobile-friendly and non-blocking.
- **Address Formatting**: Utility functions (`src/utils/address.ts`) provide context-aware address formatting: `formatAddressShort()` for cards/chips, `formatAddressFull()` for detail pages, and `formatAddressMobile()` for responsive truncation on ≤400px screens.
- **Error Handling**: Implemented `ErrorBoundary` component for graceful error recovery and a 404 `NotFound` page.
- **Mobile Responsiveness**: Comprehensive audit ensures mobile readiness for screens ≤400px.
- **PWA/SEO**: Includes comprehensive meta tags, `manifest.json`, and proper viewport settings.

## Feature Specifications

- **Delivery Options**: Integrated delivery/drop-off functionality for items and requests, allowing users to select free or paid delivery ($1-$5). Buyers can toggle delivery during checkout with live price breakdown.
- **Search & Discovery**: Location-based search with radius filtering, keyword, category, and tag filtering, personalized recommendations, and trending items.
- **Listing Management**: Multi-image upload, address autocomplete with map preview, flexible pricing (free/paid), pickup time windows, and category/tag organization.
- **Communication**: One-on-one messaging via modal popup, conversation threads with visual unread badges, real-time polling, URL-driven chat entry, pre-filled messages, and an address reveal mechanism.
- **Request Management**: Full request creation with price preferences ("Free Only" or "Willing to Pay up to $X"), quantity, category, location, and validity period. Backend supports `pricePreference` and `maxPrice`.
- **Request Offers**: Full support for both free and paid offers with delivery options when responding to requests.
- **Pickup Request/Exchange Workflow**: Complete end-to-end exchange system for both free and paid items. The `PickupRequest` status transitions from `pending` to `awaiting_pickup` to `completed`. Item status syncs automatically (`available` → `awaiting_pickup` → `completed`). Buyers create pickup requests, and sellers manage them via a dedicated page. Address is revealed only after seller acceptance. Both parties confirm completion. Cancel flow resets items to `available`. Store item inventory features atomic stock adjustments and race condition protection.
- **Store Owner Mode**: Allows verified users to sell items as micro-stores. Users must accept T&Cs. Features include a Store Activation Section, Store Terms Modal, Store Dashboard, and Store Filter Toggle. Store items are visually distinct with a 🛒 badge, "Store Item" label, stock count, and blue gradient background. Search integrates both community and store items.
- **Gamification**: Badge system for achievements and a user rating/review system.
- **Safety & Privacy**: Addresses are hidden by default, requiring mutual consent for revealing, and a pickup confirmation workflow.
- **Analytics**: A Community Impact dashboard (`/analytics` page) displays 6 key metrics: Total Members, Items Shared, Requests Fulfilled, Food Saved (lbs), Active Communities, and Open Requests, with real-time data from MongoDB.

## System Design Choices

- **Routing**: React Router v7 handles client-side navigation with public and protected routes managed by a `ProtectedRoute` component.
- **Data Models**: Core entities include User, Item, PickupRequest, Message, Conversation, Notification, ItemRequest, Rating, Badge, and StoreAgreement.
- **Deployment**: Frontend is deployed on Vercel, and the backend is deployed on Render, both with auto-deployment from GitHub.

# External Dependencies

## Third-Party Services

- **Cloudinary**: Image hosting and optimization.
- **OpenStreetMap / Nominatim**: Geocoding service and map tiles for location functionalities.
- **Stripe**: Payment processing for paid item transactions.
- **Google OAuth**: Third-party authentication provider.

## Backend API

- **Base URL**: `https://grocery-share-backend.onrender.com`.
- A RESTful API requiring JWT authentication for protected endpoints, using JSON for requests and responses. The backend supports user management, item listings, chat, notifications, item requests, admin functionalities, analytics, and store owner mode. The API follows a `/api/v1` versioned endpoint structure with a standardized response format: `{ success, data, message, error }`.
- **Backend Structure**: The backend repository uses root-level `controllers/`, `routes/`, `models/`, and `services/` folders. The main entry point is `index.js`.
- **Deployment Status**: Backend deployed on Render with auto-deploy from GitHub. Frontend deployed on Vercel.
- **Backend Reference Files**: The complete backend snapshot is stored in the `grocery-share-backend-main_11-13-2025_10-58am/` folder.