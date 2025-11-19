# Grocery Share - Production Deployment Guide

## Prerequisites

Before deploying, ensure you have:
- GitHub account (for both deployments)
- Render account (for backend)
- Vercel account (for frontend)
- All required API keys and credentials

## Required Environment Variables

### Backend (Render)
You'll need these secrets configured in Render:
- `MONGO_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `STRIPE_SECRET_KEY` - Stripe secret key (test or live)
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GOOGLE_CALLBACK_URL` - Your backend URL + `/auth/google/callback`
- `FRONTEND_URL` - Your Vercel frontend URL
- `SESSION_SECRET` - Secret for session management
- `EMAIL_USER` - Email address for notifications (optional)
- `EMAIL_PASS` - Email app password (optional)

### Frontend (Vercel)
You'll need this environment variable:
- `VITE_BACKEND_URL` - Your Render backend URL

## Step 1: Deploy Backend to Render

1. **Push to GitHub**
   - Commit all your changes
   - Push to your GitHub repository

2. **Create Render Service**
   - Go to https://render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: grocery-share-backend
     - **Runtime**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Plan**: Free (or upgrade for production)

3. **Add Environment Variables**
   - In Render dashboard, go to "Environment"
   - Add all backend secrets listed above
   - Click "Save Changes"

4. **Deploy**
   - Render will automatically deploy
   - Wait for deployment to complete
   - Copy your backend URL (e.g., `https://grocery-share-backend.onrender.com`)

## Step 2: Update Google OAuth Callback

1. Go to Google Cloud Console
2. Navigate to your OAuth credentials
3. Add your Render backend URL to:
   - **Authorized JavaScript origins**: `https://your-backend.onrender.com`
   - **Authorized redirect URIs**: `https://your-backend.onrender.com/auth/google/callback`

## Step 3: Deploy Frontend to Vercel

1. **Navigate to Frontend Directory**
   ```bash
   cd grocery-share-frontend
   ```

2. **Deploy to Vercel**
   - Go to https://vercel.com
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Select the `grocery-share-frontend` directory as root
   - Configure:
     - **Framework Preset**: Vite
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`

3. **Add Environment Variable**
   - In Vercel project settings → "Environment Variables"
   - Add `VITE_BACKEND_URL` with your Render backend URL
   - Example: `https://grocery-share-backend.onrender.com`

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Copy your frontend URL (e.g., `https://grocery-share.vercel.app`)

## Step 4: Update Backend with Frontend URL

1. Go back to Render dashboard
2. Update the `FRONTEND_URL` environment variable with your Vercel URL
3. Save and wait for automatic redeployment

## Step 5: Verify Deployment

Test these features:
- ✅ User registration and login
- ✅ Google OAuth login
- ✅ Add grocery item with images
- ✅ Browse items with location search
- ✅ In-app chat messaging
- ✅ Notifications
- ✅ Item requests
- ✅ Pickup confirmation and ratings
- ✅ Payment intent creation (Stripe)

## Production Checklist

- [ ] All environment variables configured correctly
- [ ] Google OAuth callback URLs updated
- [ ] MongoDB Atlas IP whitelist includes `0.0.0.0/0` or Render IPs
- [ ] Stripe keys are in live mode (when ready for real payments)
- [ ] CORS origins include your production frontend URL
- [ ] Email service configured (if using notifications)
- [ ] Terms & Privacy Policy reviewed and finalized
- [ ] Test all major features in production environment

## Monitoring & Maintenance

### Backend (Render)
- View logs in Render dashboard
- Monitor uptime and performance
- Free tier may sleep after inactivity (upgrade for 24/7 availability)

### Frontend (Vercel)
- View deployment logs in Vercel dashboard
- Analytics available in Vercel dashboard
- Automatic deployments on git push

## Troubleshooting

**CORS Errors**: Verify `FRONTEND_URL` in Render matches your Vercel URL exactly

**Google OAuth Fails**: Check callback URLs in Google Cloud Console

**Database Connection Issues**: Verify MongoDB Atlas allows connections from Render IPs

**Images Not Uploading**: Verify all Cloudinary credentials are correct

**Payments Fail**: Check Stripe API keys are correct and in appropriate mode (test/live)

## Support

For issues with:
- **Render**: https://render.com/docs
- **Vercel**: https://vercel.com/docs
- **MongoDB Atlas**: https://docs.atlas.mongodb.com
- **Cloudinary**: https://cloudinary.com/documentation
- **Stripe**: https://stripe.com/docs

---

**Note**: The free tier on Render may experience cold starts (10-30 seconds delay on first request after inactivity). Consider upgrading to a paid plan for production use with consistent traffic.
