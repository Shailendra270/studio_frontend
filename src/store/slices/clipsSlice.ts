import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getClips, getClipById, getUserClips } from '../../api/clipApi';

export interface ClipData {
  _id: string;
  streamId: string;
  id: string;
  title: string;
  start_time: number;
  end_time: number;
  duration: number;
  status: number;
  clipStatus: 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  videoUrl: string;
  videoThumbnailUrl: string;
  thumbnailUrl: string;
  aspectRatio: string;
  tags: string[];
  rating: number;
  progress: number;
  userId: string;
  projectId: string;
  entityId: string;
  clipRating: number;
  createdAt: string;
  updatedAt: string;
  jobId?: string;
  errorMessage?: string;
  customData?: {
    language?: string;
    sportName?: string;
  };
  editedVideos?: {
    documentId: string;
    aspect_ratio: string;
    uid: string;
    event: string;
    id: string;
    clipType: string;
    folderId?: string;
    duration?: number;
    videoUrl?: string;
    thumbnails?: string[];
    thumbnailUrl?: string;
    status?: 'completed' | 'processing' | 'failed';
  }[];
}

export interface ClipsFilters {
  search: string;
  sortBy: 'latest' | 'oldest' | 'rating' | 'duration' | 'timeSequence';
  aspectRatio: string;
  tags: string[];
  rating: string[];
  duration: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  status: 'all' | 'processing' | 'completed' | 'failed' | 'cancelled';
}

export interface ClipsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ClipsState {
  clips: ClipData[];
  userClips: ClipData[];
  generatingClips: ClipData[];
  completedClips: ClipData[];
  currentClip: ClipData | null;
  currentStreamId: string;
  currentUserId: string;
  currentIntroBumper?: any | null;
  currentOutroBumper?: any | null;
  trimOverrideStart?: string | null;
  trimOverrideEnd?: string | null;
  trimStreamUrl?: string | null;
  filters: ClipsFilters;
  userFilters: ClipsFilters;
  pagination: ClipsPagination;
  userPagination: ClipsPagination;
  loading: boolean;
  userClipsLoading: boolean;
  clipLoading: boolean;
  error: string | null;
  userClipsError: string | null;
  lastFetch: number;
  userClipsLastFetch: number;
}

const initialState: ClipsState = {
  clips: [],
  userClips: [],
  generatingClips: [],
  completedClips: [],
  currentClip: null,
  currentStreamId: '',
  currentUserId: '',
  currentIntroBumper: null,
  currentOutroBumper: null,
  trimOverrideStart: null,
  trimOverrideEnd: null,
  trimStreamUrl: null,
  filters: {
    search: '',
    sortBy: '',
    aspectRatio: '',
    tags: [],
    rating: [],
    duration: '',
    dateRange: {
      startDate: '',
      endDate: ''
    },
    status: 'all'
  },
  userFilters: {
    search: '',
    sortBy: '',
    aspectRatio: '',
    tags: [],
    rating: [],
    duration: '',
    dateRange: {
      startDate: '',
      endDate: ''
    },
    status: 'all'
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  },
  userPagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  },
  loading: false,
  userClipsLoading: false,
  clipLoading: false,
  error: null,
  userClipsError: null,
  lastFetch: 0,
  userClipsLastFetch: 0
};

// Async thunks
export const fetchClips = createAsyncThunk(
  'clips/fetchClips',
  async (params: {
    streamId: string;
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    aspectRatio?: string;
    tags?: string[];
    rating?: string[];
    dateRange?: { startDate: string; endDate: string };
    status?: string;
  }) => {
    const response = await getClips(params);
    return response;
  }
);

export const refreshClips = createAsyncThunk(
  'clips/refreshClips',
  async (streamId: string, { getState }) => {
    const state = getState() as { clips: ClipsState };
    const { filters, pagination } = state.clips;
    
    const response = await getClips({
      streamId,
      page: pagination.page,
      limit: pagination.limit,
      search: filters.search,
      sortBy: filters.sortBy,
      aspectRatio: filters.aspectRatio,
      tags: filters.tags,
      rating: filters.rating,
      dateRange: filters.dateRange,
      status: filters.status
    });
    return response;
  }
);

