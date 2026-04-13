import React, { useRef, useEffect } from "react";
import { toast } from "sonner";
import { Download, Share2, Edit, Trash2, EyeIcon, VideoOff } from "lucide-react";

interface VideoCardOptionsProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onExport: () => void;
  onViewDetails: () => void;
  onActivityLogs: () => void;
  onDelete: () => void;
  onEndStream?: () => void;
  isLive?: boolean;
  streamStatus?: number;
  canEdit?: boolean;
  canDelete?: boolean;
}

const VideoCardOptions: React.FC<VideoCardOptionsProps> = ({
  isOpen,
  onClose,
  onEdit,
  onExport,
  onViewDetails,
  onActivityLogs,
  onDelete,
  onEndStream,
  isLive,
  streamStatus,
  canEdit = true,
  canDelete = true,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const isStreamLive = (streamStatus === 3) || !!isLive;

  return (
       <div className="absolute z-[1000] top-10 right-0 bg-[#252525] border border-[#2A2A2A] rounded-lg py-2 shadow-xl min-w-[160px] calendar-scroll" ref={dropdownRef}>
       {isStreamLive && onEndStream && canEdit && (
        <button
        className="w-full px-4 py-2 text-left text-white hover:bg-[#434343] transition-colors flex items-center gap-2"
        onClick={onEndStream}
      >
        <VideoOff size={14} />
        End stream
      </button>)}
      {canEdit && (
      <button
        className="w-full px-4 py-2 text-left text-white hover:bg-[#434343] transition-colors flex items-center gap-2"
        onClick={onEdit}
      >
        <Edit size={14} />
        Edit stream
      </button>
      )}
      <button
        className="w-full px-4 py-2 text-left text-white hover:bg-[#434343] transition-colors flex items-center gap-2"
        onClick={onExport}
      >
        <Download size={14} />
        Export JSON
      </button>
      <button
        className="w-full px-4 py-2 text-left text-white hover:bg-[#434343] transition-colors flex items-center gap-2"
        onClick={onViewDetails}
      >
        <EyeIcon size={14} />
        Views details
      </button>
      <button
        className="w-full px-4 py-2 text-left text-white hover:bg-[#434343] transition-colors flex items-center gap-2"
        onClick={onActivityLogs}
      >
        <Share2 size={14} />
        Activity logs
      </button>
      {canDelete && (
        <>
      <hr className="border-[#2A2A2A] my-1" />
      <button
        className="w-full px-4 py-2 text-left text-red-400 hover:bg-[#434343] transition-colors flex items-center gap-2"
        onClick={() => {
          if (isStreamLive) {
            toast.info('Live/Processing stream must be ended before deleting. Please end the stream using the End stream option and try again.');
            return;
          }
          onDelete();
        }}
      >
        <Trash2 size={14} />
        Delete
      </button>
        </>
      )}
    </div>
  );
};

export default VideoCardOptions;
