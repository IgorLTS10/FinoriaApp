import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {}
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://finoria-app.vercel.app',
        changeOrigin: true,
        secure: true,
      }
    }
  }
})
