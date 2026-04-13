import { apiPost, apiUrl } from "../utils/apiClient.js";

export interface GeneratePayload {
  transcript: string;
  teams: string;
  events: string[];
  Competition: string;
  sport: string;
  language?: string;
}

export const generateSocialDescription = async (payload: GeneratePayload) => {
  const res = await apiPost(`${apiUrl}/social/generate`, payload);
  return res.json();
};
