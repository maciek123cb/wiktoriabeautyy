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
const dbModule = isProduction 
  ? require('./db-postgres')  // PostgreSQL na Render.com
  : require('./db-mysql');    // MySQL lokalnie

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
    // Inicjalizacja bazy danych
    if (isProduction) {
      db = await dbModule.initializeDatabase();
      // W przypadku PostgreSQL, db to obiekt z metodami query i execute
    } else {
      db = await dbModule.initializeDatabase();
      // W przypadku MySQL, db to połączenie z bazą danych
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