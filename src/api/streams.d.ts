export const createStream: (streamData: Record<string, unknown>) => Promise<any>;
export const getStreams: (params?: Record<string, unknown>) => Promise<any>;
export const getStreamById: (streamId: string) => Promise<any>;
export const uploadFileToGCP: (uploadUrl: string, file: File | Blob) => Promise<any>;
export const deleteStream: (streamId: string) => Promise<any>;
export const updateStream: (streamId: string, updateData: Record<string, unknown>) => Promise<any>;
export const createStreamWithUpload: (streamData: Record<string, unknown>, videoFile: File | Blob) => Promise<any>;
export const endStream: (streamId: string) => Promise<any>;
