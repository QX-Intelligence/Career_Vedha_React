import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            devOptions: {
                enabled: true
            },
            workbox: {
                navigateFallbackAllowlist: [/^\/dashboard/, /^\/user-management/, /^\/cms/],
            },
            manifest: {
                name: 'Career Vedha',
                short_name: 'CareerVedha',
                description: 'Your trusted educational partner',
                theme_color: '#FFC107',
                background_color: '#111827',
                display: 'standalone',
                scope: '/',
                start_url: '/',
                orientation: 'portrait',
                categories: ['education', 'jobs'],
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any maskable'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            }
        })
    ],
    server: {
        port: 3000,
        open: true
    },
    define: {
        global: 'window',
    },
})
