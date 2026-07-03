import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The API base URL is read from VITE_API_URL (see .env). During dev we also
// proxy /api to the backend so you can leave VITE_API_URL empty and avoid CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
