import React, { useEffect, useState, useRef } from "react";
import { Edit, Presentation, Save, SaveAll, Trash2, Timer } from "lucide-react";
import moment from "moment";
import SVGIcon from "@/components/common/SVGIcon";
import threeDotIcon from "../../assets/svg/3dotIcon.svg";
import PreviewModal from "@/components/modals/PreviewModal";


interface EntityCardProps {
  type: "bumper" | "overlay" | "graphic";
  id: string;
  title: string;
  date: string;
  thumbnail?: string;
  fileFormat: "MP4" | "JPG" | "PNG" | "GIF";
  duration?: string | number;
  aspectRatio?: string;
  backgroundColor?: string;
  logo?: React.ReactNode;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onClick?: (id: string) => void;
  onPlusClick?: (id: string) => void;
  showCheckbox?: boolean;
  showPlusIcon?: boolean;
  tab: "bumper" | "overlay" | "bumper";
  onDelete?: (id: string) => void;
  delay?: number;
  allowMinusForBumper?: boolean;
  showClipActions?: boolean;
  onSaveAsClip?: () => void;
  onOverwriteClip?: () => void;
  onDelayTimeClick?: (id: string) => void;

}

const EntityCard: React.FC<EntityCardProps> = ({
  type,
  id,
  title,
  date,
  thumbnail,
  fileFormat,
  duration,
  backgroundColor = "#D9D9D9",
  logo,
  isSelected = false,
  onSelect,
  onClick,
  onPlusClick,
  showCheckbox = false,
  showPlusIcon = false,
  aspectRatio,
  tab,
  onDelete,
  delay,
  allowMinusForBumper = false,
  showClipActions = false,
  onSaveAsClip,
  onOverwriteClip,
  onDelayTimeClick,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const handleCardClick = () => {
    if (onPlusClick) {
      onPlusClick(id);
    } else if (onClick) {
      onClick(id);
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onDelete) {
      onDelete(id);
    }
  };

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    const clipData = {
      id,
      title,
      timeRange: '',
      fileFormat: fileFormat,
      duration: typeof duration === 'number' ? String(duration) : "",
      aspectRatio: aspectRatio || '',
      rating: 0,
      poster: thumbnail,
      videoUrl: type === 'bumper' ? thumbnail : '',
      type,
    };
    setPreviewData(clipData);
    setIsPreviewOpen(true);
  };

  const handlePlusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlusClick) {
      onPlusClick(id);
    }
  };

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

  return (
    <>
      <div
        className={`w-60 cursor-pointer transition-transform hover:scale-105 relative ${showMenu ? 'z-50' : 'z-0'}`}
        onClick={handleCardClick}
      >
        <div ref={menuRef} className="absolute top-2.5 right-2.5 z-10">
          <button
            onClick={handleMenuClick}
            className="bg-[#252525] rounded-md flex items-center justify-center hover:bg-[#3a3a3a] transition-colors"
            style={{ width: '30px', height: '24px' }}
          >
            <SVGIcon src={threeDotIcon} className="w-full h-auto" />
          </button>
          {showMenu && (
            <div className="absolute top-full right-0 mt-1 bg-[#252525] rounded-lg shadow-lg z-50 min-w-[160px]">
              {/* {type === 'overlay' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    if (onDelayTimeClick) onDelayTimeClick(id);
                  }}
                  className="w-full px-4 py-2 text-left text-white hover:bg-[#434343] transition-colors flex items-center gap-2"
                >
                  <Timer size={14} />
                  Delay time
                </button>
              )} */}
              {type !== 'overlay' && (
                <button
                  onClick={handlePreviewClick}
                  className="w-full px-4 py-2 text-left text-white hover:bg-[#434343] transition-colors flex items-center gap-2"
                >
                  <Presentation size={14} />
                  Preview
                </button>
              )}
              {showClipActions && (
                <>
                  <button
                    onClick={onSaveAsClip}
                    className="w-full px-4 py-2 text-left text-white hover:bg-[#434343] transition-colors flex items-center gap-2"
                  >
                    <Save size={14} />
                    Save as a clip
                  </button>
                  <button
                    onClick={onOverwriteClip}
                    className="w-full px-4 py-2 text-left text-white hover:bg-[#434343] transition-colors flex items-center gap-2"
                  >
                    <SaveAll size={14} />
                    Overwrite clip
                  </button>
                </>
              )}
              {onDelete && (
                <button
                  onClick={handleDeleteClick}
                  className="w-full px-4 py-2 text-left text-red-400 hover:bg-[#434343] transition-colors flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
        {/* Thumbnail Area */}
        <div
          className="w-full rounded-xl relative overflow-hidden"
          style={{
            height: '140px',
            backgroundColor: thumbnail ? "transparent" : backgroundColor,
            border: backgroundColor === "#FFF" ? "none" : "1.5px solid #252525"
          }}
        >
          {/* Background/Thumbnail */}
          {thumbnail ? (
            <>
              {type === "graphic" && (
                <img
                  src={thumbnail}
                  alt={title}
                  className="w-full h-full"
                />
              )}
              {(type === "bumper" || type === "overlay") && (
                <video
                  src={thumbnail}
                  className="w-full h-full"
                  autoPlay
                  muted
                  loop
                />
              )}
            </>
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor }}
            >
              {logo && (
                <div className="flex items-center justify-center">
                  {logo}
                </div>
              )}
            </div>
          )}

          {/* Checkbox */}
          {/* {showCheckbox && (
          <div
            className="absolute top-3 left-3 w-6 h-6 rounded-md border-2 border-white bg-[#18191B] flex items-center justify-center cursor-pointer"
            onClick={handleCheckboxClick}
          >
            {isSelected && (
              <svg width="12" height="9" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 4.5L4.5 8L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        )} */}

          {/* Menu Button moved to wrapper */}

          {/* Right-bottom badge: delay for overlay if present, else file format */}
          <div className="absolute bottom-2.5 right-2.5">
            {type === 'overlay' && typeof delay === 'number' && !Number.isNaN(delay) ? (
              <div className="bg-[#252525] rounded-md px-2 py-1" style={{ height: '24px', display: 'flex', alignItems: 'center' }} title={`${delay}'s delay`}>
                <span className="text-white text-xs font-medium">{`${delay}s`}</span>
              </div>
            ) : (
              fileFormat && (
                <div className="bg-[#252525] rounded-md px-2 py-1" style={{ height: '24px', display: 'flex', alignItems: 'center' }}>
                  <span className="text-white text-xs font-medium">{fileFormat}</span>
                </div>
              )
            )}
          </div>

          {/* Duration and Aspect Ratio Badges */}
          <div className="absolute top-2.5 left-2.5 flex gap-2">
            {aspectRatio && (
              <div className="bg-[#252525] rounded-md px-2 py-1" style={{ height: '24px', display: 'flex', alignItems: 'center' }}>
                <span className="text-white text-xs font-medium">{aspectRatio}</span>
              </div>
            )}
          </div>
          <div className="absolute bottom-2.5 left-2.5 flex gap-2">
            {duration !== undefined && duration !== null && (
              <div className="bg-[#252525] rounded-md px-2 py-1 text-white" style={{ height: '24px', display: 'flex', alignItems: 'center' }}>
                {duration ? moment.utc(Number(duration) * 1000).format("mm:ss") : "00:00"}
              </div>
            )}
          </div>

          {/* Hover Overlay with Plus/Minus Icon */}
          {showPlusIcon && (
            <div className={`absolute inset-0 bg-black bg-opacity-50 ${type === 'bumper'
              ? 'opacity-0 hover:opacity-100'
              : isSelected
                ? 'opacity-100'
                : 'opacity-0 hover:opacity-100'
              } transition-opacity duration-300 flex items-center justify-center pointer-events-none`}>
              <div
                className="w-12 h-12 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] rounded-lg flex items-center justify-center cursor-pointer pointer-events-auto"
                onClick={handlePlusClick}
              >
                {type === 'bumper' ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {allowMinusForBumper && isSelected ? (
                      <path d="M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    ) : (
                      <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                  </svg>
                ) : isSelected ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Card Info */}
        <div className="mt-4">
          <h3 className="text-white text-base font-bold leading-relaxed mb-1">
            {title}
          </h3>
          <p className="text-white text-sm font-medium leading-relaxed">
            {date}
            {/* {delay && (
            <span className="bg-[#252525] rounded-md px-2 py-1 h-6 items-center text-white text-xs font-medium">
              {delay}
            </span>
          )} */}
          </p>
        </div>
      </div>
      {isPreviewOpen && previewData && (
        <PreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          clipData={previewData}
          page={type === 'graphic' ? 'graphic' : 'bumper'}
        />
      )}
    </>
  );
};

export default EntityCard;
