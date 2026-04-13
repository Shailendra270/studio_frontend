const apiUrl = import.meta.env.VITE_API_HOSTNAME;
const videoapiUrl = import.meta.env.VITE_VIDEO_API_URL;

export interface ClipGenerationRequest {
  streamId: string;
  title: string;
  startTime: string; // HH:MM:SS format
  endTime: string;   // HH:MM:SS format
  speed?: number;
  rating?: number;
  tags?: string[];
  aspectRatio?: string;
  sports?: string;
  streamUrl?: string;
  // entityId?: string;
}

export interface ClipGenerationResponse {
  success: boolean;
  message: string;
  data?: {
    clipId: string;
    jobId: string;
    status: string;
    streamId: string;
  };
  error?: string;
}

export interface ClipData {
  _id: string;
  streamId: string;
  id: string;
  clipId?: string;
  title: string;
  start_time: string; // HH:MM:SS format
  end_time: string;   // HH:MM:SS format
  duration: number;
  speed: number;
  rating: number;
  clipRating: number;
  tags: string[];
  status: number;
  clipStatus: 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  jobId?: string;
  videoUrl?: string;
  videoThumbnailUrl?: string;
  thumbnailUrl?: string;
  aspectRatio: string;
  progress: number;
  errorMessage?: string;
  userId: string;
  projectId: string;
  // entityId: string;
  customData?: {
    language?: string;
    sportName?: string;
  };
  createdAt: string;
  updatedAt: string;
  editedVideos?: EditedVideo[];
}

export interface ClipsResponse {
  success: boolean;
  clips: ClipData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
  error?: string;
}

export interface FilterCountsResponse {
  success: boolean;
  data: {
    tags: { label: string; count: number }[];
    ratings: { rating: number; count: number }[];
    aspectRatios: { aspectRatio: string; count: number }[];
  };
}

export interface EditedVideo {
  documentId: string;
  aspect_ratio: string;
  uid: string;
  event: string; // 'autoFlip'
  id: string;
  clipType: string; // 'clip'
  folderId?: string;
  duration?: number;
  videoUrl?: string;
  thumbnails?: string[];
  thumbnailUrl?: string;
  status?: 'completed' | 'processing' | 'failed';
}

export interface GetClipsParams {
  streamId: string;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'latest' | 'oldest' | 'rating' | 'duration' | 'timeSequence';
  aspectRatio?: string;
  tags?: string[];
  rating?: string[];
  startTime?: number;
  endTime?: number;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  status?: 'all' | 'processing' | 'completed' | 'failed' | 'cancelled';
}

export interface GetFilterCountsParams {
  streamId: string;
  search?: string;
  aspectRatio?: string;
  tags?: string[];
  players?: string[]; // optional, treated as tags
  rating?: string[];
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  status?: 'all' | 'processing' | 'completed' | 'failed' | 'cancelled';
}

export interface GetUserClipsParams {
  userId: string;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'latest' | 'oldest' | 'rating' | 'duration' | 'timeSequence';
  aspectRatio?: string;
  tags?: string[];
  rating?: string[];
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  status?: 'all' | 'processing' | 'completed' | 'failed' | 'cancelled';
  eventId?: string;
}

