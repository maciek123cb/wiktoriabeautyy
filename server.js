// Prosty serwer Express do obsługi aplikacji SPA na Render.com
const express = require('express');
const path = require('path');
const fs = require('fs');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = process.env.PORT || 3000;

// Adres backendu
const BACKEND_URL = process.env.BACKEND_URL || 'https://wiktoria-beauty-backend.onrender.com';

// Sprawdź czy folder dist istnieje
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  console.error('Błąd: Folder dist nie istnieje!');
  console.log('Bieżący katalog:', __dirname);
  console.log('Zawartość katalogu:', fs.readdirSync(__dirname));
}

// Proxy dla żądań API
app.use('/api', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '' // Usuwamy /api z początku ścieżki
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log('Proxy request:', req.method, req.path, '->', BACKEND_URL + req.path.replace(/^\/api/, ''));
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  }
}));

// Serwuj pliki statyczne z folderu dist
app.use(express.static(distPath));

// Obsługa CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
    return res.status(200).json({});
  }
  next();
});

// Wszystkie pozostałe żądania przekieruj do index.html
app.get('*', (req, res) => {
  console.log('Przekierowanie żądania:', req.path, 'do index.html');
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Serwer uruchomiony na porcie ${PORT}`);
  console.log(`Serwowanie plików z: ${distPath}`);
  console.log(`Proxy dla API: ${BACKEND_URL}`);
});