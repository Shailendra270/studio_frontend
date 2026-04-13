import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getAllFolders, getFolderById, getAllUserFolders, GetAllFoldersPayload } from '../../api/folderApi';
import { HighlightSection } from '../../mocks/clips_mockData/mockHighlights';

// Types
export interface FolderData {
  _id: string;
  name: string;
  title?: string;
  description?: string;
  clips: any[];
  createdAt: string;
  updatedAt: string;
  userId: string;
  streamId: string;
  type: string;
  published?: boolean;
  isAiCreated?: boolean;
  totalDuration?: number;
  timeTaken?: number;
  clipCount?: number;
  previewUrl?: string;
  thumbnail?: string;
  thumbnailUrl?: string;
  thumbnails?: string[];
  tags?: string[];
  rating?: number;
  aspectRatio?: string;
  progressPercent?: number;
  status?: string;
}

export interface FoldersState {
  folders: FolderData[];
  highlightSections: HighlightSection[];
  userHighlights: FolderData[]; // For My Highlights page
  currentFolder: FolderData | null;
  loading: boolean;
  userHighlightsLoading: boolean;
  currentFolderLoading: boolean;
  error: string | null;
  userHighlightsError: string | null;
  currentFolderError: string | null;
  lastFetch: number | null;
  userHighlightsLastFetch: number | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
  userHighlightsPagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
  filters: {
    search?: string;
    aspectRatio?: string;
    rating?: number;
    sortBy?: string;
  };
  userHighlightsFilters: {
    search?: string;
    aspectRatio?: string;
    rating?: number[];
    duration?: string;
    category?: string;
    dateRange?: {
      startDate: string;
      endDate: string;
    };
    sortBy?: string;
  };
}

const initialState: FoldersState = {
  folders: [],
  highlightSections: [],
  userHighlights: [],
  currentFolder: null,
  loading: false,
  userHighlightsLoading: false,
  currentFolderLoading: false,
  error: null,
  userHighlightsError: null,
  currentFolderError: null,
  lastFetch: null,
  userHighlightsLastFetch: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
  },
  userHighlightsPagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
  },
  filters: {},
  userHighlightsFilters: {},
};

// Async thunk for fetching all folders
export const fetchAllFolders = createAsyncThunk(
  'folders/fetchAllFolders',
  async (payload: GetAllFoldersPayload, { rejectWithValue }) => {
    try {
      const response = await getAllFolders(payload);
      return response; // Return the entire response object
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch folders');
    }
  }
);

