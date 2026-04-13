import React from "react";
import { LayoutGrid, List, Columns } from "lucide-react";

export type ViewMode = "grid" | "list" | "compact";

interface ViewToggleProps {
    view: ViewMode;
    onViewChange: (view: ViewMode) => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ view, onViewChange }) => {
    return (
        <div className="flex items-center rounded-lg border border-[#252525] bg-[#1A1B1D] p-1 shadow-sm">
            <button
                type="button"
                onClick={() => onViewChange("grid")}
                className={`flex h-7 items-center justify-center rounded-md px-2.5 transition-all duration-200 ${view === "grid"
                        ? "text-white shadow-[0_0_10px_rgba(0,238,255,0.15)]"
                        : "text-gray-500 hover:text-gray-300 hover:bg-[#252525]"
                    }`}
                style={view === "grid" ? { background: "linear-gradient(135deg, #00EEFF, #0051FF)" } : {}}
                title="Grid view"
            >
                <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
                type="button"
                onClick={() => onViewChange("list")}
                className={`flex h-7 items-center justify-center rounded-md px-2.5 transition-all duration-200 ${view === "list"
                        ? "text-white shadow-[0_0_10px_rgba(0,238,255,0.15)]"
                        : "text-gray-500 hover:text-gray-300 hover:bg-[#252525]"
                    }`}
                style={view === "list" ? { background: "linear-gradient(135deg, #00EEFF, #0051FF)" } : {}}
                title="List view"
            >
                <List className="h-3.5 w-3.5" />
            </button>
            <button
                type="button"
                onClick={() => onViewChange("compact")}
                className={`flex h-7 items-center justify-center rounded-md px-2.5 transition-all duration-200 ${view === "compact"
                        ? "text-white shadow-[0_0_10px_rgba(0,238,255,0.15)]"
                        : "text-gray-500 hover:text-gray-300 hover:bg-[#252525]"
                    }`}
                style={view === "compact" ? { background: "linear-gradient(135deg, #00EEFF, #0051FF)" } : {}}
                title="Compact view"
            >
                <Columns className="h-3.5 w-3.5" />
            </button>
        </div>
    );
};

export default ViewToggle;
