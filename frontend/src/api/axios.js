import axios from 'axios';

// Vite proxy forwards /auth, /students, etc. to http://localhost:8080
// Direct backend URL fallback if running outside Vite proxy
const BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: Attach JWT token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Extract errors and handle 401/403
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;

      // Token expired or invalid
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Only redirect if not already on the login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login?expired=true';
        }
      }

      // Format clean message for frontend consumption
      const data = error.response.data;
      let message = 'An error occurred';

      if (data) {
        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          message = data.errors.join(', ');
        } else if (data.message) {
          message = data.message;
        } else if (typeof data === 'string') {
          message = data;
        }
      }

      if (status === 403) {
        message = 'You do not have permission to perform this action.';
      }

      error.userMessage = message;
    } else if (error.request) {
      error.userMessage = 'Cannot connect to backend server. Ensure Spring Boot is running on port 8080.';
    } else {
      error.userMessage = error.message;
    }

    return Promise.reject(error);
  }
);

export default api;
