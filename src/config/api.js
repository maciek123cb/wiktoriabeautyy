// Configuration for API endpoints
const API_URL = process.env.NODE_ENV === 'production' 
  ? '' // Empty string for relative URLs in production (same domain)
  : 'http://localhost:3001';

export const getApiUrl = (endpoint) => {
  return `${API_URL}${endpoint}`;
};

export default {
  getApiUrl
};