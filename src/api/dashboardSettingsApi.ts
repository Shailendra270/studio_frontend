/**
 * Dashboard settings API – org-scoped (e.g. visible filter IDs).
 * Uses same base URL as media library.
 */
const videoapiUrl = import.meta.env.VITE_VIDEO_API_URL;

export interface DashboardSettingsResponse {
  status: string;
  data: { visibleFilters: string[] };
}

export async function getDashboardSettings(): Promise<DashboardSettingsResponse> {
  const res = await fetch(`${videoapiUrl}/api/dashboard/settings`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Dashboard settings failed: ${res.status}`);
  return res.json();
}

export async function updateDashboardSettings(visibleFilters: string[]): Promise<DashboardSettingsResponse> {
  const res = await fetch(`${videoapiUrl}/api/dashboard/settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ visibleFilters }),
  });
  if (!res.ok) throw new Error(`Update dashboard settings failed: ${res.status}`);
  return res.json();
}
