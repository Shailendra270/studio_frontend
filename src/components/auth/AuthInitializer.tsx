import React, { useEffect } from 'react';
import { useAppDispatch } from '../../store';
import { getCurrentUser } from '../../store/slices/authSlice';

interface AuthInitializerProps {
  children: React.ReactNode;
}

const AuthInitializer: React.FC<AuthInitializerProps> = ({ children }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Check if user is logged in on app startup,
    // but avoid hitting /me while on public auth routes
    const publicPaths = ['/login', '/signup', '/login-sso', '/terms-of-service', '/privacy-policy'];
    const currentPath = window.location.pathname;
    if (publicPaths.includes(currentPath)) {
      return;
    }

    const userId = localStorage.getItem('userId');
    if (userId) {
      dispatch(getCurrentUser());
    }
  }, [dispatch]);

  return <>{children}</>;
};

export default AuthInitializer;
