import React, { useCallback, useEffect, useRef, useState } from 'react';
import PreviewModal from '@/components/modals/PreviewModal';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const TIMELINE_SECONDS_TO_PIXELS_RATIO = 3;
const DEFAULT_MAJOR_MARKER_INTERVAL = 30;
const DEFAULT_MINOR_TICK_INTERVAL = 5;

interface TimelineProps {
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  isClipping?: boolean;
  clipStartTime?: number | null;
  clipEndTime?: number | null;
  isLive?: boolean;
  unsavedClips?: Array<{startTime: number; endTime: number; title: string; id: string}>;
  onAddUnsavedClip?: (clip: {startTime: number; endTime: number; title: string; id: string}) => void;
  onUnsavedClipClick?: (clip: {startTime: number; endTime: number; title: string; id: string}) => void;
  clips?: any[];
  majorMarkerIntervalSeconds?: number;
  minorTickIntervalSeconds?: number;
  secondsToPixelsRatio?: number;
}

export const Timeline: React.FC<TimelineProps> = ({
  duration,
  currentTime,
  onSeek,
  isClipping = false,
  clipStartTime = null,
  clipEndTime = null,
  isLive = false,
  unsavedClips = [],
  onAddUnsavedClip,
  onUnsavedClipClick,
  clips = [],
  majorMarkerIntervalSeconds = DEFAULT_MAJOR_MARKER_INTERVAL,
  minorTickIntervalSeconds = DEFAULT_MINOR_TICK_INTERVAL,
  secondsToPixelsRatio = TIMELINE_SECONDS_TO_PIXELS_RATIO,
}) => {
  // State for PreviewModal
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedClipForPreview, setSelectedClipForPreview] = useState<any>(null);
  const [selectedClipData, setSelectedClipData] = useState<any>(null);
  
  // State for local clipping mode
  const [isClippingMode, setIsClippingMode] = useState(false);
  const [tempClipStartTime, setTempClipStartTime] = useState<number | null>(null);
  // const [clipCount, setClipCount] = useState(1);

  // Handler for opening preview modal
  const handleClipClick = (clip: any) => {
    // Format clip data for PreviewModal
    const clipData = {
      id: clip.id || clip._id || '',
      title: clip.title || `Clip ${clip.id}`,
      timeRange: `${formatTime(clip.start_time || 0)} - ${formatTime(clip.end_time || 0)}`,
      duration: ((clip.end_time || 0) - (clip.start_time || 0)).toString(),
      aspectRatio: clip.aspectRatio || '16:9',
      rating: clip.rating || 0,
      videoUrl: clip.videoUrl || clip.videoUrl,
      poster: clip.thumbnailUrl || (clip.thumbnails && clip.thumbnails.length > 0 ? clip.thumbnails[0] : null),
      type: 'clip'
    };

    setSelectedClipForPreview(clipData);
    setSelectedClipData(clip);
    setIsPreviewModalOpen(true);
  };

  // Handler for closing preview modal
  const handleClosePreviewModal = () => {
    setIsPreviewModalOpen(false);
    setSelectedClipForPreview(null);
    setSelectedClipData(null);
  };

  // Cut clips functionality - simplified
  const startCutClip = useCallback(() => {
    if (!isClippingMode) {
      // Start clipping
      setIsClippingMode(true);
      setTempClipStartTime(currentTime);
    } else {
      // End clipping and create unsaved clip
      if (tempClipStartTime !== null && onAddUnsavedClip) {
        const newUnsavedClip = {
          id: `unsaved_${Date.now()}`,
          title: `Clip`,
          startTime: tempClipStartTime,
          endTime: currentTime
        };
        
        onAddUnsavedClip(newUnsavedClip);
        // setClipCount(prev => prev + 1);
        setIsClippingMode(false);
        setTempClipStartTime(null);
      }
    }
  }, [isClippingMode, currentTime, tempClipStartTime, onAddUnsavedClip]);

  // Handler for clicking on unsaved clips
  const handleUnsavedClipClick = useCallback((clip: any) => {
    if (onUnsavedClipClick) {
      onUnsavedClipClick(clip);
    }
  }, [onUnsavedClipClick]);

  // Keyboard shortcut for creating clips (Ctrl+C)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        startCutClip();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [startCutClip]);

  // Helper function to convert HH:MM:SS to seconds
  const timeStringToSeconds = (timeString: string): number => {
    if (typeof timeString === 'number') return timeString;
    if (!timeString || typeof timeString !== 'string') return 0;
    
    const parts = timeString.split(':');
    if (parts.length !== 3) return 0;
    
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    const seconds = parseInt(parts[2], 10) || 0;
    
    return hours * 3600 + minutes * 60 + seconds;
  };
  
  // Combine completed and processing clips for timeline display
  const timelineClips = (clips || []).map(clip => ({
    ...clip,
    start_time: timeStringToSeconds(clip.start_time),
    end_time: timeStringToSeconds(clip.end_time),
    // Ensure duration is available for width calculation
    duration: clip.duration || (timeStringToSeconds(clip.end_time) - timeStringToSeconds(clip.start_time))
  })).filter(clip => clip.start_time !== undefined && clip.end_time !== undefined);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const timelineWidth = isLive ? 
    Math.max(currentTime * secondsToPixelsRatio, 1000) :
    duration * secondsToPixelsRatio;

  // --- MOUSE DRAG HANDLERS ---
  const handleSeekInteraction = useCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent> | MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    
    // For live videos, calculate time based on currentTime, for recorded videos use duration
    const maxTime = isLive ? currentTime : duration;
    if (!maxTime) return;
    
    const newTime = (clickX / timelineRef.current.offsetWidth) * maxTime;
    onSeek(Math.max(0, Math.min(maxTime, newTime)));
  }, [duration, currentTime, isLive, onSeek]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (isPreviewModalOpen) return;
    setIsDragging(true);
    handleSeekInteraction(e);
  }, [handleSeekInteraction, isPreviewModalOpen]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    handleSeekInteraction(e);
  }, [isDragging, handleSeekInteraction]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const progressPosition = isLive ? 
    // For live videos, progress position is at the end (currentTime)
    (currentTime / Math.max(currentTime, 1)) * timelineWidth :
    // For recorded videos, calculate based on currentTime/duration
    (currentTime / duration) * timelineWidth;

  return (
    // The main container's width is now determined by the video duration
    <div
      className="relative h-[120px] sm:h-[173px] bg-[#18191B]"
      style={{ width: `${timelineWidth}px`, minWidth: '100%' }}
      ref={timelineRef}
      onMouseDown={handleMouseDown}
    >
      {/* --- Time Markers and Ticks --- */}
      {/* For live videos, show markers from start to current time */}
      {Array.from({
        // For live videos, show markers from 0 to currentTime
        // For recorded videos, use full duration but ensure it's a valid length
        length: isLive ? 
          // Show markers from 0 to currentTime for live videos
          Math.max(1, Math.floor(currentTime / minorTickIntervalSeconds) + 1) : 
          // For recorded videos, use full duration but ensure it's a valid length
          Math.max(0, Math.min(10000, Math.floor(duration / minorTickIntervalSeconds) + 1))
      }).map((_, index) => {
        // For live videos, start from 0 and go up to currentTime
        // For recorded videos, start from 0 and go up to duration
        const timeInSeconds = index * minorTickIntervalSeconds;
        
        // Ensure timeInSeconds doesn't go below 0
        const validTimeInSeconds = Math.max(0, timeInSeconds);
        const positionX = validTimeInSeconds * secondsToPixelsRatio;
        const isMajorMarker = validTimeInSeconds % Math.max(1, Math.floor(majorMarkerIntervalSeconds)) === 0;

        return (
          <React.Fragment key={`marker-${timeInSeconds}`}>
            {/* Major Time Label */}
            {isMajorMarker && (
              <div
                className="absolute text-white text-[12px] font-medium font-montserrat text-center cursor-pointer"
                style={{
                  left: `${positionX}px`,
                  transform: 'translateX(-50%)',
                  top: '2px'
                }}
              >
                {formatTime(validTimeInSeconds)}
              </div>
            )}
            {/* Tick Markers */}
            <div
              className={`absolute bg-white`}
              style={{
                left: `${positionX}px`,
                width: '1px',
                top: isMajorMarker ? '30px' : '35px',
                height: isMajorMarker ? '8px' : '3px',
              }}
            />
          </React.Fragment>
        );
      })}

      {/* Interactive timeline area with unsaved clips */}
      <div className="absolute w-full h-10 top-10 sm:top-12 cursor-pointer">
        {/* Semi-transparent background overlay */}
        <div className="absolute w-full h-full bg-black bg-opacity-80"/>
        
        {/* Unsaved Clips Display Area - Visual gradient boxes positioned in timeline area */}
        {unsavedClips.map((clip, index) => {
          const startPos = clip.startTime * secondsToPixelsRatio;
          const clipWidth = Math.max(20, (clip.endTime - clip.startTime) * secondsToPixelsRatio);
          
          return (
            <div
              key={clip.id}
              className="absolute h-full cursor-pointer hover:opacity-90 transition-opacity z-30"
              style={{
                left: `${startPos}px`,
                width: `${clipWidth}px`,
              }}
              onClick={() => handleUnsavedClipClick(clip)}
            >
              {/* Gradient clip box matching the image style */}
              <div 
                className="relative w-full h-full rounded-sm flex items-center border border-blue-300"
                style={{
                  background: 'linear-gradient(90deg, #00BBFF 0%, #0051FF 100%)',
                  opacity: 0.9
                }}
              >
                {/* Clip label - only show if width is sufficient */}
                {clipWidth > 40 && (
                  <span className="text-white text-xs font-medium truncate px-1">
                    {clip.title}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Current Clipping Mode Indicator - Using props from parent */}
        {(isClipping && clipStartTime !== null) && (
          <div 
            className="absolute h-full pointer-events-none z-25"
            style={{
              left: `${clipStartTime * secondsToPixelsRatio}px`,
              width: `${Math.max(0, currentTime - clipStartTime) * secondsToPixelsRatio}px`,
              background: 'linear-gradient(90deg, #FF6B6B 0%, #FF8E53 100%)',
              opacity: 0.7,
              border: '2px dashed #FF6B6B'
            }}
          />
        )}
        
        {/* Local Clipping Mode Indicator - Using local state */}
        {isClippingMode && tempClipStartTime !== null && (
          <div 
            className="absolute h-full pointer-events-none z-25"
            style={{
              left: `${tempClipStartTime * secondsToPixelsRatio}px`,
              width: `${Math.max(0, currentTime - tempClipStartTime) * secondsToPixelsRatio}px`,
              background: 'linear-gradient(90deg, #00BBFF 0%, #0051FF 100%)',
              opacity: 0.7,
              border: '2px dashed #00BBFF'
            }}
          />
        )}
      </div>

      {/* --- Clips Area --- */}
      <div className="absolute w-full h-20 top-[65px] sm:top-[93px] cursor-pointer bg-black bg-opacity-80">
        {timelineClips.map((clip, index) => {
          const startPos = (clip.start_time || 0) * secondsToPixelsRatio;
          const clipWidth = ((clip.end_time || 0) - (clip.start_time || 0)) * secondsToPixelsRatio;
          const isProcessing = clip.clipStatus === 'PROCESSING' || clip.clipStatus === 'PENDING' || clip.status === 'processing' || clip.status === 'pending';
          
          // Get thumbnail URL - prioritize thumbnailUrl, then first thumbnail from array
          const thumbnailUrl = clip.thumbnailUrl || (clip.thumbnails && clip.thumbnails.length > 0 ? clip.thumbnails[0] : null);

          return (
            <div 
              key={clip.id || clip._id || index} 
              className="absolute h-20 top-0 cursor-pointer hover:opacity-90 transition-opacity" 
              style={{ left: `${startPos}px`, width: `${clipWidth}px` }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                handleClipClick(clip);
              }}
            >
              <div className="relative w-full h-20 rounded-lg overflow-hidden">
                {/* Clip thumbnail */}
                <div className="absolute w-full h-[52px] top-7 left-0 bg-gray-700 rounded-b-lg overflow-hidden">
                  {thumbnailUrl ? (
                    <img 
                      className="w-full h-full object-cover" 
                      alt={`${clip.title} thumbnail`} 
                      src={thumbnailUrl.trim()}
                      onError={(e) => {
                        // Fallback to a default thumbnail or hide image
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Border - different color for processing clips */}
                <div className={`absolute inset-0 rounded-lg border-[1.5px] ${
                  isProcessing ? 'border-yellow-400' : 'border-[#00BBFF]'
                }`} />
                
                {/* Processing overlay */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                    <div className="text-white text-xs font-medium">
                      {clip.progress ? `${parseFloat((clip.progress || 0).toFixed(2))}%` : 'Processing...'}
                    </div>
                  </div>
                )}
                
                {/* Clip title and AI indicator */}
                <div className="absolute w-full top-2 left-0 flex items-center justify-center">
                  {/* AI indicator - show for completed clips with AI features */}
                  {clip.isAiCreated && (
                    <span className="inline-block w-2.5 h-2.5">
                      <svg viewBox="0 0 12 12" fill="none" className="w-full h-full">
                        <path d="M10.1921 5.17633C6.9612 5.85234 6.18828 6.62526 5.51227 9.85614C5.47214 10.0479 5.1997 10.0479 5.15957 9.85614C4.48355 6.62526 3.71063 5.85234 0.479752 5.17633C0.287999 5.1362 0.287999 4.86376 0.479752 4.82363C3.71063 4.14761 4.48355 3.3747 5.15957 0.143814C5.1997 -0.047938 5.47214 -0.047938 5.51227 0.143814C6.18828 3.3747 6.9612 4.14761 10.1921 4.82363C10.3839 4.86376 10.3839 5.1362 10.1921 5.17633Z" fill="url(#paint0_linear_timeline)" />
                        <defs>
                          <linearGradient id="paint0_linear_timeline" x1="19.6189" y1="5.05929" x2="5.63888" y2="-8.92056" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#00EEFF" />
                            <stop offset="1" stopColor="#0051FF" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </span>
                  )}
                  <span 
                    className="text-white text-[10px] font-medium font-montserrat truncate px-1"
                    title={clip.title || `Clip ${index + 1}`}
                  >
                    {clip.title || `Clip ${index + 1}`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Left side icons */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="absolute w-3.5 h-[13px] top-10 sm:top-12 left-0 bg-white flex items-center justify-center cursor-default"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="w-2 h-2 relative">
              <div className="absolute w-px h-2 bg-black left-1/2 top-0 transform -translate-x-1/2" />
              <div className="absolute w-2 h-px bg-black left-0 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Clips in Queue</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="absolute w-3.5 h-[13px] top-[65px] sm:top-[93px] left-0 bg-white flex items-center justify-center cursor-default"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <svg className="w-3 h-2.5" viewBox="0 0 15 13" fill="none">
              <path d="M1.19141 3.12109H2.82129L4.45117 0.298828H7.05469L5.4248 3.12109H7.05469L8.68457 0.298828H11.2881L9.6582 3.12109H11.2881L12.918 0.298828H13.4111C13.7978 0.298828 14.1113 0.613344 14.1113 1V12.2988C14.11 12.4839 14.036 12.661 13.9053 12.792C13.7743 12.9231 13.5964 12.9975 13.4111 12.999H0.700195C0.514549 12.9988 0.33631 12.9253 0.205078 12.7939C0.0738749 12.6626 4.40797e-05 12.4845 0 12.2988V1C0.00129059 0.814793 0.0752134 0.636936 0.206055 0.505859C0.337019 0.374763 0.514897 0.300306 0.700195 0.298828H2.82129L1.19141 3.12109ZM6.24805 8.34473L4.7041 6.80078L3.76465 7.74023L5.75684 9.73242L6.20508 10.1797L6.67285 9.75391L10.3262 6.43359L9.87891 5.94238L9.43262 5.45117L6.24805 8.34473Z" fill="black" />
            </svg>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Final Clips</p>
        </TooltipContent>
      </Tooltip>

      {/* --- Current Time Playhead --- */}
      <div
        className="absolute w-0.5 h-full top-0 bg-white z-20 pointer-events-none"
        style={{
          left: `${progressPosition}px`,
          transform: 'translateX(-50%)'
        }}
      />

      {/* Clip Creation Button */}
      {/* <div className="absolute bottom-2 right-4 z-30">
        <button
          onClick={startCutClip}
          className={`px-4 py-2 rounded-md text-white font-medium transition-all duration-200 ${
            isClippingMode 
              ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          title={isClippingMode ? 'Click to end clip' : 'Click to start clip (Ctrl+C)'}
        >
          {isClippingMode ? 'End Clip' : 'Create Clip'}
        </button>
      </div> */}

      {/* Unsaved Clips Counter */}
      {/* {unsavedClips.length > 0 && (
        <div className="absolute top-2 right-4 z-30">
          <div className="bg-purple-600 text-white px-2 py-1 rounded-md text-xs font-medium">
            Unsaved: {unsavedClips.length}
          </div>
        </div>
      )} */}

      {/* Preview Modal */}
      {selectedClipForPreview && (
        <PreviewModal
          isOpen={isPreviewModalOpen}
          onClose={handleClosePreviewModal}
          clipData={selectedClipForPreview}
          aspectRatioFilter="all"
          clip={selectedClipData}
          page="live-video"
        />
      )}
    </div>
  );
};

export default Timeline;
