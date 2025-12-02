# Overview

BaskMate (formerly Grocery Share) is a peer-to-peer web application designed to reduce food waste by enabling users to share, request, and exchange surplus grocery items within their local community. Tagline: "Your Emergency Pantry Next Door". The platform aims to connect individuals with excess groceries to those in need, facilitating both free and paid item listings. Key capabilities include listing items, searching for nearby groceries, real-time chat, and map-based pickup coordination. The project's vision is to foster community sharing, combat food insecurity, and promote sustainable consumption.

**Ultra-Compact Design System (Nov 20, 2025)**: Entire app optimized for minimal space usage with uniform compact design across all pages. Space savings of ~50-60% achieved through reduced padding (py-4, p-3), smaller margins (mb-3, mb-4), compact text sizes (text-xs, text-sm, text-2xl headings), and tighter component spacing (gap-2). All boxes, cards, and containers minimized while maintaining mobile responsiveness and touch-friendly interactions (≤400px screens).

**Accessibility System (Nov 21, 2025)**: Comprehensive accessibility refinement ensures all interactive elements meet WCAG standards while preserving ultra-compact design. Shared utility classes in `src/index.css` enforce consistency: `.bm-touch` (≥36px touch targets for all buttons/controls), `.bm-label` (text-sm for critical labels), `.bm-helper` (text-xs for secondary content). All interactive elements across Dashboard, MyItems, ItemRequests, AdminDashboard, ItemCard, and Navbar upgraded to meet minimum touch target requirements. Critical information (prices, CTAs, status labels, metadata) uses text-sm for readability, while secondary elements (badges, helper text, counts) appropriately use text-xs. System balances maximum content visibility with accessibility compliance for future mobile app conversion.

**Ultra-Compact Refinement v2 (Nov 21, 2025)**: Further space optimization across all pages to maximize content density. ItemCard completely refactored to horizontal layout (50-60% reduction) with 80px square thumbnail on left (w-20 aspect-square object-contain, shows FULL image without cropping) and all content on right side. All text/icons reduced (text-xs, h-3 icons), buttons maintain min-h-[36px]. Analytics metric boxes reduced by 35% (p-2 cards, smaller icons). AdminDashboard massively optimized with 60-70% space reduction (header p-6→p-2, stats p-6→p-2, h-6 icons vs h-12, text-lg vs text-2xl, table px-3 py-2 vs px-6 py-4). StoreDashboard reduced by 40% (p-2 header/stats, h-6 icons, text-lg numbers). MyItems stats boxes reduced by 30% (p-2, h-5 icons, .bm-label). ItemRequests cards and form reduced by 25-33% (p-2/p-3). All pages now fit significantly more content per viewport while maintaining ≥36px touch targets.

**Backend Bug Fixes (Nov 21, 2025)**: Identified and created fixes for 4 critical backend issues: (1) Items endpoint 500 error - added null check for deleted users in getItemsByLocation (line 378 itemsController.js), (2) Recommendations 404 error - registered missing /api/v1/recommendations route in index.js, (3) Admin delete permission - added admin role check allowing super_admin/admin to delete any item (lines 686-691 itemsController.js), (4) Reveal address conversation error - fixed ObjectId comparison by adding .toString() to req.user.userId (line 16 addressController.js). Complete fixed files ready for deployment: BACKEND_FIXED_index.js, BACKEND_FIXED_itemsController.js, BACKEND_FIXED_addressController.js.

**Custom Delivery Fee (Nov 21, 2025)**: Added "Custom Fee" option to delivery fee selection in both AddItem.tsx and OfferModal.tsx. Users can now enter any custom delivery amount instead of only choosing from preset $1-$5 options. Custom fee input appears when "Custom Fee" radio button is selected, with a numeric input field supporting decimal values.

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

**Branding System (Nov 20, 2025)**: Centralized branding configuration implemented in `src/config/branding.ts` for easy logo and app name updates. The BaskMate logo (`/public/logo.png`) features a transparent background with tight cropping for optimal display - icon + "BaskMate" text + tagline "Your Emergency Pantry Next Door". Custom favicon (`/public/favicon.png`) created with circular basket icon for browser tabs and mobile home screens. Logo scales responsively (h-20 to h-28) in navbar on mobile and desktop. Meta tags, manifest, and page titles updated to "BaskMate - Your Emergency Pantry Next Door". Theme color updated to #1E9B7B (teal from logo).

