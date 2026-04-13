import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ApiError } from '../types';
import { createCompetition as createCompetitionAPI, deleteCompetition as deleteCompetitionAPI, getCompetitions as getCompetitionsAPI, updateCompetition as updateCompetitionAPI, CompetitionData, CreateCompetitionRequest, UpdateCompetitionRequest } from '../../api/competitionsApi';

export interface CompetitionsState {
  competitions: CompetitionData[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  lastFetchByCategory: { [category: string]: number };
}

const initialState: CompetitionsState = {
  competitions: [],
  totalCount: 0,
  isLoading: false,
  error: null,
  lastFetchByCategory: {},
};

export const fetchCompetitions = createAsyncThunk<
  { competitions: CompetitionData[]; totalCount: number; category: string, search?: string },
  { category?: string; search?: string; pageNo?: number; limit?: number; userId: string },
  { rejectValue: ApiError }
>(
  'competitions/fetchCompetitions',
  async (params, { rejectWithValue }) => {
    try {
      const response = await getCompetitionsAPI({
        category: params.category || '',
        search: params.search || '',
        pageNo: params.pageNo || 1,
        limit: params.limit || 10,
        userId: params.userId,
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch competitions');
      }
      return { competitions: response.competitions, totalCount: response.totalCount, category: params.category || 'all', search: params.search || '' };
    } catch (error: any) {
      return rejectWithValue({ message: error.message || 'Failed to fetch competitions' });
    }
  }
);

export const createCompetition = createAsyncThunk<
  { success: boolean; message: string; competition?: CompetitionData },
  CreateCompetitionRequest,
  { rejectValue: ApiError }
>(
  'competitions/createCompetition',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await createCompetitionAPI(payload);
      if (!res.success) {
        throw new Error(res.message || 'Failed to create competition');
      }
      return { success: true, message: res.message, competition: res.data };
    } catch (error: any) {
      return rejectWithValue({ message: error.message || 'Failed to create competition' });
    }
  }
);

export const updateCompetition = createAsyncThunk<
  { success: boolean; message: string; competition?: CompetitionData },
  UpdateCompetitionRequest,
  { rejectValue: ApiError }
>(
  'competitions/updateCompetition',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await updateCompetitionAPI(payload);
      if (!res.success) {
        throw new Error(res.message || 'Failed to update competition');
      }
      return { success: true, message: res.message, competition: res.data };
    } catch (error: any) {
      return rejectWithValue({ message: error.message || 'Failed to update competition' });
    }
  }
);

export const deleteCompetition = createAsyncThunk<
  { success: boolean; message: string; _id: string },
  { _id: string },
  { rejectValue: ApiError }
>(
  'competitions/deleteCompetition',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await deleteCompetitionAPI(payload);
      if (!res.success) {
        throw new Error(res.message || 'Failed to delete competition');
      }
      return { success: true, message: res.message, _id: payload._id };
    } catch (error: any) {
      return rejectWithValue({ message: error.message || 'Failed to delete competition' });
    }
  }
);

const competitionsSlice = createSlice({
  name: 'competitions',
  initialState,
  reducers: {
    clearCompetitionsError: (state) => {
      state.error = null;
    },
    clearCompetitions: (state) => {
      state.competitions = [];
      state.totalCount = 0;
      state.lastFetchByCategory = {};
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompetitions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCompetitions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.competitions = action.payload.competitions;
        state.totalCount = action.payload.totalCount;
        state.lastFetchByCategory[action.payload.category] = Date.now();
      })
      .addCase(fetchCompetitions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to fetch competitions';
      })
      .addCase(createCompetition.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCompetition.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.competition) {
          state.competitions.unshift(action.payload.competition);
          state.totalCount += 1;
        }
      })
      .addCase(createCompetition.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to create competition';
      })
      .addCase(updateCompetition.fulfilled, (state, action) => {
        const updated = action.payload.competition;
        if (updated) {
          const idx = state.competitions.findIndex(c => c._id === updated._id);
          if (idx !== -1) state.competitions[idx] = updated;
        }
      })
      .addCase(deleteCompetition.fulfilled, (state, action) => {
        state.competitions = state.competitions.filter(c => c._id !== action.payload._id);
        state.totalCount = Math.max(0, state.totalCount - 1);
      });
  }
});

export const { clearCompetitionsError, clearCompetitions } = competitionsSlice.actions;

export const selectCompetitions = (state: any) => state.competitions.competitions;
export const selectCompetitionsLoading = (state: any) => state.competitions.isLoading;
export const selectCompetitionsError = (state: any) => state.competitions.error;
export const selectCompetitionsTotalCount = (state: any) => state.competitions.totalCount;

export type CompetitionDataType = CompetitionData;

export default competitionsSlice.reducer;