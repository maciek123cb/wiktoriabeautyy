require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Wybór odpowiedniego modułu bazy danych w zależności od środowiska
const isProduction = process.env.NODE_ENV === 'production';

// W środowisku produkcyjnym używamy adaptera PostgreSQL
const dbAdapter = isProduction 
  ? require('./db-adapter')  // Adapter PostgreSQL na Render.com
  : null;                    // Nie używany lokalnie

// Moduł MySQL dla środowiska lokalnego
const dbModule = isProduction 
  ? null                    // Nie używany w produkcji
  : require('./db-mysql');  // MySQL lokalnie

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Endpoint testowy
app.get('/api/test', (req, res) => {
  console.log('Endpoint testowy wywołany');
  res.json({ success: true, message: 'API działa poprawnie!' });
});

// Konfiguracja multer dla uploadów
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'uploads', 'metamorphoses');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Tylko pliki obrazów są dozwolone!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Zmienna do przechowywania połączenia z bazą danych
let db;

// Middleware weryfikacji tokenu
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Brak tokenu autoryzacji' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Nieprawidłowy token' });
  }
};

// REJESTRACJA
app.post('/api/register', async (req, res) => {
  try {
    const { firstName, lastName, phone, email, password } = req.body;

    if (!firstName || !lastName || !phone || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Wszystkie pola są wymagane'
      });
    }

    let existingUser;
    if (isProduction) {
      const [result] = await db.execute(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      existingUser = result;
    } else {
      const [result] = await db.execute(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );
      existingUser = result;
    }

    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Użytkownik z tym adresem email już istnieje'
      });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    if (isProduction) {
      await db.execute(
        'INSERT INTO users (first_name, last_name, phone, email, password_hash) VALUES ($1, $2, $3, $4, $5)',
        [firstName, lastName, phone, email, passwordHash]
      );
    } else {
      await db.execute(
        'INSERT INTO users (first_name, last_name, phone, email, password_hash) VALUES (?, ?, ?, ?, ?)',
        [firstName, lastName, phone, email, passwordHash]
      );
    }

    res.json({
      success: true,
      message: 'Konto zostało utworzone. Oczekuje na zatwierdzenie przez administratora.'
    });
  } catch (error) {
    console.error('Błąd rejestracji:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera podczas rejestracji'
    });
  }
});

// LOGOWANIE
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    let users;
    if (isProduction) {
      const [result] = await db.execute(
        'SELECT id, first_name, last_name, email, password_hash, is_active, role FROM users WHERE email = $1',
        [email]
      );
      users = result;
    } else {
      const [result] = await db.execute(
        'SELECT id, first_name, last_name, email, password_hash, is_active, role FROM users WHERE email = ?',
        [email]
      );
      users = result;
    }

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Nieprawidłowy email lub hasło'
      });
    }

    const user = users[0];

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Nieprawidłowy email lub hasło'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Konto oczekuje na zatwierdzenie przez administratora'
      });
    }

    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email, 
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Logowanie pomyślne',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name
      }
    });
  } catch (error) {
    console.error('Błąd logowania:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera podczas logowania'
    });
  }
});

// Pozostałe endpointy API...
// Tutaj należy dodać pozostałe endpointy z oryginalnego pliku server.js,
// dostosowując zapytania SQL do PostgreSQL dla środowiska produkcyjnego

