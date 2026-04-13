import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/store";
import { fetchBumpers, deleteBumperAsset } from "@/store/slices/assetsSlice";
import { addBumperToTimeline } from "@/store/slices/foldersSlice";
import EntityCard from "@/layouts/EditorEntities/EntityCard";
import SortDropdown from "@/containers/filters/SortByDropDown";
import SearchBar from "@/containers/filters/SearchBar";
import UploadAssetsModal from "@/components/modals/UploadAssetsModal";
import DeleteConfirmationModal from "@/components/modals/DeleteConfirmationModal";
import { toast } from "sonner";
import { setIntroBumper, setOutroBumper } from "@/store/slices/clipsSlice";

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

interface BumpersTabProps {
  activeClip: ClipItem;
  page?: string;
}

interface BumperItem {
  id: string;
  title: string;
  date: string;
  thumbnail?: string;
  fileFormat: "MP4" | "JPG" | "PNG";
  duration?: string;
  backgroundColor?: string;
  logo?: React.ReactNode;
}

const BumpersTab: React.FC<BumpersTabProps> = ({ activeClip, page }) => {
  const { folderId } = useParams<{ folderId: string }>();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { bumpers } = useAppSelector((state) => state.assets);
  const introSelected = useAppSelector((state) => (state as any).clips.currentIntroBumper) as any | null;
  const outroSelected = useAppSelector((state) => (state as any).clips.currentOutroBumper) as any | null;
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [activeIntroOutro, setActiveIntroOutro] = useState<"intro" | "outro">("intro");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const location = useLocation();
  const processedClipIdRef = useRef<string | null>(null);

  // Set initial filter based on aspect ratio
  useEffect(() => {
    if (activeClip?.id && processedClipIdRef.current !== activeClip.id) {
      const params = new URLSearchParams(location.search);
      const targetRatio = params.get("aspectRatio") || activeClip.aspectRatio;

      if (targetRatio) {
        const normalized = targetRatio.replace(/\s/g, "");
        if (["9:16", "16:9", "1:1", "4:5"].includes(normalized)) {
          setSortBy(normalized);
        }
      }
      processedClipIdRef.current = activeClip.id;
    }
  }, [activeClip?.id, activeClip?.aspectRatio, location.search]);

  // Fetch bumpers on component mount only if data doesn't exist and no error occurred
  useEffect(() => {
    if (user?.userId && !bumpers.loading && !bumpers.error) {
      const isAspectRatio = ["9:16", "16:9", "1:1", "4:5"].includes(sortBy);
      const sortParam = isAspectRatio ? -1 : (sortBy === "latest" ? -1 : 1);
      
      dispatch(fetchBumpers({
        userId: user.userId,
        // folderId: folderId,
        limit: 50,
        pageNo: 1,
        sortBy: sortParam
      }));
    }
  }, [dispatch, user?.userId, folderId, sortBy, bumpers.error]);
  
  // Transform Redux data to match component interface
  const bumperItems: BumperItem[] = bumpers.data.map(asset => ({
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
    fileFormat: (asset.format?.toUpperCase() || 'MP4') as "MP4" | "JPG" | "PNG",
    duration: asset.duration ? asset.duration.toString() : undefined,
    backgroundColor: "#252525"
  }));

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  // const handleItemClick = (id: string) => {
  //   console.log("Clicked bumper item:", id);
  // };

  const handlePlusClick = (id: string) => {
    const selectedBumper = bumpers.data.find(bumper => bumper._id === id);
    if (selectedBumper) {
      // const folderAR = (activeClip?.aspectRatio || '').replace(/\s/g, '');
      const params = new URLSearchParams(location.search);
      const targetRatio = params.get("aspectRatio") || activeClip.aspectRatio;
      const bumperAR = (selectedBumper?.aspectRatio || '').replace(/\s/g, '');
      if (targetRatio && bumperAR && targetRatio !== bumperAR) {
        toast.info(`Bumper aspect ratio must match highlight aspect (${targetRatio}).`);
        return;
      }
      const bumperData = {
        type: "bumper",
        id: `bumper-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        duration: selectedBumper.duration || 10,
        url: selectedBumper.url,
        title: selectedBumper.title,
        bumperData: selectedBumper,
        position: activeIntroOutro // "intro" or "outro"
      };
      
      if ((page || '').toLowerCase().includes('clip')) {
        if (activeIntroOutro === 'intro') {
          if (introSelected && introSelected._id === selectedBumper._id) dispatch(setIntroBumper(null));
          else dispatch(setIntroBumper(selectedBumper));
        } else if (activeIntroOutro === 'outro') {
          if (outroSelected && outroSelected._id === selectedBumper._id) dispatch(setOutroBumper(null));
          else dispatch(setOutroBumper(selectedBumper));
        }
      } else {
        // Highlight editor: add to folder timeline and set redux bumpers
        dispatch(addBumperToTimeline({
          folderId: folderId,
          bumperData
        }));
        if (activeIntroOutro === 'intro') dispatch(setIntroBumper(selectedBumper));
        else if (activeIntroOutro === 'outro') dispatch(setOutroBumper(selectedBumper));
      }
      // try {
      //   const position = activeIntroOutro === 'outro' ? 'outro' : 'intro';
      //   const evt = new CustomEvent('clip-editor:add-bumper', { detail: { position, bumper: selectedBumper } });
      //   window.dispatchEvent(evt);
      //   if (typeof document !== 'undefined') (document as any).dispatchEvent(evt);
      // } catch (error) {
      //   console.error('Error dispatching addBumperToTimeline:', error);
      //   toast.error('Failed to add bumper to timeline. Please try again.');
      // }
       toast.success(`Bumper added successfully`);
    }
  };

  const handleDeleteItem = (id: string) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      await dispatch(deleteBumperAsset(itemToDelete));
      setItemToDelete(null);
    }
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const handleUploadSuccess = (uploadData: any) => {
    console.log("Bumper uploaded successfully:", uploadData);
    // Refresh the bumpers list after successful upload
    if (user?.userId) {
      const isAspectRatio = ["9:16", "16:9", "1:1", "4:5"].includes(sortBy);
      const sortParam = isAspectRatio ? -1 : (sortBy === "latest" ? -1 : 1);

      dispatch(fetchBumpers({
        userId: user.userId,
        // folderId: folderId,
        limit: 50,
        pageNo: 1,
        sortBy: sortParam
      }));
    }
    setIsUploadModalOpen(false);
  };

  const handleUploadModalClose = () => {
    setIsUploadModalOpen(false);
  };

  const filteredItems = bumperItems.filter(item => {
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
              placeholder="Search bumpers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-white text-sm font-medium placeholder-white flex-1 outline-none"
            />
          </div> */}

          {/* Sort Dropdown */}
          {/* <div className="bg-[#252525] rounded-xl px-4 flex items-center justify-between cursor-pointer" style={{ width: '260px', height: '42px' }}> */}
          {/* <span className="text-white text-sm font-medium">Sort by: {sortBy}</span>
            <svg width="8" height="5" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform rotate-180">
            <path d="M4 3.18205L0.888749 3.88485e-08L-3.97325e-08 0.908974L4 5L8 0.908974L7.11125 3.10843e-07L4 3.18205Z" fill="white"/>
            </svg> */}
          {/* </div> */}

          <div className="w-[250px]">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search bumpers..."
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

        {/* Intro/Outro Tabs */}
        <div
          className="flex bg-[#252525] rounded-xl overflow-hidden"
          style={{ height: "42px" }}
        >
          <button
            onClick={() => setActiveIntroOutro("intro")}
            className={`flex-1 text-white text-sm font-medium transition-colors flex items-center justify-center mx-1 my-1 rounded-xl ${
              activeIntroOutro === "intro"
                ? "bg-[#252525] border border-white"
                : "hover:bg-[#3a3a3a] border border-transparent"
            }`}
          >
            Intro
          </button>
          <button
            onClick={() => setActiveIntroOutro("outro")}
            className={`flex-1 text-white text-sm font-medium transition-colors flex items-center justify-center mx-1 my-1 rounded-xl ${
              activeIntroOutro === "outro"
                ? "bg-[#252525] border border-white"
                : "hover:bg-[#3a3a3a] border border-transparent"
            }`}
          >
            Outro
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {bumpers.loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-white">Loading bumpers...</div>
          </div>
        ) : bumpers.error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-red-400">Error: {bumpers.error}</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
        {filteredItems.map((item) => (
          <EntityCard
            type="bumper"
            key={item.id}
            aspectRatio={item.aspectRatio}
            id={item.id}
            title={item.title}
            date={item.date}
            thumbnail={item.thumbnail}
            fileFormat={item.fileFormat}
            duration={item.duration}
            backgroundColor={item.backgroundColor}
            logo={item.logo}
            isSelected={(page || '').toLowerCase().includes('clip') ? (
              (activeIntroOutro === 'intro' && introSelected && String(introSelected._id) === String(item.id)) ||
              (activeIntroOutro === 'outro' && outroSelected && String(outroSelected._id) === String(item.id))
            ) : selectedItems.includes(item.id)}
            // onSelect={handleSelectItem}
            // onClick={handleItemClick}
            onPlusClick={handlePlusClick}
            onDelete={() => handleDeleteItem(item.id)}
            showCheckbox={
              selectedItems.length > 0 || selectedItems.includes(item.id)
            }
            showPlusIcon={true}
            allowMinusForBumper={(page || '').toLowerCase().includes('clip')}
            tab="bumper"
          />
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
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">
              No bumpers found
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Try adjusting your search or upload new bumpers
            </p>
            <button className="bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white px-6 py-2 rounded-xl hover:opacity-90 transition-opacity">
              Upload new bumper
            </button>
          </div>
        )}
      </div>

      {/* Upload Assets Modal */}
      <UploadAssetsModal
        isOpen={isUploadModalOpen}
        onClose={handleUploadModalClose}
        assetType="bumper"
        onUpload={handleUploadSuccess}
        userId={user?.userId || ""}
        folderId={folderId || ""}
        // streamId={streamId || ""}
      />

      {/* Delete Confirmation Modal */}
       <DeleteConfirmationModal
         isOpen={isDeleteModalOpen}
         onClose={handleCloseDeleteModal}
         onDelete={handleConfirmDelete}
         itemName="this bumper"
       />
    </div>
  );
};

export default BumpersTab;
