# Grocery Share (BaskMate)

## Overview

Grocery Share (BaskMate) is a peer-to-peer marketplace facilitating the local exchange, sharing, or sale of grocery items. It caters to both individuals with surplus groceries and store owners managing inventory. The platform features item listings with location-based discovery, a pickup request workflow, Stripe-powered payments (with a 10% platform commission), a dedicated "store mode" for businesses, real-time communication, and a user rating system.

The project aims to create a robust, scalable, and user-friendly platform that addresses food waste and supports local commerce, leveraging modern web and mobile technologies.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Mobile Navigation:** Top-right hamburger menu drawer for primary navigation (Dashboard, My Listed Items, My Requests, Messages, Pickups, Impact, Admin, Profile, Settings, Logout).
- **Item Cards:** Compact horizontal layout with image on the left and details on the right for higher information density.
- **Theming:** Improved contrast for UI elements like ChoiceChips, dropdowns, switches, and popups.

### Technical Implementations
- **Backend (Node.js/Express):**
    - RESTful API with JWT-based authentication and role-based access control.
    - Google OAuth for social login.
    - Core controllers for items (with geospatial queries), pickup requests, payments (Stripe Connect), chat, and notifications.
    - Mongoose models for User, Item, PickupRequest, Notification, Conversation/Message.
    - `inventoryService.js` for atomic inventory management with race condition protection.
- **Frontend (React/TypeScript):**
    - Vite-based application hosted on Vercel.
    - Location-aware item search with map integration.
    - Stripe Elements for payment processing.
- **Mobile (Flutter):**
    - iOS and Android support with Provider-based state management.
    - Stripe SDK integration and location services.
    - Google Places Autocomplete for address input.
    - Robust handling of location permissions and API key management.
- **Authorization:** Item ownership verified by comparing MongoDB ObjectIds; admin roles can bypass ownership checks for moderation.
- **Null Safety:** Defensive programming checks for null references in database records before accessing nested properties.

### Feature Specifications
- **Admin Dashboard:** Full functionality for managing users and items (search, pagination, role changes, suspend/delete).
- **Add/Edit Item:** Comprehensive screen including tag input, listing validity, flexible pickup times, improved location picker with "Use Current Location" and address autocomplete.
- **Stripe Seller Onboarding:** Integrated workflow with status checks and UI feedback.
- **Item Interaction:** Differentiated flows for free (pickup request) and paid (Stripe payment) items, leading to chat initiation.
- **Geospatial:** Utilizes MongoDB's `$near` operator for proximity searches and GeoJSON for storing location data.
- **Debugging & Logging:** Extensive logging for API responses, payloads, and critical workflows (e.g., location, payments, admin actions).

## External Dependencies

-   **Database:** MongoDB Atlas (primary database with geospatial indexing).
-   **Payment Processing:** Stripe (Payment Intents for purchases, Stripe Connect for seller payouts with 10% platform commission).
-   **Image Storage:** Cloudinary (image upload and hosting via `multer-storage`).
-   **Hosting & Deployment:** Render (backend API), Vercel (frontend React app), GitHub (source control).
-   **Authentication:** Google OAuth (social login via Passport.js), JWT (token-based authentication).
-   **Location & Mapping:** Google Places API (autocomplete), `geocoding` package (address-to-coordinates conversion).
-   **Mobile OAuth:** `flutter_web_auth_2` for web-based OAuth flow.
-   **Utilities:** `url_launcher` (opening external URLs), `intl` package (date formatting).