// Inicjalizacja i uruchomienie serwera
async function startServer() {
  try {
    console.log('Uruchamianie serwera w środowisku:', isProduction ? 'produkcyjnym' : 'rozwojowym');
    
    // Inicjalizacja bazy danych
    if (isProduction) {
      console.log('Próba połączenia z bazą danych PostgreSQL...');
      console.log('DATABASE_URL jest ustawiony:', !!process.env.DATABASE_URL);
      
      if (!process.env.DATABASE_URL) {
        console.error('Brak zmiennej środowiskowej DATABASE_URL - sprawdź konfiguracje na Render.com');
        console.warn('Kontynuowanie bez połączenia z bazą danych - API będzie działać w trybie awaryjnym');
        // Nie rzucamy błędu, pozwalamy serwerowi uruchomić się bez bazy danych
      }
      
      try {
        if (process.env.DATABASE_URL) {
          // Używamy naszego adaptera PostgreSQL
          db = await dbAdapter.createPostgresAdapter(process.env.DATABASE_URL);
          
          // Testujemy połączenie
          const [testResult] = await db.execute('SELECT NOW() as time');
          console.log('Połączenie z PostgreSQL nawiązane pomyślnie, czas serwera:', testResult[0].time);
        } else {
          console.warn('Brak połączenia z bazą danych - API działa w trybie awaryjnym');
        }
        
        // Sprawdzamy czy tabele istnieją
        try {
          // Tworzenie wszystkich tabel
          console.log('Tworzenie tabel jeśli nie istnieją...');
          
          // Tabela users
          await db.execute(`
            CREATE TABLE IF NOT EXISTS users (
              id SERIAL PRIMARY KEY,
              first_name VARCHAR(100) NOT NULL,
              last_name VARCHAR(100) NOT NULL,
              phone VARCHAR(20) NOT NULL,
              email VARCHAR(255) UNIQUE NOT NULL,
              password_hash VARCHAR(255) NOT NULL,
              is_active BOOLEAN DEFAULT FALSE,
              role VARCHAR(10) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
          
          // Tabela available_slots
          await db.execute(`
            CREATE TABLE IF NOT EXISTS available_slots (
              id SERIAL PRIMARY KEY,
              date DATE NOT NULL,
              time TIME NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              UNIQUE (date, time)
            )
          `);
          
          // Tabela appointments
          await db.execute(`
            CREATE TABLE IF NOT EXISTS appointments (
              id SERIAL PRIMARY KEY,
              user_id INTEGER NOT NULL,
              date DATE NOT NULL,
              time TIME NOT NULL,
              notes TEXT,
              status VARCHAR(10) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
              UNIQUE (date, time)
            )
          `);
          
          // Tabela services
          await db.execute(`
            CREATE TABLE IF NOT EXISTS services (
              id SERIAL PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              description TEXT,
              price DECIMAL(10,2) NOT NULL,
              duration INTEGER NOT NULL,
              category VARCHAR(100) NOT NULL,
              is_active BOOLEAN DEFAULT TRUE,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
          
          // Tabela articles
          await db.execute(`
            CREATE TABLE IF NOT EXISTS articles (
              id SERIAL PRIMARY KEY,
              title VARCHAR(255) NOT NULL,
              slug VARCHAR(255) UNIQUE NOT NULL,
              excerpt TEXT NOT NULL,
              content TEXT NOT NULL,
              image_url VARCHAR(500),
              category VARCHAR(100) NOT NULL,
              is_published BOOLEAN DEFAULT FALSE,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
          
          // Tabela reviews
          await db.execute(`
            CREATE TABLE IF NOT EXISTS reviews (
              id SERIAL PRIMARY KEY,
              user_id INTEGER NOT NULL,
              rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
              comment TEXT NOT NULL,
              is_approved BOOLEAN DEFAULT TRUE,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
          `);
          
          // Tabela metamorphoses
          await db.execute(`
            CREATE TABLE IF NOT EXISTS metamorphoses (
              id SERIAL PRIMARY KEY,
              treatment_name VARCHAR(255) NOT NULL,
              before_image VARCHAR(500) NOT NULL,
              after_image VARCHAR(500) NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
          
          console.log('Dodawanie danych testowych...');
          
          // Dodawanie administratora
          const [adminCheck] = await db.execute("SELECT * FROM users WHERE email = 'admin@example.com'");
          if (adminCheck.length === 0) {
            console.log('Tworzenie konta administratora...');
            await db.execute(
              "INSERT INTO users (first_name, last_name, phone, email, password_hash, is_active, role) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (email) DO NOTHING",
              ['Admin', 'System', '123456789', 'admin@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, 'admin']
            );
          } else {
            console.log('Konto administratora już istnieje');
          }
          
          // Dodawanie testowych użytkowników
          await db.execute(`
            INSERT INTO users (first_name, last_name, phone, email, password_hash, is_active, role) VALUES
            ('Anna', 'Kowalska', '123456789', 'anna.kowalska@example.com', 'manual_account', TRUE, 'user'),
            ('Piotr', 'Nowak', '987654321', 'piotr.nowak@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE, 'user'),
            ('Maria', 'Wiśniewska', '555666777', 'maria.wisniewska@example.com', 'manual_account', FALSE, 'user'),
            ('Jan', 'Kowalski', '111222333', 'jan.kowalski@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE, 'user'),
            ('Katarzyna', 'Zielińska', '444555666', 'katarzyna.zielinska@example.com', 'manual_account', TRUE, 'user')
            ON CONFLICT (email) DO NOTHING
          `);
          
          // Dodawanie przykładowych usług
          await db.execute(`
            INSERT INTO services (name, description, price, duration, category) VALUES
            ('Manicure klasyczny', 'Profesjonalny manicure z lakierowaniem', 80.00, 60, 'Manicure'),
            ('Manicure hybrydowy', 'Trwały manicure hybrydowy', 120.00, 90, 'Manicure'),
            ('Pedicure klasyczny', 'Pielęgnacja stóp z lakierowaniem', 100.00, 75, 'Pedicure'),
            ('Oczyszczanie twarzy', 'Głębokie oczyszczanie skóry twarzy', 150.00, 60, 'Pielęgnacja twarzy'),
            ('Peeling chemiczny', 'Profesjonalny peeling kwasami', 200.00, 45, 'Pielęgnacja twarzy'),
            ('Laminacja brwi', 'Modelowanie i laminacja brwi', 80.00, 45, 'Stylizacja brwi'),
            ('Mezoterapia igłowa', 'Odmładzająca mezoterapia', 300.00, 60, 'Medycyna estetyczna')
            ON CONFLICT DO NOTHING
          `);
          
          // Dodawanie przykładowych artykułów
          await db.execute(`
            INSERT INTO articles (title, slug, excerpt, content, category, is_published) VALUES
            ('Jak dbać o skórę po zabiegu oczyszczania', 'jak-dbac-o-skore-po-zabiegu', 'Poznaj najważniejsze zasady pielęgnacji skóry po profesjonalnym oczyszczaniu twarzy.', '<h2>Pielęgnacja po zabiegu</h2><p>Po zabiegu oczyszczania twarzy skóra wymaga szczególnej opieki.</p>', 'Pielęgnacja', TRUE),
            ('Trendy w stylizacji brwi 2024', 'trendy-stylizacja-brwi-2024', 'Odkryj najgorętsze trendy w stylizacji brwi na nadchodzący sezon.', '<h2>Naturalne brwi</h2><p>W 2024 roku brwi nadal pozostają w centrum uwagi.</p>', 'Stylizacja', TRUE),
            ('Przygotowanie do manicure hybrydowego', 'przygotowanie-manicure-hybrydowy', 'Dowiedz się jak przygotować paznokcie do trwałego manicure.', '<h2>Krok po kroku</h2><p>Manicure hybrydowy to doskonały sposób na piękne paznokcie.</p>', 'Manicure', TRUE)
            ON CONFLICT (slug) DO NOTHING
          `);
        } catch (tableError) {
          console.error('Błąd przy sprawdzaniu/tworzeniu tabel:', tableError.message);
        }
        
      } catch (dbError) {
        console.error('Błąd połączenia z PostgreSQL:', dbError);
        console.warn('Kontynuowanie bez połączenia z bazą danych - API będzie działać w trybie awaryjnym');
        // Nie rzucamy błędu, pozwalamy serwerowi uruchomić się bez bazy danych
      }
    } else {
      console.log('Próba połączenia z bazą danych MySQL...');
      db = await dbModule.initializeDatabase();
      console.log('Połączenie z MySQL nawiązane pomyślnie');
    }
    
    const server = app.listen(PORT, () => {
      console.log(`Serwer działa na porcie ${PORT} w środowisku ${isProduction ? 'produkcyjnym' : 'rozwojowym'}`);
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} jest już zajęty. Zatrzymaj poprzedni serwer lub użyj innego portu.`);
        process.exit(1);
      } else {
        console.error('Błąd serwera:', err);
      }
    });
  } catch (error) {
    console.error('Błąd podczas uruchamiania serwera:', error);
    process.exit(1);
  }
}

startServer().catch(console.error);