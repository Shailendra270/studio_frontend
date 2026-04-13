import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { getCurrentUser } from '../store/slices/authSlice';
import LoadingScreen from '../layouts/LoadingScreen';

const ProtectedRoute: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const userId = localStorage.getItem('userId');
      
      if (userId && !user && !isLoading) {
        try {
          await dispatch(getCurrentUser()).unwrap();
        } catch (error) {
          console.error('Failed to get user data:', error);
        }
      }
      
      setInitialLoad(false);
    };

    checkAuth();
  }, [dispatch, user, isLoading]);

  // Show loading screen during initial authentication check
  if (initialLoad || (isLoading && !user)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingScreen />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Render protected content
  return <Outlet />;
};

export default ProtectedRoute;
