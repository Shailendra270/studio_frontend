import React from "react";
import { LayoutGrid, PlaySquare, MonitorPlay, Image as ImageIcon, Check } from "lucide-react";

export type CollectionTab =
    | "all"
    | "clips"
    | "highlights"
    | "streams"
    | "assets"
    | "images";

interface CollectionTabsProps {
    activeTab: CollectionTab;
    onTabChange: (tab: CollectionTab) => void;
    counts?: Partial<Record<CollectionTab, number>>;
}

const TABS: { id: CollectionTab; label: string; icon: React.ReactNode }[] = [
    { id: "all", label: "All Media", icon: <LayoutGrid className="h-4 w-4" /> },
    { id: "clips", label: "Clips", icon: <PlaySquare className="h-4 w-4" /> },
    { id: "highlights", label: "Highlights", icon: <Check className="h-4 w-4" /> },
    { id: "streams", label: "Match Streams", icon: <MonitorPlay className="h-4 w-4" /> },
    { id: "assets", label: "Assets", icon: <ImageIcon className="h-4 w-4" /> },
    { id: "images", label: "Images", icon: <ImageIcon className="h-4 w-4" /> },
];

const CollectionTabs: React.FC<CollectionTabsProps> = ({
    activeTab,
    onTabChange,
    counts = {},
}) => {
    return (
        <div className="flex items-center gap-6 px-6 border-b border-[#252525] bg-[#111113]/95 backdrop-blur-md">
            {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                const count = counts[tab.id] || 0;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`relative flex items-center gap-2 pb-3 pt-4 text-sm font-medium transition-colors ${isActive ? "text-white" : "text-gray-500 hover:text-gray-300"
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                        <span className="ml-1 rounded-full bg-[#252525] px-2 py-0.5 text-[10px] text-gray-400">
                            {count}
                        </span>
                        {isActive && (
                            <span
                                className="absolute bottom-0 left-0 h-[2px] w-full rounded-t-full"
                                style={{ background: "linear-gradient(90deg, #00EEFF, #0051FF)" }}
                            />
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default CollectionTabs;
