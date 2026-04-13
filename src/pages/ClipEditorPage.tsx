import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from '../store';
import Sidebar from "../layouts/dashboard/Sidebar";
import EditorHeader from "@/layouts/highlightEditor/EditorHeader";
import EditorSidebar from "@/layouts/highlightEditor/EditorSidebar";
import { TimelineItem } from "@/layouts/highlightEditor/EditorTimeline";
import { mockClipData } from "@/mocks/clips_mockData/mockClips";
import ReactVideoPlayer from "@/components/common/ReactVideoPlayer";
import { fetchClipById, selectCurrentClip, selectClipLoading, selectClipsError, clearCurrentClip, clearBumpers } from '../store/slices/clipsSlice';
import { generateClipHighlight, pollClipHighlightProgressByJobId, resetClipHighlightStatus } from '../api/clipApi';
import { GraphicsProvider } from "@/contexts/GraphicsContext";
import { OverlaysProvider } from "@/contexts/OverlaysContext";
import { toast } from "sonner";
import { downloadFile } from '@/utils/download';
import { useGraphics } from "@/contexts/GraphicsContext";
import { useOverlays } from "@/contexts/OverlaysContext";
import { overwriteClipById, saveClipAsNew } from "@/api/clipApi";
import { getFoldersByClipId } from "@/api/folderApi";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import DeleteConfirmationModal from "@/components/modals/DeleteConfirmationModal";
import SaveAsClipModal from "@/components/modals/SaveAsClipModal";
import { deleteFolder } from "@/api/folderApi";
import threeDotIcon from "../assets/svg/3dotIcon.svg";
import { Edit, Trash2 } from "lucide-react";
import SVGIcon from "@/components/common/SVGIcon";
import PreviewModal from "@/components/modals/PreviewModal";
import DownloadPanel from "@/components/download/DownloadPanel";
interface ClipEditorProps {
  page: string;
}

const ClipEditorPage: React.FC<ClipEditorProps> = ({ page }) => {
  return (
    <GraphicsProvider>
      <OverlaysProvider>
        <ClipEditorContent page={page} />
      </OverlaysProvider>
    </GraphicsProvider>
  );
};

