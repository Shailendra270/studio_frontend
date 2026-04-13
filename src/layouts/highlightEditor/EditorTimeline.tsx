import React, { useState, useCallback, useEffect, useRef } from "react";
import threeDotIcon from "../../assets/svg/3dotIcon.svg";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { Presentation, Trash2 } from "lucide-react";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ClipData } from "@/mocks/clips_mockData/mockClips";

// Interface for bumper data structure
interface BumperData {
  _id: string;
  duration: number;
  folderId: string[];
  format: string;
  entityId: string;
  title: string;
  url: string;
  type: string;
  aspectRatio: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  illustoReferenceId?: string;
}

// Interface for clip data structure (extended from existing ClipData)
interface ClipItemData extends ClipData {
  streamId: string;
  startTime: number;
  clipData: any; // Full clip data object
}

// Union type for timeline items
interface TimelineItem {
  type: 'clip' | 'bumper';
  id: string;
  duration: number;
  url: string;
  bumperData?: BumperData;
  clipData?: ClipItemData;
  // Common properties for rendering
  title: string;
  aspectRatio: string;
  createdAt: string;
  // Clip-specific properties (optional for bumpers)
  tags?: string[];
  rating?: number;
  timestamp?: string;
  date?: string;
  time?: string;
}
import SVGIcon from "@/components/common/SVGIcon";
import ClipCardOptions from "../clipsPage/ClipCardOptions";
import moment from "moment";
import PreviewModal from "@/components/modals/PreviewModal";

interface SortableClipCardProps {
  item: TimelineItem;
  isActive: boolean;
  onClick: () => void;
  onDelete: (itemId: string) => void;
  folderAspectRatio?: string;
  showDelete?: boolean;
}

