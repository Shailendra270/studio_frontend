import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "@/layouts/dashboard/Sidebar";
import ClipCard from "@/layouts/clipsPage/ClipCard";
import ClipFilters from "@/layouts/clipsPage/ClipFilters";
import ShimmerCard from "@/layouts/clipsPage/ClipShimmerCard";
import SearchBar from "@/containers/filters/SearchBar";
import { Button } from "@/components/ui/button";
import { ClipData } from "@/mocks/clips_mockData/mockClips";
import RefreshButton from "@/containers/filters/RefreshButton";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { limitOptions } from "@/constants/Filter";
import Pagination from "@/containers/filters/Pagination";
import SVGIcon from "@/components/common/SVGIcon";
import soccerIcon from "@/assets/svg/Zentag_full_white_sport_icons/football.svg";
import cricketIcon from "@/assets/svg/Zentag_full_white_sport_icons/cricket.svg";
import basketballIcon from "@/assets/svg/Zentag_full_white_sport_icons/basketball.svg";
import hockeyIcon from "@/assets/svg/Zentag_full_white_sport_icons/hockey.svg";
import tennisIcon from "@/assets/svg/Zentag_full_white_sport_icons/table_tennis.svg";
import HelpButton from "@/containers/help_section/HelpButton";
import SportsDropdown from '@/components/common/SportsDropdown';
import CreateHighlightModal from "@/components/modals/CreateHighlightModal";
import { CreateHighlightFormData } from "@/types/highlight";
import Loader from "@/components/common/Loader";
import PreviewModal from "@/components/modals/PreviewModal";
import DownloadPanel from "@/components/download/DownloadPanel";
import {
    fetchAllUserFolders,
    selectUserHighlights,
    selectUserHighlightsLoading,
    selectUserHighlightsError,
    selectUserHighlightsPagination,
    selectUserHighlightsFilters,
    setUserHighlightsFilters,
    setUserHighlightsPagination
} from "@/store/slices/foldersSlice";
import { selectUser } from "@/store/slices/authSlice";
import { selectClipsFilters } from "@/store/slices/clipsSlice";
import { AppDispatch } from "@/store/store";
import { PlusIcon } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

interface MyHighlightsProps {
    page: string;
}

