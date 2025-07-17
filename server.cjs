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
  console.log('Mockowy endpoint reviews wywołany, parametry:', req.query);
  const reviews = [
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
  ];
  
  // Obsługa parametru limit
  let result = reviews;
  if (req.query.limit) {
    const limit = parseInt(req.query.limit);
    if (!isNaN(limit) && limit > 0) {
      result = reviews.slice(0, limit);
    }
  }
  
  res.json({
    success: true,
    reviews: result
  });
});

app.get('/api/articles', (req, res) => {
  console.log('Mockowy endpoint articles wywołany, parametry:', req.query);
  const articles = [
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
  ];
  
  // Obsługa parametrów
  let result = articles;
  
  // Filtrowanie po kategorii
  if (req.query.category) {
    result = result.filter(article => article.category === req.query.category);
  }
  
  // Obsługa parametru limit
  if (req.query.limit) {
    const limit = parseInt(req.query.limit);
    if (!isNaN(limit) && limit > 0) {
      result = result.slice(0, limit);
    }
  }
  
  res.json({
    success: true,
    articles: result
  });
});

app.get('/api/metamorphoses', (req, res) => {
  console.log('Mockowy endpoint metamorphoses wywołany, parametry:', req.query);
  const metamorphoses = [
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
  ];
  
  // Obsługa parametru limit
  let result = metamorphoses;
  if (req.query.limit) {
    const limit = parseInt(req.query.limit);
    if (!isNaN(limit) && limit > 0) {
      result = result.slice(0, limit);
    }
  }
  
  res.json({
    success: true,
    metamorphoses: result
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
  
  // Sprawdź dane logowania - akceptujemy różne kombinacje dla admina
  if (req.body.email && req.body.email.toLowerCase() === 'admin@example.com') {
    // Akceptujemy dowolne hasło dla admina w trybie awaryjnym
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

// Dodatkowe endpointy dla panelu admina
app.get('/api/admin/users', (req, res) => {
  console.log('Endpoint /admin/users wywołany');
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Brak tokenu autoryzacji' });
  }
  
  const token = authHeader.split(' ')[1];
  
  if (token === 'admin-token-123') {
    res.json({
      users: [
        {
          id: 1,
          first_name: 'Admin',
          last_name: 'System',
          email: 'admin@example.com',
          phone: '123456789',
          is_active: true,
          role: 'admin',
          created_at: '2023-01-01',
          account_type: 'registered'
        },
        {
          id: 2,
          first_name: 'Anna',
          last_name: 'Kowalska',
          email: 'anna.kowalska@example.com',
          phone: '123456789',
          is_active: true,
          role: 'user',
          created_at: '2023-01-02',
          account_type: 'manual'
        },
        {
          id: 3,
          first_name: 'Piotr',
          last_name: 'Nowak',
          email: 'piotr.nowak@example.com',
          phone: '987654321',
          is_active: true,
          role: 'user',
          created_at: '2023-01-03',
          account_type: 'registered'
        }
      ]
    });
  } else {
    res.status(401).json({ success: false, message: 'Nieprawidłowy token' });
  }
});

app.get('/api/admin/services', (req, res) => {
  console.log('Endpoint /admin/services wywołany');
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Brak tokenu autoryzacji' });
  }
  
  const token = authHeader.split(' ')[1];
  
  if (token === 'admin-token-123') {
    res.json({
      services: [
        {
          id: 1,
          name: 'Manicure klasyczny',
          description: 'Profesjonalny manicure z lakierowaniem',
          price: 80.00,
          duration: 60,
          category: 'Manicure',
          is_active: true
        },
        {
          id: 2,
          name: 'Manicure hybrydowy',
          description: 'Trwały manicure hybrydowy',
          price: 120.00,
          duration: 90,
          category: 'Manicure',
          is_active: true
        },
        {
          id: 3,
          name: 'Pedicure klasyczny',
          description: 'Pielęgnacja stóp z lakierowaniem',
          price: 100.00,
          duration: 75,
          category: 'Pedicure',
          is_active: true
        }
      ]
    });
  } else {
    res.status(401).json({ success: false, message: 'Nieprawidłowy token' });
  }
});

// Endpoint dla artykułów w panelu admina
app.get('/api/admin/articles', (req, res) => {
  console.log('Endpoint /admin/articles wywołany');
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Brak tokenu autoryzacji' });
  }
  
  const token = authHeader.split(' ')[1];
  
  if (token === 'admin-token-123') {
    res.json({
      articles: [
        {
          id: 1,
          title: 'Jak dbać o brwi?',
          slug: 'jak-dbac-o-brwi',
          excerpt: 'Poznaj najlepsze sposoby na pielęgnację brwi w domu.',
          content: '<h2>Pielęgnacja brwi</h2><p>Regularne pielęgnowanie brwi jest kluczowe dla ich wyglądu.</p>',
          category: 'Pielęgnacja',
          created_at: '2023-01-10',
          image_url: '/images/kosmetolog.jpeg',
          is_published: true
        },
        {
          id: 2,
          title: 'Zalety laminacji rzęs',
          slug: 'zalety-laminacji-rzes',
          excerpt: 'Dowiedz się, dlaczego laminacja rzęs jest lepsza od sztucznych rzęs.',
          content: '<h2>Laminacja rzęs</h2><p>Laminacja rzęs to zabieg, który nadaje naturalnym rzęsom piękny skręt.</p>',
          category: 'Zabiegi',
          created_at: '2023-02-15',
          image_url: '/images/laminacja.png',
          is_published: true
        },
        {
          id: 3,
          title: 'Jak przygotować się do zabiegu?',
          slug: 'jak-przygotowac-sie-do-zabiegu',
          excerpt: 'Sprawdź, co zrobić przed wizytą, aby efekty były jeszcze lepsze.',
          content: '<h2>Przygotowanie do zabiegu</h2><p>Odpowiednie przygotowanie do zabiegu kosmetycznego może znacznie poprawić jego efekty.</p>',
          category: 'Porady',
          created_at: '2023-03-20',
          image_url: '/images/kosmetolog.jpeg',
          is_published: true
        }
      ]
    });
  } else {
    res.status(401).json({ success: false, message: 'Nieprawidłowy token' });
  }
});

// Endpoint dla metamorfoz w panelu admina
app.get('/api/admin/metamorphoses', (req, res) => {
  console.log('Endpoint /admin/metamorphoses wywołany');
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Brak tokenu autoryzacji' });
  }
  
  const token = authHeader.split(' ')[1];
  
  if (token === 'admin-token-123') {
    res.json({
      metamorphoses: [
        {
          id: 1,
          treatment_name: 'Laminacja brwi',
          before_image: '/images/kosmetolog.jpeg',
          after_image: '/images/kosmetolog.jpeg',
          created_at: '2023-01-15'
        },
        {
          id: 2,
          treatment_name: 'Henna pudrowa',
          before_image: '/images/kosmetolog.jpeg',
          after_image: '/images/kosmetolog.jpeg',
          created_at: '2023-02-20'
        },
        {
          id: 3,
          treatment_name: 'Laminacja rzęs',
          before_image: '/images/kosmetolog.jpeg',
          after_image: '/images/kosmetolog.jpeg',
          created_at: '2023-03-10'
        }
      ]
    });
  } else {
    res.status(401).json({ success: false, message: 'Nieprawidłowy token' });
  }
});

// Endpoint dla dostępnych dat
app.get('/api/available-dates', (req, res) => {
  console.log('Endpoint /available-dates wywołany');
  
  // Generujemy daty na najbliższe 30 dni
  const dates = [];
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    // Format YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    dates.push(`${year}-${month}-${day}`);
  }
  
  res.json({ dates });
});