const SortableClipCard: React.FC<SortableClipCardProps> = ({
  item,
  isActive,
  onClick,
  onDelete,
  folderAspectRatio,
  showDelete = true,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedClipForPreview, setSelectedClipForPreview] = useState<any>(null);
  // Determine if the clip has an edited video matching the folder's aspect ratio
  const editedVideos: any[] | undefined = (item?.clipData as any)?.editedVideos;
  // const normalizedFolderAspect = (folderAspectRatio || '').replace(/\s/g, '');
  const hasMatchingAspect = folderAspectRatio === '16:9'
    ? true
    : Array.isArray(editedVideos)
      ? editedVideos.some((ev: any) => ((ev?.aspect_ratio || '').replace(/\s/g, '') === folderAspectRatio) && ev?.event !== 'DYNAMIC')
      : false;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleClick = () => {
    if (!isDragging) {
      onClick();
    }
  };

  const truncateText = (text: string, maxLength: number = 25) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // const handleDropdownToggle = useCallback((e: React.MouseEvent) => {
  //   e.stopPropagation();
  //   setShowDropdown((prev) => !prev); // Toggle directly
  // }, []);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onDelete(item.id);
  };
  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    const folderAR = (folderAspectRatio || '').replace(/\s/g, '');
    const clip = item?.clipData as any;
    const edited = Array.isArray(clip?.editedVideos) ? clip.editedVideos : [];
    const match = folderAR === '16:9'
      ? null
      : edited.find((ev: any) => ((ev?.aspect_ratio || '').replace(/\s/g, '') === folderAR) && ev?.event !== 'DYNAMIC');
    const thumb = folderAR === '16:9' ? (clip?.thumbnailUrl || item.url) : (match?.thumbnailUrl || clip?.thumbnailUrl || item.url);
    const videoUrl = folderAR === '16:9' ? item.url : (match?.videoUrl || item.url);
    const preview = {
      id: item.id,
      title: item.title,
      timeRange: clip ? `${clip.start_time || ''} - ${clip.end_time || ''}` : '',
      duration: item.duration?.toString() || '0',
      aspectRatio: folderAspectRatio || item.aspectRatio,
      rating: clip?.rating || 0,
      poster: thumb,
      videoUrl: videoUrl,
      type: item.type,
    };
    setSelectedClipForPreview(preview);
    setIsPreviewModalOpen(true);
  };
  // console.log(item);
  // const handleClipThumbnailClick = (item: TimelineItem) => {
  //   console.log('Timeline clip clicked:', item);

  //   // Extract clip data based on item type
  //   const clipData = item.type === 'clip' ? item.clipData : null;
  //   const bumperData = item.type === 'bumper' ? item.bumperData : null;

  //   setSelectedClipForPreview({
  //     id: item.id,
  //     title: item.title,
  //     timeRange: clipData ? `${clipData.start_time || '00:00'} - ${clipData.end_time || '00:00'}` : 'N/A',
  //     duration: item.duration?.toString() || '0',
  //     aspectRatio: item.aspectRatio || '16:9',
  //     rating: clipData?.rating || 0,
  //     poster: clipData?.thumbnailUrl || item.url,
  //     videoUrl: item.url,
  //     type: item.type,
  //   });
  //   setIsPreviewModalOpen(true);
  // };

  const handleClosePreviewModal = () => {
    setIsPreviewModalOpen(false);
    setSelectedClipForPreview(null);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`flex-shrink-0 relative w-[232px] ${isDragging ? "opacity-50" : ""
        }`}
      onClick={handleClick}
    >
      {/* Clip Card — professional, consistent layout; active border on whole card */}
      <div className={`w-full h-auto rounded-xl border bg-[#1A1B1D] shadow-sm overflow-hidden transition-shadow hover:shadow-md ${isActive ? "border-2 border-[#00BBFF] shadow-[0_0_12px_rgba(0,187,255,0.25)]" : "border border-[#252525] hover:border-[#333]"}`}>
        <div className="px-4 py-3 flex flex-col gap-0">
          {/* Thumbnail Container */}
          <div
            {...listeners}
            className="w-full aspect-video bg-[#0C0C0E] rounded-lg overflow-hidden relative cursor-grab active:cursor-grabbing shrink-0"
          >
            {/* Clip Number Badge — consistent size */}
            <div className="absolute top-2 left-2 z-10">
              <span className="inline-flex items-center rounded-md bg-black/70 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-white">#{item?.type}</span>
            </div>

            {/* Active Overlay — gradient + play icon only; border is on whole card */}
            {isActive && (
              <div className="absolute inset-0 bg-gradient-to-br from-[#00EEFF]/20 to-[#0051FF]/20 rounded-lg z-20">
                <div className="absolute inset-0 bg-black/10 rounded-lg" />
                {/* Play Icon in Center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-gradient-to-r from-[#00BBFF] to-[#0051FF] rounded-full p-3 shadow-lg animate-pulse">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M8 5v14l11-7z"
                        fill="white"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Active Indicator */}
            {/* {isActive && (
            <div className="absolute top-3 left-14 z-10">
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13.7986 7.24686C9.27537 8.19328 8.19328 9.27537 7.24686 13.7986C7.19068 14.0671 6.80926 14.0671 6.75308 13.7986C5.80666 9.27537 4.72457 8.19328 0.20134 7.24686C-0.0671132 7.19068 -0.0671132 6.80926 0.20134 6.75308C4.72457 5.80666 5.80666 4.72457 6.75308 0.20134C6.80926 -0.0671132 7.19068 -0.0671132 7.24686 0.20134C8.19328 4.72457 9.27537 5.80666 13.7986 6.75308C14.0671 6.80926 14.0671 7.19068 13.7986 7.24686Z"
                  fill="url(#paint0_linear_active)"
                />
                <defs>
                  <linearGradient
                    id="paint0_linear_active"
                    x1="26.9961"
                    y1="7.083"
                    x2="7.42413"
                    y2="-12.4888"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#00EEFF" />
                    <stop offset="1" stopColor="#0051FF" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            )} */}
            <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center gap-1 z-10 pointer-events-none">
              <span className="rounded bg-black/70 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-medium text-white">{folderAspectRatio ?? item.aspectRatio}</span>
              <span className="rounded bg-black/70 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-medium text-white">
                {moment.utc(item?.duration * 1000).format("mm:ss")}
              </span>
            </div>

            {/* Thumbnail Image */}
            {(() => {
              const folderAR = (folderAspectRatio || '').replace(/\s/g, '');
              const clip = item?.clipData as any;
              const edited = Array.isArray(clip?.editedVideos) ? clip.editedVideos : [];
              const match = folderAR === '16:9'
                ? null
                : edited.find((ev: any) => ((ev?.aspect_ratio || '').replace(/\s/g, '') === folderAR) && ev?.event !== 'DYNAMIC');
              const isBumper = item?.type === 'bumper';
              if (isBumper) {
                const vsrc = item.url || clip?.videoUrl || '';
                return (
                  <video
                    src={vsrc}
                    className={`w-full h-full object-contain group-hover:scale-105 transition-transform duration-300`}
                    muted
                    playsInline
                    preload="metadata"
                  />
                );
              }
              const thumb = folderAR === '16:9' ? (clip?.thumbnailUrl || item.url) : (match?.thumbnailUrl || clip?.thumbnailUrl || item.url);
              return (
                <img
                  src={thumb}
                  alt={item?.title || 'clip'}
                  loading="lazy"
                  className={`w-full h-full object-contain group-hover:scale-105 transition-transform duration-300`}
                  onError={(e) => { (e.target as HTMLImageElement).src = '/api/placeholder/320/180'; }}
                />
              );
            })()}
          </div>
          {/* Menu Button */}
          <div ref={menuRef} className="absolute top-2.5 right-2.5 z-100">
            <button
              onClick={handleMenuClick}
              className="bg-[#252525] rounded-md flex items-center justify-center hover:bg-[#3a3a3a] transition-colors"
              style={{ width: '30px', height: '24px' }}
            >
            <SVGIcon src={threeDotIcon} className="w-full h-auto" />
            </button>

            {/* Menu Dropdown */}
            {showMenu && (
              <div className="absolute top-full right-0 mt-1 bg-[#252525] rounded-lg shadow-lg z-30 min-w-18">
                <button
                  onClick={handlePreviewClick}
                  className="w-full px-2 py-2 text-left text-white hover:bg-[#434343] transition-colors flex items-center gap-2"
                >
                  <Presentation size={14} />
                  Preview
                </button>
                {showDelete && (
                  <button
                    onClick={handleDeleteClick}
                    className="w-full px-2 py-2 text-left text-red-400 hover:bg-[#434343] transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
          {/* <div className="absolute top-3 right-3 z-10">
            <div
              className="cursor-pointer hover:opacity-80 transition-opacity"
              style={{ borderRadius: "5px" }}
              onClick={handleDropdownToggle}
            >
              <SVGIcon src={threeDotIcon} className="w-full h-auto" />
            </div>

            <ClipCardOptions
              showDropdown={showDropdown}
              setShowDropdown={setShowDropdown}
              dropdownRef={dropdownRef}
              activeTab={""}
              clip={item.type === 'clip' ? item.clipData : item as any}
              page={"highlightEditor"}
            lazyLoad={lazyLoad}
            />
          </div> */}

        {/* Content — same horizontal padding as thumbnail (inside padded wrapper) */}
        <div className="flex flex-col gap-2.5 pt-3 pb-2 min-h-0">
          {/* Title row: single line, consistent truncation */}
          <div className="flex items-center justify-between gap-2 min-h-[20px]">
            <Tooltip>
              <TooltipTrigger asChild>
                <h3 className="text-white font-semibold text-sm leading-snug truncate flex-1 min-w-0" title={item.title || ""}>
                  {item.title || "Untitled"}
                </h3>
              </TooltipTrigger>
              <TooltipContent side="top" align="start" className="max-w-[200px]">
                <p className="break-words">{item.title || "Untitled Clip"}</p>
              </TooltipContent>
            </Tooltip>
            {item.type === 'clip' && item?.rating != null && (
              <span className="flex items-center gap-0.5 shrink-0 text-amber-400">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5.47 1.32C5.66.84 6.34.84 6.53 1.32l1.15 2.85c.08.2.27.34.49.35l3.07.21c.51.04.72.67.33 1L9.2 7.72c-.17.14-.24.35-.19.55l.75 2.98c.13.5-.42.91-.87.66l-2.61-1.64a.5.5 0 0 0-.52 0L2.09 11.91c-.45.28-1-.15-.87-.66l.75-2.98a.55.55 0 0 0-.19-.55L.43 5.75c-.4-.33-.18-.96.33-1l3.07-.21c.22-.02.41-.15.49-.35L5.47 1.32Z" />
                </svg>
                <span className="text-xs font-medium tabular-nums">{item.rating}</span>
              </span>
            )}
          </div>

          {/* Date/time — muted, consistent */}
          {(item.date || item.time) && (
            <p className="text-gray-400 text-xs leading-none">
              {[item.date, item.time].filter(Boolean).join(" / ")}
            </p>
          )}

          {/* Timestamp — single pill, consistent */}
          {item.type === 'clip' && item.timestamp && (
            <span className="inline-flex w-fit rounded-md bg-[#252525] px-2 py-1 text-[11px] font-medium text-gray-300 tabular-nums">
              {item.timestamp}
            </span>
          )}

          {/* Tags — consistent chips, max 2 + count */}
          {item.type === 'clip' && item?.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center rounded-md border border-[#00BBFF]/60 bg-[#00BBFF]/10 px-2 py-0.5 text-[11px] font-medium text-[#00BBFF]"
                >
                  {tag}
                </span>
              ))}
              {item.tags.length > 2 && (
                <span className="inline-flex items-center rounded-md border border-[#333] bg-[#252525] px-2 py-0.5 text-[11px] font-medium text-gray-400">
                  +{item.tags.length - 2}
                </span>
              )}
            </div>
          )}



          {/* Rating */}
          {/* <div className="flex items-center gap-1">
            <span className="text-white text-xs font-bold">{clip.rating}</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.46973 1.32049C5.66167 0.842504 6.33833 0.842503 6.53027 1.32048L7.67669 4.17532C7.75843 4.37886 7.94946 4.51766 8.16831 4.5325L11.2377 4.74062C11.7516 4.77546 11.9607 5.419 11.5654 5.74925L9.20456 7.72175C9.03623 7.86239 8.96327 8.08696 9.01678 8.29968L9.76733 11.2831C9.893 11.7827 9.34557 12.1804 8.90934 11.9065L6.30383 10.2708C6.11807 10.1541 5.88193 10.1541 5.69617 10.2707L3.09066 11.9065C2.65443 12.1804 2.107 11.7827 2.23267 11.2831L2.98322 8.29968C3.03674 8.08696 2.96377 7.86239 2.79544 7.72175L0.434597 5.74925C0.0393227 5.41899 0.24842 4.77546 0.762323 4.74062L3.8317 4.5325C4.05054 4.51766 4.24157 4.37886 4.32331 4.17532L5.46973 1.32049Z"
                fill="white"
              />
            </svg>
          </div> */}
        </div>
        </div>
      </div>
      {selectedClipForPreview && (
        <PreviewModal
          isOpen={isPreviewModalOpen}
          onClose={handleClosePreviewModal}
          clipData={selectedClipForPreview}
          page={"highlightEditor"}
        />
      )}
    </div>
  );
};

interface EditorTimelineProps {
  clipsInfo: TimelineItem[];
  activeClipId: string;
  currentFolder: object;
  onClipReorder: (clipsInfo: TimelineItem[]) => void;
  onClipSelect: (clipId: string) => void;
  onClipDelete: (itemId: string) => void;
  canDelete?: boolean;
}

const EditorTimeline: React.FC<EditorTimelineProps> = ({
  clipsInfo,
  activeClipId,
  currentFolder,
  onClipReorder,
  onClipSelect,
  onClipDelete,
  canDelete = true,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = clipsInfo.findIndex((item) => item.id === active.id);
      const newIndex = clipsInfo.findIndex((item) => item.id === over?.id);

      const newClipsInfo = arrayMove(clipsInfo, oldIndex, newIndex);
      onClipReorder(newClipsInfo);
    }
  };

  return (
    <div className="relative">
      {/* Horizontal scrolling container */}
      <div className="overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={clipsInfo.map((item) => item.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex gap-6 min-w-max px-2 py-1">
              {clipsInfo.map((item) => (
                <SortableClipCard
                  key={item.id}
                  item={item}
                  isActive={item.id === activeClipId}
                  onClick={() => onClipSelect(item.id)}
                  onDelete={onClipDelete}
                  folderAspectRatio={(currentFolder as any)?.aspectRatio}
                  showDelete={canDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Scroll indicator */}
      {/* <div className="flex justify-center mt-4">
        <div className="w-64 h-0.5 bg-[#252525] rounded-full relative">
          <div className="w-16 h-0.5 bg-gray-400 rounded-full absolute left-0"></div>
        </div>
      </div>*/}
    </div>
  );
};

export default EditorTimeline;
export type { TimelineItem, BumperData, ClipItemData };
