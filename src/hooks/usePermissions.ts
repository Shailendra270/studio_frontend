import { useMemo } from 'react';
import { useAppSelector } from '../store';
import { selectUser, selectPermissions } from '../store/slices/authSlice';
import type { PermissionMap } from '../store/types';

type Action = 'view' | 'create' | 'edit' | 'delete';

function can(permissions: PermissionMap | null | undefined, role: string | undefined, module: string, action: Action): boolean {
  if (role === 'superadmin') return true;
  if (!permissions || typeof permissions !== 'object') return false;
  const modulePerms = permissions[module];
  if (!modulePerms || typeof modulePerms !== 'object') return false;
  return modulePerms[action] === true;
}

export function usePermissions() {
  const user = useAppSelector(selectUser);
  const permissions = useAppSelector(selectPermissions);
  const role = user?.role;

  return useMemo(
    () => ({
      permissions: permissions ?? null,
      can: (module: string, action: Action) => can(permissions, role, module, action),
      canView: (module: string) => can(permissions, role, module, 'view'),
      canCreate: (module: string) => can(permissions, role, module, 'create'),
      canEdit: (module: string) => can(permissions, role, module, 'edit'),
      canDelete: (module: string) => can(permissions, role, module, 'delete'),
    }),
    [permissions, role]
  );
}
