import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'ماکان — پاسخ‌دهی درسی',
        short_name: 'ماکان',
        description: 'عکس برگه امتحان بفرست، پاسخ بگیر',
        theme_color: '#0d9488',
        background_color: '#f4f7fb',
        display: 'standalone',
        lang: 'fa',
        dir: 'rtl',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache' },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    host: true,
    open: true,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API || 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
