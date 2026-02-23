import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        react(),
    ],
    server: {
        port: 3000,
        open: true
    },
    define: {
        global: 'window',
    },
})
