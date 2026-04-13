import React, { useEffect, useRef } from "react";
import { X, ImageIcon, Video } from "lucide-react";

export interface AssetPreviewItem {
  id: string;
  title: string;
  mediaType: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  ratio?: string;
}

const GRADIENT_BG = "linear-gradient(135deg, #00EEFF 0%, #0051FF 100%)";

interface AssetPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: AssetPreviewItem | null;
}

const AssetPreviewModal: React.FC<AssetPreviewModalProps> = ({ isOpen, onClose, asset }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !asset) return;
    if (videoRef.current && (asset.mediaType === "Bumper" || asset.mediaType === "Overlay")) {
      videoRef.current.play().catch(() => {});
    }
  }, [isOpen, asset?.id]);

  if (!isOpen || !asset) return null;

  const isVideo = asset.mediaType === "Bumper" || asset.mediaType === "Overlay";
  const subtitle = isVideo ? "Preview video overlay or bumper." : "Preview image or graphic.";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-[900px] max-h-[90vh] flex flex-col rounded-2xl overflow-hidden border border-[#252525] bg-[#18191B] shadow-2xl p-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — same as Add video feed: icon + title + subtitle + close */}
        <div className="relative shrink-0 px-6 py-4 border-b border-[#252525]">
          <div className="absolute inset-0 opacity-5 rounded-t-2xl" style={{ background: GRADIENT_BG }} />
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: GRADIENT_BG }}>
              {isVideo ? <Video className="w-5 h-5 text-white" /> : <ImageIcon className="w-5 h-5 text-white" />}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-white leading-snug mt-2.5 mb-0 truncate">
                {asset.title || "Asset preview"}
              </h2>
              <p className="text-xs text-gray-400 mt-0">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#252525] transition-all shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content — preview area */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex items-center justify-center min-h-0 bg-[#111113]">
          <div className="w-full max-w-3xl aspect-video rounded-lg overflow-hidden bg-[#0C0C0E] border border-[#252525]">
            {isVideo && asset.videoUrl ? (
              <video
                ref={videoRef}
                src={asset.videoUrl}
                poster={asset.thumbnailUrl}
                className="w-full h-full object-contain"
                controls
                autoPlay
                playsInline
              />
            ) : (
              <img
                src={asset.thumbnailUrl || asset.videoUrl || ""}
                alt={asset.title}
                className="w-full h-full object-contain"
              />
            )}
          </div>
        </div>

        {/* Footer — same style as Add video feed (Cancel / Continue) */}
        <div className="shrink-0 px-6 py-4 border-t border-[#252525] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: GRADIENT_BG }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssetPreviewModal;
