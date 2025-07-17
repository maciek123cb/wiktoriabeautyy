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

// Mockowe endpointy dla brakujących zasobów
app.get('/api/reviews', (req, res) => {
  console.log('Mockowy endpoint reviews wywołany');
  res.json({
    success: true,
    reviews: [
      {
        id: 1,
        first_name: 'Anna',
        last_name: 'K.',
        rating: 5,
        comment: 'Wspaniała obsługa i profesjonalne podejście!',
        created_at: '2023-01-15'
      },
      {
        id: 2,
        first_name: 'Monika',
        last_name: 'W.',
        rating: 5,
        comment: 'Jestem bardzo zadowolona z efektów zabiegu!',
        created_at: '2023-02-20'
      },
      {
        id: 3,
        first_name: 'Karolina',
        last_name: 'Z.',
        rating: 4,
        comment: 'Polecam, bardzo miła atmosfera i dobre efekty.',
        created_at: '2023-03-10'
      }
    ]
  });
});

app.get('/api/articles', (req, res) => {
  console.log('Mockowy endpoint articles wywołany');
  res.json({
    success: true,
    articles: [
      {
        id: 1,
        title: 'Jak dbać o brwi?',
        slug: 'jak-dbac-o-brwi',
        excerpt: 'Poznaj najlepsze sposoby na pielęgnację brwi w domu.',
        category: 'Pielęgnacja',
        created_at: '2023-01-10',
        image_url: '/images/kosmetolog.jpeg'
      },
      {
        id: 2,
        title: 'Zalety laminacji rzęs',
        slug: 'zalety-laminacji-rzes',
        excerpt: 'Dowiedz się, dlaczego laminacja rzęs jest lepsza od sztucznych rzęs.',
        category: 'Zabiegi',
        created_at: '2023-02-15',
        image_url: '/images/laminacja.png'
      },
      {
        id: 3,
        title: 'Jak przygotować się do zabiegu?',
        slug: 'jak-przygotowac-sie-do-zabiegu',
        excerpt: 'Sprawdź, co zrobić przed wizytą, aby efekty były jeszcze lepsze.',
        category: 'Porady',
        created_at: '2023-03-20',
        image_url: '/images/kosmetolog.jpeg'
      }
    ]
  });
});

app.get('/api/metamorphoses', (req, res) => {
  console.log('Mockowy endpoint metamorphoses wywołany');
  res.json({
    success: true,
    metamorphoses: [
      {
        id: 1,
        treatment_name: 'Laminacja brwi',
        before_image: '/images/kosmetolog.jpeg',
        after_image: '/images/kosmetolog.jpeg'
      },
      {
        id: 2,
        treatment_name: 'Henna pudrowa',
        before_image: '/images/kosmetolog.jpeg',
        after_image: '/images/kosmetolog.jpeg'
      },
      {
        id: 3,
        treatment_name: 'Laminacja rzęs',
        before_image: '/images/kosmetolog.jpeg',
        after_image: '/images/kosmetolog.jpeg'
      }
    ]
  });
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

// Bezpośredni endpoint logowania
app.post('/api/login', (req, res) => {
  console.log('Bezpośredni endpoint logowania wywołany');
  console.log('Body:', req.body);
  
  // Sprawdź, czy body jest puste
  if (!req.body || Object.keys(req.body).length === 0) {
    console.log('Puste body, używam danych testowych');
    // Użyj danych testowych
    res.json({ 
      success: true, 
      message: 'Logowanie testowe pomyślne!',
      token: 'admin-token-123',
      user: {
        id: 1,
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
      }
    });
    return;
  }
  
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

// Sprawdź czy folder dist istnieje
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  console.error('Błąd: Folder dist nie istnieje!');
  console.log('Bieżący katalog:', __dirname);
  console.log('Zawartość katalogu:', fs.readdirSync(__dirname));
}

// Endpoint dla /admin
app.get('/api/admin', (req, res) => {
  console.log('Endpoint /admin wywołany');
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Brak tokenu autoryzacji' });
  }
  
  const token = authHeader.split(' ')[1];
  
  // W prawdziwej aplikacji weryfikowalibyśmy token
  if (token === 'admin-token-123') {
    res.json({
      success: true,
      message: 'Witaj w panelu administratora!',
      data: {
        stats: {
          users: 42,
          appointments: 156,
          services: 12
        }
      }
    });
  } else {
    res.status(401).json({ success: false, message: 'Nieprawidłowy token' });
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
    const newPath = path.replace(/^\\/api/, '');
    console.log(`Przekierowuję ścieżkę: ${path} -> ${newPath}`);
    return newPath;
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log('Proxy request:', req.method, req.path, '->', BACKEND_URL + req.path.replace(/^\\/api/, ''));
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