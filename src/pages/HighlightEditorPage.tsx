import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchFolderById, selectCurrentFolder, selectCurrentFolderLoading, selectCurrentFolderError } from "@/store/slices/foldersSlice";
import Sidebar from "@/layouts/dashboard/Sidebar";
import EditorHeader from "@/layouts/highlightEditor/EditorHeader";
import EditorTimeline, { TimelineItem } from "@/layouts/highlightEditor/EditorTimeline";
import EditorSidebar from "@/layouts/highlightEditor/EditorSidebar";
import ReactVideoPlayer from "@/components/common/ReactVideoPlayer";
import PreviewModal from "@/components/modals/PreviewModal";
import SaveAsClipModal from "@/components/modals/SaveAsClipModal";
import DownloadPanel from "@/components/download/DownloadPanel";
import { saveClipFromFolder } from "@/api/clipApi";
import { Folder } from "lucide-react";
import { GraphicsProvider } from "@/contexts/GraphicsContext";
import { OverlaysProvider } from "@/contexts/OverlaysContext";
import { generateHighlight, pollHighlightProgressByJobId, resetHighlightStatus } from '../api/folderApi';
import { useGraphics } from "@/contexts/GraphicsContext";
import { useOverlays } from "@/contexts/OverlaysContext";
import { toast } from "sonner";
import { downloadFile } from '@/utils/download';
import { updateFolder } from "../api/folderApi";
import ResizeClipsModal from "@/components/modals/ResizeClipsModal";
import { autoflip, getClipById } from "@/api/clipApi";
import { usePermissions } from "@/hooks/usePermissions";

interface EditorPageProps {
  page: string;
}

const EditorPage: React.FC<EditorPageProps> = ({ page }) => {
  return (
    <GraphicsProvider>
      <OverlaysProvider>
        <EditorPageContent page={page} />
      </OverlaysProvider>
    </GraphicsProvider>
  );
};

