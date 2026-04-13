import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ApiError } from '../types';
import { createTeam as createTeamAPI, deleteTeam as deleteTeamAPI, getTeams as getTeamsAPI, updateTeam as updateTeamAPI, TeamData, CreateTeamRequest, UpdateTeamRequest } from '../../api/teamsApi';

export interface TeamsState {
  teams: TeamData[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  lastFetchByCategory: { [category: string]: number };
}

const initialState: TeamsState = {
  teams: [],
  totalCount: 0,
  isLoading: false,
  error: null,
  lastFetchByCategory: {},
};

export const fetchTeams = createAsyncThunk<
  { teams: TeamData[]; totalCount: number; category: string },
  { category: string; search?: string; pageNo?: number; limit?: number; userId: string },
  { rejectValue: ApiError }
>(
  'teams/fetchTeams',
  async (params, { rejectWithValue }) => {
    try {
      const response = await getTeamsAPI({
        category: params.category,
        search: params.search || '',
        pageNo: params.pageNo || 1,
        limit: params.limit || 10,
        userId: params.userId,
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch teams');
      }
      return { teams: response.teams, totalCount: response.totalCount, category: params.category };
    } catch (error: any) {
      return rejectWithValue({ message: error.message || 'Failed to fetch teams' });
    }
  }
);

export const createTeam = createAsyncThunk<
  { success: boolean; message: string; team?: TeamData },
  CreateTeamRequest,
  { rejectValue: ApiError }
>(
  'teams/createTeam',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await createTeamAPI(payload);
      if (!res.success) {
        throw new Error(res.message || 'Failed to create team');
      }
      return { success: true, message: res.message, team: res.data };
    } catch (error: any) {
      return rejectWithValue({ message: error.message || 'Failed to create team' });
    }
  }
);

export const updateTeam = createAsyncThunk<
  { success: boolean; message: string; team?: TeamData },
  UpdateTeamRequest,
  { rejectValue: ApiError }
>(
  'teams/updateTeam',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await updateTeamAPI(payload);
      if (!res.success) {
        throw new Error(res.message || 'Failed to update team');
      }
      return { success: true, message: res.message, team: res.data };
    } catch (error: any) {
      return rejectWithValue({ message: error.message || 'Failed to update team' });
    }
  }
);

export const deleteTeam = createAsyncThunk<
  { success: boolean; message: string; _id: string },
  { _id: string },
  { rejectValue: ApiError }
>(
  'teams/deleteTeam',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await deleteTeamAPI(payload);
      if (!res.success) {
        throw new Error(res.message || 'Failed to delete team');
      }
      return { success: true, message: res.message, _id: payload._id };
    } catch (error: any) {
      return rejectWithValue({ message: error.message || 'Failed to delete team' });
    }
  }
);

const teamsSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {
    clearTeamsError: (state) => {
      state.error = null;
    },
    clearTeams: (state) => {
      state.teams = [];
      state.totalCount = 0;
      state.lastFetchByCategory = {};
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeams.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTeams.fulfilled, (state, action) => {
        state.isLoading = false;
        state.teams = action.payload.teams;
        state.totalCount = action.payload.totalCount;
        state.lastFetchByCategory[action.payload.category] = Date.now();
      })
      .addCase(fetchTeams.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to fetch teams';
      })
      .addCase(createTeam.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTeam.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.team) {
          state.teams.unshift(action.payload.team);
          state.totalCount += 1;
        }
      })
      .addCase(createTeam.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to create team';
      })
      .addCase(updateTeam.fulfilled, (state, action) => {
        const updated = action.payload.team;
        if (updated) {
          const idx = state.teams.findIndex(t => t._id === updated._id);
          if (idx !== -1) state.teams[idx] = updated;
        }
      })
      .addCase(deleteTeam.fulfilled, (state, action) => {
        state.teams = state.teams.filter(t => t._id !== action.payload._id);
        state.totalCount = Math.max(0, state.totalCount - 1);
      });
  }
});

export const { clearTeamsError, clearTeams } = teamsSlice.actions;

export const selectTeams = (state: any) => state.teams.teams;
export const selectTeamsLoading = (state: any) => state.teams.isLoading;
export const selectTeamsError = (state: any) => state.teams.error;
export const selectTeamsTotalCount = (state: any) => state.teams.totalCount;

export type TeamDataType = TeamData;

export default teamsSlice.reducer;