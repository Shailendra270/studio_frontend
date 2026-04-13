import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../store";
import { fetchStreamById } from "../store/slices/streamsSlice";
import {
  fetchClips,
  refreshClips,
  setCurrentStreamId,
  setFilters,
  setPagination,
  selectClips,
  selectClipsLoading,
  selectClipsError,
  selectClipsFilters,
  selectClipsPagination,
  ClipData as ReduxClipData
} from "../store/slices/clipsSlice";
import DownloadPanel from "@/components/download/DownloadPanel";
import { PlusIcon } from "lucide-react";
import {
  fetchAllFolders,
  selectHighlightSections,
  selectFoldersLoading,
  selectFoldersError,
  selectFoldersLastFetch
} from "../store/slices/foldersSlice";
import Sidebar from "@/layouts/dashboard/Sidebar";
import ClipCard from "@/layouts/clipsPage/ClipCard";
import ClipFilters from "@/layouts/clipsPage/ClipFilters";
import ShimmerCard from "@/layouts/clipsPage/ClipShimmerCard";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FolderData } from "../store/slices/foldersSlice";
import { limitOptions } from "@/constants/Filter";
import RefreshButton from "@/containers/filters/RefreshButton";
import Pagination from "@/containers/filters/Pagination";
import SVGIcon from "@/components/common/SVGIcon";
import backArrow from "@/assets/svg/back-arrow.svg";
import videoEditor from "@/assets/svg/video-editor.svg";
import HelpButton from "@/containers/help_section/HelpButton";
import PreviewModal from "@/components/modals/PreviewModal";
import NewHighlightModal from "@/components/modals/NewHighlightModal";
import CreateAi_HighlightModal from "@/components/modals/CreateAi_HighlightModal";
import EndStreamConfirmationModal from "@/components/modals/EndStreamConfirmationModal";
import AddToExistingHighlightModal from "@/components/modals/AddToExistingHighlightModal";
import { NewHighlightFormData } from "@/types/highlight";
import { createFolder, updateFolder } from "@/api/folderApi";
import { endStream } from "@/api/streams";
import { toast } from "sonner";
import WebStoriesPlayer from "@/layouts/clipsPage/webStories/WebStoriesPlayer";
import LiveRecapPlayer from "@/layouts/clipsPage/LiveRecap/LiveRecapPlayer";
import Loader from "@/components/common/Loader";
import { getClipFilterCounts, getClips as getClipsApi } from "@/api/clipApi";
import PublishedTab from "@/layouts/clipsPage/PublishedTab";
import { ClipsProvider } from "@/contexts/ClipsContext";
import MetadataTab from "@/layouts/clipsPage/MetadataTab";
import { extractMatchData, CleanMatch } from "@/utils/dsg";
import { usePermissions } from "@/hooks/usePermissions";

interface ClipsProps {
  page: string;
}

