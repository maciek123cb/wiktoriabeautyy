// Adapter bazy danych dla PostgreSQL na Render.com
const { Pool } = require('pg');

// Tworzy adapter bazy danych dla PostgreSQL, który emuluje interfejs MySQL
async function createPostgresAdapter(connectionString) {
  try {
    const pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });
    
    // Testujemy połączenie
    const testResult = await pool.query('SELECT NOW() as time');
    console.log('Połączenie z PostgreSQL nawiązane pomyślnie, czas serwera:', testResult.rows[0].time);
    
    // Zwracamy adapter
    return {
      async execute(query, params = []) {
        try {
          // Konwersja znaków zapytania na parametry numerowane
          let modifiedQuery = query;
          if (params && params.length > 0 && query.includes('?')) {
            let paramIndex = 1;
            modifiedQuery = query.replace(/\?/g, () => `$${paramIndex++}`);
          }
          
          const result = await pool.query(modifiedQuery, params);
          return [result.rows, result.fields];
        } catch (error) {
          console.error('Błąd zapytania PostgreSQL:', error.message);
          console.error('Zapytanie:', query);
          throw error;
        }
      },
      
      async query(query, params = []) {
        return this.execute(query, params);
      },
      
      async end() {
        return pool.end();
      }
    };
  } catch (error) {
    console.error('Błąd tworzenia adaptera PostgreSQL:', error);
    throw error;
  }
}

module.exports = { createPostgresAdapter };