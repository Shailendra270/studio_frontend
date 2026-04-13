import React, { useState, useRef, useCallback, memo, RefObject } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { FolderData } from "@/store/slices/foldersSlice";
import ClipCardOptions from "./ClipCardOptions";
import { useResponsive } from "@/hooks/useResponsive";
import SVGIcon from "@/components/common/SVGIcon";
import threeDotIcon from "@/assets/svg/3dotIcon.svg";
import Star_Icon from "../../assets/svg/Star_Icon.svg";
import ZentagThumbnail from "../../assets/images/zentagLogo.png";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock } from "lucide-react";
import moment from "moment";

interface FolderCardProps {
    folder: FolderData;
    isSelected: boolean;
    onSelect?: (id: string, selected: boolean) => void;
    onClick?: () => void;
    lazyLoad?: boolean;
    activeTab: string;
    page: string;
    dropdownRef: RefObject<HTMLDivElement>;
    showDropdown: boolean;
    setShowDropdown: (show: boolean) => void;
    onRefresh?: () => void;
}

const FolderCard: React.FC<FolderCardProps> = memo(({
    folder,
    isSelected,
    onSelect,
    onClick,
    lazyLoad = true,
    activeTab,
    page,
    dropdownRef,
    showDropdown,
    setShowDropdown,
    onRefresh,
}) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const { isMobile, isTablet } = useResponsive();
    const navigate = useNavigate();

    // Handle dropdown toggle
    const handleDropdownToggle = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setShowDropdown((prev) => !prev);
    }, []);

    // Get thumbnail from first clip or use default
    const getThumbnailUrl = () => {
        if (folder.clips && folder.clips.length > 0 && folder.clips[0].thumbnailUrl) {
            return folder.clips[0].thumbnailUrl;
        }
        return '';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const truncateText = useCallback((text: string, maxLength: number = 30) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    }, []);

    // Get aspect ratio from first clip or default
    const getAspectRatio = () => {
        if (folder.clips && folder.clips.length > 0 && folder.clips[0].aspectRatio) {
            return folder.clips[0].aspectRatio;
        }
        return "16:9"; // Default aspect ratio
    };

    // Get average rating from clips or default
    const getRating = () => {
        if (folder.clips && folder.clips.length > 0) {
            const ratings = folder.clips.filter(clip => clip.rating).map(clip => clip.rating);
            if (ratings.length > 0) {
                const avgRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
                return Math.round(avgRating * 10) / 10; // Round to 1 decimal place
            }
        }
        return 0; // Default rating
    };

    const handleCardClick = () => {
        if (onClick) {
            onClick();
        } else {
            // Navigate to highlight editor for this folder
            navigate(`/editor-page/${folder._id}?aspectRatio=${getAspectRatio()}`);
        }
    };

    const handleImageLoad = useCallback(() => {
        setImageLoaded(true);
    }, []);

    const handleImageError = useCallback(() => {
        setImageError(true);
        setImageLoaded(true);
    }, []);



    return (
            <Card
                className={`
                    relative bg-[#1A1A1A] border-none rounded-xl cursor-pointer 
                    transition-all duration-200 hover:bg-[#252525] group
                    ${isSelected ? 'ring-2 ring-blue-500' : ''}
                `}
                onClick={handleCardClick}
                style={{ overflow: 'visible' }}
            >
                <CardContent className="p-0">
                    {/* Thumbnail Container */}
                    <div className="relative aspect-video bg-[#252525] rounded-t-xl overflow-hidden">
                        {/* Thumbnail Image */}
                        <div className="relative w-full h-full">
                            <img
                                src={getThumbnailUrl()}
                                alt={folder.name}
                                className={`
                                    w-full h-full object-cover group-hover:scale-105 transition-transform duration-300
                                    ${imageLoaded ? "opacity-100" : "opacity-0"}
                                `}
                                loading={lazyLoad ? "lazy" : "eager"}
                                onLoad={handleImageLoad}
                                onError={handleImageError}
                            />
                        </div>

                        {/* Three-dot menu - Top Right */}
                        <div className="absolute top-2 right-2 z-50" ref={dropdownRef}>
                            <div
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                style={{ borderRadius: "5px" }}
                                onClick={handleDropdownToggle}
                            >
                                <SVGIcon src={threeDotIcon} className="w-full h-auto" />
                            </div>
                        </div>

                        {/* ClipCardOptions component for the dropdown - rendered via portal */}
                        <ClipCardOptions
                            showDropdown={showDropdown}
                            setShowDropdown={setShowDropdown}
                            activeTab={activeTab}
                            clip={folder} // Pass folder as clip for compatibility
                            page={page}
                            lazyLoad={lazyLoad}
                            triggerRef={dropdownRef}
                            onRefresh={onRefresh}
                        />

                        {/* Total Duration Badge - Bottom Right */}
                        <div className="absolute bottom-1 right-2">
                            <Badge
                                className="text-xs font-medium px-2 py-1 rounded-md"
                                style={{
                                    backgroundColor: "#252525",
                                    color: "#FFF",
                                }}
                            >
                                {folder.totalDuration ? moment.utc(folder.totalDuration * 1000).format('HH:mm:ss') : '00:00:00'}
                            </Badge>
                        </div>
                    </div>

                    {/* Folder Info */}
                    <div className="p-4">
                        {/* Title */}
                         <Tooltip>
                             <TooltipTrigger asChild>
                                 <h3 className="text-white font-medium text-sm mb-2 line-clamp-2 hover:text-gray-300 transition-colors cursor-help">
                                     {truncateText(folder.title || folder.name, isMobile ? 25 : 30)}
                                 </h3>
                             </TooltipTrigger>
                             <TooltipContent>
                                 <p>{folder.title || folder.name}</p>
                             </TooltipContent>
                         </Tooltip>

                         {/* Date and Time */}
                         <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                             <div className="flex items-center gap-1">
                                 <Calendar className="w-3 h-3" />
                                 <span>{formatDate(folder.createdAt)}</span>
                             </div>
                             <div className="flex items-center gap-1">
                                 <Clock className="w-3 h-3" />
                                 <span>{formatTime(folder.createdAt)}</span>
                             </div>
                         </div>

                        {/* Aspect Ratio */}
                        <div className="mb-3">
                            <Badge
                                className="text-xs font-medium px-2 py-1 rounded-md"
                                style={{
                                    backgroundColor: "#252525",
                                    color: "#FFF",
                                }}
                            >
                                {getAspectRatio()}
                            </Badge>
                        </div>

                        {/* Clips Count, Rating and Status */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Badge className="bg-black/70 text-white text-xs px-2 py-1">
                                    {folder.clips?.length || 0} clips
                                </Badge>
                                
                                {/* Rating */}
                                <div className="flex items-center gap-1">
                                    <SVGIcon src={Star_Icon} className="w-[16px] h-[11px]" />
                                    <span className="text-[13px] font-bold text-white">
                                        {getRating()}
                                    </span>
                                </div>
                            </div>
                            
                            <Badge 
                                className="text-xs font-medium px-2 py-1 rounded-md"
                                style={{
                                    backgroundColor: '#252525',
                                    color: '#FFF',
                                    border: '1px solid #404040'
                                }}
                            >
                                Draft
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>
    );
});

export default FolderCard;