const ClipEditorContent: React.FC<ClipEditorProps> = ({ page }) => {

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const clipId = searchParams.get("clipId");
  const requestedAspectRatio = searchParams.get("aspectRatio") || (() => {
    const href = typeof window !== 'undefined' ? window.location.href : '';
    const m = href.match(/[?&]aspectRatio=([^&]+)/);
    return m ? decodeURIComponent(m[1]) : '';
  })();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { graphicsState } = useGraphics();
  const overlaysState = useOverlays();
  // Redux selectors
  const currentClip = useAppSelector(selectCurrentClip);
  const clipLoading = useAppSelector(selectClipLoading);
  const error = useAppSelector(selectClipsError);
  // const currentFolder = useAppSelector(selectCurrentFolder);

  // Timeline state management
  const [clipsInfo, setClipsInfo] = useState<TimelineItem[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [activeClipId, setActiveClipId] = useState<string>("");
  const [currentTime, setCurrentTime] = useState(0);

  // General tab persistent state
  const [clipName, setClipName] = useState(currentClip?.title || '');
  const [tags, setTags] = useState<string[]>(currentClip?.tags || []);
  const [rating, setRating] = useState(currentClip?.rating || 0);
  const [duration, setDuration] = useState(0);
  const [videoPlaylist, setVideoPlaylist] = useState<string[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const introBumper = useAppSelector(state => (state as any).clips.currentIntroBumper) as any | null;
  const outroBumper = useAppSelector(state => (state as any).clips.currentOutroBumper) as any | null;
  const trimStart = useAppSelector(state => (state as any).clips.trimOverrideStart) as string | null;
  const trimEnd = useAppSelector(state => (state as any).clips.trimOverrideEnd) as string | null;
  const trimStreamUrl = useAppSelector(state => (state as any).clips.trimStreamUrl) as string | null;
  const currentStream = useAppSelector(state => (state as any).streams?.currentStream) as any | null;

  // Generate highlight state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState("");
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveStep, setSaveStep] = useState<'new' | 'new'>('new');
  const [newClipTitle, setNewClipTitle] = useState('');
  const [previewClipData, setPreviewClipData] = useState<any>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Fetch clip data when component mounts or clipId changes
  useEffect(() => {
    if (clipId) {
      dispatch(fetchClipById(clipId));
    }

    // Cleanup when component unmounts
    return () => {
      dispatch(clearCurrentClip());
      dispatch(clearBumpers());
    };
  }, [clipId, dispatch]);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onDelete) {
      onDelete(id);
    }
  };

  // Update states when currentClip changes
  useEffect(() => {
    if (currentClip) {
      setClipName(currentClip.title || '');
      setTags(currentClip.tags || []);
      setRating(currentClip.rating || 0);
    }
  }, [currentClip]);

  // Fallback to mock data if no clip is loaded yet
  const fallbackClip = mockClipData.find(clip => clip.id === clipId) || mockClipData[0];
  const activeClip = currentClip || fallbackClip;
  const selectedAspectRatio = requestedAspectRatio || (activeClip as any)?.aspectRatio || "16:9";

  const getAspectUrl = (clipObj: any, ar: string): string => {
    const list = clipObj?.editedVideos || clipObj?.clipData?.editedVideos;
    if (Array.isArray(list)) {
      const match = list.find((ev: any) => ev?.aspect_ratio === ar && (ev?.video_url || ev?.videoUrl));
      if (match) return match.video_url || match.videoUrl;
    }
    return clipObj?.videoUrl || clipObj?.url || "";
  };

  // Convert current clip to timeline format and set up video playlist
  useEffect(() => {
    if (activeClip) {
      const createdDate = new Date(activeClip.createdAt || Date.now());
      const items: TimelineItem[] = [];
      if (introBumper) {
        items.push({
          id: introBumper._id || `intro-${Date.now()}`,
          type: 'bumper',
          title: introBumper.title || 'Intro',
          createdAt: createdDate.toISOString(),
          date: createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          time: createdDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          url: introBumper.url || '',
          duration: introBumper.duration || 10,
          aspectRatio: introBumper.aspectRatio || activeClip.aspectRatio || '16:9',
          bumperData: introBumper,
        } as TimelineItem);
      }

      const clipItem: TimelineItem = {
        id: activeClip._id || activeClip.id || clipId || "",
        type: "clip",
        title: activeClip.title || "Untitled Clip",
        createdAt: createdDate.toISOString(),
        date: createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: createdDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        url: getAspectUrl(activeClip, selectedAspectRatio),
        duration: activeClip.duration || 0,
        aspectRatio: selectedAspectRatio,
        timestamp: `${activeClip.start_time || '00:00'} - ${activeClip.end_time || '00:00'}`,
        rating: activeClip.rating || 0,
        tags: activeClip.tags || [],
        streamId: activeClip.streamId || "",
        clipData: activeClip,
      };
      items.push(clipItem);

      if (outroBumper) {
        items.push({
          id: outroBumper._id || `outro-${Date.now()}`,
          type: 'bumper',
          title: outroBumper.title || 'Outro',
          createdAt: createdDate.toISOString(),
          date: createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          time: createdDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          url: outroBumper.url || '',
          duration: outroBumper.duration || 10,
          aspectRatio: outroBumper.aspectRatio || activeClip.aspectRatio || '16:9',
          bumperData: outroBumper,
        } as TimelineItem);
      }

      setClipsInfo(items);
      setActiveClipId(clipItem.id);

      const playlist = items.map((item) => item.url).filter(Boolean) as string[];
      if (playlist.length > 0) {
        setVideoPlaylist(playlist);
        setCurrentVideoIndex(0);
      }
    }
  }, [activeClip, clipId, introBumper, outroBumper]);

  const loadCollections = useCallback(async () => {
    try {
      if (!clipId) return;
      const resp = await getFoldersByClipId(clipId);
      if (resp?.success) {
        setCollections(resp.data || []);
      }
    } catch { }
  }, [clipId]);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  // Playlist recomputed elsewhere via useEffect on intro/outro changes

  // Create clip object for compatibility with existing code
  const clip = activeClip ? {
    id: activeClip._id || activeClip.id,
    name: activeClip.title,
    type: activeClip.customData?.sportName || 'Unknown',
    aspectRatio: activeClip.aspectRatio,
    tags: activeClip.tags || [],
    streamId: activeClip.streamId,
    duration: activeClip.duration,
    videoUrl: activeClip.videoUrl,
    thumbnail: activeClip.thumbnailUrl || activeClip.videoThumbnailUrl,
    rating: activeClip.rating || 0,
    date: new Date(activeClip.createdAt).toLocaleDateString(),
  } : null;

  // Transform clip data to match expected interface
  const transformedClip = clip ? {
    id: activeClip.id,
    streamId: activeClip.streamId,
    type: clip.type,
    url: getAspectUrl(activeClip, selectedAspectRatio),
    editedPreviewUrl: currentClip?.editedPreviewUrl || '',
    title: activeClip.title,
    duration: `${Math.floor(clip.duration / 60)}:${(clip.duration % 60).toString().padStart(2, '0')}`,
    aspectRatio: selectedAspectRatio,
    thumbnail: clip.thumbnail,
    timestamp: new Date(activeClip.createdAt).toLocaleString(),
    tags: activeClip.tags || [],
    start_time: activeClip.start_time || '00:00',
    end_time: activeClip.end_time || '00:00',
    rating: clip.rating || 0,
    date: clip.date,
    isAiCreated: activeClip.isAiCreated,
    time: new Date(activeClip.createdAt).toLocaleTimeString()
  } : null;

  const handlePreview = () => {
    const edited = (currentClip as any)?.editedClipData;
    const videoUrl = edited?.previewUrl || (currentClip as any)?.videoUrl || '';
    if (!videoUrl) return;
    setPreviewClipData({
      id: currentClip?.id || currentClip?._id || 'preview-clip',
      title: currentClip?.title || 'Clip Preview',
      timeRange: `${currentClip?.start_time || ''} - ${currentClip?.end_time || ''}`,
      duration: String(edited?.duration || 0),
      aspectRatio: currentClip?.aspectRatio || '16:9',
      rating: currentClip?.rating || 0,
      videoUrl,
      poster: currentClip?.thumbnailUrl,
      type: 'clip',
    });
    setIsPreviewModalOpen(true);
  };

  const handleCopyLink = async () => {
    try {
      const url = (currentClip as any)?.editedClipData?.previewUrl || (currentClip as any)?.videoUrl;
      if (url) {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleOpenSaveModal = () => {
    // setSaveStep('choice');
    setIsSaveModalOpen(true);
  };

  const handleOverwrite = async () => {
    try {
      const id = currentClip?._id || (currentClip as any)?._id;
      if (!id) return;
      const resp = await overwriteClipById(id);
      if (resp?.success) {
        toast.success('Clip overwritten successfully');
        setIsSaveModalOpen(false);
        if (currentClip?.id) dispatch(fetchClipById(currentClip.id));
      } else {
        toast.error(resp?.message || 'Overwrite failed');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Overwrite failed');
    }
  };

  const handleSaveNew = async () => {
    try {
      const id = currentClip?._id || (currentClip as any)?._id;
      if (!id || !newClipTitle.trim()) { toast.error('Please enter a title'); return; }
      const resp = await saveClipAsNew(id, newClipTitle.trim(), requestedAspectRatio || currentClip?.aspectRatio || '16:9');
      if (resp?.success) {
        toast.success('New clip created');
        setIsSaveModalOpen(false);
      } else {
        toast.error(resp?.message || 'Save failed');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Save failed');
    }
  };

  // Video player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Calculate total duration from clipsInfo
  const calculateTotalDuration = () => {
    if (!clipsInfo || clipsInfo.length === 0) return 0;
    return clipsInfo.reduce((total, item) => total + (item.duration || 0), 0);
  };

  const totalDuration = calculateTotalDuration();

  // Handler functions
  // const handleClipReorder = (newClipsInfo: TimelineItem[]) => {
  //     setClipsInfo(newClipsInfo);
  // };

  // const handleClipSelect = (clipId: string) => {
  //     console.log('ClipEditorPage: Clip selected:', clipId);
  //     setActiveClipId(clipId);
  //     const itemIndex = clipsInfo.findIndex(item => item.id === clipId);
  //     if (itemIndex !== -1) {
  //         setCurrentVideoIndex(itemIndex);
  //     }
  // };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleDurationChange = (duration: number) => {
    setDuration(duration);
  };

  // Helper functions for generate highlight

  const calculateTotalDurationWithoutBumper = (clips: TimelineItem[]) => {
    return clips.reduce((total, clip) => {
      if (clip.type !== 'bumper') {
        const duration = parseFloat(clip.duration.toString()) || 0;
        return total + duration;
      }
      return total;
    }, 0);
  };

  const getBumperIndices = (clips: TimelineItem[]) => {
    return clips.reduce((indices: number[], clip, index) => {
      if (clip.type === 'bumper') {
        indices.push(index);
      }
      return indices;
    }, []);
  };

  const handleGenerateClipHighlight = async () => {
    if (!clipsInfo.length) return;

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus("Starting generation...");

    try {
      const clips = clipsInfo.map(item => item.url).filter(Boolean);
      const clipIdArr = clipsInfo.map(clip => clip.id).filter(Boolean);
      const slateIndex = getBumperIndices(clipsInfo);
      const totalDuration = calculateTotalDuration(clipsInfo);
      const totalDurationWithoutBumper = calculateTotalDurationWithoutBumper(clipsInfo);

      const payload = {
        // clip?._id,
        clips,
        clipIdArr,
        isHighlightVideo: true,
        isImage: graphicsState.isImageSelected,
        isPreSlate: introBumper ? true : false,
        isPostSlate: outroBumper ? true : false,
        isAudio: false,
        image: graphicsState.isImageSelected
          ? {
            position: [
              graphicsState.x1Coordinate || graphicsState.imageCoordinates[2] || 0,
              graphicsState.y1Coordinate || graphicsState.imageCoordinates[3] || 0,
              graphicsState.x2Coordinate || graphicsState.imageCoordinates[4] || 0,
              graphicsState.y2Coordinate || graphicsState.imageCoordinates[5] || 0,
            ],
            url: graphicsState.selectedGraphicUrl,
          }
          : {},
        // overlay payload for AI if overlay selected
        overlay: overlaysState.overlaysState.selectedOverlayUrl ? {
          type: 'video/image',
          urls: [overlaysState.overlaysState.selectedOverlayUrl],
          overlay_time: 0,
          position: [
            overlaysState.overlaysState.x1Coordinate || overlaysState.overlaysState.overlayCoordinates[2] || 0,
            overlaysState.overlaysState.y1Coordinate || overlaysState.overlaysState.overlayCoordinates[3] || 0,
            overlaysState.overlaysState.x2Coordinate || overlaysState.overlaysState.overlayCoordinates[4] || 0,
            overlaysState.overlaysState.y2Coordinate || overlaysState.overlaysState.overlayCoordinates[5] || 0,
          ],
        } : null,
        audio: "",
        preSlate: introBumper ? [introBumper?.url || ''] : [],
        postSlate: outroBumper ? [outroBumper?.url || ''] : [],
        isTransition: null,
        transitionName: "",
        selected_transiton: "",
        audio_intensity_array: [],
        slate_index: slateIndex,
        type: "clip",
        overlayLogo: "",
        clipsinfo: clipsInfo,
        skip_trans: [],
        userId: activeClip?.userId || "",
        totalDuration,
        totalDurationWithoutBumper,
        aspectRatio: selectedAspectRatio,
        title: clipName,
        rating: rating,
        tags: tags,
        // Trim overrides sent only if changed
        start_time: (((trimStart && trimStart !== (activeClip as any)?.start_time) || (trimEnd && trimEnd !== (activeClip as any)?.end_time)) ? (trimStart || (activeClip as any)?.start_time) : undefined),
        end_time: (((trimStart && trimStart !== (activeClip as any)?.start_time) || (trimEnd && trimEnd !== (activeClip as any)?.end_time)) ? (trimEnd || (activeClip as any)?.end_time) : undefined),
        stream_url: currentStream?.hlsS3URL || currentStream?.url || (activeClip as any)?.videoUrl || undefined,
      };

      // Update clip with current title, rating, and tags
      // if (clipId) {
      //   try {
      //     await updateClip(clipId, {
      //       title: clipName,
      //       rating: rating,
      //       tags: tags
      //     });
      //   } catch (updateError) {
      //     console.error('Failed to update clip:', updateError);
      //     // Continue with generation even if update fails
      //   }
      // }

      console.log('Generating highlight with payload:', payload);
      const response = await generateClipHighlight({ ...payload, clipId: clip?.id });

      // Show API response message to user
      if (response.success) {
        if (response.data && response.data.job_id) {
          console.log('Highlight generation initiated with job_id:', response.data.job_id);
          toast.success(response.message || "Highlight generation started successfully!");

          // Start polling for progress using job_id
          pollClipHighlightProgressByJobId(
            response.data.job_id,
            clip?.id,
            (progress) => {
              setGenerationProgress(parseFloat((progress.percent || 0).toFixed(2)));
              setGenerationStatus(progress.status || "Processing...");
            },
            (result) => {
              setIsGenerating(false);
              setGenerationStatus("Generation completed!");
              toast.success("Highlight generation completed successfully!");
              console.log('Highlight generation completed:', result);

              // Refresh clip data to get editedClipData with previewUrl
              if (clip?.id) {
                dispatch(fetchClipById(clip.id));
              }

              const previewUrl = (result?.videoUrl || (result as any)?.video_url) || (currentClip as any)?.editedClipData?.previewUrl || (currentClip as any)?.editedPreviewUrl || (currentClip as any)?.videoUrl || '';
              if (previewUrl) {
                const updatedDuration = (typeof (result as any)?.high_dura === 'number' ? (result as any).high_dura : undefined) ?? (currentClip as any)?.editedClipData?.duration ?? currentClip?.duration ?? totalDuration ?? 0;
                const updatedStart = (((trimStart && trimStart !== (activeClip as any)?.start_time) || (trimEnd && trimEnd !== (activeClip as any)?.end_time)) ? (trimStart || (activeClip as any)?.start_time) : (currentClip as any)?.start_time || undefined);
                const updatedEnd = (((trimStart && trimStart !== (activeClip as any)?.start_time) || (trimEnd && trimEnd !== (activeClip as any)?.end_time)) ? (trimEnd || (activeClip as any)?.end_time) : (currentClip as any)?.end_time || undefined);
                setPreviewClipData({
                  id: currentClip?.id || currentClip?._id || clipId || 'generated-clip',
                  title: currentClip?.title || clipName || 'Generated Clip',
                  timeRange: `${updatedStart} - ${updatedEnd}`,
                  duration: String(updatedDuration),
                  aspectRatio: currentClip?.aspectRatio || '16:9',
                  rating: currentClip?.rating || 0,
                  videoUrl: previewUrl,
                  poster: currentClip?.thumbnailUrl,
                  type: 'clip',
                });
                setIsPreviewModalOpen(true);
              }
            },
            (error) => {
              setIsGenerating(false);
              setGenerationStatus("Generation failed!");
              toast.error("Highlight generation failed: " + (error.message || error));
              console.error('Highlight generation failed:', error);
            }
          );
        } else {
          setIsGenerating(false);
          toast.error("No job ID received from server");
          console.error('No job_id received from highlight generation API');
        }
      } else {
        setIsGenerating(false);
        toast.error(response.message || "Failed to start highlight generation");
        console.error('Highlight generation API returned error:', response.message);
      }
    } catch (error: any) {
      setIsGenerating(false);
      console.error('Error generating highlight:', error);

      // Show detailed error message to user
      if (error.response && error.response.data) {
        const errorMessage = error.response.data.message || "Failed to generate highlight";

        // Handle 409 conflict (highlight already in progress)
        if (error.response.status === 409) {
          toast.error(errorMessage, {
            action: {
              label: "Reset & Retry",
              onClick: async () => {
                try {
                  await resetClipHighlightStatus(activeClip?._id);
                  toast.success("Status reset successfully. You can now try generating highlight again.");
                } catch (resetError) {
                  console.error('Error resetting highlight status:', resetError);
                  toast.error("Failed to reset status. Please try again later.");
                }
              }
            }
          });
        } else {
          toast.error(errorMessage);
        }
      } else {
        toast.error("Failed to generate highlight. Please try again.");
      }
    }
  };

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          togglePlayPause();
          break;
        case 'KeyM':
          event.preventDefault();
          toggleMute();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          setCurrentTime(Math.max(0, currentTime - 10));
          break;
        case 'ArrowRight':
          event.preventDefault();
          setCurrentTime(Math.min(duration, currentTime + 10));
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, duration]);

  const togglePlayPause = () => setIsPlaying(!isPlaying);
  const toggleMute = () => setIsMuted(!isMuted);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleDownload = async () => {
    try {
      const videoUrl = (currentClip as any)?.editedClipData?.previewUrl || (currentClip as any)?.videoUrl;
      if (!videoUrl) return;
      await downloadFile(String(videoUrl), String((currentClip as any)?.title || 'video'));
    } catch (error) {
      console.error('Error downloading video:', error);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const truncateText = (text: string, maxLength: number = 25) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <svg
        key={index}
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="inline"
      >
        <path
          d="M5.46973 1.32049C5.66167 0.842504 6.33833 0.842503 6.53027 1.32048L7.67669 4.17532C7.75843 4.37886 7.94946 4.51766 8.16831 4.5325L11.2377 4.74062C11.7516 4.77546 11.9607 5.419 11.5654 5.74925L9.20456 7.72175C9.03623 7.86239 8.96327 8.08696 9.01678 8.29968L9.76733 11.2831C9.893 11.7827 9.34557 12.1804 8.90934 11.9065L6.30383 10.2708C6.11807 10.1541 5.88193 10.1541 5.69617 10.2707L3.09066 11.9065C2.65443 12.1804 2.107 11.7827 2.23267 11.2831L2.98322 8.29968C3.03674 8.08696 2.96377 7.86239 2.79544 7.72175L0.434597 5.74925C0.0393227 5.41899 0.24842 4.77546 0.762323 4.74062L3.8317 4.5325C4.05054 4.51766 4.24157 4.37886 4.32331 4.17532L5.46973 1.32049Z"
          fill={index < rating ? "#FFF" : "transparent"}
          stroke={index < rating ? "transparent" : "#FFF"}
        />
      </svg>
    ));
  };

  // Show error state
  if (error) {
    return (
      <div className="h-screen bg-[#18191B] flex overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-400 text-lg">Error: {error}</div>
        </div>
      </div>
    );
  }

  // Show message if no clip found
  if (!clip) {
    return (
      <div className="h-screen bg-[#18191B] flex overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white text-lg">Clip not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#18191B] flex overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-x-auto">
        {/* Main Content */}
        <div className="flex-1 flex min-w-[800px]">
          {/* Content Area - matches Figma layout */}
          <div className="flex-1 w-full max-w-[1000px] mx-auto overflow-y-auto min-w-[400px]">
            <div className="flex items-center gap-5 px-2 py-0 flex-shrink-0 bg-[#18191B] z-10">
              {/* Header */}
              <EditorHeader
                type={"clip"}
                data={transformedClip}
                isAiCreated={transformedClip?.isAiCreated}
                highlightName={transformedClip?.title || ""}
                aspectRatio={transformedClip?.aspectRatio || ""}
                onBack={() => navigate(`/clips/${transformedClip?.streamId}`)}
                onDownload={handleDownload}
                onPreview={handlePreview}
                onCopyLink={handleCopyLink}
                onSaveAsClip={handleOpenSaveModal}
                isPreviewAvailable={Boolean((currentClip as any)?.editedClipData?.previewUrl || (currentClip as any)?.editedPreviewUrl)}
                showControls={true}
              />
            </div>

            {/* Video Player Area */}
            <div className="flex justify-center px-2 md:px-6 py-0 bg-[#18191B] flex-shrink-0">
              <div className="h-[60vh] md:h-[490px] w-fit max-w-full bg-black relative rounded-lg overflow-hidden flex justify-center">
                <ReactVideoPlayer
                  playlist={
                    videoPlaylist.length > 0
                      ? videoPlaylist
                      : []
                  }
                  currentIndex={currentVideoIndex}
                  poster={
                    clipsInfo[0]?.url
                      ? undefined
                      : clip?.thumbnail ||
                      "https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885__340.jpg"
                  }
                  aspectRatio={selectedAspectRatio || "16:9"}
                  autoPlay={false}
                  controls={true}
                  width="auto"
                  height="100%"
                  className="rounded-lg overflow-hidden"
                  clipDurations={
                    clipsInfo
                      ? clipsInfo.map((clip) => clip.duration || 0)
                      : []
                  }
                  totalDuration={totalDuration}
                  onVideoChange={(index, url) => {
                    setCurrentVideoIndex(index);
                    // Update active clip when video changes
                    if (clipsInfo[index]) {
                      setActiveClipId(clipsInfo[index].id);
                    }
                  }}
                  timeline={clipsInfo || []}
                  onProgress={(progress) => {
                    setCurrentTime(progress.playedSeconds);
                  }}
                  onDuration={(duration) => {
                    setDuration(duration);
                  }}
                  loop={false}
                  isGenerating={isGenerating}
                  generationProgress={generationProgress}
                  generationStatus={generationStatus}
                />
              </div>
            </div>

            {/* Timeline Section */}
            {/* <div className="bg-[#18191B] px-2">
                <div className="text-center mb-1 mt-1">
                  <h5 className="text-white text-lg font-semibold">
                    Clip sequence:
                  </h5>
                </div> */}

            {/* Timeline container with 1000px width matching video player */}
            {/* <div className="max-w-[1000px] mx-auto">
                  <EditorTimeline
                  clipsInfo={clipsInfo || []}
                  activeClipId={activeClipId}
                  onClipSelect={handleClipSelect}
                  onClipReorder={handleClipReorder}
                  currentTime={currentTime}
                  onTimeUpdate={handleTimeUpdate}
                  duration={duration}
                  onDurationChange={handleDurationChange}
                />
                </div> */}
            {/* </div> */}

            {/* Collections Section */}
            <div className="bg-[#18191B] px-4 md:px-6 pb-6">
              <div className="text-center mb-3 mt-3">
                <h5 className="text-white text-lg font-semibold">
                  Clip belongs to these collections:
                </h5>
              </div>

              {/* Collections Grid */}
              <div
                className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[1050px] mx-auto overflow-y-auto pr-2"
                style={{ maxHeight: "240px" }}
              >
                {(collections?.length || 0) === 0 ? (
                  <div className="col-span-1 md:col-span-2 text-white text-center text-sm font-medium py-4">
                    You don’t have any highlights collection right now!
                  </div>
                ) : (
                  collections.map((collection: any, index: number) => (
                    <div
                      key={collection._id || index}
                      className="bg-[#252525] rounded-xl p-0 overflow-hidden h-auto sm:h-[120px]"
                    >
                      <div className="flex flex-col sm:flex-row">
                        {/* Thumbnail */}
                        <div className="w-full sm:w-[213px] h-[140px] sm:h-[120px] relative">
                          <img
                            src={collection.thumbnail || (collection.thumbnails && collection.thumbnails[0]) || activeClip?.thumbnailUrl || ""}
                            alt={collection.title || ""}
                            className="w-full h-full object-cover rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none"
                          />
                          {/* Menu Button */}
                          <div className="absolute top-2.5 right-2.5 z-20">
                            <button
                              onClick={() => setOpenMenuId(prev => prev === (collection._id || String(index)) ? null : (collection._id || String(index)))}
                              className="bg-[#252525] rounded-md flex items-center justify-center hover:bg-[#3a3a3a] transition-colors"
                              style={{ width: '30px', height: '24px' }}
                            >
                              <SVGIcon src={threeDotIcon} className="w-full h-auto" />
                            </button>

                            {/* Menu Dropdown */}
                            {openMenuId === (collection._id || String(index)) && (
                              <div className="absolute top-full right-0 mt-1 bg-[#252525] rounded-lg shadow-lg z-10 min-w-20 calendar-scroll">
                                <button className="w-full px-4 py-2 text-left text-white hover:bg-[#2A2A2A] transition-colors flex items-center gap-2" onClick={() => { setOpenMenuId(null); navigate(`/editor-page/${collection._id}?aspectRatio=${collection?.aspectRatio}`); }}>
                                  <Edit size={14} />
                                  Edit
                                </button>
                                <button
                                  onClick={() => { setOpenMenuId(null); setDeleteTarget(collection); setIsDeleteOpen(true); }}
                                  className="w-full px-4 py-2 text-left text-red-400 hover:bg-[#434343] transition-colors flex items-center gap-2"
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                          {/* Aspect Ratio Badge */}
                          <div className="absolute bottom-2 left-2">
                            <div className="bg-[#18191B] rounded-md px-2 py-1 h-6 flex items-center">
                              <span className="text-white text-xs font-medium">
                                {collection.aspectRatio || ""}
                              </span>
                            </div>
                          </div>
                          <DeleteConfirmationModal
                            isOpen={isDeleteOpen}
                            onClose={() => setIsDeleteOpen(false)}
                            onDelete={async () => {
                              try {
                                if (!deleteTarget?._id) return;
                                const resp = await deleteFolder(deleteTarget._id);
                                if (resp?.success) {
                                  toast.success('Folder deleted successfully');
                                  setIsDeleteOpen(false);
                                  setDeleteTarget(null);
                                  await loadCollections();
                                } else {
                                  toast.error(resp?.message || 'Delete failed');
                                }
                              } catch (e: any) {
                                toast.error(e?.message || 'Delete failed');
                              }
                            }}
                            itemName={deleteTarget?.title}
                          />
                          {/* Duration Badge */}
                          <div className="absolute bottom-2 right-2">
                            <div className="bg-[#18191B] rounded-md px-2 py-1 h-6 flex items-center">
                              <span className="text-white text-xs font-medium">
                                {(() => { const d = Number(collection.totalDuration || 0); const m = Math.floor(d / 60); const s = Math.floor(d % 60); return `${m}:${String(s).padStart(2, '0')}`; })()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-3 flex flex-col justify-between">
                          <div>
                            <Tooltip side="top" align="start" className="max-w-xs">
                              <TooltipTrigger asChild>
                                <h3 className="text-white text-lg font-bold mb-2 leading-relaxed">
                                  {truncateText(collection.title || "", 15)}
                                </h3>
                              </TooltipTrigger>
                              <TooltipContent>
                                {collection.title || ""}
                              </TooltipContent>
                            </Tooltip>
                            <p className="text-white text-sm font-medium mb-4 leading-relaxed">
                              {collection.createdAt ? new Date(collection.createdAt).toLocaleDateString() : ""}
                            </p>
                          </div>

                          <div className="flex items-center justify-between">
                            {/* Type Badge */}
                            {/* <div className="bg-[#18191B] rounded-md px-2 py-1 h-6 flex items-center"> */}
                            {/* </div> */}
                            <div className="px-2 py-1 h-6 flex items-center">
                              <span className="text-white text-xs font-bold">
                                {collection.clipCount || 0} clips
                              </span>
                              <span className="bg-[#18191B] rounded-md px-2 py-1 h-6 flex items-center text-white text-xs font-medium ml-2">
                                {collection.type === 'highlight' ? 'Highlight' : 'Clip'}
                              </span>
                            </div>

                            {/* Rating */}
                            {collection.rating !== 0 && (
                              <div className="flex items-center gap-1">
                                {renderStars(collection.rating || 0)}
                                <span className="text-white text-xs font-bold ml-1">
                                  {collection.rating || 0}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Modified to show clip details */}
          {transformedClip && (
            <EditorSidebar
              activeClip={transformedClip}
              clipsInfo={[transformedClip]}
              page={page}
              isGenerating={isGenerating}
              generationProgress={generationProgress}
              generationStatus={generationStatus}
              onGenerateHighlight={handleGenerateClipHighlight}
              clipName={clipName}
              setClipName={setClipName}
              tags={tags}
              setTags={setTags}
              rating={rating}
              setRating={setRating}
            />
          )}
        </div>
      </div>
      {/* Preview Modal for Edited Clip */}
      {previewClipData && (
        <PreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          clipData={previewClipData}
          page={page}
          onOverwrite={handleOverwrite}
          onOpenSaveAsNew={handleOpenSaveModal}
        />
      )}

      {previewClipData && (<SaveAsClipModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        step={saveStep}
        onChangeStep={setSaveStep}
        currentTitle={currentClip?.title}
        streamId={currentClip?.streamId}
        aspectRatio={requestedAspectRatio || currentClip?.aspectRatio}
        newTitle={newClipTitle}
        onChangeTitle={setNewClipTitle}
        onOverwrite={handleOverwrite}
        onSaveNew={handleSaveNew}
      />)}
      <DownloadPanel />
    </div>
  );
};

export default ClipEditorPage;
