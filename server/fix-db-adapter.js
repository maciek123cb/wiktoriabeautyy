// Skrypt do naprawy problemu z metodą execute na Render.com
require('dotenv').config();
const { Pool } = require('pg');

// Połączenie z bazą danych
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Funkcja do wykonywania zapytań SQL
async function executeQuery(query, params = []) {
  try {
    // Dostosowanie zapytania SQL do PostgreSQL
    let modifiedQuery = query;
    
    // Zamiana znaków zapytania na parametry numerowane dla PostgreSQL
    if (params && params.length > 0 && query.includes('?')) {
      let paramIndex = 1;
      modifiedQuery = query.replace(/\?/g, () => `$${paramIndex++}`);
    }
    
    console.log('Wykonuję zapytanie:', modifiedQuery);
    const result = await pool.query(modifiedQuery, params);
    console.log('Zapytanie wykonane pomyślnie, liczba wierszy:', result.rowCount);
    return result;
  } catch (error) {
    console.error('Błąd zapytania:', error.message);
    console.error('Zapytanie:', query);
    console.error('Parametry:', params);
    throw error;
  }
}

// Testowe zapytanie
async function testConnection() {
  try {
    console.log('Testowanie połączenia z bazą danych...');
    const result = await executeQuery('SELECT NOW() as time');
    console.log('Połączenie działa! Aktualny czas serwera:', result.rows[0].time);
    
    // Sprawdź czy tabela users istnieje
    try {
      const usersResult = await executeQuery('SELECT COUNT(*) FROM users');
      console.log('Tabela users istnieje, liczba użytkowników:', usersResult.rows[0].count);
    } catch (error) {
      console.error('Błąd przy sprawdzaniu tabeli users:', error.message);
    }
    
    // Sprawdź czy istnieje admin
    try {
      const adminResult = await executeQuery("SELECT * FROM users WHERE email = 'admin@example.com'");
      if (adminResult.rows.length > 0) {
        console.log('Konto administratora istnieje:', adminResult.rows[0]);
      } else {
        console.log('Konto administratora nie istnieje, tworzę...');
        await executeQuery(
          "INSERT INTO users (first_name, last_name, phone, email, password_hash, is_active, role) VALUES ($1, $2, $3, $4, $5, $6, $7)",
          ['Admin', 'System', '123456789', 'admin@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, 'admin']
        );
        console.log('Konto administratora utworzone');
      }
    } catch (error) {
      console.error('Błąd przy sprawdzaniu konta administratora:', error.message);
    }
    
  } catch (error) {
    console.error('Błąd testowania połączenia:', error);
  } finally {
    pool.end();
  }
}

// Uruchom test
testConnection();