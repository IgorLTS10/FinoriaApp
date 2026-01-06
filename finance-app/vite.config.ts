import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy désactivé pour tester Finnhub en local
    // Décommenter pour utiliser la prod
    // proxy: {
    //   '/api': {
    //     target: 'https://finoria-app.vercel.app',
    //     changeOrigin: true,
    //     secure: true,
    //   }
    // }
  }
})
