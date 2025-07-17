// Configuration for API endpoints
const API_URL = process.env.NODE_ENV === 'production' 
  ? '' // Puste, bo używamy bezpośrednich ścieżek
  : 'http://localhost:3001';

// Funkcja do debugowania
const logApiCall = (endpoint, url) => {
  console.log(`API Call: ${endpoint} -> ${url}`);
  return url;
};

export const getApiUrl = (endpoint) => {
  // Upewnij się, że endpoint zaczyna się od /
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // W produkcji dodaj prefiks /api
  if (process.env.NODE_ENV === 'production') {
    const url = `/api${formattedEndpoint}`;
    return logApiCall(endpoint, url);
  }
  
  const url = `${API_URL}${formattedEndpoint}`;
  return logApiCall(endpoint, url);
};

// Funkcja do testowania połączenia z API
export const testApiConnection = async () => {
  try {
    console.log('Testowanie połączenia z API...');
    // Dodajemy timeout do fetch aby nie czekać zbyt długo
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('/api/test', {
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));
    
    // Jeśli status nie jest ok, zwróć dane testowe
    if (!response.ok) {
      console.log('Test API response not OK, using test data');
      return { 
        success: false, 
        message: 'API działa w trybie awaryjnym',
        mode: 'fallback'
      };
    }
    
    try {
      const data = await response.json();
      console.log('Test API connection result:', data);
      return data;
    } catch (jsonError) {
      console.error('Test API JSON parse error:', jsonError);
      return { 
        success: false, 
        message: 'API działa w trybie awaryjnym',
        mode: 'fallback'
      };
    }
  } catch (error) {
    console.error('Test API connection error:', error);
    return { 
      success: false, 
      message: 'API działa w trybie awaryjnym',
      mode: 'fallback',
      error: error.message 
    };
  }
};

export default {
  getApiUrl,
  testApiConnection
};