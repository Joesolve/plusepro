import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('pulsepro_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Redirect to login on 401 (skip auth endpoints so login/register errors display properly)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
      if (!isAuthEndpoint) {
        localStorage.removeItem('pulsepro_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

/**
 * Extract a human-readable error message from an axios error.
 * Handles NestJS responses (message can be string or string[]) and network errors.
 */
export function extractErrorMessage(err: unknown, fallback: string): string {
  const error = err as { response?: { data?: { message?: string | string[] } }; message?: string };
  if (error.response?.data?.message) {
    const msg = error.response.data.message;
    return Array.isArray(msg) ? msg.join(', ') : msg;
  }
  if (error.message === 'Network Error') {
    return 'Cannot reach the server. Please check that the backend is running and CORS is configured.';
  }
  return fallback;
}

export default api;
