import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During development (npm run dev:client) Vite runs on port 5173 and forwards
// API, photo and admin requests to the Express server on port 3000, so no CORS is needed.
// In the final version Express serves the built files from client/dist itself.
const SERVER = 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': SERVER,
      '/uploads': SERVER,
      '/admin': SERVER,
      '/vendor': SERVER,
      '/admin-assets': SERVER,
    },
  },
});
