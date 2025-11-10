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
- **Authentication**: JWT-based authentication supporting email/password and Google OAuth, with tokens stored in `localStorage`. Includes a robust role-based access control system (`user`, `admin`, `super_admin`) with an Admin Dashboard. **Enhanced for App Stores**: Strong password requirements (8+ chars, mixed case, numbers, special characters), real-time password strength indicator, password confirmation field, strict email validation, and mobile-optimized design ready for iOS/Android submission.
- **Real-time Features**: Achieved through polling for chat messages (3-second intervals) and notifications (5-second intervals), with unread counts and toast notifications.
- **Image Management**: Multi-image uploads (up to 5 per item) with Cloudinary integration.
- **API Communication**: Axios for HTTP requests, configured with automatic JWT token injection, 30-second timeout, and global error handling including toast notifications for network errors, timeouts, server errors, and session expiry.
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
- **Gamification**: Badge system for achievements and a user rating/review system.
- **Safety & Privacy**: Addresses are hidden by default, requiring mutual consent for revealing, and a pickup confirmation workflow.
- **Analytics**: Community Impact dashboard (`/analytics` page) displaying 6 key metrics: Total Members, Items Shared, Requests Fulfilled, Food Saved (lbs), Active Communities, and Open Requests. Backend endpoint `/api/v1/analytics/impact` returns real-time data from MongoDB. Frontend includes smart fallback to demo data if backend is unavailable. Metrics calculated from User, Item, and ItemRequest collections.

## System Design Choices

- **Routing**: React Router v7 handles client-side navigation with public and protected routes managed by a `ProtectedRoute` component.
- **Data Models**: Core entities include User, Item, Message, Conversation (with unreadCount), Notification, ItemRequest (with pricePreference and maxPrice), Rating, and Badge.
- **Deployment**: Frontend is deployed on Vercel, and the backend is deployed on Render, both with auto-deployment from GitHub.

# External Dependencies

## Third-Party Services

- **Cloudinary**: Image hosting and optimization.
- **OpenStreetMap / Nominatim**: Geocoding service and map tiles for location functionalities.
- **Stripe**: Payment processing for paid item transactions.
- **Google OAuth**: Third-party authentication provider.

## Backend API

- **Base URL**: `https://grocery-share-backend.onrender.com`.
- A RESTful API requiring JWT authentication for protected endpoints, using JSON for requests and responses. The backend supports user management, item listings, chat, notifications, item requests (with price preferences), admin functionalities, and analytics. The API follows a `/api/v1` versioned endpoint structure with a standardized response format: `{ success, data, message, error }`.
- **Backend Structure**: Backend repository uses root-level `controllers/`, `routes/`, `models/`, and `services/` folders. Main entry point is `index.js` at root level (NOT in src/). Files: `controllers/analyticsController.js`, `routes/analytics.js`.
- **Deployment Status**: Backend deployed on Render with auto-deploy from GitHub. Latest commit: `039263d` (Analytics endpoint implementation). Frontend deployed on Vercel, latest push includes analytics API path fix (`184440d`).