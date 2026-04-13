import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface RatingOption {
  id: string;
  label: string;
  value?: number;
}

interface RatingSectionProps {
  selectedRatings: string[];
  onRatingChange: (ratingId: string, checked: boolean) => void;
  ratingOptions?: RatingOption[];
  counts?: Record<string, number>;
  page?: string;
  activeTab?: string;
  onReset?: () => void;
}

const defaultRatingOptions: RatingOption[] = [
  // { id: "all", label: "All" },
  { id: "5", label: "5 Stars", value: 5 },
  { id: "4", label: "4 Stars", value: 4 },
  { id: "3", label: "3 Stars", value: 3 },
  { id: "2", label: "2 Stars", value: 2 },
  { id: "1", label: "1 Star", value: 1 },
];

export const RatingSection: React.FC<RatingSectionProps> = ({
  selectedRatings,
  onRatingChange,
  ratingOptions = defaultRatingOptions,
  counts = {},
  page,
  activeTab,
  onReset,
}) => {
  const showCounts = page === "clips" && activeTab === "clips";
  const renderStars = (count: number) => {
    return Array.from({ length: count }, (_, index) => (
      <svg
        key={index}
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="inline"
      >
        <path
          d="M5.46973 1.32049C5.66167 0.842504 6.33833 0.842503 6.53027 1.32048L7.67669 4.17532C7.75843 4.37886 7.94946 4.51766 8.16831 4.5325L11.2377 4.74062C11.7516 4.77546 11.9607 5.419 11.5654 5.74925L9.20456 7.72175C9.03623 7.86239 8.96327 8.08696 9.01678 8.29968L9.76733 11.2831C9.893 11.7827 9.34557 12.1804 8.90934 11.9065L6.30383 10.2708C6.11807 10.1541 5.88193 10.1541 5.69617 10.2707L3.09066 11.9065C2.65443 12.1804 2.107 11.7827 2.23267 11.2831L2.98322 8.29968C3.03674 8.08696 2.96377 7.86239 2.79544 7.72175L0.434597 5.74925C0.0393227 5.41899 0.24842 4.77546 0.762323 4.74062L3.8317 4.5325C4.05054 4.51766 4.24157 4.37886 4.32331 4.17532L5.46973 1.32049Z"
          fill="#FFF"
        />
      </svg>
    ));
  };

  // Separate All option from star ratings
  // const allOption = ratingOptions.find((r) => r.id === "all");
  const starOptions = ratingOptions.filter((r) => r.id !== "all");

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-white">Rating</h3>
        {selectedRatings.length > 0 && onReset && (
          <button
            onClick={onReset}
            className="text-xs text-[#00BBFF] font-medium hover:opacity-80 transition-opacity">
            Reset
          </button>
        )}
      </div>

      {/* All option - full width card */}
      {/* {allOption && (
        <div
          className={`flex items-center justify-between h-11 rounded-xl border-2 cursor-pointer transition-colors px-3 mb-3 ${
            selectedRatings.includes("all")
              ? "border-white bg-[#252525]"
              : "border-[#252525] hover:border-gray-600"
          }`}
          onClick={() => onRatingChange("all", !selectedRatings.includes("all"))}
        >
          <div className="flex items-center gap-3">
            <Checkbox
              id={allOption.id}
              checked={selectedRatings.includes("all")}
              onCheckedChange={(checked: boolean) => onRatingChange("all", checked)}
              className="border-2 border-white data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-[#00BBFF] data-[state=checked]:to-[#0051FF] data-[state=checked]:border-[#00BBFF] rounded-md"
            />
            <Label htmlFor={allOption.id} className="text-sm font-medium text-white cursor-pointer">
              All
            </Label>
          </div>
        </div>
      )} */}

      {/* Star ratings grid */}
      <div className="grid grid-cols-2 gap-3">
        {starOptions.map((rating) => {
          const isSelected = selectedRatings.includes(rating.id);
          return (
            <div
              key={rating.id}
              // className={`flex items-center justify-between h-11 rounded-xl border-2 cursor-pointer transition-colors px-3 ${
              //   isSelected ? "border-white bg-[#252525]" : "border-[#252525] hover:border-gray-600"
              // }`}
              onClick={() => onRatingChange(rating.id, !isSelected)}
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  id={rating.id}
                  checked={isSelected}
                  onCheckedChange={(checked: boolean) => onRatingChange(rating.id, checked)}
                  className="border-2 border-white data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-[#00BBFF] data-[state=checked]:to-[#0051FF] data-[state=checked]:border-[#00BBFF] rounded-md"
                />
                <Label htmlFor={rating.id} className="text-sm font-medium text-white cursor-pointer flex items-center gap-2">
                  <div className="flex gap-0.5">{renderStars(rating.value || 0)}</div>
                </Label>
                {showCounts && (
                  <span className="text-xs text-gray-400">{counts[rating.id] ?? 0}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default RatingSection;
