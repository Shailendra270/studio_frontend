import { apiPost, apiUrl } from '../utils/apiClient.js';

export interface TeamImage {
  _id?: string;
  type?: 'team_logo' | 'full_image';
  url?: string;
  name?: string;
}

export interface CountryData {
  _id: string;
  name: string;
  abbreviation?: string;
  flagUrl?: string;
}

export interface TeamData {
  _id: string;
  name: string;
  playerIds: string[];
  players?: { _id: string; name: string }[];
  category: string;
  teamImages?: TeamImage[];
  country?: CountryData | null;
  createdAt?: string;
  updatedAt?: string;
  // Short id and owner (new fields)
  id?: string;
  userId?: string;
}

export interface CreateTeamRequest {
  name: string;
  playerIds: string[];
  players?: { _id: string; name: string }[];
  category: string;
  teamImages?: TeamImage[];
  country?: string | '';
  userId: string;
}

export interface UpdateTeamRequest {
  _id: string;
  name?: string;
  playerIds: string[];
  players?: { _id: string; name: string }[];
  category: string;
  teamImages?: TeamImage[];
  country?: string | '';
  userId: string;
}

export interface DeleteTeamRequest {
  _id: string;
}

export interface GetTeamsRequest {
  category: string;
  search?: string;
  limit?: number;
  pageNo?: number;
  teams?: string[];
  userId: string;
}

export const createTeam = async (data: CreateTeamRequest): Promise<{ success: boolean; message: string; data?: TeamData }> => {
  const res = await apiPost(`${apiUrl}/team/create`, data);
  return res.json();
};

export const updateTeam = async (data: UpdateTeamRequest): Promise<{ success: boolean; message: string; data?: TeamData }> => {
  const res = await apiPost(`${apiUrl}/team/update`, data);
  return res.json();
};

export const deleteTeam = async (data: DeleteTeamRequest): Promise<{ success: boolean; message: string; data?: any }> => {
  const res = await apiPost(`${apiUrl}/team/delete`, data);
  return res.json();
};

export const getTeams = async (data: GetTeamsRequest): Promise<{ success: boolean; message: string; teams: TeamData[]; totalCount: number }> => {
  const res = await apiPost(`${apiUrl}/teams`, data);
  return res.json();
};

export const getAllEditTeams = async (data: { category: string; search?: string; userId: string }): Promise<{ success: boolean; message: string; teams: TeamData[] }> => {
  const res = await apiPost(`${apiUrl}/teams/all`, data);
  return res.json();
};
