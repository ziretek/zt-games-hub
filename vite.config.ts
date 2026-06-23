import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const cacheNamespace = 'gamehub-v3';
const buildVersion = Date.now().toString(36);

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
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
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
