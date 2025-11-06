# Overview

Grocery Share is a peer-to-peer web application that enables users to share, request, and exchange surplus grocery items within their local community. The platform focuses on reducing food waste by connecting people who have excess groceries with those who need them. Users can list items (free or paid), search for available groceries nearby, communicate via real-time chat, and coordinate pickups through an integrated map-based system.

# Recent Changes (November 6, 2025)

**Session 1: Item Request Edit/Delete Functionality**
- Added `updateRequest()` API function in `itemRequests.ts` for editing existing requests
- Implemented edit form handling in `ItemRequests.tsx` using URL parameters (`?edit=requestId`)
- Form auto-populates with existing request data when editing
- Edit/Delete buttons appear only for request owner when status is 'active'
- Dynamic form titles and button text ("Edit Request" vs "Create Request")
- RequestDetail page already had delete functionality with confirmation prompt

**Session 1: Search & Navigation Improvements**
- Dashboard items navigate to ItemDetail page first (not directly to chat)
- Dashboard requests have "View Details" button to open RequestDetail page
- Sold and refunded items excluded from search results (prevents user confusion)
- Separate "Offer to Help" button for initiating chat conversations

**Session 1: Item Status Management**
- Item status enum updated: ['available', 'pending', 'picked_up', 'sold', 'refunded']
- Backend filtering ensures only available items appear in searches
- Status changes properly tracked throughout purchase-to-pickup-or-refund workflow

**Session 1: Deployment & Version Control**
- Fixed Vercel deployment: Removed duplicate grocery-share-frontend folder structure
- Payment features moved to correct root directory for proper build path
- GitHub authentication converted from SSH to HTTPS (Replit compatibility)
- Successfully deployed commits to production

**Session 2: Interest Notification System**
- Added `sendInterestNotification()` API function in `notifications.ts`
- "Interested to Buy" button on ItemDetail page sends notification to seller
- "Interested to Offer" button on RequestDetail page sends notification to requester
- Both buttons prominently displayed above chat/contact sections with clear messaging
- Notifications let creators know someone is interested without forcing immediate contact

**Session 2: Enhanced Dashboard Search**
- Added "Item Type" dropdown filter in search section
- Dropdown allows switching between "Available Items" and "Requested Items"
- Complements existing tab navigation for better user control
- 4-column search grid: Item Type, Search Keyword, Category, Tags/Radius

**Session 2: Verified Features**
- Google OAuth login: Frontend correctly configured, backend handles authentication
- Notification system: Working properly with 60-second polling and bell icon display
- Payment integration: Visible for paid, available, non-owned items on ItemDetail page
- Dashboard auto-load: Geolocation-based item loading on page load with NYC fallback

**Session 3: Flexible Request Pricing System**
- Added price preference fields to request creation form (`pricePreference`, `maxPrice`)
- Two options: "Free Only - Looking for donations" or "Willing to Pay - Set max price"
- Max price field appears conditionally when "Willing to Pay" is selected
- Updated `ItemRequest` interface to include `pricePreference` and `maxPrice` fields
- Request detail page displays payment preference prominently with emoji indicator
- Shows "🆓 Looking for FREE donations" for free_only requests
- Shows "Willing to pay up to $X.XX" for willing_to_pay requests with max price
- Form validation ensures correct data types and required fields
- Edit request form preserves and allows updating price preferences
- Simplified UI flow: Direct action buttons ("Buy Now", "Request This Item", "Offer to Help")
- Removed multi-step "Interested" flow for cleaner user experience

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework & Build System**
- React 19 with TypeScript for type-safe component development
- Vite 7 as the build tool and development server for fast HMR (Hot Module Replacement)
- React Router v7 for client-side routing and navigation
- Strict TypeScript configuration with comprehensive linting rules

**UI & Styling**
- Tailwind CSS v4 for utility-first styling with custom design tokens
- Custom CSS variables for theming (border radius via `--radius`)
- Lucide React for consistent iconography
- Class Variance Authority (CVA) for component variant management
- Custom utility classes for animations (e.g., `animate-slide-in`)

**State Management Pattern**
- React Context API for global state (Authentication, Notifications, Toast messages)
- Local component state with React hooks for UI-specific data
- Custom hooks (`useAuth`, `useToast`) to encapsulate business logic and provide clean APIs

**Form Handling**
- React Hook Form v7 for performant form state management
- Zod v4 for runtime schema validation and type inference
- @hookform/resolvers for seamless integration between React Hook Form and Zod

**Authentication Flow**
- JWT-based authentication with token storage in localStorage
- Support for both email/password and Google OAuth sign-in
- Protected routes using a `ProtectedRoute` wrapper component
- Token auto-injection via Axios interceptors
- Automatic redirect to login on 401 responses

**Map Integration**
- Leaflet v1.9 with React-Leaflet v5 for interactive maps
- OpenStreetMap tiles for map rendering
- Nominatim (free geocoding service) for address search and coordinate conversion
- Custom marker handling to fix default icon issues in React-Leaflet

