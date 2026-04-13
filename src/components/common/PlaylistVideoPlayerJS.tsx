import React, { useState, useEffect, useCallback } from "react";
import VideoPlayer from "./VideoPlayer";

interface PlaylistVideoPlayerJSProps {
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

const PlaylistVideoPlayerJS: React.FC<PlaylistVideoPlayerJSProps> = ({ 
  clips, 
  poster, 
  page, 
  onTimeUpdate, 
  onDurationChange,
  onCurrentClipChange 
}) => {
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [clipDuration, setClipDuration] = useState(0);

  // Reset to first clip when clips array changes (reorder)
  useEffect(() => {
    if (clips.length === 0) return;
    
    setCurrentClipIndex(0);
    setCurrentTime(0);
    
    // Notify parent about current clip change
    if (onCurrentClipChange) {
      onCurrentClipChange(clips[0].id);
    }
  }, [clips, onCurrentClipChange]);

  // Handle time updates from VideoPlayer
  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
    if (onTimeUpdate) {
      onTimeUpdate(time);
    }
  }, [onTimeUpdate]);

  // Handle duration change from VideoPlayer
  const handleDurationChange = useCallback((duration: number) => {
    setClipDuration(duration);
    if (onDurationChange) {
      onDurationChange(duration);
    }
  }, [onDurationChange]);

  // Handle play state changes from VideoPlayer
  const handlePlayStateChange = useCallback((playing: boolean) => {
    setIsPlaying(playing);
  }, []);

  // Handle video ended - move to next clip
  const handleVideoEnded = useCallback(() => {
    setCurrentClipIndex(prevIndex => {
      const nextIndex = prevIndex < clips.length - 1 ? prevIndex + 1 : 0;
      setCurrentTime(0);
      if (onCurrentClipChange) {
        onCurrentClipChange(clips[nextIndex].id);
      }
      return nextIndex;
    });
  }, [clips, onCurrentClipChange]);

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
      <VideoPlayer
        videoUrl={currentClip.videoUrl}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleDurationChange}
        onPlayStateChange={handlePlayStateChange}
        onEnded={handleVideoEnded}
        currentTime={currentTime}
        isPlaying={isPlaying}
        autoplay={true}
        controls={true}
        isMuted={false}
        playbackRate={1}
      />
      
      {/* Playlist indicator */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm z-10">
        {currentClipIndex + 1} / {clips.length}: {currentClip.title}
      </div>
    </div>
  );
};

export default PlaylistVideoPlayerJS;