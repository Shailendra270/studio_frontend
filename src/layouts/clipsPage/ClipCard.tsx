import React, { useState, useRef, useCallback, memo, RefObject, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ClipData } from "@/mocks/clips_mockData/mockClips";
import { FolderData } from "@/store/slices/foldersSlice";
import ClipCardOptions from "./ClipCardOptions";
import { useResponsive } from "@/hooks/useResponsive";
import SVGIcon from "@/components/common/SVGIcon";
import SparkleGradient from '@/assets/svg/SparkleGradient.svg';
import threeDotIcon from "@/assets/svg/3dotIcon.svg";
import AI_Icon from "../../assets/svg/AI_Icon.svg";
import Star_Icon from "../../assets/svg/Star_Icon.svg";
import ZentagThumbnail from "../../assets/images/zentagLogo.png";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock } from "lucide-react";
import moment from "moment";
import { truncateText } from "@/utils/text";

interface ClipCardProps {
    page: string;
    activeTab: string;
    clip?: ClipData;
    folder?: FolderData;
    thumbnail?: FolderData;
    isSelected: boolean;
    onSelect?: (id: string, selected: boolean) => void;
    onClick?: () => void;
    lazyLoad?: boolean;
    dropdownRef: RefObject<HTMLDivElement>;
    showDropdown: boolean;
    setShowDropdown?: (show: boolean) => void;
    isFolder?: boolean;
    onRefresh?: () => void;
    aspectRatioFilter?: string;
};

