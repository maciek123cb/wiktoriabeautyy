import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'

// Funkcja do generowania pliku _redirects podczas budowania
const generateRedirects = () => ({
  name: 'generate-redirects',
  closeBundle() {
    const redirectsContent = '/* /index.html 200'
    fs.writeFileSync(resolve(__dirname, 'dist/_redirects'), redirectsContent)
    console.log('\n\u001b[32m✔ _redirects file generated\u001b[0m')
  }
})

export default defineConfig({
  plugins: [react(), generateRedirects()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: true
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
    // Dodajemy middleware dla trybu preview, aby obsługiwać SPA routing
    middlewares: [
      (req, res, next) => {
        // Jeśli żądanie nie dotyczy pliku, przekieruj do index.html
        if (!req.url.includes('.')) {
          req.url = '/index.html'
        }
        next()
      }
    ]
  }
})