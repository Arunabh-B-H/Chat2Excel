import axios from 'axios';

const rawBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const baseURL = rawBaseURL.replace(/\/+$/, '');

const API = axios.create({
  baseURL
});

// Attach JWT token to requests if present in localStorage
API.interceptors.request.use(
  (req) => {
    const token = localStorage.getItem('token');
    if (token) {
      req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to log errors and catch unauthorized or expired tokens
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log any live API error message directly to the browser console
    console.error(
      '[API Error Interceptor]:',
      error.config?.method?.toUpperCase(),
      error.config?.url,
      error.response?.status || 'NO_RESPONSE',
      error.response?.data || error.message
    );

    if (error.response && error.response.status === 401) {
      // Clear stale token
      localStorage.removeItem('token');

      // Dispatch event for React AuthContext to update UI smoothly
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('auth:session_expired', {
            detail: {
              message:
                error.response?.data?.error ||
                'Your session has expired. Please sign in again.'
            }
          })
        );

        // If currently on an authenticated page, redirect to login
        const publicPaths = ['/', '/login', '/register'];
        const currentPath = window.location.pathname;
        const isPublic = publicPaths.some(
          (p) => currentPath === p || currentPath.startsWith('/login') || currentPath.startsWith('/register')
        );

        if (!isPublic) {
          console.warn('⚠️ Session expired or unauthorized (401). Redirecting to login.');
          setTimeout(() => {
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login?expired=1';
            }
          }, 350);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default API;
