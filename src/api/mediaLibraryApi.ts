/**
 * Media Library API – list, stats, and filter counts (org-scoped).
 */
import { apiGet, videoapiUrl } from '../utils/apiClient.js';

export interface MediaLibraryItem {
  id: string;
  type: 'clip' | 'highlight';
  title: string;
  thumbnailUrl: string;
  videoUrl?: string;
  duration: number;
  durationLabel: string;
  createdAt: string;
  streamId: string;
  streamTitle: string;
  stream: string;
  category: string;
  aspectRatio: string;
  ratio: string;
  rating: number;
  clipStatus: string;
  downloadStatus: string;
  source: string;
  mediaType: string;
  platform: string;
  players: string[];
  actions: string[];
  tags: string[];
  matchId: string;
  matchName: string;
  matchDate: string;
  teams: string[];
  venue: string;
    competition: string;
  season: string;
  matchDay?: string;
  scoreLabel?: string;
  /** Clip generation progress 0–100 (clips). */
  progress?: number;
  /** Highlight generation progress 0–100 (highlights). */
  progressPercent?: number;
}

export interface MediaLibraryListResponse {
  success: boolean;
  items: MediaLibraryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

export interface MediaLibraryStatsResponse {
  success: boolean;
  data: {
    totalItems: number;
    totalDuration: number;
    totalDurationLabel: string;
    avgRating: number;
    processingCount: number;
    countClips: number;
    countHighlights: number;
    countStreams?: number;
    /** Count of media items (clips + highlights) that have a streamId. Used for Match Streams tab. */
    countStreamMedia?: number;
  };
  error?: string;
}

export interface MediaLibraryFilterCountsResponse {
  success: boolean;
  data: {
    tags: { label: string; count: number }[];
    ratings: { rating: number; count: number }[];
    aspectRatios: { aspectRatio: string; count: number }[];
    categories: { category: string; count: number }[];
    statuses: { status: string; count: number }[];
    clipStatuses?: { status: string; count: number }[];
    downloadStatuses?: { status: string; count: number }[];
    platforms?: { platform: string; count: number }[];
    sources?: { source: string; count: number }[];
    /** Same as GET /api/tags?tagType=player: tag doc + count (player = name for compat) */
    players?: ({ player: string; count: number; _id?: string; name?: string; tagType?: string; category?: string; metaData?: { playerName?: string } })[];
    /** Same as GET /api/tags?tagType=event: tag doc + count (action = name for compat) */
    actions?: ({ action: string; count: number; _id?: string; name?: string; tagType?: string; category?: string })[];
    streams?: { stream: string; count: number }[];
    seasons?: { season: string; count: number }[];
    competitions?: { competition: string; count: number }[];
    matchDays?: { matchDay: string; count: number }[];
    teams?: { team: string; count: number }[];
    venues?: { venue: string; count: number }[];
    matches?: { matchName: string; matchDate?: string; count: number }[];
    matchDates?: { matchDate: string; count: number }[];
  };
  error?: string;
}

export interface GetMediaLibraryParams {
  organizationId?: string;
  streamIds?: string[];
  userId?: string;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'latest' | 'oldest' | 'rating' | 'duration';
  mediaTypes?: string[];
  aspectRatio?: string[];
  tags?: string[];
  rating?: string[];
  clipStatus?: string[];
  downloadStatus?: string[];
  mediaType?: 'clip' | 'highlight';
  category?: string[];
  platform?: string[];
  source?: string[];
  actions?: string[];
  streams?: string[];
  season?: string[];
  competition?: string[];
  matchDay?: string[];
  matchDate?: string[];
  matches?: string[];
  teams?: string[];
  venues?: string[];
  players?: string[];
  startDate?: string;
  endDate?: string;
  /** When true, return only items that have a non-empty streamId (Match Streams tab). */
  streamsOnly?: boolean;
}

export interface GetMediaLibraryStatsParams {
  organizationId?: string;
  streamIds?: string[];
  userId?: string;
}

export type GetMediaLibraryFilterCountsParams = Omit<
  GetMediaLibraryParams,
  'page' | 'limit' | 'sortBy'
>;

/** Shape compatible with MediaCard MediaItemData */
export interface MediaItemDataShape {
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
  tags: string[];
  streamId: string;
  season: string;
  competition?: string;
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

/**
 * Map API media item to MediaCard MediaItemData shape.
 */
export function toMediaItemData(item: MediaLibraryItem): MediaItemDataShape {
  return {
    id: item.id,
    title: item.title,
    mediaType: item.mediaType,
    ratio: item.ratio,
    category: item.category,
    rating: item.rating,
    clipStatus: item.clipStatus,
    platform: item.platform,
    source: item.source,
    players: item.players ?? [],
    actions: item.actions ?? [],
    tags: item.tags ?? item.actions ?? [],
    streamId: item.streamId ?? '',
    season: item.season ?? '',
    competition: item.competition ?? '',
    matchDay: item.matchDay ?? '',
    matchDate: item.matchDate ?? '',
    matchName: item.matchName ?? '',
    teams: item.teams ?? [],
    stream: item.stream ?? item.streamTitle ?? '',
    venue: item.venue ?? '',
    downloadStatus: item.downloadStatus,
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : (item.createdAt ? new Date(item.createdAt).toISOString() : ''),
    durationLabel: item.durationLabel,
    thumbnailUrl: item.thumbnailUrl,
    videoUrl: item.videoUrl,
    scoreLabel: item.scoreLabel,
    type: item.type,
    timeRangeLabel: (item as any).timeRangeLabel,
    progress: item.progress,
    progressPercent: item.progressPercent,
  };
}

function buildQueryString(params: Record<string, string | number | undefined | string[] | null>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      if (value.length) q.set(key, JSON.stringify(value));
      return;
    }
    q.set(key, String(value));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export async function getMediaLibrary(params: GetMediaLibraryParams): Promise<MediaLibraryListResponse> {
  const query = buildQueryString({
    organizationId: params.organizationId,
    streamIds: params.streamIds?.length ? params.streamIds : undefined,
    userId: params.userId,
    page: params.page,
    limit: params.limit,
    search: params.search,
    sortBy: params.sortBy,
    mediaTypes: params.mediaTypes?.length ? params.mediaTypes : undefined,
    aspectRatio: params.aspectRatio?.length ? params.aspectRatio : undefined,
    rating: params.rating?.length ? JSON.stringify(params.rating) : undefined,
    clipStatus: params.clipStatus?.length ? params.clipStatus : undefined,
    downloadStatus: params.downloadStatus?.length ? params.downloadStatus : undefined,
    mediaType: params.mediaType,
    category: params.category?.length ? params.category : undefined,
    platform: params.platform?.length ? params.platform : undefined,
    source: params.source?.length ? params.source : undefined,
    actions: params.actions?.length ? params.actions : undefined,
    streams: params.streams?.length ? params.streams : undefined,
    season: params.season?.length ? params.season : undefined,
    competition: params.competition?.length ? params.competition : undefined,
    matchDay: params.matchDay?.length ? params.matchDay : undefined,
    matchDate: params.matchDate?.length ? params.matchDate : undefined,
    matches: params.matches?.length ? params.matches : undefined,
    teams: params.teams?.length ? params.teams : undefined,
    venues: params.venues?.length ? params.venues : undefined,
    players: params.players?.length ? params.players : undefined,
    tags: params.tags?.length ? params.tags : undefined,
    startDate: params.startDate,
    endDate: params.endDate,
    streamsOnly: params.streamsOnly === true ? 'true' : undefined,
  });
  const res = await apiGet(`${videoapiUrl}/api/media-library${query}`);
  if (!res.ok) throw new Error(`Media library list failed: ${res.status}`);
  return res.json();
}

export async function getMediaLibraryStats(
  params: GetMediaLibraryStatsParams = {}
): Promise<MediaLibraryStatsResponse> {
  const query = buildQueryString({
    organizationId: params.organizationId,
    streamIds: params.streamIds?.length ? params.streamIds : undefined,
    userId: params.userId,
  });
  const res = await apiGet(`${videoapiUrl}/api/media-library/stats${query}`);
  if (!res.ok) throw new Error(`Media library stats failed: ${res.status}`);
  return res.json();
}

export async function getMediaLibraryFilterCounts(
  params: GetMediaLibraryFilterCountsParams = {}
): Promise<MediaLibraryFilterCountsResponse> {
  const query = buildQueryString({
    organizationId: params.organizationId,
    streamIds: params.streamIds?.length ? params.streamIds : undefined,
    userId: params.userId,
    search: params.search,
    mediaTypes: params.mediaTypes?.length ? params.mediaTypes : undefined,
    aspectRatio: params.aspectRatio?.length ? params.aspectRatio : undefined,
    rating: params.rating?.length ? JSON.stringify(params.rating) : undefined,
    clipStatus: params.clipStatus?.length ? params.clipStatus : undefined,
    downloadStatus: params.downloadStatus?.length ? params.downloadStatus : undefined,
    mediaType: params.mediaType,
    category: params.category?.length ? params.category : undefined,
    platform: params.platform?.length ? params.platform : undefined,
    source: params.source?.length ? params.source : undefined,
    actions: params.actions?.length ? params.actions : undefined,
    streams: params.streams?.length ? params.streams : undefined,
    season: params.season?.length ? params.season : undefined,
    competition: params.competition?.length ? params.competition : undefined,
    matchDay: params.matchDay?.length ? params.matchDay : undefined,
    matchDate: params.matchDate?.length ? params.matchDate : undefined,
    matches: params.matches?.length ? params.matches : undefined,
    teams: params.teams?.length ? params.teams : undefined,
    venues: params.venues?.length ? params.venues : undefined,
    players: params.players?.length ? params.players : undefined,
    tags: params.tags?.length ? params.tags : undefined,
    startDate: params.startDate,
    endDate: params.endDate,
    streamsOnly: params.streamsOnly === true ? 'true' : undefined,
  });
  const res = await apiGet(`${videoapiUrl}/api/media-library/filters/counts${query}`);
  if (!res.ok) throw new Error(`Media library filter counts failed: ${res.status}`);
  return res.json();
}
