// src/components/Preview_VideoPlayer.tsx

import React, { useRef, useEffect } from "react";
import ZentagThumbnail from "../../assets/images/zentagLogo.png";

interface Preview_VideoPlayerProps {
  videoUrl: string;
  poster?: string;
  page: string;
  playing?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  controls?: boolean;
  width?: string | number;
  height?: string | number;
  onProgress?: (progress: { playedSeconds: number; played: number }) => void;
  onDuration?: (duration: number) => void;
  loop?: boolean;
}

const Preview_VideoPlayer: React.FC<Preview_VideoPlayerProps> = ({ 
  videoUrl, 
  poster, 
  page,
  playing = true,
  onPlay,
  onPause,
  onEnded,
  controls = true,
  width = "100%",
  height = "100%",
  onProgress,
  onDuration,
  loop = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle playing state
  useEffect(() => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.play().catch(console.error);
      } else {
        videoRef.current.pause();
      }
    }
  }, [playing]);

  // Handle video events
  const handlePlay = () => {
    onPlay?.();
  };

  const handlePause = () => {
    onPause?.();
  };

  const handleEnded = () => {
    onEnded?.();
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && onProgress) {
      const currentTime = videoRef.current.currentTime;
      const duration = videoRef.current.duration || 0;
      const played = duration > 0 ? currentTime / duration : 0;
      onProgress({
        playedSeconds: currentTime,
        played: played
      });
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && onDuration) {
      onDuration(videoRef.current.duration);
    }
  };

  // console.log(videoUrl, poster, page);
  return (
    <video
      ref={videoRef}
      src={videoUrl}
      className="w-full h-full object-contain"
      controls={controls}
      // poster={page === "clips" ? poster : ZentagThumbnail}
      playsInline
      preload="auto"
      // muted
      controlsList="nodownload"
      loop={loop}
      onPlay={handlePlay}
      onPause={handlePause}
      onEnded={handleEnded}
      onTimeUpdate={handleTimeUpdate}
      onLoadedMetadata={handleLoadedMetadata}
      style={{ width, height }}
    >
      <p>Your browser does not support HTML5 video.</p>
    </video>
  );
};

export default Preview_VideoPlayer;
