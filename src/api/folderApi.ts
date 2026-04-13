import { apiPost, apiPut, apiGet, apiDelete, apiUrl } from '../utils/apiClient.js';

const videoapiUrl = import.meta.env.VITE_VIDEO_API_URL;

interface CreateFolderPayload {
  aspectRatio: string;
  userId: string;
  streamId: string;
  title: string;
  type: string;
  category?: string;
  isAiCreated?: boolean;
}

interface UpdateFolderPayload {
  clips?: string[];
  [key: string]: any; // Allow any folder properties
}

interface FolderResponse {
  success: boolean;
  data: any;
  message: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
}

// Create a new folder
export const createFolder = async (payload: CreateFolderPayload): Promise<FolderResponse> => {
  try {
    const response = await apiPost(`${videoapiUrl}/api/folders`, payload);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
};

// Update folder with clips
export const updateFolder = async (folderId: string, payload: UpdateFolderPayload): Promise<FolderResponse> => {
  try {
    const response = await apiPut(`${videoapiUrl}/api/folders/${folderId}`, payload);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating folder:', error);
    throw error;
  }
};

// Get all folders
export const getFolders = async (params?: { userId?: string; streamId?: string; type?: string }): Promise<FolderResponse> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.streamId) queryParams.append('streamId', params.streamId);
    if (params?.type) queryParams.append('type', params.type);
    
    const url = `${videoapiUrl}/api/folders${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    const response = await apiGet(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching folders:', error);
    throw error;
  }
};

// Get folder by ID
export const getFolderById = async (folderId: string): Promise<FolderResponse> => {
  try {
    const response = await apiGet(`${videoapiUrl}/api/folders/${folderId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching folder:', error);
    throw error;
  }
};