const ClipCard: React.FC<ClipCardProps> = memo(({
    clip,
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
    isFolder = false,
    onRefresh,
    aspectRatioFilter,
}) => {
    // Get the current item (clip or folder)
    const currentItem = isFolder ? folder : clip;
    const [internalShowDropdown, setInternalShowDropdown] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const internalDropdownRef = useRef<HTMLDivElement>(null);
    const { isMobile, isTablet } = useResponsive();
    const navigate = useNavigate();

    // Use external or internal dropdown state
    const currentShowDropdown = showDropdown !== undefined ? showDropdown : internalShowDropdown;
    const currentSetShowDropdown = setShowDropdown || setInternalShowDropdown;
    const currentDropdownRef = dropdownRef || internalDropdownRef;

    // Helper functions for folder support
    const getThumbnailUrl = () => {
        if (isFolder && folder) {
            if (folder?.previewUrl) {
                return folder?.thumbnail;
            }
            return folder.clips && folder.clips.length > 0 && folder.clips[0].thumbnailUrl
                ? folder.thumbnail || folder.clips[0].thumbnailUrl
                : '';
        }

        // For clips, check if aspect ratio filter is applied and if clip has matching editedVideos
        if (clip && aspectRatioFilter && aspectRatioFilter !== 'all' && clip.editedVideos) {
            // Find editedVideo with matching aspect ratio (excluding DYNAMIC events)
            const matchingEditedVideo = clip.editedVideos.find(
                editedVideo => editedVideo.aspect_ratio === aspectRatioFilter &&
                    editedVideo.event !== 'DYNAMIC'
            );

            if (matchingEditedVideo && matchingEditedVideo.thumbnailUrl) {
                return matchingEditedVideo.thumbnailUrl;
            }
        }

        return clip?.thumbnailUrl || '';
    };

    const getTitle = () => {
        return isFolder ? folder?.title || "Untitled Folder" : clip?.title || "Untitled Clip";
    };

    const getId = () => {
        return isFolder ? folder?._id : (clip?._id || clip?.id);
    };

    const getDuration = () => {
        if (isFolder && folder) {
            const hasDuration = typeof folder.totalDuration === 'number' && !Number.isNaN(folder.totalDuration);
            // Determine if the folder is currently generating (processing/normalizing) without a finalized duration
            const statusVal: any = folder?.status as any;
            const statusName = typeof statusVal === 'string'
                ? statusVal.toLowerCase()
                : (statusVal && typeof statusVal === 'object' && typeof statusVal.name === 'string'
                    ? statusVal.name.toLowerCase()
                    : '');
            const isDraft = statusName === 'draft';
            const isProcessing = statusName === 'processing';
            const isNormalizing = statusName === 'normalizing clips';
            const isGeneratingFolder = Boolean(!isDraft && (isProcessing || isNormalizing));

            if (hasDuration) {
                return moment.utc((folder.totalDuration as number) * 1000).format('mm:ss');
            }
            // Show a neutral placeholder while generating when duration is not yet available
            if (isGeneratingFolder) {
                return '--:--';
            }
            return '00:00';
        }
        return clip?.duration ? moment.utc(clip.duration * 1000).format('mm:ss') : '00:00';
    };

    const getAspectRatio = () => {
        if (isFolder && folder) {
            return folder.aspectRatio
                || "16:9";
        }

        // For clips, check if aspect ratio filter is applied and if clip has matching editedVideos
        if (clip && aspectRatioFilter && aspectRatioFilter !== 'all' && clip.editedVideos) {
            // Find editedVideo with matching aspect ratio (excluding DYNAMIC events)
            const matchingEditedVideo = clip.editedVideos.find(
                editedVideo => editedVideo.aspect_ratio === aspectRatioFilter &&
                    editedVideo.event !== 'DYNAMIC'
            );

            if (matchingEditedVideo && matchingEditedVideo.aspect_ratio) {
                return matchingEditedVideo.aspect_ratio;
            }
        }

        return clip?.aspectRatio || "16:9";
    };

    const getRating = () => {
        if (isFolder && folder) {
            return folder?.rating?.toString() || "0";

        }
        return clip?.rating?.toString() || "0";
    };

    const getCreatedDate = () => {
        const dateStr = isFolder ? folder?.createdAt : clip?.createdAt;
        return dateStr ? moment(dateStr).format('MMM DD, YYYY') : '';
    };

    const getCreatedTime = () => {
        const dateStr = isFolder ? folder?.createdAt : clip?.createdAt;
        return dateStr ? moment(dateStr).format('h:mm A') : '';
    };

    

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (currentDropdownRef.current && !currentDropdownRef.current.contains(event.target as Node)) {
                currentSetShowDropdown(false);
            }
        };

        if (currentShowDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [currentShowDropdown, currentSetShowDropdown, currentDropdownRef]);

    const handleDropdownToggle = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        currentSetShowDropdown(!currentShowDropdown);
    }, [currentShowDropdown, currentSetShowDropdown]);

    const handleCheckboxChange = useCallback(
        (checked: boolean) => {
            const itemId = getId();
            if (onSelect && itemId) {
                onSelect(itemId, checked);
            }
        },
        [onSelect, getId]
    );

    const handleCardClick = useCallback(() => {
        if (onClick && !isFolder) {
            onClick();
        } else if (isFolder && folder?.previewUrl) {
            onClick();
        } else {
            return;
        }
    }, [onClick, navigate, getId, isFolder, folder]);

    const handleImageLoad = useCallback(() => {
        setImageLoaded(true);
    }, []);

    const handleImageError = useCallback(
        (e: React.SyntheticEvent<HTMLImageElement>) => {
            setImageError(true);
            const target = e.target as HTMLImageElement;
            target.src = "/api/placeholder/320/180";
        },
        []
    );

    // Responsive grid adjustments
    const getResponsiveClasses = () => {
        if (isMobile) return "text-sm";
        if (isTablet) return "text-base";
        return "text-base";
    };

    return (
        <Card
            key={getId()}
            className={`
                    bg-[#1A1B1E] overflow-hidden group cursor-pointer transition-all duration-300 
                    border border-transparent hover:border-gray-600 
                    ${getResponsiveClasses()}
                    `}
            // ${isSelected ? "ring-2 ring-[#00BBFF]" : ""}
            style={{ borderRadius: "12px", overflow: "visible" }}
            onClick={handleCardClick}
        >
            <div className="relative">
                {/* Thumbnail with selection border */}
                <div
                    className={`
                            aspect-video bg-gray-700 overflow-hidden relative
                            `}
                    // ${isSelected ? "border-2 border-[#00BBFF] rounded-xl" : ""}
                    style={{
                        borderRadius: "12px 12px 12px 12px",
                        overflow: "visible",
                    }}
                >
                    {/* Image with loading states */}
                    <div
                        className="relative w-full h-full"
                        style={{
                            borderRadius: "12px 12px 12px 12px",
                            overflow: "hidden",
                        }}
                    >
                        {!imageLoaded && !imageError && (
                            <div className="absolute inset-0 bg-gray-700 animate-pulse" />
                        )}
                        <img
                            src={getThumbnailUrl()}
                            alt={getTitle()}
                            className={`
                                    w-full h-full object-contain group-hover:scale-105 transition-transform duration-300
                                    ${imageLoaded ? "opacity-100" : "opacity-0"}
                                `}
                            loading={lazyLoad ? "lazy" : "eager"}
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                        />
                        {/* Generating overlay for folders (my-highlights) */}
                        {(() => {
                            const progress = Number(folder?.progressPercent ?? 0);
                            const statusVal: any = folder?.status as any;
                            const statusName = typeof statusVal === 'string'
                                ? statusVal.toLowerCase()
                                : (statusVal && typeof statusVal === 'object' && typeof statusVal.name === 'string'
                                    ? statusVal.name.toLowerCase()
                                    : '');

                            const isDraft = statusName === 'draft';
                            const isProcessing = statusName === 'processing';
                            const isNormalizing = statusName === 'normalizing clips';

                            const isGeneratingFolder = Boolean(
                                isFolder &&
                                folder &&
                                !isDraft &&
                                (
                                    isProcessing ||
                                    isNormalizing ||
                                    (!folder.previewUrl && (progress > 0 || isProcessing || isNormalizing)) ||
                                    (progress < 100 && !folder.previewUrl)
                                )
                            );
                            return isGeneratingFolder ? (
                                <div
                                    className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center rounded-xl border-2 border-[#00EEFF]"
                                // style={{
                                //     backgroundImage: `url(${ZentagThumbnail})`,
                                //     backgroundSize: 'cover',
                                //     backgroundPosition: 'center',
                                // }}
                                >
                                    <div className="flex items-center gap-2 text-white font-medium mt-12">
                                        {/* Video icon */}
                                        <svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 2H2C0.895431 2 0 2.89543 0 4V12C0 13.1046 0.895431 14 2 14H12C13.1046 14 14 13.1046 14 12V4C14 2.89543 13.1046 2 12 2Z" fill="#BDBDBD" />
                                            <path d="M20 4.5L15 7.5V8.5L20 11.5V4.5Z" fill="#BDBDBD" />
                                        </svg>
                                        <span>
                                            Generating... {Number(progress).toFixed(2)}%
                                        </span>
                                    </div>
                                </div>
                            ) : null;
                        })()}
                    </div>

                    {/* Editor Badge - Top Left (next to checkbox) */}
                    {/* <div
                            className="absolute top-2 left-2 z-10"
                            onClick={(e) => {
                                e.stopPropagation();
                                const itemId = getId();
                                if (isFolder) {
                                    navigate(`/editor-page/${itemId}`);
                                } else if (page === "my-highlights" || activeTab === "highlights") {
                                    navigate(`/editor-page?Id=${itemId}`);
                                } else if (page === "clips" || page === "live-video") {
                                    navigate(`/clip-editor?clipId=${itemId}`);
                                }
                            }}
                        >
                            <Badge
                                className={`
                                    font-medium rounded-md
                                    ${isMobile
                                        ? "text-xs px-1.5 py-0.5"
                                        : "text-xs px-2 py-1"
                                    }
                                `}
                                style={{
                                    backgroundColor: "#252525",
                                    color: "#FFF",
                                }}
                            >
                                Editor
                            </Badge>
                        </div> */}

                    {/* Checkbox for selection - Absolute positioned in thumbnail corner */}
                    {activeTab !== "highlights" &&
                        page !== "my-highlights" &&
                        page !== "live-video" && (
                            <div
                                className="absolute top-1 left-2 z-1"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={handleCheckboxChange}
                                    className="w-6 h-6 border-2 border-white bg-black/20 backdrop-blur-sm data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-[#00BBFF] data-[state=checked]:to-[#0051FF] data-[state=checked]:border-[#00BBFF]"
                                />
                            </div>
                        )}

                    <Badge
                        className="absolute bottom-1 left-2 z-1 text-xs font-medium px-2 py-1 rounded-md"
                        style={{
                            backgroundColor: "#252525",
                            color: "#FFF",
                        }}
                    >
                        {getAspectRatio()}
                    </Badge>

                    {/* Three-dot menu - Top Right */}
                    <div className="absolute top-2 right-2 z-1" ref={currentDropdownRef}>
                        <div
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                            style={{ borderRadius: "5px" }}
                            onClick={handleDropdownToggle}
                        >
                            <SVGIcon src={threeDotIcon} className="w-full h-auto" />
                        </div>

                        {/* ClipCardOptions component for the dropdown */}
                        {currentShowDropdown && (
                            <ClipCardOptions
                                showDropdown={currentShowDropdown}
                                setShowDropdown={currentSetShowDropdown}
                                activeTab={activeTab}
                                clip={clip}
                                folder={folder}
                                isFolder={isFolder}
                                page={page}
                                lazyLoad={lazyLoad}
                                onRefresh={onRefresh}
                            />
                        )}
                    </div>
                    {/* Duration Badge - Bottom Right */}
                    <div className="absolute bottom-1 right-2">
                        <Badge
                            className="text-xs font-medium px-2 py-1 rounded-md"
                            style={{
                                backgroundColor: "#252525",
                                color: "#FFF",
                            }}
                        >
                            {getDuration()}
                        </Badge>
                    </div>
                </div>
            </div>

            <CardContent className={`${isMobile ? "p-3" : "p-4"}`}>
                {(() => {
                    // Show progress bar inside CardContent when folder is generating
                    const progress = Number(folder?.progressPercent ?? 0);
                    const statusVal: any = folder?.status as any;
                    const statusName = typeof statusVal === 'string'
                        ? statusVal.toLowerCase()
                        : (statusVal && typeof statusVal === 'object' && typeof statusVal.name === 'string'
                            ? statusVal.name.toLowerCase()
                            : '');

                    const isDraft = statusName === 'draft';
                    const isProcessing = statusName === 'processing';
                    const isNormalizing = statusName === 'normalizing clips';

                    const isGeneratingFolder = Boolean(
                        isFolder &&
                        folder &&
                        !isDraft &&
                        (
                            isProcessing ||
                            isNormalizing ||
                            (!folder.previewUrl && (progress > 0 || isProcessing || isNormalizing)) ||
                            (progress < 100 && !folder.previewUrl)
                        )
                    );

                    if (!isGeneratingFolder) return null;

                    return (
                        <div className="flex items-center gap-1 text-[10px] mb-2">
                            {/* Progress bar (matches live video styling) */}
                            <div className="flex-1 h-[18px] bg-[#252525] rounded-sm relative">
                                <div
                                    className="h-[18px] bg-gradient-to-r from-[#00EEFF] to-[#0051FF] rounded-sm transition-all duration-300"
                                    style={{ width: `${parseFloat(progress.toFixed(2))}%` }}
                                ></div>
                                <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-medium font-montserrat">
                                    {parseFloat(progress.toFixed(2))}%
                                </span>
                            </div>
                        </div>
                    );
                })()}

                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 mb-1">
                            {!isFolder && clip?.hasAI && (
                                <div className="flex-shrink-0 mb-2">
                                    <SVGIcon src={AI_Icon} className="w-[20px] h-[13px]" />
                                </div>
                            )}
                            {/* Event type icon */}
                            {/* <div className="flex items-center gap-2">
                                    {clip.event === "Foul" && (
                                        <svg
                                            width="10"
                                            height="13"
                                            viewBox="0 0 10 13"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M9.90476 13H0V11.7619C0 10.941 0.326105 10.1537 0.906574 9.57324C1.48704 8.99277 2.27433 8.66667 3.09524 8.66667H6.80952C7.63043 8.66667 8.41772 8.99277 8.99819 9.57324C9.57866 10.1537 9.90476 10.941 9.90476 11.7619V13ZM4.95238 7.42857C4.46461 7.42857 3.98162 7.3325 3.53099 7.14584C3.08035 6.95918 2.67089 6.68559 2.32598 6.34068C1.98108 5.99578 1.70749 5.58632 1.52083 5.13568C1.33417 4.68504 1.2381 4.20205 1.2381 3.71429C1.2381 3.22652 1.33417 2.74353 1.52083 2.29289C1.70749 1.84225 1.98108 1.43279 2.32598 1.08789C2.67089 0.742986 3.08035 0.469393 3.53099 0.282733C3.98162 0.0960728 4.46461 -7.26829e-09 4.95238 0C5.93747 1.4679e-08 6.88221 0.391325 7.57878 1.08789C8.27534 1.78445 8.66667 2.7292 8.66667 3.71429C8.66667 4.69938 8.27534 5.64412 7.57878 6.34068C6.88221 7.03725 5.93747 7.42857 4.95238 7.42857Z"
                                                fill="white"
                                            />
                                        </svg>
                                    )}
                                </div> */}
                            {/* Special highlight icon for certain clips */}
                            {/* {clip.tags.includes("Shots on target") && (
                                    <div className="absolute bottom-2 left-2">
                                        <svg
                                            width="13"
                                            height="13"
                                            viewBox="0 0 13 13"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M12.813 6.72926C8.61288 7.60808 7.60808 8.61288 6.72926 12.813C6.67709 13.0623 6.32291 13.0623 6.27074 12.813C5.39192 8.61288 4.38712 7.60808 0.186959 6.72926C-0.0623197 6.67709 -0.0623197 6.32291 0.186959 6.27074C4.38712 5.39192 5.39192 4.38712 6.27074 0.186959C6.32291 -0.0623197 6.67709 -0.0623197 6.72926 0.186959C7.60808 4.38712 8.61288 5.39192 12.813 6.27074C13.0624 6.32291 13.0624 6.67709 12.813 6.72926Z"
                                                fill="url(#paint0_linear_highlight)"
                                            />
                                            <defs>
                                                <linearGradient
                                                    id="paint0_linear_highlight"
                                                    x1="25.0679"
                                                    y1="6.5771"
                                                    x2="6.89386"
                                                    y2="-11.5968"
                                                    gradientUnits="userSpaceOnUse"
                                                >
                                                    <stop stopColor="#00EEFF" />
                                                    <stop offset="1" stopColor="#0051FF" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                    </div>
                                )} */}
                            <div className="flex items-center gap-2">
                                {/* Show AI icon for folders with previewUrl or clips created by AI */}
                                {(isFolder && folder?.previewUrl && folder?.isAiCreated) || (!isFolder && clip?.isAiCreated) ? (
                                    <SVGIcon src={SparkleGradient} className="w-3 h-3 flex-shrink-0 mb-2" aria-label="Generated by AI" />
                                ) : null}
                                <h3
                                    className={`
                                        text-sm font-semibold tracking-[-0.1px] line-clamp-1 text-gray-100 leading-snug cursor-help flex-1
                                        ${isMobile ? "text-sm" : "text-base"}
                                    `}
                                >
                                    {truncateText(getTitle(), 25)}
                                </h3>
                            </div>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="start" className="max-w-xs">
                        <p>{isFolder ? folder?.title || "Untitled Folder" : clip?.title || "Untitled Clip"}</p>
                    </TooltipContent>
                </Tooltip>

                <p className="mt-1 text-xs font-normal text-gray-400 mb-3">
                    {getCreatedDate()}
                    &nbsp;/{" "}
                    {getCreatedTime()}
                </p>

                {/* Timestamp, Duration, and Aspect Ratio */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {!isFolder && clip?.start_time && clip?.end_time && (
                        <Badge
                            className="text-xs font-medium px-2 py-1 rounded-md"
                            style={{
                                backgroundColor: "#252525",
                                color: "#FFF",
                            }}
                        >
                            {clip.start_time} - {clip.end_time}
                        </Badge>
                    )}
                    {/* Rating and Status */}
                    {(+getRating() > 0 && <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                            <SVGIcon src={Star_Icon} className="w-[20px] h-[13px]" />
                            <span className="text-[15px] font-bold text-white mt-0.5">
                                {getRating()}
                            </span>
                        </div>
                    </div>)}
                    {isFolder && folder && (
                        <Badge
                            className="text-xs font-medium px-2 py-1 rounded-md"
                            style={{
                                backgroundColor: "#252525",
                                color: "#FFF",
                            }}
                        >
                            {folder.clipCount || folder.clips?.length || 0} clips
                        </Badge>
                    )}
                </div>

                {/* Tags */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {/* Clip Tags */}
                    {!isFolder && clip?.tags && (
                        <>
                            {clip.tags.slice(0, 2).map((tag, index) => (
                                <Tooltip key={index}>
                                    <TooltipTrigger asChild>
                                        <div
                                            className={`text-[11px] font-medium px-2 py-[2px] rounded-lg text-gray-300 cursor-help bg-[#1f2023] border border-[#00BBFF]`}
                                        >
                                            {tag}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" align="start" className="max-w-xs z-10 bg-gray-900 border border-gray-700">
                                        <p>{tag}</p>
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                            {clip.tags.length > 2 && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className={`text-[11px] font-medium px-2 py-[2px] rounded-lg text-gray-300 cursor-help bg-[#1f2023] border border-[#00BBFF]`}
                                        >
                                            +{clip.tags.length - 2}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" align="start" className="max-w-xs z-10 bg-gray-900 border border-gray-700">
                                        <div className="flex flex-col gap-1">
                                            {clip.tags.slice(2).map((tag, index) => (
                                                <p key={index}>{tag}</p>
                                            ))}
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                            {!isFolder && clip?.customData?.clip_ai_score && (
                                <Badge className="text-[11px] font-medium px-2 py-[2px] rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30" title={"scores"}>
                                    {clip.customData.clip_ai_score}
                                </Badge>
                            )}
                        </>
                    )}
                    {/* Folder Tags */}
                    {isFolder && folder?.tags && (
                        <>
                            {folder.tags.slice(0, 2).map((tag, index) => (
                                <Tooltip key={index}>
                                    <TooltipTrigger asChild>
                                        {/* <Badge
                                                className={`text-xs font-medium px-2 py-1 rounded-md text-white cursor-help ${folder.isAiCreated
                                                    ? "bg-[#252525] border-2 border-[#00BBFF]"
                                                    : "bg-[#252525]"
                                                    }`}
                                            > */}
                                        <div
                                            className={`text-[11px] font-medium px-2 py-[2px] rounded-lg text-gray-300 cursor-help bg-[#1f2023] border border-[#00BBFF]`}
                                        >
                                            {tag}
                                        </div>
                                        {/* </Badge> */}
                                    </TooltipTrigger>
                                    <TooltipContent side="top" align="start" className="max-w-xs z-50 bg-gray-900 border border-gray-700">
                                        <p>{tag}</p>
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                            {folder.tags.length > 2 && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        {/* <Badge
                                                className={`text-xs font-medium px-2 py-1 rounded-md text-white cursor-help ${folder.
                                                    ? "bg-[#252525] border-2 border-[#00BBFF]"
                                                    : "bg-[#252525]"
                                                    }`}
                                            > */}
                                        <div
                                            className={`text-[11px] font-medium px-2 py-[2px] rounded-lg text-gray-300 cursor-help bg-[#1f2023] border border-[#00BBFF]`}
                                        >
                                            +{folder.tags.length - 2}
                                        </div>
                                        {/* </Badge> */}
                                    </TooltipTrigger>
                                    <TooltipContent side="top" align="start" className="max-w-xs z-50 bg-gray-900 border border-gray-700">
                                        <div className="flex flex-col gap-1">
                                            {folder.tags.slice(2).map((tag, index) => (
                                                <p key={index}>{tag}</p>
                                            ))}
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
});

export default ClipCard;
