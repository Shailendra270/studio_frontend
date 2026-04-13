import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchBumpers, fetchGraphics, fetchOverlays } from "@/store/slices/assetsSlice";
import type { Asset } from "@/store/slices/assetsSlice";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Plus,
  X,
  MousePointerClick,
  MonitorPlay,
  Play,
  PlaySquare,
  Image as ImageIcon,
  LayoutGrid,
  Share2,
  Download,
  Edit2,
  Tag,
  Film,
  Trash2,
  StopCircle,
  Scissors,
  FlipHorizontal,
  FileJson,
} from "lucide-react";
import { Rate } from "antd";
import Sidebar from "../layouts/dashboard/Sidebar";
import HelpButton from "@/containers/help_section/HelpButton";
import { type CollectionTab } from "@/components/common/CollectionTabs";
import ViewToggle, { type ViewMode } from "@/components/common/ViewToggle";
import MediaCard, { type MediaItemData } from "@/components/common/MediaCard";
import MediaLibrarySelectionBar from "@/components/common/MediaLibrarySelectionBar";
import MediaLibraryShimmerCard from "@/components/common/MediaLibraryShimmerCard";
import ManageTagsModal from "@/components/modals/ManageTagsModal";
import AssetPreviewModal from "@/components/modals/AssetPreviewModal";
import DeleteConfirmationModal from "@/components/modals/DeleteConfirmationModal";
import EndStreamConfirmationModal from "@/components/modals/EndStreamConfirmationModal";
import {
  getMediaLibrary,
  getMediaLibraryStats,
  getMediaLibraryFilterCounts,
  toMediaItemData,
  type MediaLibraryItem,
  type MediaLibraryFilterCountsResponse,
} from "@/api/mediaLibraryApi";
import { getDashboardSettings, updateDashboardSettings } from "@/api/dashboardSettingsApi";
import { getStreams, deleteStream, endStream } from "@/api/streams";
import { updateClip, deleteClip, exportClipJson } from "@/api/clipApi";
import { createFolder, updateFolder, deleteFolder } from "@/api/folderApi";
import { getTags, type TagData } from "@/api/tagsApi";
import { fetchStreamById } from "@/store/slices/streamsSlice";
import { selectUser } from "@/store/slices/authSlice";
import { toast } from "sonner";
import { downloadFile } from "@/utils/download";
import NewHighlightModal from "@/components/modals/NewHighlightModal";
import EditVideoModal from "@/containers/add-video/EditVideoModal";
import AddNewVideoModal from "@/containers/add-video/AddNewVideoModal";
import type { NewHighlightFormData } from "@/types/highlight";
import { STATUS_STYLES } from "@/constants/DashboardPage";

type FilterId =
  | "mediaType"
  | "ratio"
  | "category"
  | "rating"
  | "platform"
  | "players"
  | "actions"
  | "matches"
  | "teams"
  | "date"
  | "streams"
  | "seasons"
  | "competition"
  | "matchDay"
  | "venues"
  | "downloadStatus"
  | "clipStatus"
  | "source";

// Content & media first, then League & event in hierarchy order. Streams only on Streams tab.
const DEFAULT_VISIBLE_FILTERS: FilterId[] = [
  "mediaType",
  "ratio",
  "rating",
  "clipStatus",
  "platform",
  "source",
  "actions",
  "downloadStatus",
  "category",
  "competition",
  "seasons",
  "matchDay",
  "date",
  "matches",
  "teams",
  "venues",
  "players",
];

const DASHBOARD_RESTORE_KEY = "dashboard_restore";
const MEDIA_LIBRARY_STATE_KEY = "media_library_state";
const NAVIGATING_AWAY_KEY = "navigating_away_from_dashboard";

// League & event order: same as hierarchy (Sport → Competition → Season → Round → Date → Matches → Team → Venues → Player)
const LEAGUE_FILTER_OPTIONS: { id: FilterId; label: string }[] = [
  { id: "category", label: "Sport" },
  { id: "competition", label: "Competition" },
  { id: "seasons", label: "Season" },
  { id: "matchDay", label: "Round" },
  { id: "date", label: "Date" },
  { id: "matches", label: "Match" },
  { id: "teams", label: "Team" },
  { id: "venues", label: "Venues" },
  { id: "players", label: "Player" },
];
// Content & media. Streams is valid but shown only on Streams tab.
const CONTENT_FILTER_OPTIONS: { id: FilterId; label: string }[] = [
  { id: "mediaType", label: "Media Type" },
  { id: "ratio", label: "Ratio" },
  { id: "rating", label: "Rating" },
  { id: "clipStatus", label: "Clip Status" },
  { id: "platform", label: "Platform" },
  { id: "source", label: "Source" },
  { id: "actions", label: "Actions" },
  { id: "downloadStatus", label: "Download Status" },
  { id: "streams", label: "Streams" },
];
const ALL_FILTER_OPTIONS = [...CONTENT_FILTER_OPTIONS, ...LEAGUE_FILTER_OPTIONS];
const VALID_FILTER_IDS = new Set(ALL_FILTER_OPTIONS.map((o) => o.id));

// Media type options for filter (tab determines which options are shown)
const ALL_MEDIA_TYPES = [
  "AI Clips",
  "Manual Clips",
  "Highlights",
  "Overlays",
  "Bumpers",
  "Graphics",
  "Thumbnails",
  "Assets",
] as const;

const COLLECTION_TAB_MEDIA_TYPES: Record<CollectionTab, readonly string[]> = {
  all: ALL_MEDIA_TYPES,
  clips: ["AI Clips", "Manual Clips"],
  highlights: ["Highlights"],
  streams: ["AI Clips", "Manual Clips"],
  assets: ["Assets", "Graphics", "Overlays", "Bumpers"],
  images: ["Thumbnails", "Graphics"],
};

const COLLECTION_TAB_MEDIA_MAP: Record<CollectionTab, string[] | null> = {
  all: null,
  clips: ["Clipped Video", "User Video"],
  highlights: ["Automatic Video", "Video Graphics"],
  streams: ["Uploaded Video"],
  assets: ["Video Graphics"],
  images: ["Extracted Image"],
};

type AssetKind = "bumper" | "graphic" | "overlay";

/** Map Asset (bumpers/graphics/overlays from /assets) to MediaItemData for media library grid. Chip shows Bumper / Graphics / Overlay. */
function assetToMediaItemData(asset: Asset, kind: AssetKind): MediaItemData {
  const durationSec = asset.duration ?? 0;
  const m = durationSec >= 60 ? Math.floor(durationSec / 60) : 0;
  const s = Math.floor(durationSec % 60);
  const durationLabel = durationSec ? `${m}:${String(s).padStart(2, "0")}` : "0:00";
  const mediaTypeLabel = kind === "bumper" ? "Bumper" : kind === "graphic" ? "Graphics" : "Overlay";
  return {
    id: asset._id,
    title: asset.title || "Untitled",
    mediaType: mediaTypeLabel,
    ratio: asset.aspectRatio || "16:9",
    category: "",
    rating: 0,
    clipStatus: "COMPLETED",
    platform: "",
    source: "Manual",
    players: [],
    actions: [],
    tags: [],
    streamId: "",
    season: "",
    competition: "",
    matchDate: "",
    matchName: "",
    teams: [],
    stream: "",
    venue: "",
    downloadStatus: "Ready",
    createdAt: asset.createdAt || new Date().toISOString(),
    durationLabel,
    thumbnailUrl: asset.url || "",
    videoUrl: asset.url,
  };
}

// Map item.mediaType + item.source to display media type for filter
/* ──────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────── */

const formatDate = (input: string) => {
  if (!input) return "";
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
};

const normalizeMatchName = (input: string) => input.trim();

