import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { viteBackendMiddleware } from './src/backend/server.js'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'saafy-backend',
      configureServer(server) {
        server.middlewares.use(viteBackendMiddleware)
      }
    }
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
// Force restart to reload backend modules (v3 playlists added)
