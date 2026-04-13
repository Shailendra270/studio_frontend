import React, { useEffect } from 'react';

interface FolderData {
  _id: string;
  title: string;
  description?: string;
  aspectRatio: string;
  rating?: number;
  clips?: any[];
  createdAt: string;
  updatedAt: string;
  userId: string;
  streamId: string;
  type: string;
  category?: string;
  previewUrl?: string;
  thumbnailUrl?: string;
}

interface FolderPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderData: FolderData | null;
  isLoading: boolean;
}

const FolderPreviewModal: React.FC<FolderPreviewModalProps> = ({ 
  isOpen, 
  onClose, 
  folderData, 
  isLoading 
}) => {
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleEscapeKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <svg 
        key={index} 
        width="16" 
        height="16" 
        viewBox="0 0 16 16" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className="inline"
      >
        <path 
          d="M7.29297 2.42732C7.48491 1.94934 8.16157 1.94934 8.35351 2.42732L9.49993 5.28216C9.58167 5.48571 9.77269 5.62451 9.99154 5.63935L13.0609 5.84747C13.5748 5.88231 13.784 6.52585 13.3887 6.856L11.0279 8.82851C10.8595 8.96915 10.7866 9.19372 10.8401 9.40644L11.5907 12.3899C11.7163 12.8856 11.1743 13.2743 10.7471 12.9441L8.23607 11.2588C8.04543 11.1382 7.80105 11.1382 7.61041 11.2588L5.09937 12.9441C4.67218 13.2743 4.13022 12.8856 4.25589 12.3899L5.00644 9.40644C5.05995 9.19372 4.98699 8.96915 4.81866 8.82851L2.45782 6.856C2.06252 6.52585 2.27166 5.88231 2.78554 5.84747L5.85494 5.63935C6.07379 5.62451 6.26481 5.48571 6.34655 5.28216L7.29297 2.42732Z" 
          fill={index < rating ? "#FFD700" : "#374151"}
        />
      </svg>
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleOverlayClick}>
      <div className="absolute inset-0 bg-black bg-opacity-90" />
      <div className="relative bg-[#292929] rounded-[50px] border-2 border-[#373737] w-full max-w-2xl max-h-[95vh] flex flex-col">
        
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-[#373737]">
          <h2 className="text-white text-xl sm:text-2xl font-bold leading-tight font-['Montserrat']">
            Folder Details
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00BBFF]"></div>
            </div>
          ) : folderData ? (
            <div className="space-y-6">
              {/* Folder Info */}
              <div className="bg-[#1a1a1a] rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-white text-lg font-semibold">{folderData.title}</h3>
                  {folderData.rating && (
                    <div className="flex items-center space-x-1">
                      {renderStars(folderData.rating)}
                    </div>
                  )}
                </div>
                
                {folderData.description && (
                  <p className="text-gray-300 text-sm">{folderData.description}</p>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Aspect Ratio:</span>
                    <span className="text-white ml-2">{folderData.aspectRatio}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Type:</span>
                    <span className="text-white ml-2 capitalize">{folderData.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Category:</span>
                    <span className="text-white ml-2 capitalize">{folderData.category || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Clips:</span>
                    <span className="text-white ml-2">{folderData.clips?.length || 0}</span>
                  </div>
                </div>
                
                <div className="text-sm">
                  <span className="text-gray-400">Created:</span>
                  <span className="text-white ml-2">{formatDate(folderData.createdAt)}</span>
                </div>
              </div>

              {/* Preview Image/Video */}
              {folderData.previewUrl && (
                <div className="bg-[#1a1a1a] rounded-lg p-4">
                  <h4 className="text-white text-md font-semibold mb-3">Preview</h4>
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video 
                      src={folderData.previewUrl}
                      poster={folderData.thumbnailUrl}
                      controls
                      className="w-full h-64 object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Folder ID */}
              <div className="bg-[#1a1a1a] rounded-lg p-4">
                <h4 className="text-white text-md font-semibold mb-2">Folder ID</h4>
                <div className="bg-[#0a0a0a] rounded p-2 font-mono text-sm text-gray-300 break-all">
                  {folderData._id}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">No folder data available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-center gap-4 p-6 border-t border-[#373737]">
          <button 
            onClick={onClose} 
            className="bg-black rounded-xl text-white px-8 py-2 h-10 text-sm font-medium hover:bg-gray-800 transition-colors min-w-[140px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FolderPreviewModal;