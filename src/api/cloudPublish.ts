import { apiPost, apiUrl } from "../utils/apiClient.js";

export const publishToCloud = async (payload: { clipId: string; title: string; folderPath: string; include: string[]; userId?: string }) => {
  const res = await apiPost(`${apiUrl}/cloud/publish`, payload);
  return res.json();
};

