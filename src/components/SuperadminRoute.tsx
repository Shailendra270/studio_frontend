import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../store';

/**
 * Protects organization routes: only users with role "superadmin" can access.
 * Must be used inside ProtectedRoute (authenticated users only).
 */
const SuperadminRoute: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);

  if (user?.role !== 'superadmin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default SuperadminRoute;
