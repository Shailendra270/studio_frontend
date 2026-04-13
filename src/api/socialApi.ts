import axios from 'axios';

// Get the base URL from environment variables
const API_URL = import.meta.env.VITE_API_HOSTNAME;

const getCookieValue = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const cookieString = document.cookie || '';
  if (!cookieString) return null;

  const parts = cookieString.split('; ');
  for (const part of parts) {
    const eqIndex = part.indexOf('=');
    if (eqIndex === -1) continue;
    const key = part.slice(0, eqIndex);
    if (key !== name) continue;
    return decodeURIComponent(part.slice(eqIndex + 1));
  }
  return null;
};

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor if needed
api.interceptors.request.use((config) => {
  const token = getCookieValue('jwt');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const socialApi = {
  publish: async (payload: unknown) => {
    try {
      const response = await api.post('/social/publish', payload);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data ?? error.message;
      }
      if (error instanceof Error) throw error.message;
      throw error;
    }
  },

  getHistory: async () => {
    try {
      const response = await api.get('/social/history');
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data ?? error.message;
      }
      if (error instanceof Error) throw error.message;
      throw error;
    }
  },

  // Social Profiles CRUD
  createProfile: async (title: string) => {
    try {
      const response = await api.post('/social/profiles', { title });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data ?? error.message;
      }
      if (error instanceof Error) throw error.message;
      throw error;
    }
  },

  getProfiles: async () => {
    try {
      const response = await api.get('/social/profiles');
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data ?? error.message;
      }
      if (error instanceof Error) throw error.message;
      throw error;
    }
  },

  updateProfile: async (id: string, title: string) => {
    try {
      const response = await api.put(`/social/profiles/${id}`, { title });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data ?? error.message;
      }
      if (error instanceof Error) throw error.message;
      throw error;
    }
  },

  deleteProfile: async (id: string) => {
    try {
      const response = await api.delete(`/social/profiles/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data ?? error.message;
      }
      if (error instanceof Error) throw error.message;
      throw error;
    }
  },

  generateJWT: async (id: string) => {
    try {
      const response = await api.post(`/social/profiles/${id}/add-media-platform`);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data ?? error.message;
      }
      if (error instanceof Error) throw error.message;
      throw error;
    }
  },
};
