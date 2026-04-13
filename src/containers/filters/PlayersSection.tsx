import React, { useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import SearchBar from "./SearchBar";
import { } from "@/store/slices/tagsSlice";
import { useClipsContext } from "@/contexts/useClipsContext";

interface PlayersOption {
    id: string;
    label: string;
}

interface PlayersSectionProps {
    selectedEvents: string[];
    onEventChange: (eventId: string, checked: boolean) => void;
    playerOptions?: PlayersOption[];
    category?: string;
    streamId?: string;
    counts?: Record<string, number>;
    onReset?: () => void;
}

export const PlayersSection: React.FC<PlayersSectionProps> = ({
    selectedEvents,
    onEventChange,
    counts = {},
    onReset,
}) => {
    const [eventsExpanded, setEventsExpanded] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const { playerTags: contextPlayerTags, loading: contextLoading } = useClipsContext();
    const playerTags = useMemo(() => contextPlayerTags || [], [contextPlayerTags]);
    const loading = contextLoading;

    // Choose player options based on category
    const finalPlayerOptions = useMemo(() => {
        if (playerTags && playerTags.length > 0) {
            return playerTags.map(tag => ({
                id: tag._id,
                label: tag.name || tag.metaData?.playerName
            }));
        }
        return [];
    }, [playerTags]);

    const filteredEvents = useMemo(() => {
        const options = finalPlayerOptions;
        const base = !searchQuery.trim()
            ? options
            : options.filter((player) =>
                player.label.toLowerCase().includes(searchQuery.toLowerCase()),
            );
        return base;
    }, [finalPlayerOptions, searchQuery]);

    const sortedPlayers = useMemo(() => {
        return [...filteredEvents].sort((a, b) => {
            const ca = counts[a.label.trim().toLowerCase()] ?? 0;
            const cb = counts[b.label.trim().toLowerCase()] ?? 0;
            return cb - ca;
        });
    }, [filteredEvents, counts]);

    return (
        <div className="mb-6">
            <div className="border border-[#252525] rounded-xl">
                <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[#252525]/50 transition-colors"
                    onClick={() => setEventsExpanded(!eventsExpanded)}
                >
                    <h3 className="text-sm font-medium text-white">Players</h3>
                    <div className="flex items-center gap-3">
                        {selectedEvents.length > 0 && onReset && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onReset();
                                }}
                                className="text-xs text-[#00BBFF] font-medium hover:opacity-80 transition-opacity"                            >
                                Reset
                            </button>
                        )}
                        <svg
                            width="9"
                            height="6"
                            viewBox="0 0 9 6"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className={`transition-transform duration-200 ${eventsExpanded ? "rotate-180" : ""}`}
                        >
                            <path
                                d="M4.5 3.68205L1.38875 0.5L0.5 1.40897L4.5 5.5L8.5 1.40897L7.61125 0.5L4.5 3.68205Z"
                                fill="white"
                            />
                        </svg>
                    </div>
                </div>
                {eventsExpanded && (
                    <div className="px-4 pb-4 space-y-3">
                        {/* Search bar for events */}
                        <div className="mb-3">
                            <SearchBar
                                value={searchQuery}
                                onChange={setSearchQuery}
                                placeholder="Search players..."
                                className="h-9 text-sm"
                            />
                        </div>

                        {/* Players list */}
                        <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500">
                            {loading ? (
                                <div className="text-sm text-gray-400 text-center py-4">
                                    Loading players...
                                </div>
                            ) : (
                                <>
                                    {sortedPlayers.map((event) => (
                                        <div key={event.id} className="flex items-center gap-3 pr-2">
                                            <Checkbox
                                                id={event.id}
                                                checked={
                                                    selectedEvents.includes(event.label) ||
                                                    (event.label === "all" && selectedEvents.includes("all"))
                                                }
                                                onCheckedChange={(checked: boolean) =>
                                                    onEventChange(event.label, checked)
                                                }
                                                className="border-2 border-white data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-[#00BBFF] data-[state=checked]:to-[#0051FF] data-[state=checked]:border-[#00BBFF] rounded-md"
                                            />
                                            <Label
                                                htmlFor={event.id}
                                                className="text-sm font-medium text-white cursor-pointer flex-1 min-w-0 truncate"
                                            >
                                                {event.label}
                                            </Label>
                                            <span className="text-xs text-gray-400 w-10 text-right">{counts[event.label.trim().toLowerCase()] ?? 0}</span>
                                        </div>
                                    ))}

                                    {filteredEvents.length === 0 && !loading && (
                                        <div className="text-sm text-gray-400 text-center py-2">
                                            No players found
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
export default PlayersSection;
