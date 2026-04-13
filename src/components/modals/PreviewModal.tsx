// src/components/PreviewModal.tsx

import React, { useEffect } from 'react';
import Preview_VideoPlayer from '../common/Clip_Preview_VideoPlayer';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { X } from 'lucide-react';
import { downloadFile } from '@/utils/download';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  clipData: {
    id: string;
    title: string;
    timeRange: string;
    duration: string;
    aspectRatio: string;
    rating: number;
    videoUrl?: string;
    poster?: string;
    type?: string;
    fileFormat?: string;
  };
  page: string;
  aspectRatioFilter?: string;
  clip?: any; // Full clip data for accessing editedVideos
  onOverwrite?: () => void;
  onOpenSaveAsNew?: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, clipData, page, aspectRatioFilter, clip, onOverwrite, onOpenSaveAsNew }) => {
  // Function to get the appropriate video URL based on aspect ratio filter
  const getVideoUrl = () => {
    // If aspect ratio filter is active and not 'all', and we have clip data with editedVideos
    if (aspectRatioFilter && aspectRatioFilter !== 'all' && clip?.editedVideos?.length > 0) {
      // Find the editedVideo that matches the aspect ratio filter (excluding DYNAMIC events)
      const matchingEditedVideo = clip.editedVideos.find((editedVideo: any) =>
        editedVideo.aspect_ratio === aspectRatioFilter &&
        editedVideo.event !== 'DYNAMIC' &&
        editedVideo.videoUrl &&
        editedVideo.videoUrl.trim() !== ''
      );

      // Return the videoUrl from the matching editedVideo if found
      if (matchingEditedVideo?.videoUrl) {
        return matchingEditedVideo.videoUrl;
      }
    }

    // Fallback to the original video URL
    return clipData.videoUrl || "";
  };

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

  const handleDownload = async () => {
    try {
      let videoUrl = clipData.videoUrl || '';
      if (aspectRatioFilter && aspectRatioFilter !== 'all' && clip?.editedVideos?.length > 0) {
        const matchingEditedVideo = clip.editedVideos.find((editedVideo: any) =>
          editedVideo.aspect_ratio === aspectRatioFilter &&
          editedVideo.event !== 'DYNAMIC' &&
          editedVideo.videoUrl &&
          editedVideo.videoUrl.trim() !== ''
        );
        if (matchingEditedVideo?.videoUrl) {
          videoUrl = matchingEditedVideo.videoUrl;
        }
      }
      await downloadFile(videoUrl, clipData.title || 'video');
    } catch (error) {
      console.error('Error downloading video:', error);
    }
  };

  // const handleDownload = async () => {
  //   try {
  //     const videoUrl = clipData.videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
  //     const fileName = `${clipData.title || 'video'}.mp4`;

  //     // Try to fetch the video and create a blob for better filename support
  //     try {
  //       const response = await fetch(videoUrl);
  //       if (response.ok) {
  //         const blob = await response.blob();
  //         const url = window.URL.createObjectURL(blob);

  //         const link = document.createElement('a');
  //         link.href = url;
  //         link.download = fileName;
  //         document.body.appendChild(link);
  //         link.click();
  //         document.body.removeChild(link);

  //         // Clean up the blob URL
  //         window.URL.revokeObjectURL(url);
  //       } else {
  //         throw new Error('Failed to fetch video');
  //       }
  //     } catch (fetchError) {
  //       // Fallback to direct link method if fetch fails (e.g., CORS issues)
  //       console.warn('Fetch failed, using direct link method:', fetchError);
  //       const link = document.createElement('a');
  //       link.href = videoUrl;
  //       link.download = fileName;
  //       link.target = '_blank';
  //       document.body.appendChild(link);
  //       link.click();
  //       document.body.removeChild(link);
  //     }
  //   } catch (error) {
  //     console.error('Error downloading video:', error);
  //     // You could add a toast notification here if needed
  //   }
  // };

  const truncateText = (text: string, maxLength: number = 25) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      // <svg key={index} width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline">
      //   <path d="M5.46973 1.32049C5.66167 0.842504 6.33833 0.842503 6.53027 1.32048L7.67669 4.17532C7.75843 4.37886 7.94946 4.51766 8.16831 4.5325L11.2377 4.74062C11.7516 4.77546 11.9607 5.419 11.5654 5.74925L9.20456 7.72175C9.03623 7.86239 8.96327 8.08696 9.01678 8.29968L9.76733 11.2831C9.893 11.7827 9.34557 12.1804 8.90934 11.9065L6.30383 10.2708C6.11807 10.1541 5.88193 10.1541 5.69617 10.2707L3.09066 11.9065C2.65443 12.1804 2.107 11.7827 2.23267 11.2831L2.98322 8.29968C3.03674 8.08696 2.96377 7.86239 2.79544 7.72175L0.434597 5.74925C0.0393227 5.41899 0.24842 4.77546 0.762323 4.74062L3.8317 4.5325C4.05054 4.51766 4.24157 4.37886 4.32331 4.17532L5.46973 1.32049Z" fill={index < clipData.rating ? "#FFF" : "transparent"} stroke={index < clipData.rating ? "transparent" : "#FFF"}/>
      // </svg>
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

  const formatDuration = (duration: string) => {
    const seconds = parseInt(duration);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 preview-modal" onClick={handleOverlayClick}>
      <div className="absolute inset-0 bg-black bg-opacity-90" />
      <div className="relative bg-[#292929] rounded-[50px] border-2 border-[#373737] w-full max-w-4xl max-h-[95vh] flex flex-col">

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-center relative pt-6 pb-4 px-16">
          <Tooltip>
            <TooltipTrigger asChild>
              <h2 className="text-white text-xl sm:text-2xl font-bold leading-tight font-['Montserrat'] text-center">
                {truncateText(clipData.title, 25)}
              </h2>
            </TooltipTrigger>
            <TooltipContent>
              <p>{clipData.title}</p>
            </TooltipContent>
          </Tooltip>
          <button onClick={onClose} className="absolute right-6 top-6 text-white hover:text-gray-300 transition-colors">
           <X size={24} />
          </button>
        </div>

        {/* Badges */}
        {clipData.type !== 'graphic' && clipData.type !== 'bumper' && (
          <div className="flex-shrink-0 flex items-center justify-center flex-wrap gap-3 px-6 pb-4">
            {clipData.timeRange && (
              <div className="bg-black rounded-md px-2 py-1 h-6 flex items-center"><span className="text-white text-xs font-medium">{clipData.timeRange}</span></div>
            )}
            {clipData.rating > 0 && (
              <div className="bg-black rounded-md px-2 py-1 h-6 flex items-center"><div className="flex items-center gap-1">{renderStars(clipData.rating)}<span className="text-white text-xs font-bold">{clipData.rating}</span></div></div>
            )}
            {clipData.aspectRatio && (
              <div className="bg-black rounded-md px-2 py-1 h-6 flex items-center"><span className="text-white text-xs font-medium">{clipData.aspectRatio}</span></div>
            )}
            {clipData.duration && (
              <div className="bg-black rounded-md px-2 py-1 h-6 flex items-center"><span className="text-white text-xs font-medium">{formatDuration(clipData.duration)}</span></div>
            )}
            {clipData.fileFormat && (
              <div className="bg-black rounded-md px-2 py-1 h-6 flex items-center"><span className="text-white text-xs font-medium">{clipData.fileFormat}</span></div>
            )}
          </div>)}

        {/* Video Player Area - FIXED SIZE */}
        <div className="flex-grow flex items-center justify-center px-6 pb-4">
          <div className="relative bg-black w-[700px] h-[394px] max-w-full rounded-lg overflow-hidden border-2 border-gray-800">
            {clipData.type === 'graphic' ? (
              <img src={clipData.poster} alt={clipData.title} className="w-full h-full object-center" />
            ) : (
              <Preview_VideoPlayer
                videoUrl={getVideoUrl()}
                poster={clipData.poster}
                page={page}
              />
            )}
          </div>
        </div>

        {/* Action buttons */}
        {clipData.type !== 'graphic' && clipData.type !== 'bumper' && (
          <div className="flex-shrink-0 flex items-center justify-center gap-4 py-4 sm:pb-6">
            { page === 'clipeditor-page' ? (
              <>
                <button onClick={onOverwrite} className="bg-[#3A3B3E] rounded-xl text-white px-8 py-2 h-10 text-sm font-medium hover:bg-[#4A4B4E] transition-colors min-w-[140px]">
                  Overwrite
                </button>
                <button onClick={onOpenSaveAsNew} className="bg-gradient-to-r from-[#00BBFF] to-[#0051FF] rounded-xl text-white px-8 py-2 h-10 text-sm font-medium hover:opacity-90 transition-opacity min-w-[140px]">
                  Save as New
                </button>
              </>
            ) : (
              <>
                <button onClick={onClose} className="bg-black rounded-xl text-white px-8 py-2 h-10 text-sm font-medium hover:bg-gray-800 transition-colors min-w-[140px]">
                  Cancel
                </button>
                <button onClick={handleDownload} className="bg-gradient-to-r from-[#00BBFF] to-[#0051FF] rounded-xl text-white px-8 py-2 h-10 text-sm font-medium hover:opacity-90 transition-opacity min-w-[140px]">
                  Download
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewModal;
