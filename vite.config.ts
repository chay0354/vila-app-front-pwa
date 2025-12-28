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
        strategies: 'injectManifest',
        srcDir: 'public',
        filename: 'sw.js',
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
        injectManifest: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg}']
        }
      })
    ],
    // Expose API_BASE_URL to client code
    define: {
      'import.meta.env.API_BASE_URL': JSON.stringify(env.API_BASE_URL || ''),
    },
  }
})

