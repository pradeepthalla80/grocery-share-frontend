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
- **Stacking Context:** `<main>` element in App.tsx has `position: relative; z-index: 1; isolation: isolate` to contain all page content (including Leaflet maps) within a single stacking context.
- **BottomNav Portal:** BottomNav renders via React `createPortal` to `document.body`, completely escaping the DOM tree and all stacking contexts. Uses `<button type="button">` with `navigate()` instead of `<Link>` to avoid iOS Safari touch issues with anchor tags. z-index 99999 + `pointerEvents: auto`.
- **Chat Safety:** Backend `sendMessage` validates receiverId (ObjectId format, user exists, not self-messaging). Frontend shows descriptive errors for timeouts, network issues, and moderation flags.
- **Mongoose Virtuals:** All core models (User, Item, ItemRequest, Conversation) have `toJSON: { virtuals: true }` and `toObject: { virtuals: true }` configured to ensure `id` virtual is always present in responses (prevents "Invalid receiver ID" when user subdocuments are populated and serialized).
- **Stripe Link UX:** AddItem page shows a prominent full-width green `<button type="button">` for Stripe setup (uses `navigate('/profile')` to avoid form interference) where both store-owners and regular users can complete Stripe onboarding.
- **Category Dropdown:** AddItem uses `<select>` dropdown matching backend Item model enum (18 categories). AI suggestions and barcode scans map to valid categories via `mapToValidCategory()`.
- **Price Validation:** Minimum $3.00 enforced for paid items in both frontend (onSubmit check + toast) and backend (400 error). Prevents Stripe processing failures.

### Feature Specifications
- **Plans & Pricing:** Dynamic subscription system with admin-managed plans stored in MongoDB (PlatformSettings singleton):
  - Default tiers: Free (5%), Plus ($4.99/mo, 3%), Mini Store ($19.99/mo, 2%)
  - Admin can create/edit/delete/deactivate plans via Admin Dashboard "Plans & Settings" tab
  - Monthly and yearly billing intervals supported; admin sets optional yearlyPrice per plan
  - PlansAndPricing page shows monthly/yearly toggle when yearly prices exist; strikethrough savings display
  - ZIP-based availability checking for Mini Store tier
  - Stripe Checkout Sessions for subscription creation (monthly or yearly interval), webhook-driven plan activation
  - Commission rates dynamically applied based on seller's plan during payment processing
  - Inactive plans hidden from users and blocked from checkout
  - **Test Mode:** Admin toggle that unlocks all features for all users (highest tier, lowest commission) for pre-launch testing; amber banner shown across app when active
  - **Backend:** `models/PlatformSettings.js`, `services/planService.js` (30s cache), `controllers/planAdminController.js`, `routes/planAdmin.js` (admin-protected CRUD + auth-protected test-mode status)
  - **Frontend:** `api/planAdmin.ts`, `PlansAdmin` component in AdminDashboard, `TestModeBanner` component, dynamic `PlansAndPricing` page with API fallback to hardcoded defaults
- **Mini Store System:** Backend models (MiniStoreSettings, MiniStoreRequest), ZIP-based capacity management (per-ZIP max stores), admin global controls (enable/disable, waitlist, approval), ZIP-specific settings (pause, disable, waitlist-only, approval-required), request/waitlist queue management. Admin endpoints protected with requireAdmin middleware.
- **Admin Dashboard:** Full functionality for managing users and items (search, pagination, role changes, suspend/delete). Mini Store tab for global controls, ZIP settings, and request/waitlist management.
- **Add/Edit Item:** Comprehensive screen including tag input, listing validity, flexible pickup times, improved location picker with "Use Current Location" and address autocomplete. Barcode scanner (PWA) for auto-filling item details via 3-database lookup chain: Open Food Facts (4M+ food products) -> UPC Item DB (681M+ products) -> FatSecret (1.9M+ foods, 56 markets including Asian groceries). Stripe account status warning for paid items.
- **FatSecret Integration:** OAuth2 client credentials flow proxied through Vite dev server plugin (dev) and Vercel serverless function (prod) at `/api/fatsecret/barcode/:barcode`. Token cached for 24h. Credentials stored as secrets: `FATSECRET_CLIENT_ID`, `FATSECRET_CLIENT_SECRET`.
- **Stripe Seller Onboarding:** Integrated workflow with status checks and UI feedback.
- **Item Interaction:** Differentiated flows for free (pickup request) and paid (Stripe payment) items, leading to chat initiation.
- **Geospatial:** Utilizes MongoDB's `$near` operator for proximity searches and GeoJSON for storing location data.
- **Chat System:** Redesigned chat UI with WhatsApp-style bubbles, date group separators, unread badges, gradient avatars, read receipts. Backend conversation lookup safely handles item-specific vs general chats. Pre-filled messages from ItemDetail/RequestDetail auto-populate input. All entry channels verified: ItemDetail, ItemRequests (Help), RequestDetail (Contact Requester), Dashboard, ItemCard.
- **Debugging & Logging:** Extensive logging for API responses, payloads, and critical workflows (e.g., location, payments, admin actions).

## Hugging Face AI Features

