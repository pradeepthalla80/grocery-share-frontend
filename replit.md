# Overview

Grocery Share is a peer-to-peer web application designed to reduce food waste by enabling users to share, request, and exchange surplus grocery items within their local community. The platform connects individuals with excess groceries to those in need, facilitating both free and paid item listings. Key capabilities include listing items, searching for nearby groceries, real-time chat communication, and integrated map-based pickup coordination. The vision is to foster community sharing, combat food insecurity, and promote sustainable consumption habits.

# Recent Changes (November 6, 2025)

## Session: Button Visibility & OAuth Fixes

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