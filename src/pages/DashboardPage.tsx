import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Sidebar from "../layouts/dashboard/Sidebar";
import DashboardHeader from "../layouts/dashboard/DashboardHeader";
import StatsCard from "../layouts/dashboard/StatsCard";
import VideoCard from "../layouts/dashboard/VideoCard";
import { dashboardStats } from "../constants/DashboardPage";
import Pagination from "@/containers/filters/Pagination";
import AddVideoFeedModal from "../containers/add-video/AddNewVideoModal";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { limitOptions } from "@/constants/Filter";
import HelpButton from "@/containers/help_section/HelpButton";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchStreams } from "@/store/slices/streamsSlice";
import { usePermissions } from "@/hooks/usePermissions";
import { Loader2 } from "lucide-react";
import ZentagThumbnail from "../assets/images/zentagLogo.png";
import RefreshButton from "@/containers/filters/RefreshButton";

const Dashboard = () => {
  const dispatch = useAppDispatch();

  const { streams, pagination, isLoading, error, filters } =
    useAppSelector((state) => state.streams);

  const { user } = useAppSelector((state) => state.auth);

  const { canCreate: canCreateStream } = usePermissions();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [limitPerPage, setLimitPerPage] = useState("20");
  const [currentPage, setCurrentPage] = useState(1);

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);

    if (user?.userId) {
      dispatch(
        fetchStreams({
          filters: {
            ...filters,
            userId: user.userId,
          },
          page,
          limit: parseInt(limitPerPage),
        })
      );
    }
  };

  // Handle limit change
  const handleLimitChange = (newLimit: string) => {
    setLimitPerPage(newLimit);
    setCurrentPage(1);

    if (user?.userId) {
      dispatch(
        fetchStreams({
          filters: {
            ...filters,
            userId: user.userId,
          },
          page: 1,
          limit: parseInt(newLimit),
        })
      );
    }
  };

  // Refresh
  const handleRefresh = () => {
    if (user?.userId) {
      dispatch(
        fetchStreams({
          filters: {
            ...filters,
            userId: user.userId,
          },
          page: 1,
          limit: parseInt(limitPerPage),
          useCache: false,
        })
      );
    }
  };

  // Initial fetch
  useEffect(() => {
    if (user?.userId) {
      dispatch(
        fetchStreams({
          filters: {
            ...filters,
            userId: user.userId,
          },
          page: 1,
          limit: parseInt(limitPerPage),
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId, dispatch]);

  // Sync pagination state
  useEffect(() => {
    if (pagination && pagination.page !== currentPage) {
      setCurrentPage(pagination.page);
    }
  }, [pagination, currentPage]);

  // Convert streams to UI format
  const videoData = streams.map((stream) => ({
    id: stream._id,
    streamId: stream.streamId,
    title: stream.title,
    thumbnail: stream.videoThumbnailUrl || '',
    duration: stream.duration || stream.inputVideoDuration || 0,
    category: stream.category,
    createdAt: stream.createdAt,
    matchDate: (stream as any).matchDate,
    status: stream.status,
    url: stream.url,
    hlsUrl: stream.hlsS3URL,
    isLive: stream.isLive,
    clipsCount: stream.clipsCount,
  }));

  return (
    <div className="flex h-screen bg-[#18191B] text-white overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <DashboardHeader
          title="Dashboard"
          onAddVideoFeed={
            canCreateStream("Streams / Live")
              ? () => setIsModalOpen(true)
              : undefined
          }
          userId={user?.userId}
        />

        <AddVideoFeedModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        />

        {/* Main */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 scroll-smooth">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {dashboardStats.map((stat, index) => (
              <StatsCard
                key={index}
                label={stat.label}
                value={stat.value}
                iconType={stat.iconType}
                color={stat.color}
              />
            ))}
          </div>

          {/* Videos Section */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">Recent videos</h2>

              <div className="flex flex-wrap items-center gap-3">
                <RefreshButton onClick={handleRefresh} text={false} />

                {/* Pagination */}
                {pagination && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={pagination.pages}
                    onPrevious={() =>
                      handlePageChange(Math.max(currentPage - 1, 1))
                    }
                    onNext={() =>
                      handlePageChange(
                        Math.min(currentPage + 1, pagination.pages)
                      )
                    }
                    onChangePage={(p) => handlePageChange(p)}
                  />
                )}

                {/* Limit */}
                <SearchableSelect
                  value={limitPerPage}
                  onValueChange={handleLimitChange}
                  options={limitOptions}
                  className="bg-[#252525] text-white w-24 sm:w-28 h-10 sm:h-11"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="text-center py-8">
                <p className="text-red-400 mb-4">
                  Error loading streams: {error}
                </p>

                <Button
                  onClick={() =>
                    user?.userId &&
                    dispatch(
                      fetchStreams({
                        filters: { userId: user.userId },
                        page: 1,
                        limit: parseInt(limitPerPage),
                      })
                    )
                  }
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Retry
                </Button>
              </div>
            )}

            {/* Loader */}
            {isLoading && (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-400">
                  Loading streams...
                </span>
              </div>
            )}

            {/* Empty */}
            {!isLoading && !error && videoData.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">
                  No streams found
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Try adjusting your filters or create a new stream
                </p>
              </div>
            )}

            {/* Grid */}
            {!isLoading && !error && videoData.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
                {videoData.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Help */}
      <HelpButton />
    </div>
  );
};

export default Dashboard;