// Generate a new clip
export const generateClip = async (clipData: ClipGenerationRequest): Promise<ClipGenerationResponse> => {
  try {
    const sanitized = Object.fromEntries(Object.entries(clipData).map(([k, v]) => {
      if (typeof v === 'string') return [k, v.trim()];
      if (Array.isArray(v)) return [k, v.map(x => typeof x === 'string' ? x.trim() : x)];
      return [k, v];
    }));
    const response = await fetch(`${videoapiUrl}/api/clips/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(sanitized),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  } catch (error: any) {
    console.error('Generate clip error:', error);
    throw error;
  }
};

// Get clips for a stream with comprehensive filtering
export const getClips = async (params: GetClipsParams): Promise<ClipsResponse> => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add streamId
    queryParams.append('streamId', params.streamId);
    
    // Add pagination
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    
    // Add search
    if (params.search) queryParams.append('search', params.search);
    
    // Add sorting
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    
    // Add filters
    if (params.aspectRatio) queryParams.append('aspectRatio', params.aspectRatio);
    if (params.status && params.status !== 'all') queryParams.append('status', params.status);
    if (typeof params.startTime === 'number') queryParams.append('startTime', params.startTime.toString());
    if (typeof params.endTime === 'number') queryParams.append('endTime', params.endTime.toString());
    
    // Add tags as array
    if (params.tags && params.tags.length > 0) {
      queryParams.append('tags', JSON.stringify(params.tags));
    }
    
    // Add rating as array
    if (params.rating && params.rating.length > 0) {
      queryParams.append('rating', JSON.stringify(params.rating));
    }
    
    // Add date range
    if (params.dateRange?.startDate) queryParams.append('startDate', params.dateRange.startDate);
    if (params.dateRange?.endDate) queryParams.append('endDate', params.dateRange.endDate);
    
    const queryString = queryParams.toString();
    const url = `${videoapiUrl}/api/clips${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
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
    console.error('Get clips error:', error);
    throw error;
  }
};

// Get dynamic filter counts for clips
export const getClipFilterCounts = async (
  params: GetFilterCountsParams
): Promise<FilterCountsResponse> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('streamId', params.streamId);
    if (params.search) queryParams.append('search', params.search);
    if (params.aspectRatio) queryParams.append('aspectRatio', params.aspectRatio);
    if (params.tags && params.tags.length > 0) queryParams.append('tags', JSON.stringify(params.tags));
    if (params.players && params.players.length > 0) queryParams.append('players', JSON.stringify(params.players));
    if (params.rating && params.rating.length > 0) queryParams.append('rating', JSON.stringify(params.rating));
    if (params.dateRange?.startDate) queryParams.append('startDate', params.dateRange.startDate);
    if (params.dateRange?.endDate) queryParams.append('endDate', params.dateRange.endDate);
    if (params.status && params.status !== 'all') queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    const url = `${videoapiUrl}/api/clips/filters/counts${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  } catch (error: any) {
    console.error('Get filter counts error:', error);
    throw error;
  }
};

// Get user clips with comprehensive filtering
export const getUserClips = async (params: GetUserClipsParams): Promise<ClipsResponse> => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add pagination
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    
    // Add search
    if (params.search) queryParams.append('search', params.search);
    
    // Add sorting
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    
    // Add filters
    if (params.aspectRatio) queryParams.append('aspectRatio', params.aspectRatio);
    if (params.status && params.status !== 'all') queryParams.append('status', params.status);
    if (params.eventId) queryParams.append('eventId', params.eventId);
    
    // Add tags as array
    if (params.tags && params.tags.length > 0) {
      queryParams.append('tags', JSON.stringify(params.tags));
    }
    
    // Add rating as array
    if (params.rating && params.rating.length > 0) {
      queryParams.append('rating', JSON.stringify(params.rating));
    }
    
    // Add date range
    if (params.dateRange?.startDate) queryParams.append('startDate', params.dateRange.startDate);
    if (params.dateRange?.endDate) queryParams.append('endDate', params.dateRange.endDate);
    
    const queryString = queryParams.toString();
    const url = `${videoapiUrl}/api/clips/user/${params.userId}${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
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
    console.error('Get user clips error:', error);
    throw error;
  }
};

// Get clip by ID
export const getClipById = async (clipId: string): Promise<{ success: boolean; data: ClipData; message?: string; error?: string }> => {
  try {
    const response = await fetch(`${videoapiUrl}/api/clips/${clipId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Check if the backend returned success: false
    if (!result.success) {
      throw new Error(result.error || result.message || 'Operation failed');
    }
    
    return result;
  } catch (error: any) {
    console.error('Get clip by ID error:', error);
    throw error;
  }
};

// Update clip (title, rating, tags)
export const updateClip = async (clipId: string, updateData: { title?: string; rating?: number; tags?: string[]; transcript?: string; clip_ai_score?: string; overlay_delay?: number }): Promise<{ success: boolean; data: ClipData; message?: string; error?: string }> => {
  try {
    const response = await fetch(`${videoapiUrl}/api/clips/${clipId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(updateData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Check if the backend returned success: false
    if (!result.success) {
      throw new Error(result.error || result.message || 'Operation failed');
    }
    
    return result;
  } catch (error: any) {
    console.error('Update clip error:', error);
    throw error;
  }
};

// Delete clip
export const deleteClip = async (clipId: string): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const response = await fetch(`${videoapiUrl}/api/clips/${clipId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Check if the backend returned success: false
    if (!result.success) {
      throw new Error(result.error || result.message || 'Operation failed');
    }
    
    return result;
  } catch (error: any) {
    console.error('Delete clip error:', error);
    throw error;
  }
};

// WebSocket connection for progress tracking
export class ClipProgressTracker {
  private ws: WebSocket | null = null;
  private jobId: string;
  private onProgress: (progress: number) => void;
  private onComplete: (data: any) => void;
  private onError: (error: string) => void;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(
    jobId: string,
    onProgress: (progress: number) => void,
    onComplete: (data: any) => void,
    onError: (error: string) => void
  ) {
    this.jobId = jobId;
    this.onProgress = onProgress;
    this.onComplete = onComplete;
    this.onError = onError;
  }

  connect() {
    try {
      // Use HTTP polling instead of WebSocket for now
      this.startPolling();
    } catch (error) {
      console.error('Failed to connect to progress tracker:', error);
      this.onError('Failed to connect to progress tracker');
    }
  }

  private async startPolling() {
    const pollProgress = async () => {
      try {
        const response = await fetch(
          `${videoapiUrl}/api/clips/progress?job_id=${this.jobId}`
        );
        const data = await response.json();
        
        if (data.progress !== undefined) {
          this.onProgress(data.progress);
        }
        
        if (data.status === 'completed') {
          this.onComplete(data);
          return; // Stop polling
        } else if (data.status === 'failed') {
          this.onError(data.error || 'Processing failed');
          return; // Stop polling
        }
        
        // Continue polling if still processing
        if (data.status === 'processing') {
          setTimeout(pollProgress, 3000); // Increased from 2 to 5 seconds to reduce API calls
        }
      } catch (error) {
        console.error('Progress polling error:', error);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(pollProgress, this.reconnectDelay * this.reconnectAttempts);
        } else {
          this.onError('Failed to track progress after multiple attempts');
        }
      }
    };
    
    pollProgress();
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// AutoFlip: request aspect-ratio-specific clip generation
export const autoflip = async (
  clipId: string,
  aspect_ratio: string
): Promise<{ success: boolean; message: string; data?: { exists: boolean; output: EditedVideo }; error?: string }> => {
  try {
    const response = await fetch(`${videoapiUrl}/api/clips/${clipId}/autoflip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ aspect_ratio }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || result.message || 'Operation failed');
    }
    return result;
  } catch (error: any) {
    console.error('Autoflip error:', error);
    throw error;
  }
};

