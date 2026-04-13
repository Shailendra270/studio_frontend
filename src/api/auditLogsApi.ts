import { apiGet, apiUrl } from "../utils/apiClient";

const apiBase = (import.meta.env.VITE_API_HOSTNAME || apiUrl || "").replace(
  /\/auth\/?$/,
  "",
);
const auditBase = apiBase ? `${apiBase}/audit-logs` : "/api/audit-logs";

export interface AuditLogRecord {
  _id: string;
  action: string;
  entity: string;
  entityId?: string;
  actorId?: string;
  ip?: string;
  country?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  createdAt: string;
  metadata?: Record<string, unknown>;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  userAgent?: string;
  orgId?: string | { _id: string; name: string };
  requestId?: string;
}

export interface GetAuditLogsParams {
  page?: number;
  limit?: number;
  action?: string;
  entity?: string;
  actorId?: string;
  orgId?: string;
  ip?: string;
  country?: string;
  from?: string;
  to?: string;
}

export async function getAuditLogs(params?: GetAuditLogsParams): Promise<{
  logs: AuditLogRecord[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const qs = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      qs.set(key, String(value));
    }
  });
  const url = qs.toString() ? `${auditBase}?${qs.toString()}` : auditBase;
  const res = await apiGet(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch audit logs");
  return {
    logs: data.data?.logs || [],
    pagination: data.data?.pagination || {
      page: 1,
      limit: 25,
      total: 0,
      totalPages: 1,
    },
  };
}
