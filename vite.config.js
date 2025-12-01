import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/stkcld/',  // Important: This tells Vite the app will be served from /stkcld/
  server: {
    port: 5176  // Change this to your desired port (e.g., 3000, 8080)
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Generate relative paths for better compatibility
    rollupOptions: {
      output: {
        manualChunks: undefined,
      }
    }
  }
})