/** Pagination bar: "X–Y of Z", Prev/Next, optional page label */
function PaginationBar({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  className = "",
}: {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  return (
    <div className={`flex items-center justify-between gap-3 flex-wrap ${className}`}>
      <span className="text-sm text-gray-400 tabular-nums leading-none">
        {total === 0 ? "0 results" : `${start}–${end} of ${total}`}
      </span>
      <div className="flex items-center gap-1 leading-none">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-lg p-1.5 text-gray-400 hover:text-white hover:bg-[#252525] disabled:opacity-40 disabled:pointer-events-none transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm text-gray-400 min-w-[4rem] text-center tabular-nums align-middle">
          Page {page} of {totalPages || 1}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-lg p-1.5 text-gray-400 hover:text-white hover:bg-[#252525] disabled:opacity-40 disabled:pointer-events-none transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/** Modal to edit clip name in place (no navigation) */
function EditClipNameModal({
  clip,
  currentTitle,
  onSave,
  onClose,
}: {
  clip: MediaItemData;
  currentTitle: string;
  onSave: (newTitle: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(currentTitle);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-[#252525] bg-[#111113] p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-white mb-3">Edit name</h3>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-lg border border-[#252525] bg-[#1A1B1D] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-[#00EEFF]/50"
          placeholder="Clip name"
          autoFocus
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-[#252525] bg-[#1A1B1D] px-4 py-2 text-sm font-medium text-gray-300 hover:bg-[#252525] hover:text-white">
            Cancel
          </button>
          <button type="button" onClick={() => onSave(value.trim() || clip.title)} className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #00EEFF 0%, #0051FF 100%)" }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

const formatFilterLabel = (id: FilterId) => {
  const map: Record<FilterId, string> = {
    mediaType: "Media Type",
    ratio: "Ratio",
    category: "Sport",
    rating: "Rating",
    platform: "Platform",
    players: "Player",
    actions: "Actions",
    matches: "Match",
    teams: "Team",
    date: "Date",
    streams: "Streams",
    seasons: "Season",
    competition: "Competition",
    matchDay: "Round",
    venues: "Venues",
    downloadStatus: "Download Status",
    clipStatus: "Clip Status",
    source: "Source",
  };
  return map[id];
};

type FacetOption = {
  value: string;
  label: string;
  count: number;
};

type MatchGroupOption = {
  date: string;
  label: string;
  count: number;
  matches: FacetOption[];
};

const sortFacetAlphabetically = (a: FacetOption, b: FacetOption) => {
  if (b.count !== a.count) return b.count - a.count;
  return a.label.localeCompare(b.label);
};

const sortFacetValuesDescending = (a: FacetOption, b: FacetOption) => {
  if (a.value !== b.value) return b.value.localeCompare(a.value);
  if (b.count !== a.count) return b.count - a.count;
  return a.label.localeCompare(b.label);
};

const buildFacetCountMap = (values: string[]) => {
  const counts = new Map<string, number>();
  values.forEach((value) => {
    const normalized = String(value ?? "").trim();
    if (!normalized) return;
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  });
  return counts;
};

const mergeFacetOptions = ({
  apiOptions = [],
  fallbackValues = [],
  formatLabel = (value: string) => value,
  sort = sortFacetAlphabetically,
}: {
  apiOptions?: Array<{ value: string; count: number }>;
  fallbackValues?: string[];
  formatLabel?: (value: string) => string;
  sort?: (a: FacetOption, b: FacetOption) => number;
}) => {
  const merged = new Map<string, FacetOption>();
  apiOptions.forEach(({ value, count }) => {
    const normalized = String(value ?? "").trim();
    if (!normalized) return;
    merged.set(normalized, {
      value: normalized,
      label: formatLabel(normalized),
      count,
    });
  });
  buildFacetCountMap(fallbackValues).forEach((count, value) => {
    if (merged.has(value)) return;
    merged.set(value, {
      value,
      label: formatLabel(value),
      count,
    });
  });
  return [...merged.values()].sort(sort);
};

// Media Library metadata sources:
// - players: clip-level metadata
// - teams / competition / session / season / matchDay / matchDate / venue / matchName: MatchMetadata payload
// - streams: stream records
// The counts endpoint is the primary facet source; item values are used only as a fallback.

/* ──────────────────────────────────────────────
   Cache for instant restore when returning from child route
   ────────────────────────────────────────────── */
let cachedMediaItems: MediaItemData[] = [];
let cachedStreamsList: Array<{ streamId: string; title: string; category: string; clipsCount: number; highlightsCount: number; videoThumbnailUrl?: string; createdAt?: string }> = [];
let cachedPagination = { page: 1, limit: 20, total: 0, totalPages: 0 };
let cachedStreamsPagination = { page: 1, limit: 20, total: 0, totalPages: 1 };
let cachedStats: { totalItems?: number; countClips?: number; countHighlights?: number; countStreams?: number; countStreamMedia?: number; [key: string]: unknown } | null = null;

/* ──────────────────────────────────────────────
   Dashboard Component
   ────────────────────────────────────────────── */

const PLATFORM_OPTIONS = [
  "Cloud",
  "Email",
  "YouTube",
  "Facebook",
  "Instagram",
  "TikTok",
  "X",
];

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectUser);
  const userId = currentUser?.userId ?? "";
  const { bumpers, graphics, overlays } = useAppSelector((state) => state.assets);
  // ── Restore state when returning from child pages (e.g. Publish)
  const [restoreSelectedClipId, setRestoreSelectedClipId] = useState<string | null>(null);

  // ── View & Selection state
  const [activeCollectionTab, setActiveCollectionTab] =
    useState<CollectionTab>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectedItemsData, setSelectedItemsData] = useState<Record<string, MediaItemData>>({});
  const selectedItemsCacheRef = useRef(new Map<string, MediaItemData>());
  const [showPreview, setShowPreview] = useState(false);
  const [isCreateHighlightModalOpen, setIsCreateHighlightModalOpen] = useState(false);
  const [isAddVideoModalOpen, setIsAddVideoModalOpen] = useState(false);

  // ── API state
  const fetchIdRef = useRef(0);
  const [mediaItems, setMediaItems] = useState<MediaItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [stats, setStats] = useState<{
    totalItems: number;
    totalDurationLabel: string;
    avgRating: number;
    processingCount: number;
    countClips: number;
    countHighlights: number;
    countStreams?: number;
    countStreamMedia?: number;
  } | null>(null);
  const [filterCounts, setFilterCounts] = useState<MediaLibraryFilterCountsResponse["data"] | null>(null);
  const [selectedClip, setSelectedClip] = useState<MediaItemData | null>(null);
  const [filterSidebarOpen, setFilterSidebarOpen] = useState(false);
  const [editModalClip, setEditModalClip] = useState<MediaItemData | null>(null);
  const [assetPreviewItem, setAssetPreviewItem] = useState<MediaItemData | null>(null);
  const [manageTagsOpen, setManageTagsOpen] = useState(false);
  const [manageTagsStreamLoading, setManageTagsStreamLoading] = useState(false);
  const [filterSectionVisible, setFilterSectionVisible] = useState(true);

  // Match Streams tab: list from streams API (not media library), navigate to /clips/:streamId
  const [streamsList, setStreamsList] = useState<Array<{ streamId: string; title: string; category: string; clipsCount: number; highlightsCount: number; videoThumbnailUrl?: string; createdAt?: string; status?: number }>>([]);
  const [streamsPagination, setStreamsPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [streamsPage, setStreamsPage] = useState(1);
  const [streamsLoading, setStreamsLoading] = useState(false);
  const [streamsRefreshKey, setStreamsRefreshKey] = useState(0);
  const [mediaLibraryRefreshKey, setMediaLibraryRefreshKey] = useState(0);
  const [showDeleteMediaModal, setShowDeleteMediaModal] = useState(false);
  /** Highlight to delete from grid card; when set, global delete confirmation modal is shown */
  const [highlightToDeleteFromCard, setHighlightToDeleteFromCard] = useState<MediaItemData | null>(null);
  const [ratingUpdateLoading, setRatingUpdateLoading] = useState(false);
  const [editingStream, setEditingStream] = useState<{ streamId: string; title: string; category: string } | null>(null);
  const [streamToStop, setStreamToStop] = useState<{ streamId: string; title: string } | null>(null);
  const [streamToDelete, setStreamToDelete] = useState<{ streamId: string; title: string } | null>(null);
  const [isStoppingStream, setIsStoppingStream] = useState(false);
  const [hoveredStreamId, setHoveredStreamId] = useState<string | null>(null);

  // Event and player tags from Tags API (same source as Clips page Events/Players) — used for Actions and Player filters when sport is selected
  const [eventTagsFromDb, setEventTagsFromDb] = useState<TagData[]>([]);
  const [playerTagsFromDb, setPlayerTagsFromDb] = useState<TagData[]>([]);

  // Last-known totals per tab so counts don't fluctuate when switching (inactive tabs use last fetch instead of stats)
  const [lastClipsTotal, setLastClipsTotal] = useState<number | null>(null);
  const [lastHighlightsTotal, setLastHighlightsTotal] = useState<number | null>(null);
  const [lastStreamsTotal, setLastStreamsTotal] = useState<number | null>(null);
  // Which tab the current pagination total is for (avoids showing previous tab's count during switch)
  const [paginationForTab, setPaginationForTab] = useState<CollectionTab | null>(null);
  // Whether streamsPagination is from the current streams tab fetch (avoids showing wrong count when switching to/from Match Streams)
  const [streamsPaginationIsCurrent, setStreamsPaginationIsCurrent] = useState(false);

  // Resizable detail split: left panel width as % (default 30), clamp 20–60
  const [libraryPanelWidthPercent, setLibraryPanelWidthPercent] = useState(30);
  const [isResizing, setIsResizing] = useState(false);
  const detailSplitRef = useRef<HTMLDivElement>(null);

  // Ref to skip "reset page to 1" when we're restoring saved state
  const isRestoringRef = useRef(false);
  // When true, fetch effects do background refresh without showing full loading UI
  const useCachedDataRef = useRef(false);
  // Only fetch asset counts after media-library has loaded so media-library is the first API call
  const assetCountFetchedRef = useRef(false);

  // Restore dashboard state when returning from a child page (e.g. Publish)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DASHBOARD_RESTORE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as { selectedClipId?: string; page?: number; sortOrder?: string; activeCollectionTab?: CollectionTab };
      sessionStorage.removeItem(DASHBOARD_RESTORE_KEY);
      if (data.page != null) setPage(data.page);
      if (data.sortOrder != null) setSortOrder(data.sortOrder);
      if (data.activeCollectionTab != null) setActiveCollectionTab(data.activeCollectionTab);
      if (data.selectedClipId != null) setRestoreSelectedClipId(data.selectedClipId);
    } catch {
      sessionStorage.removeItem(DASHBOARD_RESTORE_KEY);
    }
  }, []);

  // Restore full Media Library state when returning from child route (e.g. /clips/:streamId)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(MEDIA_LIBRARY_STATE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as {
        activeCollectionTab?: CollectionTab;
        page?: number;
        streamsPage?: number;
        sortOrder?: string;
        search?: string;
        selectedClipId?: string;
        selectedMediaTypes?: string[];
        selectedCategories?: string[];
        selectedRatios?: string[];
        selectedRatings?: string[];
        selectedPlatforms?: string[];
        selectedPlayers?: string[];
        selectedActions?: string[];
        selectedTeams?: string[];
        selectedStreams?: string[];
        selectedClipStatus?: string[];
        selectedSources?: string[];
        selectedDownloadStatus?: string[];
        selectedSeasons?: string[];
        selectedCompetitions?: string[];
        selectedMatchDays?: string[];
        selectedMatchDates?: string[];
        selectedMatches?: string[];
        selectedVenues?: string[];
        fromDate?: string;
        toDate?: string;
        libraryPanelWidthPercent?: number;
      };
      isRestoringRef.current = true;
      if (data.activeCollectionTab != null) setActiveCollectionTab(data.activeCollectionTab);
      if (data.page != null) setPage(data.page);
      if (data.streamsPage != null) setStreamsPage(data.streamsPage);
      if (data.sortOrder != null) setSortOrder(data.sortOrder);
      if (data.search != null) setSearch(data.search);
      if (data.selectedClipId != null) setRestoreSelectedClipId(data.selectedClipId);
      if (data.selectedMediaTypes?.length) setSelectedMediaTypes(data.selectedMediaTypes);
      if (data.selectedCategories?.length) setSelectedCategories(data.selectedCategories);
      if (data.selectedRatios?.length) setSelectedRatios(data.selectedRatios);
      if (data.selectedRatings?.length) setSelectedRatings(data.selectedRatings);
      if (data.selectedPlatforms?.length) setSelectedPlatforms(data.selectedPlatforms);
      if (data.selectedPlayers?.length) setSelectedPlayers(data.selectedPlayers);
      if (data.selectedActions?.length) setSelectedActions(data.selectedActions);
      if (data.selectedTeams?.length) setSelectedTeams(data.selectedTeams);
      if (data.selectedStreams?.length) setSelectedStreams(data.selectedStreams);
      if (data.selectedClipStatus?.length) setSelectedClipStatus(data.selectedClipStatus);
      if (data.selectedSources?.length) setSelectedSources(data.selectedSources);
      if (data.selectedDownloadStatus?.length) setSelectedDownloadStatus(data.selectedDownloadStatus);
      if (data.selectedSeasons?.length) setSelectedSeasons(data.selectedSeasons);
      if (data.selectedCompetitions?.length) setSelectedCompetitions(data.selectedCompetitions);
      if (data.selectedMatchDays?.length) setSelectedMatchDays(data.selectedMatchDays);
      if (data.selectedMatchDates?.length) setSelectedMatchDates(data.selectedMatchDates);
      if (data.selectedMatches?.length) setSelectedMatches(data.selectedMatches);
      if (data.selectedVenues?.length) setSelectedVenues(data.selectedVenues);
      if (data.fromDate != null) setFromDate(data.fromDate);
      if (data.toDate != null) setToDate(data.toDate);
      if (data.libraryPanelWidthPercent != null && data.libraryPanelWidthPercent >= 20 && data.libraryPanelWidthPercent <= 60) {
        setLibraryPanelWidthPercent(data.libraryPanelWidthPercent);
      }
      // Apply cached list data so we don't show full loading UI when returning
      if (cachedMediaItems.length > 0) {
        setMediaItems(cachedMediaItems);
        setPagination(cachedPagination);
        setLoading(false);
      }
      if (cachedStreamsList.length > 0) {
        setStreamsList(cachedStreamsList);
        setStreamsPagination(cachedStreamsPagination);
        setStreamsLoading(false);
      }
      if (cachedStats) {
        setStats(cachedStats as typeof stats);
      }
      if (cachedMediaItems.length > 0 || cachedStreamsList.length > 0) {
        useCachedDataRef.current = true;
      }
    } catch {
      // ignore
    }
  }, []);

  // After media load, re-select clip when we have a restored id
  useEffect(() => {
    if (!restoreSelectedClipId || !mediaItems.length) return;
    const found = mediaItems.find((m) => m.id === restoreSelectedClipId);
    if (found) setSelectedClip(found);
    setRestoreSelectedClipId(null);
  }, [mediaItems, restoreSelectedClipId]);

  // Asset counts are fetched after media-library load (see media-library effect) so media-library is always the first API call.

  // When user opens Assets tab, fetch full list so grid shows real assets (bumpers + graphics + overlays)
  useEffect(() => {
    if (activeCollectionTab !== "assets" || !userId) return;
    const limit = 500;
    dispatch(fetchBumpers({ userId, pageNo: 1, limit }));
    dispatch(fetchGraphics({ userId, pageNo: 1, limit }));
    dispatch(fetchOverlays({ userId, pageNo: 1, limit }));
  }, [activeCollectionTab, userId, dispatch]);

  // Reset to page 1 when switching to Assets or Images tab (client-filtered tabs) so we don't show an empty slice
  useEffect(() => {
    if (activeCollectionTab === "assets" || activeCollectionTab === "images") setPage(1);
  }, [activeCollectionTab]);

  // Keep a ref of current state so we can save it on unmount (when navigating to e.g. /clips/:id)
  const mediaLibraryStateRef = useRef<Record<string, unknown>>({});

  useEffect(() => {
    if (!isResizing) return;
    const container = detailSplitRef.current;
    const onMove = (e: MouseEvent) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.round((x / rect.width) * 100);
      setLibraryPanelWidthPercent(Math.min(60, Math.max(20, pct)));
    };
    const onUp = () => setIsResizing(false);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  // ── Filter state
  const [search, setSearch] = useState("");
  const [filterSearch, setFilterSearch] = useState<Partial<Record<FilterId, string>>>({});
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [visibleFilters, setVisibleFilters] = useState<FilterId[]>(
    DEFAULT_VISIBLE_FILTERS,
  );
  const visibleFiltersLoadedRef = useRef(false);

  const [selectedMediaTypes, setSelectedMediaTypes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedRatios, setSelectedRatios] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedStreams, setSelectedStreams] = useState<string[]>([]);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [selectedCompetitions, setSelectedCompetitions] = useState<string[]>([]);
  const [selectedMatchDays, setSelectedMatchDays] = useState<string[]>([]);
  const [selectedMatchDates, setSelectedMatchDates] = useState<string[]>([]);
  const [selectedMatches, setSelectedMatches] = useState<string[]>([]);
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);
  const [selectedClipStatus, setSelectedClipStatus] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedDownloadStatus, setSelectedDownloadStatus] = useState<
    string[]
  >([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortOrder, setSortOrder] = useState("Newest");
  const [editingClipId, setEditingClipId] = useState<string | null>(null);
  const [titleOverrides, setTitleOverrides] = useState<Record<string, string>>({});

  // Categories to query Tags API: normalize to lowercase; include both football and soccer when either is selected
  const categoriesForTags = useMemo(() => {
    if (!selectedCategories.length) return [];
    const seen = new Set<string>();
    selectedCategories.forEach((c) => {
      const lower = (c || "").toLowerCase().trim();
      if (!lower) return;
      seen.add(lower);
      if (lower === "football") seen.add("soccer");
      if (lower === "soccer") seen.add("football");
    });
    return Array.from(seen);
  }, [selectedCategories]);

  // Fetch event and player tags from Tags API (same DB source as Clips page Events/Players) when sport filter is set
  useEffect(() => {
    if (!categoriesForTags.length || !userId) {
      setEventTagsFromDb([]);
      setPlayerTagsFromDb([]);
      return;
    }
    let cancelled = false;
    const run = async () => {
      const allEvents: TagData[] = [];
      const allPlayers: TagData[] = [];
      const seenEventNames = new Set<string>();
      const seenPlayerIds = new Set<string>();
      for (const category of categoriesForTags) {
        try {
          const [evRes, plRes] = await Promise.all([
            getTags({ category, tagType: "event", userId, limit: 200, pageNo: 1 }),
            getTags({ category, tagType: "player", userId, limit: 200, pageNo: 1 }),
          ]);
          if (cancelled) return;
          if (evRes.success && Array.isArray(evRes.data)) {
            evRes.data.forEach((t) => {
              const name = (t.name || "").trim();
              if (name && !seenEventNames.has(name)) {
                seenEventNames.add(name);
                allEvents.push(t);
              }
            });
          }
          if (plRes.success && Array.isArray(plRes.data)) {
            plRes.data.forEach((t) => {
              const id = t._id;
              if (id && !seenPlayerIds.has(id)) {
                seenPlayerIds.add(id);
                allPlayers.push(t);
              }
            });
          }
        } catch {
          // ignore per-category errors
        }
      }
      if (!cancelled) {
        setEventTagsFromDb(allEvents);
        setPlayerTagsFromDb(allPlayers);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [categoriesForTags, userId]);

  const isAssetsOrImagesTab = activeCollectionTab === "assets" || activeCollectionTab === "images";

  // On Assets/Images tab: no detail view — clear selection when switching to these tabs
  useEffect(() => {
    if (isAssetsOrImagesTab && selectedClip) setSelectedClip(null);
  }, [isAssetsOrImagesTab, selectedClip]);

  // Load org-scoped visible filters from API on mount
  // useEffect(() => {
  //   if (visibleFiltersLoadedRef.current) return;
  //   visibleFiltersLoadedRef.current = true;
  //   getDashboardSettings()
  //     .then((res) => {
  //       const raw = res?.data?.visibleFilters;
  //       if (Array.isArray(raw) && raw.length > 0) {
  //         const valid = raw.filter(
  //           (id): id is FilterId => typeof id === "string" && VALID_FILTER_IDS.has(id as FilterId),
  //         );
  //         if (valid.length > 0) setVisibleFilters(valid);
  //       }
  //     })
  //     .catch(() => { /* keep default visible filters */ });
  // }, []);

  // const handleVisibleFilterToggle = useCallback((filterId: FilterId) => {
  //   setVisibleFilters((prev) => {
  //     const next = prev.includes(filterId)
  //       ? prev.filter((id) => id !== filterId)
  //       : [...prev, filterId];
  //     updateDashboardSettings(next).catch(() => toast.error("Failed to save visible filters"));
  //     return next;
  //   });
  // }, []);

  const filterResetSignature = useMemo(
    () => ({
      ratios: selectedRatios.join(","),
      ratings: selectedRatings.join(","),
      downloadStatuses: selectedDownloadStatus.join(","),
      categories: selectedCategories.join(","),
      seasons: selectedSeasons.join(","),
      competitions: selectedCompetitions.join(","),
      matchDays: selectedMatchDays.join(","),
      matchDates: selectedMatchDates.join(","),
    }),
    [
      selectedRatios,
      selectedRatings,
      selectedDownloadStatus,
      selectedCategories,
      selectedSeasons,
      selectedCompetitions,
      selectedMatchDays,
      selectedMatchDates,
    ],
  );

  // Reset to page 1 when filters or tab change (so refetch shows first page). Skip when restoring saved state.
  useEffect(() => {
    if (isRestoringRef.current) {
      isRestoringRef.current = false;
      return;
    }
    setPage(1);
    if (activeCollectionTab === "streams") setStreamsPage(1);
  }, [
    sortOrder,
    activeCollectionTab,
    filterResetSignature,
    fromDate,
    toDate,
  ]);

  // Keep latest state in ref for save-on-unmount
  useEffect(() => {
    mediaLibraryStateRef.current = {
      activeCollectionTab,
      page,
      streamsPage,
      sortOrder,
      search,
      selectedClipId: selectedClip?.id,
      selectedMediaTypes,
      selectedCategories,
      selectedRatios,
      selectedRatings,
      selectedPlatforms,
      selectedPlayers,
      selectedActions,
      selectedTeams,
      selectedStreams,
      selectedClipStatus,
      selectedSources,
      selectedDownloadStatus,
      selectedSeasons,
      selectedCompetitions,
      selectedMatchDays,
      selectedMatchDates,
      selectedMatches,
      selectedVenues,
      fromDate,
      toDate,
      libraryPanelWidthPercent,
    };
  }, [activeCollectionTab, page, streamsPage, sortOrder, search, selectedClip?.id, selectedMediaTypes, selectedCategories, selectedRatios, selectedRatings, selectedPlatforms, selectedPlayers, selectedActions, selectedTeams, selectedStreams, selectedClipStatus, selectedSources, selectedDownloadStatus, selectedSeasons, selectedCompetitions, selectedMatchDays, selectedMatchDates, selectedMatches, selectedVenues, fromDate, toDate, libraryPanelWidthPercent]);

  // Save Media Library state on unmount and on beforeunload so back/reload restore to same tab, filters, page
  useEffect(() => {
    const save = () => {
      try {
        sessionStorage.setItem(MEDIA_LIBRARY_STATE_KEY, JSON.stringify(mediaLibraryStateRef.current));
      } catch {
        // ignore
      }
    };
    const onBeforeUnload = () => {
      if (!sessionStorage.getItem(NAVIGATING_AWAY_KEY)) save();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (sessionStorage.getItem(NAVIGATING_AWAY_KEY)) {
        sessionStorage.removeItem(NAVIGATING_AWAY_KEY);
        return;
      }
      save();
    };
  }, []);

  // Save state immediately before navigating to /clips/:id so it's definitely there when user presses back
  const saveMediaLibraryStateBeforeNavigate = useCallback(() => {
    try {
      const state = {
        activeCollectionTab,
        page,
        streamsPage,
        sortOrder,
        search,
        selectedClipId: selectedClip?.id,
        selectedMediaTypes,
        selectedCategories,
        selectedRatios,
        selectedRatings,
        selectedPlatforms,
        selectedPlayers,
        selectedActions,
        selectedTeams,
        selectedStreams,
        selectedClipStatus,
        selectedSources,
        selectedDownloadStatus,
        selectedSeasons,
        selectedCompetitions,
        selectedMatchDays,
        selectedMatchDates,
        selectedMatches,
        selectedVenues,
        fromDate,
        toDate,
        libraryPanelWidthPercent,
      };
      sessionStorage.setItem(MEDIA_LIBRARY_STATE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [activeCollectionTab, page, streamsPage, sortOrder, search, selectedClip?.id, selectedMediaTypes, selectedCategories, selectedRatios, selectedRatings, selectedPlatforms, selectedPlayers, selectedActions, selectedTeams, selectedStreams, selectedClipStatus, selectedSources, selectedDownloadStatus, selectedSeasons, selectedCompetitions, selectedMatchDays, selectedMatchDates, selectedMatches, selectedVenues, fromDate, toDate, libraryPanelWidthPercent]);

  const mediaLibraryFilterParams = useMemo(() => ({
    search: search.trim() || undefined,
    mediaTypes: selectedMediaTypes.length ? selectedMediaTypes : undefined,
    aspectRatio: selectedRatios.length ? selectedRatios : undefined,
    rating: selectedRatings.length ? selectedRatings.map((value) => value.replace(" Star", "")) : undefined,
    clipStatus: selectedClipStatus.length ? selectedClipStatus : undefined,
    downloadStatus: selectedDownloadStatus.length ? selectedDownloadStatus : undefined,
    category: selectedCategories.length ? selectedCategories : undefined,
    platform: selectedPlatforms.length ? selectedPlatforms : undefined,
    source: selectedSources.length ? selectedSources : undefined,
    players: selectedPlayers.length ? selectedPlayers : undefined,
    actions: selectedActions.length ? selectedActions : undefined,
    teams: selectedTeams.length ? selectedTeams : undefined,
    streams: selectedStreams.length ? selectedStreams : undefined,
    season: selectedSeasons.length ? selectedSeasons : undefined,
    competition: selectedCompetitions.length ? selectedCompetitions : undefined,
    matchDay: selectedMatchDays.length ? selectedMatchDays : undefined,
    matchDate: selectedMatchDates.length ? selectedMatchDates : undefined,
    matches: selectedMatches.length ? selectedMatches : undefined,
    venues: selectedVenues.length ? selectedVenues : undefined,
    startDate: fromDate || undefined,
    endDate: toDate || undefined,
  }), [
    search,
    selectedMediaTypes,
    selectedRatios,
    selectedRatings,
    selectedClipStatus,
    selectedDownloadStatus,
    selectedCategories,
    selectedPlatforms,
    selectedSources,
    selectedPlayers,
    selectedActions,
    selectedTeams,
    selectedStreams,
    selectedSeasons,
    selectedCompetitions,
    selectedMatchDays,
    selectedMatchDates,
    selectedMatches,
    selectedVenues,
    fromDate,
    toDate,
  ]);

  // Params for filter counts: pass League & Event in hierarchy order so backend returns hierarchical option lists.
  const mediaLibraryFilterCountsParams = useMemo(
    () => ({
      category: mediaLibraryFilterParams.category,
      competition: mediaLibraryFilterParams.competition,
      season: mediaLibraryFilterParams.season,
      matchDay: mediaLibraryFilterParams.matchDay,
      matchDate: mediaLibraryFilterParams.matchDate,
      matches: mediaLibraryFilterParams.matches,
      teams: mediaLibraryFilterParams.teams,
      venues: mediaLibraryFilterParams.venues,
    }),
    [
      mediaLibraryFilterParams.category,
      mediaLibraryFilterParams.competition,
      mediaLibraryFilterParams.season,
      mediaLibraryFilterParams.matchDay,
      mediaLibraryFilterParams.matchDate,
      mediaLibraryFilterParams.matches,
      mediaLibraryFilterParams.teams,
      mediaLibraryFilterParams.venues,
    ],
  );

  // Debounce filter params so multi-select triggers one fast request (400ms after last change).
  // Flush immediately when all filters are cleared so re-applying works without stale state.
  const [debouncedMediaLibraryFilterParams, setDebouncedMediaLibraryFilterParams] = useState(mediaLibraryFilterParams);
  useEffect(() => {
    const allEmpty = Object.values(mediaLibraryFilterParams).every(
      (v) => v === undefined || v === "" || (Array.isArray(v) && v.length === 0),
    );
    if (allEmpty) {
      setDebouncedMediaLibraryFilterParams(mediaLibraryFilterParams);
      return;
    }
    const t = setTimeout(() => setDebouncedMediaLibraryFilterParams(mediaLibraryFilterParams), 400);
    return () => clearTimeout(t);
  }, [mediaLibraryFilterParams]);

  // Debounce filter-counts params (200ms) so rapid league/event filter changes don't fire repeated counts requests.
  const [debouncedMediaLibraryFilterCountsParams, setDebouncedMediaLibraryFilterCountsParams] = useState(mediaLibraryFilterCountsParams);
  useEffect(() => {
    const allEmpty = Object.values(mediaLibraryFilterCountsParams).every(
      (v) => v === undefined || (Array.isArray(v) && v.length === 0),
    );
    if (allEmpty) {
      setDebouncedMediaLibraryFilterCountsParams(mediaLibraryFilterCountsParams);
      return;
    }
    const t = setTimeout(() => setDebouncedMediaLibraryFilterCountsParams(mediaLibraryFilterCountsParams), 200);
    return () => clearTimeout(t);
  }, [mediaLibraryFilterCountsParams]);

  // Reset to page 1 when filters change so apply/remove/re-apply always shows correct results
  const prevFilterKeyRef = useRef<string>("");
  useEffect(() => {
    const filterKey = JSON.stringify(mediaLibraryFilterParams);
    if (prevFilterKeyRef.current !== "" && prevFilterKeyRef.current !== filterKey) setPage(1);
    prevFilterKeyRef.current = filterKey;
  }, [mediaLibraryFilterParams]);

  const hasActiveMediaFilters = useMemo(
    () =>
      Boolean(
        mediaLibraryFilterParams.search ||
        mediaLibraryFilterParams.mediaTypes?.length ||
        mediaLibraryFilterParams.aspectRatio?.length ||
        mediaLibraryFilterParams.rating?.length ||
        mediaLibraryFilterParams.clipStatus?.length ||
        mediaLibraryFilterParams.downloadStatus?.length ||
        mediaLibraryFilterParams.category?.length ||
        mediaLibraryFilterParams.platform?.length ||
        mediaLibraryFilterParams.source?.length ||
        mediaLibraryFilterParams.players?.length ||
        mediaLibraryFilterParams.actions?.length ||
        mediaLibraryFilterParams.teams?.length ||
        mediaLibraryFilterParams.streams?.length ||
        mediaLibraryFilterParams.season?.length ||
        mediaLibraryFilterParams.competition?.length ||
        mediaLibraryFilterParams.matchDay?.length ||
        mediaLibraryFilterParams.matchDate?.length ||
        mediaLibraryFilterParams.matches?.length ||
        mediaLibraryFilterParams.venues?.length ||
        mediaLibraryFilterParams.startDate ||
        mediaLibraryFilterParams.endDate
      ),
    [mediaLibraryFilterParams],
  );

  // ── Fetch streams list when Match Streams tab is active, or when All Media is on a "stream" page (streams at end)
  useEffect(() => {
    const streamPages = Math.ceil((stats?.countStreams ?? 0) / pagination.limit);
    const mediaPages = Math.ceil(((stats?.countClips ?? 0) + (stats?.countHighlights ?? 0)) / pagination.limit);
    const streamPageRangeStart = mediaPages + 1;
    const streamPageRangeEnd = mediaPages + streamPages;
    const shouldFetchStreams =
      activeCollectionTab === "streams" ||
      (activeCollectionTab === "all" && !hasActiveMediaFilters && streamPages > 0 && page >= streamPageRangeStart && page <= streamPageRangeEnd);
    if (!shouldFetchStreams) return;
    const streamPage = activeCollectionTab === "streams" ? streamsPage : page - mediaPages;
    let cancelled = false;
    if (!useCachedDataRef.current) setStreamsLoading(true);
    const categoryParam = selectedCategories.length ? selectedCategories : undefined;
    getStreams({ page: streamPage, limit: pagination.limit, sortBy: "createdAt", sortOrder: "desc", category: categoryParam })
      .then((res: {
        status?: string;
        data?: {
          streams?: Array<{
            streamId: string;
            title: string;
            category: string;
            clipsCount: number;
            highlightsCount: number;
            videoThumbnailUrl?: string;
            createdAt?: string;
            status?: number;
          }>;
          pagination?: { page?: number; limit?: number; total?: number; pages?: number };
        };
      }) => {
        if (cancelled) return;
        if (res?.status === "success" && res?.data?.streams) {
          const list = res.data.streams;
          setStreamsList(list);
          cachedStreamsList = list;
          const p = res.data.pagination;
          if (p) {
            const next = {
              page: p.page ?? streamPage,
              limit: p.limit ?? pagination.limit,
              total: p.total ?? 0,
              totalPages: p.pages ?? Math.max(1, Math.ceil((p.total ?? 0) / (p.limit ?? pagination.limit))),
            };
            setStreamsPagination(next);
            cachedStreamsPagination = next;
            setLastStreamsTotal(p.total ?? null);
            setStreamsPaginationIsCurrent(true);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStreamsList([]);
          cachedStreamsList = [];
        }
      })
      .finally(() => {
        if (!cancelled) {
          setStreamsLoading(false);
          useCachedDataRef.current = false;
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activeCollectionTab, streamsPage, page, stats?.countStreams, pagination.limit, streamsRefreshKey, hasActiveMediaFilters, selectedCategories]);

  // When switching away from Match Streams, mark streams pagination as not current so we don't show stale count when switching back
  useEffect(() => {
    if (activeCollectionTab !== "streams") setStreamsPaginationIsCurrent(false);
  }, [activeCollectionTab]);

  const mediaTypeParam = useMemo(() => {
    if (activeCollectionTab === "clips") return "clip";
    if (activeCollectionTab === "highlights") return "highlight";
    return undefined;
  }, [activeCollectionTab]);

  useEffect(() => {
    let cancelled = false;
    getMediaLibraryStats()
      .then((statsRes) => {
        if (cancelled) return;
        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data);
          cachedStats = statsRes.data;
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [mediaLibraryRefreshKey]);

  useEffect(() => {
    let cancelled = false;
    getMediaLibraryFilterCounts({
      mediaType: mediaTypeParam,
      ...debouncedMediaLibraryFilterCountsParams,
    })
      .then((countsRes) => {
        if (cancelled) return;
        if (countsRes.success && countsRes.data) setFilterCounts(countsRes.data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [mediaTypeParam, debouncedMediaLibraryFilterCountsParams]);

  // ── Fetch media library list (when not on Match Streams), stats, filter counts
  // When All Media: only fetch media when page is past the stream pages (streams first, then media)
  useEffect(() => {
    if (activeCollectionTab === "streams") {
      setLoading(false);
      if (userId && !assetCountFetchedRef.current) {
        assetCountFetchedRef.current = true;
        dispatch(fetchBumpers({ userId, pageNo: 1, limit: 1 }));
        dispatch(fetchGraphics({ userId, pageNo: 1, limit: 1 }));
        dispatch(fetchOverlays({ userId, pageNo: 1, limit: 1 }));
      }
      return;
    }
    const streamPages = Math.ceil((stats?.countStreams ?? 0) / pagination.limit);
    const mediaPages = Math.ceil(((stats?.countClips ?? 0) + (stats?.countHighlights ?? 0)) / pagination.limit);
    // Only skip list fetch when we have stats and page is past media (stream-only page); otherwise first load would never fetch list
    if (activeCollectionTab === "all" && !hasActiveMediaFilters && stats != null && page > mediaPages) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchIdRef.current += 1;
    const thisFetchId = fetchIdRef.current;
    const mediaPage =
      activeCollectionTab === "all"
        ? (hasActiveMediaFilters ? page : (page <= mediaPages ? page : 1))
        : page;
    const run = async () => {
      if (hasActiveMediaFilters || !useCachedDataRef.current) setLoading(true);
      setError(null);
      try {
        // 1) Load media-library list first so list and count appear together (no count with empty grid)
        const listRes = await getMediaLibrary({
          page: mediaPage,
          limit: pagination.limit,
          sortBy: sortOrder === "Newest" ? "latest" : "oldest",
          mediaType: mediaTypeParam,
          ...debouncedMediaLibraryFilterParams,
        });
        if (cancelled || thisFetchId !== fetchIdRef.current) return;
        if (listRes.success && listRes.items) {
          const newItems = listRes.items.map((i: MediaLibraryItem) => toMediaItemData(i));
          setMediaItems(newItems);
          cachedMediaItems = newItems;
          setPagination((prev) => ({ ...prev, ...listRes.pagination }));
          cachedPagination = { ...cachedPagination, ...listRes.pagination };
          if (activeCollectionTab !== "all") setPage(listRes.pagination?.page ?? 1);
          const total = listRes.pagination?.total ?? null;
          const tabForThisFetch: CollectionTab = mediaTypeParam === "clip" ? "clips" : mediaTypeParam === "highlight" ? "highlights" : "all";
          setPaginationForTab(tabForThisFetch);
          if (mediaTypeParam === "clip") setLastClipsTotal(total);
          if (mediaTypeParam === "highlight") setLastHighlightsTotal(total);
        }
        // After first load, fetch asset counts so Assets tab badge is correct
        if (userId && !assetCountFetchedRef.current) {
          assetCountFetchedRef.current = true;
          dispatch(fetchBumpers({ userId, pageNo: 1, limit: 1 }));
          dispatch(fetchGraphics({ userId, pageNo: 1, limit: 1 }));
          dispatch(fetchOverlays({ userId, pageNo: 1, limit: 1 }));
        }
      } catch (e: unknown) {
        if (!cancelled && thisFetchId === fetchIdRef.current) {
          setError(e instanceof Error ? e.message : "Failed to load media library");
          setMediaItems([]);
          cachedMediaItems = [];
        }
      } finally {
        if (!cancelled && thisFetchId === fetchIdRef.current) {
          setLoading(false);
          useCachedDataRef.current = false;
        }
      }
    };
    run();
    // Note: loading is cleared after list + stats; filter counts update when they arrive (non-blocking)
    return () => {
      cancelled = true;
    };
  }, [
    page,
    pagination.limit,
    sortOrder,
    activeCollectionTab,
    hasActiveMediaFilters,
    debouncedMediaLibraryFilterParams,
    mediaLibraryRefreshKey,
    userId,
    dispatch,
    mediaTypeParam,
  ]);

  // ── Poll media library while any clip/highlight is processing (live progress updates)
  const hasProcessingItems = useMemo(
    () =>
      mediaItems.some(
        (m) =>
          (m.downloadStatus || "").toUpperCase() === "PROCESSING" ||
          (m.clipStatus || "").toUpperCase() === "PROCESSING",
      ),
    [mediaItems],
  );
  useEffect(() => {
    if (!hasProcessingItems) return;
    const interval = setInterval(() => {
      setMediaLibraryRefreshKey((k) => k + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, [hasProcessingItems]);

  // ── Real assets from Redux (same source as /assets page): bumpers + graphics + overlays
  const totalAssetsCount = (bumpers.totalLength ?? 0) + (graphics.totalLength ?? 0) + (overlays.totalLength ?? 0);
  const assetsAsMediaItems = useMemo(() => {
    const list: MediaItemData[] = [];
    (bumpers.data || []).forEach((a) => list.push(assetToMediaItemData(a, "bumper")));
    (graphics.data || []).forEach((a) => list.push(assetToMediaItemData(a, "graphic")));
    (overlays.data || []).forEach((a) => list.push(assetToMediaItemData(a, "overlay")));
    list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    return list;
  }, [bumpers.data, graphics.data, overlays.data]);

  // ── Collection tab counts: use last-known total per tab so counts don't fluctuate when switching tabs
  // Only use pagination.total for the active tab when it actually belongs to that tab (paginationForTab === activeTab)
  const tabCounts = useMemo(() => {
    const counts: Partial<Record<CollectionTab, number>> = {};
    const clipsTotal = activeCollectionTab === "clips" && paginationForTab === "clips"
      ? (pagination.total ?? lastClipsTotal ?? stats?.countClips ?? 0)
      : (lastClipsTotal ?? stats?.countClips ?? 0);
    const highlightsTotal = activeCollectionTab === "highlights" && paginationForTab === "highlights"
      ? (pagination.total ?? lastHighlightsTotal ?? stats?.countHighlights ?? 0)
      : (lastHighlightsTotal ?? stats?.countHighlights ?? 0);
    counts.clips = clipsTotal;
    counts.highlights = highlightsTotal;
    counts.streams = activeCollectionTab === "streams" && streamsPaginationIsCurrent
      ? (streamsPagination.total ?? lastStreamsTotal ?? stats?.countStreams ?? 0)
      : (lastStreamsTotal ?? stats?.countStreams ?? 0);
    counts.assets = totalAssetsCount;
    const imageTypes = COLLECTION_TAB_MEDIA_MAP.images;
    counts.images = mediaItems.filter(
      (item) => !item.videoUrl && item.mediaType && imageTypes?.includes(item.mediaType),
    ).length;
    counts.all = (counts.clips ?? 0) + (counts.highlights ?? 0) + (counts.streams ?? 0) + (counts.assets ?? 0) + (counts.images ?? 0);
    return counts;
  }, [stats, activeCollectionTab, pagination.total, paginationForTab, streamsPagination.total, streamsPaginationIsCurrent, lastClipsTotal, lastHighlightsTotal, lastStreamsTotal, totalAssetsCount, mediaItems]);

  // ── Derived filter options from API counts (API-first, item fallback only when needed)
  // Important: every dropdown must show the FULL option list (never filter to only selected values) so users can select multiple options.
  const mediaTypeOptions = useMemo(
    () =>
      COLLECTION_TAB_MEDIA_TYPES[activeCollectionTab].map((value) => ({
        value,
        label: value,
        count: 0,
      })),
    [activeCollectionTab],
  );
  const ratioOptions = useMemo(
    () =>
      mergeFacetOptions({
        apiOptions: (filterCounts?.aspectRatios ?? []).map((entry) => ({
          value: entry.aspectRatio,
          count: entry.count,
        })),
      }),
    [filterCounts],
  );
  // Options from API: only count > 0, counts are DB-level (not narrowed by current selection).
  const ratingOptions = useMemo(
    () =>
      mergeFacetOptions({
        apiOptions: (filterCounts?.ratings ?? []).map((entry) => ({
          value: `${entry.rating} Star`,
          count: entry.count,
        })),
        sort: (a, b) => Number(b.value.replace(" Star", "")) - Number(a.value.replace(" Star", "")),
      }),
    [filterCounts],
  );
  const platformOptions = useMemo(() => {
    const fromApi = mergeFacetOptions({
      apiOptions: (filterCounts?.platforms ?? []).map((entry) => ({
        value: entry.platform,
        count: entry.count,
      })),
    });
    return fromApi.length > 0
      ? fromApi
      : PLATFORM_OPTIONS.map((value) => ({ value: String(value), label: String(value), count: 0 }));
  }, [filterCounts]);

  const playerOptions = useMemo(
    () =>
      mergeFacetOptions({
        apiOptions: (filterCounts?.players ?? []).map((entry) => ({
          value: entry.player,
          count: entry.count,
        })),
        fallbackValues: [],
      }),
    [filterCounts],
  );
  // Actions (events): only show what's in Settings → Events (API sends event list only). No fallback from current items.
  const actionOptions = useMemo(
    () =>
      mergeFacetOptions({
        apiOptions: (filterCounts?.actions ?? []).map((entry) => ({
          value: entry.action,
          count: entry.count,
        })),
        fallbackValues: [],
      }),
    [filterCounts],
  );
  const teamOptions = useMemo(
    () =>
      mergeFacetOptions({
        apiOptions: (filterCounts?.teams ?? []).map((entry) => ({
          value: entry.team,
          count: entry.count,
        })),
        fallbackValues: mediaItems.flatMap((item) => item.teams ?? []),
      }),
    [filterCounts, mediaItems],
  );
  const streamOptions = useMemo(
    () =>
      mergeFacetOptions({
        apiOptions: (filterCounts?.streams ?? []).map((entry) => ({
          value: entry.stream,
          count: entry.count,
        })),
      }),
    [filterCounts],
  );
  const seasonOptions = useMemo(
    () =>
      mergeFacetOptions({
        apiOptions: (filterCounts?.seasons ?? []).map((entry) => ({
          value: entry.season,
          count: entry.count,
        })),
        fallbackValues: mediaItems.map((item) => item.season),
        sort: sortFacetValuesDescending,
      }),
    [filterCounts, mediaItems],
  );
  const competitionOptions = useMemo(
    () =>
      mergeFacetOptions({
        apiOptions: (filterCounts?.competitions ?? []).map((entry) => ({
          value: entry.competition,
          count: entry.count,
        })),
        fallbackValues: mediaItems.map((item) => item.competition ?? ""),
      }),
    [filterCounts, mediaItems],
  );
  const matchDayOptions = useMemo(
    () =>
      mergeFacetOptions({
        apiOptions: (filterCounts?.matchDays ?? []).map((entry) => ({
          value: entry.matchDay,
          count: entry.count,
        })),
        fallbackValues: mediaItems.map((item) => ("matchDay" in item ? item.matchDay ?? "" : "")),
      }),
    [filterCounts, mediaItems],
  );
  const venueOptions = useMemo(
    () =>
      mergeFacetOptions({
        apiOptions: (filterCounts?.venues ?? []).map((entry) => ({
          value: entry.venue,
          count: entry.count,
        })),
        fallbackValues: mediaItems.map((item) => item.venue),
      }),
    [filterCounts, mediaItems],
  );
  const downloadStatusOptions = useMemo(
    () =>
      mergeFacetOptions({
        apiOptions: ((filterCounts?.downloadStatuses ?? filterCounts?.statuses) ?? []).map((entry) => ({
          value: entry.status,
          count: entry.count,
        })),
      }),
    [filterCounts],
  );
  const clipStatusOptions = useMemo(
    () =>
      mergeFacetOptions({
        apiOptions: ((filterCounts?.clipStatuses ?? filterCounts?.statuses) ?? []).map((entry) => ({
          value: entry.status,
          count: entry.count,
        })),
      }),
    [filterCounts],
  );
  const sourceOptions = useMemo(
    () =>
      mergeFacetOptions({
        apiOptions: (filterCounts?.sources ?? []).map((entry) => ({
          value: entry.source,
          count: entry.count,
        })),
      }),
    [filterCounts],
  );
  const HIDDEN_SPORTS = new Set(["vollyball"]);
  const sportOptions = useMemo(
    () =>
      mergeFacetOptions({
        apiOptions: (filterCounts?.categories ?? [])
          .filter((entry) => !HIDDEN_SPORTS.has(entry.category.toLowerCase()))
          .map((entry) => ({
            value: entry.category,
            count: entry.count,
          })),
        fallbackValues: mediaItems
          .map((item) => item.category)
          .filter((c) => !HIDDEN_SPORTS.has(c.toLowerCase())),
        formatLabel: (value) =>
          value === "football"
            ? "Football"
            : value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(),
      }),
    [filterCounts, mediaItems],
  );

  const filterAvailability = useMemo(
    () =>
      new Set<FilterId>([
        "category",
        "mediaType",
        "ratio",
        "rating",
        "clipStatus",
        "platform",
        "source",
        "players",
        "actions",
        "teams",
        "streams",
        "venues",
        "downloadStatus",
        "seasons",
        "competition",
        "matchDay",
        "date",
        "matches",
      ]),
    [],
  );

  const availableFilterOptions = useMemo(
    () => ALL_FILTER_OPTIONS.filter((i) => filterAvailability.has(i.id)),
    [filterAvailability],
  );

  const seasonScopedData = useMemo(() => {
    if (!selectedSeasons.length) return mediaItems;
    return mediaItems.filter((i) => selectedSeasons.includes(i.season));
  }, [selectedSeasons, mediaItems]);

  const availableMatchDateOptions = useMemo(
    () =>
      mergeFacetOptions({
        apiOptions: (filterCounts?.matchDates ?? []).map((entry) => ({
          value: entry.matchDate,
          count: entry.count,
        })),
        fallbackValues: seasonScopedData.map((item) => item.matchDate),
        formatLabel: (value) => formatDate(value) || value,
        sort: sortFacetValuesDescending,
      }),
    [filterCounts, seasonScopedData],
  );

  const availableMatchGroups = useMemo<MatchGroupOption[]>(() => {
    const filteredByDate = selectedMatchDates.length
      ? seasonScopedData.filter((item) => selectedMatchDates.includes(item.matchDate))
      : seasonScopedData;

    const grouped = new Map<string, Map<string, FacetOption>>();
    const upsertMatch = (date: string, matchName: string, count: number, keepExisting = true) => {
      const normalizedDate = String(date ?? "").trim();
      const normalizedMatchName = normalizeMatchName(matchName || "");
      if (!normalizedMatchName) return;
      if (selectedMatchDates.length && normalizedDate && !selectedMatchDates.includes(normalizedDate)) return;
      const matches = grouped.get(normalizedDate) ?? new Map<string, FacetOption>();
      if (matches.has(normalizedMatchName) && keepExisting) {
        grouped.set(normalizedDate, matches);
        return;
      }
      matches.set(normalizedMatchName, {
        value: normalizedMatchName,
        label: normalizedMatchName,
        count,
      });
      grouped.set(normalizedDate, matches);
    };

    (filterCounts?.matches ?? []).forEach((option) => {
      upsertMatch(option.matchDate ?? "", option.matchName ?? "", option.count);
    });

    const fallbackGroups = new Map<string, Map<string, number>>();
    filteredByDate.forEach((item) => {
      const normalizedDate = String(item.matchDate ?? "").trim();
      const normalizedMatchName = normalizeMatchName(item.matchName || "");
      if (!normalizedMatchName) return;
      const counts = fallbackGroups.get(normalizedDate) ?? new Map<string, number>();
      counts.set(normalizedMatchName, (counts.get(normalizedMatchName) ?? 0) + 1);
      fallbackGroups.set(normalizedDate, counts);
    });

    fallbackGroups.forEach((matches, date) => {
      matches.forEach((count, matchName) => {
        upsertMatch(date, matchName, count);
      });
    });

    return [...grouped.entries()]
      .map(([date, matches]) => ({
        date,
        label: date ? formatDate(date) : "Unknown date",
        count: [...matches.values()].reduce((total, match) => total + match.count, 0),
        matches: [...matches.values()].sort(sortFacetAlphabetically),
      }))
      .filter((group) => group.matches.length > 0)
      .sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return b.date.localeCompare(a.date);
      });
  }, [filterCounts?.matches, seasonScopedData, selectedMatchDates]);

  // ── Client-side post-processing: only keep synthetic tab slicing here.
  // Assets tab: use real assets from Redux (bumpers + graphics + overlays), same as /assets page; paginate by current page
  const filteredMedia = useMemo(() => {
    if (activeCollectionTab === "assets") {
      const limit = pagination.limit || 20;
      const start = (page - 1) * limit;
      return assetsAsMediaItems.slice(start, start + limit);
    }
    let filtered = mediaItems;
    const tabNeedsClientFilter = activeCollectionTab === "images";
    if (tabNeedsClientFilter) {
      const backendTypes = COLLECTION_TAB_MEDIA_MAP[activeCollectionTab];
      if (backendTypes?.length) {
        filtered = filtered.filter((item) => item.mediaType && backendTypes.includes(item.mediaType));
      }
      filtered = filtered.filter((item) => !item.videoUrl);
    }
    return filtered;
  }, [mediaItems, activeCollectionTab, assetsAsMediaItems, page, pagination.limit]);

  const currentTabCount = (
    activeCollectionTab === "all" && hasActiveMediaFilters
      ? pagination.total
      : (tabCounts[activeCollectionTab] ?? 0)
  ) as number;
  // Show content when tab has items OR when filters are active (so we can show empty state when 0 results)
  const showMainLibraryContent = currentTabCount > 0 || (activeCollectionTab === "all" && hasActiveMediaFilters);

  // When on Assets tab, show loading while bumpers/graphics/overlays are fetching
  const assetsLoading = bumpers.loading || graphics.loading || overlays.loading;
  const effectiveLoading = activeCollectionTab === "assets" ? assetsLoading : loading;

  // All Media: media (clips + highlights) first, then streams at the end.
  const allMediaMediaPages = Math.ceil(((stats?.countClips ?? 0) + (stats?.countHighlights ?? 0)) / pagination.limit);
  const allMediaStreamPages = Math.ceil((stats?.countStreams ?? 0) / pagination.limit);

  // Pagination display: All Media uses combined total; when no filters, total pages = media pages + stream pages
  const effectivePagination = useMemo(() => {
    const tabNeedsClientFilter = ["images", "assets"].includes(activeCollectionTab);
    let total: number;
    let totalPages: number;
    if (activeCollectionTab === "all") {
      if (hasActiveMediaFilters) {
        total = pagination.total ?? 0;
        totalPages = total === 0 ? 1 : Math.max(1, Math.ceil(total / pagination.limit));
      } else {
        total = tabCounts.all ?? 0;
        totalPages = Math.max(1, allMediaMediaPages + allMediaStreamPages);
      }
    } else if (tabNeedsClientFilter) {
      total = tabCounts[activeCollectionTab] ?? 0;
      totalPages = total === 0 ? 1 : Math.max(1, Math.ceil(total / pagination.limit));
    } else {
      total = pagination.total ?? 0;
      totalPages = total === 0 ? 1 : Math.max(1, Math.ceil(total / pagination.limit));
    }
    return { total, totalPages };
  }, [activeCollectionTab, tabCounts, pagination.total, pagination.limit, hasActiveMediaFilters, allMediaMediaPages, allMediaStreamPages]);

  // ── Filter chips
  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    const add = (
      key: string,
      filterId: FilterId,
      values: string[],
      setter: (fn: (p: string[]) => string[]) => void,
    ) => {
      values.forEach((v) =>
        chips.push({
          key: `${key}-${v}`,
          label: `${formatFilterLabel(filterId)}: ${v}`,
          onRemove: () => setter((p) => p.filter((x) => x !== v)),
        }),
      );
    };
    add("category", "category", selectedCategories, setSelectedCategories);
    add("mediaType", "mediaType", selectedMediaTypes, setSelectedMediaTypes);
    add("ratio", "ratio", selectedRatios, setSelectedRatios);
    add("rating", "rating", selectedRatings, setSelectedRatings);
    add("clipStatus", "clipStatus", selectedClipStatus, setSelectedClipStatus);
    add("platform", "platform", selectedPlatforms, setSelectedPlatforms);
    add("source", "source", selectedSources, setSelectedSources);
    add("players", "players", selectedPlayers, setSelectedPlayers);
    add("actions", "actions", selectedActions, setSelectedActions);
    add("teams", "teams", selectedTeams, setSelectedTeams);
    add("streams", "streams", selectedStreams, setSelectedStreams);
    add("seasons", "seasons", selectedSeasons, setSelectedSeasons);
    add("competition", "competition", selectedCompetitions, setSelectedCompetitions);
    add("matchDay", "matchDay", selectedMatchDays, setSelectedMatchDays);
    add("venues", "venues", selectedVenues, setSelectedVenues);
    add("downloadStatus", "downloadStatus", selectedDownloadStatus, setSelectedDownloadStatus);
    if (visibleFilters.includes("date")) {
      selectedMatchDates.forEach((v) =>
        chips.push({
          key: `date-${v}`,
          label: `Date: ${formatDate(v)}`,
          onRemove: () =>
            setSelectedMatchDates((p) => p.filter((x) => x !== v)),
        }),
      );
      if (fromDate)
        chips.push({
          key: "fromDate",
          label: `From: ${formatDate(fromDate)}`,
          onRemove: () => setFromDate(""),
        });
      if (toDate)
        chips.push({
          key: "toDate",
          label: `To: ${formatDate(toDate)}`,
          onRemove: () => setToDate(""),
        });
    }
    if (visibleFilters.includes("matches")) {
      selectedMatches.forEach((v) =>
        chips.push({
          key: `matches-${v}`,
          label: `Matches: ${v}`,
          onRemove: () => setSelectedMatches((p) => p.filter((x) => x !== v)),
        }),
      );
    }
    return chips;
  }, [
    visibleFilters,
    fromDate,
    selectedCategories,
    selectedActions,
    selectedClipStatus,
    selectedDownloadStatus,
    selectedMatchDays,
    selectedMatchDates,
    selectedMatches,
    selectedMediaTypes,
    selectedPlatforms,
    selectedPlayers,
    selectedRatings,
    selectedRatios,
    selectedSeasons,
    selectedCompetitions,
    selectedStreams,
    selectedSources,
    selectedTeams,
    selectedVenues,
    toDate,
  ]);

  // ── Handlers
  const toggleSelection = useCallback(
    (current: string[], setCurrent: (v: string[]) => void, value: string) => {
      setCurrent(
        current.includes(value)
          ? current.filter((i) => i !== value)
          : [...current, value],
      );
    },
    [],
  );

  // Close filter dropdown when clicking outside
  useEffect(() => {
    if (!activePanel) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".filter-panel") && !target.closest(".filter-trigger")) {
        setActivePanel(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activePanel]);

  const clearAllFilters = useCallback(() => {
    setSearch("");
    setSelectedMediaTypes([]);
    setSelectedCategories([]);
    setSelectedRatios([]);
    setSelectedRatings([]);
    setSelectedClipStatus([]);
    setSelectedPlatforms([]);
    setSelectedSources([]);
    setSelectedPlayers([]);
    setSelectedActions([]);
    setSelectedTeams([]);
    setSelectedStreams([]);
    setSelectedSeasons([]);
    setSelectedCompetitions([]);
    setSelectedMatchDays([]);
    setSelectedMatchDates([]);
    setSelectedMatches([]);
    setSelectedVenues([]);
    setSelectedDownloadStatus([]);
    setFromDate("");
    setToDate("");
    setPage(1);
    setActivePanel(null);
    prevFilterKeyRef.current = "";
  }, []);

  const toggleItemSelection = useCallback((id: string, itemData?: MediaItemData) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setSelectedItemsData((data) => {
          const nextData = { ...data };
          delete nextData[id];
          return nextData;
        });
      } else {
        next.add(id);
        if (itemData) {
          setSelectedItemsData((data) => ({ ...data, [id]: itemData }));
        }
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    const ids = filteredMedia.map((i) => i.id);
    setSelectedItems(new Set(ids));
    setSelectedItemsData((prev) => {
      const next = { ...prev };
      filteredMedia.forEach((i) => (next[i.id] = i));
      return next;
    });
  }, [filteredMedia]);

  const handleClearSelection = useCallback(() => {
    setSelectedItems(new Set());
    setSelectedItemsData({});
    setSelectMode(false);
  }, []);

  const handleDeleteHighlightFromCard = useCallback((item: MediaItemData) => {
    if (item.type !== "highlight") return;
    setHighlightToDeleteFromCard(item);
  }, []);

  const executeDeleteHighlightFromCard = useCallback(async (item: MediaItemData) => {
    try {
      const res = await deleteFolder(item.id);
      if (res?.success !== false) {
        toast.success("Highlight and its clips deleted");
        if (selectedClip?.id === item.id) setSelectedClip(null);
        setSelectedItems((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
        selectedItemsCacheRef.current.delete(item.id);
        setMediaItems((prev) => prev.filter((m) => m.id !== item.id));
        setMediaLibraryRefreshKey((k) => k + 1);
      } else {
        toast.error(res?.message ?? "Failed to delete highlight");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete highlight");
    } finally {
      setHighlightToDeleteFromCard(null);
    }
  }, [selectedClip?.id]);

  const handleGenerateClip = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (selectedItems.size === 0) {
      toast.error("Select at least one clip first.");
      return;
    }
    setShowPreview(false);
    setIsCreateHighlightModalOpen(true);
  }, [selectedItems]);

  const user = useAppSelector(selectUser);

  const handleCreateHighlightSubmit = useCallback(
    async (data: NewHighlightFormData) => {
      if (!user?.userId || selectedItems.size === 0) {
        toast.error("Please sign in and select at least one clip.");
        return;
      }
      const cache = selectedItemsCacheRef.current;
      const selectedList = Array.from(selectedItems)
        .map((id) => cache.get(id))
        .filter(Boolean) as MediaItemData[];
      const clipOnly = selectedList.filter((i) => i.type === "clip");
      const idsToAdd = clipOnly.length > 0 ? clipOnly : selectedList;
      if (idsToAdd.length === 0) {
        toast.error("Only clips can be added to a highlight. Selected items include no clips.");
        return;
      }
      const streamId = idsToAdd[0].streamId;
      const category = idsToAdd[0].category || "";
      if (!streamId) {
        toast.error("Selected clips must have a stream.");
        return;
      }
      try {
        const createPayload = {
          aspectRatio: data.aspectRatio,
          userId: user.userId,
          streamId,
          title: data.title.trim(),
          type: "highlight" as const,
          category,
        };
        const folderRes = await createFolder(createPayload);
        if (!folderRes?.success || !folderRes?.data?._id) {
          toast.error(folderRes?.message || "Failed to create highlight folder");
          return;
        }
        const sorted = [...idsToAdd].sort((a, b) =>
          (a.createdAt || "").localeCompare(b.createdAt || ""),
        );
        const updateRes = await updateFolder(folderRes.data._id, {
          clips: sorted.map((c) => c.id),
        });
        if (!updateRes?.success) {
          toast.error("Folder created but failed to add clips.");
          return;
        }
        toast.success("Highlight created successfully!");
        setSelectedItems(new Set());
        setSelectedItemsData({});
        setSelectMode(false);
        window.open(`/editor-page/${folderRes.data._id}`, "_blank");
        // Modal closes itself after showing "Redirecting..." (no setIsCreateHighlightModalOpen here)
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed to create highlight");
      }
    },
    [user?.userId, selectedItems],
  );

  const handlePreviewSelected = useCallback(() => {
    setShowPreview((prev) => !prev);
  }, []);

  // ── Render helpers
  const renderMultiSelectPanel = (
    label: string,
    items: FacetOption[],
    selected: string[],
    onToggle: (value: string) => void,
    options?: { filterId?: FilterId; showSearch?: boolean; hideCount?: boolean },
  ) => {
    const filterId = options?.filterId;
    const showSearch = options?.showSearch ?? false;
    const hideCount = options?.hideCount ?? false;
    const searchQuery = filterId ? (filterSearch[filterId] ?? "").trim().toLowerCase() : "";
    const filteredItems = showSearch && searchQuery
      ? items.filter((item) => item.label.toLowerCase().includes(searchQuery))
      : items;
    return (
      <div className="filter-panel absolute left-0 top-12 z-30 w-[300px] rounded-xl border border-[#252525] bg-[#18191B] shadow-2xl">
        <div className="border-b border-[#252525] px-4 py-3 text-sm font-semibold text-white">
          {label}
        </div>
        {showSearch && (
          <div className="border-b border-[#252525] px-3 py-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={filterId ? (filterSearch[filterId] ?? "") : ""}
                onChange={(e) => {
                  if (!filterId) return;
                  setFilterSearch((prev) => ({ ...prev, [filterId]: e.target.value }));
                }}
                placeholder="Search..."
                className="w-full rounded-lg border border-[#2A2A2A] bg-[#18191B] py-2 pl-8 pr-3 text-sm text-white placeholder-gray-500 outline-none focus:border-[#00EEFF]/50"
              />
            </div>
          </div>
        )}
        <div className="max-h-72 space-y-1 overflow-auto px-3 py-2 custom-scrollbar">
          {filteredItems.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onToggle(item.value)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-gray-300 hover:bg-[#1A1B1D] hover:text-white transition-colors"
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded border ${selected.includes(item.value)
                    ? "border-[#00EEFF] bg-[#00EEFF]"
                    : "border-[#4A4D54] bg-transparent"
                  }`}
              >
                {selected.includes(item.value) && (
                  <Check className="h-3 w-3 text-black" />
                )}
              </span>
              <span className="truncate">{item.label}</span>
              {!hideCount && item.count > 0 ? (
                <span className="ml-auto shrink-0 text-[11px] text-gray-500 tabular-nums">{item.count}</span>
              ) : null}
            </button>
          ))}
          {showSearch && searchQuery && filteredItems.length === 0 && (
            <div className="py-4 text-center text-sm text-gray-500">No matches</div>
          )}
        </div>
      </div>
    );
  };

  const FilterTrigger = ({
    id,
    label,
    valueLabel,
    disabled,
  }: {
    id: string;
    label: string;
    valueLabel?: string;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && setActivePanel(activePanel === id ? null : id)}
      className={`filter-trigger inline-flex h-8 w-full items-center justify-between gap-1.5 rounded-lg border border-[#252525] bg-[#1A1B1D] px-2.5 text-xs text-gray-300 transition-all duration-200 ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[#252525] hover:text-white"} ${activePanel === id ? "border-[#333] text-white" : ""}`}
    >
      <span className="flex items-center gap-1.5 min-w-0">
        <span>{label}</span>
        {valueLabel ? <span className="max-w-20 truncate text-[10px] text-gray-400">{valueLabel}</span> : null}
      </span>
      <ChevronDown className={`h-3 w-3 shrink-0 text-gray-500 transition-transform duration-200 ${activePanel === id ? "rotate-180" : ""}`} />
    </button>
  );

  const metadataOnlyFilterIds = new Set<FilterId>([
    "category",
    "players",
    "teams",
    "streams",
    "seasons",
    "competition",
    "matchDay",
    "date",
    "matches",
    "venues",
  ]);

  // Assets keep the existing ratio-only behavior. Images explicitly disable metadata-only filters.
  const assetsFilterDisabled = (filterId: FilterId) => {
    if (activeCollectionTab === "assets") return filterId !== "ratio";
    if (activeCollectionTab === "images") return metadataOnlyFilterIds.has(filterId);
    if (activeCollectionTab === "streams") return true;
    return false;
  };

  // ── Filter rendering helper
  const renderFilter = (
    filterId: FilterId,
    items: FacetOption[],
    selected: string[],
    setSelected: (v: string[]) => void,
    panelLabel: string,
    options?: { showSearch?: boolean; disabled?: boolean; hideCount?: boolean },
  ) =>
    visibleFilters.includes(filterId) &&
    filterAvailability.has(filterId) && (
      <div className="relative" key={filterId}>
        <FilterTrigger
          id={filterId}
          label={formatFilterLabel(filterId)}
          valueLabel={
            selected.length ? `${selected.length} selected` : undefined
          }
          disabled={options?.disabled ?? assetsFilterDisabled(filterId)}
        />
        {activePanel === filterId &&
          !assetsFilterDisabled(filterId) &&
          renderMultiSelectPanel(panelLabel, items, selected, (value) =>
            toggleSelection(selected, setSelected, value),
            { filterId, showSearch: options?.showSearch, hideCount: options?.hideCount },
          )}
      </div>
    );

  // ── Grid class based on view mode
  const gridCls =
    viewMode === "grid"
      ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      : viewMode === "list"
        ? "flex flex-col gap-2"
        : "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

  const selectedPreviewItems = useMemo(() => {
    const cache = selectedItemsCacheRef.current;
    return Array.from(selectedItems)
      .map((id) => cache.get(id))
      .filter(Boolean) as MediaItemData[];
  }, [selectedItems]);

  useEffect(() => {
    const cache = selectedItemsCacheRef.current;
    if (cache.size <= 300) return;
    const keep = new Set(selectedItems);
    filteredMedia.forEach((i) => keep.add(i.id));
    for (const id of Array.from(cache.keys())) {
      if (!keep.has(id)) cache.delete(id);
    }
  }, [filteredMedia, selectedItems]);

  const totalDurationLabel = useMemo(() => {
    const toSeconds = (label: string) => {
      const s = (label || "").trim();
      if (!s) return 0;
      const parts = s.split(":").map(Number);
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
      if (parts.length === 2) return parts[0] * 60 + parts[1];
      return Number(s) || 0;
    };
    const totalSec = selectedPreviewItems.reduce((acc, i) => acc + toSeconds(i.durationLabel || ""), 0);
    const m = Math.floor(totalSec / 60);
    const h = Math.floor(m / 60);
    const mm = m % 60;
    const ss = Math.floor(totalSec % 60);
    if (h > 0) return `${h}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
    return `${mm}:${String(ss).padStart(2, "0")}`;
  }, [selectedPreviewItems]);

  /* ═══════════════════════════════════════════
     JSX
     ═══════════════════════════════════════════ */

  return (
    <div className="flex h-screen overflow-hidden bg-[#18191B] font-montserrat text-white tracking-wide">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* ── HEADER: left-aligned title, not touching top; no grey ───────────────────────────── */}
        <header className="shrink-0 border-b border-[#252525] bg-[#18191B] px-6 pt-5 pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {selectedClip && (
                <button
                  type="button"
                  onClick={() => setSelectedClip(null)}
                  className="flex items-center justify-center w-9 h-9 rounded-lg border border-[#252525] bg-[#1A1B1D] text-gray-300 hover:bg-[#252525] hover:text-white transition-all shrink-0"
                  aria-label="Back to Media Library"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <h1 className="text-base font-semibold tracking-tight text-white text-left mt-2">
                Media Library
              </h1>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {/* Select mode toggle */}
              <button
                onClick={() => {
                  setSelectMode(!selectMode);
                  if (selectMode) setSelectedItems(new Set());
                }}
                className={`inline-flex items-center justify-center gap-2 h-9 rounded-lg border px-4 text-xs font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${selectMode
                    ? "border-transparent text-white"
                    : "border-[#252525] bg-[#1A1B1D] text-gray-300 hover:bg-[#1E1E20] hover:text-white hover:border-[#333]"
                  }`}
                style={selectMode ? { background: "linear-gradient(135deg, #00EEFF 0%, #0051FF 100%)" } : undefined}
              >
                <MousePointerClick className="h-3.5 w-3.5" />
                {selectMode ? "Exit Select" : "Select"}
              </button>
              <button
                type="button"
                onClick={() => setIsAddVideoModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 h-10 rounded-lg px-4 text-sm font-semibold text-white transition-all duration-200 hover:opacity-95 hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #00BBFF 0%, #0051FF 100%)" }}
              >
                <Plus className="h-4 w-4" />
                Add video feed
              </button>
            </div>
          </div>
        </header>

        {/* ── MAIN CONTENT (scrollable) ───────── */}
        <main className={`relative flex-1 flex flex-col min-h-0 ${selectedClip ? "overflow-hidden" : "overflow-auto custom-scrollbar"}`}>
          {/* ── Sticky: Search + Filter, Sort, View — only on main library view; in detail view these move to right panel ───── */}
          {!selectedClip && (
            <>
              <div className="sticky top-0 z-20 flex flex-col border-b border-[#252525] bg-[#18191B]">
                {/* Row 1: Search + Filter toggle + Sort + View toggle */}
                <div className="flex items-center gap-2 px-4 py-2.5">
                  <div className="relative flex-1 min-w-0">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by title, player, match, stream, or team"
                      className="h-9 w-full rounded-lg border border-[#252525] bg-[#18191B] pl-8 pr-3 text-xs text-white placeholder:text-gray-600 outline-none focus:border-[#00EEFF]/50 focus:ring-1 focus:ring-[#00EEFF]/20 transition-colors"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setFilterSectionVisible((v) => !v)}
                    className={`relative inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-all ${activeFilterChips.length > 0 ? "border-[#333] bg-[#1A1B1D] text-gray-300" : "border-[#252525] bg-[#1A1B1D] text-gray-400 hover:bg-[#252525] hover:text-white"}`}
                    title={filterSectionVisible ? "Hide filters" : "Show filters"}
                  >
                    <Filter className="h-4 w-4" />
                    <span>Filters</span>
                    {activeFilterChips.length > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#252525] px-1 text-[10px] font-bold text-gray-300 leading-none">
                        {activeFilterChips.length > 99 ? "99+" : activeFilterChips.length}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSortOrder((p) => (p === "Newest" ? "Oldest" : "Newest"))
                    }
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#252525] bg-[#1A1B1D] px-3 text-xs font-medium text-gray-300 hover:bg-[#252525] hover:text-white transition-all"
                  >
                    {sortOrder}
                    <ChevronDown className="h-3 w-3 text-gray-500" />
                  </button>
                  <ViewToggle view={viewMode} onViewChange={setViewMode} />
                </div>
                {/* Row 2: Tabs (All Media, Clips, Highlights, etc.) — user-management gradient style */}
                <div className="flex items-center gap-2 border-t border-[#252525] px-4 py-2">
                  {(["all", "clips", "highlights", "streams", "assets", "images"] as const).map((tab) => (
                    <div
                      key={tab}
                      className="rounded-lg"
                      style={
                        activeCollectionTab === tab
                          ? { padding: "1px", background: "linear-gradient(135deg, #00EEFF, #0051FF)" }
                          : {}
                      }
                    >
                      <button
                        type="button"
                        onClick={() => setActiveCollectionTab(tab)}
                        className={`relative flex items-center gap-1.5 py-2 px-3 text-sm font-medium transition-all rounded-lg ${
                          activeCollectionTab === tab
                            ? "bg-[#1A1B1D] text-white"
                            : "text-gray-500 hover:text-white hover:bg-[#1E1E20]"
                        }`}
                      >
                        {tab === "all" && <LayoutGrid className="h-4 w-4 shrink-0" />}
                        {tab === "clips" && <PlaySquare className="h-4 w-4 shrink-0" />}
                        {tab === "highlights" && <Check className="h-4 w-4 shrink-0" />}
                        {tab === "streams" && <MonitorPlay className="h-4 w-4 shrink-0" />}
                        {tab === "assets" && <ImageIcon className="h-4 w-4 shrink-0" />}
                        {tab === "images" && <ImageIcon className="h-4 w-4 shrink-0" />}
                        <span>{tab === "all" ? "All Media" : tab === "clips" ? "Clips" : tab === "highlights" ? "Highlights" : tab === "streams" ? "Match Streams" : tab === "assets" ? "Assets" : "Images"}</span>
                        <span className="rounded-full bg-[#1A1B1D] px-1.5 py-0.5 text-[10px] text-gray-400 tabular-nums">{(tabCounts as Record<string, number>)[tab] ?? 0}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className={selectedClip ? "px-4 pb-4" : "p-4"}>
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
          {/* Inline filter box: only on main media page when filter section is visible. Hidden on Images tab. */}
          {!selectedClip && filterSectionVisible && activeCollectionTab !== "images" && (
            <div className="space-y-2 rounded-lg border border-[#252525] bg-[#18191B] p-2.5 mb-4">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-500 px-0.5">Content & media</p>
              <div className="flex flex-wrap items-center gap-1.5">
                {activeCollectionTab !== "streams" && renderFilter("mediaType", mediaTypeOptions, selectedMediaTypes, setSelectedMediaTypes, "Select media type")}
                {renderFilter("ratio", ratioOptions, selectedRatios, setSelectedRatios, "Select ratio")}
                {renderFilter("rating", ratingOptions, selectedRatings, setSelectedRatings, "Select rating")}
                {renderFilter("clipStatus", clipStatusOptions, selectedClipStatus, setSelectedClipStatus, "Select clip status")}
                {activeCollectionTab !== "streams" && renderFilter("platform", platformOptions, selectedPlatforms, setSelectedPlatforms, "All platforms")}
                {renderFilter("source", sourceOptions, selectedSources, setSelectedSources, "Select source")}
                {renderFilter("actions", actionOptions, selectedActions, setSelectedActions, "Select actions", { showSearch: true })}
                {renderFilter("downloadStatus", downloadStatusOptions, selectedDownloadStatus, setSelectedDownloadStatus, "Select download status")}
              </div>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-500 pt-1.5 border-t border-[#252525] px-0.5">League & event</p>
              <div className="flex flex-wrap items-center gap-1.5">
                {visibleFilters.includes("category") && filterAvailability.has("category") && renderFilter("category", sportOptions, selectedCategories, setSelectedCategories, "Select sport", { hideCount: true })}
                {renderFilter("competition", competitionOptions, selectedCompetitions, setSelectedCompetitions, "Select competition")}
                {renderFilter("seasons", seasonOptions, selectedSeasons, setSelectedSeasons, "Select season")}
                {renderFilter("matchDay", matchDayOptions, selectedMatchDays, setSelectedMatchDays, "Select round")}
                {activeCollectionTab === "streams" && renderFilter("streams", streamOptions, selectedStreams, setSelectedStreams, "Select streams", { showSearch: true })}
                {visibleFilters.includes("date") && filterAvailability.has("date") && (
                  <div className="relative">
                    <FilterTrigger id="date" valueLabel={fromDate || toDate || selectedMatchDates.length ? `${selectedMatchDates.length + (fromDate ? 1 : 0) + (toDate ? 1 : 0)} set` : undefined} label="Date" disabled={assetsFilterDisabled("date")} />
                    {activePanel === "date" && !assetsFilterDisabled("date") && (
                      <div className="filter-panel absolute left-0 top-12 z-30 w-[340px] space-y-3 rounded-xl border border-[#252525] bg-[#18191B] p-4 shadow-2xl">
                        <div className="text-sm font-semibold text-white">Filter by date</div>
                        <div className="max-h-40 space-y-1 overflow-auto custom-scrollbar">
                          {availableMatchDateOptions.map((option) => (
                            <button key={option.value} type="button" onClick={() => toggleSelection(selectedMatchDates, setSelectedMatchDates, option.value)} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-gray-300 hover:bg-[#1A1B1D] hover:text-white transition-colors">
                              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selectedMatchDates.includes(option.value) ? "border-[#333] bg-[#252525]" : "border-[#4A4D54]"}`}>
                                {selectedMatchDates.includes(option.value) && <Check className="h-3 w-3 text-gray-300" />}
                              </span>
                              <span className="truncate">{option.label}</span>
                              <span className="ml-auto shrink-0 text-[11px] text-gray-500 tabular-nums">{option.count}</span>
                            </button>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">From</label>
                            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="date-filter-input h-10 w-full rounded-lg border-2 border-[#3A3A3A] bg-[#1A1B1D] px-3 text-sm text-white placeholder-gray-500 outline-none focus:border-[#00EEFF] focus:ring-1 focus:ring-[#00EEFF]/30" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">To</label>
                            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="date-filter-input h-10 w-full rounded-lg border-2 border-[#3A3A3A] bg-[#1A1B1D] px-3 text-sm text-white placeholder-gray-500 outline-none focus:border-[#00EEFF] focus:ring-1 focus:ring-[#00EEFF]/30" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {visibleFilters.includes("matches") && filterAvailability.has("matches") && (
                  <div className="relative">
                    <FilterTrigger id="matches" label="Matches" valueLabel={selectedMatches.length || selectedMatchDates.length ? `${selectedMatches.length + selectedMatchDates.length} selected` : undefined} disabled={assetsFilterDisabled("matches")} />
                    {activePanel === "matches" && !assetsFilterDisabled("matches") && (
                      <div className="filter-panel absolute left-0 top-12 z-30 w-[340px] rounded-xl border border-[#252525] bg-[#18191B] shadow-2xl">
                        <div className="border-b border-[#252525] px-4 py-3 text-sm font-semibold text-white">Filter by match</div>
                        <div className="max-h-48 space-y-1 overflow-auto px-3 py-2 custom-scrollbar">
                          {availableMatchGroups.map((group) => (
                            <div key={group.date || "unknown-date"} className="space-y-1 py-1">
                              <div className="px-2 pb-1 text-[11px] font-medium text-gray-500">
                                {group.label} ({group.matches.length})
                              </div>
                              {group.matches.map((matchOption) => (
                                <button key={`${group.date}-${matchOption.value}`} type="button" onClick={() => toggleSelection(selectedMatches, setSelectedMatches, matchOption.value)} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-gray-300 hover:bg-[#1A1B1D] hover:text-white transition-colors">
                                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selectedMatches.includes(matchOption.value) ? "border-[#333] bg-[#252525]" : "border-[#4A4D54]"}`}>
                                    {selectedMatches.includes(matchOption.value) && <Check className="h-3 w-3 text-gray-300" />}
                                  </span>
                                  <span className="block truncate">{matchOption.label}</span>
                                  <span className="ml-auto shrink-0 text-[11px] text-gray-500 tabular-nums">{matchOption.count}</span>
                                </button>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {renderFilter("teams", teamOptions, selectedTeams, setSelectedTeams, "Select team")}
                {renderFilter("venues", venueOptions, selectedVenues, setSelectedVenues, "Select venues")}
                {renderFilter("players", playerOptions, selectedPlayers, setSelectedPlayers, "Select player", { showSearch: true })}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-[#252525] mt-1.5">
                <div className="flex items-center gap-1.5">
                  <button type="button" disabled={activeCollectionTab === "assets"} onClick={() => activeCollectionTab !== "assets" && setActivePanel(activePanel === "filterVisibility" ? null : "filterVisibility")} className={`filter-trigger inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#252525] bg-[#1A1B1D] px-2.5 text-xs font-medium text-gray-300 transition-all ${activeCollectionTab === "assets" ? "opacity-50 cursor-not-allowed" : "hover:bg-[#252525] hover:text-white"}`}>
                    <Filter className="h-3.5 w-3.5" />
                    Filters
                    <ChevronDown className="h-3 w-3 text-gray-500" />
                  </button>
                  {activePanel === "filterVisibility" && activeCollectionTab !== "assets" && (
                    <div className="filter-panel absolute left-0 top-12 z-30 w-[280px] rounded-xl border border-[#252525] bg-[#18191B] shadow-2xl">
                      <div className="border-b border-[#252525] px-4 py-3 text-sm font-semibold text-white">Visible filters</div>
                      <div className="max-h-80 space-y-1 overflow-auto px-3 py-3 custom-scrollbar">
                        {availableFilterOptions.map((option) => {
                          const checked = visibleFilters.includes(option.id);
                          return (
                            <button key={option.id} type="button" onClick={() => handleVisibleFilterToggle(option.id)} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-gray-300 hover:bg-[#1A1B1D] hover:text-white transition-colors">
                              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${checked ? "border-[#333] bg-[#252525]" : "border-[#4A4D54]"}`}>
                                {checked && <Check className="h-3 w-3 text-gray-300" />}
                              </span>
                              {option.label}
                            </button>
                          );
                        }
                        )}
                      </div>
                    </div>
                  )}
                  {selectMode && (
                    <button type="button" onClick={selectedItems.size === filteredMedia.length ? handleClearSelection : handleSelectAll} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#252525] bg-[#1A1B1D] px-2.5 text-xs font-medium text-gray-300 hover:bg-[#252525] hover:text-white transition-all">
                      <Check className="h-3.5 w-3.5" />
                      {selectedItems.size === filteredMedia.length ? "Deselect All" : "Select All"}
                    </button>
                  )}
                </div>
              </div>
              {activeFilterChips.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 border-t border-[#252525] pt-2 mt-1.5">
                  {activeFilterChips.map((chip) => (
                    <button key={chip.key} type="button" onClick={chip.onRemove} className="inline-flex items-center gap-1 rounded-lg border border-[#252525] bg-[#1A1B1D] px-2 py-1 text-[10px] font-medium text-gray-300 transition-all hover:bg-[#252525] hover:text-white">
                      <span className="truncate max-w-[120px]">{chip.label}</span>
                      <X className="h-2.5 w-2.5 text-gray-500" />
                    </button>
                  ))}
                  <button type="button" onClick={clearAllFilters} className="text-[10px] font-medium text-gray-500 underline-offset-2 hover:text-gray-300 hover:underline">Remove all</button>
                </div>
              )}
            </div>
          )}
          {/* When in detail view, show active chips only (filters open in right panel) */}
          {selectedClip && activeFilterChips.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              {activeFilterChips.map((chip) => (
                <button key={chip.key} type="button" onClick={chip.onRemove} className="inline-flex items-center gap-1 rounded-lg border border-[#252525] bg-[#1A1B1D] px-2 py-1 text-[10px] font-medium text-gray-300 transition-all hover:bg-[#252525] hover:text-white">
                  <span className="truncate max-w-[120px]">{chip.label}</span>
                  <X className="h-2.5 w-2.5 text-gray-500" />
                </button>
              ))}
              <button type="button" onClick={clearAllFilters} className="text-[10px] font-medium text-gray-500 hover:text-gray-300 underline">Remove all</button>
            </div>
          )}
          </div>

          {/* Results (scrollable) — or 70/30 clip detail view (no detail for Assets/Images tabs) */}
          <div className="px-4 pb-6 flex-1 flex flex-col min-h-0">
          {selectedClip && !isAssetsOrImagesTab ? (
            /* ── Two-column: resizable left (library) | right (Filter/tabs, title, actions, video) ── */
            <div ref={detailSplitRef} className="flex flex-1 min-h-0 -mx-4">
              {/* Left — library list; width controlled by drag */}
              <div
                style={{ width: `${libraryPanelWidthPercent}%`, minWidth: 200, maxWidth: 480 }}
                className="flex flex-col border-r border-[#252525] bg-[#18191B] shrink-0"
              >
                {/* Top row: Search, Filter, Sort, X (no duplicate Select — use top bar only) */}
                <div className="shrink-0 flex items-center gap-1.5 px-2 py-2 border-b border-[#252525]">
                  <div className="relative flex-1 min-w-0">
                    <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search…"
                      className="h-8 w-full rounded-md border border-[#252525] bg-[#18191B] pl-7 pr-2 text-xs text-white placeholder:text-gray-500 outline-none focus:border-[#00EEFF]/50"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setFilterSidebarOpen(true)}
                    title="Filters"
                    className={`relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-all ${(activeFilterChips.length > 0 || filterSidebarOpen) ? "border-[#333] bg-[#1A1B1D] text-gray-300" : "border-[#252525] bg-[#18191B] text-gray-400 hover:bg-[#252525] hover:text-white"}`}
                  >
                    <Filter className="h-3.5 w-3.5" />
                    {activeFilterChips.length > 0 && <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#252525] px-0.5 text-[9px] font-bold text-gray-300 leading-none">{activeFilterChips.length > 99 ? "99+" : activeFilterChips.length}</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortOrder((p) => (p === "Newest" ? "Oldest" : "Newest"))}
                    className="inline-flex h-8 items-center gap-1 rounded-md border border-[#252525] bg-[#18191B] px-2 text-xs font-medium text-gray-300 hover:bg-[#252525] hover:text-white transition-all shrink-0"
                  >
                    {sortOrder}
                    <ChevronDown className="h-3 w-3 text-gray-500" />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedClip(null); setFilterSidebarOpen(false); }}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-[#252525] transition-colors"
                    aria-label="Close detail view"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {selectMode && (
                  <div className="shrink-0 flex items-center justify-between gap-2 px-2 py-1.5 border-b border-[#252525]">
                    <span className="text-xs text-gray-400">{selectedItems.size} selected</span>
                    <button type="button" onClick={selectedItems.size === filteredMedia.length ? handleClearSelection : handleSelectAll} className="text-xs font-medium text-[#00EEFF] hover:underline">
                      {selectedItems.size === filteredMedia.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                )}
                <div className="shrink-0 px-2 py-1.5 border-b border-[#252525]">
                  <PaginationBar page={pagination.page} limit={pagination.limit} total={effectivePagination.total} totalPages={effectivePagination.totalPages} onPageChange={setPage} />
                </div>
                <div key={activeCollectionTab} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-1 p-2 bg-[#18191B]">
                  {effectiveLoading ? (
                    <>
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-lg border border-[#252525] bg-[#1A1B1D] p-2 animate-pulse">
                          <div className="h-12 w-20 shrink-0 rounded bg-[#252525]" />
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="h-3 w-3/4 max-w-[140px] rounded bg-[#252525]" />
                            <div className="h-2.5 w-1/2 max-w-[100px] rounded bg-[#252525]" />
                          </div>
                        </div>
                      ))}
                    </>
                  ) : filteredMedia.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-[#252525] bg-[#1A1B1D]">
                        <Search className="h-6 w-6 text-gray-500" />
                      </div>
                      <p className="text-sm font-medium text-white">No data available</p>
                      <p className="mt-1 text-xs text-gray-400">No clips match your filters.</p>
                    </div>
                  ) : (
                  filteredMedia.map((item) => {
                    const displayItem = { ...item, title: titleOverrides[item.id] ?? item.title };
                    const isActive = selectedClip?.id === item.id;
                    const isSelected = selectedItems.has(item.id);
                    const content = (
                      <>
                        {selectMode && (
                          <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${isSelected ? "border-transparent" : "border-[#4A4D54] bg-transparent"}`} style={isSelected ? { background: "linear-gradient(135deg, #00EEFF, #0051FF)" } : undefined}>
                            {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                          </span>
                        )}
                        <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded bg-[#18191B]">
                          {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-[#252525]" />}
                          <span className="absolute bottom-0.5 right-1 text-[8px] font-medium text-white drop-shadow">{item.durationLabel}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-white">{displayItem.title}</p>
                          <p className="truncate text-[10px] text-gray-500">{item.matchName || item.mediaType}</p>
                        </div>
                      </>
                    );
                    const handleRowClick = () => {
                      if (selectMode) { toggleItemSelection(item.id, item); return; }
                      if (isAssetsOrImagesTab) return;
                      setSelectedClip(displayItem);
                    };
                    if (isActive && !selectMode) {
                      return (
                        <div key={item.id} className="rounded-lg p-[1px]" style={{ background: "linear-gradient(135deg, #00EEFF, #0051FF)" }}>
                          <button type="button" onClick={handleRowClick} className="w-full flex items-center gap-2 rounded-[7px] bg-[#18191B] p-2 text-left transition-all">
                            {content}
                          </button>
                        </div>
                      );
                    }
                    if (selectMode && isSelected) {
                      return (
                        <div key={item.id} className="rounded-lg p-[1px]" style={{ background: "linear-gradient(135deg, #00EEFF, #0051FF)" }}>
                          <button type="button" onClick={handleRowClick} className="w-full flex items-center gap-2 rounded-[7px] bg-[#18191B] p-2 text-left transition-all">
                            {content}
                          </button>
                        </div>
                      );
                    }
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={handleRowClick}
                        className="w-full flex items-center gap-2 rounded-lg border border-transparent p-2 text-left transition-all hover:bg-[#1A1B1D] hover:border-[#252525]"
                      >
                        {content}
                      </button>
                    );
                  }) )
                  }
                </div>
              </div>
              {/* Resizable divider */}
              <div
                role="separator"
                aria-label="Resize library panel"
                onMouseDown={() => setIsResizing(true)}
                className={`w-1 flex-shrink-0 bg-[#252525] hover:bg-[#00EEFF]/40 cursor-col-resize transition-colors ${isResizing ? "bg-[#00EEFF]/60" : ""}`}
              />
              {/* Right panel — title, rating, action buttons, full video */}
              <div className="flex-1 min-w-0 min-h-0 flex flex-col bg-[#18191B] overflow-hidden">
                <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-[#252525]">
                  <h2 className="truncate text-sm font-semibold text-white min-w-0">{selectedClip.title}</h2>
                </div>
                {/* Rating — same flow as ClipCardOptions (updateClip / updateFolder) */}
                <div className="shrink-0 flex items-center justify-center gap-2 px-4 py-3 border-b border-[#252525] bg-[#1A1B1D]">
                  <Rate
                    count={5}
                    value={typeof selectedClip.rating === "number" ? selectedClip.rating : 0}
                    onChange={async (value: number) => {
                      if (ratingUpdateLoading) return;
                      setRatingUpdateLoading(true);
                      try {
                        const isHighlight = selectedClip.type === "highlight";
                        const res = isHighlight
                          ? await updateFolder(selectedClip.id, { rating: value })
                          : await updateClip(selectedClip.id, { rating: value });
                        if (res?.success !== false) {
                          toast.success("Rating updated");
                          setSelectedClip((c) => (c ? { ...c, rating: value } : null));
                          setMediaLibraryRefreshKey((k) => k + 1);
                        } else {
                          toast.error((res as { message?: string })?.message ?? "Failed to update rating");
                        }
                      } catch (err: unknown) {
                        toast.error(err instanceof Error ? err.message : "Failed to update rating");
                      } finally {
                        setRatingUpdateLoading(false);
                      }
                    }}
                    disabled={ratingUpdateLoading}
                    style={{ color: "#FFF", fontSize: "20px" }}
                    className="[&_.ant-rate-star]:m-0 [&_.ant-rate-star:not(.ant-rate-star-full)_.ant-rate-star-second]:text-[#555]"
                  />
                </div>
                {/* Action buttons — wired to existing flows (Publish, Download, Rename, Manage tags, Clip studio, Auto reframe, Export JSON, Delete) */}
                <div className="shrink-0 flex flex-wrap items-center gap-2 px-4 py-2 border-b border-[#252525] bg-[#18191B]">
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        sessionStorage.setItem(
                          DASHBOARD_RESTORE_KEY,
                          JSON.stringify({
                            selectedClipId: selectedClip.id,
                            page,
                            sortOrder,
                            activeCollectionTab,
                          })
                        );
                      } catch {
                        // Ignore session persistence errors before navigation.
                      }
                      const url = selectedClip.type === "highlight" ? `/publish/HighlightId=${selectedClip.id}` : `/publish/${selectedClip.id}`;
                      navigate(url, { state: { videoUrl: selectedClip.videoUrl, thumbnailUrl: selectedClip.thumbnailUrl, title: selectedClip.title } });
                    }}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(0,238,255,0.25)] active:scale-[0.98]"
                    style={{ background: "linear-gradient(135deg, #00EEFF 0%, #0051FF 100%)" }}
                  >
                    <Share2 className="h-4 w-4" />
                    Publish
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!selectedClip.videoUrl) return;
                      try {
                        await downloadFile(selectedClip.videoUrl, selectedClip.title || "clip");
                      } catch {
                        const a = document.createElement("a");
                        a.href = selectedClip.videoUrl!;
                        a.download = (selectedClip.title || "clip").replace(/[\\/:*?"<>|]+/g, "-") + ".mp4";
                        a.rel = "noopener";
                        a.click();
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#252525] bg-[#1A1B1D] px-3 py-2 text-sm font-medium text-gray-300 hover:bg-[#252525] hover:text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                  <button type="button" onClick={() => setEditModalClip(selectedClip)} className="inline-flex items-center gap-2 rounded-lg border border-[#252525] bg-[#1A1B1D] px-3 py-2 text-sm font-medium text-gray-300 hover:bg-[#252525] hover:text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
                    <Edit2 className="h-4 w-4" />
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (selectedClip.streamId) {
                        setManageTagsStreamLoading(true);
                        try {
                          const streamRequest = dispatch(fetchStreamById(selectedClip.streamId) as never) as unknown as { unwrap: () => Promise<unknown> };
                          await streamRequest.unwrap();
                        } catch {
                          toast.error("Could not load stream for tags");
                        } finally {
                          setManageTagsStreamLoading(false);
                        }
                      }
                      setManageTagsOpen(true);
                    }}
                    disabled={manageTagsStreamLoading}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#252525] bg-[#1A1B1D] px-3 py-2 text-sm font-medium text-gray-300 hover:bg-[#252525] hover:text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  >
                    <Tag className="h-4 w-4" />
                    {manageTagsStreamLoading ? "Loading…" : "Manage tags"}
                  </button>
                  {selectedClip.type === "clip" && (
                    <>
                      <button
                        type="button"
                        onClick={() => navigate(`/auto-flip/${selectedClip.id}`)}
                        className="inline-flex items-center gap-2 rounded-lg border border-[#252525] bg-[#1A1B1D] px-3 py-2 text-sm font-medium text-gray-300 hover:bg-[#252525] hover:text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <FlipHorizontal className="h-4 w-4" />
                        Auto reframe
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/clip-editor?clipId=${selectedClip.id}${selectedClip.ratio ? `?aspectRatio=${selectedClip.ratio}` : ""}`)}
                        className="inline-flex items-center gap-2 rounded-lg border border-[#252525] bg-[#1A1B1D] px-3 py-2 text-sm font-medium text-gray-300 hover:bg-[#252525] hover:text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <Scissors className="h-4 w-4" />
                        Clip studio
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const resp = await exportClipJson(selectedClip.id);
                            if (resp?.success && resp?.data) {
                              const jsonStr = JSON.stringify(resp.data, null, 2);
                              const dataUrl = `data:application/json;charset=utf-8,${encodeURIComponent(jsonStr)}`;
                              await downloadFile(dataUrl, `${selectedClip.title || "clip"}.json`);
                              toast.success("JSON exported");
                            } else {
                              toast.error(resp?.message ?? "Failed to export JSON");
                            }
                          } catch (e: unknown) {
                            toast.error(e instanceof Error ? e.message : "Failed to export JSON");
                          }
                        }}
                        className="inline-flex items-center gap-2 rounded-lg border border-[#252525] bg-[#1A1B1D] px-3 py-2 text-sm font-medium text-gray-300 hover:bg-[#252525] hover:text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <FileJson className="h-4 w-4" />
                        Export JSON
                      </button>
                    </>
                  )}
                  {selectedClip.type === "highlight" && (
                    <button type="button" onClick={() => navigate(`/editor-page/${selectedClip.id}?aspectRatio=${selectedClip.ratio}`)} className="inline-flex items-center gap-2 rounded-lg border border-[#252525] bg-[#1A1B1D] px-3 py-2 text-sm font-medium text-gray-300 hover:bg-[#252525] hover:text-white transition-colors">
                      <Film className="h-4 w-4" />
                      Go to Highlight Studio
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowDeleteMediaModal(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#252525] bg-[#1A1B1D] px-3 py-2 text-sm font-medium text-gray-300 hover:bg-[#252525] hover:text-red-400 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
                {/* Full video area — takes remaining space */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar">
                  <div className="w-full max-w-4xl aspect-video rounded-xl overflow-hidden bg-[#111113] border border-[#252525] mx-auto min-h-[200px] flex items-center justify-center">
                    {selectedClip.videoUrl ? (
                      <video key={selectedClip.id} src={selectedClip.videoUrl} controls autoPlay playsInline className="w-full h-full object-contain" poster={selectedClip.thumbnailUrl} />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-[#252525] bg-[#1A1B1D]">
                          <Play className="h-6 w-6 text-gray-500" />
                        </div>
                        <p className="text-sm font-medium text-white">No video available</p>
                        <p className="mt-1 text-xs text-gray-400">This clip has no playable video URL.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : showMainLibraryContent ? (
            <>
              {/* Match Streams tab: show streams (sport + clips count), navigate to /clips/:streamId */}
              {activeCollectionTab === "streams" ? (
                <>
                  <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-sm text-gray-400 inline-flex items-center gap-1 leading-none">
                      {streamsLoading ? (
                        <>Loading…</>
                      ) : (
                        <>
                          Showing{" "}
                          <span className="font-semibold text-white">
                            {streamsList.length}
                          </span>{" "}
                          streams
                        </>
                      )}
                    </span>
                    <PaginationBar
                      page={streamsPagination.page}
                      limit={streamsPagination.limit}
                      total={streamsPagination.total}
                      totalPages={streamsPagination.totalPages}
                      onPageChange={setStreamsPage}
                    />
                  </div>
                  {streamsLoading ? (
                    <div className={gridCls}>
                      {Array.from({ length: 20 }).map((_, i) => (
                        <MediaLibraryShimmerCard key={i} />
                      ))}
                    </div>
                  ) : streamsList.length > 0 ? (
                    <div className={gridCls}>
                      {streamsList.map((stream, i) => {
                        const thumb = stream.videoThumbnailUrl || "";
                        const categoryLabel = stream.category ? stream.category.charAt(0).toUpperCase() + stream.category.slice(1) : "Stream";
                        const dateLabel = stream.createdAt
                          ? (() => {
                              const d = new Date(stream.createdAt);
                              return `${d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })} / ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
                            })()
                          : "";
                        const streamTags = (() => {
                          const t = (stream as { tags?: string }).tags;
                          if (!t || typeof t !== "string") return [];
                          return t.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 6);
                        })();
                        const isStreamHovered = hoveredStreamId === stream.streamId;
                        const streamStatusStyle = STATUS_STYLES[stream.status ?? 1] ?? STATUS_STYLES[1];
                        return (
                          <div
                            key={stream.streamId}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              saveMediaLibraryStateBeforeNavigate();
                              navigate(`/clips/${stream.streamId}`);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                saveMediaLibraryStateBeforeNavigate();
                                navigate(`/clips/${stream.streamId}`);
                              }
                            }}
                            onMouseEnter={() => setHoveredStreamId(stream.streamId)}
                            onMouseLeave={() => setHoveredStreamId(null)}
                            className={`group relative cursor-pointer rounded-xl text-left transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] ${isStreamHovered ? "shadow-[0_0_20px_rgba(0,238,255,0.15)]" : ""}`}
                            style={{ padding: "1px", background: isStreamHovered ? "linear-gradient(135deg, #00EEFF, #0051FF)" : "#1a1a1a", animation: `rowFadeIn 0.3s ease ${i * 30}ms both` }}
                          >
                            <div className="relative flex flex-col overflow-hidden rounded-[11px] bg-[#141518] h-full">
                            <div className="relative aspect-video bg-[#141518] overflow-hidden">
                              {thumb ? (
                                <img src={thumb} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <MonitorPlay className="h-12 w-12 text-gray-600" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                              <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    saveMediaLibraryStateBeforeNavigate();
                                    navigate(`/clips/${stream.streamId}`);
                                  }}
                                  className="flex h-12 w-12 items-center justify-center rounded-full border border-[#252525] bg-[#1A1B1D] text-gray-300 backdrop-blur-md transition-transform hover:scale-110 hover:bg-[#252525] hover:text-white"
                                  aria-label="Open stream clips"
                                >
                                  <Play fill="currentColor" className="ml-1 h-6 w-6" />
                                </button>
                              </div>
                              <div className="absolute inset-0 z-10 pointer-events-none">
                                <div
                                  className="absolute bottom-2 left-2 rounded px-2 py-0.5 text-[10px] font-semibold border border-transparent"
                                  style={{ background: streamStatusStyle.background, color: streamStatusStyle.color }}
                                >
                                  {streamStatusStyle.name}
                                </div>
                                <div className="absolute right-2 top-2 flex flex-wrap gap-1 justify-end">
                                  <span className="rounded border border-[#252525] bg-[#1A1B1D] px-1.5 py-0.5 text-[10px] font-medium text-gray-300">
                                    Stream
                                  </span>
                                  <span className="rounded border border-[#252525] bg-[#1A1B1D] px-1.5 py-0.5 text-[10px] font-medium text-gray-300">
                                    {categoryLabel}
                                  </span>
                                  <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-gray-300 backdrop-blur-sm">
                                    {(stream as { aspectRatio?: string }).aspectRatio || "16:9"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="p-3 flex flex-col flex-1">
                              <p className="truncate text-sm font-medium text-white">{stream.title}</p>
                              {dateLabel && <p className="text-[10px] text-gray-500 mt-0.5">{dateLabel}</p>}
                              {streamTags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {streamTags.map((tag) => (
                                    <span key={tag} className="rounded border border-[#252525] bg-[#1A1B1D] px-1.5 py-0.5 text-[10px] font-medium text-gray-300">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <div className="mt-3 flex flex-shrink-0 items-center justify-between border-t border-[#252525] pt-3">
                                <span className="text-xs text-gray-400">{stream.clipsCount} clips</span>
                                <div className="flex items-center gap-0.5 shrink-0">
                                  {stream.status !== 1 && (
                                    <button
                                      type="button"
                                      className="rounded p-1.5 text-gray-300 hover:bg-[#252525] hover:text-amber-400 transition-colors"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setStreamToStop({ streamId: stream.streamId, title: stream.title });
                                      }}
                                      aria-label="Stop stream"
                                    >
                                      <StopCircle className="h-4 w-4" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    className="rounded p-1.5 text-gray-300 hover:bg-[#252525] hover:text-red-400 transition-colors"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setStreamToDelete({ streamId: stream.streamId, title: stream.title });
                                    }}
                                    aria-label="Delete stream"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    className="rounded p-1.5 text-gray-300 hover:bg-[#252525] hover:text-white transition-colors"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setEditingStream({ streamId: stream.streamId, title: stream.title, category: stream.category });
                                    }}
                                    aria-label="Edit stream"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-6 rounded-xl border border-[#252525] bg-[#18191B] px-6 py-20 text-center shadow-lg">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#252525] bg-[#1A1B1D]">
                        <MonitorPlay className="h-7 w-7 text-gray-500" />
                      </div>
                      <p className="text-base font-semibold text-white">No streams found</p>
                      <p className="mt-1.5 text-sm text-gray-400 max-w-sm mx-auto">
                        Match streams will appear here. Add a video feed from Home to get started.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Results count + Pagination — for All Media, Clips, Highlights, etc. */}
                  <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-sm text-gray-400 inline-flex items-center gap-1 leading-none">
                      {activeCollectionTab === "all" && !hasActiveMediaFilters && page > allMediaMediaPages
                        ? (streamsLoading ? <>Loading…</> : <>Showing <span className="font-semibold text-white">{streamsList.length}</span> streams</>)
                        : (effectiveLoading ? (
                            <>Loading…</>
                          ) : (
                            <>
                              Showing{" "}
                              <span className="font-semibold text-white">
                                {filteredMedia.length}
                              </span>{" "}
                              results
                              {selectedItems.size > 0 && (
                                <span className="ml-2 text-gray-400 font-medium">
                                  · {selectedItems.size} selected
                                </span>
                              )}
                            </>
                          ))}
                    </span>
                    <PaginationBar
                      page={activeCollectionTab === "all" || activeCollectionTab === "assets" ? page : pagination.page}
                      limit={pagination.limit}
                      total={effectivePagination.total}
                      totalPages={effectivePagination.totalPages}
                      onPageChange={setPage}
                    />
                  </div>

                  {/* All Media: media first, then stream cards when on a stream page (at end) */}
                  {activeCollectionTab === "all" && !hasActiveMediaFilters && page > allMediaMediaPages ? (
                    streamsLoading ? (
                      <div className={gridCls}>
                        {Array.from({ length: pagination.limit }).map((_, i) => (
                          <MediaLibraryShimmerCard key={i} />
                        ))}
                      </div>
                    ) : streamsList.length > 0 ? (
                      <div className={gridCls}>
                        {streamsList.map((stream, i) => {
                          const thumb = stream.videoThumbnailUrl || "";
                          const categoryLabel = stream.category ? stream.category.charAt(0).toUpperCase() + stream.category.slice(1) : "Stream";
                          const dateLabel = stream.createdAt
                            ? (() => {
                                const d = new Date(stream.createdAt);
                                return `${d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })} / ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
                              })()
                            : "";
                          const streamTags = (() => {
                            const t = (stream as { tags?: string }).tags;
                            if (!t || typeof t !== "string") return [];
                            return t.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 6);
                          })();
                          const isStreamHoveredAll = hoveredStreamId === stream.streamId;
                          const streamStatusStyleAll = STATUS_STYLES[stream.status ?? 1] ?? STATUS_STYLES[1];
                          return (
                            <div
                              key={stream.streamId}
                              role="button"
                              tabIndex={0}
                              onClick={() => {
                                saveMediaLibraryStateBeforeNavigate();
                                navigate(`/clips/${stream.streamId}`);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  saveMediaLibraryStateBeforeNavigate();
                                  navigate(`/clips/${stream.streamId}`);
                                }
                              }}
                              onMouseEnter={() => setHoveredStreamId(stream.streamId)}
                              onMouseLeave={() => setHoveredStreamId(null)}
                              className={`group relative cursor-pointer rounded-xl text-left transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] ${isStreamHoveredAll ? "shadow-[0_0_20px_rgba(0,238,255,0.15)]" : ""}`}
                              style={{ padding: "1px", background: isStreamHoveredAll ? "linear-gradient(135deg, #00EEFF, #0051FF)" : "#1a1a1a", animation: `rowFadeIn 0.3s ease ${i * 30}ms both` }}
                            >
                              <div className="relative flex flex-col overflow-hidden rounded-[11px] bg-[#141518] h-full">
                              <div className="relative aspect-video bg-[#141518] overflow-hidden">
                                {thumb ? (
                                  <img src={thumb} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <MonitorPlay className="h-12 w-12 text-gray-600" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                                <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      saveMediaLibraryStateBeforeNavigate();
                                      navigate(`/clips/${stream.streamId}`);
                                    }}
                                    className="flex h-12 w-12 items-center justify-center rounded-full border border-[#252525] bg-[#1A1B1D] text-gray-300 backdrop-blur-md transition-transform hover:scale-110 hover:bg-[#252525] hover:text-white"
                                    aria-label="Open stream clips"
                                  >
                                    <Play fill="currentColor" className="ml-1 h-6 w-6" />
                                  </button>
                                </div>
                                <div className="absolute inset-0 z-10 pointer-events-none">
                                  <div
                                    className="absolute bottom-2 left-2 rounded px-2 py-0.5 text-[10px] font-semibold border border-transparent"
                                    style={{ background: streamStatusStyleAll.background, color: streamStatusStyleAll.color }}
                                  >
                                    {streamStatusStyleAll.name}
                                  </div>
                                  <div className="absolute right-2 top-2 flex flex-wrap gap-1 justify-end">
                                    <span className="rounded border border-[#252525] bg-[#1A1B1D] px-1.5 py-0.5 text-[10px] font-medium text-gray-300">
                                      Stream
                                    </span>
                                    <span className="rounded border border-[#252525] bg-[#1A1B1D] px-1.5 py-0.5 text-[10px] font-medium text-gray-300">
                                      {categoryLabel}
                                    </span>
                                    <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-gray-300 backdrop-blur-sm">
                                      {(stream as { aspectRatio?: string }).aspectRatio || "16:9"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="p-3 flex flex-col flex-1">
                                <p className="truncate text-sm font-medium text-white">{stream.title}</p>
                                {dateLabel && <p className="text-[10px] text-gray-500 mt-0.5">{dateLabel}</p>}
                                {streamTags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {streamTags.map((tag) => (
                                      <span key={tag} className="rounded border border-[#252525] bg-[#1A1B1D] px-1.5 py-0.5 text-[10px] font-medium text-gray-300">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <div className="mt-3 flex flex-shrink-0 items-center justify-between border-t border-[#252525] pt-3">
                                  <span className="text-xs text-gray-400">{stream.clipsCount} clips</span>
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    {stream.status !== 1 && (
                                      <button
                                        type="button"
                                        className="rounded p-1.5 text-gray-300 hover:bg-[#252525] hover:text-amber-400 transition-colors"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setStreamToStop({ streamId: stream.streamId, title: stream.title });
                                        }}
                                        aria-label="Stop stream"
                                      >
                                        <StopCircle className="h-4 w-4" />
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      className="rounded p-1.5 text-gray-300 hover:bg-[#252525] hover:text-red-400 transition-colors"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setStreamToDelete({ streamId: stream.streamId, title: stream.title });
                                      }}
                                      aria-label="Delete stream"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      className="rounded p-1.5 text-gray-300 hover:bg-[#252525] hover:text-white transition-colors"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setEditingStream({ streamId: stream.streamId, title: stream.title, category: stream.category });
                                      }}
                                      aria-label="Edit stream"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="mt-6 rounded-xl border border-[#252525] bg-[#18191B] px-6 py-20 text-center shadow-lg">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#252525] bg-[#1A1B1D]">
                          <MonitorPlay className="h-7 w-7 text-gray-500" />
                        </div>
                        <p className="text-base font-semibold text-white">No streams on this page</p>
                      </div>
                    )
                  ) : effectiveLoading ? (
                    <div className={gridCls}>
                      {Array.from({ length: pagination.limit }).map((_, i) => (
                        <MediaLibraryShimmerCard key={i} style={{ animationDelay: `${i * 30}ms` }} />
                      ))}
                    </div>
                  ) : filteredMedia.length > 0 ? (
                    <div className={gridCls}>
                      {filteredMedia.map((item, i) => {
                        selectedItemsCacheRef.current.set(item.id, item);
                        const displayItem = { ...item, title: titleOverrides[item.id] ?? item.title };
                        return (
                          <div key={item.id} style={{ animation: `rowFadeIn 0.3s ease ${i * 30}ms both` }}>
                            <MediaCard
                              item={displayItem}
                              view={viewMode}
                              selected={selectedItems.has(item.id)}
                              selectMode={selectMode}
                              onSelect={(id) => toggleItemSelection(id, item)}
                              onClick={() => {
                                if (selectMode) return;
                                if (activeCollectionTab === "assets" || activeCollectionTab === "images") {
                                  setAssetPreviewItem(displayItem);
                                  return;
                                }
                                if (!isAssetsOrImagesTab) setSelectedClip(displayItem);
                              }}
                              onEditClick={isAssetsOrImagesTab ? undefined : () => setEditingClipId(item.id)}
                              isEditing={editingClipId === item.id}
                              onSaveTitle={isAssetsOrImagesTab ? undefined : (id, title) => {
                                setTitleOverrides((o) => ({ ...o, [id]: title }));
                                setEditingClipId(null);
                              }}
                              collectionTab={activeCollectionTab}
                              onDeleteClick={item.type === "highlight" ? () => handleDeleteHighlightFromCard(item) : undefined}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-6 rounded-xl border border-[#252525] bg-[#18191B] px-6 py-20 text-center shadow-lg">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#252525] bg-[#1A1B1D]">
                        <Search className="h-7 w-7 text-gray-500" />
                      </div>
                      <p className="text-base font-semibold text-white">No data available</p>
                      <p className="mt-1.5 text-sm text-gray-400 max-w-sm mx-auto">
                        No clips match your filters. Clear filters to see more.
                      </p>
                      <button
                        type="button"
                        onClick={clearAllFilters}
                        className="mt-6 inline-flex items-center rounded-lg border border-[#252525] bg-[#18191B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#252525] transition-all"
                      >
                        Clear all filters
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            /* Tab has 0 count: show nothing */
            null
          )}
          </div>
        </main>
      </div>

      {/* ── Filter sidebar (right side): only in detail view; main page does not open this ──── */}
      {selectedClip && filterSidebarOpen && (
        <div className="fixed top-0 right-0 bottom-0 w-[min(380px,100vw)] flex flex-col border-l border-[#252525] bg-[#18191B] shadow-2xl z-30 overflow-hidden" style={{ animation: "slideInRight 0.3s ease both" }}>
          <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-[#252525]">
            <h2 className="text-sm font-bold text-white">Filters</h2>
            <button type="button" onClick={() => setFilterSidebarOpen(false)} className="rounded p-1.5 text-gray-400 hover:text-white hover:bg-[#252525] transition-colors" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
            {/* Collection tabs: All Media, Clips, Highlights, etc. — same gradient outline as main page */}
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-500 mb-2">Content type</p>
              <div className="flex flex-wrap gap-2">
                {(["all", "clips", "highlights", "streams", "assets", "images"] as const).map((tab) => (
                  <div
                    key={tab}
                    className="rounded-lg"
                    style={
                      activeCollectionTab === tab
                        ? { padding: "1px", background: "linear-gradient(135deg, #00EEFF, #0051FF)" }
                        : {}
                    }
                  >
                    <button
                      type="button"
                      onClick={() => setActiveCollectionTab(tab)}
                      className={`relative flex items-center gap-1.5 py-2 px-3 text-sm font-medium transition-colors rounded-lg w-full ${activeCollectionTab === tab ? "bg-[#1A1B1D] text-white" : "text-gray-400 border border-[#252525] bg-[#18191B] hover:bg-[#252525] hover:text-white"}`}
                    >
                      {tab === "all" && <LayoutGrid className="h-4 w-4 shrink-0" />}
                      {tab === "clips" && <PlaySquare className="h-4 w-4 shrink-0" />}
                      {tab === "highlights" && <Check className="h-4 w-4 shrink-0" />}
                      {tab === "streams" && <MonitorPlay className="h-4 w-4 shrink-0" />}
                      {tab === "assets" && <ImageIcon className="h-4 w-4 shrink-0" />}
                      {tab === "images" && <ImageIcon className="h-4 w-4 shrink-0" />}
                      <span>{tab === "all" ? "All Media" : tab === "clips" ? "Clips" : tab === "highlights" ? "Highlights" : tab === "streams" ? "Match Streams" : tab === "assets" ? "Assets" : "Images"}</span>
                      <span className="rounded-full bg-[#1A1B1D] px-1.5 py-0.5 text-[10px] text-gray-400 tabular-nums">{tabCounts[tab] ?? 0}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
            {/* Visible filters — same as main page: choose which filters to show */}
            <div className="relative border-t border-[#252525] pt-4">
              <button
                type="button"
                onClick={() => setActivePanel(activePanel === "filterVisibility" ? null : "filterVisibility")}
                className="filter-trigger inline-flex h-8 w-full items-center justify-between gap-1.5 rounded-lg border border-[#252525] bg-[#1A1B1D] px-2.5 text-xs font-medium text-gray-300 hover:bg-[#252525] hover:text-white transition-all"
              >
                <span className="flex items-center gap-1.5">
                  <Filter className="h-3.5 w-3.5" />
                  Visible filters
                </span>
                <ChevronDown className={`h-3 w-3 shrink-0 text-gray-500 transition-transform duration-200 ${activePanel === "filterVisibility" ? "rotate-180" : ""}`} />
              </button>
              {activePanel === "filterVisibility" && (
                <div className="filter-panel absolute left-0 right-0 top-full z-40 mt-1 rounded-xl border border-[#252525] bg-[#18191B] shadow-2xl overflow-hidden">
                  <div className="border-b border-[#252525] px-4 py-3 text-sm font-semibold text-white">Visible filters</div>
                  <div className="max-h-80 space-y-1 overflow-auto px-3 py-3 custom-scrollbar">
                        {availableFilterOptions.map((option) => {
                          const checked = visibleFilters.includes(option.id);
                          return (
                            <button key={option.id} type="button" onClick={() => handleVisibleFilterToggle(option.id)} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-gray-300 hover:bg-[#1A1B1D] hover:text-white transition-colors">
                              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${checked ? "border-[#333] bg-[#252525]" : "border-[#4A4D54]"}`}>
                                {checked && <Check className="h-3 w-3 text-gray-300" />}
                              </span>
                              {option.label}
                            </button>
                          );
                        })}
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-[#252525] pt-4">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-500 pb-2">Content & media</p>
            <div className="flex flex-wrap gap-2">
              {activeCollectionTab !== "streams" && renderFilter("mediaType", mediaTypeOptions, selectedMediaTypes, setSelectedMediaTypes, "Select media type")}
              {renderFilter("ratio", ratioOptions, selectedRatios, setSelectedRatios, "Select ratio")}
              {renderFilter("rating", ratingOptions, selectedRatings, setSelectedRatings, "Select rating")}
              {renderFilter("clipStatus", clipStatusOptions, selectedClipStatus, setSelectedClipStatus, "Select clip status")}
              {activeCollectionTab !== "streams" && renderFilter("platform", platformOptions, selectedPlatforms, setSelectedPlatforms, "All platforms")}
              {renderFilter("source", sourceOptions, selectedSources, setSelectedSources, "Select source")}
              {renderFilter("actions", actionOptions, selectedActions, setSelectedActions, "Select actions", { showSearch: true })}
              {renderFilter("downloadStatus", downloadStatusOptions, selectedDownloadStatus, setSelectedDownloadStatus, "Select download status")}
            </div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-500 pt-5 pb-2 border-t border-[#252525] mt-4">League & event</p>
            <div className="flex flex-wrap gap-2">
              {visibleFilters.includes("category") && filterAvailability.has("category") && renderFilter("category", sportOptions, selectedCategories, setSelectedCategories, "Select sport", { hideCount: true })}
              {renderFilter("competition", competitionOptions, selectedCompetitions, setSelectedCompetitions, "Select competition")}
              {renderFilter("seasons", seasonOptions, selectedSeasons, setSelectedSeasons, "Select season")}
              {renderFilter("matchDay", matchDayOptions, selectedMatchDays, setSelectedMatchDays, "Select round")}
              {activeCollectionTab === "streams" && renderFilter("streams", streamOptions, selectedStreams, setSelectedStreams, "Select streams", { showSearch: true })}
              {visibleFilters.includes("date") && filterAvailability.has("date") && (
                <div className="relative">
                  <FilterTrigger id="date" valueLabel={fromDate || toDate || selectedMatchDates.length ? `${selectedMatchDates.length + (fromDate ? 1 : 0) + (toDate ? 1 : 0)} set` : undefined} label="Date" disabled={assetsFilterDisabled("date")} />
                  {activePanel === "date" && !assetsFilterDisabled("date") && (
                    <div className="filter-panel absolute left-0 top-12 z-40 w-[300px] space-y-3 rounded-xl border border-[#252525] bg-[#18191B] p-4 shadow-2xl">
                      <div className="text-sm font-semibold text-white">Filter by date</div>
                      <div className="max-h-40 space-y-1 overflow-auto custom-scrollbar">
                        {availableMatchDateOptions.map((option) => (
                          <button key={option.value} type="button" onClick={() => toggleSelection(selectedMatchDates, setSelectedMatchDates, option.value)} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-gray-300 hover:bg-[#1A1B1D] hover:text-white">
                            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selectedMatchDates.includes(option.value) ? "border-[#333] bg-[#252525]" : "border-[#4A4D54]"}`}>
                              {selectedMatchDates.includes(option.value) && <Check className="h-3 w-3 text-gray-300" />}
                            </span>
                            <span className="truncate">{option.label}</span>
                            <span className="ml-auto shrink-0 text-[11px] text-gray-500 tabular-nums">{option.count}</span>
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">From</label>
                          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="date-filter-input h-10 w-full rounded-lg border-2 border-[#3A3A3A] bg-[#1A1B1D] px-3 text-sm text-white outline-none focus:border-[#00EEFF] focus:ring-1 focus:ring-[#00EEFF]/30" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">To</label>
                          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="date-filter-input h-10 w-full rounded-lg border-2 border-[#3A3A3A] bg-[#1A1B1D] px-3 text-sm text-white outline-none focus:border-[#00EEFF] focus:ring-1 focus:ring-[#00EEFF]/30" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {visibleFilters.includes("matches") && filterAvailability.has("matches") && (
                <div className="relative">
                  <FilterTrigger id="matches" label="Matches" valueLabel={selectedMatches.length || selectedMatchDates.length ? `${selectedMatches.length + selectedMatchDates.length} selected` : undefined} disabled={assetsFilterDisabled("matches")} />
                  {activePanel === "matches" && !assetsFilterDisabled("matches") && (
                    <div className="filter-panel absolute left-0 top-12 z-40 w-[300px] rounded-xl border border-[#252525] bg-[#18191B] shadow-2xl">
                      <div className="border-b border-[#252525] px-4 py-3 text-sm font-semibold text-white">Filter by match</div>
                      <div className="max-h-48 space-y-1 overflow-auto px-3 py-2 custom-scrollbar">
                        {availableMatchGroups.map((group) => (
                          <div key={group.date || "unknown-date"} className="space-y-1 py-1">
                            <div className="px-2 pb-1 text-[11px] font-medium text-gray-500">
                              {group.label} ({group.matches.length})
                            </div>
                            {group.matches.map((matchOption) => (
                              <button key={`${group.date}-${matchOption.value}`} type="button" onClick={() => toggleSelection(selectedMatches, setSelectedMatches, matchOption.value)} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-gray-300 hover:bg-[#1A1B1D] hover:text-white">
                                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selectedMatches.includes(matchOption.value) ? "border-[#333] bg-[#252525]" : "border-[#4A4D54]"}`}>
                                  {selectedMatches.includes(matchOption.value) && <Check className="h-3 w-3 text-gray-300" />}
                                </span>
                                <span className="block truncate">{matchOption.label}</span>
                                <span className="ml-auto shrink-0 text-[11px] text-gray-500 tabular-nums">{matchOption.count}</span>
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {renderFilter("teams", teamOptions, selectedTeams, setSelectedTeams, "Select team")}
              {renderFilter("venues", venueOptions, selectedVenues, setSelectedVenues, "Select venues")}
              {renderFilter("players", playerOptions, selectedPlayers, setSelectedPlayers, "Select player", { showSearch: true })}
            </div>
            <div className="pt-5 mt-1 border-t border-[#252525]">
              <button type="button" onClick={clearAllFilters} className="w-full rounded-lg border border-[#252525] bg-[#1A1B1D] py-2.5 text-xs font-medium text-gray-300 hover:bg-[#252525] hover:text-white transition-colors">
                Clear all filters
              </button>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* ── Edit name modal ──── */}
      {editModalClip && (
        <EditClipNameModal
          clip={editModalClip}
          currentTitle={titleOverrides[editModalClip.id] ?? editModalClip.title}
          onSave={(newTitle) => {
            setTitleOverrides((o) => ({ ...o, [editModalClip.id]: newTitle }));
            setEditModalClip(null);
            if (selectedClip?.id === editModalClip.id) setSelectedClip((c) => (c ? { ...c, title: newTitle } : null));
          }}
          onClose={() => setEditModalClip(null)}
        />
      )}

      {/* ── Delete clip/highlight confirmation (media library detail) ──── */}
      {showDeleteMediaModal && selectedClip && (
        <DeleteConfirmationModal
          isOpen={true}
          onClose={() => setShowDeleteMediaModal(false)}
          onDelete={async () => {
            const clip = selectedClip;
            const isHighlight = clip.type === "highlight";
            try {
              if (isHighlight) {
                const res = await deleteFolder(clip.id);
                if (res?.success !== false) {
                  toast.success("Highlight deleted");
                  setSelectedClip(null);
                  if (editModalClip?.id === clip.id) setEditModalClip(null);
                  setMediaItems((prev) => prev.filter((m) => m.id !== clip.id));
                  setMediaLibraryRefreshKey((k) => k + 1);
                } else {
                  toast.error(res?.message ?? "Failed to delete highlight");
                }
              } else {
                const res = await deleteClip(clip.id);
                if (res?.success) {
                  toast.success("Clip deleted");
                  setSelectedClip(null);
                  if (editModalClip?.id === clip.id) setEditModalClip(null);
                  setMediaItems((prev) => prev.filter((m) => m.id !== clip.id));
                  setMediaLibraryRefreshKey((k) => k + 1);
                } else {
                  toast.error(res?.error ?? res?.message ?? "Failed to delete clip");
                }
              }
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : "Failed to delete";
              toast.error(msg);
            }
          }}
          title={selectedClip.type === "highlight" ? "Delete highlight?" : "Delete clip?"}
          description={
            selectedClip.type === "highlight"
              ? `Are you sure you want to delete "${selectedClip.title}"? This cannot be undone.`
              : `Are you sure you want to delete "${selectedClip.title}"? This cannot be undone.`
          }
          confirmLabel="Yes, delete"
        />
      )}

      {/* ── Delete highlight from grid (global pop-up) ──── */}
      {highlightToDeleteFromCard && (
        <DeleteConfirmationModal
          isOpen={true}
          onClose={() => setHighlightToDeleteFromCard(null)}
          onDelete={async () => {
            if (highlightToDeleteFromCard) await executeDeleteHighlightFromCard(highlightToDeleteFromCard);
          }}
          title="Delete highlight?"
          description={`Are you sure you want to delete "${highlightToDeleteFromCard.title}"? All clips in this highlight will also be deleted. This cannot be undone.`}
          confirmLabel="Yes, delete"
        />
      )}

      {/* ── Manage tags modal (video detail) ──── */}
      {manageTagsOpen && selectedClip && (
        <ManageTagsModal
          isOpen={manageTagsOpen}
          onClose={() => setManageTagsOpen(false)}
          appliedTags={selectedClip.tags ?? selectedClip.actions ?? []}
          onUpdateTags={async (tags: string[]) => {
            try {
              const res = await updateClip(selectedClip.id, { tags });
              if (res?.success) {
                setSelectedClip((c) => (c ? { ...c, tags, actions: tags } : null));
                setMediaItems((prev) => prev.map((m) => (m.id === selectedClip.id ? { ...m, tags, actions: tags } : m)));
                toast.success("Tags updated");
                setManageTagsOpen(false);
              } else {
                toast.error(res?.error ?? res?.message ?? "Failed to update tags");
              }
            } catch (e: unknown) {
              toast.error(e instanceof Error ? e.message : "Failed to update tags");
            }
          }}
          category={selectedClip.category}
          streamId={selectedClip.streamId}
        />
      )}

      {/* ── Add video feed modal — opened from "+ Add video feed" button ──── */}
      <AddNewVideoModal
        open={isAddVideoModalOpen}
        onOpenChange={(open) => {
          setIsAddVideoModalOpen(open);
          if (!open) setStreamsRefreshKey((k) => k + 1);
        }}
      />

      {/* ── Asset preview popup — opened when clicking an asset card (Bumper / Graphics / Overlay) ──── */}
      <AssetPreviewModal
        isOpen={!!assetPreviewItem}
        onClose={() => setAssetPreviewItem(null)}
        asset={assetPreviewItem ? { id: assetPreviewItem.id, title: assetPreviewItem.title, mediaType: assetPreviewItem.mediaType, videoUrl: assetPreviewItem.videoUrl, thumbnailUrl: assetPreviewItem.thumbnailUrl, ratio: assetPreviewItem.ratio } : null}
      />

      {/* ── Edit video feed (stream) modal — opened from stream card hover edit ──── */}
      {editingStream && (
        <EditVideoModal
          isOpen={true}
          onClose={() => setEditingStream(null)}
          video={{
            id: editingStream.streamId,
            shortId: editingStream.streamId,
            title: editingStream.title,
            category: editingStream.category,
          }}
          onUpdated={() => {
            setEditingStream(null);
            setStreamsRefreshKey((k) => k + 1);
          }}
        />
      )}

      {/* ── End stream confirmation ──── */}
      <EndStreamConfirmationModal
        isOpen={!!streamToStop}
        onClose={() => setStreamToStop(null)}
        streamTitle={streamToStop?.title}
        onConfirm={async () => {
          if (!streamToStop) return;
          setIsStoppingStream(true);
          try {
            await endStream(streamToStop.streamId);
            setStreamsRefreshKey((k) => k + 1);
            getMediaLibraryStats().then((r) => { if (r.success && r.data) setStats(r.data); }).catch(() => {});
            setStreamToStop(null);
          } finally {
            setIsStoppingStream(false);
          }
        }}
        isLoading={isStoppingStream}
      />

      {/* ── Delete stream confirmation ──── */}
      <DeleteConfirmationModal
        isOpen={!!streamToDelete}
        onClose={() => setStreamToDelete(null)}
        onDelete={() => {
          const toDelete = streamToDelete;
          setStreamToDelete(null);
          if (!toDelete) return;
          deleteStream(toDelete.streamId)
            .then(() => {
              setStreamsRefreshKey((k) => k + 1);
              getMediaLibraryStats().then((r) => { if (r.success && r.data) setStats(r.data); }).catch(() => {});
            })
            .catch(() => {});
        }}
        itemName={streamToDelete?.title}
        confirmLabel="Yes, delete"
      />

      {/* ── Selection Preview Side Panel (fixed right, high z so always visible) ──── */}
      {showPreview && selectedPreviewItems.length > 0 && (
        <div className="fixed top-0 right-0 bottom-0 w-[320px] flex flex-col border-l border-[#252525] bg-[#18191B] shadow-2xl z-[100]" style={{ animation: 'slideInRight 0.3s ease both' }}>
          <div className="shrink-0 flex items-center justify-between border-b border-[#252525] px-4 py-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #00EEFF 0%, #0051FF 100%)" }}>
                {selectedPreviewItems.length}
              </div>
              Selected Clips
            </h3>
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-[#1A1B1D] hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 min-h-0 space-y-3 overflow-y-auto p-4 custom-scrollbar">
            {selectedPreviewItems.map((item) => (
              <div
                key={item.id}
                className="group relative flex items-center gap-3 rounded-lg border border-[#252525] bg-[#1A1B1D] p-2 pr-8 transition-all hover:border-[#333]"
              >
                <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded bg-black">
                  {item.thumbnailUrl ? (
                    <img src={item.thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <span className="absolute bottom-0.5 right-1 text-[8px] font-bold text-white z-10">{item.durationLabel}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-white" title={item.title}>{item.title}</p>
                  <p className="truncate text-[10px] text-gray-500">
                    {item.mediaType} · {item.ratio}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleItemSelection(item.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 opacity-0 hover:bg-[#00EEFF]/20 hover:text-[#00EEFF] group-hover:opacity-100 transition-all"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="border-t border-[#252525] p-4 bg-[#18191B]">
            <button
              type="button"
              onClick={handleGenerateClip}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background:
                  "linear-gradient(135deg, #00EEFF 0%, #0051FF 100%)",
              }}
            >
              <PlaySquare className="h-4 w-4" />
              Generate Clip
            </button>
          </div>
        </div>
      )}

      {/* ── Floating Selection Bar ──────── */}
      <MediaLibrarySelectionBar
        selectedCount={selectedItems.size}
        totalDurationLabel={totalDurationLabel}
        onPreview={handlePreviewSelected}
        onGenerateClip={handleGenerateClip}
        onClear={handleClearSelection}
      />

      {/* ── Create new highlight (from selected clips) — portal so modal is always on top and clickable ──── */}
      {isCreateHighlightModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[9999]" style={{ isolation: "isolate" }}>
            <NewHighlightModal
              isOpen={true}
              onClose={() => setIsCreateHighlightModalOpen(false)}
              selectedClips={Array.from(selectedItems)}
              onCreateHighlight={handleCreateHighlightSubmit}
            />
          </div>,
          document.body
        )}

      <HelpButton />

      <style>{`
        @keyframes rowFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes filterLoader {
          0%, 100% { transform: translateX(-25%); opacity: 0.8; }
          50% { transform: translateX(100%); opacity: 1; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #444;
        }
        .date-filter-input {
          color-scheme: dark;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
