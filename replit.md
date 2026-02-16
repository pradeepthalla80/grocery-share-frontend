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
- **Add/Edit Item:** Comprehensive screen including tag input, listing validity, flexible pickup times, improved location picker with "Use Current Location" and address autocomplete. Barcode scanner (PWA) for auto-filling item details via 3-database lookup chain: Open Food Facts (4M+ food products) -> UPC Item DB (681M+ products) -> FatSecret (1.9M+ foods, 56 markets including Asian groceries). Stripe account status warning for paid items.
- **FatSecret Integration:** OAuth2 client credentials flow proxied through Vite dev server plugin (dev) and Vercel serverless function (prod) at `/api/fatsecret/barcode/:barcode`. Token cached for 24h. Credentials stored as secrets: `FATSECRET_CLIENT_ID`, `FATSECRET_CLIENT_SECRET`.
- **Stripe Seller Onboarding:** Integrated workflow with status checks and UI feedback.
- **Item Interaction:** Differentiated flows for free (pickup request) and paid (Stripe payment) items, leading to chat initiation.
- **Geospatial:** Utilizes MongoDB's `$near` operator for proximity searches and GeoJSON for storing location data.
- **Debugging & Logging:** Extensive logging for API responses, payloads, and critical workflows (e.g., location, payments, admin actions).

## Future Phase: Hugging Face AI Enhancements

**Status:** Planned (not implemented). Waiting until Flutter app and core features are stable.
**Constraint:** All AI processing goes on the backend (new Node.js endpoints). Flutter app only needs new Dio service methods (no new packages, no SDK changes). PWA calls the same endpoints.
**Cost:** Hugging Face free tier for low traffic; $9/month PRO plan for reliable production use.

### Priority 1: Smart Food Image Recognition (Add Item flow)
- **Purpose:** Auto-detect food type from uploaded photo, suggest category and item name
- **Models:** `Kaludi/food-category-classification-v2.0` (12 categories), `nateraw/food` (101 food types, 89% accuracy)
- **Backend:** New `POST /api/v1/ai/recognize-food` endpoint
- **Flutter:** New method in `items_service.dart`, call before form submission in `add_item_screen.dart`
- **PWA:** New API function + UI suggestion in AddItem page

### Priority 2: Chat Moderation & Safety
- **Purpose:** Auto-filter inappropriate/scam messages in buyer-seller chat
- **Models:** `KoalaAI/Text-Moderation` (lightweight, 0.3B params, fast), `google/shieldgemma-2b` (more thorough)
- **Backend:** Middleware on `POST /api/v1/chat/messages` to check content before saving
- **Flutter/PWA:** No changes needed (backend filters transparently)

### Priority 3: Smart Semantic Search (Item Discovery)
- **Purpose:** Understand search intent ("healthy breakfast" finds eggs, bread, cereal) instead of keyword-only matching
- **Models:** `sentence-transformers/all-MiniLM-L6-v2` (fast, 67M params), `sentence-transformers/all-mpnet-base-v2` (best quality)
- **Backend:** Pre-compute embeddings for items, new `GET /api/v1/items/smart-search` endpoint
- **Flutter:** New search mode in `items_service.dart`
- **PWA:** New search option in Dashboard

### Priority 4: Food Freshness Detection (Trust & Safety)
- **Purpose:** Analyze item photos to show freshness score badge on listings
- **Models:** `RicardoPoleo/custom_cnn_model` (fresh vs rotten, 28 categories)
- **Backend:** New `POST /api/v1/ai/freshness-check` endpoint, called during item creation
- **Flutter/PWA:** Display freshness badge on item cards

### Priority 5: Review Sentiment Analysis (Rating System)
- **Purpose:** Auto-analyze review text to detect sentiment trends, flag suspicious reviews
- **Models:** `nlptown/bert-base-multilingual-uncased-sentiment` (1-5 star prediction, 6 languages)
- **Backend:** Process on review submission, store sentiment score
- **Flutter/PWA:** Show sentiment summary on profiles

### Priority 6: Multilingual Translation (Expanding User Base)
- **Purpose:** Auto-translate item descriptions and chat messages
- **Models:** `facebook/nllb-200-distilled-600M` (200 languages, fast), `alirezamsh/small100` (3.6x faster)
- **Backend:** New `POST /api/v1/ai/translate` endpoint
- **Flutter/PWA:** Toggle for translated view on items and chat

### Implementation Notes
- All features are additive (no existing endpoints change)
- Flutter impact: Only new service methods in existing files, no pubspec.yaml changes
- Free tier caveat: Cold starts can take 10-30 seconds on first call; consider caching
- Secret needed: `HUGGINGFACE_API_TOKEN` (free to create at huggingface.co/settings/tokens)

## External Dependencies

-   **Database:** MongoDB Atlas (primary database with geospatial indexing).
-   **Payment Processing:** Stripe (Payment Intents for purchases, Stripe Connect for seller payouts with 10% platform commission).
-   **Image Storage:** Cloudinary (image upload and hosting via `multer-storage`).
-   **Hosting & Deployment:** Render (backend API), Vercel (frontend React app), GitHub (source control).
-   **Authentication:** Google OAuth (social login via Passport.js), JWT (token-based authentication).
-   **Location & Mapping:** Google Places API (autocomplete), `geocoding` package (address-to-coordinates conversion).
-   **Mobile OAuth:** `flutter_web_auth_2` for web-based OAuth flow.
-   **Utilities:** `url_launcher` (opening external URLs), `intl` package (date formatting).