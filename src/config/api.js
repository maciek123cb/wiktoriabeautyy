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
    const response = await fetch('/api/test');
    const data = await response.json();
    console.log('Test API connection result:', data);
    return data;
  } catch (error) {
    console.error('Test API connection error:', error);
    return { success: false, error: error.message };
  }
};

export default {
  getApiUrl,
  testApiConnection
};