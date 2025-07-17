// Skrypt do ręcznej inicjalizacji bazy danych na Render.com
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Połączenie z bazą danych
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function initDatabase() {
  let client;
  try {
    client = await pool.connect();
    console.log('Połączono z bazą danych PostgreSQL');
    
    // Wczytaj skrypt SQL
    const sqlScript = fs.readFileSync(path.join(__dirname, 'init-postgres.sql'), 'utf8');
    
    // Podziel na pojedyncze zapytania
    const queries = sqlScript.split(';').filter(query => query.trim().length > 0);
    
    // Wykonaj każde zapytanie osobno
    for (const query of queries) {
      try {
        await client.query(query);
        console.log('Wykonano zapytanie SQL');
      } catch (err) {
        console.error('Błąd wykonania zapytania:', err.message);
        console.error('Problematyczne zapytanie:', query);
      }
    }
    
    console.log('Inicjalizacja bazy danych zakończona');
  } catch (err) {
    console.error('Błąd połączenia z bazą danych:', err);
  } finally {
    if (client) client.release();
    pool.end();
  }
}

// Uruchom inicjalizację
initDatabase();