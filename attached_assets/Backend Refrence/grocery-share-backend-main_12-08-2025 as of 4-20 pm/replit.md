# Grocery Share Platform

## Overview
Grocery Share is a peer-to-peer platform designed to reduce food waste by connecting users to share surplus groceries. It enables users to list items with expiration dates and locations, facilitating discovery and exchange within a community-driven marketplace. The platform features robust functionalities such as JWT authentication, geospatial querying, multi-image uploads, and options for both paid and free item listings. The project aims to foster sustainable grocery consumption and build a community around food sharing.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Backend
The backend is built with **Express.js (Node.js)**, providing a RESTful API.
- **Database**: **MongoDB** with **Mongoose ODM** handles data for User, Item, Notification, Conversation, Message, SearchLog, ItemRequest, ContactMessage, Rating, and Badge models, utilizing geospatial capabilities for location-based searches.
- **Authentication**: **JWT (JSON Web Tokens)** for stateless authentication and **Google OAuth** via Passport.js.
- **Image Storage**: **Cloudinary** for multi-image uploads (up to 5 per item) integrated with Multer.
- **API Structure**: Follows RESTful conventions with public and protected endpoints for core features.
- **Services**: Includes an **Email Service** (Nodemailer) and a **Notification Service** with cron-based monitoring for alerts and expiry.
- **Features**: Pickup time slots, in-app chat, AI-powered recommendations, item request system, secure address reveal, contact form, terms & conditions acceptance, account deletion, Stripe payment integration (Phase 1), time-limited listings with auto-expiration, 1-5 star ratings & reviews, gamification/badge system, and pickup confirmation with delivery scheduling.

### Frontend
The frontend uses **React 19 with TypeScript** and **Vite**, styled with **Tailwind CSS v4** and **shadcn/ui**.
- **UI/UX**: Modern aesthetic with a green color scheme.
- **State Management**: **React Context API** for global state (`AuthContext`, `NotificationContext`, `ToastContext`).
- **Routing**: **React Router v7** with `ProtectedRoute` for authenticated access.
- **Form Management**: **React Hook Form** with **Zod** for schema validation.
- **API Integration**: **Axios** handles API requests with JWT interceptors.
- **Features**: Google OAuth, comprehensive in-app chat with address reveal and pickup confirmation, geolocation via AddressInput and LocationMap, multi-image management, "Free Items" option, pickup times, notification bell, "You Might Also Like" recommendations, global toast system, loading spinners, item requests page with filtering, dedicated Terms of Use & Privacy Policy pages, contact us page, account deletion, footer, time-limited listing validity period selector, ratings & reviews display, badge showcase on profile, pickup confirmation flow, **secure Stripe checkout with backend payment verification**, dashboard tabs (Available/Requested Items), sorting & filtering, status badges, and safety guidelines.
- **TypeScript**: Ensures full type safety across the application.

## External Dependencies

### Backend Dependencies
- **MongoDB Atlas**: Cloud-hosted NoSQL database.
- **Render**: Deployment platform.
- **Node.js**: JavaScript runtime.
- **Express.js**: Web framework.
- **Mongoose**: MongoDB ODM.
- **bcrypt**: Password hashing.
- **jsonwebtoken**: JWT implementation.
- **Cloudinary**: Image and video management.
- **Multer**: File upload middleware.
- **multer-storage-cloudinary**: Cloudinary storage for Multer.
- **Nodemailer**: Email sending.
- **node-cron**: Job scheduler.
- **passport**, **passport-google-oauth20**, **express-session**: Google OAuth and session management.
- **swagger-jsdoc**, **swagger-ui-express**: API documentation.
- **dotenv**: Environment variable loading.
- **Stripe**: Payment processing (Phase 1 - test mode).

### Frontend Dependencies
- **React**: Frontend library.
- **Axios**: HTTP client.
- **Tailwind CSS**: Utility-first CSS framework.
- **shadcn/ui**: Reusable UI components.
- **React Hook Form**: Form management.
- **Zod**: Schema validation.
- **Vite**: Frontend build tool.
- **Leaflet**, **React Leaflet**: Interactive maps.
- **Lucide React**: Icon library.
- **@stripe/stripe-js**, **@stripe/react-stripe-js**: Secure payment processing with Stripe Elements.