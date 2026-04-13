import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/store";
import { fetchGraphics, deleteGraphicAsset } from "@/store/slices/assetsSlice";
import EntityCard from "@/layouts/EditorEntities/EntityCard";
import SortDropdown from "@/containers/filters/SortByDropDown";
import SearchBar from "@/containers/filters/SearchBar";
import UploadAssetsModal from "@/components/modals/UploadAssetsModal";
import DeleteConfirmationModal from "@/components/modals/DeleteConfirmationModal";
import { useGraphics } from "../../contexts/GraphicsContext";

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

interface GraphicsTabProps {
  activeClip: ClipItem;
}

interface GraphicsItem {
  id: string;
  title: string;
  date: string;
  thumbnail?: string;
  fileFormat: "MP4" | "JPG" | "PNG" | "GIF";
  duration?: string;
  backgroundColor?: string;
  logo?: React.ReactNode;
}

const GraphicsTab: React.FC<GraphicsTabProps> = ({ activeClip }) => {
  const { streamId } = useParams<{ streamId: string }>();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { graphics } = useAppSelector((state) => state.assets);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("Latest");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  // Removed selectedItemId - now using selectedPosition from context
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  // Use graphics context
  const {
    graphicsState,
    setSelectedGraphic,
    setImageCoordinates,
    setSelectedPosition,
    clearGraphicsSelection,
    setCoordinatePercentages,
    setResizeData,
    setAssetDimensions,
  } = useGraphics();
  
  const { selectedPosition } = graphicsState;
  // Initialize first position as selected on component mount
  useEffect(() => {
    setSelectedPosition("1");
  }, []);

  // Fetch graphics on component mount only if data doesn't exist and no error occurred
  useEffect(() => {
    if (user?.userId && !graphics.loading && !graphics.error) {
      dispatch(fetchGraphics({
        userId: user.userId,
        // folderId: streamId,
        limit: 50,
        pageNo: 1,
        sortBy: sortBy === "Latest" ? -1 : 1
      }));
    }
  }, [dispatch, user?.userId, sortBy, graphics.error]);

  // Calculate image coordinates based on position flag
  const calculateImageCoordinates = useCallback((flag: number) => {
    const videoWidth = 1920;
    const videoHeight = 1080;
    let currentWidth = ((graphicsState.x2Coordinate || graphicsState.imageCoordinates[4] || 0) - (graphicsState.x1Coordinate || graphicsState.imageCoordinates[2] || 0)) / 100 * videoWidth || 200;
    let currentHeight = ((graphicsState.y2Coordinate || graphicsState.imageCoordinates[5] || 0) - (graphicsState.y1Coordinate || graphicsState.imageCoordinates[3] || 0)) / 100 * videoHeight || 200;
    if (graphicsState.naturalWidth && graphicsState.naturalHeight) {
      const ratio = graphicsState.naturalWidth / graphicsState.naturalHeight;
      // Adjust height to preserve ratio based on current width
      currentHeight = Math.round(currentWidth / ratio);
    }
    const padding = 0;

    // Map position indicators flag system
    const flagMapping: { [key: number]: string } = {
      1: "2", // top-left
      2: "3", // top-right
      3: "6", // bottom-left
      4: "7", // bottom-right
      5: "8", // center
    };

    const mappedFlag = flagMapping[flag] || "2";

    let coordinates: { x: number; y: number; x1: number; y1: number; x2: number; y2: number };

    switch (mappedFlag) {
     case "2": // top-left
        coordinates = {
          x: padding,
          y: padding,
          x1: padding,
          y1: padding,
          x2: padding + currentWidth,
          y2: padding + currentHeight,
      };
      break;
      case "3": // top-right
        coordinates = {
          x: videoWidth - currentWidth - padding,
          y: padding,
          x1: videoWidth - currentWidth - padding,
          y1: padding,
          x2: videoWidth - padding,
          y2: padding + currentHeight,
        };
        break;
      case "6": // bottom-left
        coordinates = {
          x: padding,
          y: videoHeight - currentHeight - padding,
          x1: padding,
          y1: videoHeight - currentHeight - padding,
          x2: padding + currentWidth,
          y2: videoHeight - padding,
        };
        break;
      case "7": // bottom-right
        coordinates = {
          x: videoWidth - currentWidth - padding,
          y: videoHeight - currentHeight - padding,
          x1: videoWidth - currentWidth - padding,
          y1: videoHeight - currentHeight - padding,
          x2: videoWidth - padding,
          y2: videoHeight - padding,
        };
        break;
     case "8": // center
        coordinates = {
          x: (videoWidth - currentWidth) / 2,
          y: (videoHeight - currentHeight) / 2,
          x1: (videoWidth - currentWidth) / 2,
          y1: (videoHeight - currentHeight) / 2,
          x2: (videoWidth + currentWidth) / 2,
          y2: (videoHeight + currentHeight) / 2,
      };
      break;
      default:
        coordinates = {
          x: padding,
          y: padding,
          x1: padding,
          y1: padding,
          x2: padding + currentWidth,
          y2: padding + currentHeight,
        };
    }
     
     // Convert absolute coordinates to percentage for video player
    //  const videoWidth = 1920;
    //  const videoHeight = 1080;
     let leftPercent = (coordinates.x1 / videoWidth) * 100;
     let topPercent = (coordinates.y1 / videoHeight) * 100;
     let rightPercent = (coordinates.x2 / videoWidth) * 100;
     let bottomPercent = (coordinates.y2 / videoHeight) * 100;
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
     
     // Format: [unused, unused, left%, top%, right%, bottom%] to match ReactVideoPlayer expectations
     setImageCoordinates([0, 0, leftPercent, topPercent, rightPercent, bottomPercent]);
     setCoordinatePercentages(leftPercent, topPercent, rightPercent, bottomPercent);
     setResizeData(currentWidth, currentHeight, coordinates.x, coordinates.y);
  }, [setImageCoordinates, setCoordinatePercentages, graphicsState.x1Coordinate, graphicsState.y1Coordinate, graphicsState.x2Coordinate, graphicsState.y2Coordinate, graphicsState.imageCoordinates, graphicsState.naturalWidth, graphicsState.naturalHeight, setResizeData]);

   const handleBoxClick = useCallback((position: string) => {
    console.log('Position selected:', position);
    setSelectedPosition(position);
    
    // Update image coordinates based on position
    if (graphicsState.selectedGraphicId && graphicsState.selectedGraphicUrl) {
      calculateImageCoordinates(parseInt(position));
    }
  }, [graphicsState.selectedGraphicId, graphicsState.selectedGraphicUrl, setSelectedPosition, calculateImageCoordinates]);
  
  // Handle graphic selection (plus/minus click)
  const handleGraphicSelect = useCallback((graphicId: string, graphicUrl: string) => {
    if (graphicsState.selectedGraphicId === graphicId) {
      // Deselect if already selected
      clearGraphicsSelection();
    } else {
      // Select new graphic
      setSelectedGraphic(graphicId, graphicUrl);
      // Read natural dimensions to preserve aspect ratio
      const img = new Image();
      img.onload = () => {
        setAssetDimensions(img.naturalWidth, img.naturalHeight);
        if (selectedPosition) {
          calculateImageCoordinates(parseInt(selectedPosition));
        }
      };
      img.src = graphicUrl;

    }
  }, [graphicsState.selectedGraphicId, clearGraphicsSelection, setSelectedGraphic, calculateImageCoordinates, selectedPosition, setAssetDimensions]);

   const handleUploadSuccess = useCallback((uploadData: any) => {
    // Refresh the graphics list after successful upload
    if (user?.userId) {
      dispatch(fetchGraphics({
        userId: user.userId,
        // folderId: streamId,
        limit: 50,
        pageNo: 1,
        sortBy: sortBy === "Latest" ? -1 : 1
      }));
    }
    setIsUploadModalOpen(false);
  }, [dispatch, user?.userId, sortBy]);

  const handleUploadModalClose = useCallback(() => {
    setIsUploadModalOpen(false);
  }, []);

  // Transform Redux data to match component interface - memoized to prevent unnecessary recalculations
  const graphicsItems: GraphicsItem[] = useMemo(() => 
    graphics.data.map(asset => ({
      id: asset._id,
      title: asset.title,
      date: new Date(asset.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      thumbnail: asset.url,
      fileFormat: (asset.format?.toUpperCase() || 'PNG') as "MP4" | "JPG" | "PNG" | "GIF",
      backgroundColor: "#252525"
    })), [graphics.data]
  );

  const handleSelectItem = useCallback((id: string) => {
    setSelectedItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  }, []);

  const handleItemClick = useCallback((id: string) => {
    // Handle item click logic here if needed
  }, []);

  const handleDeleteItem = useCallback((id: string) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (itemToDelete) {
      await dispatch(deleteGraphicAsset(itemToDelete));
      setItemToDelete(null);
    }
  }, [dispatch, itemToDelete]);

  const handleCloseDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  }, []);

  const filteredItems = useMemo(() => 
    graphicsItems.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    ), [graphicsItems, searchQuery]
  );
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
              placeholder="Search graphics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-white text-sm font-medium placeholder-white flex-1 outline-none"
            />
          </div> */}

          {/* Sort Dropdown */}
          {/* <div className="bg-[#252525] rounded-xl px-4 flex items-center justify-between cursor-pointer" style={{ width: '260px', height: '42px' }}>
            <span className="text-white text-sm font-medium">Sort by: {sortBy}</span>
            <svg width="8" height="5" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform rotate-180">
              <path d="M4 3.18205L0.888749 3.88485e-08L-3.97325e-08 0.908974L4 5L8 0.908974L7.11125 3.10843e-07L4 3.18205Z" fill="white" />
            </svg>
          </div> */}

          <div className="w-[250px]">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search graphics..."
              className="bg-[#252525] border-none text-white placeholder-gray-400 rounded-xl h-11"
            />
          </div>
          <SortDropdown value={sortBy} onChange={setSortBy} page={"editor"} hideAspectRatio={true} />

          {/* Upload New Button */}
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-[#252525] border-[2px] border-[#00BBFF] rounded-xl flex items-center justify-center hover:bg-[#3a3a3a] transition-colors" 
            style={{ width: '200px', height: '40px' }}
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
        {graphics.loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-white">Loading graphics...</div>
          </div>
        ) : graphics.error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-red-400">Error: {graphics.error}</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {filteredItems.map((item) => (
              <EntityCard
                type="graphic"
                key={item.id}
                id={item.id}
                title={item.title}
                date={item.date}
                thumbnail={item.thumbnail}
                fileFormat={item.fileFormat}
                duration={item.duration}
                backgroundColor={item.backgroundColor}
                logo={item.logo}
                onClick={handleItemClick}
                onDelete={() => handleDeleteItem(item.id)}
                onPlusClick={() => handleGraphicSelect(item.id, item.thumbnail)}
                isSelected={graphicsState.selectedGraphicId === item.id}
                showPlusIcon={true}
                tab="graphics"
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-[#252525] rounded-xl flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.8 2.2H2.2V17.6L12.4212 7.3766C12.6275 7.17038 12.9072 7.05453 13.1989 7.05453C13.4906 7.05453 13.7703 7.17038 13.9766 7.3766L19.8 13.211V2.2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="6.6" cy="6.6" r="2.2" stroke="white" strokeWidth="2" />
              </svg>
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">No graphics found</h3>
            <p className="text-gray-400 text-sm mb-6">Try adjusting your search or upload new graphics</p>
            <button className="bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white px-6 py-2 rounded-xl hover:opacity-90 transition-opacity">
              Upload new graphic
            </button>
          </div>
        )}
      </div>

      {/* Upload Assets Modal */}
       <UploadAssetsModal
      isOpen={isUploadModalOpen}
      onClose={handleUploadModalClose}
      assetType="graphic"
      onUpload={handleUploadSuccess}
      userId={user?.userId || ''}
      folderId=""
    />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onDelete={handleConfirmDelete}
        itemName="this graphic"
      />
    </div>
  );
};

export default GraphicsTab;
