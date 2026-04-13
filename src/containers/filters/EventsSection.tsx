import React, { useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import SearchBar from "./SearchBar";
import { useAppSelector } from "@/store";
import { selectUser } from "@/store/slices/authSlice";
import { shouldUseActionsNaming } from "@/utils/text";

import { useClipsContext } from '@/contexts/useClipsContext';

interface EventOption {
    id: string;
    label: string;
}

interface EventsSectionProps {
    selectedEvents: string[];
    onEventChange: (eventId: string, checked: boolean) => void;
    eventOptions?: EventOption[];
    category?: string;
    streamId?: string;
    counts?: Record<string, number>;
    onReset?: () => void;
}

export const defaultEventOptions: EventOption[] = [
    { id: "all", label: "All" },
    { id: "Goal", label: "Goal" },
    { id: "Assist", label: "Assist" },
    { id: "Shots on target", label: "Shots on target" },
    { id: "Shots off target", label: "Shots off target" },
    { id: "Save", label: "Save" },
    { id: "Corner kick", label: "Corner kick" },
    { id: "Free kick", label: "Free kick" },
    { id: "Penalty kick", label: "Penalty kick" },
    { id: "Throw in", label: "Throw in" },
    { id: "Foul", label: "Foul" },
    { id: "Yellow card", label: "Yellow card" },
    { id: "Red card", label: "Red card" },
    { id: "Offside", label: "Offside" },
    { id: "Substitution", label: "Substitution" },
    { id: "VAR review", label: "VAR review" },
    { id: "Kick off", label: "Kick off" },
    { id: "Half time", label: "Half time" },
    { id: "Full time", label: "Full time" },
];

export const cricketEventsOptions = [
    { id: "Four", label: "Four" },
    { id: "Six", label: "Six" },
    { id: "Bouncer", label: "Bouncer" },
    { id: "Yorker", label: "Yorker" },
    { id: "Bowling", label: "Bowling" },
    { id: "Wicket", label: "Wicket" },
    { id: "Catch", label: "Catch" },
    { id: "Double", label: "Double" },
    { id: "Single", label: "Single" },
    { id: "Century", label: "Century" },
    { id: "Fifty", label: "Fifty" },
    { id: "Bowled", label: "Bowled" },
    { id: "Lbw", label: "Lbw" },
    { id: "Maiden-over", label: "Maiden-over" },
    { id: "Super over", label: "Super over" },
    { id: "Power play", label: "Power play" },
    { id: "DRS", label: "DRS" },
    { id: "Partnership", label: "Partnership" },
];

export const EventsSection: React.FC<EventsSectionProps> = ({
    selectedEvents,
    onEventChange,
    eventOptions = defaultEventOptions,
    category,
    counts = {},
    onReset,
}) => {
    const { eventTags: contextEventTags, loading: contextLoading } = useClipsContext();
    const user = useAppSelector(selectUser);
    const userId = ((user as any)?.userId || (user as any)?.id || (user as any)?._id || localStorage.getItem('userId') || '').toString();
    const useActionsNaming = shouldUseActionsNaming(userId);
    const [eventsExpanded, setEventsExpanded] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const eventTags = useMemo(() => contextEventTags || [], [contextEventTags]);
    const loading = contextLoading;

    // Convert backend tags to EventOption format
    const convertTagsToEventOptions = (tags: any[]): EventOption[] => {
        return tags
            .filter(tag => tag && (tag._id || tag.name)) // Filter out invalid tags
            .map(tag => ({
                id: tag._id ? tag._id.toString() : Math.random().toString(36).substr(2, 9),
                label: tag.name || 'Unknown Event'
            }));
    };

    // Choose event options based on category and local data
    const finalEventOptions = useMemo(() => {
        if ((eventTags || []).length > 0) {
            return convertTagsToEventOptions(eventTags);
        }
        if (category === "cricket") {
            return cricketEventsOptions;
        }
        return eventOptions || defaultEventOptions;
    }, [category, eventOptions, eventTags]);

    const filteredEvents = useMemo(() => {
        const base = !searchQuery.trim()
            ? finalEventOptions
            : finalEventOptions.filter((event) =>
                event.label.toLowerCase().includes(searchQuery.toLowerCase()),
            );
        return base;
    }, [finalEventOptions, searchQuery]);

    const sortedEvents = useMemo(() => {
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
                    <h3 className="text-sm font-medium text-white">{useActionsNaming ? 'Actions' : 'Events'}</h3>
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
                                placeholder={useActionsNaming ? 'Search actions...' : 'Search events...'}
                                className="h-9 text-sm"
                            />
                        </div>

                        {/* Events list */}
                        <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500">
                            {loading ? (
                                <div className="text-sm text-gray-400 text-center py-4">
                                    {useActionsNaming ? 'Loading actions...' : 'Loading events...'}
                                </div>
                            ) : (
                                <>
                                    {sortedEvents.map((event) => (
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
                                            No events found
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
export default EventsSection;