// Get folders by clipId
export const getFoldersByClipId = async (clipId: string): Promise<FolderResponse> => {
  try {
    const response = await apiGet(`${videoapiUrl}/api/folders/by-clip/${clipId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching folders by clipId:', error);
    throw error;
  }
};

// Delete folder by ID
export const deleteFolder = async (folderId: string): Promise<FolderResponse> => {
  try {
    const response = await apiDelete(`${videoapiUrl}/api/folders/${folderId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting folder:', error);
    throw error;
  }
};

// Enhanced get all folders with filtering and pagination
export interface GetAllFoldersPayload {
  userId?: string;
  streamId?: string;
  type?: string;
  page_no?: number;
  limit?: number;
  search?: string;
  aspectRatio?: string;
  rating?: number[];
  duration?: string;
  sortBy?: { [key: string]: number };
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  category?: string;
  isAiCreated?: boolean;
}

export const getAllFolders = async (payload: GetAllFoldersPayload): Promise<FolderResponse> => {
  try {
    const response = await apiPost(`${videoapiUrl}/api/folders/get-all-folders`, payload);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching folders:', error);
    throw error;
  }
};

// Get all user folders across all streams for my-highlights page
export const getAllUserFolders = async (payload: { userId: string; category?: string; search?: string; aspectRatio?: string; rating?: number[]; duration?: string; dateRange?: { startDate: string; endDate: string }; sortBy?: { [key: string]: number }; page_no?: number; limit?: number; isAiCreated?: boolean }): Promise<FolderResponse> => {
  try {
    const response = await apiPost(`${videoapiUrl}/api/folders/get-all-folders`, {
      ...payload,
      type: 'highlight'
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user folders:', error);
    throw error;
  }
};

// Generate highlight payload interface
interface GenerateHighlightPayload {
  folderId: string;
  clips: string[];
  clipIdArr: string[];
  isHighlightVideo: boolean;
  isImage: boolean;
  isPreSlate: boolean;
  isPostSlate: boolean;
  isAudio: boolean;
  image: any;
  overlay: any;
  audio: string;
  preSlate: any[];
  postSlate: any[];
  isTransition: boolean | null;
  transitionName: string;
  selected_transiton: string;
  audio_intensity_array: any[];
  slate_index: number[];
  type: string;
  overlayLogo: string;
  clipsinfo: any[];
  skip_trans: any[];
  userId: string;
  totalDuration: number;
  totalDurationWithoutBumper: number;
}

// Generate highlight from clips and bumpers
export const generateHighlight = async (payload: GenerateHighlightPayload): Promise<FolderResponse> => {
  try {
    const response = await apiPost(`${videoapiUrl}/api/folders/generate-highlight`, payload);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating highlight:', error);
    throw error;
  }
};

// Get highlight generation progress by folder ID (legacy)
export const getHighlightProgress = async (folderId: string): Promise<FolderResponse> => {
  try {
    const response = await apiGet(`${videoapiUrl}/api/folders/highlight-progress/${folderId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching highlight progress:', error);
    throw error;
  }
};

// Get highlight generation progress by job_id from AI server
export const getHighlightProgressByJobId = async (jobId: string): Promise<FolderResponse> => {
  try {
    const response = await apiGet(`${videoapiUrl}/api/folders/highlight-progress-by-job?job_id=${jobId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching highlight progress by job_id:', error);
    throw error;
  }
};

// Reset highlight generation status
export const resetHighlightStatus = async (folderId: string): Promise<FolderResponse> => {
  try {
    const response = await apiPost(`${videoapiUrl}/api/folders/reset-highlight-status/${folderId}`, {});
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error resetting highlight status:', error);
    throw error;
  }
};


// Create AI-generated highlight by sending payload directly to AI server
export const createAIHighlight = async (payload: any): Promise<FolderResponse> => {
  try {
    const response = await apiPost(`${videoapiUrl}/api/folders/ai-highlight`, payload);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating AI highlight:', error);
    throw error;
  }
};

// Get AI highlight progress by highlight_id (use folderId as highlight_id)
export const getAIHighlightProgress = async (highlightId: string): Promise<FolderResponse> => {
  try {
    const response = await apiGet(`${videoapiUrl}/api/folders/ai-highlight-progress?highlight_id=${encodeURIComponent(highlightId)}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching AI highlight progress:', error);
    throw error;
  }
};


// Poll highlight progress with interval using job_id
export const pollHighlightProgressByJobId = (jobId: string, folderId: string, onProgress: (data: any) => void, onComplete: (data: any) => void, onError: (error: any) => void) => {
  const pollInterval = setInterval(async () => {
    try {
      const response = await getHighlightProgressByJobId(jobId);
      if (response.success) {
        const { status, percent, videoUrl, thumbnail, thumbnails, error, duration } = response.data;
        console.log(response);
        
        // Call progress callback
        onProgress(response.data);
        
        // Check if completed
        if (status === 'completed' && percent === 100 && videoUrl) {
          clearInterval(pollInterval);    
          try {
            // Update folder with completion data
            const completionData = {
              thumbnail,
              thumbnails,
              previewUrl: videoUrl,
              progressPercent: percent,
              status,
              totalDuration: response.data.high_dura || duration,
              timeTaken: response.data.execution_time,
            };
            
            await updateFolder(folderId, completionData);
            
            // Get updated folder data
            const updatedFolder = await getFolderById(folderId);
            
            onComplete({
              ...response.data,
              folder: updatedFolder.data
            });
          } catch (updateError) {
            console.error('Error updating folder with completion data:', updateError);
            onError(updateError);
          }
        } else if (status === 'failed' || error) {
          clearInterval(pollInterval);
          onError(error || 'Highlight generation failed');
        }
      } else {
        clearInterval(pollInterval);
        onError('Failed to get progress status');
      }
    } catch (error) {
      clearInterval(pollInterval);
      onError(error);
    }
  }, 3000); // Poll every 3 seconds
  
  // Return function to stop polling
  return () => clearInterval(pollInterval);
};

// Poll highlight progress with interval (legacy - using folderId)
export const pollHighlightProgress = (folderId: string, onProgress: (data: any) => void, onComplete: (data: any) => void, onError: (error: any) => void) => {
  const pollInterval = setInterval(async () => {
    try {
      const response = await getHighlightProgress(folderId);
      if (response.success) {
        const { status, progress, previewUrl, error } = response.data;
        
        // Call progress callback
        onProgress(response.data);
        
        // Check if completed or failed
        if (status === 'completed' && previewUrl) {
          clearInterval(pollInterval);
          onComplete(response.data);
        } else if (status === 'failed' || error) {
          clearInterval(pollInterval);
          onError(error || 'Highlight generation failed');
        }
      } else {
        clearInterval(pollInterval);
        onError('Failed to get progress status');
      }
    } catch (error) {
      clearInterval(pollInterval);
      onError(error);
    }
  }, 3000); // Poll every 3 seconds
  
  // Return function to stop polling
  return () => clearInterval(pollInterval);
};
