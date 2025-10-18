import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Check if HTTPS certificates exist
const certPath = path.resolve(__dirname, 'localhost+3.pem')
const keyPath = path.resolve(__dirname, 'localhost+3-key.pem')
const hasHttps = fs.existsSync(certPath) && fs.existsSync(keyPath)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    host: true, // Listen on all addresses
    // Allow ngrok and other tunneling services
    allowedHosts: [
      '.ngrok.io',
      '.ngrok-free.app',
      '.loca.lt',
      '.cloudflare.com',
      'localhost'
    ],
    // Enable HTTPS if certificates exist
    ...(hasHttps && {
      https: {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
      }
    })
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react', 'framer-motion', 'react-hot-toast'],
          charts: ['recharts']
        }
      }
    }
  }
})
