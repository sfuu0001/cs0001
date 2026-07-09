import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/@measured/puck')) return 'puck-vendor'
          if (
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react/')
          )
            return 'react-vendor'
          if (id.includes('node_modules')) return 'vendor'
        },
      },
    },
  },
})
