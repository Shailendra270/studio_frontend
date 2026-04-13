import React, { useState, useEffect, useMemo, useCallback, act } from "react";
import { useParams } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/store";
import { fetchOverlays, deleteOverlayAsset } from "@/store/slices/assetsSlice";
import EntityCard from "@/layouts/EditorEntities/EntityCard";
import SortDropdown from "@/containers/filters/SortByDropDown";
import SearchBar from "@/containers/filters/SearchBar";
import UploadAssetsModal from "@/components/modals/UploadAssetsModal";
import GradientRailSlider from "@/components/ui/gradient-rail-slider";
import { updateClip } from "@/api/clipApi";
import { toast } from "sonner";
import DeleteConfirmationModal from "@/components/modals/DeleteConfirmationModal";
import { useOverlays } from "../../contexts/OverlaysContext";

interface ClipItem {
  id: string;
  title: string;
  duration: string;
  aspectRatio: string;
  thumbnail: string;
  timestamp: string;
  tags: string[];
  rating: number;
  date: string;
  time: string;
}

interface OverlaysTabProps {
  activeClip: ClipItem;
}

interface OverlayItem {
  id: string;
  title: string;
  date: string;
  thumbnail?: string;
  aspectRatio?: string;
  // fileFormat: "MP4" | "JPG" | "PNG" | "GIF";
  duration?: string;
  delay?: number;
  backgroundColor?: string;
  logo?: React.ReactNode;
}

