import React, { useRef, useEffect, useState, useCallback } from 'react';
import videojs from 'video.js';
// import 'video.js/dist/video-js.css';
import dashjs from 'dashjs';
import ZentagThumbnail from "../../assets/images/zentagLogo.png";
import LoadingScreen from '@/layouts/LoadingScreen';
import '@videojs/http-streaming';


if (typeof window !== "undefined") {
  (window as any).videojs = videojs;
}

// Extend Video.js types
declare global {
  interface Window {
    videojs: any;
  }
}
interface VideoPlayerProps {
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onPlayStateChange: (isPlaying: boolean) => void;
  onEnded?: () => void;
  currentTime: number;
  isPlaying: boolean; // Added to control play/pause state
  isLive?: boolean;
  autoplay?: boolean;
  controls?: boolean;
  playbackRate?: number;
  isMuted: boolean,
  poster?: string,
  onPlaybackRateChange?: (rate: number) => void;
  videoUrl?: string; // Added videoUrl prop
  controlBarChildren?: string[]; // Custom control bar children
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  onTimeUpdate,
  onDurationChange,
  onPlayStateChange,
  onEnded,
  currentTime,
  isPlaying,
  isLive = false,
  autoplay = true,
  controls = false,
  playbackRate = 1,
  isMuted,
  poster,
  videoUrl,
  controlBarChildren,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const dashPlayerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Cleanup function
  const cleanup = useCallback(() => {
    // Dispose of DASH player first
    if (dashPlayerRef.current) {
      try {
        dashPlayerRef.current.reset();
        dashPlayerRef.current = null;
      } catch (error) {
        console.warn('Error disposing DASH player:', error);
      }
    }
    
    // Dispose of video.js player
    if (playerRef.current) {
      try {
        playerRef.current.dispose();
        playerRef.current = null;
      } catch (error) {
        console.warn('Error disposing video player:', error);
      }
    }
    
    // Remove custom styles
    const existingStyle = document.getElementById('video-player-custom-styles');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Reset states
    setIsLoading(false);
    setError(null);
    setRetryCount(0);
  }, []);

