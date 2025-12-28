# Grocery Share (BaskMate)

## Overview

Grocery Share is a peer-to-peer marketplace platform that enables users to list, request, share, or sell grocery items locally. The platform supports both individual users sharing surplus groceries and store owners selling inventory. Key features include:

- **Item listings** with location-based discovery using geospatial queries
- **Pickup request workflow** for coordinating item exchanges between users
- **Payment processing** via Stripe Connect for paid items (10% platform commission)
- **Store mode** for business sellers with inventory management
- **Real-time notifications** and chat messaging between users
- **Rating system** for building trust between buyers and sellers

The backend is a Node.js/Express API deployed on Render, with a React frontend on Vercel and a Flutter mobile app for iOS/Android.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend Architecture (Node.js/Express)

**API Design:**
- RESTful API with `/api/v1/` prefix
- JWT-based authentication with cookie support
- Role-based access control (user, admin, super_admin)
- Google OAuth integration for social login

**Key Controllers:**
- `itemsController.js` - Item CRUD with geospatial queries (MongoDB $near)
- `pickupRequestController.js` - Manages the pickup workflow (pending → accepted → awaiting_pickup → completed)
- `paymentController.js` - Stripe payment intents with Connect support for seller payouts
- `chatController.js` - Conversation and messaging between users
- `notificationRoutes.js` - User notifications for pickup requests, messages, etc.

**Data Models (Mongoose):**
- `User` - Supports regular users and store owners with Stripe Connect fields
- `Item` - Listings with GeoJSON location, categories, pricing, and inventory tracking
- `PickupRequest` - Tracks the lifecycle of item exchanges
- `Notification` - Various notification types (pickup_request, pickup_confirmed, message, etc.)
- `Conversation/Message` - Chat system between users

**Service Layer:**
- `inventoryService.js` - Centralized atomic inventory management with race condition protection for store items

### Frontend Architecture

**Web (React/TypeScript on Vercel):**
- Vite-based React application
- Location-aware item search with map integration
- Stripe Elements for payment processing

**Mobile (Flutter):**
- iOS and Android support
- Provider-based state management
- Stripe SDK integration
- Location services for nearby item discovery

**Mobile UI Navigation (December 2025):**
- Top-right hamburger menu drawer replaces bottom navigation bar
- Drawer contains: Dashboard, My Listed Items, My Requests, Messages, Pickups, Impact, Admin (role-based), Profile, Settings, Logout
- Hamburger icon shows aggregated unread badge (notifications + messages)
- Item cards use compact horizontal layout (100px image left, details right)
- Reduced vertical spacing for higher information density
- "Want to Become a Store Owner?" banner on dashboard for non-store users

**Phase 2.1 Parity Features (December 2025):**
- Theme fixes: Improved contrast for ChoiceChips, dropdowns, switches, popups
- Admin Dashboard: Fully functional Users and Items tabs with search, pagination, role changes, suspend/delete actions
- Add Item Screen: Tags input, listing validity period, flexible pickup time, improved location picker with "Use Current Location" button
- Stripe Seller Onboarding: Lifecycle observer for return detection, incomplete setup handling, better UI feedback states

**Phase 2.2 Functional Parity Fixes (December 2025):**
- **Item Ownership Detection**: Fixed Item model to parse both 'owner' and 'user' fields from backend, with fallbacks for 'ownerId' and 'userId'. This ensures Edit/Delete buttons show for owners, and Request button shows for other users.
- **GeoJSON Location Parsing**: Added safe coordinate extraction with type checking to prevent runtime crashes when backend sends malformed location data.
- **Add Item Seller Helper**: Added info box below price field showing Stripe account status - links to seller onboarding if not connected, or shows "connected" badge if already set up.
- **Location Preview**: Added visual preview container showing current location status before address input field.

**Phase 3 Runtime Fixes (December 2025):**
- **Edit Item Screen**: Complete implementation with form fields, existing image management (keep/remove), new image uploads, location picker, and API integration. Uses multipart form data with `key[]` notation for proper array field parsing.
- **Buy Now / Request Button**: Fixed dual-flow logic:
  - Free items: Shows message dialog → creates pickup request → opens chat with seller
  - Paid items: Initializes Stripe payment sheet → processes payment → creates pickup request → opens chat
- **Multipart Form Arrays**: Updated ItemsService.updateItem to use `key[]` notation (e.g., `existingImages[]`) for List fields instead of comma-separated strings. This ensures backend properly parses arrays.
- **Analytics Fallback**: Analytics service returns zeroed fallback data when `/analytics/community-impact` endpoint doesn't exist, preventing crashes.
- **Stripe Account Check Fix**: 
  - User model now has two getters: `hasStripeAccount` (checks if account exists) and `hasActiveStripeAccount` (checks if account is fully active)
  - Add Item screen now shows appropriate messages: "Stripe Account Required" if no account exists, or "Complete Stripe Setup" if account exists but isn't fully active
  - This allows users to understand exactly what step is blocking them from listing paid items

### Authorization Patterns

Item ownership verification uses MongoDB ObjectId comparison:
```javascript
// Correct pattern for ObjectId comparison
if (!item.user.equals(req.user._id)) { ... }
// Or string conversion
if (item.user.toString() !== req.user._id.toString()) { ... }
```

Admin bypass for moderation:
```javascript
const isOwner = item.user.toString() === req.user.userId.toString();
const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
if (!isOwner && !isAdmin) { ... }
```

### Null Safety Considerations

Database records may have null references (e.g., deleted users). Always check before accessing nested properties:
```javascript
user: item.user ? {
  id: item.user._id,
  name: item.user.name,
  // ...
} : null
```

## External Dependencies

### Database
- **MongoDB Atlas** - Primary database with geospatial indexing on Item.location for location-based queries

### Payment Processing
- **Stripe** - Payment intents for purchases
- **Stripe Connect** - Express accounts for seller payouts (supports 40+ countries)
- Platform takes 10% commission on transactions

### Image Storage
- **Cloudinary** - Image upload and hosting via multer-storage integration

### Hosting & Deployment
- **Render** - Backend API hosting with auto-deploy from GitHub
- **Vercel** - Frontend React app hosting with auto-deploy
- **GitHub** - Source control for both frontend and backend repositories

### Authentication
- **Google OAuth** - Social login via Passport.js with HMAC-signed state parameter
- **JWT** - Token-based authentication stored in cookies

### Mobile OAuth Flow (December 2025)
The mobile app uses a web-based OAuth flow via `flutter_web_auth_2` to avoid iOS lifecycle issues:

1. Mobile app opens `backend.com/api/v1/auth/google?platform=mobile`
2. Backend creates HMAC-signed state with platform flag and redirects to Google
3. After Google consent, backend callback verifies state signature and timestamp
4. For mobile: redirects to `groceryshare://auth/callback?token=...`
5. For web: redirects to frontend URL with token in cookie

**Android Setup Required:**
Add to AndroidManifest.xml:
```xml
<activity android:name="com.linusu.flutter_web_auth_2.CallbackActivity" android:exported="true">
  <intent-filter android:label="flutter_web_auth_2">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="groceryshare" />
  </intent-filter>
</activity>
```

**iOS:** Works automatically via ASWebAuthenticationSession (no manifest changes needed)

### Environment Variables Required
```
MONGODB_URI - MongoDB connection string
STRIPE_SECRET_KEY - Stripe API secret key
STRIPE_PUBLISHABLE_KEY - Stripe public key
CLOUDINARY_* - Cloudinary credentials
JWT_SECRET - Token signing secret
GOOGLE_CLIENT_ID/SECRET - OAuth credentials
```