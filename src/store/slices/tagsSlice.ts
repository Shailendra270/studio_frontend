import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { createSelector } from 'reselect';
import { getTags, createTag, updateTag, deleteTag, bulkCreateTags } from '@/api/tagsApi';

export interface TagData {
  _id: string;
  category: 'cricket' | 'football' | 'basketball' | 'tennis' | 'hockey' | 'other';
  name: string;
  tagType: 'event' | 'player';
  createdBy: string;
  streamId?: string;
  metaData?: {
    playerName?: string;
    jerseyNumber?: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateTagData {
  category: string;
  name: string;
  tagType: 'event' | 'player';
  streamId?: string;
  metaData?: {
    playerName?: string;
    jerseyNumber?: string | null;
  };
}

export interface UpdateTagData {
  name?: string;
  metaData?: {
    playerName?: string;
    jerseyNumber?: string | null;
  };
}

export interface TagsState {
  eventTags: TagData[];
  playerTags: TagData[];
  loading: boolean;
  error: string | null;
  lastFetch: {
    [key: string]: number; // key format: "category-tagType-streamId"
  };
}

const initialState: TagsState = {
  eventTags: [],
  playerTags: [],
  loading: false,
  error: null,
  lastFetch: {}
};

// Ensure tags arrays remain unique by `_id`
const dedupeById = (tags: TagData[]): TagData[] => {
  const map = new Map<string, TagData>();
  for (const t of tags) {
    // Keep the latest occurrence (last write wins)
    map.set(t._id, t);
  }
  return Array.from(map.values());
};

// Helper function to create cache key
const createCacheKey = (
  category: string,
  tagType: string,
  streamId?: string,
  playerIds?: string[]
): string => {
  if (playerIds && playerIds.length > 0) {
    const key = playerIds.slice().sort().join(',');
    return `${category}-${tagType}-${key}`;
  }
  return streamId ? `${category}-${tagType}-${streamId}` : `${category}-${tagType}`;
};

// Async thunks
export const fetchTagsByCategoryAndType = createAsyncThunk(
  'tags/fetchTagsByCategoryAndType',
  async (params: {
    category: string;
    tagType: 'event' | 'player';
    streamId?: string;
    playerIds?: string[];
  }) => {
    const response = await getTags(params);
    return {
      ...response,
      params
    };
  }
);

export const createNewTag = createAsyncThunk<
  any,
  CreateTagData,
  { rejectValue: { message: string } }
>(
  'tags/createTag',
  async (tagData: CreateTagData, { rejectWithValue }) => {
    try {
      const response = await createTag(tagData);
      if (!response?.success) {
        return rejectWithValue({ message: response?.message || 'Failed to create tag' });
      }
      return response;
    } catch (error: any) {
      return rejectWithValue({ message: error?.message || 'Failed to create tag' });
    }
  }
);

export const updateExistingTag = createAsyncThunk(
  'tags/updateTag',
  async (params: { id: string; data: UpdateTagData }) => {
    const response = await updateTag(params.id, params.data);
    return response;
  }
);

export const deleteExistingTag = createAsyncThunk(
  'tags/deleteTag',
  async (id: string) => {
    await deleteTag(id);
    return id;
  }
);

export const bulkCreateNewTags = createAsyncThunk(
  'tags/bulkCreateTags',
  async (params: {
    tags: CreateTagData[];
    category: string;
    tagType: 'event' | 'player';
    streamId?: string;
  }) => {
    const response = await bulkCreateTags(params.tags);
    return {
      ...response,
      category: params.category,
      tagType: params.tagType,
      streamId: params.streamId
    };
  }
);

const tagsSlice = createSlice({
  name: 'tags',
  initialState,
  reducers: {
    clearTagsError: (state) => {
      state.error = null;
    },
    clearTags: (state) => {
      state.eventTags = [];
      state.playerTags = [];
      state.lastFetch = {};
    },
    clearTagsByType: (state, action: PayloadAction<'event' | 'player'>) => {
      if (action.payload === 'event') {
        state.eventTags = [];
      } else {
        state.playerTags = [];
      }
      // Clear relevant cache entries
      Object.keys(state.lastFetch).forEach(key => {
        if (key.includes(`-${action.payload}-`)) {
          delete state.lastFetch[key];
        }
      });
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch tags by category and type
      .addCase(fetchTagsByCategoryAndType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTagsByCategoryAndType.fulfilled, (state, action) => {
        state.loading = false;
        const { data, params } = action.payload;
        const cacheKey = createCacheKey(params.category, params.tagType, params.streamId, params.playerIds);
        
        if (params.tagType === 'event') {
          // Replace event tags for this category with deduped payload
          const incoming = dedupeById(data);
          state.eventTags = [
            ...state.eventTags.filter(tag => tag.category !== params.category),
            ...incoming
          ];
        } else {
          // Replace player tags for this category (respect playerIds, dedupe inputs)
          const filtered = (params.playerIds && params.playerIds.length > 0)
            ? data.filter((t: TagData) => params.playerIds!.includes(t._id))
            : data;
          const incoming = dedupeById(filtered);
          state.playerTags = [
            ...state.playerTags.filter(tag => tag.category !== params.category),
            ...incoming
          ];
        }
        
        state.lastFetch[cacheKey] = Date.now();
      })
      .addCase(fetchTagsByCategoryAndType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch tags';
      })
      
      // Create tag
      .addCase(createNewTag.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createNewTag.fulfilled, (state, action) => {
        state.loading = false;
        const newTag = action.payload.data;
        
        if (newTag.tagType === 'event') {
          state.eventTags.push(newTag);
          state.eventTags = dedupeById(state.eventTags);
        } else {
          state.playerTags.push(newTag);
          state.playerTags = dedupeById(state.playerTags);
        }
      })
      .addCase(createNewTag.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create tag';
      })
      
      // Update tag
      .addCase(updateExistingTag.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateExistingTag.fulfilled, (state, action) => {
        state.loading = false;
        const updatedTag = action.payload.data;
        
        const updateTagInArray = (tags: TagData[]) => {
          const index = tags.findIndex(tag => tag._id === updatedTag._id);
          if (index !== -1) {
            tags[index] = updatedTag;
          }
        };
        
        if (updatedTag.tagType === 'event') {
          updateTagInArray(state.eventTags);
        } else {
          updateTagInArray(state.playerTags);
        }
      })
      .addCase(updateExistingTag.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update tag';
      })
      
      // Delete tag
      .addCase(deleteExistingTag.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteExistingTag.fulfilled, (state, action) => {
        state.loading = false;
        const deletedId = action.payload;
        
        state.eventTags = state.eventTags.filter(tag => tag._id !== deletedId);
        state.playerTags = state.playerTags.filter(tag => tag._id !== deletedId);
      })
      .addCase(deleteExistingTag.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete tag';
      })
      
      // Bulk create tags
      .addCase(bulkCreateNewTags.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkCreateNewTags.fulfilled, (state, action) => {
        state.loading = false;
        const { data, category, tagType, streamId } = action.payload;
        const cacheKey = createCacheKey(category, tagType, streamId);
        
        if (tagType === 'event') {
          state.eventTags.push(...data);
          state.eventTags = dedupeById(state.eventTags);
        } else {
          state.playerTags.push(...data);
          state.playerTags = dedupeById(state.playerTags);
        }
        
        state.lastFetch[cacheKey] = Date.now();
      })
      .addCase(bulkCreateNewTags.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to bulk create tags';
      });
  }
});

