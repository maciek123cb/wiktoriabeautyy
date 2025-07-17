// Configuration for API endpoints
const API_URL = process.env.NODE_ENV === 'production' 
  ? '' // Puste, bo używamy bezpośrednich ścieżek
  : 'http://localhost:3001';

export const getApiUrl = (endpoint) => {
  // Upewnij się, że endpoint zaczyna się od /
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // W produkcji dodaj prefiks /api
  if (process.env.NODE_ENV === 'production') {
    return `/api${formattedEndpoint}`;
  }
  
  return `${API_URL}${formattedEndpoint}`;
};

export default {
  getApiUrl
};