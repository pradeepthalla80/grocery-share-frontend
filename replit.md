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
- **Google OAuth** - Social login via Passport.js
- **JWT** - Token-based authentication stored in cookies

### Environment Variables Required
```
MONGODB_URI - MongoDB connection string
STRIPE_SECRET_KEY - Stripe API secret key
STRIPE_PUBLISHABLE_KEY - Stripe public key
CLOUDINARY_* - Cloudinary credentials
JWT_SECRET - Token signing secret
GOOGLE_CLIENT_ID/SECRET - OAuth credentials
```