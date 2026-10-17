import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Flask API (backend/run.py); same-origin proxy so the refresh-token cookie works without CORS
    proxy: {
      '/api': 'http://127.0.0.1:5000',
    },
  },
})
