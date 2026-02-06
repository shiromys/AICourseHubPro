import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Allows access from outside the container (needed for Railway)
  },
  preview: {
    host: true,  // Binds to 0.0.0.0
    port: 8080,  // Matches your Railway setting
    allowedHosts: true, // <--- THIS FIXES YOUR ERROR. It allows any domain to access the site.
  },
})




// Force rebuild 1