// Endpoint dla dostępnych slotów w danym dniu
app.get('/api/available-slots/:date', (req, res) => {
  console.log('Endpoint /available-slots wywołany dla daty:', req.params.date);
  
  // Generujemy sloty co 30 minut od 9:00 do 17:00
  const slots = [];
  const startHour = 9;
  const endHour = 17;
  
  for (let hour = startHour; hour < endHour; hour++) {
    slots.push(`${String(hour).padStart(2, '0')}:00:00`);
    slots.push(`${String(hour).padStart(2, '0')}:30:00`);
  }
  
  res.json({ slots });
});

// Endpoint dla wizyt użytkownika
app.get('/api/user/appointments', (req, res) => {
  console.log('Endpoint /user/appointments wywołany');
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Brak tokenu autoryzacji' });
  }
  
  const token = authHeader.split(' ')[1];
  
  if (token === 'admin-token-123') {
    res.json({
      appointments: [
        {
          id: 1,
          date: '2023-06-15',
          time: '10:00:00',
          notes: 'Manicure hybrydowy',
          status: 'confirmed',
          created_at: '2023-06-01'
        },
        {
          id: 2,
          date: '2023-06-20',
          time: '14:30:00',
          notes: 'Pedicure klasyczny',
          status: 'pending',
          created_at: '2023-06-05'
        }
      ]
    });
  } else {
    res.status(401).json({ success: false, message: 'Nieprawidłowy token' });
  }
});

// Endpoint dla wizyt w panelu admina
app.get('/api/admin/appointments', (req, res) => {
  console.log('Endpoint /admin/appointments wywołany');
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Brak tokenu autoryzacji' });
  }
  
  const token = authHeader.split(' ')[1];
  
  if (token === 'admin-token-123') {
    res.json({
      appointments: [
        {
          id: 1,
          date: '2023-06-15',
          time: '10:00:00',
          notes: 'Manicure hybrydowy',
          status: 'confirmed',
          created_at: '2023-06-01',
          first_name: 'Anna',
          last_name: 'Kowalska',
          email: 'anna.kowalska@example.com',
          phone: '123456789',
          account_type: 'manual'
        },
        {
          id: 2,
          date: '2023-06-20',
          time: '14:30:00',
          notes: 'Pedicure klasyczny',
          status: 'pending',
          created_at: '2023-06-05',
          first_name: 'Piotr',
          last_name: 'Nowak',
          email: 'piotr.nowak@example.com',
          phone: '987654321',
          account_type: 'registered'
        }
      ]
    });
  } else {
    res.status(401).json({ success: false, message: 'Nieprawidłowy token' });
  }
});