export const { clearTagsError, clearTags, clearTagsByType } = tagsSlice.actions;

// Base selectors
const selectTagsState = (state: any) => state.tags;
export const selectEventTags = (state: any) => state.tags.eventTags;
export const selectPlayerTags = (state: any) => state.tags.playerTags;
export const selectTagsLoading = (state: any) => state.tags.loading;
export const selectTagsError = (state: any) => state.tags.error;
export const selectLastFetch = (state: any) => state.tags.lastFetch;

// Memoized selector to get tags by category and type
export const selectTagsByCategoryAndType = createSelector(
  [
    selectTagsState,
    (state: any, category: string, tagType: 'event' | 'player', streamId?: string, playerIds?: string[]) => 
      ({ category, tagType, streamId, playerIds })
  ],
  (tagsState, { category, tagType, streamId, playerIds }) => {
    if (!tagsState) return [];
    
    const tags = tagType === 'event' ? tagsState.eventTags : tagsState.playerTags;
    
    if (tagType === 'event') {
      return tags.filter((tag: TagData) => tag.category === category);
    } else {
      // When fetching by playerIds, streamId may be undefined; filter by category and optional playerIds
      const byCategory = tags.filter((tag: TagData) => tag.category === category);
      if (playerIds && playerIds.length > 0) {
        const set = new Set(playerIds);
        return byCategory.filter((tag: TagData) => set.has(tag._id));
      }
      return byCategory;
    }
  }
);

// Memoized selector to check if tags are cached and fresh (within 5 minutes)
export const selectAreTagsCached = createSelector(
  [
    selectLastFetch,
    (state: any, category: string, tagType: 'event' | 'player', streamId?: string, playerIds?: string[]) => 
      createCacheKey(category, tagType, streamId, playerIds)
  ],
  (lastFetch, cacheKey) => {
    if (!lastFetch) return false;
    
    const lastFetchTime = lastFetch[cacheKey];
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    
    return lastFetchTime && (Date.now() - lastFetchTime) < CACHE_DURATION;
  }
);

export default tagsSlice.reducer;
