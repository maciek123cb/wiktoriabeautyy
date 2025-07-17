import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'

// Funkcja do kopiowania plików podczas budowania
const copyAssets = () => ({
  name: 'copy-assets',
  closeBundle() {
    try {
      // Kopiuj plik _redirects
      if (fs.existsSync('public/_redirects')) {
        fs.copyFileSync('public/_redirects', 'dist/_redirects')
        console.log('\n\u001b[32m✔ _redirects file copied\u001b[0m')
      } else {
        const redirectsContent = '/* /index.html 200'
        fs.writeFileSync('dist/_redirects', redirectsContent)
        console.log('\n\u001b[32m✔ _redirects file generated\u001b[0m')
      }
      
      // Kopiuj folder images
      if (fs.existsSync('images') && !fs.existsSync('dist/images')) {
        // Utwórz folder dist/images jeśli nie istnieje
        fs.mkdirSync('dist/images', { recursive: true })
        
        // Kopiuj wszystkie pliki z folderu images
        const imageFiles = fs.readdirSync('images')
        for (const file of imageFiles) {
          fs.copyFileSync(`images/${file}`, `dist/images/${file}`)
        }
        console.log(`\n\u001b[32m✔ ${imageFiles.length} image files copied\u001b[0m`)
      }
    } catch (error) {
      console.error('\n\u001b[31m✘ Error copying assets:', error, '\u001b[0m')
    }
  }
})

export default defineConfig({
  plugins: [react(), copyAssets()],
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
  },
  build: {
    // Dodajemy opcję rollupOptions, aby zachować nazwy plików
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})