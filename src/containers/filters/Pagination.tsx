import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
  onChangePage?: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
  className = "",
  onChangePage,
}) => {
  const prevDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages || totalPages <= 0;
  const handlePrev = React.useCallback(() => { if (!prevDisabled) onPrevious(); }, [prevDisabled, onPrevious]);
  const handleNext = React.useCallback(() => { if (!nextDisabled) onNext(); }, [nextDisabled, onNext]);

  const windowSize = 5;
  let start = Math.max(1, currentPage - Math.floor(windowSize / 2));
  let end = Math.min(totalPages, start + windowSize - 1);
  if (end - start + 1 < windowSize) start = Math.max(1, end - windowSize + 1);
  const pages: number[] = [];
  for (let p = start; p <= end; p++) pages.push(p);
  const showLeftEllipsis = start > 1;
  const showRightEllipsis = end < totalPages;
  const goto = (p: number) => { if (onChangePage) onChangePage(p); };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Previous Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handlePrev}
        className="w-10 h-10 border border-[#252525] rounded-lg hover:bg-[#252525]"
        disabled={prevDisabled}
        // disabled={true}
      >
        <ChevronLeft className="w-4 h-4 text-white" />
      </Button>

      {/* Page rail */}
      <div className="flex items-center gap-1 bg-[#1F2023] border border-[#2a2a2a] rounded-2xl px-2 py-1">
        {showLeftEllipsis && (
          <div className="w-10 h-10 rounded-lg bg-transparent flex items-center justify-center text-white/70 text-sm">…</div>
        )}
        {pages.map((p) => (
          <Button
            key={p}
            variant="ghost"
            size="sm"
            onClick={() => {
              // const now = Date.now();
              // if (now - lastClickRef.current < 350) return;
              // lastClickRef.current = now;
              goto(p);
            }}
            className={`w-10 h-9 rounded-lg ${p === currentPage ? 'bg-[#3A3B3E] text-white' : 'bg-transparent hover:bg-[#252525] text-white'}`}
          >
            <span className="text-sm">{p}</span>
          </Button>
        ))}
        {showRightEllipsis && (
          <div className="w-10 h-10 rounded-lg bg-transparent flex items-center justify-center text-white/70 text-sm">…</div>
        )}
      </div>

      {/* Next Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleNext}
        className="w-10 h-10 border border-[#252525] rounded-lg hover:bg-[#252525]"
        disabled={nextDisabled}
        // disabled={true}
      >
        <ChevronRight className="w-4 h-4 text-white" />
      </Button>
    </div>
  );
};

export default Pagination;
