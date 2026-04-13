import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "@/layouts/dashboard/Sidebar";
import ClipCard from "@/layouts/clipsPage/ClipCard";
import ClipFilters from "@/layouts/clipsPage/ClipFilters";
import ShimmerCard from "@/layouts/clipsPage/ClipShimmerCard";
import { Button } from "@/components/ui/button";
import { ClipData } from "@/mocks/clips_mockData/mockClips";
import { limitOptions } from "@/constants/Filter";
import Pagination from "@/containers/filters/Pagination";
import SVGIcon from "@/components/common/SVGIcon";
import backArrow from "@/assets/svg/back-arrow.svg";
import HelpButton from "@/containers/help_section/HelpButton";
import { CreateHighlightFormData } from "@/types/highlight";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "sonner";
import { AppDispatch, RootState } from "@/store/store";
import { 
    fetchUserClips, 
    setCurrentUserId, 
    setUserFilters, 
    setUserPagination,
    selectUserClips,
    selectUserClipsLoading,
    selectUserClipsError,
    selectUserClipsFilters,
    selectUserClipsPagination,
    selectCurrentUserId
} from "@/store/slices/clipsSlice";
import { selectUser } from "@/store/slices/authSlice";

const ManualHighlightPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch<AppDispatch>();
    
    // Redux selectors
    const user = useSelector(selectUser);
    const userClips = useSelector(selectUserClips);
    const loading = useSelector(selectUserClipsLoading);
    const error = useSelector(selectUserClipsError);
    const userFilters = useSelector(selectUserClipsFilters);
    const userPagination = useSelector(selectUserClipsPagination);
    const currentUserId = useSelector(selectCurrentUserId);
    
    // Extract match info from location state or use default
    const matchInfo = location.state?.matchInfo || "Bangladesh vs Bhutan | FIFA Friendly match";
    const initialSelectedClips = location.state?.selectedClips || [];
    
    const [selectedClips, setSelectedClips] = useState<Set<string>>(new Set(initialSelectedClips));
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const { canCreate: canCreateHighlight } = usePermissions();

    // Get actual user ID from authenticated user
    const userId = user?.userId;

    useEffect(() => {
        // Only proceed if user is authenticated
        if (!userId) {
            toast.error('Please login to view clips');
            navigate('/login');
            return;
        }

        // Set current user ID if not already set
        if (currentUserId !== userId) {
            dispatch(setCurrentUserId(userId));
        }
        
        // Fetch user clips when component mounts or user changes
        dispatch(fetchUserClips({
            userId,
            ...userFilters,
            ...userPagination
        }));
    }, [dispatch, userId, currentUserId, navigate]);

    // Calculate total duration of selected clips
    const calculateTotalDuration = useCallback(() => {
        const selectedClipData = userClips.filter(clip => selectedClips.has(clip.id));
        let totalSeconds = 0;
        
        selectedClipData.forEach(clip => {
             if (clip) {
                totalSeconds += clip.duration || 0;
            }
        }); 
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, [userClips, selectedClips]);

    const handleClipSelect = useCallback((clipId: string, selected: boolean) => {
        setSelectedClips(prev => {
            const newSet = new Set(prev);
            if (selected) {
                newSet.add(clipId);
            } else {
                newSet.delete(clipId);
            }
            return newSet;
        });
    }, []);

    const handleSelectAll = () => {
        setSelectedClips(new Set(userClips.map(clip => clip.id)));
    };

    const handleClearAll = () => {
        setSelectedClips(new Set());
    };

    const handleCreateHighlight = () => {
        if (selectedClips.size === 0) {
            toast.error('No clips selected', {
                description: 'Please select at least one clip to create a highlight.',
            });
            return;
        }

        // Navigate to highlight creation with selected clips
        navigate('/my-highlights', { 
            state: { 
                selectedClips: Array.from(selectedClips),
                totalDuration: calculateTotalDuration(),
                matchInfo
            }
        });
        
        toast.success('Highlight created successfully!', {
            description: `${selectedClips.size} clips added to your new highlight.`,
        });
    };

    const handleCancel = () => {
        navigate(-1); // Go back to previous page
    };

    const handleLimitChange = (value: string) => {
        dispatch(setUserPagination({
            ...userPagination,
            limit: parseInt(value),
            page: 1
        }));
        
        // Fetch clips with new pagination
        dispatch(fetchUserClips({
            userId,
            ...userFilters,
            limit: parseInt(value),
            page: 1
        }));
    };

    const handlePageChange = (page: number) => {
        dispatch(setUserPagination({
            ...userPagination,
            page
        }));
        
        // Fetch clips for new page
        dispatch(fetchUserClips({
            userId,
            ...userFilters,
            ...userPagination,
            page
        }));
    };

    const renderClipsGrid = () => {
        if (loading) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, index) => (
                        <ShimmerCard key={index} />
                    ))}
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <p className="text-red-400 mb-2">Error loading clips</p>
                        <p className="text-gray-400 text-sm">{error}</p>
                        <Button
                            onClick={() => dispatch(fetchUserClips({
                                userId,
                                ...userFilters,
                                ...userPagination
                            }))}
                            className="mt-4 bg-blue-600 hover:bg-blue-700"
                        >
                            Retry
                        </Button>
                    </div>
                </div>
            );
        }

        if (userClips.length === 0) {
            return (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <p className="text-gray-400 mb-2">No clips found</p>
                        <p className="text-gray-500 text-sm">Try adjusting your filters or create some clips first.</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {userClips.map((clip) => (
                    <ClipCard
                        key={clip.id}
                        clip={clip}
                        page="create-highlight"
                        activeTab="clips"
                        isSelected={selectedClips.has(clip.id)}
                        onSelect={handleClipSelect}
                        dropdownRef={dropdownRef}
                        showDropdown={false}
                    />
                ))}
            </div>
        );
    };

    // Pagination logic - now using Redux state
    const totalClips = userPagination.total || 0;
    const totalPages = Math.ceil(totalClips / userPagination.limit);
    const currentPage = userPagination.page;

    return (
        <div className="flex h-screen bg-[#18191B] text-white overflow-hidden">
            <Sidebar />
            
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-[#252525]">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate(-1)}
                            className="flex items-center justify-center w-8 h-8 hover:bg-[#252525] rounded-lg transition-colors"
                        >
                            <SVGIcon src={backArrow} className="w-2 h-3" />
                        </button>
                        <h1 className="text-2xl font-medium text-white">
                            {matchInfo}
                        </h1>
                    </div>
                </div>

                {/* Sub Header - Highlight Creating */}
                <div className="px-8 py-4 border-b border-[#252525]">
                    <h2 className="text-base font-bold text-white">Highlight creating</h2>
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between px-8 py-4 border-b border-[#252525]">
                    <div className="flex items-center gap-6">
                        {/* Selection Info */}
                        <div className="text-sm text-white">
                            {selectedClips.size} of {totalClips} clips selected
                        </div>
                        
                        {/* Select All / Clear */}
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={handleSelectAll}
                                className="text-sm font-bold text-white underline hover:no-underline transition-all"
                            >
                                Select all
                            </button>
                            <button 
                                onClick={handleClearAll}
                                className="text-sm font-bold text-white underline hover:no-underline transition-all"
                            >
                                Clear
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Total Duration */}
                        <div className="flex items-center gap-2 text-sm text-white">
                            <span>Total duration:</span>
                            <span className="font-bold">{calculateTotalDuration()}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                onClick={handleCancel}
                                className="bg-[#252525] border-white text-white px-6 py-2 h-10 rounded-xl hover:bg-[#2A2A2A] transition-colors"
                            >
                                Cancel
                            </Button>
                            
                            {canCreateHighlight('Highlights') && (
                                <Button
                                    onClick={handleCreateHighlight}
                                    disabled={selectedClips.size === 0}
                                    className="bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white px-8 py-2 h-10 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Create a highlight
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Filters Sidebar */}
                    <ClipFilters 
                        activeTab="clips" 
                        page="create-highlight"
                        onFilterChange={(filters) => {
                            // Update Redux filters and fetch new clips
                            dispatch(setUserFilters(filters));
                            dispatch(setUserPagination({
                                ...userPagination,
                                page: 1 // Reset to first page when filters change
                            }));
                            
                            dispatch(fetchUserClips({
                                userId,
                                ...filters,
                                page: 1,
                                limit: userPagination.limit
                            }));
                        }}
                    />

                    {/* Content Area */}
                    <div className="flex-1 p-8 overflow-auto">
                        {/* Clips Grid */}
                        <div className="mb-8">
                            {renderClipsGrid()}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPrevious={() => handlePageChange(Math.max(1, currentPage - 1))}
                                    onNext={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                    onChangePage={(p) => handlePageChange(p)}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Help Button */}
            <HelpButton />
        </div>
    );
};

export default ManualHighlightPage;
