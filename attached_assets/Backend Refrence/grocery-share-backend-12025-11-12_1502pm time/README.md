# 🛒 Grocery Share

A peer-to-peer platform for sharing surplus groceries and reducing food waste. Connect with your community to share groceries, reduce waste, and save money!

## 🌟 Features

### Core Features
- **User Authentication**: JWT-based auth with Google OAuth integration
- **Smart Search**: Geospatial search to find groceries near you
- **Multi-Image Upload**: Up to 5 images per item via Cloudinary
- **Free or Paid Items**: Flexible pricing with Stripe payment integration
- **Time-Limited Listings**: Auto-expiring items (2h/6h/12h/24h/custom/never)

### Communication
- **In-App Chat**: Real-time messaging between users
- **Notifications**: In-app and email alerts for nearby items and expiring groceries
- **Secure Address Reveal**: Both parties must consent before address sharing

### Community Features
- **Item Requests**: Post what you're looking for, get matched with nearby offers
- **Ratings & Reviews**: 1-5 star ratings after successful pickups
- **Gamification**: Achievement badges for sharing milestones
- **Pickup Confirmation**: Both parties confirm completion

### Smart Features
- **AI Recommendations**: Personalized suggestions based on search history
- **Delivery Scheduling**: Book pickup time slots
- **Pickup Time Windows**: Flexible pickup scheduling
- **Auto-Cleanup**: Hourly cron job removes expired listings

### Platform
- **Public API Documentation**: Swagger UI at `/docs`
- **Contact Support**: Built-in support form
- **Terms & Privacy**: Legal pages with acceptance tracking
- **Account Management**: Full account deletion with cascade cleanup

## 🏗️ Tech Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB Atlas with Mongoose ODM
- **Authentication**: JWT + Passport.js (Google OAuth)
- **Image Storage**: Cloudinary
- **Payments**: Stripe
- **Email**: Nodemailer
- **Jobs**: node-cron

### Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios
- **Routing**: React Router v7
- **Maps**: Leaflet + React Leaflet

## 📁 Project Structure

```
grocery-share/
├── config/              # Database, passport, swagger configs
├── controllers/         # Request handlers
├── middleware/          # Auth middleware
├── models/             # Mongoose schemas
├── routes/             # API routes
├── services/           # Cron jobs, notifications, email
├── grocery-share-frontend/  # React app
│   ├── src/
│   │   ├── api/        # Axios config
│   │   ├── components/ # React components
│   │   ├── contexts/   # React contexts
│   │   ├── pages/      # Page components
│   │   └── utils/      # Helper functions
│   └── public/         # Static assets
├── index.js            # Backend entry point
├── DEPLOYMENT.md       # Deployment guide
├── TERMS_OF_USE.md     # Terms of service
└── PRIVACY_POLICY.md   # Privacy policy
```

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Cloudinary account
- Stripe account (test mode)
- Google OAuth credentials

### Backend Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with required variables (see DEPLOYMENT.md)

3. Start backend:
```bash
npm start
```

Backend runs on port 3000

### Frontend Setup

1. Navigate to frontend:
```bash
cd grocery-share-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
VITE_BACKEND_URL=http://localhost:3000
```

4. Start frontend:
```bash
npm run dev
```

Frontend runs on port 5000

## 📦 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

**Quick Summary:**
- **Backend**: Deploy to Render
- **Frontend**: Deploy to Vercel

## 🔑 Environment Variables

### Backend Required
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- `FRONTEND_URL` - Frontend URL for CORS

### Frontend Required
- `VITE_BACKEND_URL` - Backend API URL

## 📚 API Documentation

Access Swagger documentation at:
- **Development**: http://localhost:3000/docs
- **Production**: https://your-backend-url.com/docs

## 🛡️ Security Features

- JWT-based stateless authentication
- Password hashing with bcrypt
- CORS protection
- Input validation with Zod
- Secure session management
- Environment-based secrets management

## 🎯 Key Workflows

### Sharing an Item
1. User creates account
2. Lists grocery item with photos, location, price/free
3. Sets expiration date and pickup times
4. Item appears in search results for nearby users

### Requesting an Item
1. User searches or creates item request
2. Nearby users with matching items get notified
3. Users connect via in-app chat
4. Arrange pickup with address reveal
5. Confirm pickup and leave rating

## 🤝 Contributing

This is a complete, production-ready platform. For modifications:
1. Fork the repository
2. Create feature branch
3. Test thoroughly
4. Submit pull request

## 📄 License

All rights reserved.

## 🆘 Support

- **Bug Reports**: Use GitHub Issues
- **Questions**: Contact via support form in app
- **Documentation**: See DEPLOYMENT.md and inline code comments

## 🌍 Live Demo

- **Frontend**: [Your Vercel URL]
- **Backend**: [Your Render URL]
- **API Docs**: [Your Render URL]/docs

---

Built with ❤️ to reduce food waste and connect communities
