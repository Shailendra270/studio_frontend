// // Mock API functions - replace with actual API calls
// export const loginUser = async (credentials: { email: string; password: string }) => {
//   // Simulate API call
//   await new Promise(resolve => setTimeout(resolve, 1000));
  
//   // Mock successful login
//   return {
//     status: true,
//     message: 'Login successful',
//     userId: 'user-123',
//     token: 'mock-jwt-token'
//   };
// };

// export const signupUser = async (userData: { 
//   name: string; 
//   email: string; 
//   password: string; 
//   agreeToTerms: boolean 
// }) => {
//   // Simulate API call
//   await new Promise(resolve => setTimeout(resolve, 1000));
  
//   // Mock successful signup
//   return {
//     status: true,
//     message: 'Account created successfully',
//     userId: 'user-123',
//     token: 'mock-jwt-token'
//   };
// };

// export const checkAuth = async () => {
//   // Simulate API call
//   await new Promise(resolve => setTimeout(resolve, 500));
  
//   // Mock user data
//   return {
//     user: {
//       userId: 'user-123',
//       email: 'user@example.com',
//       name: 'John Doe'
//     }
//   };
// };

import apiClient, { apiPost, apiGet, apiUrl, videoapiUrl } from '../utils/apiClient.js';

export const signupUser = async (data) => {
  const response = await apiPost(`${apiUrl}/signup`, data);
  const result = await response.json();
  if (!response.ok || result.status === false) {
    // Backend uses message for human-readable reason
    throw new Error(result.message || 'Signup failed');
  }
  return result;
};

export const loginUser = async (data) => {
  const response = await apiPost(`${apiUrl}/login`, data);
  const result = await response.json();
  // For login we only treat truly successful auth as ok
  if (!response.ok || result.status === false) {
    throw new Error(result.message || 'Login failed');
  }
  return result;
};

export const logoutUser = async (data) => {
  const response = await apiClient(`${apiUrl}/logout`, {
    method: 'POST',
  });
  return await response.json();
};

export const checkAuth = async () => {
    const res = await apiGet(`${apiUrl}/me`);
    const data = await res.json();

    // Transform to match expected format
    if (data.status === true && data.data) {
      return {
        status: true,
        data: data.data
      };
    }

    return data;
};

export const uploadApi = async (data) => {
    const res = await fetch(`${videoapiUrl}/api/videos/upload`, {
      method: "POST",
      credentials: "include",
      body: data,
    });
    return res.json();
};

export const fetchVideos = async (userId) => {
    const res = await fetch(`${videoapiUrl}/api/videos?userId=${userId}`,{
      method: "GET",
      credentials: "include",
      headers: {
        'Content-Type': 'application/json',
      },
    });
     return res;
};

export const fetchVideoByShortId = async (shortId) => {
  const res = await apiGet(`${videoapiUrl}/api/videos/${shortId}`);
  if (!res.ok) {
    throw new Error('Video not found');
  }
  return res.json();
};

export const trimApi = async (data) => {
    const res = await apiPost(`${videoapiUrl}/api/videos/trim`, data);
    return res.json();
};

export const ssoLogin = async (provider, email) => {
  // Simulate SSO login
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    status: true,
    message: `Successfully signed in with ${provider}`,
    userId: 'user-123',
    token: 'mock-jwt-token'
  };
};
