import { apiPost, apiUrl } from '../utils/apiClient.js';

export interface CompetitionData {
  _id: string;
  id: string; // shortid
  name: string;
  category: string; // sport
  teams?: { _id: string; teamId: string; name: string }[];
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCompetitionRequest {
  name: string;
  category: string;
  teams?: { _id: string; teamId: string; name: string }[];
  teamIds?: string[];
  userId: string;
}

export interface UpdateCompetitionRequest {
  _id: string;
  name?: string;
  category?: string;
  teams?: { _id: string; teamId: string; name: string }[];
  teamIds?: string[];
  userId: string;
}

export interface DeleteCompetitionRequest {
  _id: string;
}

export interface GetCompetitionsRequest {
  category?: string; // optional: fetch all when not provided
  search?: string;
  limit?: number;
  pageNo?: number;
  userId: string;
}

export const createCompetition = async (data: CreateCompetitionRequest): Promise<{ success: boolean; message: string; data?: CompetitionData }> => {
  const res = await apiPost(`${apiUrl}/competition/create`, data);
  return res.json();
};

export const updateCompetition = async (data: UpdateCompetitionRequest): Promise<{ success: boolean; message: string; data?: CompetitionData }> => {
  const res = await apiPost(`${apiUrl}/competition/update`, data);
  return res.json();
};

export const deleteCompetition = async (data: DeleteCompetitionRequest): Promise<{ success: boolean; message: string; data?: any }> => {
  const res = await apiPost(`${apiUrl}/competition/delete`, data);
  return res.json();
};

export const getCompetitions = async (data: GetCompetitionsRequest): Promise<{ success: boolean; message: string; competitions: CompetitionData[]; totalCount: number }> => {
  const res = await apiPost(`${apiUrl}/competitions`, data);
  return res.json();
};
