import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getStreams as getStreamsAPI, getStreamById as getStreamByIdAPI } from '../../api/streams';
import { ApiError } from '../types';

// Stream interface based on backend projection
export interface Stream {
  _id: string;
  streamId: string;
  title: string;
  category: string;
  status: number;
  url: string;
  hlsS3URL: string;
  thumb_url: string;
  defaultThumbnailUrl: string;
  createdAt: string;
  createdDate: string;
  userId: string;
  // New optional associations for teams and tournament
  team1Id?: string;
  team2Id?: string;
  tournamentId?: string;
  matchId?: string;
  duration?: number;
  inputVideoDuration?: number;
  size?: number;
  aspectRatio: string;
  isLive: boolean;
  vod: boolean;
  clipsCount: number;
  highlightsCount: number;
  processCompleteProgress: number;
  processingStorage: number;
  videoType: string;
  competitionType: string;
  gameDate: string;
  onAirDate: string;
  fireOn: string;
  tags: string;
  limitation?: any;
  streamAccess: string;
  entityId: string;
  referenceStream: string;
  previousRecordingURLs: string[];
  isMediaLive: boolean;
  mediaLiveConfig?: any;
  updatedAt: string;
  analysis_server?: string;
}

// Pagination interface
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Filters interface
export interface StreamFilters {
  userId?: string;
  status?: number;
  category?: string | string[];
  searchText?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  // Filter by competition ID associated with stream (tournamentId)
  tournamentId?: string;
}

// Streams state interface
export interface StreamsState {
  streams: Stream[];
  currentStream: Stream | null;
  pagination: Pagination | null;
  filters: StreamFilters;
  isLoading: boolean;
  currentStreamLoading: boolean;
  error: string | null;
  currentStreamError: string | null;
  lastFetch: number | null;
  cache: {
    [key: string]: {
      streams: Stream[];
      pagination: Pagination;
      timestamp: number;
    };
  };
}

// Initial state
const initialState: StreamsState = {
  streams: [],
  currentStream: null,
  pagination: null,
  filters: {
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
  isLoading: false,
  currentStreamLoading: false,
  error: null,
  currentStreamError: null,
  lastFetch: null,
  cache: {},
};

// Helper function to generate cache key
const generateCacheKey = (filters: StreamFilters, page: number, limit: number): string => {
  return JSON.stringify({ ...filters, page, limit });
};

// Async thunk for fetching streams
export const fetchStreams = createAsyncThunk<
  {
    streams: Stream[];
    pagination: Pagination;
    filters: StreamFilters;
  },
  {
    filters?: Partial<StreamFilters>;
    page?: number;
    limit?: number;
    useCache?: boolean;
  },
  { rejectValue: ApiError }
>(
  'streams/fetchStreams',
  async (params = {}, { rejectWithValue, getState }) => {
    try {
      const { filters = {}, page = 1, limit = 10, useCache = true } = params;
      const state = getState() as { streams: StreamsState };
      
      // Merge with current filters
      const finalFilters = { ...state.streams.filters, ...filters };
      
      // Generate cache key
      const cacheKey = generateCacheKey(finalFilters, page, limit);
      
      // Check cache if enabled (cache for 5 minutes)
      if (useCache && state.streams.cache[cacheKey]) {
        const cached = state.streams.cache[cacheKey];
        const isExpired = Date.now() - cached.timestamp > 5 * 60 * 1000; // 5 minutes
        
        if (!isExpired) {
          return {
            streams: cached.streams,
            pagination: cached.pagination,
            filters: finalFilters,
          };
        }
      }
      
      // Prepare API parameters
      const apiParams = {
        ...finalFilters,
        page,
        limit,
      };
      
      const response = await getStreamsAPI(apiParams);
      
      if (response.status !== 'success') {
        throw new Error(response.message || 'Failed to fetch streams');
      }
      
      return {
        streams: response.data.streams,
        pagination: response.data.pagination,
        filters: finalFilters,
      };
    } catch (error: any) {
      return rejectWithValue({
        message: error.message || 'Failed to fetch streams',
        status: 'error',
      });
    }
  }
);

// Fetch single stream by ID
export const fetchStreamById = createAsyncThunk<
  Stream,
  string,
  { rejectValue: ApiError }
>(
  'streams/fetchStreamById',
  async (streamId: string, { rejectWithValue }) => {
    try {
      const response = await getStreamByIdAPI(streamId);
      return response.data.stream;
    } catch (error: any) {
      return rejectWithValue({
        message: error.message || 'Failed to fetch stream',
        status: 'error',
      });
    }
  }
);

// Streams slice
const streamsSlice = createSlice({
  name: 'streams',
  initialState,
  reducers: {
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    
    clearCurrentStreamError: (state) => {
      state.currentStreamError = null;
    },
    
    // Update filters without fetching - replaces all filters
    updateFilters: (state, action: PayloadAction<Partial<StreamFilters>>) => {
      // Reset to base filters and apply new ones
      state.filters = {
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ...action.payload,
      };
    },
    
    // Reset filters to initial state
    resetFilters: (state) => {
      state.filters = {
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
    },
    
    // Clear streams data
    clearStreams: (state) => {
      state.streams = [];
      state.pagination = null;
      state.lastFetch = null;
    },
    
    // Clear cache
    clearCache: (state) => {
      state.cache = {};
    },
    
    // Update a specific stream (useful after creating/updating)
    updateStream: (state, action: PayloadAction<Stream>) => {
      const index = state.streams.findIndex(stream => stream._id === action.payload._id);
      if (index !== -1) {
        state.streams[index] = action.payload;
      }
    },
    
    // Add a new stream to the beginning of the list
    addStream: (state, action: PayloadAction<Stream>) => {
      state.streams.unshift(action.payload);
      if (state.pagination) {
        state.pagination.total += 1;
      }
    },
    
    // Remove a stream
    removeStream: (state, action: PayloadAction<string>) => {
      state.streams = state.streams.filter(stream => stream._id !== action.payload);
      if (state.pagination) {
        state.pagination.total -= 1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch streams
      .addCase(fetchStreams.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStreams.fulfilled, (state, action) => {
        state.isLoading = false;
        state.streams = action.payload.streams;
        state.pagination = action.payload.pagination;
        state.filters = action.payload.filters;
        state.lastFetch = Date.now();
        state.error = null;
        
        // Update cache
        const cacheKey = generateCacheKey(
          action.payload.filters,
          action.payload.pagination.page,
          action.payload.pagination.limit
        );
        state.cache[cacheKey] = {
          streams: action.payload.streams,
          pagination: action.payload.pagination,
          timestamp: Date.now(),
        };
      })
      .addCase(fetchStreams.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to fetch streams';
      })
      // Fetch stream by ID
      .addCase(fetchStreamById.pending, (state) => {
        state.currentStreamLoading = true;
        state.currentStreamError = null;
      })
      .addCase(fetchStreamById.fulfilled, (state, action) => {
        state.currentStreamLoading = false;
        state.currentStream = action.payload;
        state.currentStreamError = null;
      })
      .addCase(fetchStreamById.rejected, (state, action) => {
        state.currentStreamLoading = false;
        state.currentStreamError = action.payload?.message || 'Failed to fetch stream';
      });
  },
});

export const {
  clearError,
  clearCurrentStreamError,
  updateFilters,
  resetFilters,
  clearStreams,
  clearCache,
  updateStream,
  addStream,
  removeStream,
} = streamsSlice.actions;

export default streamsSlice.reducer;
