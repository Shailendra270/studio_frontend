import React from "react";

interface VideoControlsProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isMuted: boolean;
  isFullscreen: boolean;
  onPlayPause: () => void;
  onMuteToggle: () => void;
  onFullscreenToggle: () => void;
  onSeek: (time: number) => void;
  formatTime: (time: number) => string;
  maxWidth?: string;
}

const VideoControls: React.FC<VideoControlsProps> = ({
  currentTime,
  duration,
  isPlaying,
  isMuted,
  isFullscreen,
  onPlayPause,
  onMuteToggle,
  onFullscreenToggle,
  onSeek,
  formatTime,
  maxWidth = '900px'
}) => {
  const handleSeek = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(x / rect.width, 1));
    const newTime = Math.floor(percentage * duration);
    onSeek(newTime);
  };

  return (
    <div className="px-6 py-1 bg-[#18191B] flex-shrink-0">
      <div className="flex justify-center">
        <div className="w-full" style={{ maxWidth }}>
          <div className="bg-black rounded-lg p-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3 text-white text-sm font-montserrat">
                <button
                  onClick={onPlayPause}
                  className="text-white hover:text-[#00EEFF] transition-colors p-1"
                >
                  {isPlaying ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
                <span>{formatTime(currentTime)}</span>
                <span>/</span>
                <span>{formatTime(duration)}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onMuteToggle}
                  className="text-white hover:text-[#00EEFF] transition-colors"
                >
                  {isMuted ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={onFullscreenToggle}
                  className="text-white hover:text-[#00EEFF] transition-colors"
                >
                  {isFullscreen ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                    </svg>
                  )}
                </button>
                <button className="text-white hover:text-[#00EEFF] transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="relative">
              <div
                className="w-full h-1 bg-gray-600 rounded-full cursor-pointer group"
                onClick={handleSeek}
              >
                <div
                  className="h-1 bg-white rounded-full relative transition-all duration-150"
                  style={{ width: `${Math.max(0, Math.min((currentTime / duration) * 100, 100))}%` }}
                >
                  <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg cursor-grab border border-gray-300 hover:scale-110 transition-transform group-hover:scale-110"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoControls;
