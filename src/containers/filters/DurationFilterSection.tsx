import { Timer } from "lucide-react";
import React from "react";

interface Duration {
  id: string;
  label: string;
  duration: string;
}

interface DurationFilterSectionProps {
  selectedDuration: string;
  onDurationChange: (durationId: string) => void;
  durations?: Duration[];
  onReset?: () => void;
}

const defaultDurations: Duration[] = [
  //   { id: "all", label: "All", duration: "all" },
  { id: "180", label: "3 min", duration: "180" },
  { id: "300", label: "5 min", duration: "300" },
  { id: "420", label: "7 min", duration: "420" },
  { id: "600", label: "10 min", duration: "600" },
];

export const DurationFilterSection: React.FC<DurationFilterSectionProps> = ({
  selectedDuration,
  onDurationChange,
  durations = defaultDurations,
  onReset,
}) => {
  const renderDurationIcon = () => {
    return (
      <div className="w-4 h-4 bg-gradient-to-br from-[#00BBFF] to-[#0051FF] rounded-full flex-shrink-0"></div>
    );
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-white">Duration</h3>
        {selectedDuration && onReset && (
          <button
            onClick={onReset}
            className="text-xs text-[#00BBFF] font-medium hover:opacity-80 transition-opacity">
            Reset
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {durations.map((duration) => (
          <div
            key={duration.id}
            className={`flex items-center justify-center gap-2 h-11 rounded-xl border-2 cursor-pointer transition-colors ${selectedDuration === duration.id
                ? "border-white bg-[#252525]"
                : "border-[#252525] hover:border-gray-600"
              }`}
            onClick={() => onDurationChange(selectedDuration === duration.id ? "" : duration.id)}
          >
            {/* {renderDurationIcon()}  */}
            <Timer className="w-4 h-4" />
            <span className="text-sm font-medium text-white">
              {duration.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
export default DurationFilterSection;