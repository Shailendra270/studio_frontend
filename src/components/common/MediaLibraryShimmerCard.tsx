import React from "react";

/**
 * Shimmer card for Media Library loading state.
 * Uses the same blue gradient as user-management (linear-gradient 135deg #00EEFF → #0051FF)
 * with a horizontal moving shimmer over grey placeholders.
 */
const MediaLibraryShimmerCard: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  return (
    <div
      className="overflow-hidden rounded-xl border border-[#252525] bg-[#1A1B1D] flex flex-col"
      style={style}
    >
      {/* Thumbnail area: dark grey + blue gradient shimmer */}
      <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-[#1A1B1D]">
        {/* Blue gradient shimmer sweep (same as user-management / blog) */}
        <div
          className="absolute inset-0 bg-[length:200%_100%] animate-shimmer opacity-70"
          style={{
            backgroundImage: "linear-gradient(90deg, #1A1B1D 0%, #252530 20%, rgba(0, 238, 255, 0.12) 40%, rgba(0, 81, 255, 0.2) 50%, rgba(0, 238, 255, 0.12) 60%, #252530 80%, #1A1B1D 100%)",
          }}
        />
        {/* Placeholder overlays */}
        <div className="absolute top-2 right-2 flex gap-1">
          <span className="h-5 w-8 rounded bg-[#252525]" />
          <span className="h-5 w-10 rounded bg-[#252525]" />
        </div>
        <div className="absolute bottom-2 left-2 h-5 w-16 rounded bg-[#252525]" />
        <div className="absolute bottom-2 right-2 h-5 w-10 rounded bg-[#252525]" />
      </div>
      {/* Content area */}
      <div className="flex flex-1 flex-col p-3.5">
        <div className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-sm bg-[#252525]" />
          <span className="h-4 w-3/4 max-w-[180px] rounded bg-[#252525]" />
        </div>
        <span className="mt-2 h-3 w-1/2 max-w-[140px] rounded bg-[#252525]" />
        <div className="mt-2.5 flex gap-2">
          <span className="h-3 w-12 rounded bg-[#252525]" />
          <span className="h-3 w-16 rounded bg-[#252525]" />
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="h-5 w-14 rounded-full bg-[#252525]" />
          <span className="h-5 w-16 rounded-full bg-[#252525]" />
          <span className="h-5 w-12 rounded-full bg-[#252525]" />
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-[#252525] pt-3">
          <span className="h-3.5 w-10 rounded bg-[#252525]" />
          <span className="h-3.5 w-8 rounded bg-[#252525]" />
        </div>
      </div>
    </div>
  );
};

export default MediaLibraryShimmerCard;
