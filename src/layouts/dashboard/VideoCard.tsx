import React, { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { VideoData } from "../../mocks/dashboard_mockData/mockVideos";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { STATUS_STYLES, CATEGORY_COLORS, getCategoryColorFromConstant } from "../../constants/DashboardPage";
import VideoCardOptions from "./VideoCardOptions";
import SVGIcon from "@/components/common/SVGIcon";
import threeDotIcon from "@/assets/svg/3dotIcon.svg";
import { useResponsive } from "@/hooks/useResponsive";
import DeleteConfirmationModal from "@/components/modals/DeleteConfirmationModal";
import EditVideoModal from "@/containers/add-video/EditVideoModal";
import EndStreamConfirmationModal from "@/components/modals/EndStreamConfirmationModal";
import { deleteStream, endStream } from "@/api/streams";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { fetchStreams } from "@/store/slices/streamsSlice";
import { RootState } from "@/store/store";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";

interface VideoCardProps {
  video: VideoData;
  onClick?: () => void;
  onEdit?: (video: VideoData) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onClick, onEdit }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEndStreamModalOpen, setIsEndStreamModalOpen] = useState(false);
  const [isEndingStream, setIsEndingStream] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useResponsive();
  const dispatch = useDispatch();
  const { currentPage, pageSize, searchTerm, sortBy, sortOrder, filters } = useSelector(
    (state: RootState) => state.streams
  );
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const { canEdit: canEditStream, canDelete: canDeleteStream, canView: canViewClips } = usePermissions();

  const truncateText = (text: string, maxLength: number = 25) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const getCategoryColor = (categoryName: string) => {
    const normalizedCategory = categoryName.toLowerCase().replace(/\s+/g, '_');
    return CATEGORY_COLORS[normalizedCategory] || video.category.color || '#9E9E9E';
    // Alternatively, use the helper:
    // return getCategoryColorFromConstant(categoryName, video.category.color);
  };

  // const handleDropdownToggleClick = (e: React.MouseEvent) => {
  //   e.stopPropagation(); // Prevent card click when clicking dropdown toggle
  //   setShowDropdown(!showDropdown);
  // };

  const handleDropdownToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDropdown((prev) => !prev); // Toggle dropdown
  };


  const handleDropdownClose = () => {
    setShowDropdown(false);
  };

  // Placeholder functions for dropdown actions
  const handleEdit = () => {
    setIsEditModalOpen(true);
    handleDropdownClose();
  };

  const handleExport = () => {
    console.log("Export JSON clicked for:", video.title);
    handleDropdownClose();
  };

  const handleViewDetails = () => {
    console.log("Views details clicked for:", video.title);
    handleDropdownClose();
  };

  const handleActivityLogs = () => {
    console.log("Activity logs clicked for:", video.title);
    handleDropdownClose();
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
    setShowDropdown(false);
  };

  const handleEndStream = async () => {
    if (!video?.streamId) {
      toast.error('Stream ID not found');
      return;
    }

    setIsEndingStream(true);
    try {
      await endStream(video.streamId);
      // Refresh the streams list to update isLive status
      if (user?.userId) {
        dispatch(fetchStreams({
          filters: {
            ...filters,
            userId: user.userId,
          },
          page: currentPage,
          limit: pageSize,
          search: searchTerm,
          sortBy,
          sortOrder,
          useCache: false // Force fresh data
        }));
      }
      setIsEndStreamModalOpen(false);
    } catch (error) {
      console.error('Error ending stream:', error);
    } finally {
      setIsEndingStream(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteStream(video.id);
      toast.success('Stream deleted successfully');
      setIsDeleteModalOpen(false);

      // Refresh the streams list
      if (user?.userId) {
        dispatch(fetchStreams({
          filters: {
            ...filters,
            userId: user.userId,
          },
          page: currentPage,
          limit: pageSize,
          search: searchTerm,
          sortBy,
          sortOrder,
          useCache: false // Force fresh data
        }));
      }
    } catch (error) {
      console.error('Error deleting stream:', error);
      toast.error('Failed to delete stream');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
  };

  const canNavigateToClips = canViewClips('Clips');
  return (
    <>
      <Card
        className="bg-[#1A1B1E] overflow-hidden group cursor-pointer transition-all duration-300 border border-transparent hover:border-gray-600"
        style={{ borderRadius: "12px" }}
        onClick={canNavigateToClips ? onClick : undefined}
      >
        <div className="relative">
          {/* Thumbnail */}
          <div
            className={`aspect-video bg-gray-700 overflow-hidden ${video.isLive ? "border-2 border-red-500" : ""}`}
            // ${video.isLive ? "border-2 border-red-500" : ""}
            style={{ borderRadius: "12px 12px 12px 12px" }}
          >
            <img
              src={video.thumbnail}
              alt={video.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onClick={(e) => {
                e.stopPropagation();
                if (canNavigateToClips) navigate(`/clips/${video.streamId}`);
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/api/placeholder/320/180";
              }}
            />
          </div>

          {/* Overlay Badges (Role) */}
          {/* <div className="absolute top-2 left-2">
            <Badge
              className="text-xs font-medium px-2 py-1 rounded-md"
              style={{
                backgroundColor: "#252525",
                color: "#FFF",
              }}
            >
              {video.role}
            </Badge>
          </div> */}

          {/* Dropdown for More options (3 dots) - only if user can edit or delete */}
          {(canEditStream('Streams / Live') || canDeleteStream('Streams / Live')) && (
            <div className="absolute top-2 right-2 z-10">
              <div
                className="cursor-pointer hover:opacity-80 transition-opacity"
                style={{ borderRadius: "5px" }}
                onClick={handleDropdownToggleClick}
              >
                <SVGIcon src={threeDotIcon} className="w-full h-auto" />
              </div>
              <VideoCardOptions
                isOpen={showDropdown}
                onClose={handleDropdownClose}
                onEdit={handleEdit}
                onExport={handleExport}
                onViewDetails={handleViewDetails}
                onActivityLogs={handleActivityLogs}
                onDelete={handleDelete}
                onEndStream={() => setIsEndStreamModalOpen(true)}
                isLive={video.isLive}
                streamStatus={(video as any)?.status}
                canEdit={canEditStream('Streams / Live')}
                canDelete={canDeleteStream('Streams / Live')}
              />
            </div>
          )}

          {/* Live/Status Badge - positioned at bottom left inside thumbnail */}
          <div className="absolute bottom-2 left-2">
            {video.isLive ? (
              <div className="flex items-center justify-center px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-md">
                Live
              </div>
            ) : (
              <div
                className="flex items-center justify-center px-2 py-1 text-xs font-medium rounded-md"
                style={{
                  backgroundColor: video.status.background,
                  color: video.status.color,
                }}
              >
                {video.status.name}
              </div>
            )}
          </div>
          <div className="absolute bottom-2 left-2">
            {
              // video.isLive ? (
              //   <div className="flex items-center justify-center px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-md">
              //     Live
              //   </div>
              // ) : (
              (() => {
                const status = STATUS_STYLES[video.status];
                if (!status) return null;
                return (
                  <div
                    className="flex items-center justify-center px-2 py-1 text-xs font-medium rounded-md"
                    style={{ backgroundColor: status.background, color: status.color }}
                  >
                    {status.name}
                  </div>
                );
              })()
              // )
            }
          </div>

        </div>

        <CardContent className="p-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <h3 className="font-semibold text-sm mb-2 line-clamp-2 text-white leading-5 cursor-help">
                {truncateText(video.title)}
              </h3>
            </TooltipTrigger>
            <TooltipContent side="top" align="start" className="max-w-xs">
              <p>{video.title}</p>
            </TooltipContent>
          </Tooltip>
          <p className="text-xs text-gray-400 mb-3">
            {(() => {
              const rawDate =
                (video as any).matchDate ||
                (video as any).createdAt ||
                (video as any).date;
              const rawTime = (video as any).time;
              if (rawDate) {
                const d = new Date(rawDate);
                if (!isNaN(d.getTime())) {
                  const dateLabel = d.toLocaleDateString("en-US", {
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                  });
                  const timeLabel = d.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  });
                  return (
                    <>
                      {dateLabel}
                      &nbsp;/{" "}
                      {timeLabel}
                    </>
                  );
                }
              }
              return (
                <>
                  {String(rawDate || "")}
                  {rawTime ? " / " : ""}
                  {rawTime ? String(rawTime) : ""}
                </>
              );
            })()}
          </p>
          <div className="flex items-center justify-between">
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  className="text-xs font-medium px-2 py-1 rounded-md cursor-help"
                  style={{
                    backgroundColor: getCategoryColor(video.category),
                    color: "#FFF",
                  }}
                >
                  {video.category?.charAt(0).toUpperCase() + video.category?.slice(1)}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{video.category.name}</p>
              </TooltipContent>
            </Tooltip>
            <Badge
              variant="secondary"
              className="bg-[#252525] text-gray-300 text-xs rounded-md"
            >
              {video.clipsCount} clips
            </Badge>
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onDelete={handleConfirmDelete}
        onClose={handleCancelDelete}
        itemName={video.title}
      />
      <EditVideoModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        video={{ id: video.id, shortId: (video as any).streamId, title: video.title, category: (video as any).category || "", url: (video as any).url }}
        // onUpdated={() => {
        //   // Refresh the streams list after successful update
        //   if (user?.userId) {
        //     dispatch(fetchStreams({
        //       filters: {
        //         ...filters,
        //         userId: user.userId,
        //       },
        //       page: currentPage,
        //       limit: pageSize,
        //       search: searchTerm,
        //       sortBy,
        //       sortOrder,
        //       useCache: false,
        //     }));
        //   }
        // }}
      />
      <EndStreamConfirmationModal
        isOpen={isEndStreamModalOpen}
        onClose={() => setIsEndStreamModalOpen(false)}
        onConfirm={handleEndStream}
        isLoading={isEndingStream}
      />
      </>
  );
};

export default VideoCard;
