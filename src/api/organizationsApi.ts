import { apiGet, apiPost, apiPatch, apiDelete, apiUrl } from '../utils/apiClient.js';

// Derive API base: VITE_API_HOSTNAME is typically .../api/auth, so base is .../api
const apiBase = (import.meta.env.VITE_API_HOSTNAME || apiUrl || '').replace(/\/auth\/?$/, '');
const orgBase = apiBase ? `${apiBase}/organizations` : '/api/organizations';

// ─── Types (aligned with backend and UI) ─────────────────────────────────────

export interface Organization {
  id: string;
  _id?: string;
  name: string;
  contactEmail: string;
  contactPhone: string;
  status: 'Active' | 'Suspended' | 'Deleted';
  logoUrl?: string | null;
  usersCount: number;
  streamsCount: number;
  highlightsCount: number;
  createdAt: string;
  isDeleted?: boolean;
  deletedAt?: string | null;
}

export interface OrgMember {
  id: string;
  memberId: string;
  user: { id: string; name: string; email: string; avatar?: string; lastLogin?: string } | null;
  role: string | null;
  roleId?: string;
  status: 'Active' | 'Inactive';
  lastLogin?: string;
}

export interface OrgRole {
  id: string;
  name: string;
  usersCount: number;
  isSystem: boolean;
  permissions: Record<string, Record<string, boolean>>;
}

export interface ListOrganizationsParams {
  page?: number;
  limit?: number;
  statusFilter?: 'softDeleted' | 'activeOrSuspended';
}