const OverlaysTab: React.FC<OverlaysTabProps> = ({ activeClip }) => {
  const { streamId } = useParams<{ streamId: string }>();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { overlays } = useAppSelector((state) => state.assets);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  // Removed selectedItemId - now using selectedPosition from context
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  // Use overlays context
  const {
    overlaysState,
    setSelectedOverlay,
    setOverlayCoordinates,
    setSelectedPosition,
    clearOverlaysSelection,
    setOverlayCoordinatePercentages,
    setOverlayResizeData,
    setOverlayAssetDimensions,
  } = useOverlays();
  
  const { selectedPosition } = overlaysState;
  const [isDelayModalOpen, setIsDelayModalOpen] = useState(false);
  const [delayValue, setDelayValue] = useState(0);
  const [delayMax, setDelayMax] = useState(60);
  const [delayTargetId, setDelayTargetId] = useState<string | null>(null);

  const parseDurationToSeconds = (d: any): number => {
    if (typeof d === "number" && !Number.isNaN(d)) return Math.max(0, Math.floor(d));
    if (typeof d === "string") {
      const parts = d.split(":").map(p => parseInt(p, 10));
      if (parts.every(n => !Number.isNaN(n))) {
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        if (parts.length === 1) return parts[0];
      }
      const asNum = parseInt(d, 10);
      if (!Number.isNaN(asNum)) return asNum;
    }
    return 60;
  };

  const openDelayModal = (overlayId: string, currentDelay?: number) => {
    const max = parseDurationToSeconds((activeClip as any)?.duration ?? 60);
    setDelayMax(Math.max(1, max));
    setDelayValue(Math.min(currentDelay ?? 0, Math.max(1, max)));
    setDelayTargetId(overlayId);
    setIsDelayModalOpen(true);
  };

  const closeDelayModal = () => {
    setIsDelayModalOpen(false);
    setDelayTargetId(null);
  };

  const handleSetDelay = async () => {
    try {
      const clipId = (activeClip as any)?._id || (activeClip as any)?.id;
      console.log(clipId, activeClip);
      if (!clipId) throw new Error("Missing active clip _id");
      await updateClip(clipId, { overlay_delay: delayValue });
      toast.success("Delay time set");
      setIsDelayModalOpen(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to set delay");
    }
  };

  // Initialize first position as selected on component mount
  useEffect(() => {
    setSelectedPosition("1");
  }, []);

  // Fetch overlays on component mount only if data doesn't exist and no error occurred
  useEffect(() => {
    if (user?.userId && !overlays.loading && !overlays.error) {
      const isAspectRatio = ["9:16", "16:9", "1:1", "4:5"].includes(sortBy);
      const sortParam = isAspectRatio ? -1 : (sortBy === "latest" ? -1 : 1);

      dispatch(fetchOverlays({
        userId: user.userId,
        // folderId: streamId,
        limit: 50,
        pageNo: 1,
        sortBy: sortParam
      }));
    }
  }, [dispatch, user?.userId, streamId, sortBy, overlays.error]);

  // Calculate overlay coordinates based on position
  const calculateOverlayCoordinates = useCallback((mappedFlag: number) => {
    const videoWidth = 1920;
    const videoHeight = 1080;
    const padding = 0;
    let overlayWidth = ((overlaysState.x2Coordinate || overlaysState.overlayCoordinates[4] || 0) - (overlaysState.x1Coordinate || overlaysState.overlayCoordinates[2] || 0)) / 100 * videoWidth || 200;
    let overlayHeight = ((overlaysState.y2Coordinate || overlaysState.overlayCoordinates[5] || 0) - (overlaysState.y1Coordinate || overlaysState.overlayCoordinates[3] || 0)) / 100 * videoHeight || 150;
    if (overlaysState.naturalWidth && overlaysState.naturalHeight) {
      const ratio = overlaysState.naturalWidth / overlaysState.naturalHeight;
      overlayHeight = Math.round(overlayWidth / ratio);
    }
    
    let x = 0, y = 0;
    
    switch (mappedFlag) {
      case 1: // top-left
        x = padding;
        y = padding;
        break;
      case 2: // top-right
        x = videoWidth - overlayWidth - padding;
        y = padding;
        break;
      case 3: // bottom-left
        x = padding;
        y = videoHeight - overlayHeight - padding;
        break;
      case 4: // bottom-right
        x = videoWidth - overlayWidth - padding;
        y = videoHeight - overlayHeight - padding;
        break;
      case 5: // center
        x = (videoWidth - overlayWidth) / 2;
        y = (videoHeight - overlayHeight) / 2;
        break;
      default:
        x = padding;
        y = padding;
    }
    
    // Convert to percentages for ReactVideoPlayer
    let leftPercent = (x / videoWidth) * 100;
    let topPercent = (y / videoHeight) * 100;
    let rightPercent = ((x + overlayWidth) / videoWidth) * 100;
    let bottomPercent = ((y + overlayHeight) / videoHeight) * 100;
    // Clamp to container
    if (rightPercent > 100) {
      const overflow = rightPercent - 100;
      leftPercent = Math.max(0, leftPercent - overflow);
      rightPercent = 100;
    }
    if (bottomPercent > 100) {
      const overflow = bottomPercent - 100;
      topPercent = Math.max(0, topPercent - overflow);
      bottomPercent = 100;
    }
    
    // Set coordinates in format expected by ReactVideoPlayer
    // [startTime, endTime, left%, top%, right%, bottom%]
    setOverlayCoordinates([0, 0, leftPercent, topPercent, rightPercent, bottomPercent]);
    setOverlayCoordinatePercentages(leftPercent, topPercent, rightPercent, bottomPercent);
    setOverlayResizeData(overlayWidth, overlayHeight, x, y);
  }, [setOverlayCoordinates, setOverlayCoordinatePercentages, overlaysState.x1Coordinate, overlaysState.y1Coordinate, overlaysState.x2Coordinate, overlaysState.y2Coordinate, overlaysState.overlayCoordinates]);

  const handleBoxClick = useCallback((position: string) => {
    console.log('Position selected:', position);
    setSelectedPosition(position);
    
    // Update overlay coordinates based on position
    if (overlaysState.selectedOverlayId && overlaysState.selectedOverlayUrl) {
      calculateOverlayCoordinates(parseInt(position));
    }
  }, [overlaysState.selectedOverlayId, overlaysState.selectedOverlayUrl, setSelectedPosition, calculateOverlayCoordinates]);
  
  // Handle overlay selection (plus/minus click)
  const handleOverlaySelect = useCallback((overlayId: string, overlayUrl: string) => {
    if (overlaysState.selectedOverlayId === overlayId) {
      // Deselect if already selected
      clearOverlaysSelection();
    } else {
      // Select new overlay
      setSelectedOverlay(overlayId, overlayUrl);
      // Read natural dimensions to preserve aspect ratio
      const vid = document.createElement('video');
      vid.onloadedmetadata = () => {
        setOverlayAssetDimensions(vid.videoWidth || 0, vid.videoHeight || 0);
        if (selectedPosition) {
          calculateOverlayCoordinates(parseInt(selectedPosition));
        }
      };
      vid.src = overlayUrl;
    }
  }, [overlaysState.selectedOverlayId, clearOverlaysSelection, setSelectedOverlay, calculateOverlayCoordinates, selectedPosition]);

  // Transform Redux data to match component interface
  const overlayItems: OverlayItem[] = overlays.data.map(asset => ({
    id: asset._id,
    title: asset.title,
    date: new Date(asset.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    aspectRatio: asset.aspectRatio || '',
    thumbnail: asset.url,
    duration: asset.duration ? asset.duration.toString() : undefined,
    delay: typeof (asset as any).delay === 'number' ? (asset as any).delay : undefined,
    backgroundColor: "#252525"
  }));

  const handleItemClick = (id: string) => {
    console.log("Clicked overlay item:", id);
  };

  const handleDeleteItem = (id: string) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      await dispatch(deleteOverlayAsset(itemToDelete));
      setItemToDelete(null);
    }
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const handleUploadSuccess = useCallback((uploadData: any) => {
    console.log("Overlay uploaded successfully:", uploadData);
    // Refresh the overlays list after successful upload
    if (user?.userId) {
      const isAspectRatio = ["9:16", "16:9", "1:1", "4:5"].includes(sortBy);
      const sortParam = isAspectRatio ? -1 : (sortBy === "latest" ? -1 : 1);

      dispatch(fetchOverlays({
        userId: user.userId,
        // folderId: streamId,
        limit: 50,
        pageNo: 1,
        sortBy: sortParam
      }));
    }
    setIsUploadModalOpen(false);
  }, [dispatch, user?.userId, streamId, sortBy]);

  const handleUploadModalClose = useCallback(() => {
    setIsUploadModalOpen(false);
  }, []);

  const filteredItems = overlayItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const isAspectRatioFilter = ["9:16", "16:9", "1:1", "4:5"].includes(sortBy);
    if (isAspectRatioFilter) {
      return matchesSearch && item.aspectRatio === sortBy;
    }
    return matchesSearch;
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header Controls */}
      <div className="p-3 border-b border-[#252525]">
        {/* Search and Sort Row */}
        <div className="flex gap-4 mb-4">
          {/* Search Bar */}
          {/* <div className="bg-[#252525] rounded-xl px-4 flex items-center" style={{ width: '260px', height: '42px' }}>
            <input
              type="text"
              placeholder="Search overlays..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-white text-sm font-medium placeholder-white flex-1 outline-none"
            />
          </div> */}

          {/* Sort Dropdown */}
          {/* <div className="bg-[#252525] rounded-xl px-4 flex items-center justify-between cursor-pointer" style={{ width: '260px', height: '42px' }}>
            <span className="text-white text-sm font-medium">Sort by: {sortBy}</span>
            <svg width="8" height="5" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform rotate-180">
              <path d="M4 3.18205L0.888749 3.88485e-08L-3.97325e-08 0.908974L4 5L8 0.908974L7.11125 3.10843e-07L4 3.18205Z" fill="white"/>
            </svg>
          </div> */}

          <div className="w-[250px]">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search overlays..."
              className="bg-[#252525] border-none text-white placeholder-gray-400 rounded-xl h-11"
            />
          </div>
          <SortDropdown value={sortBy} onChange={setSortBy} page={"editor"}/>

          {/* Upload New Button */}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-[#252525] border-[2px] border-[#00BBFF] rounded-xl flex items-center justify-center hover:bg-[#3a3a3a] transition-colors"
            style={{ width: "200px", height: "40px" }}
          >
            <span className="text-white text-sm font-medium">Upload new</span>
          </button>
        </div>
      </div>

      {/* Selection Indicators Row */}
    <div className="px-3 py-2 border-b border-[#252525] bg-[#18191B]">
        <div className="flex items-center gap-3">
          {useMemo(() => {
            const positions = [
              { id: '1', label: 'Top Left', dotClass: 'top-2 left-2' },
              { id: '2', label: 'Top Right', dotClass: 'top-2 right-2' },
              { id: '3', label: 'Bottom Left', dotClass: 'bottom-2 left-2' },
              { id: '4', label: 'Bottom Right', dotClass: 'bottom-2 right-2' },
              { id: '5', label: 'Center', dotClass: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' }
            ];
            
            return positions.map((position) => {
              const isSelected = selectedPosition === position.id;
              return (
                <div
                  key={`indicator-${position.id}`}
                  className={`
                  w-[90px] h-[66px] rounded-[12px]
                  flex items-start justify-start
                  border-[2px]
                  ${isSelected ? 'border-white' : 'border-[#252525]'}
                  bg-[#222327] relative
                  cursor-pointer transition-all duration-200
                  hover:border-gray-400
                `}
                  style={{ boxSizing: 'border-box' }}
                  onClick={() => handleBoxClick(position.id)}
                  title={position.label}
                >
                  <span
                    className={`
                    absolute block 
                    w-5 h-5 rounded-[2px] 
                    bg-gradient-to-br from-[#00BBFF] to-[#0051FF]
                    ${position.dotClass}
                  `}
                  />
                </div>
              );
            });
          }, [selectedPosition, handleBoxClick])}
        </div>
      </div>

      {/* Cards Grid - Scrollable Section */}
      <div className="flex-1 overflow-y-auto p-6">
        {overlays.loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-white">Loading overlays...</div>
          </div>
        ) : overlays.error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-red-400">Error: {overlays.error}</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {filteredItems.map((item) => (
              <div key={item.id} className="relative">
                <EntityCard
                  type="overlay"
                  aspectRatio={item.aspectRatio}
                  id={item.id}
                  title={item.title}
                  date={item.date}
                  thumbnail={item.thumbnail}
                  duration={item.duration}
                  backgroundColor={item.backgroundColor}
                  logo={item.logo}
                  onClick={handleItemClick}
                  onDelete={() => handleDeleteItem(item.id)}
                  onPlusClick={() => handleOverlaySelect(item.id, item.thumbnail || '')}
                  isSelected={overlaysState.selectedOverlayId === item.id}
                  showCheckbox={false}
                  showPlusIcon={true}
                  tab={"overlay"}
                  delay={item.delay}
                  onDelayTimeClick={() => openDelayModal(item.id, item.delay)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-[#252525] rounded-xl flex items-center justify-center mb-4">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19.8 2.2H2.2V17.6L12.4212 7.3766C12.6275 7.17038 12.9072 7.05453 13.1989 7.05453C13.4906 7.05453 13.7703 7.17038 13.9766 7.3766L19.8 13.211V2.2Z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="6.6"
                  cy="6.6"
                  r="2.2"
                  stroke="white"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">
              No overlays found
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Try adjusting your search or upload new overlays
            </p>
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white px-6 py-2 rounded-xl hover:opacity-90 transition-opacity"
            >
              Upload new overlay
            </button>
          </div>
        )}
      </div>

      {/* Upload Assets Modal */}
      <UploadAssetsModal
        isOpen={isUploadModalOpen}
        onClose={handleUploadModalClose}
        assetType="overlay"
        onUpload={handleUploadSuccess}
        userId={user?.userId || ''}
        streamId={streamId || ''}
      />

      {isDelayModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-70" onClick={closeDelayModal} />
          <div className="relative bg-[#18191B] border border-[#373737] rounded-2xl p-6 w-[480px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-xl font-medium">Set delay time</h3>
              <button onClick={closeDelayModal} className="text-white hover:text-gray-300">×</button>
            </div>
            <div className="mb-6">
              <GradientRailSlider
                label="Delay time"
                min={0}
                max={delayMax}
                step={1}
                value={delayValue}
                onChange={setDelayValue}
                formatValue={(v) => `${v}s`}
                railWidth={360}
                height={40}
                pillWidth={48}
              />
            </div>
            <div className="flex gap-4 justify-end">
              <button onClick={closeDelayModal} className="px-4 h-10 rounded-xl bg-[#252525] text-white">Cancel</button>
              <button onClick={handleSetDelay} className="px-4 h-10 rounded-xl bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white">Set delay</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onDelete={handleConfirmDelete}
        itemName="this overlay"
      />
    </div>
  );
};

export default OverlaysTab;
