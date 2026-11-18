import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backend = env.VITE_BACKEND_URL || 'http://localhost:4000';

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: { enabled: true },
        includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
        manifest: {
          name: 'Aali Market',
          short_name: 'Aali Market',
          description: 'Your town’s lowest prices, delivered home.',
          theme_color: '#1E2A78',
          background_color: '#F5F6FA',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
          ]
        },
        workbox: {
          navigateFallbackDenylist: [/^\/api/, /^\/health/],
          runtimeCaching: [
            {
              // Catalog data: try network first, fall back to cache when offline
              urlPattern: ({ url }) => url.pathname.startsWith('/api/v1/') &&
                /\/(products|categories|banners)/.test(url.pathname),
              handler: 'NetworkFirst',
              options: { cacheName: 'aali-catalog', expiration: { maxEntries: 200, maxAgeSeconds: 86400 } }
            },
            {
              urlPattern: ({ request }) => request.destination === 'image',
              handler: 'CacheFirst',
              options: { cacheName: 'aali-images', expiration: { maxEntries: 300, maxAgeSeconds: 604800 } }
            },
            {
              urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'aali-fonts' }
            }
          ]
        }
      })
    ],
    server: {
      port: 5173,
      host: true, // same WiFi par mobile se bhi khol sakte ho
      proxy: {
        '/api': { target: backend, changeOrigin: true },
        '/health': { target: backend, changeOrigin: true }
      }
    },
    preview: {
      proxy: {
        '/api': { target: backend, changeOrigin: true }
      }
    }
  };
});
