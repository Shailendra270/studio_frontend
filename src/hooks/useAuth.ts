import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { getCurrentUser, clearAuth } from '../store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, token, isAuthenticated, isLoading, error } = useAppSelector(
    (state) => state.auth
  );

  // Check authentication status on mount
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId && !user && !isLoading) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, user, isLoading]);

  const logout = () => {
    dispatch(clearAuth());
  };

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    logout,
  };
};

export default useAuth;
