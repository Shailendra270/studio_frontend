import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchBumpers, fetchGraphics, fetchOverlays, deleteBumperAsset, deleteGraphicAsset, deleteOverlayAsset } from "@/store/slices/assetsSlice";
import Sidebar from "../layouts/dashboard/Sidebar";
import EntityCard from "../layouts/EditorEntities/EntityCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RefreshButton from "@/containers/filters/RefreshButton";
import { SearchableSelect } from "@/components/ui/searchable-select";
import DeleteConfirmationModal from "@/components/modals/DeleteConfirmationModal";
import UploadAssetsModal from "@/components/modals/UploadAssetsModal";
import { toast } from "sonner";
import { limitOptions } from "@/constants/Filter";
import Pagination from "@/containers/filters/Pagination";
import { usePermissions } from "@/hooks/usePermissions";

const aspectRatios = [
    { label: "16 : 9", value: "16:9", selected: false },
    { label: "9 : 16", value: "9:16", selected: false },
    { label: "9 : 18", value: "9:18", selected: false },
    { label: "3 : 4", value: "3:4", selected: false },
    { label: "4 : 3", value: "4:3", selected: false },
    { label: "1 : 1", value: "1:1", selected: false },
    { label: "4 : 5", value: "4:5", selected: false }
];

const AssetsPage = () => {
    const dispatch = useAppDispatch();
     // Get current user ID from Redux store
    const user = useAppSelector((state) => state.auth.user);
    const userId = user?.userId || "";
    const folderId = "current-folder-id"; // Placeholder for folder ID
    const [activeTab, setActiveTab] = useState<"bumpers" | "graphics" | "overlays">("bumpers");
    const [selectedRatios, setSelectedRatios] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [limitPerPage, setLimitPerPage] = useState("20");
    const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
    const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
    const [assetToDelete, setAssetToDelete] = useState<string | null>(null);
    const [refreshedTabs, setRefreshedTabs] = useState<Record<string, boolean>>({});
    const lastRatiosRef = React.useRef<string>("");
    const lastFetchKeyRef = React.useRef<Record<string, string>>({});
    const { canCreate: canCreateAsset, canDelete: canDeleteAsset } = usePermissions();

    // Get assets from Redux store based on active tab
    const { bumpers, graphics, overlays } = useAppSelector((state) => state.assets);
    const assets = activeTab === 'bumpers' ? bumpers :
        activeTab === 'graphics' ? graphics : overlays;
    // Always show all assets initially, filters are only applied when ratios are selected
    const filteredAssets = assets.data;

    // Pagination logic
    const totalAssets = filteredAssets.length;
    const totalPages = Math.ceil(totalAssets / parseInt(limitPerPage));
    const startIndex = (currentPage - 1) * parseInt(limitPerPage);
    const endIndex = startIndex + parseInt(limitPerPage);
    const currentAssets = filteredAssets.slice(startIndex, endIndex);

    // Fetch assets when tab changes or pagination changes
    useEffect(() => {
        const fetchData = async () => {
            const page = currentPage;
            const limit = parseInt(limitPerPage);

            // Only fetch data if userId is available and we need to refresh
            if (!userId) {
                console.error("User ID is required to fetch assets");
                return;
            }

            // Build a stable fetch key so we avoid refetch loops on empty results
            const ratiosKey = JSON.stringify([...selectedRatios].sort());
            const fetchKey = JSON.stringify({ tab: activeTab, page, limit, userId, ratiosKey });
            const shouldFetch = refreshedTabs[activeTab] || lastFetchKeyRef.current[activeTab] !== fetchKey;

            if (shouldFetch) {
                if (activeTab === 'bumpers') {
                    await dispatch(fetchBumpers({ page, limit, userId, selectedRatios }));
                } else if (activeTab === 'graphics') {
                    await dispatch(fetchGraphics({ page, limit, userId }));
                } else if (activeTab === 'overlays') {
                    await dispatch(fetchOverlays({ page, limit, userId }));
                }
                // Record this fetch signature to prevent redundant refetches
                lastFetchKeyRef.current[activeTab] = fetchKey;
                
                // Mark this tab as refreshed
                setRefreshedTabs(prev => ({ ...prev, [activeTab]: false }));
            }
        };

        fetchData();
    }, [dispatch, activeTab, currentPage, limitPerPage, userId, refreshedTabs, selectedRatios]);


    const handleAspectRatioToggle = (ratio: string) => {
        setSelectedRatios(prev =>
            prev.includes(ratio)
                ? prev.filter(r => r !== ratio)
                : [...prev, ratio]
        );
        setCurrentPage(1); // Reset to first page when filters change
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Handle refresh button click
    const handleRefresh = () => {
        const fetchData = async () => {
            if (!userId) {
                toast.error("User ID is required to refresh assets");
                return;
            }

            if (activeTab === 'bumpers') {
                await dispatch(fetchBumpers({ page: 1, limit: parseInt(limitPerPage), userId }));
            } else if (activeTab === 'graphics') {
                await dispatch(fetchGraphics({ page: 1, limit: parseInt(limitPerPage), userId }));
            } else if (activeTab === 'overlays') {
                await dispatch(fetchOverlays({ page: 1, limit: parseInt(limitPerPage), userId }));
            }
            setCurrentPage(1);
        };

        fetchData();
    };

    // Handle tab change with optimization
    const handleTabChange = (tab: "bumpers" | "graphics" | "overlays") => {
        setActiveTab(tab);
        setCurrentPage(1);
        // Don't fetch immediately, let the useEffect handle it after checking if data exists
    };

    // Handle delete asset
    const handleDeleteAsset = (id: string) => {
        setAssetToDelete(id);
        setDeleteModalOpen(true);
    };

    // Confirm delete asset
    const confirmDeleteAsset = async () => {
        if (!assetToDelete) return;

        try {
            if (activeTab === 'bumpers') {
                await dispatch(deleteBumperAsset(assetToDelete));
            } else if (activeTab === 'graphics') {
                await dispatch(deleteGraphicAsset(assetToDelete));
            } else if (activeTab === 'overlays') {
                await dispatch(deleteOverlayAsset(assetToDelete));
            }

            // Refresh the data after deletion
            handleRefresh();

            // Show success toast
            toast.success(`Asset deleted successfully`);
        } catch (error) {
            toast.error(`Failed to delete asset`);
        } finally {
            setDeleteModalOpen(false);
            setAssetToDelete(null);
        }
    };

    // Handle upload modal
    const handleUploadModalOpen = () => {
        setUploadModalOpen(true);
    };

    const handleUploadModalClose = () => {
        setUploadModalOpen(false);
    };

    // Handle successful upload
    const handleUploadSuccess = (data: any) => {
        setUploadModalOpen(false);
        // Refresh the data after upload
        handleRefresh();
        toast.success(`Asset uploaded successfully`);
    };


    // Handle limit per page change
    const handleLimitChange = (value: string | string[]) => {
        const newLimit = Array.isArray(value) ? value[0] : value;
        setLimitPerPage(newLimit);
        setCurrentPage(1); // Reset to first page when limit changes
    };

    return (
        <div className="flex h-screen bg-[#18191B] text-white">
            <Sidebar />

            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-4">
                    <h1 className="text-[28px] font-medium text-white">Assets</h1>
                    {/* Upload Asset Button */}
                    {canCreateAsset('Assets') && (
                        <Button
                            className="bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white px-8 py-2 h-10 rounded-xl hover:opacity-90 transition-opacity"
                            onClick={handleUploadModalOpen}
                        >
                            Upload Asset
                        </Button>
                    )}
                </div>

                <div className="flex-1 p-6 overflow-auto">
                    {/* Tabs and Actions */}
                    <div className="flex items-center justify-between mb-4">
                        <Tabs value={activeTab} onValueChange={handleTabChange}>
                            <TabsList className="bg-transparent p-0 h-auto">
                                <TabsTrigger
                                    value="bumpers"
                                    className="bg-transparent text-white data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none relative px-4 py-2"
                                >
                                    Bumpers
                                    {activeTab === "bumpers" && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] rounded-t"></div>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="graphics"
                                    className="bg-transparent text-white data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none relative px-4 py-2"
                                >
                                    Graphics
                                    {activeTab === "graphics" && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] rounded-t"></div>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="overlays"
                                    className="bg-transparent text-white data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none relative px-4 py-2"
                                >
                                    Overlays
                                    {activeTab === "overlays" && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] rounded-t"></div>
                                    )}
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {/* Right side actions */}
                        <div className="flex items-center gap-4">
                            {/* Refresh */}
                            <RefreshButton text={true} onClick={handleRefresh} />

                            {/* Limit Dropdown */}
                            <SearchableSelect
                                value={limitPerPage}
                                onChange={handleLimitChange}
                                options={limitOptions}
                                className="bg-[#252525] text-white w-20 h-11"
                            />
                        </div>
                    </div>

                    {/* Header Actions */}
                    <div className="flex justify-between items-center mb-8">
                        {/* Aspect Ratio Filters */}
                            <div className="flex items-center gap-6">
                            {activeTab === "bumpers" && (
                                aspectRatios.map((ratio) => (
                                <div key={ratio.value} className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleAspectRatioToggle(ratio.value)}
                                        className="w-5 h-5 rounded-md bg-[#252525] flex items-center justify-center border border-transparent hover:border-white/20 transition-colors"
                                    >
                                        {selectedRatios.includes(ratio.value) && (
                                            <div className="w-3.5 h-3.5 rounded bg-gradient-to-r from-[#00BBFF] to-[#0051FF]" />
                                        )}
                                    </button>
                                    <span className="text-white font-montserrat text-base font-medium">
                                        {ratio.label}
                                    </span>
                                </div>
                            )))}
                        </div>

                        {/* Right side controls */}
                        <div className="flex items-center gap-4">
                            {/* Refresh Button */}
                            {/* <Button
                                variant="outline"
                                className="bg-[#252525] border-none text-white px-6 py-2 h-10 rounded-xl hover:bg-[#2A2A2A] transition-colors"
                            >
                                <svg 
                                className="w-3.5 h-3.5 mr-2"
                                viewBox="0 0 14 14" 
                                fill="none" 
                                xmlns="http://www.w3.org/2000/svg"
                                >
                                <path 
                                    d="M7 0C3.1339 0 0 3.1339 0 7C0 10.8661 3.1339 14 7 14C10.8661 14 14 10.8661 14 7H12.6C12.6 10.0926 10.0926 12.6 7 12.6C3.9074 12.6 1.4 10.0926 1.4 7C1.4 3.9074 3.9074 1.4 7 1.4C8.7248 1.4 10.2676 2.1798 11.2945 3.4055L9.8 4.9H14V0.7L12.2871 2.4122C11.004 0.9352 9.1112 0 7 0Z" 
                                    fill="currentColor"
                                />
                                </svg>
                                Refresh
                            </Button> */}

                            {/* Items per page */}
                             {/* <Button
                                variant="outline"
                                className="bg-[#252525] border-none text-white px-4 py-2 h-10 rounded-xl hover:bg-[#2A2A2A] transition-colors"
                            >
                                20
                                <svg 
                                className="w-1 h-1.5 ml-2 rotate-90"
                                viewBox="0 0 7 4" 
                                fill="none" 
                                xmlns="http://www.w3.org/2000/svg"
                                >
                                <path d="M3.5 4L0 0L7 0L3.5 4Z" fill="currentColor"/>
                                </svg>
                            </Button> */}

                            {/* Pagination next to Total Duration */}
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPrevious={() =>
                                handlePageChange(Math.max(currentPage - 1, 1))
                                }
                                onNext={() =>
                                handlePageChange(Math.min(currentPage + 1, totalPages))
                                }
                                onChangePage={handlePageChange}
                            />
                        </div>
                    </div>

                    {/* Assets Grid or Empty State */}
                    {currentAssets.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
                            {currentAssets.map((asset) => (
                                <div key={asset._id} className="flex justify-center">
                                    <div className="w-80">
                                        <EntityCard
                                            type={activeTab.replace('s', '') as "bumper" | "overlay" | "graphic"}
                                            id={asset._id}
                                            key={asset._id}
                                            title={asset.title}
                                            date={new Date(asset.createdAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                            thumbnail={asset.url}
                                            fileFormat={asset?.format}
                                            backgroundColor={"#252525"}
                                            duration={asset.duration}
                                            aspectRatio={asset.aspectRatio}
                                            delay={asset.delay}
                                            tab={activeTab.replace('s', '') as "bumper" | "overlay" | "graphic"}
                                            onClick={(id) => console.log("Asset clicked:", id)}
                                            onDelete={canDeleteAsset('Assets') ? handleDeleteAsset : undefined}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-24 h-24 rounded-full bg-[#252525] flex items-center justify-center mb-6">
                                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M24 12L36 24L24 36" stroke="#4A4A4A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M12 24L36 24" stroke="#4A4A4A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h3 className="text-white text-lg font-semibold mb-2">
                                No {activeTab} found
                            </h3>
                            <p className="text-gray-400 text-sm mb-6 text-center">
                                Try adjusting your search or upload new {activeTab}
                            </p>
                            {canCreateAsset('Assets') && (
                                <Button
                                    className="bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white px-8 py-2 h-10 rounded-xl hover:opacity-90 transition-opacity"
                                    onClick={handleUploadModalOpen}
                                >
                                    Upload new {activeTab.replace('s', '')}
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4">
                            <button
                                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="w-10 h-10 rounded-xl border border-[#252525] flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#252525] transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            <button
                                onClick={() => handlePageChange(1)}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium transition-colors ${currentPage === 1
                                    ? "border-2 border-white bg-[#252525] text-white"
                                    : "bg-[#252525] text-white hover:border-white/20 border border-transparent"
                                    }`}
                            >
                                1
                            </button>

                            {totalPages > 2 && currentPage > 2 && currentPage < totalPages - 1 && (
                                <>
                                    <div className="w-10 h-10 rounded-xl bg-[#252525] flex items-center justify-center text-white text-sm">
                                        ...
                                    </div>
                                    <button
                                        onClick={() => handlePageChange(currentPage)}
                                        className="w-10 h-10 rounded-xl border-2 border-white bg-[#252525] text-white flex items-center justify-center text-sm font-medium"
                                    >
                                        {currentPage}
                                    </button>
                                </>
                            )}

                            {totalPages > 1 && (
                                <button
                                    onClick={() => handlePageChange(totalPages)}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium transition-colors ${currentPage === totalPages
                                        ? "border-2 border-white bg-[#252525] text-white"
                                        : "bg-[#252525] text-white hover:border-white/20 border border-transparent"
                                        }`}
                                >
                                    {totalPages}
                                </button>
                            )}

                            <button
                                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="w-10 h-10 rounded-xl border border-[#252525] flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#252525] transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Delete Confirmation Modal */}
                    <DeleteConfirmationModal
                        isOpen={deleteModalOpen}
                        onClose={() => setDeleteModalOpen(false)}
                        onDelete={confirmDeleteAsset}
                        itemName="this asset"
                    />

                    {/* Upload Assets Modal */}
                    <UploadAssetsModal
                        isOpen={uploadModalOpen}
                        onClose={handleUploadModalClose}
                        assetType={activeTab.replace('s', '') as "bumper" | "overlay" | "graphic"}
                        onUpload={handleUploadSuccess}
                        userId={userId}
                        folderId={folderId}
                    />
                </div>
            </div>
        </div>
    );
};

export default AssetsPage;
