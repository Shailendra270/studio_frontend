const apiUrl = import.meta.env.VITE_VIDEO_API_URL;

export interface TagData {
  _id: string;
  category: string;
  name: string;
  tagType: 'event' | 'player';
  createdBy: string;
  streamId?: string;
  metaData?: {
    playerName?: string;
    jerseyNumber?: number | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateTagRequest {
  category: string;
  name: string;
  tagType: 'event' | 'player';
  streamId?: string;
  metaData?: {
    playerName?: string;
    jerseyNumber?: number | null;
  };
}

export interface UpdateTagRequest {
  name?: string;
  metaData?: {
    playerName?: string;
    jerseyNumber?: number | null;
  };
}

export interface TagsResponse {
  success: boolean;
  data: TagData[];
  count?: number;
  message?: string;
  error?: string;
}

export interface TagResponse {
  success: boolean;
  tag: TagData;
  message?: string;
  error?: string;
}

export interface GetTagsParams {
  category: string;
  tagType?: 'event' | 'player';
  streamId?: string;
  playerIds?: string[];
  userId?: string;
  limit?: number;
  pageNo?: number;
  search?: string;
}

export interface BulkCreateTagsRequest {
  tags: CreateTagRequest[];
}

export const importPlayersFromDSG = async (payload: { teamId: string; seasonId?: string; category?: string; userId?: string; createTeam?: boolean }): Promise<{ success: boolean; created?: number; updated?: number; message?: string; error?: string }> => {
  try {
    const response = await fetch(`${apiUrl}/api/tags/import-players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return response.json();
  } catch (e: any) {
    console.error('Import players error:', e);
    throw e;
  }
};
// Get tags by category and type
export const getTags = async (params: GetTagsParams): Promise<TagsResponse> => {
  try {
    const queryParams = new URLSearchParams();
    
    queryParams.append('category', params.category);
    if (params.tagType) queryParams.append('tagType', params.tagType);
    if (params.streamId) queryParams.append('streamId', params.streamId);
    if (params.userId) queryParams.append('userId', params.userId);
    if (params.playerIds && params.playerIds.length > 0) {
      // Send playerIds as JSON array
      queryParams.append('playerIds', JSON.stringify(params.playerIds));
    }
    if (typeof params.limit === 'number') queryParams.append('limit', String(params.limit));
    if (typeof params.pageNo === 'number') queryParams.append('pageNo', String(params.pageNo));
    if (params.search) queryParams.append('search', params.search);
    
    const response = await fetch(`${apiUrl}/api/tags?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  } catch (error: any) {
    console.error('Get tags error:', error);
    throw error;
  }
};

// Create a new tag
export const createTag = async (tagData: CreateTagRequest): Promise<TagResponse> => {
  try {
    const response = await fetch(`${apiUrl}/api/tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(tagData),
    });
    
    if (!response.ok) {
      try {
        const ct = response.headers.get('Content-Type') || '';
        if (ct.includes('application/json')) {
          const errBody = await response.json();
          const msg = errBody?.message || errBody?.error || response.statusText || `HTTP error! status: ${response.status}`;
          throw new Error(msg);
        } else {
          const text = await response.text();
          const msg = text || response.statusText || `HTTP error! status: ${response.status}`;
          throw new Error(msg);
        }
      } catch {
        throw new Error(response.statusText || `HTTP error! status: ${response.status}`);
      }
    }
    return response.json();
  } catch (error: any) {
    console.error('Create tag error:', error);
    throw error;
  }
};

// Update a tag
export const updateTag = async (tagId: string, tagData: UpdateTagRequest): Promise<TagResponse> => {
  try {
    const response = await fetch(`${apiUrl}/api/tags/${tagId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(tagData),
    });
    
    if (!response.ok) {
      try {
        const ct = response.headers.get('Content-Type') || '';
        if (ct.includes('application/json')) {
          const errBody = await response.json();
          const msg = errBody?.message || errBody?.error || response.statusText || `HTTP error! status: ${response.status}`;
          throw new Error(msg);
        } else {
          const text = await response.text();
          const msg = text || response.statusText || `HTTP error! status: ${response.status}`;
          throw new Error(msg);
        }
      } catch {
        throw new Error(response.statusText || `HTTP error! status: ${response.status}`);
      }
    }
    
    return response.json();
  } catch (error: any) {
    console.error('Update tag error:', error);
    throw error;
  }
};

// Delete a tag
export const deleteTag = async (tagId: string): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const response = await fetch(`${apiUrl}/api/tags/${tagId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      try {
        const ct = response.headers.get('Content-Type') || '';
        if (ct.includes('application/json')) {
          const errBody = await response.json();
          const msg = errBody?.message || errBody?.error || response.statusText || `HTTP error! status: ${response.status}`;
          throw new Error(msg);
        } else {
          const text = await response.text();
          const msg = text || response.statusText || `HTTP error! status: ${response.status}`;
          throw new Error(msg);
        }
      } catch {
        throw new Error(response.statusText || `HTTP error! status: ${response.status}`);
      }
    }
    
    return response.json();
  } catch (error: any) {
    console.error('Delete tag error:', error);
    throw error;
  }
};

// Get a single tag by ID
export const getTagById = async (tagId: string): Promise<TagResponse> => {
  try {
    const response = await fetch(`${apiUrl}/api/tags/${tagId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  } catch (error: any) {
    console.error('Get tag by ID error:', error);
    throw error;
  }
};

// Bulk create tags
export const bulkCreateTags = async (tagsData: BulkCreateTagsRequest): Promise<TagsResponse> => {
  try {
    const response = await fetch(`${apiUrl}/api/tags/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(tagsData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  } catch (error: any) {
    console.error('Bulk create tags error:', error);
    throw error;
  }
};
