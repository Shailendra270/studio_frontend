import { toast } from 'sonner';

const apiUrl = import.meta.env.VITE_API_HOSTNAME;
const videoapiUrl = import.meta.env.VITE_VIDEO_API_URL;

/**
 * Create a new stream
 * @param {Object} streamData - The stream data
 * @param {string} streamData.title - Stream title
 * @param {string} streamData.url - Stream URL
 * @param {string} streamData.category - Stream category
 * @param {string} streamData.userId - User ID from Redux store
 * @param {string} streamData.createdBy - User email from Redux store
 * @param {string} streamData.description - Stream description (optional)
 * @param {Array} streamData.tags - Stream tags (optional)
 * @returns {Promise<Object>} - API response with stream data and upload details
 */
export const createStream = async (streamData) => {
  try {
    const sanitized = {};
    Object.keys(streamData || {}).forEach((k) => {
      const v = streamData[k];
      sanitized[k] = typeof v === 'string' ? v.trim() : Array.isArray(v) ? v.map(x => typeof x === 'string' ? x.trim() : x) : v;
    });
    const response = await fetch(`${videoapiUrl}/api/streams/create`, {

      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(sanitized),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create stream');
    }

    if (data.status) {
      toast.success('Stream created successfully!');
      return data;
    } else {
      throw new Error(data.message || 'Stream creation failed');
    }
  } catch (error) {
    console.error('Create stream error:', error);
    toast.error(error.message || 'Failed to create stream');
    throw error;
  }
};

/**
 * Get streams with filtering, pagination, and search
 * @param {Object} params - Query parameters
 * @param {string} params.userId - User ID (required)
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 10)
 * @param {string|Array} params.category - Category filter (sports)
 * @param {string} params.searchText - Search text for title
 * @param {string} params.startDate - Start date filter (ISO string)
 * @param {string} params.endDate - End date filter (ISO string)
 * @param {string} params.status - Status filter
 * @param {string} params.sortBy - Sort field (default: 'createdAt')
 * @param {string} params.sortOrder - Sort order 'asc' or 'desc' (default: 'desc')
 * @returns {Promise<Object>} - API response with streams data and pagination
 */
export const getStreams = async (params = {}) => {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    // Add all parameters to query string
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          // Handle array parameters (like category)
          value.forEach(item => queryParams.append(key, item));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });

    const response = await fetch(`${videoapiUrl}/api/streams?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch streams');
    }

    return data;
  } catch (error) {
    console.error('Get streams error:', error);
    toast.error(error.message || 'Failed to fetch streams');
    throw error;
  }
};

/**
 * Get a single stream by ID
 * @param {string} streamId - Stream ID to fetch
 * @returns {Promise<Object>} - Stream data
 */
export const getStreamById = async (streamId) => {
  try {
    const response = await fetch(`${videoapiUrl}/api/streams/${streamId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch stream');
    }

    return data;
  } catch (error) {
    console.error('Get stream by ID error:', error);
    toast.error(error.message || 'Failed to fetch stream');
    throw error;
  }
};

/**
 * Upload file to GCP using signed URL
 * @param {string} uploadUrl - Signed upload URL from createStream response
 * @param {File} file - File to upload
 * @returns {Promise<Response>} - Upload response
 */
export const uploadFileToGCP = async (uploadUrl, file) => {
  try {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to upload file to storage');
    }

    toast.success('File uploaded successfully!');
    return response;
  } catch (error) {
    console.error('File upload error:', error);
    toast.error(error.message || 'Failed to upload file');
    throw error;
  }
};

/**
 * Delete a stream by ID
 * @param {string} streamId - Stream ID to delete
 * @returns {Promise<Object>} - Delete response
 */
export const deleteStream = async (streamId) => {
  try {
    const response = await fetch(`${videoapiUrl}/api/streams/${streamId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete stream');
    }

    return data;
  } catch (error) {
    console.error('Delete stream error:', error);
    toast.error(error.message || 'Failed to delete stream');
    throw error;
  }
};

/**
 * Update a stream by ID
 * @param {string} streamId - Stream ID to update
 * @param {Object} updateData - Fields to update
 * @returns {Promise<Object>} - Update response with updated stream
 */
export const updateStream = async (streamId, updateData) => {
  try {
    const sanitized = {};
    Object.keys(updateData || {}).forEach((k) => {
      const v = updateData[k];
      sanitized[k] = typeof v === 'string' ? v.trim() : Array.isArray(v) ? v.map(x => typeof x === 'string' ? x.trim() : x) : v;
    });
    const response = await fetch(`${videoapiUrl}/api/streams/${streamId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(sanitized),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update stream');
    }

    toast.success('Stream updated successfully!');
    return data;
  } catch (error) {
    console.error('Update stream error:', error);
    toast.error(error.message || 'Failed to update stream');
    throw error;
  }
};

/**
 * Complete stream creation workflow
 * @param {Object} streamData - Stream metadata
 * @param {File} videoFile - Video file to upload
 * @returns {Promise<Object>} - Complete stream creation result
 */
export const createStreamWithUpload = async (streamData, videoFile) => {
  try {
    // Step 1: Create stream and get upload URL
    const streamResponse = await createStream(streamData);
    
    // Step 2: Upload file to GCP using signed URL
    if (videoFile && streamResponse.data.uploadUrl) {
      await uploadFileToGCP(streamResponse.data.uploadUrl, videoFile);
    }
    
    return streamResponse;
  } catch (error) {
    console.error('Complete stream creation error:', error);
    throw error;
  }
};

/**
 * End a live stream
 * @param {string} streamId - The stream short ID (streamId)
 * @returns {Promise<Object>} - API response
 */
export const endStream = async (streamId) => {
  try {
    // Call backend endpoint to end stream (backend handles both DB update and AI call)
    const response = await fetch(`${videoapiUrl}/api/streams/${streamId}/end`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to end stream');
    }

    toast.success('Stream ended successfully!');
    return data;
  } catch (error) {
    console.error('End stream error:', error);
    toast.error(error.message || 'Failed to end stream');
    throw error;
  }
};