// Endpoint dla opinii w panelu admina
app.get('/api/admin/reviews', (req, res) => {
  console.log('Endpoint /admin/reviews wywołany');
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Brak tokenu autoryzacji' });
  }
  
  const token = authHeader.split(' ')[1];
  
  if (token === 'admin-token-123') {
    res.json({
      reviews: [
        {
          id: 1,
          first_name: 'Anna',
          last_name: 'Kowalska',
          email: 'anna.kowalska@example.com',
          rating: 5,
          comment: 'Wspaniała obsługa i profesjonalne podejście!',
          is_approved: true,
          created_at: '2023-01-15'
        },
        {
          id: 2,
          first_name: 'Monika',
          last_name: 'Wiśniewska',
          email: 'monika.wisniewska@example.com',
          rating: 5,
          comment: 'Jestem bardzo zadowolona z efektów zabiegu!',
          is_approved: true,
          created_at: '2023-02-20'
        },
        {
          id: 3,
          first_name: 'Karolina',
          last_name: 'Zielińska',
          email: 'karolina.zielinska@example.com',
          rating: 4,
          comment: 'Polecam, bardzo miła atmosfera i dobre efekty.',
          is_approved: false,
          created_at: '2023-03-10'
        }
      ]
    });
  } else {
    res.status(401).json({ success: false, message: 'Nieprawidłowy token' });
  }
});

// Endpoint do dodawania opinii
app.post('/api/reviews', (req, res) => {
  console.log('Endpoint POST /reviews wywołany');
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Brak tokenu autoryzacji' });
  }
  
  const { rating, comment } = req.body;
  
  if (!rating || !comment || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'Nieprawidłowe dane' });
  }
  
  res.json({ 
    success: true, 
    message: 'Opinia została dodana' 
  });
});

// Endpoint do rezerwacji wizyty
app.post('/api/book-appointment', (req, res) => {
  console.log('Endpoint POST /book-appointment wywołany');
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Brak tokenu autoryzacji' });
  }
  
  const { date, time, notes } = req.body;
  
  if (!date || !time) {
    return res.status(400).json({ success: false, message: 'Data i godzina są wymagane' });
  }
  
  // Sprawdzamy czy termin jest dostępny
  // W prawdziwej aplikacji sprawdzalibyśmy to w bazie danych
  
  res.json({ 
    success: true, 
    message: 'Wizyta została zgłoszona i oczekuje na potwierdzenie' 
  });
});

// Endpoint do ręcznego dodawania wizyty przez admina
app.post('/api/admin/appointments/manual', (req, res) => {
  console.log('Endpoint POST /admin/appointments/manual wywołany');
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Brak tokenu autoryzacji' });
  }
  
  const token = authHeader.split(' ')[1];
  
  if (token !== 'admin-token-123') {
    return res.status(401).json({ success: false, message: 'Nieprawidłowy token' });
  }
  
  const { firstName, lastName, phone, email, date, time, notes } = req.body;
  
  if (!firstName || !lastName || !phone || !email || !date || !time) {
    return res.status(400).json({ success: false, message: 'Wszystkie pola są wymagane' });
  }
  
  res.json({ 
    success: true, 
    message: 'Wizyta została dodana' 
  });
});

// Proxy dla żądań API - musi być przed static middleware
app.use('/api', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  pathRewrite: function (path) {
    // Pomijamy endpointy, które obsługujemy lokalnie
    if (path === '/api/login' || path === '/api/login-test' || path === '/api/test' || 
        path === '/api/reviews' || path === '/api/articles' || path === '/api/metamorphoses' || 
        path === '/api/admin' || path.startsWith('/api/admin/')) {
      return path;
    }
    
    // Usuwamy /api z początku ścieżki
    const newPath = path.replace(/^\/api/, '');
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

// Wszystkie żądania do ścieżek, które nie są plikami, przekieruj do index.html
app.get('*', (req, res, next) => {
  // Jeśli żądanie zawiera kropkę, prawdopodobnie jest to plik
  if (req.path.includes('.')) {
    return next();
  }
  
  console.log('Przekierowanie żądania:', req.path, 'do index.html');
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Serwer uruchomiony na porcie ${PORT}`);
  console.log(`Serwowanie plików z: ${distPath}`);
  console.log(`Proxy dla API: ${BACKEND_URL}`);
});