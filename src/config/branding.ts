/**
 * Centralized Branding Configuration
 * 
 * To update the logo:
 * 1. Replace /public/logo.png with your new logo file
 * 2. If using a different format (jpg, svg), update the LOGO_PATH below
 * 3. All components will automatically use the new logo
 */

export const BRANDING = {
  // App Name
  APP_NAME: 'BaskMate',
  APP_TAGLINE: 'Your Emergency Pantry Next Door',
  
  // Logo Configuration
  LOGO_PATH: '/logo.png',
  
  // SEO & Meta
  APP_DESCRIPTION: 'Connect with neighbors to share surplus groceries, reduce food waste, and build a stronger community through peer-to-peer food sharing.',
  APP_KEYWORDS: 'food sharing, reduce waste, community, groceries, peer-to-peer, food security, sustainability, emergency pantry',
  
  // Theme
  THEME_COLOR: '#1E9B7B', // Teal from BaskMate logo
} as const;