// Fetch folder by ID
export const fetchFolderById = createAsyncThunk(
  'folders/fetchFolderById',
  async (folderId: string, { rejectWithValue }) => {
    try {
      const response = await getFolderById(folderId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch folder');
    }
  }
);

// Fetch all user folders across all streams for My Highlights page
export const fetchAllUserFolders = createAsyncThunk(
  'folders/fetchAllUserFolders',
  async (payload: { userId: string; category?: string; search?: string; aspectRatio?: string; rating?: number[]; duration?: string; dateRange?: { startDate: string; endDate: string }; sortBy?: { [key: string]: number }; page_no?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await getAllUserFolders(payload);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user folders');
    }
  }
);

// Helper function to transform folders to highlight sections
const transformFoldersToHighlights = (folders: FolderData[]): HighlightSection[] => {
  const drafts = folders.filter(folder => !folder?.previewUrl && !folder.published && !folder.isAiCreated);
  const generate = folders.filter(folder => folder?.previewUrl && !folder.published && !folder.isAiCreated);
  const aiGenerated = folders.filter(folder => folder.isAiCreated && !folder.published);
  const published = folders.filter(folder => folder.published);

  return [
      {
      id: 'ai-generated',
      title: 'AI generated',
      count: aiGenerated.length,
      clips: [], // Empty clips array for aiGenerated section
      // clips: aiGenerated.flatMap(folder => 
      //   (folder.clips || []).map((clip: any) => ({
      //     id: clip._id || clip.id,
      //     _id: clip._id || clip.id,
      //     title: clip.title || 'Untitled',
      //     date: new Date(clip.createdAt || Date.now()).toLocaleDateString('en-US', { 
      //       month: 'short', 
      //       day: 'numeric', 
      //       year: 'numeric' 
      //     }),
      //     time: new Date(clip.createdAt || Date.now()).toLocaleTimeString('en-US', { 
      //       hour: '2-digit', 
      //       minute: '2-digit' 
      //     }),
      //     thumbnail: clip.thumbnailUrl || clip.thumbnail || '',
      //     thumbnailUrl: clip.thumbnailUrl || clip.thumbnail || '',
      //     timestamp: `${clip.start_time || '00:00:00'} - ${clip.end_time || '00:00:00'}`,
      //     duration: clip.duration || '00:00:00',
      //     aspectRatio: clip.aspectRatio || '16:9',
      //     rating: clip.rating || 0,
      //     tags: [...(clip.tags || []), 'AI Generated'],
      //     event: clip.event || '',
      //     status: { name: 'Published', color: '#FFF', background: '#00CF45' },
      //     selected: false,
      //     isAiCreated: true,
      //     type: clip.type || '',
      //     videoUrl: clip.videoUrl || '',
      //     start_time: clip.start_time || '00:00:00',
      //     end_time: clip.end_time || '00:00:00'
      //   }))
      // )
      folders: aiGenerated // Store the actual folder data for aiGenerated section
    },
    {
      id: 'drafts',
      title: 'Drafts',
      count: drafts.length,
      clips: [], // Empty clips array for drafts section
      folders: drafts // Store the actual folder data for drafts
    },
    {
      id: 'generate',
      title: 'Generated Highlights',
      count: generate.length,
      clips: [], // Empty clips array for generate section
      // clips: generate.flatMap(folder => 
      //   (folder.clips || []).map((clip: any) => ({
      //     id: clip._id || clip.id,
      //     _id: clip._id || clip.id,
      //     title: clip.title || 'Untitled',
      //     date: new Date(clip.createdAt || Date.now()).toLocaleDateString('en-US', { 
      //       month: 'short', 
      //       day: 'numeric', 
      //       year: 'numeric' 
      //     }),
      //     time: new Date(clip.createdAt || Date.now()).toLocaleTimeString('en-US', { 
      //       hour: '2-digit', 
      //       minute: '2-digit' 
      //     }),
      //     thumbnail: clip.thumbnailUrl || clip.thumbnail || '',
      //     thumbnailUrl: clip.thumbnailUrl || clip.thumbnail || '',
      //     timestamp: `${clip.start_time || '00:00:00'} - ${clip.end_time || '00:00:00'}`,
      //     duration: clip.duration || '00:00:00',
      //     aspectRatio: clip.aspectRatio || '16:9',
      //     rating: clip.rating || 0,
      //     tags: [...(clip.tags || []), 'Generate'],
      //     event: clip.event || '',
      //     status: { name: 'Generate', color: '#FFF', background: '#3B82F6' },
      //     selected: false,
      //     isAiCreated: false,
      //     type: clip.type || '',
      //     videoUrl: clip.videoUrl || '',
      //     start_time: clip.start_time || '00:00:00',
      //     end_time: clip.end_time || '00:00:00'
      //   }))
      
      // ),
      folders: generate // Store the actual folder data for generate section
    },
    {
      id: 'published',
      title: 'Published',
      count: published.length,
      clips: published.flatMap(folder => 
        (folder.clips || []).map((clip: any) => ({
          id: clip._id || clip.id,
          _id: clip._id || clip.id,
          title: clip.title || 'Untitled',
          date: new Date(clip.createdAt || Date.now()).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          }),
          time: new Date(clip.createdAt || Date.now()).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          thumbnail: clip.thumbnailUrl || clip.thumbnail || '',
          thumbnailUrl: clip.thumbnailUrl || clip.thumbnail || '',
          timestamp: `${clip.start_time || '00:00:00'} - ${clip.end_time || '00:00:00'}`,
          duration: clip.duration || '00:00:00',
          aspectRatio: clip.aspectRatio || '16:9',
          rating: clip.rating || 0,
          tags: [...(clip.tags || []), 'Published'],
          event: clip.event || '',
          status: { name: 'Published', color: '#FFF', background: '#00CF45' },
          selected: false,
          isAiCreated: false,
          type: clip.type || '',
          videoUrl: clip.videoUrl || '',
          start_time: clip.start_time || '00:00:00',
          end_time: clip.end_time || '00:00:00'
        }))
      )
    }
  ];
};

