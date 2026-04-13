import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Check, Clock, Star, Edit2, Pause, Trash2 } from "lucide-react";
import type { ViewMode } from "./ViewToggle";

export interface MediaItemData {
    id: string;
    title: string;
    mediaType: string;
    ratio: string;
    category: string;
    rating: number;
    clipStatus: string;
    platform: string;
    source: string;
    players: string[];
    actions: string[];
    tags?: string[];
    streamId?: string;
    season: string;
    competition?: string;
    session?: string;
    matchDay?: string;
    matchDate: string;
    matchName: string;
    teams: string[];
    stream: string;
    venue: string;
    downloadStatus: string;
    createdAt: string;
    durationLabel: string;
    thumbnailUrl?: string;
    videoUrl?: string;
    scoreLabel?: string;
    type?: 'clip' | 'highlight';
    timeRangeLabel?: string;
    progress?: number;
    progressPercent?: number;
}

interface MediaCardProps {
    item: MediaItemData;
    view: ViewMode;
    selected: boolean;
    selectMode: boolean;
    onSelect: (id: string) => void;
    onClick: () => void;
    onEditClick?: () => void;
    isEditing?: boolean;
    onSaveTitle?: (id: string, title: string) => void;
    /** When "streams", show sport/category or match name in the type pill instead of only mediaType. */
    collectionTab?: string;
    /** Delete entire highlight (and its clips). Only shown when item.type === 'highlight'. */
    onDeleteClick?: () => void;
}