**Status:** Priorities 1-4 IMPLEMENTED. Priorities 5-6 planned for future.
**Constraint:** All AI processing on backend (new Node.js endpoints). Flutter app unaffected (no new packages, no SDK changes). PWA calls new endpoints.
**Cost:** Hugging Face free tier ($0). Cold starts 10-30s on first call. Optional $9/month PRO for faster responses.
**Secret:** `HUGGINGFACE_API_TOKEN` - must also be set in Render backend environment variables.

### IMPLEMENTED - Priority 1: Smart Food Image Recognition
- **Backend:** `POST /api/v1/ai/recognize-food` - `services/aiService.js` + `controllers/aiController.js`
- **Models:** `Kaludi/food-category-classification-v2.0` (12 categories), `nateraw/food` (101 food types)
- **PWA:** Auto-analyzes uploaded photos in AddItem, shows purple suggestion bar with name/category. Complements barcode scanner (barcode for packaged items, AI for fresh produce/homemade).
- **Flutter:** Not yet integrated (just needs new Dio service method)

### IMPLEMENTED - Priority 2: Chat Moderation & Safety
- **Backend:** `middleware/chatModeration.js` inserted in `routes/chat.js` on `POST /messages`
- **Models:** `KoalaAI/Text-Moderation` for AI content check + regex scam pattern detection (venmo, cashapp, gift cards, etc.)
- **Behavior:** Blocks flagged messages with user-friendly error. Falls back to allowing messages if AI unavailable.
- **Flutter/PWA:** No changes needed (transparent backend filtering)

### IMPLEMENTED - Priority 3: Smart Semantic Search
- **Backend:** `GET /api/v1/ai/smart-search` - uses `sentence-transformers/all-MiniLM-L6-v2` embeddings
- **PWA:** "AI Search" toggle button on Dashboard keyword field. Purple styling when active. Falls back to regular search on error.
- **Behavior:** Computes cosine similarity between query and item text (name+category+tags+description). Returns items with >25% similarity, ranked by relevance.
- **Flutter:** Not yet integrated

### IMPLEMENTED - Priority 4: Food Freshness Detection
- **Backend:** `POST /api/v1/ai/freshness-check` - `RicardoPoleo/custom_cnn_model`
- **PWA:** Freshness badge on ItemCard (green "Fresh", yellow "OK", red "Check" with percentage)
- **Flutter:** Not yet integrated

### PLANNED - Priority 5: Review Sentiment Analysis
- **Models:** `nlptown/bert-base-multilingual-uncased-sentiment` (1-5 star prediction)

### PLANNED - Priority 6: Multilingual Translation
- **Models:** `facebook/nllb-200-distilled-600M` (200 languages)

### AI Architecture Notes
- All AI files: `services/aiService.js`, `controllers/aiController.js`, `routes/ai.js`, `middleware/chatModeration.js`
- Route registered at `/api/v1/ai` in `index.js`
- Image endpoints accept both file upload (multipart) and `imageUrl` (JSON body)
- 60-second timeout for AI API calls (handles cold starts)
- Auto-retry on 503 (model loading) with estimated wait time

## GitHub Push Instructions

**Two repos to push:**
- **Frontend:** `https://github.com/pradeepthalla80/grocery-share-frontend` (triggers Vercel auto-deploy)
- **Backend:** `https://github.com/pradeepthalla80/grocery-share-backend` (triggers Render deploy)

**How to push (run in Shell tab):**
```bash
# Step 1: Set frontend remote with PAT and push
git remote set-url origin "https://x-access-token:${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/pradeepthalla80/grocery-share-frontend.git"
git pull origin main --no-edit --allow-unrelated-histories
git push origin main

# Step 2: Set backend remote and push via subtree
git remote get-url backend 2>/dev/null || git remote add backend "https://x-access-token:${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/pradeepthalla80/grocery-share-backend.git"
git remote set-url backend "https://x-access-token:${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/pradeepthalla80/grocery-share-backend.git"
git subtree push --prefix=grocery-share-backend-main_12_26_2025 backend main
# If subtree push is rejected, use force:
# git subtree split --prefix=grocery-share-backend-main_12_26_2025 -b backend-split && git push backend backend-split:main --force && git branch -D backend-split
```

**Auth:** Uses `GITHUB_PERSONAL_ACCESS_TOKEN` secret (already saved). The GitHub OAuth connector token (`gho_`) does NOT work for git push.

## External Dependencies

-   **Database:** MongoDB Atlas (primary database with geospatial indexing).
-   **Payment Processing:** Stripe (Payment Intents for purchases, Stripe Connect for seller payouts with 10% platform commission).
-   **Image Storage:** Cloudinary (image upload and hosting via `multer-storage`).
-   **Hosting & Deployment:** Render (backend API), Vercel (frontend React app), GitHub (source control).
-   **Authentication:** Google OAuth (social login via Passport.js), JWT (token-based authentication).
-   **Location & Mapping:** Google Places API (autocomplete), `geocoding` package (address-to-coordinates conversion).
-   **Mobile OAuth:** `flutter_web_auth_2` for web-based OAuth flow.
-   **Utilities:** `url_launcher` (opening external URLs), `intl` package (date formatting).