import { apiPost, apiGet, apiDelete, apiUrl, videoapiUrl } from '../utils/apiClient.js';

// Types for asset API requests and responses
export interface PresignedUrlRequest {
  userId: string;
  fileName: string;
  contentType: string;
}

export interface PresignedUrlResponse {
  success: boolean;
  message: string;
  presignedUrl: string;
  s3Url: string;
  fileName?: string;
  contentType?: string;
}

export interface ValidateUrlRequest {
  presignedUrl: string;
}

export interface ValidateUrlResponse {
  status: boolean;
  message: string;
  data: {
    isValid: boolean;
    contentType?: string;
    fileSize?: number;
  };
}

export interface DurationRequest {
  presignedUrl: string;
}

export interface DurationResponse {
  status: boolean;
  message: string;
  duration?: number;
  aspect_ratio?: string | null;
  data?: {
    duration?: number;
  };
}

export interface UploadAssetRequest {
  userId: string;
  streamId: string;
  name: string;
  sport?: string;
  competition?: string;
  publicUrl: string;
  contentType: string;
  fileSize?: number;
  duration?: number;
  aspect_ratio?: string;
  delay?: number;
}

export interface UploadGraphicRequest {
  url: string;
  userId: string;
  title: string;
  sport?: string;
  competition?: string;
  contentType: string;
}

export interface UploadAssetResponse {
  status: boolean;
  message: string;
  data: {
    _id: string;
    userId: string;
    streamId: string;
    name: string;
    sport?: string;
    competition?: string;
    publicUrl: string;
    contentType: string;
    fileSize?: number;
    duration?: number;
    aspect_ratio?: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface GetAssetsRequest {
  userId: string;
  streamId?: string;
  type?: 'bumper' | 'graphic' | 'overlay';
  sport?: string;
  competition?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GetAssetsResponse {
  status: boolean;
  message: string;
  data: {
    assets: any[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

// Asset API functions
export const getPresignedUrl = async (data: PresignedUrlRequest): Promise<PresignedUrlResponse> => {
  const response = await apiPost(`${videoapiUrl}/api/assets/presigned-url`, data);
  return await response.json();
};

export const validateUrl = async (data: ValidateUrlRequest): Promise<ValidateUrlResponse> => {
  const response = await apiPost(`${videoapiUrl}/api/assets/validate-url`, data);
  return await response.json();
};

export const getDuration = async (data: DurationRequest): Promise<DurationResponse> => {
  const response = await apiPost(`${videoapiUrl}/api/assets/duration`, data);
  return await response.json();
};

export const uploadBumper = async (data: UploadAssetRequest): Promise<UploadAssetResponse> => {
  const response = await apiPost(`${videoapiUrl}/api/assets/bumpers`, data);
  return await response.json();
};

export const uploadGraphic = async (data: UploadGraphicRequest): Promise<UploadAssetResponse> => {
  const response = await apiPost(`${videoapiUrl}/api/assets/graphics`, data);
  return await response.json();
};

export const uploadOverlay = async (data: UploadAssetRequest): Promise<UploadAssetResponse> => {
  const response = await apiPost(`${videoapiUrl}/api/assets/overlays`, data);
  return await response.json();
};

export const getBumpers = async (params: { userId?: string; folderId?: string; limit?: number; pageNo?: number; sortBy?: number; type?: string }): Promise<any> => {
  const response = await apiPost(`${videoapiUrl}/api/assets/bumpers/list`, {
    ...params,
    type: 'video' // Ensure we get video type for bumpers
  });
  return await response.json();
};

export const getGraphics = async (params: { userId?: string; folderId?: string; limit?: number; pageNo?: number; sortBy?: number }): Promise<any> => {
  const response = await apiPost(`${videoapiUrl}/api/assets/graphics/list`, params);
  return await response.json();
};

export const getOverlays = async (params: { userId?: string; folderId?: string; limit?: number; pageNo?: number; sortBy?: number; type?: string }): Promise<any> => {
  const response = await apiPost(`${videoapiUrl}/api/assets/overlays/list`, {
    ...params,
    type: 'mov' // Ensure we get mov type for overlays
  });
  return await response.json();
};

// Delete functions
export const deleteBumper = async (id: string): Promise<any> => {
  const response = await apiDelete(`${videoapiUrl}/api/assets/bumpers/${id}`);
  return await response.json();
};

export const deleteOverlay = async (id: string): Promise<any> => {
  const response = await apiDelete(`${videoapiUrl}/api/assets/overlays/${id}`);
  return await response.json();
};

export const deleteGraphic = async (id: string): Promise<any> => {
  const response = await apiDelete(`${videoapiUrl}/api/assets/graphics/${id}`);
  return await response.json();
};

// Helper function to upload file to presigned URL
export const uploadFileToPresignedUrl = async (presignedUrl: string, file: File): Promise<boolean> => {
  try {
    console.log('Starting file upload to presigned URL:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      presignedUrlLength: presignedUrl.length
    });

    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });
    
    console.log('Upload response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error response');
      console.error('Upload failed with response:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
    }
    
    return response.ok;
  } catch (error) {
    console.error('Error uploading file to presigned URL:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
};

// Complete upload workflow function
export const uploadAssetComplete = async ({
  file,
  userId,
  streamId,
  name,
  sport,
  competition,
  assetType
}: {
  file: File;
  userId: string;
  streamId: string;
  name: string;
  sport?: string;
  competition?: string;
  assetType: 'bumper' | 'graphic' | 'overlay';
}): Promise<UploadAssetResponse> => {
  try {
    // Step 1: Get presigned URL
    const presignedResponse = await getPresignedUrl({
      userId,
      fileName: file.name,
      contentType: file.type
    });
    
    if (!presignedResponse.success) {
      throw new Error(presignedResponse.message);
    }
    
    const { presignedUrl, s3Url: publicUrl } = presignedResponse;
    
    // Step 2: Upload file to presigned URL
    const uploadSuccess = await uploadFileToPresignedUrl(presignedUrl, file);
    if (!uploadSuccess) {
      throw new Error('Failed to upload file to storage');
    }
    
    // Step 3: Get duration for video assets (bumpers and overlays)
    let duration: number | undefined;
    if (assetType === 'bumper' || assetType === 'overlay') {
      try {
        const durationResponse = await getDuration({ presignedUrl });
        if (durationResponse.status) {
          duration = durationResponse.data.duration;
        }
      } catch (error) {
        console.warn('Failed to get video duration:', error);
      }
    }
    
    // Step 4: Create asset record in database
    const assetData: UploadAssetRequest = {
      userId,
      streamId,
      name,
      sport,
      competition,
      publicUrl,
      contentType: file.type,
      fileSize: file.size,
      duration
    };
    
    let uploadResponse: UploadAssetResponse;
    switch (assetType) {
      case 'bumper':
        uploadResponse = await uploadBumper(assetData);
        break;
      case 'graphic':
        uploadResponse = await uploadGraphic(assetData);
        break;
      case 'overlay':
        uploadResponse = await uploadOverlay(assetData);
        break;
      default:
        throw new Error('Invalid asset type');
    }
    
    return uploadResponse;
    
  } catch (error) {
    console.error('Complete upload workflow failed:', error);
    throw error;
  }
};
