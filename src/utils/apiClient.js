import { clearAllUserData } from '../store/slices/authSlice';

const apiUrl = import.meta.env.VITE_API_HOSTNAME;
const videoapiUrl = import.meta.env.VITE_VIDEO_API_URL;

// Deep trim helper
export const sanitizePayload = (value) => {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) return value.map(sanitizePayload);
  if (typeof value === 'object') {
    const out = {};
    for (const k of Object.keys(value)) {
      out[k] = sanitizePayload(value[k]);
    }
    return out;
  }
  return value;
};

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let refreshPromise = null;

// Token expiration buffer (5 minutes before actual expiration)
const TOKEN_BUFFER_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds
let tokenExpirationTime = null;

// Check if token is close to expiration
const isTokenNearExpiration = () => {
  if (!tokenExpirationTime) return false;
  return Date.now() > (tokenExpirationTime - TOKEN_BUFFER_TIME);
};

// Set token expiration time from JWT
const setTokenExpirationTime = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    tokenExpirationTime = payload.exp * 1000; // Convert to milliseconds
  } catch (error) {
    console.warn('Failed to parse token expiration:', error);
    tokenExpirationTime = null;
  }
};

// Queue for requests waiting for token refresh
let requestQueue = [];

// Process queued requests after token refresh
const processQueue = (error = null) => {
  requestQueue.forEach(({ resolve, reject, url, options }) => {
    if (error) {
      reject(error);
    } else {
      // Retry the original request
      fetch(url, options)
        .then(resolve)
        .catch(reject);
    }
  });
  requestQueue = [];
};

// Refresh token function
const refreshToken = async () => {
  try {
    const response = await fetch(`${apiUrl}/refresh-token`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (response.ok && data.status) {
      // Update token expiration time if token is provided
      if (data.token) {
        setTokenExpirationTime(data.token);
      }
      return data;
    } else {
      throw new Error(data.message || 'Token refresh failed');
    }
  } catch (error) {
    throw error;
  }
};

// Enhanced fetch with automatic token refresh
const apiClient = async (url, options = {}) => {
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Proactively refresh token if it's close to expiration
  if (isTokenNearExpiration() && !isRefreshing) {
    isRefreshing = true;
    try {
      if (!refreshPromise) {
        refreshPromise = refreshToken();
      }
      await refreshPromise;
    } catch (error) {
      console.warn('Proactive token refresh failed:', error);
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  }

  try {
    const response = await fetch(url, defaultOptions);
    
    // If request is successful, return the response
    if (response.ok) {
      return response;
    }
    
    // Handle 401 Unauthorized - token might be expired
    if (response.status === 401) {
      // Do NOT try to refresh token for auth endpoints themselves
      const lowerUrl = url.toLowerCase();
      const isAuthEndpoint =
        lowerUrl.includes('/login') ||
        lowerUrl.includes('/signup') ||
        lowerUrl.includes('/refresh-token') ||
        lowerUrl.includes('/forgot-password') ||
        lowerUrl.includes('/reset-password') ||
        lowerUrl.includes('/verify-email');

      if (isAuthEndpoint) {
        return response;
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          requestQueue.push({ resolve, reject, url, options: defaultOptions });
        });
      }

      // Start token refresh process
      isRefreshing = true;
      
      try {
        if (!refreshPromise) {
          refreshPromise = refreshToken();
        }
        
        await refreshPromise;
        
        // Token refreshed successfully, process queued requests
        processQueue();
        
        // Retry the original request
        const retryResponse = await fetch(url, defaultOptions);
        return retryResponse;
        
      } catch (refreshError) {
        // Token refresh failed, process queue with error
        processQueue(refreshError);
        
        // Clear all cached user data and redirect to login
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {
          // ignore storage errors
        }

        // Dispatch full clear if Redux store is available
        if (window.__REDUX_STORE__) {
          try {
            window.__REDUX_STORE__.dispatch(clearAllUserData());
          } catch {
            window.__REDUX_STORE__.dispatch({ type: 'auth/clearAuth' });
          }
        }
        
        // Show user-friendly message on login page after redirect
        const friendlyMessage = 'Your session has expired. Please sign in again to continue.';
        sessionStorage.setItem('authError', friendlyMessage);
        
        // Redirect to login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        
        throw refreshError;
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    }
    
    // Handle 403 Forbidden - org suspended or member deactivated (no point retrying)
    if (response.status === 403) {
      let message = '';
      try {
        const clone = response.clone();
        const data = await clone.json().catch(() => ({}));
        message = data?.message || data?.error || '';
      } catch {
        // ignore
      }
      if (
        message.includes('suspended') ||
        message.includes('deactivated') ||
        message.includes('access has been deactivated')
      ) {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {
          // ignore storage errors
        }
        if (window.__REDUX_STORE__) {
          try {
            window.__REDUX_STORE__.dispatch(clearAllUserData());
          } catch {
            window.__REDUX_STORE__.dispatch({ type: 'auth/clearAuth' });
          }
        }
        sessionStorage.setItem('authError', message);
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    
    // For other error status codes, return the response as is
    return response;
    
  } catch (error) {
    // Network errors or other fetch errors
    throw error;
  }
};

// Convenience methods
const inflightGetRequests = new Map();
export const apiGet = (url, options = {}) => {
  if (options && options.signal) {
    return apiClient(url, { method: 'GET', ...options });
  }
  const headersKey = options?.headers ? JSON.stringify(options.headers) : '';
  const key = `GET:${url}:${headersKey}`;
  const existing = inflightGetRequests.get(key);
  if (existing) {
    return existing.then((res) => res.clone());
  }
  const req = apiClient(url, { method: 'GET', ...options }).finally(() => {
    inflightGetRequests.delete(key);
  });
  inflightGetRequests.set(key, req);
  return req.then((res) => res.clone());
};

export const apiPost = (url, data, options = {}) => {
  return apiClient(url, {
    method: 'POST',
    body: JSON.stringify(sanitizePayload(data)),
    ...options,
  });
};

export const apiPut = (url, data, options = {}) => {
  return apiClient(url, {
    method: 'PUT',
    body: JSON.stringify(sanitizePayload(data)),
    ...options,
  });
};

export const apiPatch = (url, data, options = {}) => {
  return apiClient(url, {
    method: 'PATCH',
    body: JSON.stringify(sanitizePayload(data)),
    ...options,
  });
};

export const apiDelete = (url, options = {}) => {
  return apiClient(url, { method: 'DELETE', ...options });
};

export { apiUrl, videoapiUrl };
export default apiClient;
