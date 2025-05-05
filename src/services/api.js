import axios from 'axios';

// Log the environment
console.log('Current environment:', process.env.NODE_ENV);

// Create axios instance with base URL
const api = axios.create({
  // Remove the /api from the baseURL as we already include it in our routes
  baseURL: 'http://localhost:3000', 
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Log configuration for debugging
console.log('API Configuration:', {
  baseURL: api.defaults.baseURL,
  timeout: api.defaults.timeout,
  headers: api.defaults.headers
});

// Add a request interceptor to attach the auth token to all requests
api.interceptors.request.use(
  (config) => {
    console.log('Request config:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL
    });
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common error cases
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url
    });
    return response;
  },
  (error) => {
    console.error('Response interceptor error:', error.message);
    
    // Handle 401 Unauthorized errors by redirecting to login
    if (error.response && error.response.status === 401) {
      console.log('Unauthorized - redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login if we're not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api; 