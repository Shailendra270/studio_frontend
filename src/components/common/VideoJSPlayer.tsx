// import React, { useEffect, useRef, useCallback, useState } from 'react';
// import videojs from 'video.js';
// import ZentagThumbnail from "../../assets/images/zentagLogo.png";
// // Load Video.js plugins dynamically on client to avoid global checks in SSR/early eval
// import './VideoJSPlayer.css';

// // Extend VideoJS types for plugins
// declare module 'video.js' {
//   interface VideoJsPlayer {
//     playlist: {
//       (items?: any[]): any[];
//       currentItem(): number;
//       next(): void;
//       previous(): void;
//       first(): void;
//       last(): void;
//       autoadvance(delay?: number): void;
//     };
//     overlay: (options: any) => void;
//   }
// }

// interface VideoJSPlayerProps {
//   playlist: string[];
//   currentIndex?: number;
//   poster?: string;
//   autoPlay?: boolean;
//   controls?: boolean;
//   width?: string | number;
//   height?: string | number;
//   className?: string;
//   clipDurations?: number[];
//   totalDuration?: number;
//   loop?: boolean;
//   muted?: boolean;
//   volume?: number;
//   playbackRates?: number[];
//   fluid?: boolean;
//   responsive?: boolean;
//   aspectRatio?: string;
//   qualitySelector?: boolean;
//   hotkeys?: boolean;
//   contextMenu?: boolean;
//   pip?: boolean;
//   chromecast?: boolean;
//   overlays?: Array<{
//     content: string;
//     start: number;
//     end: number;
//     align?: string;
//     showBackground?: boolean;
//   }>;
//   onVideoChange?: (index: number, url: string) => void;
//   onProgress?: (progress: { playedSeconds: number; played: number; loadedSeconds: number; loaded: number }) => void;
//   onDuration?: (duration: number) => void;
//   onPlay?: () => void;
//   onPause?: () => void;
//   onEnded?: () => void;
//   onReady?: () => void;
//   onError?: (error: any) => void;
//   onSeek?: (seconds: number) => void;
//   onVolumeChange?: (volume: number) => void;
// }

// const VideoJSPlayer: React.FC<VideoJSPlayerProps> = ({
//   playlist = [],
//   currentIndex = 0,
//   poster,
//   autoPlay = false,
//   controls = true,
//   width = '100%',
//   height = '100%',
//   className = '',
//   clipDurations = [],
//   totalDuration = 0,
//   loop = false,
//   muted = false,
//   volume = 1,
//   playbackRates = [0.5, 1, 1.25, 1.5, 2],
//   fluid = true,
//   responsive = true,
//   aspectRatio = '16:9',
//   qualitySelector = true,
//   hotkeys = true,
//   contextMenu = false,
//   pip = true,
//   chromecast = false,
//   overlays = [],
//   onVideoChange,
//   onProgress,
//   onDuration,
//   onPlay,
//   onPause,
//   onEnded,
//   onReady,
//   onError,
//   onSeek,
//   onVolumeChange,
// }) => {
//   const videoRef = useRef<HTMLDivElement>(null);
//   const playerRef = useRef<videojs.VideoJsPlayer | null>(null);
//   const [isReady, setIsReady] = useState(false);
//   const [currentVideoIndex, setCurrentVideoIndex] = useState(currentIndex);

//   // Initialize VideoJS player
//   useEffect(() => {
//     if (!videoRef.current || playerRef.current) return;

//     const videoElement = document.createElement('video-js');
//     videoElement.classList.add('vjs-default-skin');
//     videoRef.current.appendChild(videoElement);

//     const player = videojs(videoElement, {
//       controls,
//       autoplay: autoPlay,
//       preload: 'auto',
//       poster,
//       fluid: true,
//       responsive: true,
//       fill: true,
//       muted,
//       volume,
//       playbackRates,
//       width: '100%',
//       height: '100%',
//       html5: {
//         vhs: {
//           overrideNative: true,
//           enableLowInitialPlaylist: false,
//           smoothQualityChange: false,
//           useBandwidthFromLocalStorage: false,
//           allowSeeksWithinUnsafeLiveWindow: true,
//           partiallyReloadSourceOnError: true,
//         },
//         nativeAudioTracks: false,
//         nativeVideoTracks: false,
//       },
//       techOrder: ['html5'],
//       liveui: false,
//       enableSmoothSeeking: false,
//       experimentalSvgIcons: false,
//       userActions: {
//         hotkeys: hotkeys ? {
//           volumeStep: 0.1,
//           seekStep: 5,
//           enableModifiersForNumbers: false,
//         } : false,
//       },
//       contextmenu: contextMenu,
//       pip: pip ? {
//         enabled: true,
//       } : false,
//     });

//     playerRef.current = player;

//     // Ensure plugins that expect global videojs can attach
//     if (typeof window !== 'undefined') {
//       (window as any).videojs = videojs;
//     }

