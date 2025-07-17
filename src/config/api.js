// Configuration for API endpoints
const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api' // Używamy względnej ścieżki w produkcji
  : 'http://localhost:3001';

export const getApiUrl = (endpoint) => {
  // Upewnij się, że endpoint zaczyna się od /
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_URL}${formattedEndpoint}`;
};

export default {
  getApiUrl
};