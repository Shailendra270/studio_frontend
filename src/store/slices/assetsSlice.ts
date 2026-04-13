import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getBumpers, getOverlays, getGraphics, deleteBumper, deleteOverlay, deleteGraphic } from '../../api/assetApi';

// Types
export interface Asset {
  _id: string;
  title: string;
  url: string;
  type: string;
  format?: string;
  contentType?: string;
  duration?: number;
  delay?: number;
  aspectRatio?: string;
  userId: string;
  folderId?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AssetState {
  bumpers: {
    data: Asset[];
    loading: boolean;
    error: string | null;
    totalLength: number;
    currentPage: number;
    totalPages: number;
  };
  overlays: {
    data: Asset[];
    loading: boolean;
    error: string | null;
    totalLength: number;
    currentPage: number;
    totalPages: number;
  };
  graphics: {
    data: Asset[];
    loading: boolean;
    error: string | null;
    totalLength: number;
    currentPage: number;
    totalPages: number;
  };
}

const initialState: AssetState = {
  bumpers: {
    data: [],
    loading: false,
    error: null,
    totalLength: 0,
    currentPage: 1,
    totalPages: 0,
  },
  overlays: {
    data: [],
    loading: false,
    error: null,
    totalLength: 0,
    currentPage: 1,
    totalPages: 0,
  },
  graphics: {
    data: [],
    loading: false,
    error: null,
    totalLength: 0,
    currentPage: 1,
    totalPages: 0,
  },
};

// Async thunks for fetching assets
export const fetchBumpers = createAsyncThunk(
  'assets/fetchBumpers',
  async (params: { userId: string; folderId?: string; limit?: number; pageNo?: number; sortBy?: number; type?: string }) => {
    const response = await getBumpers({
      ...params,
      type: 'video' // Ensure we get video type for bumpers
    });
    return response;
  }
);

export const fetchOverlays = createAsyncThunk(
  'assets/fetchOverlays',
  async (params: { userId: string; folderId?: string; limit?: number; pageNo?: number; sortBy?: number; type?: string }) => {
    const response = await getOverlays({
      ...params,
      type: 'mov' // Ensure we get mov type for overlays
    });
    return response;
  }
);

export const fetchGraphics = createAsyncThunk(
  'assets/fetchGraphics',
  async (params: { userId: string; folderId?: string; limit?: number; pageNo?: number; sortBy?: number }) => {
    const response = await getGraphics(params);
    return response;
  }
);

// Async thunks for deleting assets
export const deleteBumperAsset = createAsyncThunk(
  'assets/deleteBumper',
  async (id: string) => {
    await deleteBumper(id);
    return id;
  }
);

export const deleteOverlayAsset = createAsyncThunk(
  'assets/deleteOverlay',
  async (id: string) => {
    await deleteOverlay(id);
    return id;
  }
);

export const deleteGraphicAsset = createAsyncThunk(
  'assets/deleteGraphic',
  async (id: string) => {
    await deleteGraphic(id);
    return id;
  }
);

const assetsSlice = createSlice({
  name: 'assets',
  initialState,
  reducers: {
    clearAssets: (state) => {
      state.bumpers = initialState.bumpers;
      state.overlays = initialState.overlays;
      state.graphics = initialState.graphics;
    },
    clearBumpers: (state) => {
      state.bumpers = initialState.bumpers;
    },
    clearOverlays: (state) => {
      state.overlays = initialState.overlays;
    },
    clearGraphics: (state) => {
      state.graphics = initialState.graphics;
    },
  },
  extraReducers: (builder) => {
    // Fetch Bumpers
    builder
      .addCase(fetchBumpers.pending, (state) => {
        state.bumpers.loading = true;
        state.bumpers.error = null;
      })
      .addCase(fetchBumpers.fulfilled, (state, action) => {
        state.bumpers.loading = false;
        state.bumpers.data = action.payload.data;
        state.bumpers.totalLength = action.payload.totalLength;
        state.bumpers.currentPage = action.payload.currentPage;
        state.bumpers.totalPages = action.payload.totalPages;
      })
      .addCase(fetchBumpers.rejected, (state, action) => {
        state.bumpers.loading = false;
        state.bumpers.error = action.error.message || 'Failed to fetch bumpers';
      })
      
      // Fetch Overlays
      .addCase(fetchOverlays.pending, (state) => {
        state.overlays.loading = true;
        state.overlays.error = null;
      })
      .addCase(fetchOverlays.fulfilled, (state, action) => {
        state.overlays.loading = false;
        state.overlays.data = action.payload.data;
        state.overlays.totalLength = action.payload.totalLength;
        state.overlays.currentPage = action.payload.currentPage;
        state.overlays.totalPages = action.payload.totalPages;
      })
      .addCase(fetchOverlays.rejected, (state, action) => {
        state.overlays.loading = false;
        state.overlays.error = action.error.message || 'Failed to fetch overlays';
      })
      
      // Fetch Graphics
      .addCase(fetchGraphics.pending, (state) => {
        state.graphics.loading = true;
        state.graphics.error = null;
      })
      .addCase(fetchGraphics.fulfilled, (state, action) => {
        state.graphics.loading = false;
        state.graphics.data = action.payload.data;
        state.graphics.totalLength = action.payload.totalLength;
        state.graphics.currentPage = action.payload.currentPage;
        state.graphics.totalPages = action.payload.totalPages;
      })
      .addCase(fetchGraphics.rejected, (state, action) => {
        state.graphics.loading = false;
        state.graphics.error = action.error.message || 'Failed to fetch graphics';
      })
      
      // Delete Bumper
      .addCase(deleteBumperAsset.fulfilled, (state, action) => {
        state.bumpers.data = state.bumpers.data.filter(asset => asset._id !== action.payload);
        state.bumpers.totalLength -= 1;
      })
      
      // Delete Overlay
      .addCase(deleteOverlayAsset.fulfilled, (state, action) => {
        state.overlays.data = state.overlays.data.filter(asset => asset._id !== action.payload);
        state.overlays.totalLength -= 1;
      })
      
      // Delete Graphic
      .addCase(deleteGraphicAsset.fulfilled, (state, action) => {
        state.graphics.data = state.graphics.data.filter(asset => asset._id !== action.payload);
        state.graphics.totalLength -= 1;
      });
  },
});

export const { clearAssets, clearBumpers, clearOverlays, clearGraphics } = assetsSlice.actions;
export default assetsSlice.reducer;
