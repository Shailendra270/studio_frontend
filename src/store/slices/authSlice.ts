import { createSlice, createAsyncThunk, PayloadAction, Dispatch } from '@reduxjs/toolkit';
import { AuthState, User, AuthResponse, ApiError } from '../types';
import { loginUser as loginAPI, signupUser as signupAPI, checkAuth, logoutUser as logoutAPI } from '../../api/auth';
import { clearAssets } from './assetsSlice';
import { resetClips, resetUserClips } from './clipsSlice';
import { clearFolders, clearUserHighlights } from './foldersSlice';
import { clearStreams, clearCache } from './streamsSlice';
import { clearTags } from './tagsSlice';
import { clearTeams } from './teamsSlice';
import { clearCompetitions } from './competitionsSlice';

/** Map technical auth errors to messages users can understand */
function toUserFriendlyAuthMessage(message: string | undefined, fallback: string): string {
  if (!message) return fallback;
  const lower = message.toLowerCase();
  if (lower.includes('no token') || lower.includes('token provided') || lower.includes('token found') || lower.includes('access denied')) {
    return 'Your session has expired. Please sign in again to continue.';
  }
  if (lower.includes('expired') && lower.includes('sign in')) return message;
  return message;
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks for API calls
export const loginUser = createAsyncThunk<
  AuthResponse,
  { email: string; password: string },
  { rejectValue: ApiError }
>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await loginAPI(credentials);
      if (response.status) {
        // Get user data after successful login
        const userResponse = await checkAuth();
        if (userResponse.status) {
          return {
            ...response,
            data: { user: userResponse.data.user }
          };
        }
      }
      return response;
    } catch (error: any) {
      return rejectWithValue({
        message: toUserFriendlyAuthMessage((error as Error)?.message, 'Login failed'),
        status: 'error'
      });
    }
  }
);

export const signupUser = createAsyncThunk<
  AuthResponse,
  { name: string; email: string; password: string; agreeToTerms: boolean },
  { rejectValue: ApiError }
>(
  'auth/signup',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await signupAPI(userData);
      return response;
    } catch (error: any) {
      return rejectWithValue({
        message: error.message || 'Signup failed',
        status: 'error'
      });
    }
  }
);

export const getCurrentUser = createAsyncThunk<
  { user: User },
  void,
  { rejectValue: ApiError }
>(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await checkAuth();
      if (response.status) {
        return { user: response.data.user };
      }
      throw new Error(response.message || 'Failed to get user data');
    } catch (error: any) {
      return rejectWithValue({
        message: toUserFriendlyAuthMessage((error as Error)?.message, 'Your session has expired. Please sign in again to continue.'),
        status: 'error'
      });
    }
  }
);

export const logoutUser = createAsyncThunk<
  void,
  void,
  { rejectValue: ApiError }
>(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await logoutAPI();
      localStorage.removeItem('userId');
    } catch (error: any) {
      // Even if API call fails, we should clear local state
      localStorage.removeItem('userId');
      return rejectWithValue({
        message: error.message || 'Logout failed',
        status: 'error'
      });
    }
  }
);

// Thunk action to clear both auth and assets
// This should be used instead of clearAuth when you want to completely reset user state
// It will dispatch both clearAuth and clearAssets actions

// SessionStorage keys used by dashboard/media library - clear on logout so new user never sees old data
const DASHBOARD_SESSION_KEYS = ['dashboard_restore', 'media_library_state', 'navigating_away_from_dashboard', 'authError'] as const;

export const clearAllUserData = createAsyncThunk<
  void,
  void,
  { dispatch: Dispatch }
>(
  'auth/clearAllUserData',
  async (_, { dispatch }) => {
    // Clear dashboard & media library persisted state so new login doesn't show previous user's data
    DASHBOARD_SESSION_KEYS.forEach((key) => {
      try {
        sessionStorage.removeItem(key);
      } catch {
        // ignore
      }
    });

    // Clear all user-specific data from all slices
    dispatch(clearAssets());
    dispatch(resetClips());
    dispatch(resetUserClips());
    dispatch(clearFolders());
    dispatch(clearUserHighlights());
    dispatch(clearStreams());
    dispatch(clearCache());
    dispatch(clearTags());
    dispatch(clearTeams());
    dispatch(clearCompetitions());
    // Clear auth state last
    dispatch(clearAuth());

    return;
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('userId');
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        // Note: We'll dispatch clearAssets before loginUser in the component
        
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token || null;
        if (action.payload.data?.user) {
          state.user = action.payload.data.user;
          localStorage.setItem('userId', action.payload.data.user.userId);
        }
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload?.message || 'Login failed';
      });

    // Signup
    builder
      .addCase(signupUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Signup failed';
      });

    // Get current user
    builder
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload?.message || 'Failed to fetch user data';
      });

    // Logout
    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        // Even if logout API fails, clear the state
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = action.payload?.message || 'Logout failed';
      })
      // Handle clearAllUserData
      .addCase(clearAllUserData.fulfilled, (state) => {
        // State is already cleared by the clearAuth action dispatched inside clearAllUserData
      });
  },
});

export const { clearError, clearAuth, updateUser } = authSlice.actions;

// Selectors
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectPermissions = (state: { auth: AuthState }) => state.auth.user?.permissions ?? null;

export default authSlice.reducer;
