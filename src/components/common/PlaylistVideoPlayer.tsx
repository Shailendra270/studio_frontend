import React, { useRef, useEffect, useState } from "react";
import ZentagThumbnail from "../../assets/images/zentagLogo.png";

interface PlaylistVideoPlayerProps {
  clips: Array<{
    id: string;
    videoUrl: string;
    title: string;
  }>;
  poster?: string;
  page: string;
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  onCurrentClipChange?: (clipId: string) => void;
}

const PlaylistVideoPlayer: React.FC<PlaylistVideoPlayerProps> = ({ 
  clips, 
  poster, 
  page, 
  onTimeUpdate, 
  onDurationChange,
  onCurrentClipChange 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Reset to first clip when clips array changes (reorder)
  useEffect(() => {
    if (clips.length === 0) return;
    
    setCurrentClipIndex(0);
    setCurrentTime(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
    // Notify parent about current clip change
    if (onCurrentClipChange) {
      onCurrentClipChange(clips[0].id);
    }
  }, [clips, onCurrentClipChange]);

  // Handle video ended - move to next clip
  const handleVideoEnded = () => {
    if (currentClipIndex < clips.length - 1) {
      const nextIndex = currentClipIndex + 1;
      setCurrentClipIndex(nextIndex);
      if (onCurrentClipChange) {
        onCurrentClipChange(clips[nextIndex].id);
      }
    } else {
      // Playlist finished, restart from beginning
      setCurrentClipIndex(0);
      setCurrentTime(0);
      if (onCurrentClipChange) {
        onCurrentClipChange(clips[0].id);
      }
    }
  };

  // Handle time updates
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      if (onTimeUpdate) {
        onTimeUpdate(time);
      }
    }
  };

  // Handle duration change
  const handleLoadedMetadata = () => {
    if (videoRef.current && onDurationChange) {
      const duration = videoRef.current.duration;
      onDurationChange(duration);
    }
  };

  // Handle play/pause state
  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  // Get current clip
  const currentClip = clips[currentClipIndex];

  if (!currentClip) {
    return (
      <div className="w-full h-full bg-gray-900 flex items-center justify-center text-white">
        <p>No clips available</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        src={currentClip.videoUrl}
        className="w-full h-full object-cover"
        controls
        autoPlay={true}
        // poster={page === "clips" ? poster : ZentagThumbnail}
        playsInline
        preload="auto"
        controlsList="nodownload"
        onEnded={handleVideoEnded}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handlePlay}
        onPause={handlePause}
      >
        <p>Your browser does not support HTML5 video.</p>
      </video>
      
      {/* Playlist indicator */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm">
        {currentClipIndex + 1} / {clips.length}: {currentClip.title}
      </div>
    </div>
  );
};

export default PlaylistVideoPlayer;