const MediaCard: React.FC<MediaCardProps> = ({
    item,
    view,
    selected,
    selectMode,
    onSelect,
    onClick,
    onEditClick,
    isEditing = false,
    onSaveTitle,
    collectionTab,
    onDeleteClick,
}) => {
    const isSelected = selected;
    const [editTitle, setEditTitle] = useState(item.title);
    const [isHovered, setIsHovered] = useState(false);
    const [isAssetPlaying, setIsAssetPlaying] = useState(false);
    const assetVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (isEditing) setEditTitle(item.title);
    }, [isEditing, item.title]);

    useEffect(() => {
        if (!isAssetPlaying) return;
        const v = assetVideoRef.current;
        if (!v) return;
        const onEnded = () => setIsAssetPlaying(false);
        v.addEventListener("ended", onEnded);
        return () => v.removeEventListener("ended", onEnded);
    }, [isAssetPlaying]);

    const isAssetWithVideo = collectionTab === "assets" && item.videoUrl && (item.mediaType === "Bumper" || item.mediaType === "Overlay");
    const isAssetsTab = collectionTab === "assets";
    const isAssetsOrImagesTab = collectionTab === "assets" || collectionTab === "images";
    const hideDurationOnThumbnail = isAssetsOrImagesTab && (item.mediaType === "Graphics" || !item.durationLabel || item.durationLabel === "0:00");

    const playVideoMuted = useCallback(() => {
        const v = assetVideoRef.current;
        if (!v) return;
        v.muted = true;
        v.play().catch(() => {});
    }, []);
    const pauseVideo = useCallback(() => {
        const v = assetVideoRef.current;
        if (!v) return;
        v.pause();
        if (!isAssetPlaying) v.currentTime = 0;
    }, [isAssetPlaying]);

    // Auto-play Bumper/Overlay when card is visible (same as asset module EntityCard: autoPlay + muted + loop)
    useEffect(() => {
        if (!isAssetWithVideo) return;
        const v = assetVideoRef.current;
        if (v) {
            v.muted = true;
            v.play().catch(() => {});
        }
    }, [isAssetWithVideo, item.videoUrl]);

    useEffect(() => {
        if (!isAssetWithVideo) return;
        if (isHovered) {
            const t = setTimeout(playVideoMuted, 50);
            return () => clearTimeout(t);
        } else {
            pauseVideo();
        }
    }, [isAssetWithVideo, isHovered, isAssetPlaying, playVideoMuted, pauseVideo]);

    const handleCardMouseEnter = () => {
        setIsHovered(true);
        if (isAssetWithVideo) setTimeout(playVideoMuted, 50);
    };
    const handleCardMouseLeave = () => {
        setIsHovered(false);
        if (isAssetWithVideo) pauseVideo();
    };

    const handleAssetPlayClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const v = assetVideoRef.current;
        if (!v) return;
        if (isAssetPlaying) {
            v.pause();
            setIsAssetPlaying(false);
        } else {
            v.play().catch(() => {});
            setIsAssetPlaying(true);
        }
    };

    const handleSaveTitle = () => {
        const trimmed = editTitle.trim();
        if (trimmed && onSaveTitle) {
            onSaveTitle(item.id, trimmed);
        }
    };

    const handleCheckboxClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect(item.id);
    };

    const handleCardClick = () => {
        if (selectMode) {
            onSelect(item.id);
        } else {
            onClick();
        }
    };

    const pillStyle = "rounded border border-[#252525] bg-[#1A1B1D] px-1.5 py-0.5 text-[10px] font-medium text-gray-300";

    // Status chip colors by role: Completed/Ready = green, Processing = yellow, Failed = red, Cancelled = gray
    const getStatusStyle = (): { name: string; background: string; color: string } => {
        const s = (item.downloadStatus || item.clipStatus || "").toUpperCase();
        const ready = s === "READY" || s === "COMPLETED" || item.downloadStatus === "Ready";
        if (ready) return { name: "Completed", background: "#00CF45", color: "#000" };
        if (s === "PROCESSING") return { name: "Processing", background: "#E6B800", color: "#000" };
        if (s === "FAILED") return { name: "Failed", background: "#DC2626", color: "#FFF" };
        if (s === "CANCELLED") return { name: "Cancelled", background: "#838d85", color: "#000" };
        if (item.downloadStatus || item.clipStatus) return { name: item.downloadStatus || item.clipStatus || "—", background: "#252525", color: "#9ca3af" };
        return { name: "—", background: "#1A1B1D", color: "#9ca3af" };
    };
    const statusStyle = getStatusStyle();
    const isProcessing = (item.downloadStatus || item.clipStatus || "").toUpperCase() === "PROCESSING";
    const progressValue = item.type === "highlight"
      ? (item.progressPercent ?? 0)
      : (item.progress ?? 0);
    const showProgressBar = !isAssetsOrImagesTab && isProcessing;

    const Thumbnail = () => (
        <div
            className="relative h-full w-full bg-[#111113] overflow-hidden"
            onMouseEnter={handleCardMouseEnter}
            onMouseLeave={handleCardMouseLeave}
        >
            {isAssetWithVideo ? (
                <>
                    <video
                        ref={assetVideoRef}
                        src={item.videoUrl}
                        poster={item.thumbnailUrl || undefined}
                        className="absolute inset-0 h-full w-full object-cover"
                        playsInline
                        preload="auto"
                        autoPlay
                        muted
                        loop
                        onEnded={() => setIsAssetPlaying(false)}
                        onMouseEnter={(e) => { e.stopPropagation(); handleCardMouseEnter(); }}
                        onMouseLeave={(e) => { e.stopPropagation(); handleCardMouseLeave(); }}
                    />
                </>
            ) : item.thumbnailUrl ? (
                <img
                    src={item.thumbnailUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            {collectionTab !== "images" && (
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isAssetWithVideo && isAssetPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                <button
                    onClick={isAssetWithVideo ? handleAssetPlayClick : (e) => { e.stopPropagation(); onClick(); }}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-[#252525] bg-[#1A1B1D] text-gray-300 backdrop-blur-md transition-transform hover:scale-110 hover:bg-[#252525] hover:text-white"
                >
                    {isAssetWithVideo && isAssetPlaying ? (
                        <Pause className="h-6 w-6" />
                    ) : (
                        <Play fill="currentColor" className="ml-1 h-6 w-6" />
                    )}
                </button>
            </div>
            )}
            {isAssetWithVideo && isAssetPlaying && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-black/30">
                    <span className="rounded bg-black/60 px-2 py-1 text-[10px] text-white">Playing</span>
                </div>
            )}

            {/* Select mode checkbox - top left */}
            {(selectMode || isSelected) && (
                <button
                    onClick={handleCheckboxClick}
                    className={`absolute left-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${isSelected
                            ? "border-transparent bg-gradient-to-br from-[#00EEFF] to-[#0051FF]"
                            : "border-white/50 bg-black/40 hover:border-white"
                        }`}
                >
                    {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                </button>
            )}

            {/* Game overlay: Team A – Score – Team B (below checkbox when in select mode) */}
            {(item.teams?.length > 0 || item.scoreLabel) && (
                <div className={`absolute left-2 ${(selectMode || isSelected) ? "top-10" : "top-2"} rounded border border-[#252525] bg-[#1A1B1D] px-2 py-1 flex items-center gap-1.5 text-[10px] font-medium text-gray-300`}>
                    <span className="truncate max-w-[60px]">{item.teams?.[0] || "—"}</span>
                    <span className="shrink-0 font-semibold">{item.scoreLabel || "–"}</span>
                    <span className="truncate max-w-[60px]">{item.teams?.[1] || "—"}</span>
                </div>
            )}

            {/* Top Right: Type & Ratio (on Match Streams tab show sport/category or match name) */}
            <div className="absolute right-2 top-2 flex flex-wrap gap-1 justify-end">
                <span className={pillStyle}>
                    {collectionTab === "streams" && (item.category || item.matchName)
                        ? (item.category || item.matchName)
                        : item.mediaType}
                </span>
                <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-gray-300 backdrop-blur-sm">
                    {item.ratio}
                </span>
            </div>

            {/* Bottom-left: Progress bar when processing, else status badge — hidden on Assets/Images tabs */}
            {!isAssetsOrImagesTab && (
              showProgressBar ? (
                <div className="absolute bottom-2 left-2 right-14 z-10 min-w-[100px] h-6 rounded-md bg-[#252525]/95 backdrop-blur-sm flex items-center overflow-visible">
                  <div
                    className="absolute inset-y-0 left-0 rounded-md bg-gradient-to-r from-[#00EEFF] to-[#0051FF] transition-all duration-300 max-w-full"
                    style={{ width: `${Math.min(100, Math.max(0, progressValue))}%` }}
                  />
                  <span className="relative z-10 w-full flex items-center justify-center text-white text-xs font-semibold drop-shadow-[0_0_2px_rgba(0,0,0,0.8)]">
                    {Math.round(progressValue)}%
                  </span>
                </div>
              ) : (
                <span
                  className="absolute bottom-2 left-2 rounded px-2 py-0.5 text-[10px] font-semibold border border-transparent"
                  style={{ background: statusStyle.background, color: statusStyle.color }}
                >
                  {statusStyle.name}
                </span>
              )
            )}

            {/* Bottom-right: Duration — hidden on Assets/Images for Graphics or when 0:00 */}
            {!hideDurationOnThumbnail && (
            <div className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white backdrop-blur-md">
                {item.durationLabel}
            </div>
            )}
        </div>
    );

    const tagPills = (item.tags ?? item.actions ?? []).slice(0, 6);
    // Exclude generic "White Player 10" / "Black Player 5" / "Return" labels; show only actual player name, last one.
    const genericPlayerPattern = /(?:^\s*(?:white|black|red|blue|yellow|green|orange|grey|gray)\s+player\s+\d+\s*$|player\s+\d+\s*$)/i;
    const realPlayers = (item.players ?? []).filter((p) => typeof p === "string" && p.trim() && !genericPlayerPattern.test(p.trim()));
    const displayPlayers = realPlayers.length > 0 ? realPlayers.slice(-1) : [];
    const createdDateLabel = item.createdAt
        ? (() => {
            const d = new Date(item.createdAt);
            const date = d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
            const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
            return `${date} / ${time}`;
        })()
        : "";

    const MetadataDetails = ({ hideDateLine = false }: { hideDateLine?: boolean }) => (
        <div className="mt-2.5 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                {!hideDateLine && (
                <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {createdDateLabel || (item.matchDate ? new Date(item.matchDate).toLocaleDateString() : "—")}
                </span>
                )}
                {item.stream && <span className="truncate max-w-[120px]">Cam: {item.stream}</span>}
            </div>
            {item.timeRangeLabel && (
                <p className="text-xs text-gray-400">{item.timeRangeLabel}</p>
            )}
            {/* {displayPlayers.length > 0 && (
            <div className="flex flex-wrap gap-1">
                {displayPlayers.map((p) => (
                    <span
                        key={p}
                        className="rounded bg-[#252525] px-1.5 py-0.5 text-[10px] text-gray-300"
                    >
                        {p}
                    </span>
                ))}
            </div>
            )} */}
            {tagPills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {tagPills.map((t) => (
                        <span key={t} className={pillStyle}>
                            {t}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );

    // -------------------------------------------------------------
    // Grid View — gradient border (same as user-management / Clips tab)
    // -------------------------------------------------------------
    if (view === "grid") {
        return (
            <div
                onClick={handleCardClick}
                onMouseEnter={handleCardMouseEnter}
                onMouseLeave={handleCardMouseLeave}
                className={`group relative cursor-pointer rounded-xl transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] ${isHovered ? "hover:shadow-[0_0_20px_rgba(0,238,255,0.15)]" : ""}`}
                style={{ padding: "1px", background: (isSelected || isHovered) ? "linear-gradient(135deg, #00EEFF, #0051FF)" : "#1a1a1a" }}
            >
                <div className="relative flex flex-col overflow-hidden rounded-[11px] bg-[#141518] h-full">
                    <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-[#141518]">
                        <Thumbnail />
                    </div>
                    <div className="flex flex-1 flex-col p-3.5">
                    <div className="flex items-start justify-between gap-2">
                        {isEditing ? (
                            <input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onBlur={handleSaveTitle}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveTitle();
                                }}
                                autoFocus
                                className="flex-1 min-w-0 rounded border border-[#00EEFF]/50 bg-[#111113] px-2 py-1 text-sm text-white outline-none focus:border-[#00EEFF]"
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <h3 className="line-clamp-1 font-semibold text-white group-hover:text-gray-300 transition-colors">
                                {item.title}
                            </h3>
                        )}
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-gray-400">
                        {createdDateLabel || item.matchName}
                    </p>

                    {!isAssetsOrImagesTab && <MetadataDetails hideDateLine={view === "grid"} />}

                        {!isAssetsOrImagesTab && (
                        <div className="mt-3 flex items-center justify-between border-t border-[#252525] pt-3">
                            <div className="flex items-center gap-1 text-gray-400">
                                <Star className="h-3.5 w-3.5 fill-current" />
                                <span className="text-xs font-medium">{item.rating}.0</span>
                            </div>
                            <div className="flex items-center gap-1">
                                {item.type === "highlight" && onDeleteClick && (
                                    <button
                                        type="button"
                                        className="rounded p-1 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteClick();
                                        }}
                                        title="Delete highlight and all its clips"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="rounded p-1 text-gray-400 hover:bg-[#252525] hover:text-white transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (isEditing) handleSaveTitle();
                                        else onEditClick?.();
                                    }}
                                >
                                    <Edit2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // -------------------------------------------------------------
    // List View — gradient border (same as user-management)
    // -------------------------------------------------------------
    if (view === "list") {
        return (
            <div
                onClick={handleCardClick}
                onMouseEnter={handleCardMouseEnter}
                onMouseLeave={handleCardMouseLeave}
                className="group cursor-pointer rounded-xl transition-all duration-200"
                style={{ padding: "1px", background: (isSelected || isHovered) ? "linear-gradient(135deg, #00EEFF, #0051FF)" : "#1a1a1a" }}
            >
                <div className="flex cursor-pointer items-center gap-4 rounded-[11px] bg-[#141518] p-2">
                <div className="relative h-20 w-36 shrink-0 overflow-hidden rounded-lg bg-[#141518]">
                    <Thumbnail />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                        {isEditing ? (
                            <input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onBlur={handleSaveTitle}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveTitle();
                                }}
                                autoFocus
                                className="min-w-0 flex-1 rounded border border-[#00EEFF]/50 bg-[#111113] px-2 py-1 text-sm text-white outline-none focus:border-[#00EEFF]"
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <h3 className="truncate font-semibold text-white group-hover:text-[#00EEFF] transition-colors">
                                {item.title}
                            </h3>
                        )}
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-xs text-gray-400">
                        {isAssetsOrImagesTab ? (
                            <span>{createdDateLabel || "—"}</span>
                        ) : (
                            <>
                                <span className="truncate">{item.matchName}</span>
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(item.matchDate).toLocaleDateString()}
                                </span>
                                <div className="flex items-center gap-1 text-[#00EEFF]">
                                    <Star className="h-3 w-3 fill-current" />
                                    <span>{item.rating}.0</span>
                                </div>
                            </>
                        )}
                    </div>
                    {!isAssetsOrImagesTab && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                        {item.players.map((p) => (
                            <span
                                key={p}
                                className="rounded bg-[#252525] px-1.5 py-0.5 text-[10px] text-gray-300"
                            >
                                {p}
                            </span>
                        ))}
                    </div>
                    )}
                </div>
                {!isAssetsOrImagesTab && (
                <div className="flex shrink-0 items-center gap-2 pr-2">
                    {item.type === "highlight" && onDeleteClick && (
                        <button
                            type="button"
                            className="rounded p-1.5 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteClick();
                            }}
                            title="Delete highlight and all its clips"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    )}
                    <button
                        type="button"
                        className="rounded p-1.5 text-gray-400 hover:bg-[#252525] hover:text-white transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (isEditing) handleSaveTitle();
                            else onEditClick?.();
                        }}
                    >
                        <Edit2 className="h-4 w-4" />
                    </button>
                </div>
                )}
                </div>
            </div>
        );
    }

    // -------------------------------------------------------------
    // Compact View — gradient border (same as user-management)
    // -------------------------------------------------------------
    return (
        <div
            onClick={handleCardClick}
            onMouseEnter={handleCardMouseEnter}
            onMouseLeave={handleCardMouseLeave}
            className="group relative cursor-pointer rounded-lg transition-all duration-200"
            style={{ padding: "1px", background: (isSelected || isHovered) ? "linear-gradient(135deg, #00EEFF, #0051FF)" : "#1a1a1a" }}
        >
            <div className="relative overflow-hidden rounded-[7px] bg-[#141518] h-full">
            <div className="relative aspect-[4/5] w-full bg-[#141518]">
                <Thumbnail />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 pb-2 pt-6 px-2">
                    <h3 className="truncate text-xs font-semibold text-white">
                        {item.title}
                    </h3>
                    <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                        <span className="truncate text-[10px] text-gray-400">
                            {item.createdAt ? new Date(item.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : ""}
                        </span>
                        {item.category ? (
                            <span className={pillStyle}>
                                {item.category}
                            </span>
                        ) : null}
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
};

export default MediaCard;
