import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          name: 'bola villa',
          short_name: 'bola villa',
          description: 'ניהול מתחם נופש',
          theme_color: '#2563eb',
          icons: [
            {
              src: 'app-icon.jpg',
              sizes: '192x192',
              type: 'image/jpeg'
            },
            {
              src: 'app-icon.jpg',
              sizes: '512x512',
              type: 'image/jpeg'
            }
          ]
        },
        strategies: 'injectManifest',
        srcDir: 'public',
        filename: 'sw-custom.js',
        injectManifest: {
          injectionPoint: undefined,
        },
        workbox: {
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                }
              }
            }
          ]
        }
      })
    ],
    // Expose API_BASE_URL to client code
    define: {
      'import.meta.env.API_BASE_URL': JSON.stringify(env.API_BASE_URL || ''),
    },
  }
})