export const fetchClipById = createAsyncThunk(
  'clips/fetchClipById',
  async (clipId: string) => {
    const response = await getClipById(clipId);
    return response.data;
  }
);

export const fetchUserClips = createAsyncThunk(
  'clips/fetchUserClips',
  async (params: {
    userId: string;
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    aspectRatio?: string;
    tags?: string[];
    rating?: string[];
    dateRange?: { startDate: string; endDate: string };
    status?: string;
    eventId?: string;
  }) => {
    const response = await getUserClips(params);
    return response;
  }
);

const clipsSlice = createSlice({
  name: 'clips',
  initialState,
  reducers: {
    setCurrentStreamId: (state, action: PayloadAction<string>) => {
      const nextId = action.payload;
      if (state.currentStreamId !== nextId) {
        state.currentStreamId = nextId;
        state.clips = [];
        state.generatingClips = [];
        state.completedClips = [];
        state.pagination = { ...initialState.pagination };
      } else {
        state.currentStreamId = nextId;
      }
    },

    setCurrentUserId: (state, action: PayloadAction<string>) => {
      state.currentUserId = action.payload;
      // Reset user clips when user changes
      state.userClips = [];
      state.userPagination = { ...initialState.userPagination };
    },
    
    setFilters: (state, action: PayloadAction<Partial<ClipsFilters>>) => {
      const next = { ...state.filters, ...action.payload };
      const changed = JSON.stringify(next) !== JSON.stringify(state.filters);
      if (changed) {
        state.filters = next;
        state.pagination.page = 1;
      }
    },

    setUserFilters: (state, action: PayloadAction<Partial<ClipsFilters>>) => {
      state.userFilters = { ...state.userFilters, ...action.payload };
      // Reset pagination when filters change
      state.userPagination.page = 1;
    },
    
    setPagination: (state, action: PayloadAction<Partial<ClipsPagination>>) => {
      const next = { ...state.pagination, ...action.payload };
      if (JSON.stringify(next) !== JSON.stringify(state.pagination)) {
        state.pagination = next;
      }
    },

    setUserPagination: (state, action: PayloadAction<Partial<ClipsPagination>>) => {
      const next = { ...state.userPagination, ...action.payload };
      if (JSON.stringify(next) !== JSON.stringify(state.userPagination)) {
        state.userPagination = next;
      }
    },
    
    updateClipProgress: (state, action: PayloadAction<{ clipId: string; progress: number; status?: string }>) => {
      const { clipId, progress, status } = action.payload;
      
      // Update in all arrays
      const updateClip = (clip: ClipData) => {
        if (clip.id === clipId || clip._id === clipId) {
          clip.progress = progress;
          if (status) {
            clip.clipStatus = status as ClipData['clipStatus'];
          }
        }
      };
      
      state.clips.forEach(updateClip);
      state.generatingClips.forEach(updateClip);
      state.completedClips.forEach(updateClip);
    },
    
    addGeneratingClip: (state, action: PayloadAction<ClipData>) => {
      const newClip = action.payload;
      state.generatingClips.unshift(newClip);
      state.clips.unshift(newClip);
    },
    
    moveClipToCompleted: (state, action: PayloadAction<string>) => {
      const clipId = action.payload;
      const clipIndex = state.generatingClips.findIndex(
        clip => clip.id === clipId || clip._id === clipId
      );
      
      if (clipIndex !== -1) {
        const [completedClip] = state.generatingClips.splice(clipIndex, 1);
        completedClip.clipStatus = 'COMPLETED';
        completedClip.progress = 100;
        state.completedClips.unshift(completedClip);
        
        // Update in main clips array
        const mainClipIndex = state.clips.findIndex(
          clip => clip.id === clipId || clip._id === clipId
        );
        if (mainClipIndex !== -1) {
          state.clips[mainClipIndex] = completedClip;
        }
      }
    },
    
    removeClip: (state, action: PayloadAction<string>) => {
      const clipId = action.payload;
      state.clips = state.clips.filter(clip => clip.id !== clipId && clip._id !== clipId);
      state.generatingClips = state.generatingClips.filter(clip => clip.id !== clipId && clip._id !== clipId);
      state.completedClips = state.completedClips.filter(clip => clip.id !== clipId && clip._id !== clipId);
    },

    upsertClip: (state, action: PayloadAction<ClipData>) => {
      const updated = action.payload;
      const clipId = updated._id || updated.id;

      const idx = state.clips.findIndex((c) => c._id === clipId || c.id === clipId);
      if (idx === -1) return;

      state.clips[idx] = { ...state.clips[idx], ...updated };
      state.generatingClips = state.clips.filter((clip) => clip.clipStatus === 'PROCESSING');
      state.completedClips = state.clips.filter((clip) => clip.clipStatus === 'COMPLETED');

      const userIdx = state.userClips.findIndex((c) => c._id === clipId || c.id === clipId);
      if (userIdx !== -1) {
        state.userClips[userIdx] = { ...state.userClips[userIdx], ...updated };
      }

      if (state.currentClip && (state.currentClip._id === clipId || state.currentClip.id === clipId)) {
        state.currentClip = { ...state.currentClip, ...updated };
      }
    },
    
    clearError: (state) => {
      state.error = null;
      state.userClipsError = null;
    },
    
    resetClips: (state) => {
      state.clips = [];
      state.generatingClips = [];
      state.completedClips = [];
      state.pagination = { ...initialState.pagination };
      state.error = null;
    },

    resetUserClips: (state) => {
      state.userClips = [];
      state.userPagination = { ...initialState.userPagination };
    },
    
    clearCurrentClip: (state) => {
      state.currentClip = null;
      state.clipLoading = false;
      state.error = null;
    },
    setIntroBumper: (state, action: PayloadAction<any | null>) => {
      state.currentIntroBumper = action.payload || null;
    },
    setOutroBumper: (state, action: PayloadAction<any | null>) => {
      state.currentOutroBumper = action.payload || null;
    },
    clearBumpers: (state) => {
      state.currentIntroBumper = null;
      state.currentOutroBumper = null;
    },
    setTrimOverrides: (state, action: PayloadAction<{ start?: string | null; end?: string | null; streamUrl?: string | null }>) => {
      const { start, end, streamUrl } = action.payload;
      if (typeof start !== 'undefined') state.trimOverrideStart = start;
      if (typeof end !== 'undefined') state.trimOverrideEnd = end;
      if (typeof streamUrl !== 'undefined') state.trimStreamUrl = streamUrl;
    },
    clearTrimOverrides: (state) => {
      state.trimOverrideStart = null;
      state.trimOverrideEnd = null;
      state.trimStreamUrl = null;
    }
  },
  
  extraReducers: (builder) => {
    builder
      // fetchClips
      .addCase(fetchClips.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClips.fulfilled, (state, action) => {
        state.loading = false;
        const { clips, pagination } = action.payload;
        
        if (state.pagination.page === 1) {
          // First page - replace all clips
          state.clips = clips;
        } else {
          // Subsequent pages - append clips
          state.clips = [...state.clips, ...clips];
        }
        
        // Separate clips by status
        state.generatingClips = clips.filter(
          clip => clip.clipStatus === 'PROCESSING'
        );
        state.completedClips = clips.filter(
          clip => clip.clipStatus === 'COMPLETED'
        );
        
        state.pagination = { ...state.pagination, ...pagination, page: state.pagination.page };
        state.lastFetch = Date.now();
      })
      .addCase(fetchClips.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch clips';
      })
      
      // refreshClips
      .addCase(refreshClips.pending, (state) => {
        state.loading = true;
      })
      .addCase(refreshClips.fulfilled, (state, action) => {
        state.loading = false;
        const { clips, pagination } = action.payload;
        
        state.clips = clips;
        state.generatingClips = clips.filter(
          clip => clip.clipStatus === 'PROCESSING'
        );
        state.completedClips = clips.filter(
          clip => clip.clipStatus === 'COMPLETED'
        );
        
        state.pagination = pagination;
        state.lastFetch = Date.now();
      })
      .addCase(refreshClips.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to refresh clips';
      })
      
      // fetchClipById
      .addCase(fetchClipById.pending, (state) => {
        state.clipLoading = true;
        state.error = null;
      })
      .addCase(fetchClipById.fulfilled, (state, action) => {
        state.clipLoading = false;
        state.currentClip = action.payload;
      })
      .addCase(fetchClipById.rejected, (state, action) => {
        state.clipLoading = false;
        state.error = action.error.message || 'Failed to fetch clip';
      })
      
      // fetchUserClips
      .addCase(fetchUserClips.pending, (state) => {
        state.userClipsLoading = true;
        state.userClipsError = null;
      })
      .addCase(fetchUserClips.fulfilled, (state, action) => {
        state.userClipsLoading = false;
        const { clips, pagination } = action.payload;
        
        if (state.userPagination.page === 1) {
          // First page - replace all user clips
          state.userClips = clips;
        } else {
          // Subsequent pages - append clips
          state.userClips = [...state.userClips, ...clips];
        }
        
        state.userPagination = { ...state.userPagination, ...pagination, page: state.userPagination.page };
        state.userClipsLastFetch = Date.now();
      })
      .addCase(fetchUserClips.rejected, (state, action) => {
        state.userClipsLoading = false;
        state.userClipsError = action.error.message || 'Failed to fetch user clips';
      });
  }
});

