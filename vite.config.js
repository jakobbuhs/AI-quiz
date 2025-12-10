import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    // Exclude server and api folders from frontend build
    rollupOptions: {
      external: [/^server\//, /^api\//],
    },
  },
})