export const generateClipHighlight = async (payload: any): Promise<{ success: boolean; data?: { job_id: string; status: string; stream_id: string }; message?: string; error?: string }> => {
  try {
    const response = await fetch(`${videoapiUrl}/api/clips/highlight/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('Generate clip highlight error:', error);
    throw error;
  }
};

export const pollClipHighlightProgressByJobId = (
  jobId: string,
  clipId: string,
  onProgress: (data: any) => void,
  onComplete: (data: any) => void,
  onError: (error: any) => void
) => {
  const pollInterval = setInterval(async () => {
    try {
      const resp = await fetch(`${videoapiUrl}/api/clips/highlight-progress-by-job?job_id=${encodeURIComponent(jobId)}`);
      const result = await resp.json();
      if (result.success) {
        const data = result.data;
        onProgress(data);
        if (data.status === 'completed' && data.percent === 100 && (data.videoUrl || data.video_url)) {
          clearInterval(pollInterval);
          onComplete(data);
        } else if (data.status === 'failed' || data.error) {
          clearInterval(pollInterval);
          onError(data.error || 'Clip highlight generation failed');
        }
      } else {
        clearInterval(pollInterval);
        onError(result.message || 'Failed to get progress status');
      }
    } catch (error) {
      clearInterval(pollInterval);
      onError(error);
    }
  }, 3000);
  return () => clearInterval(pollInterval);
};

export const resetClipHighlightStatus = async (clipId: string): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const response = await fetch(`${videoapiUrl}/api/clips/highlight-reset-status/${clipId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('Reset clip highlight status error:', error);
    throw error;
  }
};

// Overwrite clip with edited preview
export const overwriteClipById = async (clipId: string): Promise<{ success: boolean; message?: string; data?: any; error?: string }> => {
  try {
    const response = await fetch(`${videoapiUrl}/api/clips/overwrite/${clipId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return response.json();
  } catch (error: any) {
    console.error('Overwrite clip error:', error);
    throw error;
  }
};

// Save edited preview as a new clip
export const saveClipAsNew = async (sourceClipId: string, title: string, aspectRatio?: string, documentId?: string): Promise<{ success: boolean; message?: string; data?: any; error?: string }> => {
  try {
    const response = await fetch(`${videoapiUrl}/api/clips/save-as-new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ sourceClipId, title, aspectRatio, documentId }),
    });
    return response.json();
  } catch (error: any) {
    console.error('Save clip as new error:', error);
    throw error;
  }
};

// Delete an edited clip (entry from editedVideos)
export const deleteEditedClip = async (clipId: string, documentId: string): Promise<{ success: boolean; message?: string; data?: any; error?: string }> => {
  try {
    const response = await fetch(`${videoapiUrl}/api/clips/delete-edited`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ clipId, documentId }),
    });
    return response.json();
  } catch (error: any) {
    console.error('Delete edited clip error:', error);
    throw error;
  }
};

