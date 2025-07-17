// Configuration for API endpoints
const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api' // Używamy względnej ścieżki w produkcji
  : 'http://localhost:3001';

export const getApiUrl = (endpoint) => {
  return `${API_URL}${endpoint}`;
};

export default {
  getApiUrl
};