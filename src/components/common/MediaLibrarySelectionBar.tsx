import React from "react";
import { X, PlaySquare, Eye } from "lucide-react";

interface MediaLibrarySelectionBarProps {
    selectedCount: number;
    totalDurationLabel?: string;
    onPreview: () => void;
    onGenerateClip: () => void;
    onClear: () => void;
}

const MediaLibrarySelectionBar: React.FC<MediaLibrarySelectionBarProps> = ({
    selectedCount,
    totalDurationLabel,
    onPreview,
    onGenerateClip,
    onClear,
}) => {
    if (selectedCount === 0) return null;

    return (
        <div
            className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-2xl border border-[#252525] bg-[#111113]/90 px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all"
            style={{ animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both" }}
        >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00EEFF]/10 text-[#00EEFF]">
                <span className="text-lg font-bold">{selectedCount}</span>
            </div>

            <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">Item{selectedCount !== 1 ? "s" : ""} selected</span>
                <span className="text-xs text-gray-400">
                    {totalDurationLabel ? `Total duration: ${totalDurationLabel}` : "Ready for generation"}
                </span>
            </div>

            <div className="ml-4 h-8 w-px bg-[#252525]" />

            <div className="flex items-center gap-2 pl-2 min-w-0">
                <button
                    className="flex h-10 items-center gap-2 rounded-xl border border-[#252525] bg-[#1A1B1D] px-4 text-sm font-medium text-gray-300 transition-colors hover:bg-[#252525] hover:text-white shrink-0"
                    onClick={onPreview}
                >
                    <Eye className="h-4 w-4 shrink-0" />
                    Preview
                </button>
                <button
                    type="button"
                    className="flex h-10 items-center justify-center gap-2 rounded-xl px-3 min-[480px]:px-5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(0,238,255,0.2)] transition-transform hover:scale-[1.02] active:scale-[0.98] min-w-0 shrink"
                    style={{ background: "linear-gradient(135deg, #00EEFF, #0051FF)" }}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onGenerateClip(); }}
                    title="Generate clip"
                >
                    <PlaySquare className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="hidden min-[480px]:inline whitespace-nowrap">Generate Clip</span>
                    <span className="min-[480px]:hidden whitespace-nowrap">Generate</span>
                </button>
            </div>

            <div className="ml-2 pl-2">
                <button
                    onClick={onClear}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-[#252525] hover:text-white transition-colors"
                    title="Clear selection"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, 20px) scale(0.95); }
          to { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
      `}</style>
        </div>
    );
};

export default MediaLibrarySelectionBar;
