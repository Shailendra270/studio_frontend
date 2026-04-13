import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getRequiredPermission, SUPERADMIN_ONLY_PATHS } from '../constants/permissionRoutes';
import { usePermissions } from '../hooks/usePermissions';

/**
 * Wraps protected content and redirects to /dashboard if the current route
 * requires a permission the user does not have. Use inside ProtectedRoute.
 */
const PermissionRoute: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname || '/';
  const { can } = usePermissions();

  const required = getRequiredPermission(pathname);
  const isSuperadminOnlyPath = SUPERADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p));

  if (isSuperadminOnlyPath) {
    // Orgs etc. are handled by SuperadminRoute; we shouldn't land here for those
    return <Outlet />;
  }

  if (required) {
    const allowed = can(required.module, required.action);
    if (!allowed) {
      return <Navigate to="/dashboard" replace state={{ from: pathname }} />;
    }
  }

  return <Outlet />;
};

export default PermissionRoute;
