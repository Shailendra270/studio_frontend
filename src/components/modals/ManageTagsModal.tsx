import React, { useState, useEffect } from 'react';
import { X, Tag } from 'lucide-react';
import { useClipsContext } from '@/contexts/useClipsContext';
import { useSelector } from 'react-redux';
import { selectTeams } from '@/store/slices/teamsSlice';
import { selectUser } from '@/store/slices/authSlice';
import type { RootState } from '@/store';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { shouldUseActionsNaming, truncateText } from '@/utils/text';
import { createPortal } from "react-dom";
// import SearchBar from '@/containers/filters/SearchBar';

interface Tag {
    id: string;
    name: string;
    category: 'game' | 'player' | 'pulse';
    streamId?: string;
    teamId?: string;
    jerseyNumber?: string;
}

interface ManageTagsModalProps {
    isOpen: boolean;
    onClose: () => void;
    appliedTags: string[];
    onUpdateTags: (tags: string[], scores?: string) => void;
    category?: string; // Sport category from clip.customData.sportName
    streamId?: string; // Stream ID for player tags
    page?: 'clips' | 'live-video'; // Page context to determine behavior
    initialScores?: string;
}

const ManageTagsModal: React.FC<ManageTagsModalProps> = ({
    isOpen,
    onClose,
    appliedTags,
    onUpdateTags,
    category,
    streamId,
    initialScores = '',
}) => {
    const { eventTags: contextEventTags, playerTags: contextPlayerTags } = useClipsContext();
    const eventsTags = contextEventTags || [];
    const playersTags = contextPlayerTags || [];
    const { currentStream } = useSelector((state: RootState) => state.streams);
    const user = useSelector(selectUser);
    const userId = ((user as any)?.userId || (user as any)?.id || (user as any)?._id || localStorage.getItem('userId') || '').toString();
    const useActionsNaming = shouldUseActionsNaming(userId);
    const storeTeams = useSelector(selectTeams) || [];
    const [selectedTags, setSelectedTags] = useState<string[]>(appliedTags);
    const [activeTab, setActiveTab] = useState<'game' | 'player' | 'pulse' | 'scores'>('game');
    const [searchTerm, setSearchTerm] = useState('');
    const [teamFilter, setTeamFilter] = useState<'team1' | 'team2' | null>(null);
    const [scores, setScores] = useState<string>(initialScores || '');
    const t1Id = currentStream?.team1Id || '';
    const t2Id = currentStream?.team2Id || '';
    const t1 = storeTeams.find((t: any) => String(t.id) === String(t1Id));
    const t2 = storeTeams.find((t: any) => String(t.id) === String(t2Id));
    const t1Name = t1?.name || 'Team 1';
    const t2Name = t2?.name || 'Team 2';
    // Function to get tags based on category from backend data
    const getTagsByCategory = (): Tag[] => {
        const tags: Tag[] = [];

        // Add event tags from backend (mapped to 'game' category for UI)
        if (eventsTags && eventsTags.length > 0) {
            const eventTags = eventsTags.map(tag => ({
                id: tag._id || tag.id,
                name: tag.name,
                category: 'game' as const
            }));
            tags.push(...eventTags);
        }

        // Add player tags from backend
        if (playersTags && playersTags.length > 0) {
            const playerTags = playersTags.map((tag: any) => ({
                id: tag._id || tag.id,
                name: tag.name,
                teamId: tag?.metaData?.teamId || '',
                jerseyNumber: tag?.metaData?.jerseyNumber || '',
                category: 'player' as const
            }));
            tags.push(...playerTags);
        }

        // Common pulse tags for all categories (keep these as hardcoded for now)
        const pulseTags: Tag[] = [
            { id: "p1", name: "High intensity", category: "pulse" },
            { id: "p2", name: "Counter attack", category: "pulse" },
            { id: "p3", name: "Build up play", category: "pulse" },
            { id: "p4", name: "Defensive", category: "pulse" },
            { id: "p5", name: "Fast-Paced", category: "pulse" },
            { id: "p6", name: "Sweep", category: "pulse" },
            { id: "p7", name: "Fantastic", category: "pulse" },
            { id: "p8", name: "Pull Shot", category: "pulse" },
            { id: "p9", name: "Perfect Timing", category: "pulse" },
            { id: "p10", name: "Aggressive", category: "pulse" },
            { id: "p11", name: "Fine shots", category: "pulse" },
            { id: "p12", name: "Quick Singles", category: "pulse" },
        ];

        tags.push(...pulseTags);
        return tags;
    };

    // Get tags based on the category
    const allTags: Tag[] = getTagsByCategory();
    let filteredTags = allTags.filter(tag =>
        tag.category === activeTab &&
        tag.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (activeTab === 'player' && teamFilter) {
        const selId = teamFilter === 'team1' ? t1Id : t2Id;
        filteredTags = filteredTags.filter((tag: any) => String(tag.teamId || '') === String(selId || ''));
    }

    useEffect(() => {
        setSelectedTags(appliedTags);
    }, [appliedTags]);
    useEffect(() => {
        if (isOpen) {
            setScores(initialScores || '');
        }
    }, [isOpen, initialScores]);

    // Ensure tags are fetched when modal opens (skip for live-video page)
    // useEffect(() => {
    //     if (!isOpen || page === 'live-video') return;
    //     if (!category) return;
    //     // Fetch event tags if not cached
    //     if (!areEventTagsCached) {
    //         (dispatch as any)(fetchTagsByCategoryAndType({ category, tagType: 'event' }));
    //     }
    //     // Fetch player tags if not cached (streamId optional)
    //     if (!arePlayerTagsCached) {
    //         (dispatch as any)(fetchTagsByCategoryAndType({ category, tagType: 'player' }));
    //     }
    // }, [isOpen, category, areEventTagsCached, arePlayerTagsCached, dispatch, page]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleTagToggle = (tagName: string) => {
        setSelectedTags(prev =>
            prev.includes(tagName)
                ? prev.filter(tag => tag !== tagName)
                : [...prev, tagName]
        );
    };

    const handleRemoveAppliedTag = (tagName: string) => {
        setSelectedTags(prev => prev.filter(tag => tag !== tagName));
    };

    const handleUpdateTags = () => {
        const trimmed = (scores || '').trim().slice(0, 5);
        onUpdateTags(selectedTags, trimmed);
        onClose();
    };

    const handleCancel = () => {
        setSelectedTags(appliedTags); // Reset to original state
        onClose();
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    const GRADIENT_BG = "linear-gradient(135deg, #00EEFF 0%, #0051FF 100%)";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            {/* Backdrop — same as Create new highlight */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden />

            {/* Modal — structure like Create new highlight: header with icon, title, subtitle, close */}
            <div className="relative w-full max-w-[1086px] max-h-[90vh] flex flex-col rounded-2xl overflow-hidden border border-[#252525] shadow-2xl" style={{ background: "#18191B" }} onClick={(e) => e.stopPropagation()}>
                {/* Header — same structure as Create new highlight: icon + title + subtitle + close */}
                <div className="relative shrink-0 px-6 py-4 border-b border-[#252525]">
                    <div className="absolute inset-0 opacity-5 rounded-t-2xl" style={{ background: GRADIENT_BG }} />
                    <div className="relative flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: GRADIENT_BG }}>
                            <Tag className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-lg font-semibold text-white font-montserrat leading-snug mt-2.5 mb-0">Manage tags</h2>
                            <p className="text-xs text-gray-400 mt-0">Apply or remove tags for this clip</p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#252525] transition-all shrink-0"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Applied Tags Section */}
                <div className="shrink-0 px-6 pt-5">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Applied tags</label>
                    <div className="flex flex-wrap gap-2">
                        {selectedTags.map((tag, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-2 rounded-lg border border-[#00EEFF]/60 bg-[#1A1B1D] px-3 py-1.5"
                            >
                                <span className="text-white text-sm font-medium">{tag}</span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveAppliedTag(tag)}
                                    className="text-gray-400 hover:text-red-400 transition-colors p-0.5"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Category Tabs + Search — section like Aspect ratio in Create new highlight */}
                <div className="shrink-0 px-6 py-5 flex flex-col gap-3">
                    <label className="block text-sm font-medium text-gray-300">Category & search</label>
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                    {/* Tabs — same pill style as Media Library filters */}
                    <div className="flex rounded-lg p-1 bg-[#1A1B1D] border border-[#252525] w-full md:w-fit overflow-x-auto no-scrollbar">
                        <button
                            type="button"
                            onClick={() => setActiveTab('game')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'game'
                                    ? 'bg-[#252525] text-white'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {useActionsNaming ? 'Action' : 'Event'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('player')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'player'
                                    ? 'bg-[#252525] text-white'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Player
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('pulse')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'pulse'
                                    ? 'bg-[#252525] text-white'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Pulse
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('scores')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'scores'
                                    ? 'bg-[#252525] text-white'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Scores
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="w-full md:max-w-[280px]">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-lg border border-[#252525] bg-[#111113] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-[#00EEFF]/50"
                        />
                    </div>
                    </div>
                </div>

                    {/* Team filter for Player tab */}
                    {activeTab === 'player' && (
                        <div className="mb-4 flex items-center gap-2 px-6">
                            <button
                                type="button"
                                onClick={() => setTeamFilter('team1')}
                                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${teamFilter === 'team1' ? 'border-[#252525] bg-[#252525] text-white' : 'border-[#252525] bg-[#1A1B1D] text-gray-300 hover:bg-[#252525] hover:text-white'}`}
                            >
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="truncate max-w-[180px]">{truncateText(t1Name, 25)}</span>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" align="start">
                                        <p>{t1Name}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </button>
                            <button
                                type="button"
                                onClick={() => setTeamFilter('team2')}
                                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${teamFilter === 'team2' ? 'border-[#252525] bg-[#252525] text-white' : 'border-[#252525] bg-[#1A1B1D] text-gray-300 hover:bg-[#252525] hover:text-white'}`}
                            >
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="truncate max-w-[180px]">{truncateText(t2Name, 25)}</span>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" align="start">
                                        <p>{t2Name}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </button>
                            <button
                                type="button"
                                onClick={() => setTeamFilter(null)}
                                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white"
                            >
                                All
                            </button>
                        </div>
                    )}



                    {/* Tags Grid or Scores — scrollable content like Create new highlight body */}
                    <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0 space-y-4">
                        {activeTab === 'scores' ? (
                            <div className="max-w-[420px]">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Scores</label>
                                <input
                                    type="text"
                                    value={scores}
                                    onChange={(e) => {
                                        const v = e.target.value.replace(/[^0-9-]/g, '').slice(0, 5);
                                        setScores(v);
                                    }}
                                    maxLength={5}
                                    placeholder="Enter scores (e.g., 1-0)"
                                    className="w-full rounded-lg border border-[#252525] bg-[#111113] px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-[#00EEFF]/50"
                                />
                            </div>
                        ) : (
                        <>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                {activeTab === 'game' ? (useActionsNaming ? 'Action tags' : 'Event tags') : activeTab === 'player' ? 'Player tags' : 'Pulse tags'}
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                            {filteredTags.map((tag) => {
                                const isSelected = selectedTags.includes(tag.name);
                                return (
                                    <button
                                        type="button"
                                        key={tag.id}
                                        onClick={() => handleTagToggle(tag.name)}
                                        className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all ${isSelected
                                            ? 'border-[#00EEFF]/60 bg-[#1A1B1D] text-white'
                                            : 'border-[#252525] bg-[#111113] text-gray-300 hover:border-[#00EEFF]/50 hover:text-white'
                                            }`}
                                    >
                                        <span className="truncate pr-2">
                                            {tag.category === 'player' && tag.jerseyNumber
                                                ? `${tag.name} (#${tag.jerseyNumber})`
                                                : tag.name}
                                        </span>
                                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#00EEFF] shrink-0" />}
                                    </button>
                                );
                            })}
                            </div>
                        </>
                        )}
                        {filteredTags.length === 0 && (
                            <div className="text-sm text-gray-400 text-center py-6">
                                {activeTab === 'player'
                                    ? 'No teams and players found in this stream'
                                    : activeTab === 'game'
                                        ? 'No events found'
                                        : ''}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons — same structure as Create new highlight footer */}
                    <div className="shrink-0 flex items-center justify-center gap-4 px-6 py-5 border-t border-[#252525]">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="rounded-xl border border-[#252525] bg-transparent min-w-[120px] h-10 px-5 text-sm font-medium text-gray-300 hover:bg-[#252525] hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleUpdateTags}
                            className="rounded-xl min-w-[120px] h-10 px-5 text-sm font-semibold text-white transition-all hover:opacity-95"
                            style={{ background: GRADIENT_BG }}
                        >
                            Update
                        </button>
                    </div>
                </div>
        </div>
    );
};

export default ManageTagsModal;
