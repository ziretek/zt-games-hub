import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const cacheNamespace = 'gamehub-v3';
const buildVersion = Date.now().toString(36);
const devServiceWorkerReset = `
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter(name => name.includes('gamehub') || name.includes('workbox') || name.includes('precache'))
        .map(name => caches.delete(name)),
    );
    await self.clients.claim();
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      const url = new URL(client.url);
      url.searchParams.set('sw-reset', Date.now().toString());
      client.navigate(url.href);
    }
    await self.registration.unregister();
  })());
});
`;

function devServiceWorkerResetPlugin(): Plugin {
  return {
    name: 'zt-dev-service-worker-reset',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = req.url?.split('?')[0];
        if (path !== '/sw.js') {
          next();
          return;
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        res.end(devServiceWorkerReset);
      });
    },
  };
}

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: './index.html',
    },
  },
  server: {
    port: 3000,
    open: false,
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    globals: true,
  },
  plugins: [
    devServiceWorkerResetPlugin(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      selfDestroying: true,
      cleanupOutdatedCaches: true,
      includeAssets: ['favicon.svg', 'icon-192.svg', 'icon-512.svg'],
      manifest: {
        name: 'ZT Games Hub',
        short_name: 'ZT Games',
        description: 'A classic game portal with animated backgrounds and AI opponents',
        start_url: './index.html',
        display: 'standalone',
        background_color: '#0a0a14',
        theme_color: '#7c3aed',
        scope: './',
        icons: [
          {
            src: 'icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
          {
            src: 'icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
        categories: ['games', 'entertainment'],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/assets\/.*\.(js|css)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: `${cacheNamespace}-assets-${buildVersion}`,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /^https?:\/\/.*\/index\.html$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: `${cacheNamespace}-html-${buildVersion}`,
            },
          },
        ],
      },
    }),
  ],
});
