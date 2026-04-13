import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import ReactPlayer from "react-player";
import moment from "moment";
import { Rnd } from "react-rnd";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { useGraphics } from "../../contexts/GraphicsContext";
import { useOverlays } from "../../contexts/OverlaysContext";
import styles from "./reactVideoPlayer.module.css";

interface ReactVideoPlayerProps {
  playlist: string[];
  currentIndex?: number;
  poster?: string;
  autoPlay?: boolean;
  controls?: boolean;
  width?: string | number;
  height?: string | number;
  className?: string;
  aspectRatio?: string;
  clipDurations?: number[];
  totalDuration?: number;
  timelineControl?: boolean;
  timeline?: Array<{
    videoUrl: string;
    videoUrl480P?: string;
    duration: string | number;
    type: string;
    clipId?: string;
  }>;
  timeLineDuration?: number;
  seekTime?: number;
  videoStart?: number;
  showOverlay?: boolean;
  selectedOverlay?: {
    url: string;
    webmUrl?: string;
  };
  soundFlag?: boolean;
  singleAudio?: {
    audioUrl: string;
    duration: number;
  };
  intensity?: number;
  videoIntensity?: number;
  onVideoChange?: (currentIndex: number, url: string) => void;
  onProgress?: (progress: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => void;
  onDuration?: (duration: number) => void;
  onEnded?: () => void;
  onReady?: () => void;
  onSeekChange?: (seekTime: number) => void;
  onVideoStart?: (videoStart: number) => void;
  muted?: boolean;
  volume?: number;
  playbackRate?: number;
  loop?: boolean;
  isGenerating?: boolean;
  generationProgress?: number;
  generationStatus?: string;
}

const ReactVideoPlayer: React.FC<ReactVideoPlayerProps> = ({
  playlist,
  currentIndex: externalCurrentIndex,
  poster,
  autoPlay = false,
  controls = true,
  width = "100%",
  height = "100%",
  className = "",
  aspectRatio = "16:9",
  clipDurations = [],
  totalDuration = 0,
  timelineControl = false,
  timeline = [],
  timeLineDuration = 0,
  seekTime = 0,
  videoStart = 0,
  showOverlay = false,
  selectedOverlay,
  soundFlag = false,
  singleAudio,
  intensity = 0,
  videoIntensity = 0,
  onVideoChange,
  onProgress,
  onDuration,
  onEnded,
  onReady,
  onSeekChange,
  onVideoStart,
  muted = false,
  volume = 1,
  playbackRate = 1,
  loop = true,
  isGenerating = false,
  generationProgress = 0,
  generationStatus = "Processing...",
}) => {
  const [currentIndex, setCurrentIndex] = useState(externalCurrentIndex || 0);
  const [isPlaying, setIsPlaying] = useState(() => (timelineControl ? true : autoPlay));
  const [isMuted, setIsMuted] = useState(muted);
  const [currentVolume, setCurrentVolume] = useState(volume);
  const [duration, setDuration] = useState(0);
  const [played, setPlayed] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [seeking, setSeeking] = useState(false);
  //  const [seekTime, setSeekTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [cumulativeTime, setCumulativeTime] = useState(0);
  const [hasEnded, setHasEnded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);
  const [hasError, setHasError] = useState(false);
  // Timeline control states
  const [finalDuration, setFinalDuration] = useState(0);
  const [volumeState, setVolumeState] = useState(1);
  const [currentVideoUrl, setCurrentVideoUrl] = useState("");
  const [currentSeekTime, setCurrentSeekTime] = useState(seekTime);
  const [currentVideoStart, setCurrentVideoStart] = useState(videoStart);
  const [showOverLay, setShowOverLay] = useState(showOverlay);
  const playerRef = useRef<HTMLVideoElement | null>(null);
  const expectedSrcRef = useRef<string>("");
  const pendingSeekTimeRef = useRef<number | null>(null);
  const isSwitchingSrcRef = useRef<boolean>(true);
  const loadingIndicatorTimeoutRef = useRef<number | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const {
    graphicsState,
    setDragPosition,
    setResizeData,
    setCoordinatePercentages,
    setImageCoordinates,
    updatePositionIndicator: updateGraphicsPositionIndicator,
  } = useGraphics();
  const {
    overlaysState,
    setOverlayDragPosition,
    setOverlayResizeData,
    setOverlayCoordinatePercentages,
    setOverlayCoordinates,
    updatePositionIndicator: updateOverlayPositionIndicator,
  } = useOverlays();

  // Video overlay format detection
  const getOverlayUrl = () => {
    if (!selectedOverlay) return null;
    const patt1 = /(\.[0-9a-z]+)(?=[?#])|(\.[0-9a-z]+$)/gim;
    const webUrl = selectedOverlay?.url?.match(patt1);
    return webUrl?.[0] === ".mp4" ? selectedOverlay?.url : selectedOverlay?.webmUrl;
  };

  // Audio synchronization function
  const handleAudio = useCallback((audioDuration: number) => {
    //React-player seekbar change, then audio will also change according to duration.
    if (timelineControl && soundFlag) {
      const audio = document.getElementById("timeline-audio") as HTMLAudioElement;
      if (audio) {
        audio.currentTime = audioDuration;
        if (audioDuration < (singleAudio?.duration || 0) && isPlaying) {
          audio.play();
        }
      }
    }
  }, [timelineControl, soundFlag, isPlaying, singleAudio?.duration]);
  // Handle mute functionality - removed duplicate, keeping useCallback version below

  // Calculate total duration from clipDurations or use prop
  const calculatedTotalDuration = useMemo(() => {
    if (clipDurations && clipDurations.length > 0) {
      return clipDurations.reduce((sum, duration) => sum + duration, 0);
    }
    return totalDuration;
  }, [clipDurations, totalDuration]);

  const handleVideoPlayer = useCallback((val: number) => {
    // Handle seekBar of highlight video
    let timeDuration = 0;
    let lastDuration = 0;
    let videoStart1 = 0;
    for (let object in timeline) {
      if (typeof timeline[object]?.duration !== "number") {
        timeDuration = timeDuration + moment.duration(timeline[object]?.duration).asMinutes();
        lastDuration = moment.duration(timeline[object]?.duration).asMinutes();
      } else {
        timeDuration = timeDuration + timeline[object]?.duration;
        lastDuration = timeline[object]?.duration;
      }
      if (timeDuration > val) {
        videoStart1 = parseInt(object);
        break;
      }
    }
    let finalDuration = timeDuration - lastDuration;
    setFinalDuration(finalDuration);
    setCurrentVideoStart(videoStart1);
    setDuration(val);
    handleAudio(val); //set audio duration similar to video
    setCurrentSeekTime(val + lastDuration - timeDuration);
    if (currentVideoStart === videoStart1) {
      if (playerRef.current) {
        playerRef.current.currentTime = Math.max(0, val + lastDuration - timeDuration);
      }
    }
    onSeekChange?.(val);
  }, [timeline, currentVideoStart, handleAudio, onSeekChange]);

  // Calculate cumulative time from previous clips
  const getCumulativeTimeBeforeCurrentVideo = useCallback(() => {
    if (!clipDurations || clipDurations.length === 0) return 0;
    return clipDurations.slice(0, currentIndex).reduce((sum, duration) => sum + duration, 0);
  }, [clipDurations, currentIndex]);

  useEffect(() => {
    expectedSrcRef.current = currentVideoUrl || playlist[currentIndex] || "";
  }, [currentVideoUrl, playlist, currentIndex]);

  useEffect(() => {
    if (!isLoading) {
      if (loadingIndicatorTimeoutRef.current !== null) {
        window.clearTimeout(loadingIndicatorTimeoutRef.current);
        loadingIndicatorTimeoutRef.current = null;
      }
      setShowLoadingIndicator(false);
      return;
    }

    if (loadingIndicatorTimeoutRef.current !== null) return;
    loadingIndicatorTimeoutRef.current = window.setTimeout(() => {
      loadingIndicatorTimeoutRef.current = null;
      setShowLoadingIndicator(true);
    }, 250);
  }, [isLoading]);

  // Calculate total cumulative time (time from start of playlist)
  const getTotalCumulativeTime = useMemo(() => {
    const timeBeforeCurrent = getCumulativeTimeBeforeCurrentVideo();
    const currentVideoTime = Number.isFinite(currentTime) ? currentTime : 0;
    const totalTime = timeBeforeCurrent + currentVideoTime;
    return isNaN(totalTime) ? 0 : totalTime;
  }, [getCumulativeTimeBeforeCurrentVideo, currentTime]);

  // Convert cumulative time to video index and local time
  const getCumulativeTimePosition = useCallback((cumulativeSeconds: number) => {
    if (!clipDurations || clipDurations.length === 0) {
      return { videoIndex: 0, localTime: 0 };
    }

    let accumulatedTime = 0;
    for (let i = 0; i < clipDurations.length; i++) {
      const videoDuration = clipDurations[i];
      if (cumulativeSeconds <= accumulatedTime + videoDuration) {
        return {
          videoIndex: i,
          localTime: cumulativeSeconds - accumulatedTime
        };
      }
      accumulatedTime += videoDuration;
    }

    // If time exceeds total duration, return last video
    return {
      videoIndex: clipDurations.length - 1,
      localTime: clipDurations[clipDurations.length - 1] || 0
    };
  }, [clipDurations]);

  // Timeline control functions
  const handleOnended = useCallback(() => {
    // Function call after end of one clip out of total clip
    setCurrentVideoStart(currentVideoStart + 1);
    setFinalDuration(duration);
  }, [currentVideoStart, duration]);

  // Handle video ended
  const handleEnded = useCallback(() => {
    if (timelineControl) {
      handleOnended();
    } else if (currentIndex < playlist.length - 1) {
      const nextIndex = currentIndex + 1;
      pendingSeekTimeRef.current = 0;
      isSwitchingSrcRef.current = true;
      const timeBeforeNext = clipDurations?.length ? clipDurations.slice(0, nextIndex).reduce((s, d) => s + (d || 0), 0) : 0;
      setCurrentIndex(nextIndex);
      setCurrentVideoUrl(playlist[nextIndex] || "");
      setIsPlaying(true);
      setPlayed(0);
      setCumulativeTime(timeBeforeNext);
      setHasEnded(false);
      onVideoChange?.(nextIndex, playlist[nextIndex]);
    } else if (loop) {
      if (playlist.length <= 1) {
        pendingSeekTimeRef.current = 0;
        setIsPlaying(true);
        setPlayed(0);
        setCurrentTime(0);
        setCumulativeTime(0);
        setHasEnded(false);
        if (playerRef.current) {
          playerRef.current.currentTime = 0;
          playerRef.current.play().catch(() => undefined);
        }
      } else {
        pendingSeekTimeRef.current = 0;
        isSwitchingSrcRef.current = true;
        const timeBeforeFirst = 0;
        setCurrentIndex(0);
        setCurrentVideoUrl(playlist[0] || "");
        setIsPlaying(true);
        setPlayed(0);
        setCumulativeTime(timeBeforeFirst);
        setHasEnded(false);
        onVideoChange?.(0, playlist[0]);
      }
    } else {
      setIsPlaying(false);
      setHasEnded(true);
    }
    onEnded?.();
  }, [timelineControl, handleOnended, currentIndex, playlist, loop, clipDurations, onVideoChange, onEnded]);



  const handleTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (seeking) return;
    if (isSwitchingSrcRef.current) return;

    const el = e.currentTarget;
    const playedSeconds = Number.isFinite(el.currentTime) ? el.currentTime : 0;
    const totalSeconds = Number.isFinite(el.duration) ? el.duration : duration;

    let loadedSeconds = 0;
    try {
      const buffered = el.buffered;
      if (buffered && buffered.length > 0) {
        loadedSeconds = buffered.end(buffered.length - 1);
      }
    } catch {
      loadedSeconds = 0;
    }

    setCurrentTime(playedSeconds);
    if (Number.isFinite(totalSeconds) && totalSeconds > 0) {
      setPlayed(Math.min(Math.max(playedSeconds / totalSeconds, 0), 1));
    }

    const timeBeforeCurrent = getCumulativeTimeBeforeCurrentVideo();
    const newCumulativeTime = (isNaN(timeBeforeCurrent) ? 0 : timeBeforeCurrent) + playedSeconds;
    setCumulativeTime(isNaN(newCumulativeTime) ? 0 : newCumulativeTime);

    onProgress?.({
      played: Number.isFinite(totalSeconds) && totalSeconds > 0 ? playedSeconds / totalSeconds : 0,
      playedSeconds,
      loaded: Number.isFinite(totalSeconds) && totalSeconds > 0 ? loadedSeconds / totalSeconds : 0,
      loadedSeconds,
    });
  }, [seeking, duration, getCumulativeTimeBeforeCurrentVideo, onProgress]);

  const handleDurationChange = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const el = e.currentTarget;
    const nextDuration = Number.isFinite(el.duration) ? el.duration : 0;
    if (isSwitchingSrcRef.current && (!Number.isFinite(nextDuration) || nextDuration <= 0)) return;
    setDuration(nextDuration);
    setCurrentTime((prev) => {
      if (!Number.isFinite(nextDuration) || nextDuration <= 0) return prev;
      if (!Number.isFinite(prev) || prev < 0) return 0;
      return Math.min(prev, nextDuration);
    });
    onDuration?.(nextDuration);
  }, [onDuration]);

  // Play/Pause toggle
  const handlePlayPause = useCallback(() => {
    if (hasEnded) {
      // Restart from beginning if video has ended
      setCurrentIndex(0);
      setPlayed(0);
      setCumulativeTime(0);
      setHasEnded(false);
      setIsPlaying(true);
      onVideoChange?.(0, playlist[0]);
      // Seek to beginning after a short delay
      setTimeout(() => {
        if (playerRef.current) {
          playerRef.current.currentTime = 0;
        }
      }, 100);
    } else {
      setIsPlaying(prev => !prev);
    }
  }, [hasEnded, playlist, onVideoChange]);

  // Mute toggle
  const handleMuteToggle = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  // Timeline-specific video controls
  const handlePlayVideo = useCallback(() => {
    setIsPlaying(true);
    if (soundFlag) {
      const audio = document.getElementById("timeline-audio") as HTMLAudioElement;
      if (audio) audio.play();
    }
  }, [soundFlag]);

  const handlePauseVideo = useCallback(() => {
    setIsPlaying(false);
    if (soundFlag) {
      const audio = document.getElementById("timeline-audio") as HTMLAudioElement;
      if (audio) audio.pause();
    }
  }, [soundFlag]);

  const handleContainerClick = useCallback((e?: React.MouseEvent) => {
    if ((e?.target as HTMLElement)?.closest('[data-player-control]')) {
      return;
    }
    if (timelineControl) {
      if (isPlaying) {
        handlePauseVideo();
      } else {
        handlePlayVideo();
      }
      return;
    }
    handlePlayPause();
  }, [timelineControl, isPlaying, handlePauseVideo, handlePlayVideo, handlePlayPause]);

  const handleForward = useCallback(() => {
    // Move video forward
    if (timelineControl) {
      if (duration >= timeLineDuration) {
        handleOnended();
      } else {
        handleVideoPlayer(duration + 5);
        handleAudio(duration + 5);
      }
    } else {
      if (playerRef.current) {
        playerRef.current.currentTime = Math.max(0, (playerRef.current.currentTime || 0) + 5);
      }
    }
  }, [timelineControl, duration, timeLineDuration, handleOnended, handleVideoPlayer, handleAudio]);

  const handleBackward = useCallback(() => {
    // Move video backward
    if (timelineControl) {
      if (duration - 5 <= 0) {
        handleVideoPlayer(0);
        handleAudio(0);
      } else {
        handleVideoPlayer(duration - 5);
        handleAudio(duration - 5);
      }
    } else {
      if (playerRef.current) {
        playerRef.current.currentTime = Math.max(0, (playerRef.current.currentTime || 0) - 5);
      }
    }
  }, [timelineControl, duration, handleVideoPlayer, handleAudio]);

  const handleMute = useCallback(() => {
    // Mute the video
    if (!isMuted) {
      setIsMuted(true);
      setVolumeState(0);
    } else {
      setIsMuted(false);
      setVolumeState(1);
    }
  }, [isMuted]);

  // Drag handler for image overlay
  const onDrag = useCallback((e: any, d: any) => {
    if (typeof d?.deltaX === 'number' && typeof d?.deltaY === 'number') {
      if (Math.abs(d.deltaX) + Math.abs(d.deltaY) < 1) {
        return;
      }
    }
    if (playerContainerRef.current) {
      const containerRect = playerContainerRef.current.getBoundingClientRect();
      const prevWPer =
        ((graphicsState.x2Coordinate || graphicsState.imageCoordinates[4] || 0) -
          (graphicsState.x1Coordinate || graphicsState.imageCoordinates[2] || 0)) || 0;
      const prevHPer =
        ((graphicsState.y2Coordinate || graphicsState.imageCoordinates[5] || 0) -
          (graphicsState.y1Coordinate || graphicsState.imageCoordinates[3] || 0)) || 0;
      const x1Per = (d.x / containerRect.width) * 100;
      const y1Per = (d.y / containerRect.height) * 100;
      const x2Per = x1Per + prevWPer;
      const y2Per = y1Per + prevHPer;

      setDragPosition(d.x, d.y);
      setCoordinatePercentages(x1Per, y1Per, x2Per, y2Per);
      setImageCoordinates([0, 0, x1Per, y1Per, x2Per, y2Per]);
      updateGraphicsPositionIndicator();
    }
  }, [setDragPosition, setCoordinatePercentages, graphicsState.x1Coordinate, graphicsState.x2Coordinate, graphicsState.y1Coordinate, graphicsState.y2Coordinate, graphicsState.imageCoordinates]);

  // Resize handler for image overlay
  const onResizeFun = useCallback((e: any, direction: any, ref: any, delta: any, position: any) => {
    if (delta && delta.width === 0 && delta.height === 0) {
      return;
    }
    if (playerContainerRef.current) {
      const containerRect = playerContainerRef.current.getBoundingClientRect();
      const newWidth = ref.offsetWidth;
      const newHeight = ref.offsetHeight;
      const x1Per = (position.x / containerRect.width) * 100;
      const y1Per = (position.y / containerRect.height) * 100;
      const x2Per = ((position.x + newWidth) / containerRect.width) * 100;
      const y2Per = ((position.y + newHeight) / containerRect.height) * 100;

      setResizeData(newWidth, newHeight, position.x, position.y);
      setCoordinatePercentages(x1Per, y1Per, x2Per, y2Per);
      setImageCoordinates([0, 0, x1Per, y1Per, x2Per, y2Per]);
      updateGraphicsPositionIndicator();
    }
  }, [setResizeData, setCoordinatePercentages]);

  // Drag handler for overlay
  const onOverlayDrag = useCallback((e: any, d: any) => {
    if (typeof d?.deltaX === 'number' && typeof d?.deltaY === 'number') {
      if (Math.abs(d.deltaX) + Math.abs(d.deltaY) < 1) {
        return;
      }
    }
    if (playerContainerRef.current) {
      const containerRect = playerContainerRef.current.getBoundingClientRect();
      const prevWPer =
        ((overlaysState.x2Coordinate || overlaysState.overlayCoordinates[4] || 0) -
          (overlaysState.x1Coordinate || overlaysState.overlayCoordinates[2] || 0)) || 0;
      const prevHPer =
        ((overlaysState.y2Coordinate || overlaysState.overlayCoordinates[5] || 0) -
          (overlaysState.y1Coordinate || overlaysState.overlayCoordinates[3] || 0)) || 0;
      const x1Per = (d.x / containerRect.width) * 100;
      const y1Per = (d.y / containerRect.height) * 100;
      const x2Per = x1Per + prevWPer;
      const y2Per = y1Per + prevHPer;

      setOverlayDragPosition(d.x, d.y);
      setOverlayCoordinatePercentages(x1Per, y1Per, x2Per, y2Per);
      setOverlayCoordinates([0, 0, x1Per, y1Per, x2Per, y2Per]);
      updateOverlayPositionIndicator();
    }
  }, [setOverlayDragPosition, setOverlayCoordinatePercentages, overlaysState.x1Coordinate, overlaysState.x2Coordinate, overlaysState.y1Coordinate, overlaysState.y2Coordinate, overlaysState.overlayCoordinates]);

  // Resize handler for overlay
  const onOverlayResize = useCallback((e: any, direction: any, ref: any, delta: any, position: any) => {
    if (delta && delta.width === 0 && delta.height === 0) {
      return;
    }
    if (playerContainerRef.current) {
      const containerRect = playerContainerRef.current.getBoundingClientRect();
      const newWidth = ref.offsetWidth;
      const newHeight = ref.offsetHeight;
      const x1Per = (position.x / containerRect.width) * 100;
      const y1Per = (position.y / containerRect.height) * 100;
      const x2Per = ((position.x + newWidth) / containerRect.width) * 100;
      const y2Per = ((position.y + newHeight) / containerRect.height) * 100;

      setOverlayResizeData(newWidth, newHeight, position.x, position.y);
      setOverlayCoordinatePercentages(x1Per, y1Per, x2Per, y2Per);
      setOverlayCoordinates([0, 0, x1Per, y1Per, x2Per, y2Per]);
      updateOverlayPositionIndicator();
    }
  }, [setOverlayResizeData, setOverlayCoordinatePercentages]);

  // Seek to specific time (unified seek bar)
  const handleSeekChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const targetCumulativeTime = parseFloat(e.target.value);
    if (!Number.isFinite(targetCumulativeTime)) return;
    const position = getCumulativeTimePosition(targetCumulativeTime);

    // Update cumulative time immediately for smooth UI
    setCumulativeTime(targetCumulativeTime);
    setSeeking(true);
    setCurrentTime(position.localTime);

    // If we need to switch videos
    if (position.videoIndex !== currentIndex) {
      pendingSeekTimeRef.current = Math.max(0, position.localTime);
      isSwitchingSrcRef.current = true;
      setCurrentIndex(position.videoIndex);
      setCurrentVideoUrl(playlist[position.videoIndex] || "");
      setIsPlaying(true);
      onVideoChange?.(position.videoIndex, playlist[position.videoIndex]);
      // Set played position for the new video
      const newVideoPlayed = clipDurations[position.videoIndex] > 0
        ? position.localTime / clipDurations[position.videoIndex]
        : 0;
      setPlayed(newVideoPlayed);
    } else {
      // Same video, just update played position
      const newPlayed = duration > 0 ? position.localTime / duration : 0;
      setPlayed(newPlayed);
      if (playerRef.current) {
        playerRef.current.currentTime = Math.max(0, position.localTime);
      }
    }
  }, [getCumulativeTimePosition, currentIndex, onVideoChange, playlist, clipDurations, duration]);

  const handleSeekEnd = useCallback((e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    const targetCumulativeTime = parseFloat((e.target as HTMLInputElement).value);
    if (!Number.isFinite(targetCumulativeTime)) return;
    const position = getCumulativeTimePosition(targetCumulativeTime);

    // Seek to the calculated position
    if (position.videoIndex === currentIndex) {
      // Same video, seek to local time
      if (playerRef.current) {
        playerRef.current.currentTime = Math.max(0, position.localTime);
      }
    } else {
      pendingSeekTimeRef.current = Math.max(0, position.localTime);
    }

    setSeeking(false);
  }, [getCumulativeTimePosition, currentIndex]);

  // Skip to previous video
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);




      setPlayed(0);


      setHasEnded(false);


      onVideoChange?.(prevIndex, playlist[prevIndex]);
    }
  }, [currentIndex, playlist, onVideoChange]);


  // Skip to next video
  const handleNext = useCallback(() => {
    if (currentIndex < playlist.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);




      setPlayed(0);


      setHasEnded(false);


      onVideoChange?.(nextIndex, playlist[nextIndex]);
    }
  }, [currentIndex, playlist, onVideoChange]);


  // Format time
  const formatTime = useCallback((seconds: number) => {
    if (isNaN(seconds) || seconds < 0 || !isFinite(seconds)) {
      return '0:00';
    }
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    if (hh) {
      return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
    }
    return `${mm}:${ss}`;
  }, []);

  // Handle mouse movement for controls visibility
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    if (isPlaying) {
      setShowControls(false);
    }
  }, [isPlaying]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Reset played state when video changes
  useEffect(() => {
    setPlayed(0);
    setHasEnded(false);
    // Update cumulative time when video changes
    const timeBeforeCurrent = getCumulativeTimeBeforeCurrentVideo();
    setCumulativeTime(isNaN(timeBeforeCurrent) ? 0 : timeBeforeCurrent);
  }, [currentVideoUrl]);

  // Initialize cumulative time on mount
  useEffect(() => {
    const initialCumulativeTime = getTotalCumulativeTime;
    setCumulativeTime(isNaN(initialCumulativeTime) ? 0 : initialCumulativeTime);
  }, [getTotalCumulativeTime]);

  // Ensure cumulativeTime is never NaN
  useEffect(() => {
    if (isNaN(cumulativeTime)) {
      setCumulativeTime(0);
    }
  }, [cumulativeTime]);

  // Handle external currentIndex changes (e.g. user clicked a timeline clip)
  useEffect(() => {
    if (externalCurrentIndex !== undefined && externalCurrentIndex !== currentIndex) {
      setCurrentIndex(externalCurrentIndex);
      setPlayed(0);
      setHasEnded(false);
      // Reset duration so progress uses the new clip's duration once it loads
      setDuration(0);
      // Update seek bar position immediately to start of selected clip
      const timeBefore = clipDurations?.length
        ? clipDurations.slice(0, externalCurrentIndex).reduce((s, d) => s + (d || 0), 0)
        : 0;
      setCumulativeTime(timeBefore);
      // Seek to beginning of new video once URL has switched
      const t = setTimeout(() => {
        if (playerRef.current) {
          playerRef.current.currentTime = 0;
        }
      }, 150);
      return () => clearTimeout(t);
    }
  }, [externalCurrentIndex, currentIndex, clipDurations]);

  // Timeline control effects
  // useEffect(() => {
  //   // Playing multiple video back 2 back
  //   if (currentVideoStart === null) return;
  //   if (currentVideoStart < timeline?.length) {
  //     const newUrl = timeline[currentVideoStart]?.videoUrl480P || timeline[currentVideoStart]?.videoUrl;
  //     setCurrentVideoUrl(newUrl);
  //   } else {
  //     setFinalDuration(0);
  //     setCurrentVideoStart(0);
  //     const firstUrl = timeline[0]?.videoUrl480P || timeline[0]?.videoUrl;
  //     setCurrentVideoUrl(firstUrl);
  //     if (timelineControl) {
  //       setDuration(0);
  //       if (soundFlag) {
  //         handleAudio(0);
  //       }
  //     }
  //   }
  // }, [currentVideoStart, timeline, timelineControl, soundFlag, handleAudio]);

  useEffect(() => {
    // Play timeline video Then audio will start from 0
    if (timelineControl) {
      setFinalDuration(0);
      if (soundFlag) {
        const audio = document.getElementById("timeline-audio") as HTMLAudioElement;
        if (audio && singleAudio) {
          audio.volume = (intensity || 0) / 100;
          audio.play();
        }
      }
    }
    setIsPlaying(true);
  }, [timelineControl, soundFlag, singleAudio, intensity]);

  useEffect(() => {
    // Showing preview timeline according selected aspect ratio
    if (timelineControl && playerRef?.current) {
      playerRef.current.style.objectFit = "cover";
    }
  }, [timelineControl]);

  useEffect(() => {
    if (soundFlag) {
      handleAudio(duration);
      const audio = document.getElementById("timeline-audio") as HTMLAudioElement;
      if (audio) {
        audio.volume = 0;
      }
    } else {
      const audio = document.getElementById("timeline-audio") as HTMLAudioElement;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    }
  }, [soundFlag, duration, handleAudio]);

  useEffect(() => {
    // handle reactPlayer(timeline) volume.
    if (soundFlag) {
      const audio = document.getElementById("timeline-audio") as HTMLAudioElement;
      if (audio) {
        audio.volume = (intensity || 0) / 100;
        setCurrentVolume((videoIntensity || 0) / 100);
      }
    } else {
      setCurrentVolume((videoIntensity || 0) / 100);
    }
  }, [videoIntensity, intensity, soundFlag]);

  // Playing multiple videos back to back
  useEffect(() => {
    if (currentVideoStart === null || !timelineControl) return;
    if (currentVideoStart < timeline?.length) {
      setCurrentVideoUrl(timeline[currentVideoStart]?.videoUrl480P || timeline[currentVideoStart]?.videoUrl);
    } else {
      setFinalDuration(0);
      setCurrentVideoStart(0);
      setCurrentVideoUrl(timeline[0]?.videoUrl480P || timeline[0]?.videoUrl);
      if (timelineControl) {
        setDuration(0);
        if (soundFlag) {
          handleAudio(0);
        }
      }
    }
  }, [currentVideoStart, timelineControl, timeline, soundFlag]);

  // Initialize currentVideoUrl on mount and when playlist/index changes
  useEffect(() => {
    if (!timelineControl && playlist && playlist.length > 0 && currentIndex >= 0 && currentIndex < playlist.length) {
      const newUrl = playlist[currentIndex];
      setCurrentVideoUrl(newUrl);
      setIsLoading(true);
      setHasError(false);




    }
  }, [playlist, currentIndex, timelineControl]);

  // Set initial video URL on component mount
  useEffect(() => {
    if (!timelineControl && playlist && playlist.length > 0 && !currentVideoUrl) {
      const initialUrl = playlist[currentIndex] || playlist[0];
      setCurrentVideoUrl(initialUrl);
    }
  }, [timelineControl, playlist, currentIndex, currentVideoUrl]);

  // Removed debug logging

  const aspectCss = useMemo(() => {
    if (!aspectRatio) return undefined;
    const ar = String(aspectRatio).replace(/\s/g, '').replace(/x/i, ':');
    if (ar.includes(':')) {
      const [w, h] = ar.split(':');
      const wn = parseFloat(w) || 16;
      const hn = parseFloat(h) || 9;
      return `${wn}/${hn}`;
    }
    return undefined;
  }, [aspectRatio]);

  const aspectClass = useMemo(() => {
    const ar = String(aspectRatio).replace(/\s/g, '').toLowerCase();
    if (ar === '16:9' || ar === '16x9') return styles.aspect16x9;
    if (ar === '9:16' || ar === '9x16') return styles.aspect9x16;
    if (ar === '9:18' || ar === '9x18') return styles.aspect9x18;
    if (ar === '4:3' || ar === '4x3') return styles.aspect4x3;
    if (ar === '3:4' || ar === '3x4') return styles.aspect3x4;
    if (ar === '1:1' || ar === '1x1') return styles.aspect1x1;
    if (ar === '4:5' || ar === '4x5') return styles.aspect4x5;
    return styles.aspect16x9;
  }, [aspectRatio]);

  const isTallAspectRatio = useMemo(() => {
    const ar = String(aspectRatio).replace(/\s/g, '').toLowerCase();
    return ar === '9:16' || ar === '9x16' || ar === '9:18' || ar === '9x18';
  }, [aspectRatio]);


  if (!playlist || playlist.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-black text-white ${className}`}
        style={{ width, height: height === 'auto' ? undefined : height, aspectRatio: aspectCss }}
      >
        <p className="mt-4">No preview available</p>
      </div>
    );
  }

  return (
    <div
      ref={playerContainerRef}
      className={`${styles.container} ${aspectClass} ${className}`}
      style={{ width, height }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <ReactPlayer
        id={timelineControl ? "timeline-react-player" : "reactPlayer"}
        className={styles.player}
        onClick={(e) => handleContainerClick(e)}
        key={`${currentVideoUrl}-${currentIndex}`}
        ref={playerRef}
        onStart={() => {
          if (timelineControl) {
            if (playerRef.current) {
              playerRef.current.currentTime = Math.max(0, currentSeekTime);
            }
            setCurrentSeekTime(0);
          }
        }}
        src={currentVideoUrl || playlist[currentIndex] || ""}
        playing={isPlaying}
        muted={timelineControl ? isMuted : isMuted}
        volume={timelineControl ? volumeState : currentVolume}
        playbackRate={playbackRate}
        width="100%"
        height="100%"
        onLoadedMetadata={(e) => {
          if (timelineControl) return;
          const el = e.currentTarget;
          const pending = pendingSeekTimeRef.current;
          pendingSeekTimeRef.current = null;

          const localTime = Number.isFinite(pending) ? (pending as number) : 0;
          el.currentTime = Math.max(0, localTime);

          const totalSeconds = Number.isFinite(el.duration) ? el.duration : duration;
          const timeBefore = getCumulativeTimeBeforeCurrentVideo();
          setCurrentTime(el.currentTime);
          setPlayed(totalSeconds > 0 ? Math.min(Math.max(el.currentTime / totalSeconds, 0), 1) : 0);
          setCumulativeTime((Number.isFinite(timeBefore) ? timeBefore : 0) + (Number.isFinite(el.currentTime) ? el.currentTime : 0));
          isSwitchingSrcRef.current = false;
          setIsLoading(false);
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={(e) => {
          if (!timelineControl && e.currentTarget.ended && (currentIndex < playlist.length - 1 || loop)) {
            return;
          }
          setIsPlaying(false);
        }}
        onTimeUpdate={(e) => {
          if (timelineControl) {
            const el = e.currentTarget;
            const playedSeconds = Number.isFinite(el.currentTime) ? el.currentTime : 0;
            setDuration(finalDuration + playedSeconds);
            return;
          }
          handleTimeUpdate(e);
        }}
        onDurationChange={handleDurationChange}
        onEnded={timelineControl ? handleOnended : handleEnded}
        onReady={() => {
          setIsLoading(false);
          setHasError(false);
          onReady?.();
        }}
        onError={(error) => {
          // Handle AbortError gracefully as it's common during rapid source changes
          if (error?.name !== 'AbortError') {
            console.error('ReactVideoPlayer: Video error:', error);
            setHasError(true);
          }
          setIsLoading(false);
        }}
        progressInterval={100}
        config={{
          file: {
            attributes: {
              poster: poster || '/zentag-logo.png',
              preload: 'auto',
              playsInline: true,
              controlsList: 'nodownload',
            },
          },
        }}
        // controls={true}
        style={aspectCss ? { aspectRatio: aspectCss, height: '100%', width: 'auto', zIndex: 1 } : { height: '100%', width: 'auto', zIndex: 1 }}
      />

      {/* Video Overlay */}
      {selectedOverlay && timeline[currentVideoStart]?.type !== "slate" && showOverLay && timelineControl && (
        <video
          className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
          autoPlay
          onEnded={() => setShowOverLay(false)}
          style={{ zIndex: 10 }}
        >
          <source
            src={getOverlayUrl()}
            type="video/mp4"
          />
        </video>
      )}

      {/* Graphics Overlay with Drag and Resize */}
      {graphicsState.isImageSelected && graphicsState.selectedGraphicUrl && (
        <Rnd
          lockAspectRatio={graphicsState.naturalWidth && graphicsState.naturalHeight ? (graphicsState.naturalWidth / graphicsState.naturalHeight) : false}
          size={{
            width: (((graphicsState.x2Coordinate || 0) - (graphicsState.x1Coordinate || 0)) || ((graphicsState.imageCoordinates[4] || 0) - (graphicsState.imageCoordinates[2] || 0))) / 100 * (playerContainerRef.current?.clientWidth || 1),
            height: (((graphicsState.y2Coordinate || 0) - (graphicsState.y1Coordinate || 0)) || ((graphicsState.imageCoordinates[5] || 0) - (graphicsState.imageCoordinates[3] || 0))) / 100 * (playerContainerRef.current?.clientHeight || 1)
          }}
          position={{
            x: ((graphicsState.x1Coordinate || graphicsState.imageCoordinates[2] || 0) / 100) * (playerContainerRef.current?.clientWidth || 1),
            y: ((graphicsState.y1Coordinate || graphicsState.imageCoordinates[3] || 0) / 100) * (playerContainerRef.current?.clientHeight || 1)
          }}
          onDrag={onDrag}
          onDragStop={onDrag}
          onResize={onResizeFun}
          onResizeStop={onResizeFun}
          bounds="parent"
          style={{
            zIndex: 15,
          }}
          enableResizing={{
            top: true,
            right: true,
            bottom: true,
            left: true,
            topRight: true,
            bottomRight: true,
            bottomLeft: true,
            topLeft: true
          }}
        >
          <img
            src={graphicsState.selectedGraphicUrl}
            alt="Graphics Overlay"
            className="w-full h-full object-contain pointer-events-none"
            draggable={false}
          />
        </Rnd>
      )}

      {/* Overlays with Drag and Resize */}
      {overlaysState.isOverlaySelected && overlaysState.selectedOverlayUrl && (
        <Rnd
          lockAspectRatio={overlaysState.naturalWidth && overlaysState.naturalHeight ? (overlaysState.naturalWidth / overlaysState.naturalHeight) : false}
          size={{
            width: (((overlaysState.x2Coordinate || 0) - (overlaysState.x1Coordinate || 0)) || ((overlaysState.overlayCoordinates[4] || 0) - (overlaysState.overlayCoordinates[2] || 0))) / 100 * (playerContainerRef.current?.clientWidth || 1),
            height: (((overlaysState.y2Coordinate || 0) - (overlaysState.y1Coordinate || 0)) || ((overlaysState.overlayCoordinates[5] || 0) - (overlaysState.overlayCoordinates[3] || 0))) / 100 * (playerContainerRef.current?.clientHeight || 1)
          }}
          position={{
            x: ((overlaysState.x1Coordinate || overlaysState.overlayCoordinates[2] || 0) / 100) * (playerContainerRef.current?.clientWidth || 1),
            y: ((overlaysState.y1Coordinate || overlaysState.overlayCoordinates[3] || 0) / 100) * (playerContainerRef.current?.clientHeight || 1)
          }}
          onDrag={onOverlayDrag}
          onDragStop={onOverlayDrag}
          onResize={onOverlayResize}
          onResizeStop={onOverlayResize}
          bounds="parent"
          style={{
            zIndex: 16,
          }}
          enableResizing={{
            top: true,
            right: true,
            bottom: true,
            left: true,
            topRight: true,
            bottomRight: true,
            bottomLeft: true,
            topLeft: true
          }}
        >
          <video
            src={overlaysState.selectedOverlayUrl}
            className="w-full h-full object-contain pointer-events-none"
            autoPlay
            loop
            muted
            style={{
              borderRadius: '2px'
            }}
          />
        </Rnd>
      )}

      {/* Generating Overlay */}
      {isGenerating && (
        //  <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center" style={{ zIndex: 20 }}>
        //   <div className="bg-black bg-opacity-90 rounded-lg p-8 max-w-md w-full mx-4">
        //     <div className="text-center">
        //       <div className="text-white text-2xl font-bold mb-2">
        //         {generationProgress}%
        //       </div>
        //       <div className="text-white text-sm mb-4">
        //         {generationStatus}
        //       </div>
        //       <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
        //         <div 
        //           className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
        //           style={{ width: `${generationProgress}%` }}
        //         ></div>
        //       </div>
        //       <div className="text-gray-300 text-xs">
        //         Please be patient, as this process may take a few seconds
        //       </div>
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 20 }}>
          <div className="text-center">
            <div className="text-white text-lg font-medium mb-4">
              {/* {generationStatus} */} Generating {generationProgress}%
            </div>
            <div className="w-80 bg-gray-600 rounded-full h-1 mb-2">
              <div
                className="bg-blue-400 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${generationProgress}%` }}
              ></div>
            </div>
            <div className="text-gray-300 text-sm">
              Just a moment...
            </div>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading video...</p>
          </div>
        </div>
      )}

      {/* Error Indicator */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="text-white text-center">
            <p className="text-red-400 mb-2">Failed to load video</p>
            <p className="text-sm text-gray-300">URL: {currentVideoUrl || 'No URL provided'}</p>
          </div>
        </div>
      )}

      {/* Timeline Audio Element */}
      {soundFlag && timelineControl && singleAudio && (
        <audio id="timeline-audio" src={singleAudio.audioUrl}></audio>
      )}

      {/* Timeline Seek Bar */}
      {timelineControl && (
        <div className="absolute bottom-16 left-4 right-4">
          <div className="bg-black bg-opacity-50 rounded p-2">
            <input
              type="range"
              // min={0}
              max={timeLineDuration || 100}
              value={Math.round(duration)}
              onChange={(e) => {
                handleVideoPlayer(parseInt(e.target.value));
              }}
              // onChange={(e) => {
              //   const seekValue = parseFloat(e.target.value);
              //   setCurrentSeekTime(seekValue);
              //   if (onSeekChange) {
              //     onSeekChange(0, 0, 0, seekValue);
              //   }
              // }}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-white text-xs mt-1">
              <span>{moment.utc((currentSeekTime || 0) * 1000).format('mm:ss')}</span>
              <span>{moment.utc((timeLineDuration || 0) * 1000).format('mm:ss')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Custom Controls */}
      {controls && (
        <div className={`absolute inset-0 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`} style={{ pointerEvents: 'none', zIndex: 5 }}>
          {/* Play/Pause Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            {!isPlaying && (
              <button type="button" onClick={timelineControl ? handlePlayVideo : handlePlayPause} style={{ pointerEvents: 'auto' }} className="flex flex-col items-center">
                <div className="bg-black bg-opacity-50 rounded-full p-4">
                  <Play className="w-12 h-12 text-white" fill="white" />
                </div>
              </button>
            )}
          </div>

          {/* Bottom Controls */}
          <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent ${isTallAspectRatio ? 'p-2' : 'p-4'}`} style={{ pointerEvents: 'auto' }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}>
            {/* Progress Bar - Unified Seek Bar */}
            <div className={isTallAspectRatio ? "mb-2" : "mb-4"}>
              <input
                type="range"
                min={0}
                max={Math.max(1, Math.ceil(Number.isFinite(calculatedTotalDuration) ? calculatedTotalDuration : 0))}
                step="any"
                value={
                  Number.isFinite(cumulativeTime) && Number.isFinite(calculatedTotalDuration) && calculatedTotalDuration > 0
                    ? Math.min(Math.max(cumulativeTime, 0), calculatedTotalDuration)
                    : 0
                }
                onChange={handleSeekChange}
                onMouseDown={() => setSeeking(true)}
                onTouchStart={() => setSeeking(true)}
                onMouseUp={handleSeekEnd}
                onTouchEnd={handleSeekEnd}
                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: (() => {
                    const total = Number.isFinite(calculatedTotalDuration) ? calculatedTotalDuration : 0;
                    const current = Number.isFinite(cumulativeTime) ? cumulativeTime : 0;
                    const pct = total > 0 ? Math.min(Math.max(current / total, 0), 1) * 100 : 0;
                    return `linear-gradient(to right, rgba(255,255,255,1) 0%, rgba(255,255,255,1) ${pct}%, rgba(255,255,255,0.25) ${pct}%, rgba(255,255,255,0.25) 100%)`;
                  })(),
                }}
              />
            </div>

            {/* Control Buttons */}
            <div className={`flex ${isTallAspectRatio ? 'flex-col gap-2' : 'items-center justify-between'}`}>
              <div className={`flex items-center ${isTallAspectRatio ? 'flex-wrap gap-2' : 'space-x-4'}`}>
                {/* Previous Button */}
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className="text-white hover:text-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed"
                >
                  <SkipBack className={isTallAspectRatio ? "w-4 h-4" : "w-6 h-6"} />
                </button>

                {/* Play/Pause Button */}
                <button
                  onClick={timelineControl ? (isPlaying ? handlePauseVideo : handlePlayVideo) : handlePlayPause}
                  className="text-white hover:text-gray-300"
                >
                  {isPlaying ? <Pause className={isTallAspectRatio ? "w-4 h-4" : "w-6 h-6"} /> : <Play className={isTallAspectRatio ? "w-5 h-5" : "w-6 h-6"} />}
                </button>

                {/* Timeline Forward/Backward Buttons */}
                {timelineControl && (
                  <>
                    <button
                      onClick={handleBackward}
                      className="text-white hover:text-gray-300"
                    >
                      <SkipBack className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleForward}
                      className="text-white hover:text-gray-300"
                    >
                      <SkipForward className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Next Button */}
                <button
                  onClick={handleNext}
                  disabled={currentIndex === playlist.length - 1}
                  className="text-white hover:text-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed"
                >
                  <SkipForward className={isTallAspectRatio ? "w-4 h-4" : "w-6 h-6"} />
                </button>

                {/* Volume Control */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={timelineControl ? handleMute : handleMuteToggle}
                    className="text-white hover:text-gray-300"
                  >
                    {isMuted ? <VolumeX className={isTallAspectRatio ? "w-4 h-4" : "w-6 h-6"} /> : <Volume2 className={isTallAspectRatio ? "w-5 h-5" : "w-6 h-6"} />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={isMuted ? 0 : currentVolume}
                    onChange={(e) => {
                      const newVolume = parseFloat(e.target.value);
                      setCurrentVolume(newVolume);
                      setIsMuted(newVolume === 0);
                    }}
                    className={`${isTallAspectRatio ? 'w-12' : 'w-20'} h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider`}
                  />
                </div>

                {/* Time Display - Timeline or Cumulative Time */}
                <div className={`text-white ${isTallAspectRatio ? 'text-xs' : 'text-sm'}`}>
                  {timelineControl ? (
                    <>
                      <span>{moment().startOf("day").seconds(duration).format("HH:mm:ss")}</span>
                      <span> - </span>
                      <span>{moment().startOf("day").seconds(timeLineDuration).format("HH:mm:ss")}</span>
                    </>
                  ) : (
                    <>{formatTime(isNaN(cumulativeTime) ? 0 : cumulativeTime)} / {formatTime(isNaN(calculatedTotalDuration) ? 0 : calculatedTotalDuration)}</>
                  )}
                </div>
              </div>

              {/* Playlist Info */}
              <div className={`text-white ${isTallAspectRatio ? 'text-xs self-end' : 'text-sm'}`}>
                {currentIndex + 1} / {playlist.length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style jsx>{`
        .react-player { display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 6px; }
        .react-player > video { object-fit: cover; }
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          border: 2px solid #ffffff;
        }
        
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          border: 2px solid #ffffff;
        }
      `}</style>
    </div>
  );
};

export default ReactVideoPlayer;
