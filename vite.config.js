import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  // Vite automatically excludes files outside src/ and public/ by default
  // Server and API folders are handled by Vercel serverless functions
})

