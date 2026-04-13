// Role permissions shape (matches backend OrgRole.permissions and RolePermissionMatrix)
export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';
export type PermissionMap = Record<string, Record<PermissionAction, boolean>>;

// User interface matching the backend simplified user model
export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  userId: string;
  isBillingAdmin: string;
  photo: string;
  role: string;
  features: string[];
  /** Org-role permissions (module -> action -> boolean). null = superadmin full access. */
  permissions?: PermissionMap | null;
  /** @deprecated use permissions (PermissionMap) from getMe */
  permissionsList?: string[];
  timezoneRegion?: string;
  sports: string[];
  streamProcessLimit: number;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  active: boolean;
  lastLogin: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Auth state interface
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// API response interfaces
export interface AuthResponse {
  status: boolean;
  message: string;
  token?: string;
  data?: {
    user: User;
  };
}

export interface ApiError {
  message: string;
  status?: string;
  errors?: any[];
}
