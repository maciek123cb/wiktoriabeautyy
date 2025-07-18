// Prosty serwer Express do obsługi aplikacji SPA na Render.com
const express = require('express');
const path = require('path');
const fs = require('fs');
const { createProxyMiddleware } = require('http-proxy-middleware');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

// Adres backendu
const BACKEND_URL = process.env.BACKEND_URL || 'https://wiktoria-beauty-backend.onrender.com';

// Parsowanie JSON i formularzy
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Obsługa CORS - musi być przed wszystkimi innymi middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
    return res.status(200).json({});
  }
  next();
});

// Endpoint testowy
app.get('/api/test', (req, res) => {
  console.log('Endpoint testowy wywołany');
  res.json({ success: true, message: 'API działa poprawnie!' });
});

// Endpoint testowy logowania
app.post('/api/login-test', (req, res) => {
  console.log('Endpoint testowy logowania wywołany');
  console.log('Body:', req.body);
  res.json({ 
    success: true, 
    message: 'Logowanie testowe pomyślne!',
    token: 'test-token-123',
    user: {
      id: 1,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'admin'
    }
  });
});

// Sprawdź czy folder dist istnieje
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  console.error('Błąd: Folder dist nie istnieje!');
  console.log('Bieżący katalog:', __dirname);
  console.log('Zawartość katalogu:', fs.readdirSync(__dirname));
}

// Dodajmy bezpośredni endpoint logowania
app.post('/api/login', (req, res) => {
  console.log('Bezpośredni endpoint logowania wywołany');
  console.log('Body:', req.body);
  
  // Sprawdź dane logowania
  if (req.body.email === 'admin@example.com' && req.body.password === 'Admin123!') {
    res.json({ 
      success: true, 
      message: 'Logowanie pomyślne!',
      token: 'admin-token-123',
      user: {
        id: 1,
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Nieprawidłowy email lub hasło'
    });
  }
});

// Proxy dla żądań API - musi być przed static middleware
app.use('/api', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  pathRewrite: function (path) {
    // Pomijamy endpointy, które obsługujemy lokalnie
    if (path === '/api/login' || path === '/api/test' || path === '/api/login-test') {
      return path;
    }
    
    // Usuwamy /api z początku ścieżki
    const newPath = path.replace(/^\/api/, '');
    console.log(`Przekierowuję ścieżkę: ${path} -> ${newPath}`);
    return newPath;
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log('Proxy request:', req.method, req.path, '->', BACKEND_URL + req.path.replace(/^\/api/, ''));
    console.log('Headers:', JSON.stringify(req.headers));
    console.log('Body:', req.body);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('Proxy response:', proxyRes.statusCode, req.path);
    console.log('Response headers:', JSON.stringify(proxyRes.headers));
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  }
}));

// Serwuj pliki statyczne z folderu dist
app.use(express.static(distPath));

// Sprawdź czy folder images istnieje w dist, jeśli nie, skopiuj go
const imagesPath = path.join(distPath, 'images');
if (!fs.existsSync(imagesPath) && fs.existsSync(path.join(__dirname, 'images'))) {
  try {
    fs.mkdirSync(imagesPath, { recursive: true });
    const imageFiles = fs.readdirSync(path.join(__dirname, 'images'));
    for (const file of imageFiles) {
      fs.copyFileSync(
        path.join(__dirname, 'images', file),
        path.join(imagesPath, file)
      );
    }
    console.log(`Skopiowano ${imageFiles.length} plików obrazów do folderu dist/images`);
  } catch (error) {
    console.error('Błąd kopiowania obrazów:', error);
  }
}

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