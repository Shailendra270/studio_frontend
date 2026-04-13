import React from "react";
import { Film, Clock, Star, Loader2 } from "lucide-react";

interface MediaLibraryStatsProps {
    totalItems: number;
    totalDuration: string;
    avgRating: number;
    processingCount: number;
}

const StatCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string | number;
    accentColor?: string;
    pulse?: boolean;
}> = ({ icon, label, value, accentColor = "#1E90FF", pulse }) => (
    <div className="flex items-center gap-3 rounded-xl border border-[#252525] bg-[#111113] px-5 py-4 transition-all duration-300 hover:border-[#333] hover:bg-[#1A1B1D]">
        <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${pulse ? "animate-pulse" : ""}`}
            style={{ backgroundColor: `${accentColor}15` }}
        >
            <span style={{ color: accentColor }}>{icon}</span>
        </div>
        <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5">
                {label}
            </p>
            <p className="text-xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const MediaLibraryStats: React.FC<MediaLibraryStatsProps> = ({
    totalItems,
    totalDuration,
    avgRating,
    processingCount,
}) => {
    return (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
                icon={<Film className="h-5 w-5" />}
                label="Total Items"
                value={totalItems.toLocaleString()}
                accentColor="#00EEFF"
            />
            <StatCard
                icon={<Clock className="h-5 w-5" />}
                label="Total Duration"
                value={totalDuration}
                accentColor="#00BBFF"
            />
            <StatCard
                icon={<Star className="h-5 w-5" />}
                label="Avg Rating"
                value={avgRating > 0 ? `${avgRating.toFixed(1)} ★` : "—"}
                accentColor="#FFB800"
            />
            <StatCard
                icon={<Loader2 className="h-5 w-5" />}
                label="Processing"
                value={processingCount}
                accentColor="#A855F7"
                pulse={processingCount > 0}
            />
        </div>
    );
};

export default MediaLibraryStats;