// Save a clip from a folder preview
export const saveClipFromFolder = async (folderId: string, title: string): Promise<{ success: boolean; message?: string; data?: any; error?: string }> => {
  try {
    const response = await fetch(`${videoapiUrl}/api/clips/save-from-folder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ folderId, title }),
    });
    return response.json();
  } catch (error: any) {
    console.error('Save clip from folder error:', error);
    throw error;
  }
};

// Generate input-ratio cropped clip preview (manual crop)
export const generateInputRatioClip = async (payload: {
  clipId: string;
  ratio: string;
  timeSec: number;
  playbackRate: number;
  videoUrl: string;
  cropRect: { x_px: number; y_px: number; width_px: number; height_px: number; x_norm: number; y_norm: number; width_norm: number; height_norm: number };
}): Promise<{ success: boolean; data?: any; message?: string; error?: string }> => {
  try {
    const response = await fetch(`${videoapiUrl}/api/clips/generate/input-ratio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return response.json();
  } catch (error: any) {
    console.error('Generate input-ratio clip error:', error);
    throw error;
  }
};

// Dynamic crop coordinates API (time-series crop)
export const generateDynamicCrop = async (payload: {
  videoUrl: string;
  streamId: string;
  coordinates: Array<{ timeStamp: number; coordinates: number[] }>;
  clipTitle: string;
  clipId: string;
  event: string;
  aspectRatio: string;
}): Promise<{ success: boolean; data?: any; message?: string; error?: string }> => {
  try {
    const response = await fetch(`${videoapiUrl}/api/clips/cropper/dynamic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return response.json();
  } catch (error: any) {
    console.error('Dynamic crop API error:', error);
    throw error;
  }
};

export const exportClipJson = async (clipId: string): Promise<{ success: boolean; data?: any; message?: string; error?: string }> => {
  try {
    const response = await fetch(`${videoapiUrl}/api/clips/export-json/${clipId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return response.json();
  } catch (error: any) {
    console.error('Export clip json error:', error);
    throw error;
  }
};

// Published clips calendar (month-level)
export interface PublishedCalendarItem {
  date: string; // YYYY-MM-DD
  published: number;
  failed: number;
}

export interface GetPublishedCalendarParams {
  year: number;
  month: number; // 1-12
  streamId?: string;
  sport?: string; // customData.sportName
  platform?: string;
  type?: string;
  status?: 'all' | 'completed' | 'failed';
  userId?: string;
}

export const getPublishedCalendar = async (
  params: GetPublishedCalendarParams
): Promise<{ success: boolean; data: PublishedCalendarItem[]; error?: string; message?: string }> => {
  try {
    const qp = new URLSearchParams();
    qp.append('year', String(params.year));
    qp.append('month', String(params.month));
    if (params.streamId) qp.append('streamId', params.streamId);
    if (params.sport) qp.append('sport', params.sport);
    if (params.platform) qp.append('platform', params.platform);
    if (params.type) qp.append('type', params.type);
    if (params.status) qp.append('status', params.status);
    if (params.userId) qp.append('userId', params.userId);
    const url = `${videoapiUrl}/api/clips/published/calendar?${qp.toString()}`;
    const resp = await fetch(url, { credentials: 'include' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.json();
  } catch (e: any) {
    console.error('Get published calendar error:', e);
    throw e;
  }
};

// Published clips list for a specific date
export interface PublishedClipItem {
  id: string;
  streamId: string;
  title: string;
  duration: number;
  aspectRatio: string;
  thumbnailUrl?: string;
  category?: string;
  description?: string;
  platforms: string[];
  publishedAt: string;
  status: 'completed' | 'failed' | 'unknown';
}

export interface GetPublishedClipsParams {
  date: string; // YYYY-MM-DD
  streamId?: string;
  sport?: string;
  platform?: string;
  type?: string;
  status?: 'all' | 'completed' | 'failed';
  userId?: string;
}

export const getPublishedClipsForDate = async (
  params: GetPublishedClipsParams
): Promise<{ success: boolean; data: PublishedClipItem[]; error?: string; message?: string }> => {
  try {
    const qp = new URLSearchParams();
    qp.append('date', params.date);
    if (params.streamId) qp.append('streamId', params.streamId);
    if (params.sport) qp.append('sport', params.sport);
    if (params.platform) qp.append('platform', params.platform);
    if (params.type) qp.append('type', params.type);
    if (params.status) qp.append('status', params.status || 'completed');
    if (params.userId) qp.append('userId', params.userId);
    const url = `${videoapiUrl}/api/clips/published?${qp.toString()}`;
    const resp = await fetch(url, { credentials: 'include' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.json();
  } catch (e: any) {
    console.error('Get published clips by date error:', e);
    throw e;
  }
};