const MyHighlights: React.FC<MyHighlightsProps> = ({ page }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    // Redux selectors
    const user = useSelector(selectUser);
    const userHighlights = useSelector(selectUserHighlights);
    const loading = useSelector(selectUserHighlightsLoading);
    const error = useSelector(selectUserHighlightsError);
    const pagination = useSelector(selectUserHighlightsPagination);
    const filters = useSelector(selectUserHighlightsFilters);
    const clipsFilters = useSelector(selectClipsFilters);
    const { canCreate: canCreateHighlight } = usePermissions();

    // Local state
    const [activeSport, setActiveSport] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [folderDropdowns, setFolderDropdowns] = useState<{ [key: string]: boolean }>({});
    const moreDropdownRef = useRef<HTMLDivElement>(null);
    const [isCreateHighlightModalOpen, setIsCreateHighlightModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [selectedClipForPreview, setSelectedClipForPreview] = useState<any>(null);
    const [folderData, setFolderData] = useState<any>(null);
    // const [showMobileFilters, setShowMobileFilters] = useState(false);

    const sports = [
        { name: "All", icon: null },
        { name: "Football", icon: soccerIcon },
        { name: "Cricket", icon: cricketIcon },
        { name: "Basketball", icon: basketballIcon },
        { name: "Hockey", icon: hockeyIcon },
        { name: "Tennis", icon: tennisIcon },
    ];

    // Helper function to convert sort string to MongoDB sort object
    const getSortObject = (sortBy: string) => {
        switch (sortBy) {
            case 'latest':
                return { createdAt: -1 };
            case 'oldest':
                return { createdAt: 1 };
            case 'rating':
                return { averageRating: -1 };
            case 'duration':
                return { duration: -1 };
            default:
                return { createdAt: -1 };
        }
    };

    // Debounce search input to avoid frequent refetches
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
        return () => clearTimeout(t);
    }, [searchQuery]);

    // Fetch user folders on component mount and when filters change (debounced search + specific deps)
    useEffect(() => {
        if (user?.userId) {
            const payload = {
                isAiCreated: true,
                userId: user.userId,
                page_no: pagination.currentPage,
                limit: pagination.limit,
                // search: clipsFilters.search || '',
                search: debouncedSearch || "",
                category: activeSport.toLocaleLowerCase() || "",
                aspectRatio: clipsFilters?.aspectRatio?.length ? clipsFilters.aspectRatio : undefined,
                rating: clipsFilters?.rating?.length ? clipsFilters.rating : undefined,
                duration: clipsFilters?.duration ? clipsFilters.duration : undefined,
                dateRange: clipsFilters?.dateRange?.startDate && clipsFilters?.dateRange?.endDate ? {
                    startDate: clipsFilters.dateRange.startDate,
                    endDate: clipsFilters.dateRange.endDate
                } : undefined,
                sortBy: getSortObject(clipsFilters?.sortBy || 'latest')
            };
            dispatch(fetchAllUserFolders(payload));
        }
    }, [dispatch, user?.userId, pagination.currentPage, pagination.limit, activeSport, debouncedSearch, clipsFilters.search, clipsFilters.aspectRatio, clipsFilters.rating, clipsFilters.dateRange, clipsFilters.sortBy, clipsFilters.duration]);

    const handleClipSelect = (clipId: string, selected: boolean) => {
        console.log("Clip selected:", clipId, selected);
    };

    // Transform folder data to clip data format for display
    const transformFoldersToClips = (folders: any[]): ClipData[] => {
        return folders.map((folder) => ({
            id: folder._id,
            _id: folder._id,
            title: folder.title || "Untitled",
            date: new Date(folder.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            }),
            createdAt: folder.createdAt || folder.clips[0].createdAt || "",
            clips: folder.clips || [],
            time: new Date(folder.createdAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
            }),
            streamId: folder.streamId || "",
            category: folder.category,
            previewUrl: folder.previewUrl || "",
            duration: folder.totalDuration || "00:00:00",
            aspectRatio: folder.aspectRatio || "16:9",
            rating: folder.rating || 0,
            tags: folder.tags || [],
            status: folder.status || "normalizing clips",
            //  status: {
            //     name: folder.published ? "Published" : "Draft",
            //     color: "#FFF",
            //     background: folder.published ? "#00CF45" : "#6B7280",
            // },
            // If you need published/draft styling elsewhere, derive it there rather than overriding status here.
            isAiCreated: folder.isAiCreated ?? folder.isAICreated ?? false,
            type: folder.type || "highlight",
            videoUrl: folder.previewUrl || "",
            totalDuration: folder.totalDuration || "00:00:00",
            thumbnail: folder.thumbnail || "",
            thumbnails: folder.thumbnails || [],
            progressPercent: folder.progressPercent || 0,
            // status: folder.status || "normalizing clips",
        }));
    };

    const currentHighlights = transformFoldersToClips(userHighlights || []);

    const handleRefresh = () => {
        if (user?.userId) {
            const payload = {
                userId: user.userId,
                page_no: pagination.currentPage,
                limit: pagination.limit,
                isAiCreated: true,
                sortBy: getSortObject(clipsFilters?.sortBy || 'latest'),
                category: activeSport.toLocaleLowerCase() || "",
                ...filters
            };
            dispatch(fetchAllUserFolders(payload));
        }
    };

    const handlePageChange = (page: number) => {
        dispatch(setUserHighlightsPagination({ currentPage: page }));
    };

    const handleLimitChange = (newLimit: string) => {
        dispatch(setUserHighlightsPagination({ currentPage: 1, limit: parseInt(newLimit) }));
    };

    const handleCreateHighlight = (data: CreateHighlightFormData) => {
        console.log('Creating highlight with data:', data);

        // TODO: Implement actual highlight creation logic
        // This would typically involve:
        // 1. Creating a new highlight with the form data
        // 2. Adding selected clips to the highlight
        // 3. Navigating to the highlight editor or showing success message
        // 4. Making an API call to save the highlight

        // Example API call structure:
        // const highlightData = {
        //   ...data,
        //   clips: [],
        //   createdAt: new Date(),
        //   id: generateUniqueId()
        // };
        // await createHighlight(highlightData);
        // navigate(`/highlight-editor/${highlightData.id}`);
    };

    const handleFolderThumbnailClick = (clip: Highlight) => {
        // Ensure only one preview source is active
        setFolderData(null);
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
            category: clip.category,
        });
        setIsPreviewModalOpen(true);
    };

    const handleClosePreviewModal = () => {
        setIsPreviewModalOpen(false);
        setFolderData(null);
        setSelectedClipForPreview(null);
    };

    return (
        <>
            <div className="h-screen flex bg-[#18191B] text-white overflow-x-hidden">
                {/* Sidebar */}
                <Sidebar />

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-h-0 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-6">
                        <h1 className="text-[22px] sm:text-[28px] font-medium text-white">Highlights</h1>
                        {canCreateHighlight('Highlights') && (
                            <Button
                                onClick={() => setIsCreateHighlightModalOpen(true)}
                                className="bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white h-10 sm:h-11 px-4 sm:px-6 rounded-xl hover:opacity-90 transition-opacity"
                            >
                                <PlusIcon size={14} /> Create highlight
                            </Button>
                        )}
                    </div>

                    {/* Sport Tabs */}
                    <div className="px-4 sm:px-6 border-b border-[#252525]">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                            {/* Sport Navigation */}
                            <div className="flex items-center gap-4 sm:gap-8 flex-wrap">
                                {sports.map(({ name, icon }) => (
                                    <button
                                        key={name}
                                        onClick={() => {
                                            setActiveSport(name);
                                            dispatch(setUserHighlightsPagination({ currentPage: 1 }));
                                        }}
                                        className={`flex items-center gap-2 pb-4 transition-colors relative ${activeSport === name
                                            ? "text-white font-bold"
                                            : "text-white font-medium hover:text-gray-300"
                                            }`}
                                        style={{ alignItems: "center" }}
                                    >
                                        {activeSport === name && (
                                            <div
                                                className="absolute bottom-0 left-0 right-0 h-1"
                                                style={{
                                                    background:
                                                        "linear-gradient(315deg, #0EF -21.71%, #0051FF 118.09%)",
                                                }}
                                            />
                                        )}
                                        {icon && (
                                            <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
                                                <SVGIcon src={icon} className="w-5 h-5 sm:w-6 sm:h-6" />
                                            </div>
                                        )}
                                        <span className="text-md flex items-center">{name}</span>
                                    </button>
                                ))}
                                <SportsDropdown
                                    mode="dropdown"
                                    onChange={(value: string | string[]) => {
                                        const sportValue = Array.isArray(value) ? value[0] : value;
                                        if (sportValue) {
                                            setActiveSport(sportValue);
                                            dispatch(
                                                setUserHighlightsFilters({
                                                    ...filters,
                                                    category: sportValue === "All" ? "" : sportValue,
                                                })
                                            );
                                            dispatch(
                                                setUserHighlightsPagination({
                                                    ...pagination,
                                                    page_no: 1,
                                                })
                                            );
                                        }
                                    }}
                                    buttonLabel="More"
                                    className="mb-1"
                                    //   multiple={true}
                                    searchable={true}
                                //   options={sports}
                                />
                            </div>

                            {/* Right Side Controls */}
                            <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-end w-full sm:w-auto">
                                {/* Refresh Button */}
                                <RefreshButton onClick={handleRefresh} text={false} />

                                {/* Search Bar */}
                                <div className="w-full sm:w-64 md:w-72">
                                    <SearchBar
                                        value={searchQuery}
                                        onChange={setSearchQuery}
                                        placeholder="Search..."
                                        className="bg-[#252525] border-none text-white placeholder-gray-400 rounded-xl h-11"
                                    />
                                </div>

                                {/* Limit Dropdown */}
                                <SearchableSelect
                                    value={pagination.limit.toString()}
                                    onChange={(value) => {
                                        handleLimitChange(Array.isArray(value) ? value[0] : value);
                                    }}
                                    options={limitOptions}
                                    className="bg-[#252525] text-white w-24 sm:w-28 h-10 sm:h-11"
                                />

                                {/* <Button
                              variant="outline"
                              className="bg-[#252525] border-[#00BBFF] text-white hover:bg-[#00BBFF]/10 h-10 sm:h-11 px-4"
                              onClick={() => setShowMobileFilters((s) => !s)}
                            >
                              {showMobileFilters ? 'Hide filters' : 'Show filters'}
                            </Button> */}
                            </div>
                        </div>
                    </div>

                    {/* Main content with filters and grid */}
                    <div className="flex-1 flex min-h-0 overflow-hidden">
                        {/* Filters */}
                        <div className="hidden min-[700px]:flex lg:flex lg:w-80 w-full sm:w-64 md:w-72 bg-[#18191B] border-r border-[#252525] flex-col">
                            <ClipFilters page="my-highlights" activeTab="highlights" />
                        </div>
                        {/* Content Area */}
                        <div className="flex-1 flex flex-col min-w-0">
                            {/* Highlights Count and Sort */}
                            <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white">
                                    {pagination.totalCount.toLocaleString()} highlights
                                </h2>
                                {/* Pagination */}
                                <Pagination
                                    currentPage={pagination.currentPage}
                                    totalPages={pagination.totalPages}
                                    onPrevious={() =>
                                        handlePageChange(Math.max(pagination.currentPage - 1, 1))
                                    }
                                    onNext={() =>
                                        handlePageChange(
                                            Math.min(
                                                pagination.currentPage + 1,
                                                pagination.totalPages
                                            )
                                        )
                                    }
                                    onChangePage={(p) => handlePageChange(p)}
                                />
                            </div>
                            {/* {showMobileFilters && (
                          <div className="px-4 sm:px-6 py-3 border-b border-[#252525] lg:hidden">
                            <ClipFilters page="my-highlights" activeTab="highlights" />
                          </div>
                        )} */}
                            {/* Content Grid */}
                            <div className="flex-1 px-4 sm:px-6 pb-6 sm:pb-8 overflow-y-auto">
                                {loading ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                                        {Array.from({ length: 8 }).map((_, index) => (
                                            <ShimmerCard key={index} />
                                        ))}
                                    </div>
                                ) : currentHighlights.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                                        {currentHighlights.map((highlight) => {
                                            const dropdownRef = React.createRef<HTMLDivElement>();
                                            const showDropdown = folderDropdowns[highlight._id] || false;
                                            return (
                                                <ClipCard
                                                    key={highlight._id}
                                                    folder={highlight}
                                                    isFolder={true}
                                                    page={page}
                                                    activeTab="highlights"
                                                    isSelected={false}
                                                    lazyLoad={true}
                                                    // onSelect={handleClipSelect}
                                                    dropdownRef={dropdownRef}
                                                    showDropdown={showDropdown}
                                                    setShowDropdown={(show: boolean) => {
                                                        setFolderDropdowns(prev => ({
                                                            ...prev,
                                                            [highlight._id]: show
                                                        }));
                                                    }}
                                                    onClick={() => handleFolderThumbnailClick(highlight)}
                                                    //    onClick={() => {
                                                    //     // Navigate to highlight editor for this folder
                                                    //     navigate(`/editor-page/${highlight._id}`);
                                                    //   }}
                                                    onRefresh={handleRefresh}
                                                />
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-64">
                                        <div className="text-center">
                                            <h3 className="text-xl font-medium text-white mb-2">
                                                No highlights found
                                            </h3>
                                            <p className="text-gray-400">
                                                Try adjusting your search or sport filter.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Help Button */}
                    <HelpButton />
                </div>
                {/* Create Highlight Modal */}
                <CreateHighlightModal
                    isOpen={isCreateHighlightModalOpen}
                    onClose={() => setIsCreateHighlightModalOpen(false)}
                    selectedClips={[]}
                    onCreateHighlight={handleCreateHighlight}
                    onManualSelect={() => { }}
                    setIsLoading={setIsLoading}
                    setIsPreviewModalOpen={setIsPreviewModalOpen}
                    setFolderData={setFolderData}
                />

                {/* Loader */}
                <Loader
                    isVisible={isLoading}
                    message="Creating highlight, please wait..."
                />

                {/* Unified Preview Modal to avoid overlapping instances */}
                {isPreviewModalOpen && (folderData || selectedClipForPreview) && (
                    <PreviewModal
                        isOpen={isPreviewModalOpen}
                        onClose={handleClosePreviewModal}
                        clipData={folderData || selectedClipForPreview}
                        page={folderData ? "highlights" : page}
                    />
                )}
                {/* Preview Modal */}
                {/* {isPreviewModalOpen && folderData && (
                <PreviewModal
                    isOpen={isPreviewModalOpen}
                    onClose={handleClosePreviewModal}
                    clipData={folderData}
                    page="highlights"
                />
            )}

            {/* Preview Modal */}
                {/* {selectedClipForPreview && (
                <PreviewModal
                    isOpen={isPreviewModalOpen}
                    onClose={handleClosePreviewModal}
                    clipData={selectedClipForPreview}
                    page={page}
                />
            )} */}
            </div>
            <DownloadPanel />
        </>
    );
};

export default MyHighlights;
