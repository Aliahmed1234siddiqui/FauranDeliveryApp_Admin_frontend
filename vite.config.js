import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Where the Node backend runs in development. Override with VITE_BACKEND_URL in .env.local.
  const backend = (loadEnv(mode, process.cwd(), '').VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '')

  return {
    plugins: [react()],
    server: {
      // Same-origin proxy: no CORS setup needed and the X-Total-* paging headers are readable.
      proxy: {
        '/api': { target: backend, changeOrigin: true },
        '/socket.io': { target: backend, changeOrigin: true, ws: true },
        // Legacy image paths from before Cloudinary (see fileUrl in src/config.js).
        '/uploads': { target: backend, changeOrigin: true },
      },
    },
  }
})