const foldersSlice = createSlice({
  name: 'folders',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<FoldersState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setPagination: (state, action: PayloadAction<Partial<FoldersState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    setUserHighlightsFilters: (state, action: PayloadAction<Partial<FoldersState['userHighlightsFilters']>>) => {
      state.userHighlightsFilters = { ...state.userHighlightsFilters, ...action.payload };
    },
    setUserHighlightsPagination: (state, action: PayloadAction<Partial<FoldersState['userHighlightsPagination']>>) => {
      state.userHighlightsPagination = { ...state.userHighlightsPagination, ...action.payload };
    },
    clearFolders: (state) => {
      state.folders = [];
      state.highlightSections = [];
      state.error = null;
      state.lastFetch = null;
    },
    clearUserHighlights: (state) => {
      state.userHighlights = [];
      state.userHighlightsError = null;
      state.userHighlightsLastFetch = null;
    },
    clearError: (state) => {
      state.error = null;
      state.userHighlightsError = null;
    },
    addBumperToTimeline: (
  state,
  action: PayloadAction<{ folderId: string; bumperData: any }>
) => {
  const { folderId, bumperData } = action.payload;

  // helper function to insert based on position
  const insertBumper = (clips: any[]) => {
    if (bumperData?.position === "intro") {
      clips.unshift(bumperData); // add at start
    } else if (bumperData?.position === "outro") {
      clips.push(bumperData); // add at end
    } else {
      clips.push(bumperData); // default behavior
    }
  };

  if (state.currentFolder && state.currentFolder._id === folderId) {
    state.currentFolder.clips = state.currentFolder.clips || [];
    insertBumper(state.currentFolder.clips);
  }

  const folderIndex = state.folders.findIndex(
    (folder) => folder._id === folderId
  );
  if (folderIndex !== -1) {
    state.folders[folderIndex].clips = state.folders[folderIndex].clips || [];
    insertBumper(state.folders[folderIndex].clips);
  }
},

    // Upsert or insert a single folder into general folders list and recompute sections
    upsertFolder: (state, action: PayloadAction<FolderData>) => {
      const updated = action.payload;
      if (!updated || !updated._id) return;
      const idx = state.folders.findIndex((f) => f._id === updated._id);
      if (idx !== -1) {
        state.folders[idx] = { ...state.folders[idx], ...updated } as FolderData;
      } else {
        // Prepend new folder so users see it immediately on Clips page
        state.folders.unshift(updated);
        // Maintain pagination count if present
        state.pagination.totalCount = (state.pagination.totalCount || 0) + 1;
      }
      // Recompute highlight sections for Clips page
      state.highlightSections = transformFoldersToHighlights(state.folders);
    },

    // Upsert or insert a single user highlight folder without refetching all
    upsertUserHighlight: (state, action: PayloadAction<FolderData>) => {
      const updated = action.payload;
      if (!updated || !updated._id) return;
      const idx = state.userHighlights.findIndex((f) => f._id === updated._id);
      if (idx !== -1) {
        // Merge updates to preserve any local fields
        state.userHighlights[idx] = { ...state.userHighlights[idx], ...updated } as FolderData;
      } else {
        // Prepend new folder so users see it immediately
        state.userHighlights.unshift(updated);
        // Maintain total count if present
        if (state.userHighlightsPagination) {
          state.userHighlightsPagination.totalCount = (state.userHighlightsPagination.totalCount || 0) + 1;
        }
      }
    },

  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllFolders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllFolders.fulfilled, (state, action) => {
        state.loading = false;
        state.folders = action.payload.data || [];
        state.highlightSections = transformFoldersToHighlights(action.payload.data || []);
        state.pagination = {
          currentPage: action.payload.pagination?.currentPage || 1,
          totalPages: action.payload.pagination?.totalPages || 1,
          totalCount: action.payload.pagination?.totalCount || 0,
          limit: action.payload.pagination?.limit || 20,
        };
        state.lastFetch = Date.now();
        state.error = null;
      })
      .addCase(fetchAllFolders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.folders = [];
        state.highlightSections = [];
      })
      .addCase(fetchFolderById.pending, (state) => {
        state.currentFolderLoading = true;
        state.currentFolderError = null;
      })
      .addCase(fetchFolderById.fulfilled, (state, action) => {
        state.currentFolderLoading = false;
        state.currentFolder = action.payload.data || null;
        state.currentFolderError = null;
      })
      .addCase(fetchFolderById.rejected, (state, action) => {
        state.currentFolderLoading = false;
        state.currentFolderError = action.payload as string;
        state.currentFolder = null;
      })
      .addCase(fetchAllUserFolders.pending, (state) => {
        state.userHighlightsLoading = true;
        state.userHighlightsError = null;
      })
      .addCase(fetchAllUserFolders.fulfilled, (state, action) => {
        state.userHighlightsLoading = false;
        state.userHighlights = action.payload.data || [];
        state.userHighlightsPagination = {
          currentPage: action.payload.pagination?.currentPage || 1,
          totalPages: action.payload.pagination?.totalPages || 1,
          totalCount: action.payload.pagination?.totalCount || 0,
          limit: action.payload.pagination?.limit || 20,
        };
        state.userHighlightsLastFetch = Date.now();
        state.userHighlightsError = null;
      })
      .addCase(fetchAllUserFolders.rejected, (state, action) => {
        state.userHighlightsLoading = false;
        state.userHighlightsError = action.payload as string;
        state.userHighlights = [];
      });
  },
});

