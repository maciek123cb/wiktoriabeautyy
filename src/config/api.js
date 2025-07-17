// Configuration for API endpoints
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://wiktoriabeautyy.onrender.com' // Adres backendu na Render.com
  : 'http://localhost:3001';

export const getApiUrl = (endpoint) => {
  return `${API_URL}${endpoint}`;
};

export default {
  getApiUrl
};