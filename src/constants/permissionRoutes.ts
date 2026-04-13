/**
 * Maps route path patterns to required permission (module + action).
 * Used by PermissionRoute to guard access. Module names match backend RolePermissionMatrix.
 */
export const ROUTE_PERMISSIONS: { pattern: RegExp | string; module: string; action?: 'view' | 'create' | 'edit' | 'delete' }[] = [
  { pattern: '/', module: 'Dashboard', action: 'view' },
  { pattern: '/dashboard', module: 'Dashboard', action: 'view' },
  { pattern: /^\/clips\/[^/]+$/, module: 'Streams / Live', action: 'view' },
  { pattern: /^\/live-video\/[^/]+$/, module: 'Streams / Live', action: 'view' },
  { pattern: '/clip-editor', module: 'Clips', action: 'view' },
  { pattern: /^\/auto-flip\/[^/]+$/, module: 'Clips', action: 'view' },
  { pattern: '/my-highlights', module: 'Highlights', action: 'view' },
  { pattern: /^\/editor-page\/[^/]+$/, module: 'Highlights', action: 'view' },
  { pattern: '/create-highlight', module: 'Highlights', action: 'create' },
  { pattern: '/publish-history', module: 'Published', action: 'view' },
  { pattern: /^\/publish\/[^/]+$/, module: 'Published', action: 'view' },
  { pattern: '/assets', module: 'Assets', action: 'view' },
  { pattern: '/settings', module: 'Settings', action: 'view' },
];

/** Paths that require superadmin only (no module permission). */
export const SUPERADMIN_ONLY_PATHS = ['/organizations', '/monitoring'];

export function getRequiredPermission(pathname: string): { module: string; action: 'view' | 'create' | 'edit' | 'delete' } | null {
  if (SUPERADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p))) return null;
  for (const { pattern, module, action } of ROUTE_PERMISSIONS) {
    const matches =
    typeof pattern === 'string'
      ? pathname === pattern || (pattern !== '/' && pathname.startsWith(pattern + '/'))
      : pattern.test(pathname);
    if (matches) return { module, action: action ?? 'view' };
  }
  return null;
}
