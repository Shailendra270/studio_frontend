import { apiPost, apiGet, apiUrl } from "../utils/apiClient.js";

export interface SendEmailPayload {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{ fileName: string; mimeType: string; size?: number; storageUrl?: string; contentBase64?: string }>;
  clip?: { clipId?: string; clipType?: string; duration?: number; referenceUrl?: string; aspectRatio?: string; streamId?: string };
  userId?: string;
}

export const sendEmail = async (payload: SendEmailPayload) => {
  const res = await apiPost(`${apiUrl}/email/send`, payload);
  return res.json();
};

export const getEmailHistory = async (params: { page?: number; limit?: number; status?: string; userId?: string }) => {
  const url = new URL(`${apiUrl}/email/history`);
  if (params?.page) url.searchParams.set("page", String(params.page));
  if (params?.limit) url.searchParams.set("limit", String(params.limit));
  if (params?.status) url.searchParams.set("status", String(params.status));
  if (params?.userId) url.searchParams.set("userId", String(params.userId));
  const res = await apiGet(url.toString());
  return res.json();
};