## Technical Implementations

- **State Management**: Primarily uses React Context API for global state (Authentication, Notifications, Toast messages) and React hooks for local component state.
- **Form Handling**: React Hook Form v7 integrated with Zod v4 for validation.
- **Authentication**: JWT-based authentication supporting email/password and Google OAuth. A dual system uses HttpOnly cookies (primary) and localStorage tokens (fallback for mobile browsers). A request interceptor adds `Authorization: Bearer {token}` or `withCredentials: true`. Intelligent 401 handling prevents logout during OAuth flows and initial checks, while triggering re-authentication for genuine session expiry. Robust role-based access control (`user`, `admin`, `super_admin`) is implemented with an Admin Dashboard. Enhanced for app stores with strong password requirements, real-time strength indicators, and strict validation.
- **Real-time Features**: Achieved through polling for chat messages (3-second intervals) and notifications (5-second intervals).
- **Image Management**: Multi-image uploads (up to 5 per item) with Cloudinary integration. **Critical Fix (Nov 16, 2025)**: Image preview component now uses Tailwind's `aspect-square` class with proper overlay z-indexing. Fixed black box issue caused by `bg-black bg-opacity-0` rendering as solid black instead of transparent - overlay now only applies on hover with `group-hover:bg-black group-hover:bg-opacity-30` and `pointer-events-none/auto` for proper interaction.
- **API Communication**: Axios is used for HTTP requests, configured with `withCredentials: true`, automatic JWT token injection, a 30-second timeout, and intelligent error handling. A global interceptor manages network errors, timeouts, and server errors with toast notifications. **Critical Fix (Nov 14, 2025)**: Request interceptor now detects FormData payloads and removes the JSON Content-Type header, allowing the browser to set the correct multipart/form-data boundary for image uploads. This prevents 500 errors and auth logout during item creation.
- **Geolocation Services**: Enhanced "Use Current Location" functionality with secure-context validation (HTTPS/localhost check), permission pre-check via Permissions API, 10-second timeout handling, rich error mapping with toast notifications, and inline actionable hints for recovery. Falls back to coordinates when reverse geocoding fails. All error messages are mobile-friendly and non-blocking.
- **Address Formatting**: Utility functions (`src/utils/address.ts`) provide context-aware address formatting: `formatAddressShort()` for cards/chips (includes zipcode and filters out township/county/suburb details), `formatAddressFull()` for detail pages, and `formatAddressMobile()` for responsive truncation on ≤400px screens. **Enhancement (Nov 16, 2025)**: Smart filtering removes unnecessary location details (townships, counties, boroughs) from both dropdown suggestions and selected addresses, and includes postal codes for cleaner address display. Dropdown now shows clean addresses before selection.
- **Error Handling**: Implemented `ErrorBoundary` component for graceful error recovery and a 404 `NotFound` page.
- **Mobile Responsiveness**: Comprehensive audit ensures mobile readiness for screens ≤400px.
- **PWA/SEO**: Includes comprehensive meta tags, `manifest.json`, and proper viewport settings.

## Feature Specifications

- **Delivery Options**: Integrated delivery/drop-off functionality for items and requests, allowing users to select free or paid delivery ($1-$5). Buyers can toggle delivery during checkout with live price breakdown.
- **Search & Discovery**: Location-based search with radius filtering, keyword, category, and tag filtering, personalized recommendations, and trending items.
- **Listing Management**: Multi-image upload, address autocomplete with map preview, flexible pricing (free/paid), pickup time windows, and category/tag organization.
- **Communication**: One-on-one messaging via modal popup, conversation threads with visual unread badges (red color highlighting), real-time polling (3-second intervals), URL-driven chat entry, pre-filled messages, and an address reveal mechanism. **Enhancement (Nov 16, 2025)**: Backend now calculates and returns `unreadCount` for each conversation, enabling proper red highlighting of conversation cards with unread messages. Unread messages display with red backgrounds, borders, and "New" badges for easy identification.
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
- **Backend Reference Files**: The latest backend snapshot is stored in `attached_assets/Backend Refrence/grocery-share-backend-main_11-19-2025_time_10-05am/grocery-share-backend-main_as off 12-02-2025/`. This is the production-ready backend code from GitHub as of December 2, 2025. Previous snapshots are also available in the `Backend Refrence` folder for historical reference.