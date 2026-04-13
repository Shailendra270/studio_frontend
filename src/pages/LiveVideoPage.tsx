import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../store";
import { fetchStreamById } from "../store/slices/streamsSlice";
import Sidebar from "../layouts/dashboard/Sidebar";
import VideoPlayer from "@/components/common/VideoPlayer";
import Timeline from "@/layouts/liveVidePage/LiveVideoTimeline";
import ClipsSidebar from "@/layouts/liveVidePage/ClipsSidebar";
import HelpButton from "@/containers/help_section/HelpButton";
import SaveNewClip from "@/layouts/liveVidePage/SaveNewClip";
import QuickActionsModal from "@/components/modals/QuickActionModal";
import EndStreamConfirmationModal from "@/components/modals/EndStreamConfirmationModal";
import { ClipsProvider } from "@/contexts/ClipsContext";
import { ClipData as ApiClipData, getClips as fetchStreamClips } from "@/api/clipApi";
import { endStream } from "@/api/streams";
import ZentagThumbnail from "../assets/images/zentagLogo.png";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
// Popover removed: implementing inline dropdown
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const LiveVideo: React.FC<{ page: string }> = ({ page }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { streamId } = useParams<{ streamId: string }>();

  // Redux selectors
  const { currentStream: stream, currentStreamLoading: loading, currentStreamError: error } = useSelector((state: RootState) => state.streams);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0); // fallback duration
  const [isClipping, setIsClipping] = useState(false);
  const [clipStartTime, setClipStartTime] = useState<number | null>(null);
  const [clipEndTime, setClipEndTime] = useState<number | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [generatedClips, setGeneratedClips] = useState<ApiClipData[]>([]);

  // Unsaved clips state
  const [showSaveNewClip, setShowSaveNewClip] = useState(false);
  const [activeUnsavedClip, setActiveUnsavedClip] = useState<any>(null);
  const [unsavedClips, setUnsavedClips] = useState<any[]>([]);
  const [isEndStreamModalOpen, setIsEndStreamModalOpen] = useState(false);
  const [isEndingStream, setIsEndingStream] = useState(false);
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
  const linkPopoverRef = useRef<HTMLDivElement>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const [timelineClips, setTimelineClips] = useState<ApiClipData[]>([]);

  // Fetch stream data when component mounts or streamId changes
  useEffect(() => {
    if (streamId) {
      dispatch(fetchStreamById(streamId));
    }
  }, [dispatch, streamId]);

  // This function will be called by the VideoPlayer when it's ready
  const handleVideoReady = useCallback(() => {
    setIsVideoLoaded(true);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if modal is open or user is typing in an input
      if (showQuickActions ||
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          handlePlayPause();
          break;
        case 'KeyM':
          event.preventDefault();
          handleMuteToggle();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          handleSeekBackward();
          break;
        case 'ArrowRight':
          event.preventDefault();
          handleSeekForward();
          break;
        case 'KeyQ':
          event.preventDefault();
          handleStartEndCut();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showQuickActions, isPlaying, isMuted, currentTime, duration, isClipping]);


  // Quick Actions handlers
  const handlePlayPause = () => setIsPlaying(prev => !prev);
  const handleMuteToggle = () => setIsMuted(prev => !prev);
  const handleSeekBackward = () => setCurrentTime(prev => Math.max(0, prev - 10));
  const handleSeekForward = () => setCurrentTime(prev => Math.min(duration, prev + 10));

  // Callbacks from child components
  const handleTimeUpdate = useCallback((time: number) => setCurrentTime(time), []);
  const handleDurationChange = useCallback((d: number) => setDuration(d), []);
  const handlePlayStateChange = useCallback((playing: boolean) => setIsPlaying(playing), []);
  const handleSeek = useCallback((time: number) => setCurrentTime(time), []);


  const handleStartEndCut = () => {
    if (isClipping) {
      handleFinishClip();
    } else {
      handleStartClip();
    }
  };

  const handleBackClick = () => navigate(`/clips/${streamId}`);

  const handleStartClip = () => {
    setIsClipping(true);
    setClipStartTime(currentTime);
    setClipEndTime(null);
    setShowSaveNewClip(false);
  };

  const handleFinishClip = () => {
    setIsClipping(false);
    setClipEndTime(currentTime);

    // Create an unsaved clip and add it to the timeline
    if (clipStartTime !== null) {
      const newUnsavedClip = {
        id: `unsaved_${Date.now()}`,
        title: `Clip`,
        startTime: clipStartTime,
        endTime: currentTime,
        createdAt: new Date().toISOString(),
        isActive: false
      };

      // Add to unsaved clips array
      setUnsavedClips(prev => [...prev, newUnsavedClip]);
      
      // Set the new clip as active and show the SaveNewClip modal
      setActiveUnsavedClip(newUnsavedClip);
      setShowSaveNewClip(true);
    }
  };

  const handleEndStream = async () => {
    if (!stream?.streamId) {
      toast.error('Stream ID not found');
      return;
    }

    setIsEndingStream(true);
    try {
      await endStream(stream.streamId);
      // Refresh stream data to update isLive status
      if (streamId) {
        dispatch(fetchStreamById(streamId));
      }
      setIsEndStreamModalOpen(false);
    } catch (error) {
      console.error('Error ending stream:', error);
    } finally {
      setIsEndingStream(false);
    }
  };



  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const togglePlayPause = () => setIsPlaying(!isPlaying);
  const handleCopyLink = async () => {
    try {
      const link = stream?.hlsS3URL || stream?.url || "";
      if (link) {
        await navigator.clipboard.writeText(link);
        toast.success('Link copied to clipboard!');
      } else {
        toast.info('No link available to copy');
      }
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error('Failed to copy link');
    }
  };
  const copyVideoLink = async () => {
    try {
      const link = stream?.hlsS3URL || "";
      if (link) {
        await navigator.clipboard.writeText(link);
        toast.success("Video link copied");
      }
    } catch {}
  };
  const copyInputUrl = async () => {
    try {
      const link = stream?.url || "";
      if (link) {
        await navigator.clipboard.writeText(link);
        toast.success("Input url copied");
      }
    } catch {}
  };

  useEffect(() => {
    if (!isLinkPopoverOpen) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (linkPopoverRef.current && !linkPopoverRef.current.contains(e.target as Node)) {
        setIsLinkPopoverOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLinkPopoverOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isLinkPopoverOpen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const WINDOW_SECONDS = 600;
  const loadedWindowsRef = useRef<Set<number>>(new Set());

  const fetchWindowClips = useCallback(
    async (windowIndex: number) => {
      if (!streamId) return;
      if (loadedWindowsRef.current.has(windowIndex)) return;
      loadedWindowsRef.current.add(windowIndex);

      try {
        const startTime = windowIndex * WINDOW_SECONDS;
        const endTime = startTime + WINDOW_SECONDS;
        const response = await fetchStreamClips({
          streamId,
          sortBy: "timeSequence",
          startTime,
          endTime,
          status: "all",
        });
        const newClips: ApiClipData[] = response?.clips || [];

        setTimelineClips((prev) => {
          if (!newClips.length) return prev;
          const map = new Map<string, ApiClipData>();
          prev.forEach((clip: any) => {
            const id = String((clip as any)._id || (clip as any).id || "");
            if (id) map.set(id, clip);
          });
          newClips.forEach((clip: any) => {
            const id = String((clip as any)._id || (clip as any).id || "");
            if (id) map.set(id, clip);
          });
          return Array.from(map.values());
        });
      } catch (e) {
        console.error("Error fetching timeline clips:", e);
      }
    },
    [streamId]
  );

  useEffect(() => {
    if (!streamId) return;
    fetchWindowClips(0);
  }, [streamId, fetchWindowClips]);

  const TIMELINE_INTERVAL_MIN_SECONDS = 5;
  const TIMELINE_INTERVAL_MAX_SECONDS = 55;
  const TIMELINE_INTERVAL_STEP_SECONDS = 5;

  const [timelineIntervalSeconds, setTimelineIntervalSeconds] = useState(30);
  const timelineIntervalSliderValue =
    ((timelineIntervalSeconds - TIMELINE_INTERVAL_MIN_SECONDS) /
      (TIMELINE_INTERVAL_MAX_SECONDS - TIMELINE_INTERVAL_MIN_SECONDS)) *
    100;
  const [showTimelineIntervalIndicator, setShowTimelineIntervalIndicator] = useState(false);
  const hideTimelineIntervalIndicatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTimelineInterval = useCallback(() => {
    if (hideTimelineIntervalIndicatorTimeoutRef.current) {
      clearTimeout(hideTimelineIntervalIndicatorTimeoutRef.current);
      hideTimelineIntervalIndicatorTimeoutRef.current = null;
    }
    setShowTimelineIntervalIndicator(true);
  }, []);

  const hideTimelineInterval = useCallback(() => {
    if (hideTimelineIntervalIndicatorTimeoutRef.current) {
      clearTimeout(hideTimelineIntervalIndicatorTimeoutRef.current);
    }
    hideTimelineIntervalIndicatorTimeoutRef.current = setTimeout(() => {
      setShowTimelineIntervalIndicator(false);
    }, 800);
  }, []);

  const intervalIndicatorTransform =
    timelineIntervalSliderValue < 10
      ? "translateX(0%)"
      : timelineIntervalSliderValue > 90
        ? "translateX(-100%)"
        : "translateX(-50%)";
  const timelineSecondsToPixelsRatio = React.useMemo(() => {
    const stepsFromBase = Math.round((30 - timelineIntervalSeconds) / TIMELINE_INTERVAL_STEP_SECONDS);
    const ratio = 3 + stepsFromBase * 2;
    return Math.max(3, ratio);
  }, [timelineIntervalSeconds]);
  const handleTimelineScroll = useCallback(() => {
    const el = timelineScrollRef.current;
    if (!el || !duration) return;

    const scrollLeft = el.scrollLeft;
    const visibleWidth = el.clientWidth || 0;
    const centerPx = scrollLeft + visibleWidth / 2;
    const centerSeconds = centerPx / timelineSecondsToPixelsRatio;
    const clampedCenter = Math.max(0, Math.min(duration, centerSeconds));
    const windowIndex = Math.floor(clampedCenter / WINDOW_SECONDS);

    if (windowIndex >= 0) {
      fetchWindowClips(windowIndex);
    }
  }, [duration, fetchWindowClips, timelineSecondsToPixelsRatio]);

  const clampTimelineInterval = useCallback((seconds: number) => {
    const clamped = Math.max(TIMELINE_INTERVAL_MIN_SECONDS, Math.min(TIMELINE_INTERVAL_MAX_SECONDS, seconds));
    const stepped = Math.round(clamped / TIMELINE_INTERVAL_STEP_SECONDS) * TIMELINE_INTERVAL_STEP_SECONDS;
    return Math.max(TIMELINE_INTERVAL_MIN_SECONDS, Math.min(TIMELINE_INTERVAL_MAX_SECONDS, stepped));
  }, []);

  const decrease = useCallback(() => {
    showTimelineInterval();
    setTimelineIntervalSeconds((prev) => clampTimelineInterval(prev - TIMELINE_INTERVAL_STEP_SECONDS));
    hideTimelineInterval();
  }, [clampTimelineInterval, hideTimelineInterval, showTimelineInterval]);

  const increase = useCallback(() => {
    showTimelineInterval();
    setTimelineIntervalSeconds((prev) => clampTimelineInterval(prev + TIMELINE_INTERVAL_STEP_SECONDS));
    hideTimelineInterval();
  }, [clampTimelineInterval, hideTimelineInterval, showTimelineInterval]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      showTimelineInterval();
      const pct = Number(e.target.value);
      const raw = TIMELINE_INTERVAL_MIN_SECONDS + (pct / 100) * (TIMELINE_INTERVAL_MAX_SECONDS - TIMELINE_INTERVAL_MIN_SECONDS);
      setTimelineIntervalSeconds(clampTimelineInterval(raw));
    },
    [clampTimelineInterval, showTimelineInterval]
  );

  const truncateText = (text: string | undefined | null, maxLength: number = 25) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <ClipsProvider>
    <div className="bg-[#18191B] flex flex-col md:flex-row overflow-x-hidden min-h-screen min-h-[100dvh]">
      {/* Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      {/* Main content column */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Vertically scrollable main area (video, controls, timeline) */}
        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col w-full">
          {/* Header */}
          <div className="flex items-center gap-4 px-4 sm:px-6 py-4 flex-shrink-0 bg-[#18191B] z-10 flex-wrap">
            <button
              onClick={handleBackClick}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <svg width="8" height="13" viewBox="0 0 8 13" fill="none">
                <path
                  d="M2.83 6.36L7.78 1.41 6.37 0 .003 6.36 6.37 12.73 7.78 11.31 2.83 6.36Z"
                  fill="white"
                />
              </svg>
            </button>
            {/*<Badge className="absolute w-10 h-[22px] top-10 left-32 bg-[#fe0000] rounded-[5px] flex items-center justify-center">*/}
            <span
              className={`[font-family:'Montserrat',Helvetica] font-medium text-white text-xs text-center ${stream?.isLive ? 'bg-red-500' : 'bg-[#00CF45]'
                } rounded-[5px] px-2 py-1`}
            >
              {stream?.isLive ? "Live" : "Completed"}
            </span>
            {/* </Badge>*/}
            <div className="text-white text-2xl md:text-[25px] font-medium leading-[1.2] font-montserrat mt-1">
              {loading
                ? "Loading..."
                : error
                  ? "Error loading stream"
                  : <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <h1 className="text-xl sm:text-2xl font-medium text-white"> {truncateText(stream?.title, 50)}</h1>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{stream?.title}</p>
                      </TooltipContent>
                    </Tooltip>
                  </> || "Untitled Stream"}
            </div>
            <div className="flex items-center ml-auto space-x-2 mt-2 md:mt-0">
              {/* End Stream */}
              {stream?.isLive && (
                <Button
                variant="outline"
                className="bg-[#1B1B1B] border-red-500 text-white hover:bg-red-500/10 h-11 px-4"
                onClick={() => setIsEndStreamModalOpen(true)}
              >
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                End stream
              </Button>)}
              {/* Link dropdown */}
              <div className="relative" ref={linkPopoverRef}>
                <button
                  className={`w-[42px] h-[42px] rounded-xl flex items-center justify-center transition-colors ${stream?.status === 1 && !stream?.isLive ? 'bg-[#252525] hover:bg-[#373737]' : 'bg-[#252525] opacity-50 cursor-not-allowed'}`}
                  title="Copy Link"
                  disabled={!(stream?.status === 1 && !stream?.isLive)}
                  onClick={() => setIsLinkPopoverOpen(prev => !prev)}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M16.7462 1.25381C18.418 2.92556 18.4179 5.66122 16.7463 7.33301L13.1698 10.9095C11.0595 13.0197 7.47195 12.4005 6.32273 9.76864C7.58442 8.67208 8.19962 9.02677 9.40172 9.53527C10.1093 9.83452 10.9395 9.67431 11.5139 9.09979L15.0076 5.60627C15.7631 4.85065 15.7632 3.61424 15.0076 2.85863C14.2521 2.10319 13.015 2.10375 12.2601 2.85863L9.75419 5.36457C8.9251 4.966 7.99223 4.84788 7.10154 5.01055C7.28468 4.70017 7.50637 4.41422 7.76132 4.15952L10.667 1.25385C12.3389 -0.417872 15.0744 -0.418013 16.7462 1.25381ZM1.25382 16.7462L1.25385 16.7462C2.92567 18.4179 5.66122 18.4179 7.33298 16.7462L10.3452 13.7339C10.6094 13.4701 10.8378 13.1727 11.0246 12.8495C10.0446 13.0939 8.99387 12.9906 8.0739 12.5399L5.6062 15.0076C4.85133 15.7624 3.61432 15.7631 2.85877 15.0076C2.10319 14.252 2.10316 13.0157 2.85877 12.2601L6.35243 8.76644C7.06832 8.05055 8.49704 7.83708 9.57687 8.82578C10.622 8.71564 11.0279 8.51598 11.6772 7.89438C10.2921 5.45186 6.83942 5.08142 4.83023 7.09061L1.25382 10.667C-0.417939 12.3388 -0.417939 15.0744 1.25382 16.7462Z"
                      fill="white"
                    />
                  </svg>
                </button>
                {isLinkPopoverOpen && (
                  <div className="absolute right-0 mt-2 bg-[#252525] text-white rounded-lg p-3 w-[320px] space-y-3 shadow-lg border border-[#3A3A3A] z-50">
                    <div>
                      <div className="text-xs text-gray-300 mb-1">Video link</div>
                      <div className="flex items-center gap-2">
                        <input readOnly value={stream?.hlsS3URL || ''} className="flex-1 bg-[#1B1B1B] text-white text-xs h-8 px-2 rounded-md border border-[#3A3A3A]" />
                        <button className="w-8 h-8 bg-[#1B1B1B] rounded-md flex items-center justify-center hover:bg-[#333]" onClick={copyVideoLink} title="Copy video link">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M16 1H4C2.9 1 2 1.9 2 3V15H4V3H16V1ZM20 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H20C21.1 23 22 22.1 22 21V7C22 5.9 21.1 5 20 5ZM20 21H8V7H20V21Z" fill="white"/></svg>
                        </button>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-300 mb-1">Input url</div>
                      <div className="flex items-center gap-2">
                        <input readOnly value={stream?.url || ''} className="flex-1 bg-[#1B1B1B] text-white text-xs h-8 px-2 rounded-md border border-[#3A3A3A]" />
                        <button className="w-8 h-8 bg-[#1B1B1B] rounded-md flex items-center justify-center hover:bg-[#333]" onClick={copyInputUrl} title="Copy input url">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M16 1H4C2.9 1 2 1.9 2 3V15H4V3H16V1ZM20 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H20C21.1 23 22 22.1 22 21V7C22 5.9 21.1 5 20 5ZM20 21H8V7H20V21Z" fill="white"/></svg>
                        </button>
                      </div>
                    </div>
                    {stream?.videoType && (
                      <div>
                        <div className="text-xs text-gray-300 mb-1">Input Type</div>
                        <div className="bg-[#1B1B1B] text-white text-xs h-8 px-2 rounded-md border border-[#3A3A3A] flex items-center">{String(stream.videoType)}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Video player */}
          <div className="flex justify-center px-4 sm:px-6 bg-[#18191B] flex-shrink-0">
            <div className="w-full mx-auto">
              <div className="relative" style={{ paddingTop: "56.25%" }}>
                <div className="absolute top-0 left-0 w-full h-full bg-black rounded-lg overflow-hidden">
                    <VideoPlayer
                    onTimeUpdate={handleTimeUpdate}
                    onDurationChange={handleDurationChange}
                    currentTime={currentTime}
                    isMuted={isMuted}
                    controls={true}
                    isPlaying={isPlaying} // Pass down isPlaying state
                    isLive={stream?.isLive || false}
                    videoUrl={stream?.hlsS3URL || stream?.url || ""}
                    // poster={'' || ""}
                    // videoUrl="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
                    // videoUrl="https://d1rkuvpc7jn7al.cloudfront.net/org_064cb6e0-4fe0-4937-adbe-74607a21d0e4/aTGN0WwZT/recording/172587393252da1/master_highest.m3u8"
                    // autoplay={true}
                    // controls={true}
                    playbackRate={playbackRate}
                    onPlayStateChange={handlePlayStateChange}
                  // onReady={handleVideoReady}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* {isVideoLoaded && (
                        <> */}
          {/* Player controls section below video */}
          <div className="px-4 sm:px-6 py-3 bg-[#18191B] flex-shrink-0">
            <div className="flex justify-center">
              <div className="w-full max-w-[1050px] flex flex-wrap md:flex-nowrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Finish new clip button */}
                  {isClipping ? (
                    <button
                      onClick={handleFinishClip}
                      className="bg-[#000] border-[1.5px] border-[#00BBFF] text-white px-6 py-2 rounded-lg text-sm font-medium font-montserrat"
                    >
                      Finish new clip
                    </button>
                  ) : (
                    <button
                      onClick={handleStartClip}
                      className="bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white px-6 py-2 rounded-lg text-sm font-medium font-montserrat"
                    >
                      Start new clip
                    </button>
                  )}

                  {/* Quick actions */}
                  <button
                    className="text-white text-sm font-medium font-montserrat underline hover:text-gray-300 transition-colors"
                    onClick={() => setShowQuickActions(true)}
                  >
                    Quick actions
                  </button>
                </div>

                {/* Center - Current time display */}
                <div className="flex items-center gap-4 text-white text-[16px] font-bold font-montserrat order-3 md:order-none w-full md:w-auto justify-center md:justify-start">
                  {/* 10s backward */}
                  <button
                    onClick={() =>
                      setCurrentTime(Math.max(0, currentTime - 10))
                    }
                    className="flex items-center gap-2 hover:text-gray-300 transition-colors"
                  >
                    <svg
                      width="19"
                      height="20"
                      viewBox="0 0 19 20"
                      fill="none"
                    >
                      <path
                        d="M6 6V10L0 5L6 0V4H11C13.1217 4 15.1566 4.84285 16.6569 6.34315C18.1571 7.84344 19 9.87827 19 12C19 14.1217 18.1571 16.1566 16.6569 17.6569C15.1566 19.1571 13.1217 20 11 20H2V18H11C12.5913 18 14.1174 17.3679 15.2426 16.2426C16.3679 15.1174 17 13.5913 17 12C17 10.4087 16.3679 8.88258 15.2426 7.75736C14.1174 6.63214 12.5913 6 11 6H6Z"
                        fill="white"
                      />
                    </svg>
                    <span className="text-white text-sm font-medium font-montserrat">
                      10s
                    </span>
                  </button>
                  {formatTime(currentTime)}
                  {/* 10s forward */}
                  <button
                    onClick={() =>
                      setCurrentTime(Math.min(duration, currentTime + 10))
                    }
                    className="flex items-center gap-2 hover:text-gray-300 transition-colors"
                  >
                    <span className="text-white text-sm font-medium font-montserrat">
                      10s
                    </span>
                    <svg
                      width="19"
                      height="20"
                      viewBox="0 0 19 20"
                      fill="none"
                    >
                      <path
                        d="M13 6V10L19 5L13 0V4H8C5.87827 4 3.84344 4.84285 2.34315 6.34315C0.842854 7.84344 0 9.87827 0 12C0 14.1217 0.842854 16.1566 2.34315 17.6569C3.84344 19.1571 5.87827 20 8 20H17V18H8C6.4087 18 4.88258 17.3679 3.75736 16.2426C2.63214 15.1174 2 13.5913 2 12C2 10.4087 2.63214 8.88258 3.75736 7.75736C4.88258 6.63214 6.4087 6 8 6H13Z"
                        fill="white"
                      />
                    </svg>
                  </button>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                  {/* Playback speed dropdown */}
                  <div className="relative">
                    <select
                      value={playbackRate}
                      onChange={(e) =>
                        setPlaybackRate(parseFloat(e.target.value))
                      }
                      className="bg-[#18191B] text-white text-[16px] font-bold font-montserrat border-none outline-none cursor-pointer appearance-none pr-2"
                    >
                      <option value="2">2x</option>
                      <option value="1.5">1.5x</option>
                      <option value="1.25">1.25x</option>
                      <option value="1">1x</option>
                      <option value="0.5">0.5x</option>
                    </select>
                    <svg
                      className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-1 pointer-events-none"
                      width="9"
                      height="3"
                      viewBox="0 0 9 3"
                      fill="none"
                    >
                      <path
                        d="M4.375 5L9.53674e-07 -3.82475e-07L8.75 0L4.375 5Z"
                        fill="white"
                      />
                    </svg>
                  </div>

                  {/* Volume control */}
                  <div className="flex items-center gap-3">
                    {/* Minus icon */}
                    <button onClick={decrease}>
                      <svg
                        width="14"
                        height="3"
                        viewBox="0 0 12 2"
                        fill="white"
                      >
                        <rect width="12" height="2" />
                      </svg>
                    </button>

                    {/* Slider */}
                    <div className="relative w-[90px] sm:w-[120px] h-[14px] flex items-center">
                      {/* Black track */}
                      <div className="absolute left-0 right-0 h-1 bg-black rounded" />

                      {/* Range input with no default style */}
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={timelineIntervalSliderValue}
                        step="1"
                        onChange={handleChange}
                        onMouseDown={showTimelineInterval}
                        onMouseUp={hideTimelineInterval}
                        onTouchStart={showTimelineInterval}
                        onTouchEnd={hideTimelineInterval}
                        onFocus={showTimelineInterval}
                        onBlur={hideTimelineInterval}
                        className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                      />

                      {showTimelineIntervalIndicator && (
                        <div
                          className="absolute -top-7 text-[11px] leading-none bg-black text-white px-2 py-1 rounded"
                          style={{
                            left: `${timelineIntervalSliderValue}%`,
                            transform: intervalIndicatorTransform,
                          }}
                        >
                          {timelineIntervalSeconds}s
                        </div>
                      )}

                      {/* Custom white square thumb */}
                      <div
                        className="absolute w-[19px] h-[19px] bg-white rounded-md"
                        style={{
                          left: `${timelineIntervalSliderValue}%`,
                          // transform: "translateX(-50%)",
                        }}
                      />
                    </div>

                    {/* Plus icon */}
                    <button onClick={increase}>
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 14 14"
                        fill="white"
                      >
                        <rect x="5" width="2" height="12" />
                        <rect y="5" width="12" height="2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline — ONLY this section is horizontally scrollable */}
          <div
            className="px-4 sm:px-6 pt-2 pb-2 bg-[#18191B] border-gray-800 flex-shrink-0 overflow-x-auto w-full"
            ref={timelineScrollRef}
            onScroll={handleTimelineScroll}
          >
            <div className="timeline-scrollbox relative">
              <Timeline
                duration={duration}
                currentTime={currentTime}
                onSeek={handleSeek}
                isClipping={isClipping}
                clipStartTime={clipStartTime}
                clipEndTime={clipEndTime}
                isLive={stream?.isLive || false}
                unsavedClips={unsavedClips}
                onAddUnsavedClip={(clip) => {
                  setUnsavedClips(prev => [...prev, clip]);
                }}
                onUnsavedClipClick={(clip) => {
                  setActiveUnsavedClip(clip);
                  setShowSaveNewClip(true);
                  setSidebarVisible(false);
                }}
                clips={timelineClips}
                majorMarkerIntervalSeconds={timelineIntervalSeconds}
                secondsToPixelsRatio={timelineSecondsToPixelsRatio}
              />
            </div>
          </div>
          {/* </>
                    )} */}
        </div>
      </div>
      {showSaveNewClip && (
        <SaveNewClip
          onClose={() => {
            setShowSaveNewClip(false);
            setActiveUnsavedClip(null);
            setSidebarVisible(true);
            setClipStartTime(null);
            setClipEndTime(null);
          }}
          clipStartTime={
            activeUnsavedClip?.startTime ||
            clipStartTime ||
            (unsavedClips.length > 0 ? unsavedClips[unsavedClips.length - 1].startTime : 0)
          }
          clipEndTime={
            activeUnsavedClip?.endTime ||
            clipEndTime ||
            (unsavedClips.length > 0 ? unsavedClips[unsavedClips.length - 1].endTime : currentTime)
          }
          title={
            activeUnsavedClip?.title ||
            (unsavedClips.length > 0 ? unsavedClips[unsavedClips.length - 1].title : "Clip")
          }
          streamUrl={stream?.hlsS3URL || stream?.url || ""}
          streamId={streamId || ""}
          sports={stream?.category || ""}
          entityId={stream?.entityId || ""}
          userId={stream?.userId}
          unsavedClipId={activeUnsavedClip?.id}
          onSave={(clipData) => {
            console.log("Clip saved:", clipData);
            setShowSaveNewClip(false);
            setActiveUnsavedClip(null);
            setSidebarVisible(true);
            setClipStartTime(null);
            setClipEndTime(null);
          }}
          onDelete={() => {
            // Remove the unsaved clip from the timeline using unsavedClipId
            if (activeUnsavedClip?.id) {
              setUnsavedClips(prev => prev.filter(unsavedClip => unsavedClip.id !== activeUnsavedClip.id));
            }
            setShowSaveNewClip(false);
            setActiveUnsavedClip(null);
            setSidebarVisible(true);
            setClipStartTime(null);
            setClipEndTime(null);
          }}
          onGenerateStart={(unsavedClipId) => {
            // Remove the unsaved clip immediately when generate button is clicked
            if (unsavedClipId) {
              setUnsavedClips(prev => prev.filter(unsavedClip => unsavedClip.id !== unsavedClipId));
            }
          }}
          onClipGenerated={(clip, unsavedClipId) => {
            setGeneratedClips(prev => [clip, ...prev]);
            
            // No need to remove unsaved clip here anymore since it's already removed in onGenerateStart
            
            // Close the SaveNewClip modal and reset state
            setShowSaveNewClip(false);
            setActiveUnsavedClip(null);
            setSidebarVisible(true);
          }}
          onShowClipsSidebar={() => {
            setShowSaveNewClip(false);
            setActiveUnsavedClip(null);
            setSidebarVisible(true);
          }}
        />
      )}
      {!showSaveNewClip && (
        <div className="w-full md:w-[42vw] lg:w-[40vw]">
          <ClipsSidebar
            onClose={() => setSidebarVisible(false)}
            page={page}
            streamId={streamId || ""}
            generatedClips={generatedClips}
          />
        </div>
      )}{" "}
      <HelpButton />
      {/* Quick Actions Modal */}
      <QuickActionsModal
        isOpen={showQuickActions}
        onClose={() => setShowQuickActions(false)}
        onPlayPause={handlePlayPause}
        onMuteToggle={handleMuteToggle}
        onSeekBackward={handleSeekBackward}
        onSeekForward={handleSeekForward}
        onStartEndCut={handleStartEndCut}
      />
      
      {/* End Stream Confirmation Modal */}
      <EndStreamConfirmationModal
        isOpen={isEndStreamModalOpen}
        onClose={() => setIsEndStreamModalOpen(false)}
        onConfirm={handleEndStream}
        isLoading={isEndingStream}
      />
    </div>
    </ClipsProvider>
  );
};

export default LiveVideo;
