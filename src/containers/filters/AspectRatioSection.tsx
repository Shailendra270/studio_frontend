import React from "react";

interface AspectRatio {
  id: string;
  label: string;
  dimensions: string;
}

interface AspectRatioSectionProps {
  selectedAspectRatios: string[];
  onAspectRatioChange: (aspectRatioId: string, checked: boolean) => void;
  aspectRatios?: AspectRatio[];
  counts?: Record<string, number>;
  page?: string;
  activeTab?: string;
  // onReset?: () => void;
}

const defaultAspectRatios: AspectRatio[] = [
  // { id: "all", label: "All", dimensions: "16:9" },
  { id: "16:9", label: "16 : 9", dimensions: "16:9" },
  { id: "9:16", label: "9 : 16", dimensions: "9:16" },
  { id: "9:18", label: "9 : 18", dimensions: "9:18" },
  { id: "3:4", label: "3 : 4", dimensions: "3:4" },
  { id: "1:1", label: "1 : 1", dimensions: "1:1" },
  { id: "4:3", label: "4 : 3", dimensions: "4:3" },
  { id: "4:5", label: "4 : 5", dimensions: "4:5" },
];

export const AspectRatioSection: React.FC<AspectRatioSectionProps> = ({
  selectedAspectRatios,
  onAspectRatioChange,
  aspectRatios = defaultAspectRatios,
  counts = {},
  page,
  activeTab,
  // onReset,
}) => {
  // Whitelist/sort order
  const order = ["all", "16:9", "9:16", "9:18", "4:5", "4:3", "3:4", "1:1"];
  const orderedAspectRatios = [...aspectRatios].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  const showCounts = page === "clips" && activeTab === "clips";
  const renderAspectRatioIcon = (dimensions: string) => {
    const [width, height] = dimensions.split(":").map(Number);
    const isVertical = height > width;
    const isSquare = height === width;

    if (isSquare) {
      return (
        <div className="w-5 h-5 bg-gradient-to-br from-[#00BBFF] to-[#0051FF] rounded-sm flex-shrink-0"></div>
      );
    }

    return (
      <div
        className={`bg-gradient-to-br from-[#00BBFF] to-[#0051FF] rounded-sm flex-shrink-0 ${isVertical ? "w-3 h-5" : "w-5 h-3"
          }`}
      ></div>
    );
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-white">Aspect ratio</h3>
        {/* {selectedAspectRatios.length > 0 && selectedAspectRatios[0] !== '16:9' && onReset && (
          <button
            onClick={onReset}
            className="text-xs text-[#00BBFF] font-medium hover:opacity-80 transition-opacity"          >
            Reset
          </button>
        )} */}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {orderedAspectRatios.map((ratio) => (
          <div
            key={ratio.id}
            className={`flex items-center justify-between h-11 rounded-xl border-2 cursor-pointer transition-colors px-3 ${selectedAspectRatios.includes(ratio.id) ||
                (ratio.id === "all" && selectedAspectRatios.includes("all"))
                ? "border-white bg-[#252525]"
                : "border-[#252525] hover:border-gray-600"
              }`}
            onClick={() =>
              onAspectRatioChange(
                ratio.id,
                !selectedAspectRatios.includes(ratio.id),
              )
            }
          >
            {/* <div className="flex items-center gap-2"> */}
            {ratio.id !== "all" && renderAspectRatioIcon(ratio.dimensions)}
            <span className="text-sm font-medium text-white">
              {ratio.label}
            </span>
            {/* </div> */}
            {showCounts && (
              <span className="text-xs text-gray-400">{counts[ratio.id] ?? 0}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
export default AspectRatioSection;