//     // Dynamically load plugins only in the browser, then mark ready
//     const setupPluginsAndReady = async () => {
//       try {
//         if (typeof window !== 'undefined') {
//           await Promise.all([
//             import('videojs-playlist/dist/videojs-playlist.es.js'),
//             import('videojs-overlay/dist/videojs-overlay.es.js'),
//           ]);
//         }
//       } catch (e) {
//         console.warn('Video.js plugin load failed:', e);
//       }

//       player.ready(() => {
//         setIsReady(true);
//         onReady?.();
//       });
//     };

//     setupPluginsAndReady();

//     return () => {
//       if (playerRef.current && !playerRef.current.isDisposed()) {
//         playerRef.current.dispose();
//         playerRef.current = null;
//       }
//     };
//   }, []);

//   // Setup playlist functionality
//   useEffect(() => {
//     if (!playerRef.current || !isReady || playlist.length === 0) return;

//     const player = playerRef.current;

//     // Helper function to determine video type from URL
//     const getVideoType = (url: string): string => {
//       const extension = url.split('.').pop()?.toLowerCase();
//       switch (extension) {
//         case 'm3u8':
//           return 'application/x-mpegURL';
//         case 'mp4':
//           return 'video/mp4';
//         case 'webm':
//           return 'video/webm';
//         case 'ogg':
//           return 'video/ogg';
//         case 'mov':
//           return 'video/quicktime';
//         case 'avi':
//           return 'video/x-msvideo';
//         case 'mkv':
//           return 'video/x-matroska';
//         default:
//           // Try to detect HLS streams by URL pattern
//           if (url.includes('m3u8') || url.includes('hls')) {
//             return 'application/x-mpegURL';
//           }
//           return 'video/mp4'; // Default fallback
//       }
//     };

//     // Create playlist items
//     const playlistItems = playlist.map((url, index) => ({
//       sources: [{
//         src: url,
//         type: getVideoType(url),
//       }],
//       poster: poster,
//       name: `Video ${index + 1}`,
//       duration: clipDurations[index] || 0,
//     }));

//     // Check if playlist has changed to avoid unnecessary reinitialization
//     const currentPlaylist = player.playlist();
//     const playlistChanged = !currentPlaylist || currentPlaylist.length !== playlistItems.length || 
//       (currentPlaylist && currentPlaylist.some((item: any, index: number) => 
//         item.sources[0]?.src !== playlistItems[index]?.sources[0]?.src
//       ));

//     if (playlistChanged) {
//       // Initialize playlist only if it has changed
//       player.playlist(playlistItems);
//       player.playlist.autoadvance(0); // Disable auto advance initially

      
//       // Set current item
//       if (currentVideoIndex < playlistItems.length) {
//         player.playlist.currentItem(currentVideoIndex);
//       }
//     }

//     return () => {
//       // Cleanup playlist
//       if (player && !player.isDisposed()) {
//         try {
//           // Don't clear playlist on cleanup to prevent flickering
//           // player.playlist([]);
//         } catch (e) {
//           console.warn('Error clearing playlist:', e);
//         }
//       }
//     };
//   }, [playlist, isReady, poster, clipDurations]);

//   // Setup overlays
//   useEffect(() => {
//     if (!playerRef.current || !isReady || overlays.length === 0) return;

//     const player = playerRef.current;

//     const overlayOptions = {
//       overlays: overlays.map(overlay => ({
//         content: overlay.content,
//         start: overlay.start,
//         end: overlay.end,
//         align: overlay.align || 'top-left',
//         showBackground: overlay.showBackground !== false,
//       })),
//     };

//     player.overlay(overlayOptions);

//     return () => {
//       // Cleanup overlays if needed
//       if (player && !player.isDisposed()) {
//         try {
//           player.overlay({ overlays: [] });
//         } catch (e) {
//           console.warn('Error clearing overlays:', e);
//         }
//       }
//     };
//   }, [overlays, isReady]);

//   // Event listeners
//   useEffect(() => {
//     if (!playerRef.current || !isReady) return;

//     const player = playerRef.current;
//     let lastProgressUpdate = 0;
//     const PROGRESS_THROTTLE_MS = 100; // Throttle progress updates to 10fps

//     const handlePlay = () => {
//       onPlay?.();
//     };

//     const handlePause = () => {
//       onPause?.();
//     };

//     const handleTimeUpdate = () => {
//       const now = Date.now();
//       if (now - lastProgressUpdate < PROGRESS_THROTTLE_MS) {
//         return; // Skip this update to prevent flickering
//       }
      
//       lastProgressUpdate = now;
//       const currentTime = player.currentTime();
//       const duration = player.duration();
      
//       if (duration > 0) {
//         onProgress?.({
//           playedSeconds: currentTime,
//           played: currentTime / duration,
//           loadedSeconds: currentTime,
//           loaded: currentTime / duration,
//         });
//       }
//     };

//     const handleDurationChange = () => {
//       const duration = player.duration();
//       if (duration > 0) {
//         onDuration?.(duration);
//       }
//     };

//     const handleEnded = () => {
//       onEnded?.();
      
