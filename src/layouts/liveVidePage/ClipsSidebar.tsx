import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ClipCard from '@/layouts/clipsPage/ClipCard';
// import { ClipData, mockClipData } from '@/mocks/clips_mockData/mockClips';
import { SearchableSelect } from '@/components/ui/searchable-select';
import SearchBar from '@/containers/filters/SearchBar';
import RefreshButton from '@/containers/filters/RefreshButton';
import SortDropdown from '@/containers/filters/SortByDropDown';
import Pagination from '@/containers/filters/Pagination';
import { RootState, AppDispatch } from '@/store';
import {
  fetchClips,
  refreshClips,
  setCurrentStreamId,
  setFilters,
  setPagination,
  updateClipProgress,
  ClipData
} from '@/store/slices/clipsSlice';
import { ClipData as ApiClipData } from '@/api/clipApi';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import PreviewModal from '@/components/modals/PreviewModal';
import { deleteClip } from '../../api/clipApi';
import DeleteConfirmationModal from '../../components/modals/DeleteConfirmationModal';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

interface ClipsSidebarProps {
  onClose?: () => void;
  page: string;
  streamId: string;
  generatedClips?: ApiClipData[];
}

const ClipsSidebar: React.FC<ClipsSidebarProps> = ({ onClose, page, streamId, generatedClips = [] }) => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    clips,
    completedClips,
    generatingClips,
    loading,
    error,
    filters,
    pagination,
    currentStreamId
  } = useSelector((state: RootState) => state.clips);

  const [selectedClips, setSelectedClips] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedClipForPreview, setSelectedClipForPreview] = useState<any>(null);
  const [clipDropdowns, setClipDropdowns] = useState<{[key: string]: boolean}>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clipToDelete, setClipToDelete] = useState<ClipData | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  // Set current stream ID and fetch clips when streamId changes
  useEffect(() => {
    if (streamId && streamId !== currentStreamId) {
      dispatch(setCurrentStreamId(streamId));
      dispatch(fetchClips({ streamId, ...filters, ...pagination }));
    }
  }, [streamId, dispatch, currentStreamId]);

  // Update clips progress when generatedClips prop changes
  useEffect(() => {
    if (generatedClips.length > 0) {
      generatedClips.forEach(clip => {
        if (clip.progress !== undefined) {
          dispatch(updateClipProgress({ clipId: clip.id, progress: clip.progress }));
        }
      });
    }
  }, [generatedClips, dispatch]);

  const handleRefresh = () => {
    if (streamId) {
      dispatch(refreshClips(streamId));
    }
  };

  const handleSortChange = (value: string) => {
    dispatch(setFilters({ ...filters, sortBy: value }));
    if (streamId) {
      dispatch(fetchClips({ streamId, ...filters, sortBy: value, ...pagination }));
    }
  };

  const handleSearchChange = (value: string) => {
    dispatch(setFilters({ ...filters, search: value }));
    if (streamId) {
      dispatch(fetchClips({ streamId, ...filters, search: value, ...pagination }));
    }
  };

  const handlePageChange = (page: number) => {
    dispatch(setPagination({ ...pagination, page }));
    if (streamId) {
      dispatch(fetchClips({ streamId, ...filters, page, limit: pagination.limit }));
    }
  };

  const handleClipClick = (clip: string) => {
    setSelectedClipForPreview({
      id: clip._id || clip.id,
      title: clip.title,
      timeRange: `${clip.start_time} - ${clip.end_time}`,
      duration: clip.duration,
      aspectRatio: clip.aspectRatio,
      rating: clip.rating,
      poster: clip.thumbnailUrl,
      videoUrl: clip.videoUrl,
      type: clip.type,
    });
    setIsPreviewModalOpen(true);
  };
  
   const handleClosePreviewModal = () => {
    setIsPreviewModalOpen(false);
    setSelectedClipForPreview(null);
  };

  // Handle delete clip
  const handleDeleteClip = async () => {
    if (!clipToDelete) return;

    try {
      const response = await deleteClip(clipToDelete._id);
      
      if (response.success) {
        toast.success('Clip deleted successfully!');
        // Refresh clips list
        dispatch(fetchClips({ streamId }));
      } else {
        toast.error(response.error || response.message || 'Failed to delete clip');
      }
    } catch (error: any) {
      console.error('Failed to delete clip:', error);
      toast.error(error.message || 'Failed to delete clip. Please try again.');
    } finally {
      setShowDeleteModal(false);
      setClipToDelete(null);
    }
  };

  // Handle dropdown toggle
  const handleDropdownToggle = (clipId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === clipId ? null : clipId);
  };

  // Handle delete button click
  const handleDeleteClick = (clip: ClipData, e: React.MouseEvent) => {
    e.stopPropagation();
    setClipToDelete(clip);
    setShowDeleteModal(true);
    setActiveDropdown(null);
  };
  // Close dropdown when clicking outside
  // useEffect(() => {
  //   const handleClickOutside = () => {
  //     setActiveDropdown(null);
  //   };

  //   if (activeDropdown) {
  //     document.addEventListener('mousedown', handleClickOutside);
  //   }

  //   return () => {
  //     document.removeEventListener('mousedown', handleClickOutside);
  //   };
  // }, [activeDropdown]);

  return (
    <div className="flex-shrink-0 w-full lg:w-[40vw] bg-[#18191B] border-l-2 border-[#252525] h-auto lg:h-screen flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 space-y-6">
        {/* Header with controls - optimized for 40% width */}
        <div className="py-6">
          {/* Top controls row - optimized for 30% width */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {/* Search Bar */}
            <div className="w-full sm:w-[230px]">
              <SearchBar
                value={filters.search}
                onChange={handleSearchChange}
                placeholder="Search clips..."
                className="bg-[#252525] border-none text-white placeholder-gray-400 rounded-xl h-11"
              />
            </div>
            {/* Sort dropdown */}
            <SortDropdown value={filters.sortBy} onChange={handleSortChange} />

            {/* Refresh Button */}
            <RefreshButton onClick={handleRefresh} disabled={loading} />
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPrevious={() => handlePageChange(Math.max(pagination.page - 1, 1))}
              onNext={() => handlePageChange(Math.min(pagination.page + 1, pagination.totalPages))}
              onChangePage={(p) => handlePageChange(p)}
            />
          </div>
        </div>

        {/* Scrollbar exactly matching Figma */}
        {/* <div className="absolute right-0 top-[151px] w-0.5 h-[732px] bg-[#252525]">
                <div className="w-0.5 h-[229px] bg-[#D9D9D9]"></div>
            </div> */}

        {/* Content area optimized for 40% width */}
        {/* Generating clips section using same size as ClipCard */}
        {generatingClips && generatingClips.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {generatingClips.map((clip) => (
              <div
                key={clip._id}
                className="relative bg-[#1A1B1E] rounded-xl overflow-hidden"
              >
                {/* Generating clip card matching ClipCard size */}
                <div className="aspect-video bg-[#D9D9D9] relative overflow-visible rounded-xl border-2 border-[#00EEFF]">
                  {/* Video player icon centered - smaller size */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                    <svg
                      width="20"
                      height="15"
                      viewBox="0 0 35 26"
                      fill="none"
                    >
                      <path
                        d="M25.4545 8.27273L33.748 2.46591C33.8672 2.38232 34.0071 2.33306 34.1524 2.32352C34.2978 2.31398 34.4429 2.34452 34.5721 2.41181C34.7012 2.4791 34.8094 2.58055 34.8849 2.70511C34.9604 2.82966 35.0002 2.97255 35 3.11818V22.3364C35.0002 22.482 34.9604 22.6249 34.8849 22.7494C34.8094 22.874 34.7012 22.9754 34.5721 23.0427C34.4429 23.11 34.2978 23.1406 34.1524 23.131C34.0071 23.1215 33.8672 23.0722 33.748 22.9886L25.4545 17.1818V23.8636C25.4545 24.2856 25.2869 24.6902 24.9886 24.9886C24.6902 25.2869 24.2856 25.4545 23.8636 25.4545H1.59091C1.16897 25.4545 0.76432 25.2869 0.465966 24.9886C0.167613 24.6902 0 24.2856 0 23.8636V1.59091C0 1.16897 0.167613 0.76432 0.465966 0.465967C0.76432 0.167613 1.16897 0 1.59091 0H23.8636C24.2856 0 24.6902 0.167613 24.9886 0.465967C25.2869 0.76432 25.4545 1.16897 25.4545 1.59091V8.27273ZM25.4545 13.2984L31.8182 17.753V7.7L25.4545 12.1545V13.2968V13.2984ZM3.18182 3.18182V22.2727H22.2727V3.18182H3.18182ZM6.36364 6.36364H9.54545V9.54545H6.36364V6.36364Z"
                        fill="white"
                      />
                    </svg>
                    {/* Generating text below the icon */}
                    <div className="mt-2 text-white text-[10px] font-medium font-montserrat">
                      {clip.progress > 0 ? `Generating... ${parseFloat((clip.progress || 0).toFixed(2))}%` : 'Generating...'}
                    </div>
                  </div>

                  {/* Three-dot menu - positioned with higher z-index */}
                  <div className="absolute top-[6px] right-[6px] z-50 pointer-events-auto">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDropdownToggle(clip._id, e);
                      }}
                      className="hover:bg-[#373737] rounded-md p-1 transition-colors cursor-pointer relative z-50 pointer-events-auto"
                    >
                      <svg
                        width="20"
                        height="16"
                        viewBox="0 0 30 24"
                        fill="none"
                        className="pointer-events-none"
                      >
                        <rect width="30" height="24" rx="5" fill="#252525" />
                        <circle cx="8" cy="12" r="2" fill="#D9D9D9" />
                        <circle cx="15" cy="12" r="2" fill="#D9D9D9" />
                        <circle cx="22" cy="12" r="2" fill="#D9D9D9" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {activeDropdown === clip._id && (
                      <div 
                        className="absolute top-full right-0 mt-1 bg-[#252525] border border-[#2A2A2A] rounded-lg py-2 shadow-xl min-w-[100px] z-[9999]"
                      >
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteClick(clip, e);
                          }}
                          className="w-full px-4 py-2 text-left text-red-400 hover:bg-[#434343] transition-colors flex items-center gap-2 text-sm cursor-pointer"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card content - compressed */}
                <div className="p-3 space-y-2">
                  {/* Title */}
                  <h3 className="text-white text-[14px] font-bold font-montserrat line-clamp-1">
                    {clip.title}
                  </h3>

                  {/* Date */}
                  <p className="text-white text-[10px] font-medium font-montserrat">
                    {/* {new Date(clip.createdAt).toLocaleDateString()} / {new Date(clip.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} */}
                    {new Date(clip?.createdAt).toLocaleDateString("en-US", {
                      month: "short", // Jun
                      day: "2-digit", // 26
                      year: "numeric", // 2025
                    })}
                    &nbsp;/{" "}
                    {new Date(clip?.createdAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </p>

                  {/* Progress and metadata - single row */}
                  <div className="flex items-center gap-1 text-[10px]">
                    {/* Progress bar */}
                    <div className="flex-1 h-[18px] bg-[#252525] rounded-sm relative">
                      <div
                        className="h-[18px] bg-gradient-to-r from-[#00EEFF] to-[#0051FF] rounded-sm transition-all duration-300"
                        style={{ width: `${parseFloat((clip.progress || 0).toFixed(2))}%` }}
                      ></div>
                      <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-medium font-montserrat">
                        {parseFloat((clip.progress || 0).toFixed(2))}%
                      </span>
                    </div>
                    {/* Rating */}
                    <div className="flex items-center gap-1">
                      <span className="text-white text-[10px] font-bold font-montserrat">
                        {clip.rating || 0}
                      </span>
                      <svg
                        width="8"
                        height="8"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d="M5.46973 1.32049C5.66167 0.842504 6.33833 0.842503 6.53027 1.32048L7.67669 4.17532C7.75843 4.37886 7.94946 4.51766 8.16831 4.5325L11.2377 4.74062C11.7516 4.77546 11.9607 5.419 11.5654 5.74925L9.20456 7.72175C9.03623 7.86239 8.96327 8.08696 9.01678 8.29968L9.76733 11.2831C9.893 11.7827 9.34557 12.1804 8.90934 11.9065L6.30383 10.2708C6.11807 10.1541 5.88193 10.1541 5.69617 10.2707L3.09066 11.9065C2.65443 12.1804 2.107 11.7827 2.23267 11.2831L2.98322 8.29968C3.03674 8.08696 2.96377 7.86239 2.79544 7.72175L0.434597 5.74925C0.0393227 5.41899 0.24842 4.77546 0.762323 4.74062L3.8317 4.5325C4.05054 4.51766 4.24157 4.37886 4.32331 4.17532L5.46973 1.32049Z"
                          fill="white"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Rating only - no progress bar */}
                  {/* <div className="flex items-center justify-end gap-1 text-[10px]">
                  </div> */}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Completed clips section using ClipCard components - 2 column grid */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-white">Loading clips...</div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-red-500">{error}</div>
            </div>
          ) : (
            (() => {
              const reduxCompletedClips = completedClips || [];
              const reduxGeneratingClips = generatingClips || [];

              if (reduxCompletedClips.length === 0 && reduxGeneratingClips.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="mb-6">
                      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="mx-auto">
                        <rect x="20" y="25" width="40" height="30" rx="4" fill="#6B7280" />
                        <rect x="25" y="30" width="8" height="6" rx="1" fill="#374151" />
                        <rect x="35" y="30" width="8" height="6" rx="1" fill="#374151" />
                        <rect x="45" y="30" width="8" height="6" rx="1" fill="#374151" />
                        <rect x="25" y="38" width="30" height="2" rx="1" fill="#374151" />
                        <rect x="25" y="42" width="20" height="2" rx="1" fill="#374151" />
                        <polygon points="40,15 45,25 35,25" fill="#6B7280" />
                        <rect x="38" y="55" width="4" height="8" fill="#6B7280" />
                        <rect x="32" y="63" width="16" height="4" rx="2" fill="#6B7280" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No clips yet</h3>
                    <p className="text-gray-400 mb-6 max-w-xs">
                      Anytime a clip for this game has been clipped, you can find them here.
                    </p>
                    <button
                      onClick={handleRefresh}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 bg-transparent border border-gray-600 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                        <path d="M21 3v5h-5" />
                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                        <path d="M3 21v-5h5" />
                      </svg>
                      Refresh
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {reduxCompletedClips.map((clip) => {
                    // Convert Redux ClipData to ClipCard format
                    const clipCardData = {
                      id: clip._id,
                      title: clip.title,
                      duration: clip.duration ? clip.duration : "",
                      thumbnailUrl: clip.thumbnailUrl || clip.videoThumbnailUrl || '',
                      videoUrl: clip.videoUrl || '',
                      createdAt: clip.createdAt,
                      tags: clip.tags || [],
                      isAiCreated: clip.isAiCreated || false,
                      aspectRatio: clip.aspectRatio,
                      start_time: clip.start_time,
                      end_time: clip.end_time,
                      rating: clip.rating || 0,
                      customData: clip.customData,
                      selected: selectedClips.includes(clip.id),
                      status: 'Completed'
                    };
                    const dropdownRef = React.createRef<HTMLDivElement>();
                     const showDropdown = clipDropdowns[clipCardData.id] || false;
                    return (
                      <ClipCard
                        key={clip.id}
                        clip={clipCardData}
                        onSelect={(id, selected) => {
                          if (selected) {
                            setSelectedClips((prev) => [...prev, id]);
                          } else {
                            setSelectedClips((prev) =>
                              prev.filter((clipId) => clipId !== id)
                            );
                          }
                        }}
                        onClick={() => handleClipClick(clip)}
                        page={page}
                        activeTab={activeTab}
                        isSelected={selectedClips.includes(clip.id)}
                        dropdownRef={dropdownRef}
                        setShowDropdown={(show: boolean) => {
                          setClipDropdowns((prev) => ({
                            ...prev,
                            [clipCardData.id]: show,
                          }));
                        }}
                        showDropdown={showDropdown}
                         onRefresh={handleRefresh}
                      />
                    );
                  })}
                </div>
              );
            })()
          )}
        </div>
      </div>
        {/* Preview Modal */}
        {selectedClipForPreview && (
          <PreviewModal
            isOpen={isPreviewModalOpen}
            onClose={handleClosePreviewModal}
            clipData={selectedClipForPreview}
            page={page}
          />
        )} 

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setClipToDelete(null);
          }}
          onDelete={handleDeleteClip}
          itemName={clipToDelete?.title || "this clip"}
        />
    </div>
  );
};

export default ClipsSidebar;