const EditorPageContent: React.FC<EditorPageProps> = ({ page }) => {
  const navigate = useNavigate();
  const { folderId } = useParams<{ folderId: string }>();
  const dispatch = useAppDispatch();

  // Redux selectors
  const currentFolder = useAppSelector(selectCurrentFolder);
  const loading = useAppSelector(selectCurrentFolderLoading);
  const error = useAppSelector(selectCurrentFolderError);
  // Initialize clips state
  const [clipsInfo, setClipsInfo] = useState<TimelineItem[]>([]);
  const [deletedItemIds, setDeletedItemIds] = useState<Set<string>>(new Set());

  // Use clipsInfo as the main clips data source
  const clips: TimelineItem[] = clipsInfo;

  // Local state
  const [activeClipId, setActiveClipId] = useState<string>("");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoPlaylist, setVideoPlaylist] = useState<string[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState("");
  
  // General tab persistent state
  const [clipName, setClipName] = useState(currentFolder?.title || '');
  const [tags, setTags] = useState<string[]>(currentFolder?.tags || []);
  const [rating, setRating] = useState(currentFolder?.rating || 0);
  
  // Preview Modal state
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewClipData, setPreviewClipData] = useState<any>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveStep, setSaveStep] = useState<'choice' | 'new'>('new');
  const [newClipTitle, setNewClipTitle] = useState('');
  const [isResizeModalOpen, setIsResizeModalOpen] = useState(false);
  const { canEdit: canEditHighlight, canDelete: canDeleteHighlight } = usePermissions();
  
  // Preview Modal handlers
  const handleClosePreviewModal = () => {
    setIsPreviewModalOpen(false);
    setPreviewClipData(null);
  };
  // Fetch folder details when component mounts or folderId changes
  useEffect(() => {
    if (folderId) {
      dispatch(fetchFolderById(folderId));
    }
  }, [dispatch, folderId]);
  
  // Update states when currentFolder changes
  useEffect(() => {
    if (currentFolder) {
      setClipName(currentFolder.title || '');
      setTags(currentFolder.tags || []);
      setRating(currentFolder.rating || 0);
    }
  }, [currentFolder]);

  const handleClipReorder = (newClipsInfo: TimelineItem[]) => {
    // TODO: Update folder clips order in backend
    setClipsInfo(newClipsInfo);
  };

  const handleClipDelete = async (itemId: string) => {
    try {
      // Add to deleted items set
      setDeletedItemIds(prev => new Set([...prev, itemId]));
      
      // Remove the item from clipsInfo
      const updatedClipsInfo = clipsInfo.filter(item => item.id !== itemId);
      setClipsInfo(updatedClipsInfo);
      
      // Update video playlist using aspect-ratio aware logic
      const folderAspectRatio = currentFolder?.aspectRatio;
      // const mismatchedBumpers = clipsInfo.filter(
      //   (item) => item.type === 'bumper' && item.aspectRatio && folderAspectRatio && item.aspectRatio !== folderAspectRatio
      // );
      // if (mismatchedBumpers.length > 0) {
      //   setIsGenerating(false);
      //   setGenerationStatus("Aspect ratio mismatch");
      //   toast.error("Bumper aspect ratio should be same as highlight/clips aspectratio");
      //   return;
      // }
      const updatedPlaylist = updatedClipsInfo
        .map((item) => {
          if (item.type === 'bumper') {
            return (item as any).url || (item as any).url || null;
          }
          if (!folderAspectRatio || folderAspectRatio === '16:9') {
            return (item as any).videoUrl || item.url || null;
          }
          const editedVideos: any[] | undefined = (item as any)?.clipData?.editedVideos;
          const match = Array.isArray(editedVideos)
            ? editedVideos.find((ev: any) => ev?.aspect_ratio === folderAspectRatio && ev?.videoUrl)
            : null;
          return match?.videoUrl || (item as any)?.videoUrl || item.url || null;
        })
        .filter(Boolean) as string[];
      setVideoPlaylist(updatedPlaylist);
      
      // If the deleted item was active, set the first item as active
      if (activeClipId === itemId && updatedClipsInfo.length > 0) {
        setActiveClipId(updatedClipsInfo[0].id);
        setCurrentVideoIndex(0);
      } else if (updatedClipsInfo.length === 0) {
        setActiveClipId("");
        setCurrentVideoIndex(0);
      }
      
      // Update folder in backend - remove clip from folder's clips array
      if (currentFolder && folderId) {
        const updatedClipIds = currentFolder.clips
          .filter(clip => (clip.id || clip._id) !== itemId)
          .map(clip => clip._id || clip.id);
        
        await updateFolder(folderId, { clips: updatedClipIds });
      }
      
      // Show success message
      toast.success("Item removed from timeline");
    } catch (error) {
      console.error('Error removing clip from folder:', error);
      toast.error("Failed to remove item from folder");
    }
  };

  // Set initial active clip when folder data is loaded and update when clips change
  useEffect(() => {
    if (currentFolder && currentFolder.clips && currentFolder.clips.length > 0) {
      // Filter out deleted items before processing
      const nonDeletedClips = currentFolder.clips.filter((item, index) => 
        !deletedItemIds.has(item.id || item._id || index.toString())
      );
      
      // Validate and update clips/bumpers data
      const validatedItems: TimelineItem[] = nonDeletedClips.map((item, index) => {
        const createdDate = new Date(item.createdAt || Date.now());

        // Check if this is a bumper (added via Redux action) or a clip
        const itemType = item.type === 'bumper' ? 'bumper' : 'clip';

        const baseItem = {
          id: item.id || index.toString(),
          type: itemType as "clip" | "bumper",
          title: item.title || (itemType === 'bumper' ? (item.bumperData?.title || "Bumper") : "Untitled Clip"),
          date: createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          time: createdDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          url: item.url || item.videoUrl || "",
          duration: item.duration || 0,
          aspectRatio: item.aspectRatio || "16:9",
        };

        if (itemType === 'bumper') {
          return {
            ...baseItem,
            bumperData: item.bumperData || item
          };
        } else {
          return {
            ...baseItem,
            timestamp: `${item.start_time} - ${item.end_time}`,
            rating: item.rating || 0,
            tags: item.tags || [],
            streamId: item.streamId || "",
            clipData: item.clipData || item,
          };
        }
      });

      // Update clipsInfo state with validated data
      setClipsInfo(validatedItems);

      setActiveClipId(currentFolder.clips[0]._id || currentFolder.clips[0].id || "");

      // Create video playlist according to folder aspect ratio
      const folderAspectRatio = currentFolder?.aspectRatio;
      const videoUrls = validatedItems
        .map((item) => {
          if (item.type === 'bumper') {
            return (item as any).url || (item as any).url || null;
          }
          if (!folderAspectRatio || folderAspectRatio === '16:9') {
            return (item as any).videoUrl || item.url || null;
          }
          const editedVideos: any[] | undefined = (item as any)?.clipData?.editedVideos;
          const match = Array.isArray(editedVideos)
            ? editedVideos.find((ev: any) => ev?.aspect_ratio === folderAspectRatio && ev?.videoUrl)
            : null;
          return match?.videoUrl || (item as any)?.videoUrl || item.url || null;
        })
        .filter(Boolean) as string[];

      if (videoUrls.length > 0) {
        setVideoPlaylist(videoUrls);
        setCurrentVideoIndex(0);
      }
    }
  }, [currentFolder, currentFolder?.clips, deletedItemIds]);

  // Update video playlist whenever clipsInfo changes
  useEffect(() => {
    if (clipsInfo && clipsInfo.length > 0) {
      const folderAspectRatio = currentFolder?.aspectRatio;
      const videoUrls = clipsInfo
        .map((item) => {
          if (item.type === 'bumper') {
            return (item as any).url || (item as any).videoUrl || null;
          }
          if (!folderAspectRatio || folderAspectRatio === '16:9') {
            return (item as any).videoUrl || item.url || null;
          }
          const editedVideos: any[] | undefined = (item as any)?.clipData?.editedVideos;
          const match = Array.isArray(editedVideos)
            ? editedVideos.find((ev: any) => ev?.aspect_ratio === folderAspectRatio && ev?.videoUrl)
            : null;
          return match?.videoUrl || (item as any)?.videoUrl || item.url || null;
        })
        .filter(Boolean) as string[];

      if (videoUrls.length > 0) {
        setVideoPlaylist(videoUrls);
        // Reset to first video if current index is out of bounds
        if (currentVideoIndex >= videoUrls.length) {
          setCurrentVideoIndex(0);
        }
      }
    }
  }, [clipsInfo, currentFolder?.aspectRatio]);

  const { graphicsState } = useGraphics();
  const overlaysState = useOverlays();
  
  // const calculateTotalDuration = (clips: TimelineItem[]) => {
  //    return clips.reduce((total, clip) => {
  //      const duration = parseFloat(clip.duration) || 0;
  //      return total + duration;
  //    }, 0);
  //  };

  // Calculate total duration from clipsInfo
  const calculateTotalDuration = () => {
    if (!clipsInfo || clipsInfo.length === 0) return 0;
    return clipsInfo.reduce((total, item) => total + (item.duration || 0), 0);
  };

  const calculateTotalDurationWithoutBumper = (clips: TimelineItem[]) => {
    return clips.reduce((total, clip) => {
      if (clip.type !== 'bumper') {
        const duration = parseFloat(clip.duration) || 0;
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

  const handleGenerateHighlight = async () => {
    if (!folderId || !clipsInfo.length || !currentFolder) return;

    const folderAspectRatio = currentFolder?.aspectRatio;
    if (folderAspectRatio && folderAspectRatio !== '16:9') {
      const hasMismatch = clipsInfo.some((item) => {
        if (item.type !== 'clip') return false;
        const editedVideos: any[] | undefined = (item as any)?.clipData?.editedVideos;
        const match = Array.isArray(editedVideos)
          ? editedVideos.find((ev: any) => ev?.aspect_ratio === folderAspectRatio && ev?.videoUrl)
          : null;
        return !match?.videoUrl;
      });
      if (hasMismatch) {
        setIsResizeModalOpen(true);
        return;
      }
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus("Starting generation...");

    try {
      const folderAspectRatio = currentFolder?.aspectRatio;
      const clips = clipsInfo
        .map((item) => {
          if (item.type === 'clip') {
            if (!folderAspectRatio || folderAspectRatio === '16:9') {
              return (item as any).videoUrl || item.url || null;
            }
            const editedVideos: any[] | undefined = (item as any)?.clipData?.editedVideos;
            const match = Array.isArray(editedVideos)
              ? editedVideos.find((ev: any) => ev?.aspect_ratio === folderAspectRatio && ev?.videoUrl)
              : null;
            return match?.videoUrl || null;
          }
          if (item.type === 'bumper') {
            if (item.aspectRatio && folderAspectRatio && item.aspectRatio === folderAspectRatio) {
              return item.url || (item as any)?.bumperData?.url || null;
            }
            return null;
          }
          return null;
        })
        .filter(Boolean) as string[];

      // Keep clip IDs aligned with the clips URLs we are sending
      const clipIdArr = clipsInfo
        .filter(item => item.type === 'clip')
        .map(item => item._id || item.id)
        .filter(Boolean);
      const slateIndex = getBumperIndices(clipsInfo);
      const totalDuration = calculateTotalDuration(clipsInfo);
      const totalDurationWithoutBumper = calculateTotalDurationWithoutBumper(clipsInfo);

      const payload = {
        folderId,
        clips,
        clipIdArr,
        isHighlightVideo: true,
        isImage: graphicsState.isImageSelected,
        isPreSlate: false,
        isPostSlate: false,
        isAudio: false,
        image: graphicsState.isImageSelected ? {
          position: [
            graphicsState.x1Coordinate || graphicsState.imageCoordinates[2] || 0,
            graphicsState.y1Coordinate || graphicsState.imageCoordinates[3] || 0,
            graphicsState.x2Coordinate || graphicsState.imageCoordinates[4] || 0,
            graphicsState.y2Coordinate || graphicsState.imageCoordinates[5] || 0,
          ],
          url: graphicsState.selectedGraphicUrl,
        } : {},
        overlay: overlaysState.overlaysState?.selectedOverlayUrl ? {
          type: "video/image",
          url: overlaysState.overlaysState.selectedOverlayUrl ? overlaysState.overlaysState.selectedOverlayUrl : "",
          overlay_time: 0,
          position: [
            overlaysState.overlaysState.x1Coordinate || overlaysState.overlaysState.overlayCoordinates[2] || 0,
            overlaysState.overlaysState.y1Coordinate || overlaysState.overlaysState.overlayCoordinates[3] || 0,
            overlaysState.overlaysState.x2Coordinate || overlaysState.overlaysState.overlayCoordinates[4] || 0,
            overlaysState.overlaysState.y2Coordinate || overlaysState.overlaysState.overlayCoordinates[5] || 0,
          ],
        } : null,
        audio: "",  
        preSlate: [],
        postSlate: [],
        isTransition: null,
        transitionName: "",
        selected_transiton: "",
        audio_intensity_array: [],
        slate_index: slateIndex,
        type: "highlight",
        overlayLogo: "",
        clipsinfo: clipsInfo,
        skip_trans: [],
        userId: currentFolder.userId || "",
        totalDuration,
        totalDurationWithoutBumper,
        title: clipName,
        rating: rating,
        tags: tags
      };

      // Update folder with current title, rating, and tags
      try {
        await updateFolder(folderId, {
          title: clipName,
          rating: rating,
          tags: tags
        });
      } catch (updateError) {
        console.error('Failed to update folder:', updateError);
        // Continue with generation even if update fails
      }

      const response = await generateHighlight(payload);

      // Show API response message to user
      if (response.success) {
        if (response.data && response.data.job_id) {
          console.log('Highlight generation initiated with job_id:', response.data.job_id);
          toast.success(response.message || "Highlight generation started successfully!");

          // Start polling for progress using job_id
          pollHighlightProgressByJobId(
            response.data.job_id,
            folderId,
            (progress) => {
              setGenerationProgress(parseFloat((progress.percent || 0).toFixed(2)));
              setGenerationStatus(progress.status || "Processing...");
            },
            (result) => {
              setIsGenerating(false);
              setGenerationStatus("Generation completed!");
              toast.success("Highlight generation completed successfully!");
              console.log('Highlight generation completed:', result);

              // Refresh folder data in Redux store to update header buttons
              if (folderId) {
                dispatch(fetchFolderById(folderId));
              }

              // Refresh folder data or trigger video player update
              if (result.folder && result.folder.previewUrl) {
                console.log('Highlight video ready:', result.folder.previewUrl);
                
                // Automatically open PreviewModal with generated highlight
                setPreviewClipData({
                  id: result.folder._id || folderId || 'generated-highlight',
                  title: result.folder.title || currentFolder?.title || 'Generated Highlight',
                  timeRange: 'Generated',
                  duration: result.folder.totalDuration || '0',
                  aspectRatio: result.folder.aspectRatio || '16:9',
                  rating: result.folder.rating || '0',
                  videoUrl: result.folder.previewUrl,
                  poster: result.folder.thumbnailUrl,
                  type: 'highlight'
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
    } catch (error) {
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
                  await resetHighlightStatus(folderId);
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
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("An unexpected error occurred while generating highlight");
      }
    }
  };

  const hasMatchingAspectForItem = (item: any, folderAspectRatio?: string) => {
    if (!folderAspectRatio || folderAspectRatio === '16:9') return true;
    const editedVideos: any[] | undefined = (item?.clipData)?.editedVideos;
    const normalizedFolderAspect = String(folderAspectRatio).replace(/\s/g, '');
    return Array.isArray(editedVideos)
      ? editedVideos.some((ev: any) => ((String(ev?.aspect_ratio || '').replace(/\s/g, '')) === normalizedFolderAspect) && ev?.event !== 'DYNAMIC' && ev?.videoUrl)
      : false;
  };

  const runAutoFlipForMismatched = async () => {
    setIsResizeModalOpen(false);
    try {
      const folderAspectRatio = currentFolder?.aspectRatio;
      const mismatchClips = clipsInfo.filter((item) => item.type === 'clip' && !hasMatchingAspectForItem(item as any, folderAspectRatio));
      if (!folderAspectRatio || mismatchClips.length === 0) { setIsResizeModalOpen(false); return; }
      const normalizedAR = String(folderAspectRatio);
      await Promise.all(mismatchClips.map(async (item) => {
        const clipId = (item as any)?.clipData?._id || (item as any)?.clipData?.id || item.id;
        const title = String(item.title || 'Clip');
        if (!clipId) return;
        const toastId = toast.loading('Generating clip via Center-crop', { description: `${title} • ${normalizedAR}` });
        try {
          await autoflip(String(clipId), normalizedAR);
          const normalizedFolderAspect = normalizedAR.replace(/\s/g, '');
          for (let i = 0; i < 60; i++) {
            const resp = await getClipById(String(clipId));
            const editedVideos: any[] = resp?.data?.editedVideos || [];
            const ok = Array.isArray(editedVideos) ? editedVideos.some((ev: any) => (String(ev?.aspect_ratio || '').replace(/\s/g, '') === normalizedFolderAspect) && ev?.videoUrl) : false;
            if (ok) {
              toast.success('Clip synced successfully!', { id: toastId });
              if (folderId) { dispatch(fetchFolderById(folderId)); }
              return;
            }
            await new Promise((r) => setTimeout(r, 3000));
          }
          toast.error('Sync timeout', { id: toastId });
        } catch (e) {
          toast.error('Failed to initiate', { description: title, id: toastId });
        }
      }));
    } finally {
      setIsResizeModalOpen(false);
    }
  };

  const totalDuration = calculateTotalDuration();

  const handleClipSelect = (clipId: string) => {
    console.log('HighlightEditorPage: Clip selected:', clipId);
    setActiveClipId(clipId);
    // Find the index of the selected clip in the validated items array
    const itemIndex = clipsInfo.findIndex(item =>
      (item.type === 'clip' && item.id === clipId) ||
      (item.type === 'bumper' && item.id === clipId)
    );
    console.log('HighlightEditorPage: Item index found:', itemIndex);
    if (itemIndex !== -1) {
      setCurrentVideoIndex(itemIndex);
    }
  };

   const handleDownload = async () => {
    try {
      const videoUrl = currentFolder?.previewUrl || '';
      await downloadFile(String(videoUrl), String(currentFolder?.title || 'video'));
    } catch (error) {
      console.error('Error downloading video:', error);
    }
  };

  const handlePreview = () => {
    if (currentFolder?.previewUrl) {
      setPreviewClipData({
        id: currentFolder._id || folderId || 'current-highlight',
        title: currentFolder.title || 'Current Highlight',
        timeRange: 'Full Video',
        duration: currentFolder.totalDuration || '0',
        aspectRatio: currentFolder.aspectRatio || '16:9',
        rating: currentFolder.rating || '0',
        videoUrl: currentFolder.previewUrl,
        poster: currentFolder.thumbnailUrl,
        type: 'highlight'
      });
      setIsPreviewModalOpen(true);
    }
  };

  const handleCopyLink = async () => {
    try {
      if (currentFolder?.previewUrl) {
        await navigator.clipboard.writeText(currentFolder.previewUrl);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleDurationChange = (duration: number) => {
    setDuration(duration);
  };

  const activeClip = clips.find((clip) => clip.id === activeClipId) || clips[0];

  // Loading state — gradient loader consistent with User Management
  if (loading) {
    return (
      <div className="h-screen bg-[#18191B] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-xl border-2 border-[#252525] border-t-[#00EEFF] border-r-[#0051FF] animate-spin" />
        <span className="text-white text-sm font-medium">Loading folder details…</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen bg-[#18191B] flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-xl font-semibold mb-2">Error Loading Folder</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => navigate(`/clips/${currentFolder?.streamId}`)}
            className="px-4 py-2 text-white rounded-xl font-medium hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #00EEFF 0%, #0051FF 100%)" }}
          >
            Back to Clips
          </button>
        </div>
      </div>
    );
  }

  // No folder found
  if (!currentFolder) {
    return (
      <div className="h-screen bg-[#18191B] flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-xl font-semibold mb-2">Folder Not Found</h2>
          <p className="text-gray-400 mb-4">The requested folder could not be found.</p>
          <button
            type="button"
            onClick={() => navigate("/clips")}
            className="px-4 py-2 text-white rounded-xl font-medium hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #00EEFF 0%, #0051FF 100%)" }}
          >
            Back to Clips
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-screen bg-[#18191B] flex overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/*<div className="flex items-center gap-5 px-6 py-4 flex-shrink-0 bg-[#18191B] z-10">
          <button
            onClick={handleBackClick}
            className="text-white hover:text-gray-300 transition-colors mb-2"
          >
            <svg width="8" height="13" viewBox="0 0 8 13" fill="none">
              <path d="M2.83 6.36L7.78 1.41 6.37 0 .003 6.36 6.37 12.73 7.78 11.31 2.83 6.36Z" fill="white" />
            </svg>
          </button>
          <span className="[font-family:'Montserrat',Helvetica] font-medium text-white text-xs text-center mb-2">
            Live
          </span>
          <h6 className="text-white text-[20px] font-medium leading-[47.6px] font-montserrat">
            Bangladesh vs Bhutan | FIFA Friendly match
          </h6>
        </div>*/}

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Content Area - matches Figma layout */}
            <div className="flex-1 overflow-y-auto min-w-0" style={{ maxWidth: "calc(100vw - 540px - 80px)" }}>
              <div className="flex items-center gap-5 px-2 py-0 flex-shrink-0 bg-[#18191B] z-10">
                {/* Header */}
                <EditorHeader
                  type={"highlight"}
                  isAiCreated={currentFolder.isAiCreated || false}
                  data={currentFolder}
                  highlightName={currentFolder?.title || "Untitled Folder"}
                  aspectRatio={currentFolder.aspectRatio || "16:9"}
                  onBack={() => navigate(-1)}
                  onDownload={handleDownload}
                  onPreview={handlePreview}
                  onCopyLink={handleCopyLink}
                  onSaveAsClip={canEditHighlight('Highlights') ? () => setIsSaveModalOpen(true) : undefined}
                  showControls={canEditHighlight('Highlights')}
                />
              </div>
              {/* Video Player Area */}
              {/*<div className="flex items-center justify-center bg-[#18191B] py-12">
              <div
                className="bg-black rounded-xl overflow-hidden"
                style={{ width: '800px', height: '450px' }}
              >*/}
              <div className="flex justify-center px-6 pt-6 pb-0 bg-[#18191B] flex-shrink-0">
                <div className="h-[482px] bg-black relative rounded-lg overflow-hidden flex justify-center">
                  <ReactVideoPlayer
                    playlist={
                      videoPlaylist.length > 0
                        ? videoPlaylist
                        : []
                    }
                    currentIndex={currentVideoIndex}
                    poster={
                      activeClip?.thumbnailUrl ||
                      "https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885__340.jpg"
                    }
                    // timelineControl={true}
                    autoPlay={false}
                    controls={true}
                    width="100%"
                    height="100%"
                    aspectRatio={currentFolder.aspectRatio || "16:9"}
                    className="rounded-lg overflow-hidden"
                    clipDurations={clipsInfo.map((clip) => clip.duration || 0)}
                    totalDuration={totalDuration}
                    onVideoChange={(index, url) => {
                      setCurrentVideoIndex(index);
                      // Update active clip/bumper when video changes
                      if (clipsInfo[index]) {
                        setActiveClipId(clipsInfo[index].id);
                      }
                    }}
                    // timeline={clipsInfo}
                    onProgress={(progress) => {
                      setCurrentTime(progress.playedSeconds);
                    }}
                    onDuration={(duration) => {
                      setDuration(duration);
                    }}
                    muted={false}
                    loop={false}
                    isGenerating={isGenerating}
                    generationProgress={generationProgress}
                    generationStatus={generationStatus}
                  />
                </div>
              </div>

              {/* Timeline Section */}
              <div className="bg-[#18191B] px-2">
                <div className="text-center mb-1 mt-1">
                  <h5 className="text-white text-md font-semibold">
                    Clip sequence:
                  </h5>
                </div>

                {/* Timeline container with 1000px width matching video player */}
                <div className="max-w-[1000px] mx-auto">
                  <EditorTimeline
                    clipsInfo={clipsInfo}
                    currentFolder={currentFolder}
                    activeClipId={activeClipId}
                    onClipReorder={handleClipReorder}
                    onClipSelect={handleClipSelect}
                    onClipDelete={handleClipDelete}
                    canDelete={canDeleteHighlight('Highlights')}
                  />
                </div>
              </div>
            </div>

            {/* Right Sidebar - exact width from Figma */}
            {/* <div className="hidden lg:block lg:w-[800px] flex-shrink-0"> */}
            <EditorSidebar
              activeClip={activeClip}
              clipsInfo={clipsInfo}
              page={page}
              isGenerating={isGenerating}
              generationProgress={generationProgress}
              generationStatus={generationStatus}
              onGenerateHighlight={handleGenerateHighlight}
              clipName={clipName}
              setClipName={setClipName}
              tags={tags}
              setTags={setTags}
              rating={rating}
              setRating={setRating}
            />
            {/* </div> */}
          </div>
        </div>
      </div>
      
      {/* Preview Modal for Generated Highlight */}
      {previewClipData && (
        <PreviewModal
          isOpen={isPreviewModalOpen}
          onClose={handleClosePreviewModal}
          clipData={previewClipData}
          page={page}
        />
      )}

      {previewClipData && (<SaveAsClipModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        step={saveStep}
        onChangeStep={setSaveStep}
        currentTitle={currentFolder?.title}
        streamId={currentFolder?.streamId}
        aspectRatio={String((currentFolder as any)?.aspectRatio || '')}
        newTitle={newClipTitle}
        onChangeTitle={setNewClipTitle}
        onOverwrite={() => {}}
        onSaveNew={async () => {
          try {
            if (!folderId || !newClipTitle.trim()) { toast.error('Please enter a title'); return; }
            const resp = await saveClipFromFolder(folderId, newClipTitle.trim());
            if (resp?.success) {
              toast.success('Clip saved');
              setIsSaveModalOpen(false);
            } else {
              toast.error(resp?.message || 'Save failed');
            }
          } catch (e: any) {
            toast.error(e?.message || 'Save failed');
          }
        }}
      />)}
      <DownloadPanel />

      <ResizeClipsModal
        isOpen={isResizeModalOpen}
        onClose={() => setIsResizeModalOpen(false)}
        aspectRatio={String(currentFolder?.aspectRatio || '16:9')}
        category={String((currentFolder as any)?.category || '')}
        onAutoFlip={runAutoFlipForMismatched}
        onCenterCrop={runAutoFlipForMismatched}
      />
    </>
  );
};

export default EditorPage;