export const {
  setCurrentStreamId,
  setCurrentUserId,
  setFilters,
  setUserFilters,
  setPagination,
  setUserPagination,
  updateClipProgress,
  addGeneratingClip,
  moveClipToCompleted,
  removeClip,
  upsertClip,
  clearError,
  resetClips,
  resetUserClips,
  clearCurrentClip,
  setIntroBumper,
  setOutroBumper,
  clearBumpers,
  setTrimOverrides,
  clearTrimOverrides
} = clipsSlice.actions;

export default clipsSlice.reducer;

// Selectors
export const selectClips = (state: { clips: ClipsState }) => state.clips.completedClips;
export const selectUserClips = (state: { clips: ClipsState }) => state.clips.userClips;
export const selectGeneratingClips = (state: { clips: ClipsState }) => state.clips.generatingClips;
export const selectCompletedClips = (state: { clips: ClipsState }) => state.clips.completedClips;
export const selectCurrentClip = (state: { clips: ClipsState }) => state.clips.currentClip;
export const selectClipsLoading = (state: { clips: ClipsState }) => state.clips.loading;
export const selectUserClipsLoading = (state: { clips: ClipsState }) => state.clips.userClipsLoading;
export const selectClipLoading = (state: { clips: ClipsState }) => state.clips.clipLoading;
export const selectClipsError = (state: { clips: ClipsState }) => state.clips.error;
export const selectUserClipsError = (state: { clips: ClipsState }) => state.clips.userClipsError;
export const selectClipsFilters = (state: { clips: ClipsState }) => state.clips.filters;
export const selectUserClipsFilters = (state: { clips: ClipsState }) => state.clips.userFilters;
export const selectClipsPagination = (state: { clips: ClipsState }) => state.clips.pagination;
export const selectUserClipsPagination = (state: { clips: ClipsState }) => state.clips.userPagination;
export const selectCurrentStreamId = (state: { clips: ClipsState }) => state.clips.currentStreamId;
export const selectCurrentUserId = (state: { clips: ClipsState }) => state.clips.currentUserId;
