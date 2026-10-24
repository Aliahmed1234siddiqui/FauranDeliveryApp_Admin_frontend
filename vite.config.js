import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Where the Node backend runs in development. Override with VITE_BACKEND_URL in .env.local.
  const backend = (loadEnv(mode, process.cwd(), '').VITE_BACKEND_URL || 'http://localhost:5000').replace(
    /\/+$/,
    '',
  );

  return {
    plugins: [react()],
    resolve: {
      // `@/components/ui` instead of `../../components/ui`
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      // Same-origin proxy: no CORS setup needed and the X-Total-* paging headers are readable.
      proxy: {
        '/api': { target: backend, changeOrigin: true },
        '/socket.io': { target: backend, changeOrigin: true, ws: true },
      },
    },
  };
});
