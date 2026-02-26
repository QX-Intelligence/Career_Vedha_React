import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import obfuscator from 'rollup-plugin-javascript-obfuscator'

export default defineConfig({
    plugins: [
        react(),
        {
            ...obfuscator({
                compact: true,
                controlFlowFlattening: true,
                controlFlowFlatteningThreshold: 1,
                numbersToExpressions: true,
                simplify: true,
                stringArray: true,
                stringArrayThreshold: 1,
                splitStrings: true,
                splitStringsChunkLength: 5,
                unicodeEscapeSequence: true,
                // Disable selfDefending and debugProtection to avoid runtime errors or traps
                selfDefending: false, 
                debugProtection: false,
                sourceMap: false,
            }),
            apply: 'build' // Only apply during production build
        }
    ],
    server: {
        port: 3000,
        open: true
    },
    define: {
        global: 'window',
    },
    build: {
        sourcemap: false,
    },
})
