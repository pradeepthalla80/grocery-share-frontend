import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

function fatSecretProxy(): Plugin {
  let cachedToken: { token: string; expiresAt: number } | null = null;

  async function getToken(clientId: string, clientSecret: string): Promise<string> {
    if (cachedToken && Date.now() < cachedToken.expiresAt) {
      return cachedToken.token;
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await fetch('https://oauth.fatsecret.com/connect/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials&scope=barcode',
    });

    if (!res.ok) {
      throw new Error(`Token request failed: ${res.status}`);
    }

    const data = await res.json() as { access_token?: string; expires_in?: number };
    if (!data.access_token || !data.expires_in) {
      throw new Error('Invalid token response');
    }

    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    };
    return cachedToken.token;
  }

  return {
    name: 'fatsecret-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/fatsecret/barcode/')) {
          return next();
        }

        const barcode = req.url.replace('/api/fatsecret/barcode/', '').split('?')[0];
        const clientId = process.env.FATSECRET_CLIENT_ID;
        const clientSecret = process.env.FATSECRET_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'FatSecret credentials not configured' }));
          return;
        }

        try {
          const token = await getToken(clientId, clientSecret);
          const gtin = barcode.padStart(13, '0');

          const apiRes = await fetch(
            `https://platform.fatsecret.com/rest/server.api?method=food.find_id_for_barcode.v2&barcode=${gtin}&format=json`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (!apiRes.ok) {
            cachedToken = null;
            res.writeHead(apiRes.status, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `FatSecret API error: ${apiRes.status}` }));
            return;
          }

          const data = await apiRes.json();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(data));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'FatSecret lookup failed' }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    fatSecretProxy(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'BaskMate',
        short_name: 'BaskMate',
        description: 'Your Emergency Pantry Next Door - Share surplus groceries with your community',
        theme_color: '#1E9B7B',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.cloudinary\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
            },
          },
        ],
        navigateFallback: 'index.html',
      },
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
    allowedHosts: true,
    hmr: {
      clientPort: 5000,
    },
  },
})