  // Initialize the player
  useEffect(() => {
    // Don't initialize if no videoUrl
    if (!videoUrl) {
      setError('No video URL provided');
      setIsLoading(false);
      return;
    }

    // Cleanup previous player instance
    cleanup();
    
    setIsLoading(true);
    setError(null);
    setRetryCount(0);
    
    const timeoutId = setTimeout(() => {
      if (videoRef.current && !playerRef.current) {
        // Enhanced video type detection
        const getVideoType = (url: string): string => {
          const extension = url.split('.').pop()?.toLowerCase();
          const urlLower = url.toLowerCase();
          
          // HLS formats
          if (urlLower.includes('.m3u8') || extension === 'm3u8') {
            return 'application/x-mpegURL';
          }
          // DASH formats
          if (urlLower.includes('.mpd') || extension === 'mpd') {
            return 'application/dash+xml';
          }
          // MP4 formats
          if (extension === 'mp4' || extension === 'm4v') {
            return 'video/mp4';
          }
          // WebM formats
          if (extension === 'webm') {
            return 'video/webm';
          }
          // AVI formats
          if (extension === 'avi') {
            return 'video/x-msvideo';
          }
          // MOV formats
          if (extension === 'mov') {
            return 'video/quicktime';
          }
          // MKV formats
          if (extension === 'mkv') {
            return 'video/x-matroska';
          }
          // FLV formats
          if (extension === 'flv') {
            return 'video/x-flv';
          }
          // OGG formats
          if (extension === 'ogv' || extension === 'ogg') {
            return 'video/ogg';
          }
          // Default to MP4
          return 'video/mp4';
        };
        
        const type = getVideoType(videoUrl);

        const videoElement = videoRef.current;

        // Enhanced Video.js configuration with better format support
        const playerOptions = {
          controls: controls,
          autoplay: autoplay,
          muted: autoplay,
          fluid: true, // Makes player responsive
          responsive: true,
          preload: "auto",
          // poster: poster || ZentagThumbnail,
          liveui: true,
          bigPlayButton: false,
          // poster: 'https://api.builder.io/api/v1/image/assets/TEMP/7d5485ed5de61fc3a27970464ae438bfa0722395?width=2139',
          sources: [{ src: videoUrl, type }],
          controlBar: {
            autoHide: false, // Prevents controls from hiding
            children: controlBarChildren || [
              "playToggle",
              "liveDisplay",
              "volumePanel",
              "currentTimeDisplay",
              "timeDivider",
              "durationDisplay",
              "progressControl",
              "remainingTimeDisplay",
              "fullscreenToggle",
            ],
            pictureInPictureToggle: true,
          },
          classes: "vjs-big-play-button-hide",
          // Enhanced HTML5 options for better format support
          html5: {
            vhs: {
              overrideNative: true,
              enableLowInitialPlaylist: true,
              smoothQualityChange: true,
              handleManifestRedirects: true,
              // Better HLS configuration for live streams
              withCredentials: false,
              useCueTags: true,
              allowSeeksWithinUnsafeLiveWindow: true,
              partiallyReloadSourceOnError: true,
              // CORS handling
              xhr: {
                beforeRequest: function(options: any) {
                  // Add CORS headers if needed
                  options.headers = options.headers || {};
                  return options;
                }
              }
            },
            // Use default native track settings to avoid tech warnings
            nativeVideoTracks: true,
            nativeAudioTracks: true,
            nativeTextTracks: true,
          },
          // Enable experimental features for better format support
          experimentalSvgIcons: true,
          // Support for subtitles and captions
          textTrackSettings: false,
          // Better error handling
          techOrder: ['html5'],
          // Playback settings
          playsinline: true,
          crossOrigin: 'anonymous'
        };
        
        playerRef.current = videojs(videoElement, playerOptions);

        const player = playerRef.current;

        // Enhanced format handling with error handling
        if (type === 'application/dash+xml') {
          try {
            // DASH handling with dashjs
            const dashPlayer = dashjs.MediaPlayer().create();
            dashPlayerRef.current = dashPlayer;
            dashPlayer.initialize(videoRef.current, videoUrl, autoplay);
            
            // Add comprehensive error handling for DASH
            dashPlayer.on(dashjs.MediaPlayer.events.ERROR, (e: any) => {
              console.error('DASH playback error:', e);
              setError(`DASH playback error: ${e.error || 'Unknown error'}`);
              
              // Retry logic for live streams
              if (isLive && retryCount < maxRetries) {
                setTimeout(() => {
                  setRetryCount(prev => prev + 1);
                  console.log(`Retrying DASH stream (attempt ${retryCount + 1}/${maxRetries})`);
                  dashPlayer.attachSource(videoUrl);
                }, 2000 * (retryCount + 1)); // Exponential backoff
              } else {
                // Fallback to native video element
                player.src({ src: videoUrl, type: 'video/mp4' });
              }
            });
            
            // Handle stream events for live content
            if (isLive) {
              dashPlayer.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, () => {
                console.log('DASH live stream initialized');
                setError(null);
                setRetryCount(0);
              });
              
              dashPlayer.on(dashjs.MediaPlayer.events.BUFFER_EMPTY, () => {
                console.log('DASH buffer empty - live stream may be reconnecting');
              });
            }
          } catch (error) {
            console.error('DASH initialization failed:', error);
            setError(`DASH initialization failed: ${error}`);
            // Fallback to native video element
            player.src({ src: videoUrl, type: 'video/mp4' });
          }
        } else if (type === 'application/x-mpegURL') {
           // HLS handling - Video.js handles this natively with @videojs/http-streaming
           player.ready(() => {
             console.log('HLS stream ready for playback');
             setError(null);
             setRetryCount(0);
             
             // Add live stream reconnection logic
             if (isLive) {
               player.on('error', () => {
                 const playerError = player.error();
                 if (playerError && retryCount < maxRetries) {
                   console.log(`Retrying HLS live stream (attempt ${retryCount + 1}/${maxRetries})`);
                   setTimeout(() => {
                     setRetryCount(prev => prev + 1);
                     player.src({ src: videoUrl, type });
                     player.load();
                   }, 2000 * (retryCount + 1));
                 }
               });
             }
           });
         }
        
        // Add comprehensive error handling
        player.on('error', (error: any) => {
          console.error('Video playback error:', error);
          const playerError = player.error();
          
          if (playerError) {
            console.error('Player error details:', {
              code: playerError.code,
              message: playerError.message,
              type: playerError.type
            });
            
            setError(`Video playback error: ${playerError.message || 'Unknown error'}`);
            
            // Retry logic for live streams
            if (isLive && retryCount < maxRetries && playerError.code === 4) {
              console.log(`Retrying video load (attempt ${retryCount + 1}/${maxRetries})`);
              setTimeout(() => {
                setRetryCount(prev => prev + 1);
                player.src({ src: videoUrl, type: 'video/mp4' });
                player.load();
              }, 1000 * (retryCount + 1));
            } else if (playerError.code === 4) {
              // MEDIA_ERR_SRC_NOT_SUPPORTED - try with different MIME type
              const fallbackType = type === 'video/mp4' ? 'video/webm' : 'video/mp4';
              console.log(`Trying fallback format: ${fallbackType}`);
              player.src({ src: videoUrl, type: fallbackType });
            }
          }
        });
        
        // Handle subtitle files (SRT, VTT, etc.)
         const convertSrtToVtt = async (srtUrl: string): Promise<string | null> => {
           try {
             const response = await fetch(srtUrl);
             if (!response.ok) return null;
             
             const srtContent = await response.text();
             
             // Convert SRT to VTT format
             let vttContent = 'WEBVTT\n\n';
             
             // SRT format: number, timestamp, text, blank line
             const srtBlocks = srtContent.split('\n\n');
             
             srtBlocks.forEach(block => {
               const lines = block.trim().split('\n');
               if (lines.length >= 3) {
                 // Skip the sequence number (first line)
                 const timestamp = lines[1].replace(/,/g, '.');
                 const text = lines.slice(2).join('\n');
                 vttContent += `${timestamp}\n${text}\n\n`;
               }
             });
             
             // Create blob URL for VTT content
             const blob = new Blob([vttContent], { type: 'text/vtt' });
             return URL.createObjectURL(blob);
           } catch (error) {
             console.error('Error converting SRT to VTT:', error);
             return null;
           }
         };
         
         const addSubtitles = async (videoUrl: string) => {
           // Check for common subtitle file extensions
           const baseUrl = videoUrl.substring(0, videoUrl.lastIndexOf('.'));
           const subtitleFormats = [
             { ext: 'vtt', label: 'English VTT' },
             { ext: 'srt', label: 'English SRT' },
             { ext: 'en.vtt', label: 'English' },
             { ext: 'en.srt', label: 'English' }
           ];
           
           for (let i = 0; i < subtitleFormats.length; i++) {
             const format = subtitleFormats[i];
             const subtitleUrl = `${baseUrl}.${format.ext}`;
             
             try {
               // Check if subtitle file exists
               const response = await fetch(subtitleUrl, { method: 'HEAD' });
               if (response.ok) {
                 let finalUrl = subtitleUrl;
                 
                 // Convert SRT to VTT if needed
                 if (format.ext.includes('srt')) {
                   const vttUrl = await convertSrtToVtt(subtitleUrl);
                   if (vttUrl) {
                     finalUrl = vttUrl;
                   } else {
                     continue; // Skip if conversion failed
                   }
                 }
                 
                 // Add subtitle track
                 player.addRemoteTextTrack({
                   kind: 'subtitles',
                   src: finalUrl,
                   srclang: 'en',
                   label: format.label,
                   default: i === 0
                 }, false);
                 
                 console.log(`Added subtitle track: ${format.label}`);
                 break; // Use the first available subtitle
               }
             } catch (error) {
               // Subtitle file doesn't exist or can't be loaded, continue to next
               console.log(`Subtitle file not found: ${subtitleUrl}`);
             }
           }
         };
        
        // Attempt to add subtitles if available
         if (videoUrl && !videoUrl.includes('.m3u8') && !videoUrl.includes('.mpd')) {
           addSubtitles(videoUrl);
         }
         
         // Log supported formats for debugging
         console.log('VideoPlayer initialized with:', {
           url: videoUrl,
           detectedType: type,
           supportedFormats: [
             'MP4', 'WebM', 'AVI', 'MOV', 'MKV', 'FLV', 'OGG',
             'HLS (M3U8)', 'DASH (MPD)', 'Subtitles (SRT, VTT)'
           ]
         });

        player.ready(() => {
          setIsLoading(false);
          setError(null);
          onDurationChange(player.duration());
          
         
          // --- Restore LIVE label manually for live streams ---
          if (isLive) {
            const liveDisplay = player.controlBar.getChild('LiveDisplay');
            if (liveDisplay) {
              liveDisplay.addClass('vjs-live-label-visible');
            }
            
            // Inject custom CSS to always show "LIVE" for live streams
            const liveStyle = document.createElement('style');
            liveStyle.textContent = `
              .vjs-live-control {
                display: inline-block !important;
                align-items: center;
                gap: 5px;
                // border: 2px solid black;
              }
              .vjs-live-display::before {
                content: '●';
                color: red;
                font-size: 16px;
                margin-right: 4px;
              }
              // .vjs-live-display {
              //   display: inline-block !important;
              //   // font-weight: bold;
              //   color: white;
              //   // text-transform: uppercase;
              //   font-size: 14px;
              //   visibility: visible !important;
              //   opacity: 1 !important;
              // }
              // .video-js.vjs-live .vjs-live-display {
              //   // display: inline-block !important;
              // }
            `;
            document.head.appendChild(liveStyle);
          }
        });

        // Handle successful load events
        player.on('loadstart', () => {
          setIsLoading(true);
          setError(null);
        });
        
        player.on('canplay', () => {
           setIsLoading(false);
           setError(null);
           setRetryCount(0);
         });
         
         // Enhanced live stream handling
         if (isLive) {
           // Handle buffering events for live streams
           player.on('waiting', () => {
             console.log('Live stream buffering...');
           });
           
           player.on('playing', () => {
             console.log('Live stream resumed playing');
             setError(null);
           });
           
           // Handle network errors and connection issues
           player.on('suspend', () => {
             console.log('Live stream suspended - checking connection');
             if (retryCount < maxRetries) {
               setTimeout(() => {
                 console.log('Attempting to resume live stream');
                 player.load();
               }, 3000);
             }
           });
           
           // Monitor live stream health
           player.ready(() => {
             const healthCheckInterval = setInterval(() => {
               if (player && !player.isDisposed() && player.readyState() === 0 && !player.paused()) {
                 console.log('Live stream health check failed - attempting recovery');
                 if (retryCount < maxRetries) {
                   setRetryCount(prev => prev + 1);
                   player.load();
                 }
               }
             }, 10000); // Check every 10 seconds
             
             // Store interval reference for cleanup
             (player as any).healthCheckInterval = healthCheckInterval;
           });
         }

        player.on('timeupdate', () => {
          onTimeUpdate(player.currentTime());
        });

        player.on('durationchange', () => {
          onDurationChange(player.duration());
        });

        player.on('ended', () => {
          if (onEnded) {
            onEnded();
          }
        });
        // player.on('waiting', () => setIsLoading(true)); // Show loader when buffering
        // player.on('playing', () => setIsLoading(false)); // Hide loader when playback starts/resumes
      }
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      if (playerRef.current) {
        // Clear health check interval if it exists
        if ((playerRef.current as any).healthCheckInterval) {
          clearInterval((playerRef.current as any).healthCheckInterval);
        }
        playerRef.current.dispose();
        playerRef.current = null;
      }
      const styles = document.querySelectorAll('style');
      styles.forEach(s => {
        if (s.textContent?.includes('.vjs-big-play-button-hide')) {
          s.remove();
        }
      });
    };
  }, [videoUrl]);