//       // Handle playlist advancement
//       const currentItem = player.playlist.currentItem();
//       const playlistLength = player.playlist().length;
      
//       if (currentItem < playlistLength - 1) {
//         // Move to next video
//         player.playlist.next();
//         const newIndex = player.playlist.currentItem();
//         setCurrentVideoIndex(newIndex);
//         onVideoChange?.(newIndex, playlist[newIndex]);
//       } else if (loop) {
//         // Loop back to first video
//         player.playlist.first();
//         setCurrentVideoIndex(0);
//         onVideoChange?.(0, playlist[0]);
//       }
//     };

//     const handleError = (error: any) => {
//       console.error('VideoJS Player Error:', error);
//       onError?.(error);
//     };

//     const handleSeeked = () => {
//       const currentTime = player.currentTime();
//       onSeek?.(currentTime);
//     };

//     const handleVolumeChange = () => {
//       const volume = player.volume();
//       onVolumeChange?.(volume);
//     };

//     // Add event listeners
//     player.on('play', handlePlay);
//     player.on('pause', handlePause);
//     player.on('timeupdate', handleTimeUpdate);
//     player.on('durationchange', handleDurationChange);
//     player.on('ended', handleEnded);
//     player.on('error', handleError);
//     player.on('seeked', handleSeeked);
//     player.on('volumechange', handleVolumeChange);

//     return () => {
//       if (player && !player.isDisposed()) {
//         player.off('play', handlePlay);
//         player.off('pause', handlePause);
//         player.off('timeupdate', handleTimeUpdate);
//         player.off('durationchange', handleDurationChange);
//         player.off('ended', handleEnded);
//         player.off('error', handleError);
//         player.off('seeked', handleSeeked);
//         player.off('volumechange', handleVolumeChange);
//       }
//     };
//   }, [isReady, onPlay, onPause, onProgress, onDuration, onEnded, onError, onSeek, onVolumeChange, playlist, loop, onVideoChange]);

//   // Handle external currentIndex changes
//   useEffect(() => {
//     if (!playerRef.current || !isReady || currentIndex === currentVideoIndex) return;

//     const player = playerRef.current;
//     const playlistLength = player.playlist().length;
    
//     if (currentIndex >= 0 && currentIndex < playlistLength) {
//       player.playlist.currentItem(currentIndex);
//       setCurrentVideoIndex(currentIndex);
//       onVideoChange?.(currentIndex, playlist[currentIndex]);
//     }
//   }, [currentIndex, isReady, currentVideoIndex, playlist, onVideoChange]);

//   // Handle volume changes
//   useEffect(() => {
//     if (!playerRef.current || !isReady) return;
    
//     const player = playerRef.current;
//     player.volume(volume);
//     player.muted(muted);
//   }, [volume, muted, isReady]);

//   // Public methods via ref
//   const getPlayer = useCallback(() => {
//     return playerRef.current;
//   }, []);

//   const play = useCallback(() => {
//     if (playerRef.current && !playerRef.current.isDisposed()) {
//       playerRef.current.play();
//     }
//   }, []);

//   const pause = useCallback(() => {
//     if (playerRef.current && !playerRef.current.isDisposed()) {
//       playerRef.current.pause();
//     }
//   }, []);

//   const seekTo = useCallback((seconds: number) => {
//     if (playerRef.current && !playerRef.current.isDisposed()) {
//       playerRef.current.currentTime(seconds);
//     }
//   }, []);

//   const setVolume = useCallback((vol: number) => {
//     if (playerRef.current && !playerRef.current.isDisposed()) {
//       playerRef.current.volume(vol);
//     }
//   }, []);

//   const nextVideo = useCallback(() => {
//     if (playerRef.current && !playerRef.current.isDisposed()) {
//       const player = playerRef.current;
//       player.playlist.next();
//       const newIndex = player.playlist.currentItem();
//       setCurrentVideoIndex(newIndex);
//       onVideoChange?.(newIndex, playlist[newIndex]);
//     }
//   }, [playlist, onVideoChange]);

//   const previousVideo = useCallback(() => {
//     if (playerRef.current && !playerRef.current.isDisposed()) {
//       const player = playerRef.current;
//       player.playlist.previous();
//       const newIndex = player.playlist.currentItem();
//       setCurrentVideoIndex(newIndex);
//       onVideoChange?.(newIndex, playlist[newIndex]);
//     }
//   }, [playlist, onVideoChange]);

//   // Remove the incorrect useImperativeHandle implementation
//   // Methods can be accessed via ref if needed in the future

//   return (
//     <div 
//       className={`videojs-player-wrapper ${className}`}
//       style={{ 
//         width: '100%',
//         height: '100%',
//         position: 'relative',
//         overflow: 'hidden',
//       }}
//     >
//       <div 
//         ref={videoRef} 
//         className="videojs-player-container"
//         style={{ 
//           width: '100%', 
//           height: '100%',
//           position: 'relative',
//         }}
//       />
//     </div>
//   );
// };

// export default VideoJSPlayer;
// export type { VideoJSPlayerProps };