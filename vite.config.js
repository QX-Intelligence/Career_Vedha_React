import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        // VitePWA({...}) - Temporarily disabled for build debugging
    ],
    server: {
        port: 3000,
        open: true
    },
    define: {
        global: 'window',
    },
})