  // Effect to control play/pause state
  useEffect(() => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.play();
      } else {
        playerRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.muted(isMuted);
    }
  }, [isMuted]);

  // Effect to handle seeking
  useEffect(() => {
    if (playerRef.current && Math.abs(playerRef.current.currentTime() - currentTime) > 1) {
      playerRef.current.currentTime(currentTime);
    }
  }, [currentTime]);

  // Effect for playback rate
  useEffect(() => {
    if (playerRef.current && playbackRate) {
      playerRef.current.playbackRate(playbackRate);
    }
  }, [playbackRate]);

  return (
    <div data-vjs-player className="w-full h-full" style={{ position: 'relative' }}>
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          color: 'white',
          fontSize: '16px'
        }}>
          Loading video...
        </div>
      )}
      
      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          color: '#ff6b6b',
          fontSize: '14px',
          textAlign: 'center',
          padding: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderRadius: '4px'
        }}>
          {error}
          {isLive && retryCount < maxRetries && (
            <div style={{ marginTop: '8px', fontSize: '12px' }}>
              Retrying... ({retryCount}/{maxRetries})
            </div>
          )}
        </div>
      )}
      
      <video ref={videoRef} className="video-js vjs-default-skin" playsInline />
    </div>
  );
};

export default VideoPlayer;
