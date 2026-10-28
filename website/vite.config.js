import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Flask API (backend/run.py); same-origin proxy so the refresh-token cookie works without CORS
    proxy: {
      '/api': 'http://127.0.0.1:5000',
    },
  },
})
