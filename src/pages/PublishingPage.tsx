import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store";
import Sidebar from "@/layouts/dashboard/Sidebar";
import SVGIcon from "@/components/common/SVGIcon";
import backArrow from "@/assets/svg/back-arrow.svg";
import Star_Icon from "@/assets/svg/Star_Icon.svg";
import { Button } from "@/components/ui/button";
import { Link2, Download } from "lucide-react";
import { PublishingProvider } from "@/layouts/publishingPage/PublishingContext";
import SocialMediaTab from "@/layouts/publishingPage/SocialMediaTab";
import EmailTab from "@/layouts/publishingPage/EmailTab";
import WebhookTab from "@/layouts/publishingPage/WebhookTab";
import CloudTab from "@/layouts/publishingPage/CloudTab";
import ShareTab from "@/layouts/publishingPage/ShareTab";
import PublishActions from "@/layouts/publishingPage/PublishActions";
import DownloadPanel from "@/components/download/DownloadPanel";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fetchClipById, selectCurrentClip, selectClipLoading, selectClipsError, clearCurrentClip } from "../store/slices/clipsSlice";
import { getFolderById } from "@/api/folderApi";
import moment from "moment";
import { downloadFile } from '@/utils/download';
import { toast } from "sonner";
import ZentagThumbnail from "../assets/images/zentagLogo.png";

type PublishLocationState = { videoUrl?: string; thumbnailUrl?: string; title?: string } | null;

const PublishingPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const passedState = (location.state as PublishLocationState) ?? null;
  const { clipId } = useParams<{ clipId: string }>();
  const [highlightFolder, setHighlightFolder] = useState<any | null>(null);
  const [isHighlight, setIsHighlight] = useState<boolean>(false);

  const [selectedSocialMedia, setSelectedSocialMedia] = useState({
    instagram: { selected: true, post: true, reel: false, story: true },
    tiktok: { selected: true },
    youtube: { selected: true },
    facebook: { selected: true },
    x: { selected: true }
  });
  const [isSocialMediaOpen, setIsSocialMediaOpen] = useState(false);

  const [profile, setProfile] = useState("Studio Main");
  const [privacy, setPrivacy] = useState("Public");
  const [restrictedLocation, setRestrictedLocation] = useState("Belgium");
  const [selectedThumbnail, setSelectedThumbnail] = useState(1);
  const [description, setDescription] = useState("Bangladesh kicks off the match with high energy, pushing forward early in the first half. Great defensive work by Bhutan to intercept that dangerous pass in the midfield. Bangladesh's striker takes a powerful shot, but the Bhutan goalkeeper saves situation! Great defensive work by Bhutan to intercept that");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [date, setDate] = useState("25.07.25");
  const [time, setTime] = useState({ hours: "08", minutes: "30", period: "AM" });
  const [timezone, setTimezone] = useState("CEST");
  const [selectedAspect, setSelectedAspect] = useState<string | null>(null);

  // Clip data from Redux store
  const currentClip = useAppSelector(selectCurrentClip);
  const clipLoading = useAppSelector(selectClipLoading);
  const clipError = useAppSelector(selectClipsError);

  // Fetch clip via Redux and clear on unmount
  useEffect(() => {
    const load = async () => {
      if (!clipId) return;
      if (clipId.startsWith("HighlightId=")) {
        const folderId = clipId.replace("HighlightId=", "");
        setIsHighlight(true);
        try {
          const res = await getFolderById(folderId);
          if (res?.success) setHighlightFolder(res.data);
        } catch (e) {
          console.error(e);
          toast.error("Failed to load highlight folder");
        }
      } else {
        setIsHighlight(false);
        dispatch(fetchClipById(clipId));
      }
    };
    load();
    return () => {
      dispatch(clearCurrentClip());
      setHighlightFolder(null);
      setIsHighlight(false);
    };
  }, [clipId, dispatch]);

  const availableRatios = useMemo(() => {
    if (isHighlight) {
      const ar = String(highlightFolder?.aspectRatio || '').replace(/\s/g, '');
      return ar ? [ar] : [];
    }
    const evs: any[] | undefined = (currentClip as any)?.editedVideos;
    if (!Array.isArray(evs)) {
      if (passedState?.videoUrl) return ['16:9'];
      return [] as string[];
    }
    const list = evs
      .filter((ev: any) => ev?.aspect_ratio)
      .map((ev: any) => String(ev.aspect_ratio).replace(/\s/g, ""));
    const mainAR = String((currentClip as any)?.aspectRatio || '').replace(/\s/g, "");
    const merged = mainAR ? [mainAR, ...list] : list;
    const result = Array.from(new Set(merged));
    if (result.length === 0 && passedState?.videoUrl) return ['16:9'];
    return result;
  }, [currentClip, isHighlight, highlightFolder, passedState?.videoUrl]);



  const selectedEdited = useMemo(() => {
    const evs: any[] | undefined = (currentClip as any)?.editedVideos;
    if (!Array.isArray(evs)) return undefined;
    if (!selectedAspect) return undefined;
    return evs.find((ev: any) => String(ev?.aspect_ratio).replace(/\s/g, "") === selectedAspect && ev?.event !== "DYNAMIC");
  }, [currentClip, selectedAspect]);

  const selectedVideoUrl = isHighlight
    ? (highlightFolder?.previewUrl || "")
    : (selectedEdited?.videoUrl || (currentClip as any)?.videoUrl || passedState?.videoUrl || "");
  const selectedPoster = isHighlight
    ? (highlightFolder?.thumbnail || (Array.isArray(highlightFolder?.thumbnails) ? highlightFolder.thumbnails[0] : undefined))
    : (selectedEdited?.thumbnailUrl || (currentClip as any)?.videoThumbnailUrl || (currentClip as any)?.thumbnailUrl || passedState?.thumbnailUrl);

  useEffect(() => {
    const folderAR = String(highlightFolder?.aspectRatio || '').replace(/\s/g, '');
    const clipAR = String((currentClip as any)?.aspectRatio || '').replace(/\s/g, "");
    if (!selectedAspect) {
      const initial = isHighlight ? (folderAR || availableRatios[0] || null) : (clipAR || availableRatios[0] || (passedState?.videoUrl ? '16:9' : null));
      setSelectedAspect(initial);
    }
  }, [currentClip, highlightFolder, isHighlight, availableRatios, selectedAspect, passedState?.videoUrl]);

  const playerMaxWidth = useMemo(() => {
    const ar = String(selectedAspect || '').replace(/\s/g, '');
    if (!ar || !ar.includes(':')) return 560;
    const [w, h] = ar.split(':').map(Number);
    if (!w || !h) return 560;
    if (h > w) return 360; // vertical
    if (h === w) return 420; // square
    return 560; // landscape
  }, [selectedAspect]);

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isPrivacyDropdownOpen, setIsPrivacyDropdownOpen] = useState(false);
  const [isTimezoneDropdownOpen, setIsTimezoneDropdownOpen] = useState(false);

  const handleSocialMediaToggle = (platform: string, subType?: string) => {
    if (platform === "instagram" && subType) {
      setSelectedSocialMedia({
        ...selectedSocialMedia,
        instagram: {
          ...selectedSocialMedia.instagram,
          [subType]: !selectedSocialMedia.instagram[subType as keyof typeof selectedSocialMedia.instagram]
        }
      });
    } else {
      setSelectedSocialMedia({
        ...selectedSocialMedia,
        [platform]: {
          ...selectedSocialMedia[platform as keyof typeof selectedSocialMedia],
          selected: !selectedSocialMedia[platform as keyof typeof selectedSocialMedia].selected
        }
      });
    }
  };

  const handleCopyLink = async () => {
    try {
      const url = isHighlight ? (highlightFolder?.previewUrl || "") : (currentClip?.videoUrl || "");
      if (url) {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleDownload = async () => {
    try {
      const videoUrl = isHighlight ? (highlightFolder?.previewUrl || "") : (currentClip?.videoUrl || "");
      if (!videoUrl) return;
      const name = isHighlight ? (highlightFolder?.title || 'video') : (currentClip?.title || 'video');
      await downloadFile(String(videoUrl), String(name));
    } catch (error) {
      console.error('Error downloading video:', error);
    }
  };

  const handlePublish = () => {
    console.log("Publishing clip", clipId);
    console.log("Social media:", selectedSocialMedia);
    console.log("Schedule:", scheduleEnabled, date, time);
  };

  const truncateText = (text: string | undefined | null, maxLength: number = 35) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="h-screen bg-[#18191B] text-white flex overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#18191B] border-b border-[#252525] px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Back button and title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="text-white hover:text-gray-300 transition-colors h-7 w-7 flex items-center justify-center"
              >
                <SVGIcon
                  src={backArrow}
                  className="w-[8px] h-[13px]"
                  aria-label="Back"
                />
              </button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <h1 className="text-[24px] font-medium leading-none text-white h-7 flex items-center mt-2"> {truncateText(isHighlight ? (highlightFolder?.title || 'Highlight') : (currentClip?.title || passedState?.title || (clipId ? `Clip` : "Clip")))}</h1>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isHighlight ? (highlightFolder?.title || 'Highlight') : (currentClip?.title || passedState?.title || (clipId ? `Clip` : "Clip"))}</p>
                </TooltipContent>
              </Tooltip>
              {/* Optional AI badge */}
              {/* <div className="flex items-center gap-2">
                <SVGIcon src={Star_Icon} className="w-5 h-5" aria-label="AI" />
              </div> */}
            </div>

            {/* Actions on the right (Download first, then Copy link) */}
            <div className="flex items-center gap-1 pr-2">
              <Button
                className="bg-[#252525] hover:bg-[#2A2A2A] text-white border-none h-[32px] w-[32px] p-0 rounded-lg"
                onClick={handleDownload}
                aria-label="Download"
                title="Download"
              >
                <Download size={16} />
              </Button>
              <Button
                className="bg-[#252525] hover:bg-[#2A2A2A] text-white border-none h-[32px] w-[32px] p-0 rounded-lg"
                onClick={handleCopyLink}
                aria-label="Copy share link"
                title="Copy share link"
              >
                <Link2 size={16} />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Video Player Section */}
          <div className="flex-1 bg-black flex flex-col items-center justify-start p-8 gap-4">
            <div className="w-full max-w-[840px] flex items-center gap-2">
              <span className="text-xs font-bold text-white">Available ratios</span>
              <div className="flex items-center gap-2 overflow-x-auto">
                {availableRatios.map((r) => (
                  <button
                    key={r}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-1 text-xs ${selectedAspect === r ? 'border-white bg-[#252525] text-white' : 'border-[#252525] text-white'}`}
                    onClick={() => setSelectedAspect(r)}
                  >
                    <div className={`${(() => { const [w, h] = r.split(':').map(Number); if (w === h) return 'w-3 h-3'; return h > w ? 'w-2 h-3' : 'w-3 h-2'; })()} bg-gradient-to-br from-[#00BBFF] to-[#0051FF] rounded-sm`} />
                    <span>{r}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className={`${(['16:9', '1:1', '3:4', '4:5', '4:3', '9:16', '9:18'].includes(String(selectedAspect))) ? 'flex flex-1 items-center justify-center w-full' : 'block w-full'}`}>
              <div className="relative w-full h-auto" style={{ maxWidth: (['9:16', '9:18'].includes(String(selectedAspect)) ? '300px' : playerMaxWidth), aspectRatio: selectedAspect ? selectedAspect.replace(':', ' / ') : undefined }}>
                <div className="absolute inset-0 bg-[#D9D9D9] rounded-[10px] overflow-hidden flex items-center justify-center">
                  {!isHighlight && clipLoading && !passedState?.videoUrl && (
                    <div className="flex flex-col items-center justify-center gap-3 text-gray-400">
                      <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#00EEFF] border-t-transparent" />
                      <span className="text-sm">Loading clip…</span>
                    </div>
                  )}
                  {!isHighlight && clipError && !passedState?.videoUrl && (
                    <div className="flex flex-col items-center justify-center gap-3 px-4 text-center">
                      <p className="text-sm text-red-400">Failed to load clip.</p>
                      <Button variant="outline" size="sm" className="border-[#252525] text-white hover:bg-[#252525]" onClick={() => clipId && dispatch(fetchClipById(clipId))}>
                        Retry
                      </Button>
                    </div>
                  )}
                  {selectedVideoUrl && !(!isHighlight && clipLoading && !passedState?.videoUrl) && !(!isHighlight && clipError && !passedState?.videoUrl) ? (
                    <video
                      src={selectedVideoUrl}
                      poster={selectedPoster}
                      controls
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : !(!isHighlight && clipLoading && !passedState?.videoUrl) && !(!isHighlight && clipError && !passedState?.videoUrl) ? (
                    <img
                      src={(currentClip as any)?.thumbnailUrl || (currentClip as any)?.videoThumbnailUrl || selectedPoster || passedState?.thumbnailUrl || ''}
                      alt="Video preview"
                      className="w-full h-full object-cover"
                    />
                  ) : null}

                  {/* Video Controls Overlay */}
                  {/* <div className="absolute top-4 left-3 flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-[115px] h-1 bg-white"></div>
                    <div className="w-[115px] h-1 bg-[#18191B]"></div>
                    <div className="w-[115px] h-1 bg-[#18191B]"></div>
                  </div>
                </div> */}

                  {/* Mute Button */}
                  {/* <div className="absolute top-10 left-3">
                  <button className="w-[42px] h-8 bg-[#18191B] rounded-md flex items-center justify-center">
                    <svg width="19" height="13" viewBox="0 0 19 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3.85317 9.51946H0.78813C0.579105 9.51946 0.378641 9.43888 0.230838 9.29543C0.0830349 9.15198 0 8.95743 0 8.75456V4.16515C0 3.96228 0.0830349 3.76773 0.230838 3.62428C0.378641 3.48083 0.579105 3.40025 0.78813 3.40025H3.85317L8.02553 0.0866893C8.08326 0.0407547 8.15325 0.0116803 8.22734 0.00285084C8.30144 -0.00597864 8.3766 0.00580007 8.44406 0.0368158C8.51153 0.0678314 8.56853 0.116808 8.60843 0.178044C8.64833 0.239279 8.66948 0.310254 8.66943 0.382706V12.537C8.66948 12.6095 8.64833 12.6804 8.60843 12.7417C8.56853 12.8029 8.51153 12.8519 8.44406 12.8829C8.3766 12.9139 8.30144 12.9257 8.22734 12.9169C8.15325 12.908 8.08326 12.879 8.02553 12.833L3.85396 9.51946H3.85317ZM15.3008 6.45985L18.0876 9.16455L16.9732 10.2461L14.1863 7.54143L11.3995 10.2461L10.2851 9.16455L13.0719 6.45985L10.2851 3.75516L11.3995 2.67359L14.1863 5.37828L16.9732 2.67359L18.0876 3.75516L15.3008 6.45985Z" fill="white" />
                    </svg>
                  </button>
                </div> */}

                  {/* Video Info Badge — only when we have clip/highlight data (not loading/error) */}
                  {!(isHighlight ? false : clipLoading || clipError) && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center gap-1 mt-4">
                      <div className="bg-[#18191B] rounded-md px-2 py-1 flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5.24097 0.357596C5.43291 -0.120387 6.10957 -0.120388 6.30151 0.357594L7.44793 3.21243C7.52967 3.41597 7.7207 3.55477 7.93955 3.56961L11.0089 3.77773C11.5228 3.81257 11.7319 4.4561 11.3366 4.78636L8.9758 6.75886C8.80747 6.8995 8.73451 7.12407 8.78802 7.33679L9.53857 10.3202C9.66424 10.8198 9.11681 11.2175 8.68058 10.9436L6.07507 9.30786C5.88931 9.19123 5.65317 9.19123 5.46741 9.30786L2.8619 10.9436C2.42567 11.2175 1.87824 10.8198 2.00391 10.3202L2.75446 7.33679C2.80798 7.12407 2.73501 6.8995 2.56668 6.75886L0.205837 4.78636C-0.189437 4.4561 0.0196607 3.81257 0.533563 3.77773L3.60294 3.56961C3.82178 3.55477 4.01281 3.41597 4.09455 3.21243L5.24097 0.357596Z" fill="white" />
                        </svg>
                        <span className="text-white font-bold text-xs">{(currentClip as any)?.rating ?? (highlightFolder as any)?.rating ?? "—"}</span>
                      </div>
                      <div className="bg-[#18191B] rounded-md px-2 py-1 flex items-center gap-1">
                        <span className="text-white text-xs font-medium">{selectedAspect || ""}</span>
                      </div>
                      <div className="bg-[#18191B] rounded-md px-2 py-1 flex items-center gap-1">
                        <span className="text-white text-xs font-medium">{isHighlight ? (highlightFolder?.totalDuration ? moment.utc((highlightFolder.totalDuration || 0) * 1000).format('mm:ss') : '00:00') : ((currentClip as any)?.duration ? moment.utc((currentClip as any).duration * 1000).format('mm:ss') : '00:00')}</span>
                      </div>
                    </div>
                  )}

                  {/* Bottom Controls */}
                  {/* <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-4">
                  <button className="w-[42px] h-[42px] bg-[#18191B] rounded-xl flex items-center justify-center hover:bg-[#252525]">
                    <svg width="7" height="12" viewBox="0 0 7 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M0.000104479 5.75L6.57154 11.5L6.57153 0L0.000104479 5.75Z" fill="white" />
                    </svg>
                  </button>
                  <button className="w-[42px] h-[42px] bg-[#18191B] rounded-xl flex items-center justify-center hover:bg-[#252525]">
                    <div className="flex gap-1">
                      <div className="w-0.5 h-3 bg-white"></div>
                      <div className="w-0.5 h-3 bg-white"></div>
                    </div>
                  </button>
                  <button className="w-[42px] h-[42px] bg-[#18191B] rounded-xl flex items-center justify-center hover:bg-[#252525]">
                    <svg width="7" height="12" viewBox="0 0 7 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6.57143 5.75L-2.01072e-06 11.5L0 0L6.57143 5.75Z" fill="white" />
                    </svg>
                  </button>
                </div> */}
                </div>
              </div>
            </div>
          </div>

          {/* Publisher Panel */}
          <div className="w-[690px] bg-[#18191B] border-l border-[#252525] overflow-y-auto">
            {/* Publisher Header */}
            <div className="bg-[#252525] px-4 py-3 border-b border-[#252525] sticky top-0 z-10">
              <h2 className="text-xl font-bold text-white text-left">Publisher</h2>
            </div>

            {/* Content */}
            <PublishingProvider>
              <div className="p-6 space-y-3">
                <SocialMediaTab
                  scheduleEnabled={scheduleEnabled}
                  onToggleSchedule={() => setScheduleEnabled(prev => !prev)}
                  date={date}
                  onDateChange={setDate}
                  time={time}
                  onTimeChange={setTime}
                  timezone={timezone}
                  onTimezoneClick={() => setIsTimezoneDropdownOpen(prev => !prev)}
                  highlightFolder={highlightFolder}
                  isHighlight={isHighlight}
                  selectedAspect={selectedAspect || undefined}
                />

                {/* Expandable Sections */}
                <div className="space-y-3">
                  <EmailTab />
                  <CloudTab />
                  <WebhookTab />
                  <ShareTab />
                </div>

                {/* Action Buttons */}
                {/* <div className="flex items-center justify-center gap-5 pt-6">
                  <Button
                    onClick={() => navigate(-1)}
                    className="w-[160px] h-[42px] bg-[#1B1B1B] border border-white text-white text-sm font-medium rounded-xl hover:bg-[#252525] transition-colors"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePublish}
                    className="w-[160px] h-[42px] bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
                  >
                    Publish
                  </Button>
                </div> */}
              </div>
            </PublishingProvider>
          </div>
        </div>

        {/* Download Button */}
        {/* <button className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[42px] h-[42px] bg-[#252525] rounded-xl flex items-center justify-center hover:bg-[#2A2A2A]">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 27H30V29H12V27Z" fill="white" />
            <path d="M20.25 19L20.25 13L21.75 13L21.75 19L27 19L21 25L15 19L20.25 19Z" fill="white" />
          </svg>
        </button> */}
      </div>
      <DownloadPanel />
    </div>
  );
};

export default PublishingPage;
