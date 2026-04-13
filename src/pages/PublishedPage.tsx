import React, { useState, useRef, useEffect } from "react";
import Sidebar from "@/layouts/dashboard/Sidebar";
import CalendarView from "../layouts/publishedPage/CalenderView";
import { getPublishedCalendar, getPublishedClipsForDate, PublishedClipItem, PublishedCalendarItem } from "@/api/clipApi";
import { ClipData } from "../mocks/clips_mockData/mockClips";
import HelpButton from "@/containers/help_section/HelpButton";
import SportsDropdown from '@/components/common/SportsDropdown';
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchStreams } from "@/store/slices/streamsSlice";
import { selectUser } from "@/store/slices/authSlice";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { getCategoryColorFromConstant } from "@/constants/DashboardPage.tsx";
import PreviewModal from "@/components/modals/PreviewModal";
import { SearchableSelect, SelectOption } from "@/components/ui/searchable-select";

const PublishedHistory: React.FC<{ page: string }> = ({ page }) => {
    const today = new Date();
    const [selectedDate, setSelectedDate] = useState<string>(today.toISOString().split('T')[0]);
    const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedSport, setSelectedSport] = useState<string | null>(null);
    const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
    const [selectedPlatform, setSelectedPlatform] = useState<string>("All platforms");
    const [selectedStatus, setSelectedStatus] = useState("Status");
    const [selectedEventType, setSelectedEventType] = useState<"published" | "failed" | "all">("all");
    const [content, setContent] = useState<ClipData[]>([]);
    const [monthCounts, setMonthCounts] = useState<Record<string, { published: number; failed: number }>>({});
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewClip, setPreviewClip] = useState<any | null>(null);

    const sportsDropdownRef = useRef<HTMLDivElement>(null);
    const competitionDropdownRef = useRef<HTMLDivElement>(null);
    const timezoneDropdownRef = useRef<HTMLDivElement>(null);
    const statusDropdownRef = useRef<HTMLDivElement>(null);

    const dispatch = useAppDispatch();
    const user = useAppSelector(selectUser);
    const streams = useAppSelector((state) => state.streams.streams);

    useEffect(() => {
        if (user?.userId) {
            dispatch(fetchStreams({ filters: { userId: user.userId }, page: 1, limit: 50, useCache: true }));
        }
    }, [user?.userId, dispatch]);

    const mapStatusToBackend = (s: string): "all" | "completed" | "failed" => {
        if (!s || s === "All" || s === "Status") return "all";
        if (s === "Published") return "completed";
        if (s === "Failed") return "failed";
        return "all";
    };
    const mapPlatformToBackend = (p: string): string | undefined => {
        if (!p || p === "All platforms") return undefined;
        if (p.toLowerCase() === "cloud") return "gcp";
        return p.toLowerCase();
    };
    const truncateText = (text: string, maxLength: number = 25) => {
        if (!text) return "";
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    };
    const streamOptions: SelectOption[] = (streams || []).map((s) => ({
      value: s.streamId || s._id,
      label: s.title || s.streamId || s._id,
    }));
    const platformSelectOptions: SelectOption[] = [
      { value: "All platforms", label: "All platforms" },
      { value: "cloud", label: "Cloud", icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M0.888889 0H15.1111C15.3469 0 15.573 0.0936505 15.7397 0.260349C15.9064 0.427048 16 0.653141 16 0.888889V7.11111H0V0.888889C0 0.653141 0.0936505 0.427048 0.260349 0.260349C0.427048 0.0936505 0.653141 0 0.888889 0ZM0 8.88889H16V15.1111C16 15.3469 15.9064 15.573 15.7397 15.7397C15.573 15.9064 15.3469 16 15.1111 16H0.888889C0.653141 16 0.427048 15.9064 0.260349 15.7397C0.0936505 15.573 0 15.3469 0 15.1111V8.88889ZM3.55556 11.5556V13.3333H6.22222V11.5556H3.55556ZM3.55556 2.66667V4.44444H6.22222V2.66667H3.55556Z" fill="white"/></svg>) },
      { value: "email", label: "Email", icon: (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="17" viewBox="0 0 18 17" fill="none"><path d="M0.9 0H17.1C17.3387 0 17.5676 0.0948211 17.7364 0.263604C17.9052 0.432387 18 0.661305 18 0.9V15.3C18 15.5387 17.9052 15.7676 17.7364 15.9364C17.5676 16.1052 17.3387 16.2 17.1 16.2H0.9C0.661305 16.2 0.432387 16.1052 0.263604 15.9364C0.0948211 15.7676 0 15.5387 0 15.3V0.9C0 0.661305 0.0948211 0.432387 0.263604 0.263604C0.432387 0.0948211 0.661305 0 0.9 0ZM9.054 7.8147L3.2832 2.9142L2.1177 4.2858L9.0657 10.1853L15.8886 4.2813L14.7114 2.9196L9.0549 7.8147H9.054Z" fill="white"/></svg>) },
      { value: "youtube", label: "YouTube", icon: (<svg className="w-[18px] h-[13px] fill-white" viewBox="0 0 18 13"><path d="M9 1.14538e-09C9.01549 7.16445e-07 14.6309 0.000163857 16.0322 0.375977C16.8072 0.583418 17.4166 1.19283 17.624 1.96777C17.9961 3.36054 18 6.25664 18 6.2998C18 6.2998 18.0004 9.22955 17.624 10.6328C17.4166 11.4077 16.8072 12.0172 16.0322 12.2246C14.6309 12.6004 9.01549 12.6006 9 12.6006C9 12.6006 3.37121 12.601 1.96777 12.2246C1.19284 12.0172 0.583418 11.4077 0.375977 10.6328C-0.000339341 9.22955 1.09977e-09 6.2998 1.09977e-09 6.2998C2.08206e-05 6.25664 0.00246392 3.36054 0.375977 1.96777C0.583418 1.19283 1.19284 0.583418 1.96777 0.375977C3.3712 -0.000343977 9 1.14538e-09 9 1.14538e-09ZM7.20117 9L11.8779 6.30078L7.20117 3.60059V9Z"/></svg>) },
      { value: "facebook", label: "Facebook", icon: (<svg xmlns="http://www.w3.org/2000/svg" width="17" height="16" viewBox="0 0 17 16" fill="none"><path d="M8.04004 0C12.462 1.72961e-05 16.0801 3.61805 16.0801 8.04004C16.0801 12.0198 13.1852 15.3166 9.36621 16L9.3291 15.9697C9.35567 15.9652 9.38261 15.9619 9.40918 15.957V10.2891H11.1777L11.54 8.03809H9.40918V6.4707C9.40918 5.8275 9.65043 5.34473 10.6152 5.34473H11.6602V3.29492C11.0974 3.21453 10.4543 3.1338 9.8916 3.13379C8.0424 3.13379 6.75586 4.25953 6.75586 6.26953V8.03809H4.74609V10.2891H6.75586V15.957C6.75839 15.9575 6.76114 15.9576 6.76367 15.958L6.71387 16C2.89487 15.3166 1.56638e-05 12.0198 0 8.04004C0 3.61804 3.61804 0 8.04004 0Z" fill="white" /></svg>) },
      { value: "instagram", label: "Instagram", icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 0C14.2091 0 16 1.79086 16 4V12C16 14.2091 14.2091 16 12 16H4C1.79086 16 0 14.2091 0 12V4C0 1.79086 1.79086 0 4 0H12ZM8 4C5.79086 4 4 5.79086 4 8C4 10.2091 5.79086 12 8 12C10.2091 12 12 10.2091 12 8C12 5.79086 10.2091 4 8 4ZM13 2C12.4477 2 12 2.44772 12 3C12 3.55228 12.4477 4 13 4C13.5523 4 14 3.55228 14 3C14 2.44772 13.5523 2 13 2Z" fill="white"/></svg>) },
      { value: "tiktok", label: "TikTok", icon: (<svg className="w-[14px] h-4 fill-white" viewBox="0 0 14 16"><path d="M12.1404 3.42183C12.0324 3.36602 11.9273 3.30483 11.8254 3.23851C11.5292 3.04267 11.2576 2.81191 11.0165 2.55121C10.4132 1.86091 10.1879 1.16061 10.1049 0.6703H10.1082C10.0389 0.26332 10.0675 0 10.0719 0H7.324V10.6255C7.324 10.7681 7.324 10.9091 7.31801 11.0484C7.31801 11.0658 7.31634 11.0818 7.31534 11.1004C7.31534 11.1081 7.31534 11.1161 7.31367 11.1241C7.31367 11.1261 7.31367 11.1281 7.31367 11.1301C7.28471 11.5114 7.1625 11.8796 6.95779 12.2026C6.75309 12.5255 6.47216 12.7931 6.13973 12.982C5.79326 13.1791 5.4014 13.2825 5.00279 13.282C3.72252 13.282 2.6849 12.2381 2.6849 10.9488C2.6849 9.65952 3.72252 8.61557 5.00279 8.61557C5.24514 8.61535 5.48599 8.65348 5.71642 8.72856L5.71975 5.9307C5.02024 5.84035 4.3096 5.89594 3.63265 6.09398C2.9557 6.29201 2.32713 6.62819 1.78661 7.08131C1.31299 7.49283 0.914818 7.98383 0.610007 8.53224C0.494013 8.73223 0.0563678 9.53586 0.00337045 10.8401C-0.0299612 11.5804 0.192361 12.3474 0.298356 12.6644V12.671C0.365019 12.8577 0.623339 13.4947 1.04432 14.0316C1.38378 14.4624 1.78484 14.8407 2.23459 15.1546V15.1479L2.24126 15.1546C3.57153 16.0585 5.04645 15.9992 5.04645 15.9992C5.30177 15.9889 6.15706 15.9992 7.12835 15.5389C8.20563 15.0286 8.81893 14.2683 8.81893 14.2683C9.21074 13.814 9.52229 13.2963 9.74022 12.7374C9.98887 12.0837 10.0719 11.2998 10.0719 10.9865V5.3494C10.1052 5.3694 10.5492 5.66305 10.5492 5.66305C10.5492 5.66305 11.1888 6.07303 12.1868 6.34002C12.9027 6.53001 13.8673 6.57001 13.8673 6.57001V3.84214C13.5294 3.87881 12.8431 3.77215 12.1404 3.42183Z"/></svg>) },
      { value: "x", label: "X", icon: (<svg width="16" height="16" viewBox="0 0 1200 1227" fill="white"><path d="M714.6 519.6L1108 0H964.9L651.5 409.3L376.7 0H0L410.6 599.3L0 1227.1H143.1L474.4 791.2L773.3 1227.1H1150.1L714.6 519.6ZM529.8 727.1L483.2 660.7L196.9 248.9H318.8L545.6 572.9L592.2 639.2L890.1 1086.5H768.1L529.8 727.1Z"/></svg>) },
      { value: "webhook", label: "Webhook" },
      { value: "share", label: "Share" },
    ];
    const statusSelectOptions: SelectOption[] = [
      { value: "All", label: "All" },
      { value: "Scheduled", label: "Scheduled" },
      { value: "Published", label: "Published" },
      { value: "Failed", label: "Failed" },
    ];

    // Fetch calendar counts when filters change
    useEffect(() => {
        const fetchCalendar = async () => {
            try {
                const resp = await getPublishedCalendar({
                    year: currentYear,
                    month: currentMonth,
                    status: mapStatusToBackend(selectedStatus),
                    streamId: selectedStreamId || undefined,
                    sport: selectedSport || undefined,
                    platform: mapPlatformToBackend(selectedPlatform) || undefined,
                    userId: user?.userId || undefined,
                });
                if (resp.success) {
                    const countsMap: Record<string, { published: number; failed: number }> = {};
                    (resp.data || []).forEach((item: PublishedCalendarItem) => {
                        countsMap[item.date] = { published: item.published || 0, failed: item.failed || 0 };
                    });
                    setMonthCounts(countsMap);
                }
            } catch (e) {
                console.error("Failed to fetch published calendar", e);
            }
        };
        fetchCalendar();
    }, [currentMonth, currentYear, selectedStreamId, selectedSport, selectedPlatform, selectedStatus, user?.userId]);

    // Update content when date or filters change
    useEffect(() => {
        const fetchContent = async () => {
            try {
                const statusParam = mapStatusToBackend(selectedStatus);
                const resp = await getPublishedClipsForDate({
                    date: selectedDate,
                    status: statusParam,
                    streamId: selectedStreamId || undefined,
                    sport: selectedSport || undefined,
                    platform: mapPlatformToBackend(selectedPlatform) || undefined,
                    userId: user?.userId || undefined,
                });
                if (resp.success) {
                    const items = resp.data || [];
                    const toClipData = (it: PublishedClipItem): ClipData => {
                        const dur = Number(it.duration || 0);
                        const h = Math.floor(dur / 3600);
                        const m = Math.floor((dur % 3600) / 60);
                        const s = Math.floor(dur % 60);
                        const durationStr = h > 0
                            ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
                            : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
                        const statusName = it.status === "failed" ? "Failed" : "Published";
                        const platformsNormalized = (it.platforms || []).map(p => (p === "gcp" ? "cloud" : p));
                        return {
                            id: it.id,
                            _id: it.id,
                            streamId: it.streamId,
                            title: it.title,
                            date: selectedDate,
                            time: "",
                            thumbnail: it.thumbnailUrl || "",
                            timestamp: "",
                            duration: durationStr,
                            aspectRatio: it.aspectRatio || "16:9",
                            rating: 0,
                            tags: [it.category || "Unknown"],
                            event: "",
                            status: { name: statusName, color: "#FFF", background: statusName === "Failed" ? "#FF4444" : "#00CF45" },
                            selected: false,
                            description: it.description || "",
                            publishedDate: selectedDate,
                            platforms: platformsNormalized,
                            rawDuration: it.duration || 0,
                            videoUrl: it.videoUrl || '',
                            type: it.type || 'clip',
                            ratingValue: it.rating || 0,
                        } as any;
                    };
                    const mapped = items.map(toClipData);
                    setContent(mapped);
                }
            } catch (e) {
                console.error("Failed to fetch published clips for date", e);
                setContent([]);
            }
        };
        if (selectedDate) fetchContent();
    }, [selectedDate, selectedStreamId, selectedSport, selectedPlatform, selectedStatus, user?.userId]);

    const handleDateSelect = (date: string) => {
        setSelectedDate(date);
    };

    const handleMonthChange = (month: number, year: number) => {
        setCurrentMonth(month);
        setCurrentYear(year);
    };

    const formatSelectedDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric"
        });
    };

    return (
        <div className="h-screen bg-[#18191B] text-white flex overflow-x-auto overflow-y-auto">
            <Sidebar />

            <div className="flex-1 flex flex-col min-h-screen overflow-auto">
                {/* Header */}
                <div className="p-4 lg:p-8 border-b border-[#252525]">
                    <h1 className="text-2xl lg:text-3xl font-medium mb-6 lg:mb-8">Published</h1>

                    {/* Filter Controls */}
                    <div className="flex flex-wrap items-center gap-3 lg:gap-4 mb-6">
                        {/* Sports Dropdown */}
                        <div className="relative" ref={sportsDropdownRef} style={{ minWidth: 280 }}>
                          <SportsDropdown
                            mode="field"
                            placeholder="Sport selector"
                            value={selectedSport || ""}
                            onChange={(val) => {
                              const v = Array.isArray(val) ? val[0] : val;
                              setSelectedSport(v || null);
                            }}
                            multiple={true}
                            searchable
                          />
                        </div>

                        {/* Streams Select */}
                        <div className="relative min-w-80" ref={competitionDropdownRef}>
                          <SearchableSelect
                            placeholder="All streams"
                            options={[{ value: "", label: "All streams" }, ...streamOptions]}
                            value={selectedStreamId || ""}
                            onChange={(val) => {
                              const v = Array.isArray(val) ? val[0] : val;
                              setSelectedStreamId(v || null);
                            }}
                            searchable
                          />
                        </div>

                        {/* Platform Select */}
                        <div className="relative min-w-60" ref={timezoneDropdownRef}>
                          <SearchableSelect
                            placeholder="All platforms"
                            options={platformSelectOptions}
                            value={selectedPlatform}
                            onChange={(val) => {
                              const v = Array.isArray(val) ? val[0] : val;
                              setSelectedPlatform(v || "All platforms");
                            }}
                            searchable
                          />
                        </div>

                        {/* Status Select */}
                        <div className="relative min-w-60" ref={statusDropdownRef}>
                          <SearchableSelect
                            placeholder="Status"
                            options={statusSelectOptions}
                            value={selectedStatus}
                            onChange={(val) => {
                              const v = Array.isArray(val) ? val[0] : val;
                              setSelectedStatus(v || "All");
                            }}
                            // searchable
                          />
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col lg:flex-row">
                    {/* Calendar Section */}
                    <div className="flex-1 p-4 lg:p-8">
                        <CalendarView
                            selectedDate={selectedDate}
                            onDateSelect={handleDateSelect}
                            currentMonth={currentMonth}
                            currentYear={currentYear}
                            onMonthChange={handleMonthChange}
                            selectedEventType={selectedEventType}
                            onEventTypeChange={setSelectedEventType}
                            monthCounts={monthCounts}
                        />
                    </div>

                    {/* Content Section */}
                    <div className="w-full lg:w-[2px] h-[2px] lg:h-auto bg-[#252525]"></div>
                    <div className="w-full lg:w-[685px] flex flex-col">
                        {/* Date Header */}
                        <div className="p-4 lg:p-8 border-b border-[#252525]">
                            <h2 className="text-lg lg:text-xl font-bold text-center">
                                {formatSelectedDate(selectedDate)}
                            </h2>
                        </div>

                        {/* Content List */}
                        <div className="flex-1 p-4 lg:p-6 space-y-4 overflow-y-auto">
                            {content.length > 0 ? (
                                content.map((clip) => (
                                    <div key={clip.id} className="relative bg-[#252525] rounded-xl p-4">
                                        <div className="flex flex-col lg:flex-row gap-4">
                                            {/* Thumbnail */}
                                            <div
                                              className="relative w-full lg:w-[213px] h-[180px] lg:h-[120px] bg-[#D9D9D9] rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
                                              onClick={() => {
                                                setPreviewClip({
                                                  id: (clip as any)?._id || clip.id,
                                                  title: clip.title,
                                                  timeRange: '',
                                                  duration: String((clip as any)?.rawDuration || 0),
                                                  aspectRatio: clip.aspectRatio,
                                                  rating: (clip as any)?.ratingValue || 0,
                                                  videoUrl: (clip as any)?.videoUrl || '',
                                                  poster: clip.thumbnail,
                                                  type: (clip as any)?.type || 'clip',
                                                });
                                                setShowPreviewModal(true);
                                              }}
                                            >
                                                <img
                                                    src={clip.thumbnail}
                                                    alt={clip.title}
                                                    className="w-full h-full object-cover"
                                                />

                                                {/* Overlays */}
                                                 <div className="absolute top-2 left-2 flex gap-2">
                                                    <div className="bg-[#18191B] rounded-md px-2 py-1">
                                                        <span className="text-white text-xs">{clip.aspectRatio}</span>
                                                    </div>
                                                </div>
                                                <div className="absolute bottom-2 left-2 flex gap-2">
                                                    {/* <div className="bg-[#18191B] rounded-md px-2 py-1">
                                                        <span className="text-white text-xs">{clip.aspectRatio}</span>
                                                    </div> */}
                                                    <div className="bg-[#18191B] rounded-md px-2 py-1">
                                                        <span className="text-white text-xs">{clip.duration}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Content Info */}
                                            <div className="flex-1 space-y-2">
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <h3 className="text-white font-bold text-sm lg:text-base">
                                                      {truncateText(clip.title, 25)}
                                                    </h3>
                                                  </TooltipTrigger>
                                                  <TooltipContent>
                                                    <p>{clip.title}</p>
                                                  </TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <p className="text-white text-xs lg:text-sm line-clamp-2">
                                                      {truncateText(clip.description || "", 25)}
                                                    </p>
                                                  </TooltipTrigger>
                                                  <TooltipContent>
                                                    <p>{clip.description}</p>
                                                  </TooltipContent>
                                                </Tooltip>

                                                {/* Sport Tag */}
                                                <div className="flex items-center gap-2">
                                                  <Badge
                                                    className="text-xs font-medium px-2 py-1 rounded-md"
                                                    style={{
                                                      backgroundColor: getCategoryColorFromConstant(clip.tags?.[0] || 'Unknown'),
                                                      color: "#FFF",
                                                    }}
                                                  >
                                                    {(clip.tags?.[0] || 'Unknown').toString().charAt(0).toUpperCase() + (clip.tags?.[0] || 'Unknown').toString().slice(1)}
                                                  </Badge>
                                                </div>

                                                {/* Status and Platforms */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {/* Platform Icons */}
                                                        {clip.platforms?.includes("Facebook") && (
                                                          <Tooltip>
                                                            <TooltipTrigger asChild>
                                                              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="16" viewBox="0 0 17 16" fill="none">
                                                                <path d="M8.04004 0C12.462 1.72961e-05 16.0801 3.61805 16.0801 8.04004C16.0801 12.0198 13.1852 15.3166 9.36621 16L9.3291 15.9697C9.35567 15.9652 9.38261 15.9619 9.40918 15.957V10.2891H11.1777L11.54 8.03809H9.40918V6.4707C9.40918 5.8275 9.65043 5.34473 10.6152 5.34473H11.6602V3.29492C11.0974 3.21453 10.4543 3.1338 9.8916 3.13379C8.0424 3.13379 6.75586 4.25953 6.75586 6.26953V8.03809H4.74609V10.2891H6.75586V15.957C6.75839 15.9575 6.76114 15.9576 6.76367 15.958L6.71387 16C2.89487 15.3166 1.56638e-05 12.0198 0 8.04004C0 3.61804 3.61804 0 8.04004 0Z" fill="white" />
                                                              </svg>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                              <p>Facebook</p>
                                                            </TooltipContent>
                                                          </Tooltip>
                                                        )}
                                                        {clip.platforms?.includes("YouTube") && (
                                                          <Tooltip>
                                                            <TooltipTrigger asChild>
                                                              <svg className="w-[18px] h-[13px] fill-white" viewBox="0 0 18 13">
                                                                <path d="M9 1.14538e-09C9.01549 7.16445e-07 14.6309 0.000163857 16.0322 0.375977C16.8072 0.583418 17.4166 1.19283 17.624 1.96777C17.9961 3.36054 18 6.25664 18 6.2998C18 6.2998 18.0004 9.22955 17.624 10.6328C17.4166 11.4077 16.8072 12.0172 16.0322 12.2246C14.6309 12.6004 9.01549 12.6006 9 12.6006C9 12.6006 3.37121 12.601 1.96777 12.2246C1.19284 12.0172 0.583418 11.4077 0.375977 10.6328C-0.000339341 9.22955 1.09977e-09 6.2998 1.09977e-09 6.2998C2.08206e-05 6.25664 0.00246392 3.36054 0.375977 1.96777C0.583418 1.19283 1.19284 0.583418 1.96777 0.375977C3.3712 -0.000343977 9 1.14538e-09 9 1.14538e-09ZM7.20117 9L11.8779 6.30078L7.20117 3.60059V9Z" />
                                                              </svg>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                              <p>YouTube</p>
                                                            </TooltipContent>
                                                          </Tooltip>
                                                        )}
                                                        {clip.platforms?.includes("Instagram") && (
                                                          <Tooltip>
                                                            <TooltipTrigger asChild>
                                                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                                <path d="M12 0C14.2091 0 16 1.79086 16 4V12C16 14.2091 14.2091 16 12 16H4C1.79086 16 0 14.2091 0 12V4C0 1.79086 1.79086 0 4 0H12ZM8 4C5.79086 4 4 5.79086 4 8C4 10.2091 5.79086 12 8 12C10.2091 12 12 10.2091 12 8C12 5.79086 10.2091 4 8 4ZM13 2C12.4477 2 12 2.44772 12 3C12 3.55228 12.4477 4 13 4C13.5523 4 14 3.55228 14 3C14 2.44772 13.5523 2 13 2Z" fill="white" />
                                                              </svg>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                              <p>Instagram</p>
                                                            </TooltipContent>
                                                          </Tooltip>
                                                        )}
                                                        {clip.platforms?.includes("TikTok") && (
                                                          <Tooltip>
                                                            <TooltipTrigger asChild>
                                                              <svg className="w-[14px] h-4 fill-white" viewBox="0 0 14 16">
                                                                <path d="M12.1404 3.42183C12.0324 3.36602 11.9273 3.30483 11.8254 3.23851C11.5292 3.04267 11.2576 2.81191 11.0165 2.55121C10.4132 1.86091 10.1879 1.16061 10.1049 0.6703H10.1082C10.0389 0.26332 10.0675 0 10.0719 0H7.324V10.6255C7.324 10.7681 7.324 10.9091 7.31801 11.0484C7.31801 11.0658 7.31634 11.0818 7.31534 11.1004C7.31534 11.1081 7.31534 11.1161 7.31367 11.1241C7.31367 11.1261 7.31367 11.1281 7.31367 11.1301C7.28471 11.5114 7.1625 11.8796 6.95779 12.2026C6.75309 12.5255 6.47216 12.7931 6.13973 12.982C5.79326 13.1791 5.4014 13.2825 5.00279 13.282C3.72252 13.282 2.6849 12.2381 2.6849 10.9488C2.6849 9.65952 3.72252 8.61557 5.00279 8.61557C5.24514 8.61535 5.48599 8.65348 5.71642 8.72856L5.71975 5.9307C5.02024 5.84035 4.3096 5.89594 3.63265 6.09398C2.9557 6.29201 2.32713 6.62819 1.78661 7.08131C1.31299 7.49283 0.914818 7.98383 0.610007 8.53224C0.494013 8.73223 0.0563678 9.53586 0.00337045 10.8401C-0.0299612 11.5804 0.192361 12.3474 0.298356 12.6644V12.671C0.365019 12.8577 0.623339 13.4947 1.04432 14.0316C1.38378 14.4624 1.78484 14.8407 2.23459 15.1546V15.1479L2.24126 15.1546C3.57153 16.0585 5.04645 15.9992 5.04645 15.9992C5.30177 15.9889 6.15706 15.9992 7.12835 15.5389C8.20563 15.0286 8.81893 14.2683 8.81893 14.2683C9.21074 13.814 9.52229 13.2963 9.74022 12.7374C9.98887 12.0837 10.0719 11.2998 10.0719 10.9865V5.3494C10.1052 5.3694 10.5492 5.66305 10.5492 5.66305C10.5492 5.66305 11.1888 6.07303 12.1868 6.34002C12.9027 6.53001 13.8673 6.57001 13.8673 6.57001V3.84214C13.5294 3.87881 12.8431 3.77215 12.1404 3.42183Z" />
                                                              </svg>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                              <p>TikTok</p>
                                                            </TooltipContent>
                                                          </Tooltip>
                                                        )}
                                                        {clip.platforms?.includes("Email") && (
                                                          <Tooltip>
                                                            <TooltipTrigger asChild>
                                                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="17" viewBox="0 0 18 17" fill="none">
                                                                <path d="M0.9 0H17.1C17.3387 0 17.5676 0.0948211 17.7364 0.263604C17.9052 0.432387 18 0.661305 18 0.9V15.3C18 15.5387 17.9052 15.7676 17.7364 15.9364C17.5676 16.1052 17.3387 16.2 17.1 16.2H0.9C0.661305 16.2 0.432387 16.1052 0.263604 15.9364C0.0948211 15.7676 0 15.5387 0 15.3V0.9C0 0.661305 0.0948211 0.432387 0.263604 0.263604C0.432387 0.0948211 0.661305 0 0.9 0ZM9.054 7.8147L3.2832 2.9142L2.1177 4.2858L9.0657 10.1853L15.8886 4.2813L14.7114 2.9196L9.0549 7.8147H9.054Z" fill="white" />
                                                              </svg>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                              <p>Email</p>
                                                            </TooltipContent>
                                                          </Tooltip>
                                                        )}
                                                        {clip.platforms?.includes("cloud") && (
                                                          <Tooltip>
                                                            <TooltipTrigger asChild>
                                                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                                <path d="M0.888889 0H15.1111C15.3469 0 15.573 0.0936505 15.7397 0.260349C15.9064 0.427048 16 0.653141 16 0.888889V7.11111H0V0.888889C0 0.653141 0.0936505 0.427048 0.260349 0.260349C0.427048 0.0936505 0.653141 0 0.888889 0ZM0 8.88889H16V15.1111C16 15.3469 15.9064 15.573 15.7397 15.7397C15.573 15.9064 15.3469 16 15.1111 16H0.888889C0.653141 16 0.427048 15.9064 0.260349 15.7397C0.0936505 15.573 0 15.3469 0 15.1111V8.88889ZM3.55556 11.5556V13.3333H6.22222V11.5556H3.55556ZM3.55556 2.66667V4.44444H6.22222V2.66667H3.55556Z" fill="white"/>
                                                              </svg>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                              <p>Cloud</p>
                                                            </TooltipContent>
                                                          </Tooltip>
                                                        )}
                                                    </div>

                                                    <div className="text-right">
                                                        <span className={`text-xs ${clip.status.name === "Failed" ? "text-red-500" : "text-white"
                                                            }`}>
                                                            {clip.status.name}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Border for failed status */}
                                        {clip.status.name === "Failed" && (
                                            <div className="absolute inset-0 border border-red-500 rounded-xl pointer-events-none"></div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="flex items-center justify-center h-32 lg:h-64">
                                    <span className="text-gray-400 text-base lg:text-lg">No published events</span>
                                </div>
                            )}
                        </div>

                        {/* Help Button */}
                        <HelpButton />
                    </div>
                </div>
            </div>
            <PreviewModal
              isOpen={showPreviewModal}
              onClose={() => setShowPreviewModal(false)}
              clipData={previewClip || {
                id: '',
                title: '',
                timeRange: '',
                duration: '0',
                aspectRatio: '16:9',
                rating: 0,
                videoUrl: '',
                poster: '',
                type: 'clip'
              }}
              page="published-page"
            />
        </div>
    );
};

export default PublishedHistory;