export interface CreateOrganizationPayload {
  name: string;
  contactEmail: string;
  contactPhone?: string;
  status?: 'Active' | 'Suspended';
  logoUrl?: string | null;
  createAdminAccount?: boolean;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export interface UpdateOrganizationPayload {
  name?: string;
  contactEmail?: string;
  contactPhone?: string;
  status?: 'Active' | 'Suspended';
  logoUrl?: string | null;
}

export interface AddMemberPayload {
  fullName: string;
  email: string;
  roleId: string;
  sendInvite?: boolean;
  password?: string;
  confirmPassword?: string;
}

export interface UpdateMemberPayload {
  roleId?: string;
  status?: 'Active' | 'Inactive';
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export interface CreateRolePayload {
  name: string;
  permissions: Record<string, Record<string, boolean>>;
}

export interface UpdateRolePayload {
  name?: string;
  permissions?: Record<string, Record<string, boolean>>;
}

// Normalize org from API (use _id as id if present)
function normalizeOrg(raw: any): Organization {
  const id = raw._id?.toString() || raw.id;
  const isDeleted = raw.isDeleted === true;
  const status: Organization['status'] = isDeleted ? 'Deleted' : raw.status;
  return {
    id,
    _id: raw._id,
    name: raw.name,
    contactEmail: raw.contactEmail,
    contactPhone: raw.contactPhone || '',
    status,
    logoUrl: raw.logoUrl ?? null,
    usersCount: raw.usersCount ?? 0,
    streamsCount: raw.streamsCount ?? 0,
    highlightsCount: raw.highlightsCount ?? 0,
    createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString().split('T')[0] : '',
    isDeleted,
    deletedAt: raw.deletedAt ? new Date(raw.deletedAt).toISOString() : null,
  };
}

function normalizeMember(raw: any): OrgMember {
  const id = raw.id?.toString() || raw._id?.toString();
  return {
    id,
    memberId: id,
    user: raw.user ? { id: raw.user._id || raw.user.id, name: raw.user.name, email: raw.user.email, avatar: raw.user.avatar, lastLogin: raw.user.lastLogin } : null,
    role: raw.role ?? null,
    roleId: raw.roleId?.toString(),
    status: raw.status === 'Active' ? 'Active' : 'Inactive',
    lastLogin: raw.lastLogin,
  };
}

function normalizeRole(raw: any): OrgRole {
  return {
    id: raw._id?.toString() || raw.id,
    name: raw.name,
    usersCount: raw.usersCount ?? 0,
    isSystem: !!raw.isSystem,
    permissions: raw.permissions || {},
  };
}

// ─── Organizations ───────────────────────────────────────────────────────────

export async function getOrganizations(params?: ListOrganizationsParams): Promise<{
  organizations: Organization[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.statusFilter) qs.set('statusFilter', params.statusFilter);
  const url = qs.toString() ? `${orgBase}?${qs.toString()}` : orgBase;
  const res = await apiGet(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch organizations');
  const list = (data.data?.organizations || []).map(normalizeOrg);
  return {
    organizations: list,
    pagination: data.pagination || { page: 1, limit: 20, total: list.length, pages: 1 },
  };
}

export async function getOrganization(orgId: string): Promise<Organization> {
  const res = await apiGet(`${orgBase}/${orgId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch organization');
  return normalizeOrg(data.data?.organization || data.data);
}

export interface OrgOverview {
  usersCount: number;
  streamsCount: number;
  highlightsCount: number;
  publishedCount: number;
  publishRate: number;
  activity: { date: string; label: string; count: number }[];
}

export async function getOrganizationOverview(orgId: string): Promise<OrgOverview> {
  const res = await apiGet(`${orgBase}/${orgId}/overview`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch overview');
  const raw = data.data?.overview || data.overview || data;
  return {
    usersCount: raw.usersCount ?? 0,
    streamsCount: raw.streamsCount ?? 0,
    highlightsCount: raw.highlightsCount ?? 0,
    publishedCount: raw.publishedCount ?? 0,
    publishRate: raw.publishRate ?? 0,
    activity: Array.isArray(raw.activity) ? raw.activity : [],
  };
}

export async function createOrganization(payload: CreateOrganizationPayload): Promise<Organization> {
  const res = await apiPost(orgBase, payload);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create organization');
  return normalizeOrg(data.data?.organization || data.data);
}

export async function updateOrganization(orgId: string, payload: UpdateOrganizationPayload): Promise<Organization> {
  const res = await apiPatch(`${orgBase}/${orgId}`, payload);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update organization');
  return normalizeOrg(data.data?.organization || data.data);
}

export async function deleteOrganization(orgId: string): Promise<void> {
  const res = await apiDelete(`${orgBase}/${orgId}`);
  if (res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to delete organization');
  }
}

export async function restoreOrganization(orgId: string): Promise<Organization> {
  const res = await apiPatch(`${orgBase}/${orgId}/restore`, {});
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to restore organization');
  return normalizeOrg(data.data?.organization || data.data);
}

/** Get presigned URL to upload org logo. Returns { presignedUrl, logoUrl }. */
export async function getOrgLogoUploadUrl(orgId: string, fileName: string, contentType: string): Promise<{ presignedUrl: string; logoUrl: string }> {
  const res = await apiPost(`${orgBase}/${orgId}/logo/upload-url`, { fileName, contentType });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to get upload URL');
  const d = data.data || data;
  return { presignedUrl: d.presignedUrl, logoUrl: d.logoUrl };
}

// ─── Members ─────────────────────────────────────────────────────────────────

export async function getMembers(orgId: string): Promise<OrgMember[]> {
  const res = await apiGet(`${orgBase}/${orgId}/members`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch members');
  return (data.data?.members || []).map(normalizeMember);
}

export async function addMember(orgId: string, payload: AddMemberPayload): Promise<OrgMember> {
  const res = await apiPost(`${orgBase}/${orgId}/members`, payload);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to add member');
  return normalizeMember(data.data?.member || data.data);
}

export async function updateMember(orgId: string, memberId: string, payload: UpdateMemberPayload): Promise<void> {
  const res = await apiPatch(`${orgBase}/${orgId}/members/${memberId}`, payload);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update member');
}

export async function removeMember(orgId: string, memberId: string): Promise<void> {
  const res = await apiDelete(`${orgBase}/${orgId}/members/${memberId}`);
  if (res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to remove member');
  }
}

// ─── Roles ───────────────────────────────────────────────────────────────────

export async function getRoles(orgId: string): Promise<OrgRole[]> {
  const res = await apiGet(`${orgBase}/${orgId}/roles`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch roles');
  return (data.data?.roles || []).map(normalizeRole);
}

export async function createRole(orgId: string, payload: CreateRolePayload): Promise<OrgRole> {
  const res = await apiPost(`${orgBase}/${orgId}/roles`, payload);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create role');
  return normalizeRole(data.data?.role || data.data);
}

export async function updateRole(orgId: string, roleId: string, payload: UpdateRolePayload): Promise<OrgRole> {
  const res = await apiPatch(`${orgBase}/${orgId}/roles/${roleId}`, payload);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update role');
  return normalizeRole(data.data?.role || data.data);
}

export async function deleteRole(orgId: string, roleId: string): Promise<void> {
  const res = await apiDelete(`${orgBase}/${orgId}/roles/${roleId}`);
  if (res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to delete role');
  }
}
