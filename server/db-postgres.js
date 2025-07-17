// Moduł do obsługi bazy danych PostgreSQL na Render.com
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Konfiguracja połączenia z bazą danych
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Wymagane dla Render.com
  }
});

// Funkcja do inicjalizacji bazy danych
async function initializeDatabase() {
  try {
    const client = await pool.connect();
    console.log('Połączono z bazą danych PostgreSQL');
    
    // Wczytaj i wykonaj skrypt inicjalizacyjny
    try {
      const initScript = fs.readFileSync(path.join(__dirname, 'init-postgres.sql'), 'utf8');
      // Wykonaj każde zapytanie osobno
      const queries = initScript.split(';').filter(query => query.trim().length > 0);
      
      for (const query of queries) {
        try {
          await client.query(query);
          console.log('Wykonano zapytanie SQL');
        } catch (queryError) {
          console.error('Błąd wykonania zapytania:', queryError.message);
          console.error('Problematyczne zapytanie:', query);
        }
      }
      
      console.log('Baza danych PostgreSQL została zainicjalizowana');
    } catch (scriptError) {
      console.error('Błąd wczytywania skryptu SQL:', scriptError);
    }
    
    client.release();
    return pool;
  } catch (error) {
    console.error('Błąd inicjalizacji bazy danych PostgreSQL:', error);
    throw error;
  }
}

// Funkcja do wykonywania zapytań
async function query(text, params) {
  try {
    const result = await pool.query(text, params);
    return [result.rows, result.fields];
  } catch (error) {
    console.error('Błąd zapytania PostgreSQL:', error);
    throw error;
  }
}

// Funkcja do wykonywania zapytań bez zwracania wyników
async function execute(text, params) {
  try {
    // Dostosowanie zapytania SQL do PostgreSQL
    let modifiedText = text;
    
    // Zamiana znaków zapytania na parametry numerowane dla PostgreSQL
    if (params && params.length > 0 && text.includes('?')) {
      let paramIndex = 1;
      modifiedText = text.replace(/\?/g, () => `$${paramIndex++}`);
    }
    
    const result = await pool.query(modifiedText, params);
    return [result.rows, result.fields];
  } catch (error) {
    console.error('Błąd wykonania PostgreSQL:', error);
    console.error('Zapytanie:', text);
    console.error('Parametry:', params);
    throw error;
  }
}

module.exports = {
  initializeDatabase,
  query,
  execute,
  pool
};