**Real-time Features**
- Polling-based approach for chat messages (5-second intervals)
- Notification system with unread count tracking
- Toast notifications for user feedback on actions

**Image Management**
- Multi-image upload support (up to 5 images per item)
- Cloudinary integration for image hosting
- Public ID extraction utility for image deletion
- Image preview functionality with file validation

## Backend Integration

**API Communication**
- Axios as the HTTP client with centralized configuration
- Base URL configured via environment variable (`VITE_BACKEND_URL`)
- Default fallback to production backend: `https://grocery-share-backend.onrender.com`
- Automatic JWT token injection in request headers
- Global error handling with 401 redirect

**API Structure**
The frontend organizes API calls into logical modules:
- `auth.ts` - Registration, login, password management
- `items.ts` - CRUD operations for grocery listings
- `chat.ts` - Conversations, messages, message status updates
- `notifications.ts` - Notification retrieval and read status
- `itemRequests.ts` - Community requests for needed items
- `recommendations.ts` - Personalized and trending item suggestions
- `ratings.ts` - User rating and review system
- `gamification.ts` - Badges and achievements
- `payment.ts` - Stripe integration for paid items
- `address.ts` - Address reveal functionality
- `contact.ts` - Contact form submissions

## Data Models

**Core Entities**
- **User**: id, name, email, password/googleId, created timestamp
- **Item**: id, name, images, category, tags, expiry date, price, isFree flag, pickup times, location (lat/lng/address), user reference
- **Message**: id, sender, receiver, message text, read status, timestamp
- **Conversation**: id, participants, item reference, last message metadata
- **Notification**: id, type (nearby_free, new_match, etc.), message, read status, item reference
- **ItemRequest**: id, user, item details, location, status (active/fulfilled/cancelled), responses
- **Rating**: id, rater, ratee, rating (1-5), review text, item reference
- **Badge**: id, name, description, icon, criteria, category

**Location Handling**
- Address input with autocomplete suggestions
- Coordinate-based proximity search with configurable radius
- Privacy-first approach: addresses hidden until mutual consent

## Routing Structure

**Public Routes**
- `/login` - User authentication
- `/register` - New account creation
- `/auth/callback` - Google OAuth callback handler
- `/terms` - Terms of Service
- `/privacy` - Privacy Policy
- `/contact` - Contact form

**Protected Routes** (require authentication)
- `/dashboard` - Main discovery interface with search and recommendations
- `/my-items` - User's listed items with edit/delete capabilities
- `/add-item` - Multi-step item listing form
- `/edit-item/:id` - Item editing interface
- `/chat` - Messaging interface with conversation list
- `/item-requests` - Community request board
- `/profile` - User profile, ratings, badges, account management

**Route Protection**
- `ProtectedRoute` component checks authentication status
- Redirects to `/login` for unauthenticated users
- Loading state handling during auth verification

## Key Features

**Search & Discovery**
- Location-based item search with radius filtering
- Keyword, category, and tag-based filtering
- Personalized recommendations based on user behavior
- Trending items in user's vicinity

**Listing Management**
- Multi-image upload with Cloudinary integration
- Address autocomplete with map preview
- Flexible pricing (free or paid)
- Pickup time windows (flexible or scheduled)
- Category and tag organization

**Communication**
- One-on-one messaging system
- Conversation threads organized by items
- Unread message indicators
- Real-time polling for new messages
- Address reveal mechanism for confirmed pickups

**Gamification**
- Badge system for user achievements
- Categories: sharing, engagement, community, milestone
- User rating and review system
- Average rating display on profiles

**Safety & Privacy**
- Addresses hidden by default (only zip code visible)
- Mutual consent required for address reveal
- Pickup confirmation workflow
- User rating system for trust building

# External Dependencies

## Third-Party Services

**Cloudinary**
- Image hosting and optimization
- CDN delivery for uploaded item photos
- Requires API credentials configured on backend

**OpenStreetMap / Nominatim**
- Free geocoding service for address search
- Map tiles for Leaflet integration
- No API key required (rate-limited)

**Stripe** (Payment Processing)
- Payment intents for paid item transactions
- Configuration endpoint: `/payment/config`
- Publishable key retrieved from backend

**Google OAuth**
- Third-party authentication provider
- Callback handled via `/auth/callback` route

## Backend API

**Base URL**: `https://grocery-share-backend.onrender.com`
- RESTful API architecture
- JWT authentication required for protected endpoints
- JSON request/response format

## Build & Deployment

**Development Tools**
- ESLint with TypeScript support for code quality
- Vite dev server on port 5000 with HMR
- TypeScript compiler for type checking

**Production Deployment**
- Vercel platform (configured via `vercel.json`)
- Environment variable: `VITE_BACKEND_URL`
- SPA routing handled via rewrites to `/index.html`
- Build command: `npm run build`
- Output directory: `dist`

**Development Environment**
- Node.js environment
- npm for package management
- Local development on `0.0.0.0:5000` for network accessibility