export const { setFilters, setPagination, setUserHighlightsFilters, setUserHighlightsPagination, clearFolders, clearUserHighlights, clearError, addBumperToTimeline, upsertFolder, upsertUserHighlight } = foldersSlice.actions;

// Selectors
export const selectFolders = (state: { folders: FoldersState }) => state.folders.folders;
export const selectHighlightSections = (state: { folders: FoldersState }) => state.folders.highlightSections;
export const selectUserHighlights = (state: { folders: FoldersState }) => state.folders.userHighlights;
export const selectCurrentFolder = (state: { folders: FoldersState }) => state.folders.currentFolder;
export const selectFoldersLoading = (state: { folders: FoldersState }) => state.folders.loading;
export const selectUserHighlightsLoading = (state: { folders: FoldersState }) => state.folders.userHighlightsLoading;
export const selectCurrentFolderLoading = (state: { folders: FoldersState }) => state.folders.currentFolderLoading;
export const selectFoldersError = (state: { folders: FoldersState }) => state.folders.error;
export const selectUserHighlightsError = (state: { folders: FoldersState }) => state.folders.userHighlightsError;
export const selectCurrentFolderError = (state: { folders: FoldersState }) => state.folders.currentFolderError;
export const selectFoldersPagination = (state: { folders: FoldersState }) => state.folders.pagination;
export const selectUserHighlightsPagination = (state: { folders: FoldersState }) => state.folders.userHighlightsPagination;
export const selectFoldersFilters = (state: { folders: FoldersState }) => state.folders.filters;
export const selectUserHighlightsFilters = (state: { folders: FoldersState }) => state.folders.userHighlightsFilters;
export const selectFoldersLastFetch = (state: { folders: FoldersState }) => state.folders.lastFetch;
export const selectUserHighlightsLastFetch = (state: { folders: FoldersState }) => state.folders.userHighlightsLastFetch;

export default foldersSlice.reducer;