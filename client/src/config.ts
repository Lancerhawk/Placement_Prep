export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Debug: log the API URL in development (remove in production if needed)
if (import.meta.env.DEV) {
  console.log('API_URL:', API_URL);
}