const Clips: React.FC<ClipsProps> = ({ page }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { streamId } = useParams<{ streamId: string }>();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Redux selectors
  const { currentStream: stream, currentStreamLoading: streamLoading, currentStreamError: streamError } = useSelector((state: RootState) => state.streams);
  const { user } = useSelector((state: RootState) => state.auth);
  // Clips Redux state
  const clips = useSelector(selectClips);
  const clipsLoading = useSelector(selectClipsLoading);
  const clipsError = useSelector(selectClipsError);
  const clipsFilters = useSelector(selectClipsFilters);
  const clipsPagination = useSelector(selectClipsPagination);
  // Folders Redux state
  const highlightSections = useSelector(selectHighlightSections);
  const foldersLoading = useSelector(selectFoldersLoading);
  const foldersError = useSelector(selectFoldersError);
  const foldersLastFetch = useSelector(selectFoldersLastFetch);

  const [selectedClips, setSelectedClips] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("clips");
  const [limitPerPage, setLimitPerPage] = useState("20");
  const [currentPage, setCurrentPage] = useState(1);
  const [isNewHighlightModalOpen, setIsNewHighlightModalOpen] = useState(false);
  const [isCreateAiHighlightModalOpen, setIsCreateAiHighlightModalOpen] = useState(false);
  const [isAddToExistingModalOpen, setIsAddToExistingModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedClipForPreview, setSelectedClipForPreview] = useState<any>(null);
  const [selectedClipData, setSelectedClipData] = useState<any>(null);
  const [folderDropdowns, setFolderDropdowns] = useState<{ [key: string]: boolean }>({});
  const [clipDropdowns, setClipDropdowns] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [folderData, setFolderData] = useState<any>(null);
  const [isEndStreamModalOpen, setIsEndStreamModalOpen] = useState(false);
  const [isEndingStream, setIsEndingStream] = useState(false);
  const [availableFolders, setAvailableFolders] = useState<any[]>([]);
  const [filterCounts, setFilterCounts] = useState<{
    tags: Record<string, number>;
    ratings: Record<string, number>;
    aspectRatios: Record<string, number>;
  }>({ tags: {}, ratings: {}, aspectRatios: {} });
  const [matchMeta, setMatchMeta] = useState<any>(null);
  const [matchMetaLoading, setMatchMetaLoading] = useState<boolean>(false);
  const [matchMetaError, setMatchMetaError] = useState<string>("");
  const [matchClean, setMatchClean] = useState<CleanMatch | null>(null);
  const { canCreate: canCreateHighlight, canEdit: canEditClip } = usePermissions();

  // Create stable refs for dropdowns to avoid recreating on every render
  const dropdownRefs = useRef<{ [key: string]: React.RefObject<HTMLDivElement> }>({});

  const getDropdownRef = (id: string) => {
    if (!dropdownRefs.current[id]) {
      dropdownRefs.current[id] = React.createRef<HTMLDivElement>();
    }
    return dropdownRefs.current[id];
  };

  useEffect(() => {
    const run = async () => {
      const id = stream?.matchId;
      if (!id) {
        setMatchMeta(null);
        return;
      }
      try {
        setMatchMetaLoading(true);
        setMatchMetaError("");
        const apiBase = (import.meta as any).env?.VITE_VIDEO_API_URL || "";
        const categoryParam = String(stream?.category || '').toLowerCase();
        const qs = categoryParam ? `?category=${encodeURIComponent(categoryParam)}` : '';
        const resp = await fetch(`${apiBase}/api/streams/match/${id}/metadata${qs}`, { credentials: "include" });
        const json = await resp.json();
        const payload = json?.data ?? json;
        const matchPayload = Array.isArray(payload) ? payload[0] : payload;
        setMatchMeta(matchPayload || null);
        const cleaned = extractMatchData(matchPayload || {});
        const selected = cleaned.find((m) => String(m.matchId) === String(id)) || cleaned[0] || null;
        setMatchClean(selected);
      } catch (e: any) {
        setMatchMetaError(e?.message || "Failed to load match metadata");
        setMatchMeta(null);
        setMatchClean(null);
      } finally {
        setMatchMetaLoading(false);
      }
    };
    run();
  }, [stream?.matchId]);

  // Fetch highlights data using Redux
  const fetchHighlights = () => {
    if (!user?.userId || !streamId) return;

    // Convert sortBy string to MongoDB sort object
    const getSortObject = (sortBy: string) => {
      switch (sortBy) {
        case 'latest':
          return { createdAt: -1 };
        case 'oldest':
          return { createdAt: 1 };
        case 'rating':
          return { rating: -1, createdAt: -1 };
        case 'duration':
          return { totalDuration: -1, createdAt: -1 };
        default:
          return { createdAt: -1 };
      }
    };

    // When tab is highlights, include filter parameters
    const payload: any = {
      userId: user.userId,
      streamId: streamId,
      type: "highlight",
      page_no: 1,
      limit: 50,
      sortBy: getSortObject(clipsFilters.sortBy || 'latest'),
    };

    // Add filters when on highlights tab
    if (activeTab === 'highlights') {
      if (clipsFilters.search) {
        payload.search = clipsFilters.search;
      }
      if (clipsFilters.aspectRatio) {
        payload.aspectRatio = clipsFilters.aspectRatio;
      }
      if (clipsFilters.rating && clipsFilters.rating.length > 0) {
        payload.rating = clipsFilters.rating;
      }
      if (clipsFilters.dateRange && clipsFilters.dateRange.startDate && clipsFilters.dateRange.endDate) {
        payload.dateRange = clipsFilters.dateRange;
      }
    }

    dispatch(fetchAllFolders(payload));
  };

  // Handle tab change to highlights
  const handleTabChange = (value: string) => {
    setActiveTab(value);

    // Reset filters when switching tabs
    dispatch(setFilters({
      page: 1,
      search: '',
      sortBy: { createdAt: -1 },
      aspectRatio: '',
      tags: [],
      rating: [],
      dateRange: null,
      status: ''
    }));

    if (value === 'highlights' && user?.userId && streamId) {
      // Only fetch if data is stale or doesn't exist
      const isStale = !foldersLastFetch || (Date.now() - foldersLastFetch > 5 * 60 * 1000); // 5 minutes
      if (isStale || highlightSections.length === 0) {
        fetchHighlights();
      }
    }
  };

  // Fetch stream data
  useEffect(() => {
    if (streamId) {
      dispatch(fetchStreamById(streamId));
      dispatch(setCurrentStreamId(streamId));
      dispatch(setFilters({
        search: '',
        tags: [],
        aspectRatio: '',
        rating: [],
        duration: '',
        sortBy: 'latest',
        dateRange: { startDate: '', endDate: '' },
        status: 'all',
      }));
    }
  }, [dispatch, streamId]);

  const lastFetchKeyRef = React.useRef<string>("");
  useEffect(() => {
    if (!streamId || activeTab !== 'clips') return;
    const keyObj = {
      streamId,
      page: clipsPagination.page,
      limit: clipsPagination.limit,
      search: clipsFilters.search,
      sortBy: clipsFilters.sortBy,
      aspectRatio: clipsFilters.aspectRatio,
      tags: clipsFilters.tags,
      rating: clipsFilters.rating,
      dateRange: clipsFilters.dateRange,
      status: clipsFilters.status,
    };
    const key = JSON.stringify(keyObj);
    if (key === lastFetchKeyRef.current) return;
    lastFetchKeyRef.current = key;
    dispatch(fetchClips(keyObj));
  }, [
    dispatch,
    streamId,
    clipsPagination.page,
    clipsPagination.limit,
    clipsFilters.search,
    clipsFilters.sortBy,
    clipsFilters.aspectRatio,
    clipsFilters.tags,
    clipsFilters.rating,
    clipsFilters.dateRange,
    clipsFilters.status,
    activeTab
  ]);

  // Fetch dynamic filter counts whenever filter context changes
  useEffect(() => {
    const fetchCounts = async () => {
      if (!streamId || activeTab !== 'clips') return;
      try {
        const resp = await getClipFilterCounts({
          streamId,
          search: clipsFilters.search,
          aspectRatio: clipsFilters.aspectRatio || undefined,
          tags: clipsFilters.tags,
          rating: clipsFilters.rating,
          dateRange: clipsFilters.dateRange || undefined,
          status: clipsFilters.status,
        });
        const tagsMap: Record<string, number> = {};
        const ratingsMap: Record<string, number> = {};
        const aspectsMap: Record<string, number> = {};
        resp.data.tags.forEach((t: any) => {
          const keyRaw = (t.tag ?? t.label ?? t.name ?? t._id ?? '').toString();
          const key = keyRaw.trim().toLowerCase();
          if (key) tagsMap[key] = t.count;
        });
        resp.data.ratings.forEach((r: any) => { ratingsMap[String(r.rating)] = r.count; });
        resp.data.aspectRatios.forEach((a: any) => { aspectsMap[a.aspectRatio] = a.count; });
        setFilterCounts({ tags: tagsMap, ratings: ratingsMap, aspectRatios: aspectsMap });
      } catch (e) {
        console.warn('Failed to fetch filter counts', e);
      }
    };
    fetchCounts();
  }, [
    streamId,
    activeTab,
    clipsFilters.search,
    // clipsFilters.aspectRatio,
    // clipsFilters.tags,
    // clipsFilters.rating,
    clipsFilters.dateRange,
    clipsFilters.status,
  ]);

  // Fetch highlights data on component mount
  useEffect(() => {
    if (user?.userId && streamId) {
      fetchHighlights();
    }
  }, [user?.userId, streamId]);

  // Refetch highlights when filters change and active tab is highlights
  useEffect(() => {
    if (activeTab === 'highlights' && user?.userId && streamId) {
      fetchHighlights();
    }
  }, [activeTab, clipsFilters.search, clipsFilters.aspectRatio, clipsFilters.rating, clipsFilters.dateRange, clipsFilters.sortBy, user?.userId, streamId]);

  const renderClipsGrid = (clips: ClipData[], keyPrefix: string = 'clips') => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {clips.map((clip) => {
          const clipId = clip._id || clip.id;
          const uniqueKey = `${keyPrefix}-${clipId}`;
          const dropdownRef = getDropdownRef(uniqueKey);
          const showDropdown = clipDropdowns[clipId] || false;

          return (
            <ClipCard
              key={uniqueKey}
              clip={clip}
              onSelect={handleClipSelect}
              page={page}
              showDropdown={showDropdown}
              setShowDropdown={(show: boolean) => {
                setClipDropdowns(prev => ({
                  ...prev,
                  [clipId]: show
                }));
              }}
              activeTab={activeTab}
              isSelected={selectedClips.has(clipId)}
              onClick={() => handleClipThumbnailClick(clip)}
              dropdownRef={dropdownRef}
              onRefresh={handleRefresh}
              aspectRatioFilter={clipsFilters.aspectRatio}
            />
          );
        })}
      </div>
    );
  };

  const renderFoldersGrid = (folders: FolderData[], keyPrefix: string = 'folders') => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {folders.map((folder) => {
          const uniqueKey = `${keyPrefix}-${folder._id}`;
          const dropdownRef = getDropdownRef(uniqueKey);
          const showDropdown = folderDropdowns[folder._id] || false;

          return (
            <ClipCard
              key={uniqueKey}
              folder={folder}
              isFolder={true}
              onSelect={(id, selected) => {
                // Handle folder selection if needed
                console.log('Folder selected:', id, selected);
              }}
              isSelected={false} // Add folder selection logic if needed
              activeTab={activeTab}
              page="clips"
              lazyLoad={true}
              dropdownRef={dropdownRef}
              showDropdown={showDropdown}
              setShowDropdown={(show: boolean) => {
                setFolderDropdowns(prev => ({
                  ...prev,
                  [folder._id]: show
                }));
              }}
              onClick={() => handleFolderThumbnailClick(folder)}
              onRefresh={handleRefresh}
            />
          );
        })}
      </div>
    );
  };

  const renderSection = (section: HighlightSection) => {
    const hasClips = section.clips && section.clips.length > 0;
    const hasFolders = section.folders && section.folders.length > 0;

    if (!hasClips && !hasFolders) {
      return (
        <div key={section.id} className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-white">{section.title}</h2>
            <span className="text-xl font-medium text-white mb-2">{section.count}</span>
          </div>
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v1a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1h4zM3 8v10a2 2 0 002 2h14a2 2 0 002-2V8H3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-300 mb-2">No {section.title.toLowerCase()} found</h3>
            <p className="text-gray-500">Create your first {section.title.toLowerCase().slice(0, -1)} to get started.</p>
          </div>
        </div>
      );
    }

    return (
      <div key={section.id} className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl font-bold text-white">{section.title}</h2>
          <span className="text-xl font-medium text-white mb-2">{section.count}</span>
        </div>
        <div className="space-y-6">
          {hasFolders && renderFoldersGrid(section.folders!, `section-${section.id}-folders`)}
          {hasClips && renderClipsGrid(section.clips, `section-${section.id}-clips`)}
        </div>
      </div>
    );
  };

  const handleClipSelect = (clipId: string, selected: boolean) => {
    const newSelectedClips = new Set(selectedClips);
    if (selected) {
      newSelectedClips.add(clipId);
    } else {
      newSelectedClips.delete(clipId);
    }
    setSelectedClips(newSelectedClips);
  };

  // Calculate total duration of selected clips
  const calculateTotalDuration = () => {
    let totalSeconds = 0;
    selectedClips.forEach(clipId => {
      const clip = clips.find(c => c.id === clipId || c._id === clipId);
      if (clip) {
        const d = clip.duration;
        if (typeof d === 'number') {
          totalSeconds += d;
        } else if (typeof d === 'string') {
          const match = d.match(/^(\d{1,2}):(\d{1,2}):(\d{1,2}(?:\.\d+)?)$/);
          if (match) {
            const h = parseInt(match[1], 10) || 0;
            const m = parseInt(match[2], 10) || 0;
            const s = parseFloat(match[3]) || 0;
            totalSeconds += (h * 3600) + (m * 60) + s;
          } else {
            const asNum = parseFloat(d);
            if (!isNaN(asNum)) totalSeconds += asNum;
          }
        }
      }
    });

    // Round to nearest whole second to avoid floating point artifacts
    totalSeconds = Math.round(totalSeconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleSelectAll = () => {
    if (selectedClips.size === currentClips.length) {
      // If all current clips are selected, deselect all
      setSelectedClips(new Set());
    } else {
      // Select all current clips
      setSelectedClips(new Set(currentClips.map((clip) => clip._id || clip.id)));
    }
  };

  const handleClear = () => {
    setSelectedClips(new Set());
  };

  const totalClips = clipsPagination.total || clips.length;
  const selectedCount = selectedClips.size;
  const totalDuration = calculateTotalDuration();

  // Pagination - use Redux pagination
  const currentClips = clips;

  // Handle pagination changes
  const handlePageChange = (newPage: number) => {
    dispatch(setPagination({ page: newPage }));
  };

  // Handle limit change
  const handleLimitChange = (newLimit: string) => {
    const limit = parseInt(newLimit);
    dispatch(setPagination({ limit, page: 1 }));
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const videoTitle = streamLoading
    ? "Loading..."
    : streamError
      ? "Error loading stream"
      : stream?.title || "Unknown Stream";

  const handleRefresh = () => {
    if (activeTab === 'clips' && streamId) {
      dispatch(fetchClips({
        streamId,
        page: clipsPagination.page,
        limit: clipsPagination.limit,
        search: clipsFilters.search,
        sortBy: clipsFilters.sortBy,
        aspectRatio: clipsFilters.aspectRatio,
        tags: clipsFilters.tags,
        rating: clipsFilters.rating,
        dateRange: clipsFilters.dateRange,
        status: clipsFilters.status
      }));
    } else if (activeTab === 'highlights') {
      fetchHighlights();
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

  const handleCreateNewHighlight = () => {
    setIsNewHighlightModalOpen(true);
  };

  const handleNewHighlightSubmit = async (data: NewHighlightFormData) => {
    try {
      if (!user?.userId || !streamId) {
        toast.error('Missing user or stream information');
        return;
      }

      // Create folder payload
      const createFolderPayload = {
        aspectRatio: data.aspectRatio,
        userId: user.userId,
        streamId: streamId,
        title: data.title.trim(),
        type: 'highlight' as const,
        category: stream?.category || '',
      };

      // Create the folder
      const folderResponse = await createFolder(createFolderPayload);

      if (!folderResponse.success) {
        toast.error(folderResponse?.message || 'Failed to create highlight folder');
        return;
      }

      // If there are selected clips, update the folder with them
      if (selectedClips.size > 0) {
        // Get the actual clip data for selected clips and sort them chronologically
        const selectedClipData = clips.filter(clip => selectedClips.has(clip._id));
        const toSeconds = (t: any) => {
          const s = String(t || '').trim();
          if (!s) return 0;
          const parts = s.split(':').map(Number);
          if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
          if (parts.length === 2) return parts[0] * 60 + parts[1];
          return Number(s) || 0;
        };
        const sortedClips = selectedClipData.sort((a: any, b: any) => {
          const aStart = toSeconds(a.start_time);
          const bStart = toSeconds(b.start_time);
          if (aStart !== bStart) return aStart - bStart;
          const aEnd = toSeconds(a.end_time);
          const bEnd = toSeconds(b.end_time);
          return aEnd - bEnd;
        });
        const updateFolderPayload = {
          clips: sortedClips.map(clip => clip._id)
        };
      
        const updateResponse = await updateFolder(folderResponse.data._id, updateFolderPayload);

        if (!updateResponse.success) {
          toast.error('Folder created but failed to add clips');
          return;
        }
      }

      // Success message
      toast.success('Highlight folder created successfully!');

      // Open new tab with editor page for the created folder
      const newFolderId = folderResponse.data._id;
      window.open(`/editor-page/${newFolderId}?aspectRatio=${data?.aspectRatio}`, '_blank');

      fetchHighlights();
      // Clear selected clips
      setSelectedClips(new Set());

    } catch (error: any) {
      console.error('Error creating highlight:', error);
      toast.error(error.message || 'Failed to create highlight');
    }
  };

  const handleCloseNewHighlightModal = () => {
    setIsNewHighlightModalOpen(false);
  };

  // Handle Add to Existing Highlight Modal
  const handleAddToExistingHighlight = async () => {
    if (selectedClips.size === 0) {
      toast.error("Please select clips to add to highlight");
      return;
    }

    try {
      // Extract all folders from Redux highlightSections
      const allFolders: any[] = [];
      
      highlightSections.forEach(section => {
        if (section.folders && section.folders.length > 0) {
          allFolders.push(...section.folders);
        }
      });

      // Transform folders data for the modal
      const folders = allFolders.map((folder: any) => ({
        id: folder._id,
        title: folder.title || folder.name,
        clips: folder.clips || []
      }));
      
      setAvailableFolders(folders);
      setIsAddToExistingModalOpen(true);
    } catch (error) {
      console.error("Error processing folders:", error);
      toast.error("Failed to process highlights");
    }
  };

  const handleCloseAddToExistingModal = () => {
    setIsAddToExistingModalOpen(false);
    setAvailableFolders([]);
  };

  const handleAddClipsToFolder = async (folderId: string, clipsToAdd: string[]) => {
    try {
      // Get the current folder to merge with existing clips
      const selectedFolder = availableFolders.find(folder => folder.id === folderId);
      if (!selectedFolder) {
        throw new Error("Selected folder not found");
      }

      // Extract existing clip IDs (handle both clip objects and clip ID strings)
      const existingClipIds = (selectedFolder.clips || []).map((clip: any) => {
        if (typeof clip === 'string') {
          return clip; // Already a clip ID
        } else if (clip && (clip._id || clip.id)) {
          return clip._id || clip.id; // Extract ID from clip object
        }
        return null;
      }).filter(Boolean);

      // Merge existing clips with new clips (avoid duplicates)
      const allClips = [...new Set([...existingClipIds, ...clipsToAdd])];
      // Update the folder with the merged clips
      const updateResponse = await updateFolder(folderId, {
        clips: allClips
      });

      if (!updateResponse.success) {
        throw new Error(updateResponse.message || "Failed to update folder");
      }

      // Always refresh folders data after successful clip addition
      // This ensures the Redux state is updated with the latest folder contents
      fetchHighlights();

      // Clear selected clips
      setSelectedClips(new Set());

    } catch (error: any) {
      console.error("Error adding clips to folder:", error);
      throw error; // Re-throw to be handled by the modal
    }
  };


  const handleClipThumbnailClick = (clip: ClipData) => {
    // Get the appropriate thumbnail based on aspect ratio filter
    const getThumbnailForPreview = () => {
      // Check if aspect ratio filter is applied and if clip has matching editedVideos
      if (clipsFilters.aspectRatio && clipsFilters.aspectRatio !== 'all' && clip.editedVideos) {
        // Find editedVideo with matching aspect ratio (excluding DYNAMIC events)
        const matchingEditedVideo = clip.editedVideos.find(
          editedVideo => editedVideo.aspect_ratio === clipsFilters.aspectRatio &&
            editedVideo.event !== 'DYNAMIC'
        );

        if (matchingEditedVideo && matchingEditedVideo.thumbnailUrl) {
          return matchingEditedVideo.thumbnailUrl;
        }
      }

      return clip.thumbnailUrl;
    };

    setSelectedClipForPreview({
      id: clip._id || clip.id,
      title: clip.title,
      timeRange: `${clip.start_time} - ${clip.end_time}`,
      duration: clip.duration,
      aspectRatio: clip.aspectRatio,
      rating: clip.rating,
      poster: getThumbnailForPreview(),
      videoUrl: clip.videoUrl,
      type: clip.type,
    });
    setSelectedClipData(clip); // Store the full clip data for PreviewModal
    setIsPreviewModalOpen(true);
  };

  const handleFolderThumbnailClick = (clip: FolderData) => {
    setSelectedClipForPreview({
      id: clip._id || clip.id,
      title: clip.title,
      timeRange: 'AI Highlight',
      duration: clip.totalDuration,
      aspectRatio: clip.aspectRatio,
      rating: clip.rating,
      poster: clip.thumbnail,
      videoUrl: clip.previewUrl,
      type: clip.type,

    });
    setIsPreviewModalOpen(true);
  };

  const handleClosePreviewModal = () => {
    setIsPreviewModalOpen(false);
    setSelectedClipForPreview(null);
    setSelectedClipData(null);
    setFolderData(null);
  };

  const [specialClips, setSpecialClips] = useState<ReduxClipData[]>([] as any);
  useEffect(() => {
    const tabKey = String(activeTab);
    if (!streamId) return;
    if (tabKey !== 'web-stories' && tabKey !== 'live-recap') return;
    const isFootball = String(stream?.category || '').toLowerCase() === 'football';
    const footballTags = ["Goal","Save","Card","Chance","VAR Decision","Penalty","Red Card","Free Kick",];
    (async () => {
      try {
        const resp = await getClipsApi({
          streamId: String(streamId),
          page: 1,
          // limit: 20,
          sortBy: 'latest',
          tags: isFootball ? footballTags : [],
          status: 'completed',
        });
        if (resp?.success) {
          setSpecialClips(resp.clips || []);
        }
      } catch (e) {
        // silent
      }
    })();
  }, [activeTab, streamId, stream?.category]);

  useEffect(() => {
    const sid = streamId;
    const shouldAutoRefresh =
      activeTab === "clips" &&
      (stream?.analysis_server === "ai_server");
    if (!shouldAutoRefresh) return;
    let sock: any;
    (async () => {
      const mod = await import('@/socket/client');
      sock = mod.connectSocket();
      sock.on('webhook-update', onEvent);
    })();
    const onEvent = (payload: any) => {
      if (!payload) return;
      if (payload.streamId && String(payload.streamId) !== String(sid)) return;
      dispatch(refreshClips(String(sid)));
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        dispatch(refreshClips(String(sid)));
      }
    };
    // document.addEventListener("visibilitychange", onVisibility);
    return () => {
      try {
        sock?.off('webhook-update', onEvent);
      } catch {}
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [activeTab, streamId, stream?.analysis_server, dispatch]);

  return (
    <ClipsProvider>
    <>
      {/* <div className="h-screen bg-[#18191B] text-white flex overflow-hidden"> */}
      <div className="h-screen bg-[#18191B] text-white flex overflow-x-hidden">
        <Sidebar />

        {/* <div className="flex-1 flex flex-col overflow-hidden"> */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* Header */}
          <div className="bg-[#18191B] border-b border-[#252525] px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex items-center justify-between mb-4">
              {/* Back button and title */}
              <div className="flex items-center gap-3 sm:gap-4">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="text-white hover:text-gray-300 transition-colors mb-3"
                >
                  <SVGIcon
                    src={backArrow}
                    className="w-2 h-4"
                    aria-label="Back"
                  />
                </button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h1 className="text-2xl font-medium text-white cursor-help">
                      {truncateText(videoTitle)}
                    </h1>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{videoTitle}</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Right side buttons */}
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-end">
                {/* Timer */}
                {/* <div className="flex items-center gap-2 text-white">
                    <span className="text-sm font-medium">{"00:57:38"}</span>
                  </div> */}

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

                {/* Video Editor */}
                {/* <Button
                    // onClick={() => navigate(`/live-video/${streamId}`)}
                    className="bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white h-11 px-6 hover:opacity-90 transition-opacity"
                  >
                    <Upload size={14} />
                    Upload Clip
                  </Button> */}

                {/* Video Editor */}
                {activeTab === "clips" && canEditClip('Clips') && (
                  <Button
                    onClick={() => navigate(`/live-video/${streamId}`)}
                    className="bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white h-10 sm:h-11 px-4 sm:px-6 hover:opacity-90 transition-opacity"
                  >
                    <SVGIcon
                      src={videoEditor}
                      className="mr-2 w-4 h-3"
                      aria-label="Video Editor"
                    />
                    Video editor
                  </Button>
                )}
                {/* Create Highlight */}
                {activeTab === "highlights" && canCreateHighlight('Highlights') && (
                  <Button
                    onClick={() => setIsCreateAiHighlightModalOpen(true)}
                    className="bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white h-10 sm:h-11 px-4 sm:px-6 hover:opacity-90 transition-opacity"
                  >
                    <PlusIcon size={14} />
                    Create Highlight
                  </Button>
                )}
              </div>
            </div>

            {/* Tabs and Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="bg-transparent p-0 h-auto">
                  <TabsTrigger
                    value="clips"
                    className="bg-transparent text-white data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none relative px-4 py-2"
                  >
                    Clips
                    {activeTab === "clips" && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] rounded-t"></div>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="highlights"
                    className="bg-transparent text-white data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none relative px-4 py-2"
                  >
                    Highlights
                    {activeTab === "highlights" && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] rounded-t"></div>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="web-stories"
                    className="bg-transparent text-white data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none relative px-4 py-2"
                  >
                    Web stories
                    {activeTab === "web-stories" && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] rounded-t"></div>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="live-recap"
                    className="bg-transparent text-white data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none relative px-4 py-2"
                  >
                    Live recap
                    {activeTab === "live-recap" && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] rounded-t"></div>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="published"
                    className="bg-transparent text-white data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none relative px-4 py-2"
                  >
                    Published
                    {activeTab === "published" && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] rounded-t"></div>
                    )}
                  </TabsTrigger>
                  {stream?.matchId && (<TabsTrigger
                    value="metadata"
                    className="bg-transparent text-white data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none relative px-4 py-2"
                  >
                    Metadata
                    {activeTab === "metadata" && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] rounded-t"></div>
                    )}
                  </TabsTrigger>)}
                </TabsList>
                
              </Tabs>

              {/* Right side actions */}
              <div className="flex items-center gap-4">
                {/* Refresh */}
                <RefreshButton onClick={handleRefresh} text={true} />

                {/* Limit Dropdown */}
                <SearchableSelect
                  value={clipsPagination.limit.toString()}
                  onChange={(value) =>
                    handleLimitChange(Array.isArray(value) ? value[0] : value)
                  }
                  options={limitOptions}
                  className="bg-[#252525] text-white w-24 sm:w-28 h-10 sm:h-11"
                />
              </div>
            </div>
          </div>

          {/* Main Content Area with Sidebar and Content */}
          {/* <div className="flex-1 flex overflow-hidden"> */}
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* Filters Sidebar - Hidden for web-stories and live-recap */}
            {activeTab !== "web-stories" && activeTab !== "live-recap" && activeTab !== "metadata" &&(
                <div className="hidden min-[700px]:flex lg:w-80 w-full sm:w-64 md:w-72 bg-[#18191B] border-r border-[#252525] flex-col">
                {/* Clip Count above Filters */}
                {activeTab !== "highlights" && (
                  <div className="px-6 py-4 text-center">
                    <span className="text-sm text-white">
                      {selectedCount} of {totalClips} clips selected
                    </span>
                    <div className="flex justify-center gap-4 mt-2">
                      <button
                        onClick={handleSelectAll}
                        className="text-sm text-white underline hover:text-gray-300"
                      >
                        {selectedClips.size === currentClips.length
                          ? "Deselect all"
                          : "Select all"}
                      </button>
                      <button
                        onClick={handleClear}
                        className="text-sm text-white underline hover:text-gray-300"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}

                <ClipFilters page={page} activeTab={activeTab} streamId={streamId} counts={filterCounts} />
              </div>
            )}
            {/* Content Area */}
            {/* <div className="flex-1 flex flex-col overflow-hidden"> */}
            {/* <div className="flex-1 flex flex-col min-h-screen overflow-auto"> */}
            <div className="flex-1 flex flex-col min-h-0 overflow-auto">
              {/* Action Buttons Bar */}
              {activeTab === "clips" && (
                <div className="bg-[#18191B] border-b border-[#252525] px-4 sm:px-6 py-3 sm:py-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3 sm:gap-5">
                      {canCreateHighlight('Highlights') && (
                        <>
                          <Button
                            variant="outline"
                            className="bg-[#252525] border-[#00BBFF] text-white hover:bg-[#00BBFF]/10 h-10 sm:h-11 px-6 sm:px-10 md:px-20 rounded-xl"
                            disabled={selectedCount === 0}
                            onClick={handleCreateNewHighlight}
                          >
                            <span className="text-xl font-bold text-white">
                              +
                            </span>{" "}
                            Create new highlight
                          </Button>
                          <span className="text-white text-sm">or</span>
                          <Button
                            variant="outline"
                            className="bg-[#252525] border-[#00BBFF] text-white hover:bg-[#00BBFF]/10 h-10 sm:h-11 px-6 sm:px-10 md:px-20 rounded-xl"
                            disabled={selectedCount === 0}
                            onClick={handleAddToExistingHighlight}
                          >
                            <span className="text-xl font-bold text-white">
                              +
                            </span>{" "}
                            Add to existing highlight
                          </Button>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6 text-sm text-white flex-wrap justify-end">
                      <div className="flex items-center gap-4">
                        <span>
                          Total duration:{" "}
                          <span className="font-bold">{totalDuration}</span>
                        </span>

                        {/* Pagination next to Total Duration */}
                        <Pagination
                          currentPage={clipsPagination.page}
                          totalPages={clipsPagination.totalPages}
                          onPrevious={() =>
                            handlePageChange(Math.max(clipsPagination.page - 1, 1))
                          }
                          onNext={() =>
                            handlePageChange(Math.min(clipsPagination.page + 1, clipsPagination.totalPages))
                          }
                          onChangePage={(p) => handlePageChange(p)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Content */}
              {/* <div className="flex-1 overflow-y-auto p-6"> */}
              <div className={`flex-1 overflow-y-auto min-h-0 ${activeTab === 'web-stories' || activeTab === 'live-recap' || activeTab === 'metadata' ? 'p-0' : 'p-6'}`}>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                  <TabsContent value="clips" className="mt-0">
                    {clipsLoading ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                        {Array.from({ length: 8 }, (_, index) => (
                          <ShimmerCard key={index} variant="clip" />
                        ))}
                      </div>
                    ) : clipsError ? (
                      <div className="text-center text-white py-12">
                        <h3 className="text-xl font-medium mb-2">Error loading clips</h3>
                        <p className="text-gray-400 mb-4">{clipsError}</p>
                        <button
                          onClick={handleRefresh}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                        >
                          Retry
                        </button>
                      </div>
                    ) : currentClips.length === 0 ? (
                      <div className="text-center text-white py-12">
                        <h3 className="text-xl font-medium mb-2">No clips found</h3>
                        <p className="text-gray-400">Try adjusting your filters or create some clips.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {currentClips.map((clip, index) => {
                          const clipId = clip._id || clip.id;
                          const uniqueKey = `main-clips-${clipId}-${index}`;
                          const dropdownRef = getDropdownRef(uniqueKey);
                          const showDropdown = clipDropdowns[clipId] || false;

                          return (
                            <ClipCard
                              key={uniqueKey}
                              clip={clip}
                              activeTab={activeTab}
                              page={page}
                              isSelected={selectedClips.has(clipId)}
                              onSelect={handleClipSelect}
                              onClick={() =>
                                handleClipThumbnailClick(clip)
                              }
                              dropdownRef={dropdownRef}
                              showDropdown={showDropdown}
                              setShowDropdown={(show: boolean) => {
                                setClipDropdowns(prev => ({
                                  ...prev,
                                  [clipId]: show
                                }));
                              }}
                              onRefresh={handleRefresh}
                              aspectRatioFilter={clipsFilters.aspectRatio}
                            />
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="highlights" className="mt-0">
                    {foldersLoading ? (
                      <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                      </div>
                    ) : foldersError ? (
                      <div className="text-center py-12">
                        <p className="text-red-400">Error loading highlights: {foldersError}</p>
                        <button
                          onClick={fetchHighlights}
                          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Retry
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-12">
                        {highlightSections.map(renderSection)}
                        {highlightSections.length === 0 && (
                          <div className="text-center text-white py-12">
                            <h3 className="text-xl font-medium mb-2">
                              No highlights yet
                            </h3>
                            <p className="text-gray-400">
                              Select clips and add them to highlights to see them here.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="web-stories" className="mt-0 h-full">
                    {specialClips.length > 0 ? (
                      <WebStoriesPlayer clips={[...specialClips]} />
                    ) : (
                      <div className="text-center text-white py-12">
                        <h3 className="text-xl font-medium mb-2">
                          No web stories yet
                        </h3>
                        <p className="text-gray-400">
                          Create web stories from your clips to see them here.
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="live-recap" className="mt-0 h-full">
                    {specialClips.length > 0 ? (
                      <LiveRecapPlayer clips={[...specialClips]} />
                    ) : (
                      <div className="text-center text-white py-12">
                        <h3 className="text-xl font-medium mb-2">
                          No live recap available
                        </h3>
                        <p className="text-gray-400">
                          Live recap will appear here during or after live streams.
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="published" className="mt-0">
                    {activeTab === 'published' && (
                      <PublishedTab streamId={streamId} userId={user?.userId} />
                    )}
                  </TabsContent>
                  {stream?.matchId !== undefined && (
                    <TabsContent value="metadata" className="mt-0 h-full">
                      <MetadataTab matchId={stream?.matchId} matchPayload={matchMeta} cleanMatch={matchClean || undefined} loading={matchMetaLoading} error={matchMetaError} />
                    </TabsContent>
                  )}
                </Tabs>
              </div>
            </div>
          </div>
          {/* Help Button */}
          <HelpButton />
        </div>
        {/* Create Highlight Modal */}
        <CreateAi_HighlightModal
          isOpen={isCreateAiHighlightModalOpen}
          onClose={() => setIsCreateAiHighlightModalOpen(false)}
          onCreateHighlight={handleCreateNewHighlight}
          setIsLoading={setIsLoading}
          setIsPreviewModalOpen={setIsPreviewModalOpen}
          setFolderData={setFolderData}
        />

        {/* Loader */}
        <Loader
          isVisible={isLoading}
          message="Creating highlight, please wait..."
        />

        {/* Preview Modal */}
        {isPreviewModalOpen && folderData && (
          <PreviewModal
            isOpen={isPreviewModalOpen}
            onClose={handleClosePreviewModal}
            clipData={folderData}
            page="highlights"
          />
        )}
        {/* Preview Modal */}
        {selectedClipForPreview && (
          <PreviewModal
            isOpen={isPreviewModalOpen}
            onClose={handleClosePreviewModal}
            clipData={selectedClipForPreview}
            aspectRatioFilter={clipsFilters.aspectRatio}
            clip={selectedClipData}
            page={page}
          />
        )}
        {/* New Highlight Modal */}
        <NewHighlightModal
          isOpen={isNewHighlightModalOpen}
          onClose={handleCloseNewHighlightModal}
          selectedClips={Array.from(selectedClips)}
          onCreateHighlight={handleNewHighlightSubmit}
        />
        {/* Add to Existing Highlight Modal */}
        <AddToExistingHighlightModal
          isOpen={isAddToExistingModalOpen}
          onClose={handleCloseAddToExistingModal}
          selectedClips={Array.from(selectedClips)}
          folders={availableFolders}
          onAddToHighlight={handleAddClipsToFolder}
          streamId={streamId}
        />
        {/* Create Highlight Modal */}
        <CreateAi_HighlightModal
          isOpen={isCreateAiHighlightModalOpen}
          onClose={() => {
            setIsCreateAiHighlightModalOpen(false);
            setFolderData(null);
          }}
          onCreateHighlight={(data) => {
            setIsCreateAiHighlightModalOpen(false);
            setFolderData(data);
          }}
          setIsLoading={setIsLoading}
          setIsPreviewModalOpen={setIsPreviewModalOpen}
          setFolderData={setFolderData}
          category={stream?.category}
          streamId={stream?.streamId}
        />
        {/* End Stream Confirmation Modal */}
        <EndStreamConfirmationModal
          isOpen={isEndStreamModalOpen}
          onClose={() => setIsEndStreamModalOpen(false)}
          onConfirm={handleEndStream}
          isLoading={isEndingStream}
        />
      </div>
      <DownloadPanel />
    </>
    </ClipsProvider>
  );
};

export default Clips;
