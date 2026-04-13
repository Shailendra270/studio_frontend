import React, { useMemo, useState, useEffect } from 'react';
import SectionHeader from './SectionHeader';
import { usePublishing } from './PublishingContext';
import SVGIcon from '@/components/common/SVGIcon';
import SparkleGradient from '@/assets/svg/SparkleGradient.svg';
import { Plus, X, Minus, Info } from "lucide-react";
import { useAppSelector } from "@/store";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { selectTeams } from "@/store/slices/teamsSlice";
import { selectCompetitions } from "@/store/slices/competitionsSlice";
import { generateSocialDescription } from "@/api/socialGenerate";
import { selectCurrentClip } from "@/store/slices/clipsSlice";
import GradientRailSlider from "@/components/ui/gradient-rail-slider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateClip } from "@/api/clipApi";
import { socialApi } from "@/api/socialApi";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import InstagramPostPreviewModal from "@/components/modals/SocialMediaPublishPageModals/InstagramPostPreviewModal";
import InstagramReelPreviewModal from "@/components/modals/SocialMediaPublishPageModals/InstagramReelPreviewModal";
import InstagramStoryPreviewModal from "@/components/modals/SocialMediaPublishPageModals/InstagramStoryPreviewModal";
import XPostPreviewModal from "@/components/modals/SocialMediaPublishPageModals/XPostPreviewModal";
import TikTokPreviewModal from "@/components/modals/SocialMediaPublishPageModals/TikTokPreviewModal";
import FacebookPostPreviewModal from "@/components/modals/SocialMediaPublishPageModals/FacebookPostPreviewModal";
import FacebookStoryPreviewModal from "@/components/modals/SocialMediaPublishPageModals/FacebookStoryPreviewModal";
import YouTubeShortsPreviewModal from "@/components/modals/SocialMediaPublishPageModals/YouTubeShortsPreviewModal";
import YouTubePostPreviewModal from "@/components/modals/SocialMediaPublishPageModals/YouTubePostPreviewModal";
import SocialMediaIcon from '@/assets/svg/Social_media_Icons/social_media.svg';
import { SearchableSelect } from "@/components/ui/searchable-select";
import PreviewModal from "@/components/modals/PreviewModal";
import { languageOptions } from "@/constants/AddVideo";

type SocialMediaTabProps = {
  scheduleEnabled: boolean;
  date: string;
  time: { hours: string; minutes: string; period: 'AM' | 'PM' };
  timezone: string;
  onToggleSchedule: () => void;
  onDateChange: (next: string) => void;
  onTimeChange: (next: { hours: string; minutes: string; period: 'AM' | 'PM' }) => void;
  onTimezoneClick: () => void;
  highlightFolder?: any;
  isHighlight?: boolean;
  selectedAspect?: string;
};

const validationRules = {
  instagram: {
    post: "Caption ≤ 2200. Feed: 1 video OR ≤ 1 image.",
    reel: "Caption ≤ 2200. Reel: ≤ 90 sec, Recommended 9:16 vertical.",
    story: "1 media only, ≤ 15 sec. No mixed media.",
  },
  youtube: {
    post: "Caption ≤ 5000. Title ≤ 100 (required). Only 1 video.",
    shorts: "≤ 180 sec. Thumbnail required optional (<2MB). Aspect ratio recommended 9:16.",
  },
  facebook: {
    post: "Feed: 1 video allowed. 1 image only",
    story: "1 media only. Caption ≤ 280.",
  },
  x: {
    post: "Caption ≤ 280. ≤ 1 image. 1 video only. No mixed media.",
  },
  tiktok: {
    post: "Caption ≤ 2200. 1 video OR ≤ 1 image. No mixing images + video. Line breaks ignored. Recommended 9:16 vertical.",
  },
};

const SocialMediaTab: React.FC<SocialMediaTabProps> = ({
  scheduleEnabled,
  date,
  time,
  timezone,
  onToggleSchedule,
  onDateChange,
  onTimeChange,
  onTimezoneClick,
  highlightFolder,
  isHighlight,
  selectedAspect,
}) => {
  const {
    isSocialMediaOpen,
    setIsSocialMediaOpen,
    selectedSocialMedia,
    handleSocialMediaToggle,
    mediaTypeSelections,
    setMediaTypeSelections,
    tags: publishingTags,
    profile,
    setProfile,
    privacy,
    setPrivacy,
  } = usePublishing();

  const currentClip = useAppSelector(selectCurrentClip);
  const currentStream = useSelector((state: RootState) => state.streams.currentStream);
  const teams = useSelector(selectTeams);
  const competitions = useSelector(selectCompetitions);
  const [addedTags, setAddedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState<string>("");
  const [removedTags, setRemovedTags] = useState<string[]>([]);
  const [generatedSelection, setGeneratedSelection] = useState<number>(1);
  const [descriptionText, setDescriptionText] = useState<string>(isHighlight ? (highlightFolder?.description || "") : (currentClip?.description || ""));
  const [titleText, setTitleText] = useState<string>(String(isHighlight ? (highlightFolder?.title || "") : (currentClip as any)?.title || ""));
  const [generatedTags, setGeneratedTags] = useState<string[] | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [previewVariant, setPreviewVariant] = useState<'post' | 'reel' | 'story' | 'shorts'>('post');
  const [previewPlatform, setPreviewPlatform] = useState<'instagram' | 'x' | 'tiktok' | 'facebook' | 'youtube'>('instagram');
  const [selectedLanguage, setSelectedLanguage] = useState<string>("english");
  const [profileOptions, setProfileOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [selectedProfileKey, setSelectedProfileKey] = useState<string>("");
  const [isThumbnailPreviewOpen, setIsThumbnailPreviewOpen] = useState<boolean>(false);
  const [facebookRestrictedCountries, setFacebookRestrictedCountries] = useState<string[]>([]);

  const previewDescription = useMemo(() => {
    const base = descriptionText || (isHighlight ? (highlightFolder?.description || "") : (currentClip as any)?.description || "");
    const s = String(base || "");
    return s.length > 30 ? (s.slice(0, 30) + " ...more") : s;
  }, [descriptionText, isHighlight, highlightFolder, currentClip]);

  const facebookCountryOptions = useMemo(() => {
    const dn = new Intl.DisplayNames(["en"], { type: "region" });
    let regions: string[] = [];
    const intlAny = Intl as any;
    const supportedValuesOf = typeof intlAny?.supportedValuesOf === "function" ? intlAny.supportedValuesOf : undefined;
    try {
      regions = supportedValuesOf ? (supportedValuesOf("region") as string[]) : [];
    } catch {
      regions = [];
    }
    if (!regions || regions.length === 0) {
      regions = [
        "US","CA","GB","AU","IN","DE","FR","ES","IT","BR","JP","KR","MX","NL","NO","SE","CH","RU","ZA","AE",
        "AR","BE","BG","CL","CN","CO","CZ","DK","EG","FI","GR","HK","HU","ID","IE","IL","MY","NZ","PE","PH",
        "PL","PT","RO","SA","SG","TH","TR","TW","UA","VN"
      ];
    }
    return regions
      .filter((c) => /^[A-Z]{2}$/.test(String(c)))
      .map((code) => ({ value: code, label: dn.of(code) || code }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, []);
  
  useEffect(() => {
    setTitleText(String(isHighlight ? (highlightFolder?.title || "") : (currentClip as any)?.title || ""));
    setDescriptionText(String(isHighlight ? (highlightFolder?.description || "") : (currentClip as any)?.description || ""))
  }, [currentClip, highlightFolder, isHighlight]);

  useEffect(() => {
    (async () => {
      try {
        const data = await socialApi.getProfiles();
        if (Array.isArray(data)) {
          // Build dropdown options from profiles in DB
          const opts = data
            .filter((p: any) => p?.profileKey && p?.title)
            .map((p: any) => ({ value: String(p.profileKey), label: String(p.title) }));
          setProfileOptions(opts);
          // If nothing selected yet, preselect first option
          if (!selectedProfileKey && opts.length > 0) {
            setSelectedProfileKey(opts[0].value);
            setProfile(opts[0].label);
          }
        }
      } catch (e) {
        // Silently ignore; user can still publish with default server-side profile
      }
    })();
  }, []);

  type EditedVideoInfo = {
    aspect_ratio?: string;
    event?: string;
    duration?: number;
    url?: string;
    videoUrl?: string;
  };

  const toPositiveNumber = (value: unknown): number | undefined => {
    const n = typeof value === 'number' ? value : Number(value);
    if (Number.isFinite(n) && n > 0) return n;
    return undefined;
  };

  const editedVideoForAspect = useMemo(() => {
    const clip = currentClip as unknown as { editedVideos?: unknown } | undefined;
    const evsUnknown = clip?.editedVideos;
    const evs = Array.isArray(evsUnknown) ? (evsUnknown as EditedVideoInfo[]) : undefined;
    if (!Array.isArray(evs)) return undefined;
    if (!selectedAspect) return undefined;
    return evs.find((ev) => String(ev?.aspect_ratio).replace(/\s/g, '') === selectedAspect && ev?.event !== 'DYNAMIC');
  }, [currentClip, selectedAspect]);

  const clipDurationSeconds = useMemo(() => {
    if (isHighlight) {
      const folder = highlightFolder as unknown as Record<string, unknown> | undefined;
      const d1 = toPositiveNumber(folder?.totalDuration);
      if (d1) return d1;
      const d2 = toPositiveNumber(folder?.duration);
      if (d2) return d2;
      const clipsUnknown = (folder?.clipsinfo ?? folder?.clips);
      if (Array.isArray(clipsUnknown) && clipsUnknown.length > 0) {
        const sum = clipsUnknown.reduce((acc, c) => {
          const dur = toPositiveNumber((c as Record<string, unknown> | null | undefined)?.duration);
          return acc + (dur || 0);
        }, 0);
        return sum > 0 ? sum : undefined;
      }
      return undefined;
    }

    const evDur = toPositiveNumber(editedVideoForAspect?.duration);
    if (evDur) return evDur;
    const clip = currentClip as unknown as { duration?: unknown } | undefined;
    const clipDur = toPositiveNumber(clip?.duration);
    if (clipDur) return clipDur;
    return undefined;
  }, [currentClip, editedVideoForAspect, highlightFolder, isHighlight]);

  const parseAspectRatioToNumber = (ratio: unknown): number | undefined => {
    const s = String(ratio || '').replace(/\s/g, '');
    if (!s) return undefined;
    if (s.includes(':')) {
      const [w, h] = s.split(':');
      const wn = Number(w);
      const hn = Number(h);
      if (!wn || !hn) return undefined;
      return wn / hn;
    }
    const n = Number(s);
    if (!Number.isNaN(n) && n > 0) return n;
    return undefined;
  };

  const selectedAspectNumber = useMemo(() => {
    if (selectedAspect) return parseAspectRatioToNumber(selectedAspect);
    const clip = currentClip as unknown as { aspectRatio?: unknown } | undefined;
    return parseAspectRatioToNumber(clip?.aspectRatio);
  }, [currentClip, selectedAspect]);

  const isVerticalAspect = useMemo(() => {
    const r = selectedAspectNumber;
    if (!r) return false;
    return Math.abs(r - (9 / 16)) < 0.05;
  }, [selectedAspectNumber]);

  const aspectCss = useMemo(() => {
    if (!selectedAspect) return undefined;
    const ar = String(selectedAspect).replace(/\s/g, '');
    if (ar.includes(':')) {
      const [w, h] = ar.split(':');
      const wn = parseFloat(w) || 16;
      const hn = parseFloat(h) || 9;
      return `${wn}/${hn}`;
    }
    return undefined;
  }, [selectedAspect]);

  const thumbWidth = useMemo(() => {
    if (!selectedAspect) return 115;
    const parts = selectedAspect.split(':');
    const w = Number(parts[0]);
    const h = Number(parts[1]);
    if (!w || !h) return 115;
    if (h > w) return 115; // vertical
    if (h === w) return 130; // square
    return 180; // landscape
  }, [selectedAspect]);

  const aggregatedFolderTranscript = useMemo(() => {
    if (!isHighlight) return "";
    const pieces: string[] = [];
    const clips = (highlightFolder?.clipsinfo || highlightFolder?.clips || []) as any[];
    if (Array.isArray(clips) && clips.length > 0) {
      for (const c of clips) {
        const txt = String(c?.transcript || c?.description || c?.title || "").trim();
        if (txt) pieces.push(txt);
      }
    }
    if (pieces.length > 0) return pieces.join(" ");
    return String(highlightFolder?.description || "");
  }, [highlightFolder, isHighlight]);

  const aggregatedFolderTags = useMemo(() => {
    if (!isHighlight) return [];
    const set = new Set<string>();
    const clips = (highlightFolder?.clipsinfo || highlightFolder?.clips || []) as any[];
    if (Array.isArray(clips) && clips.length > 0) {
      for (const c of clips) {
        const tagsArr = Array.isArray(c?.tags) ? c.tags : [];
        for (const t of tagsArr) {
          const s = String(t || '').trim();
          if (s) set.add(s);
        }
      }
    }
    if (set.size === 0 && Array.isArray(highlightFolder?.tags)) {
      for (const t of (highlightFolder?.tags as any[])) {
        const s = String(t || '').trim();
        if (s) set.add(s);
      }
    }
    return Array.from(set);
  }, [highlightFolder, isHighlight]);

  const clipTags = isHighlight ? aggregatedFolderTags : (currentClip?.tags || []);

  const selectedThumbUrl = useMemo(() => {
    // Prefer thumbnails array by slider index, otherwise fallback to editedVideo thumbnailUrl, then clip thumbnail
    if (isHighlight) {
      const thumbsH: string[] | undefined = highlightFolder?.thumbnails;
      if (Array.isArray(thumbsH) && thumbsH.length > 0) {
        const idx = Math.min(Math.max(Math.round(generatedSelection) - 1, 0), thumbsH.length - 1);
        return thumbsH[idx];
      }
      return highlightFolder?.thumbnail || '';
    }
    const ev: any | undefined = editedVideoForAspect;
    const thumbs: string[] | undefined = ev?.thumbnails;
    if (Array.isArray(thumbs) && thumbs.length > 0) {
      const idx = Math.min(Math.max(Math.round(generatedSelection) - 1, 0), thumbs.length - 1);
      return thumbs[idx];
    }
    const normalize = (s: string) => String(s || '').replace(/\s/g, '');
    const mainAR = normalize((currentClip as any)?.aspectRatio);
    const clipThumbs: string[] | undefined = (currentClip as any)?.thumbnails;
    if (Array.isArray(clipThumbs) && clipThumbs.length > 0 && normalize(selectedAspect) === mainAR) {
      const idx = Math.min(Math.max(Math.round(generatedSelection) - 1, 0), clipThumbs.length - 1);
      return clipThumbs[idx];
    }
    return ev?.thumbnailUrl || (currentClip as any)?.thumbnailUrl || (currentClip as any)?.videoThumbnailUrl || (currentClip as any)?.thumbnail;
  }, [editedVideoForAspect, generatedSelection, currentClip, highlightFolder, isHighlight, selectedAspect]);

  const currentVideoUrl = useMemo(() => {
    return (editedVideoForAspect as any)?.videoUrl || (editedVideoForAspect as any)?.url || (currentClip as any)?.videoUrl || (currentClip as any)?.path;
  }, [editedVideoForAspect, currentClip]);

  const highlightPreviewUrl = useMemo(() => {
    if (!isHighlight) return "";
    return String((highlightFolder as any)?.previewUrl || (highlightFolder as any)?.previewURL || "");
  }, [isHighlight, highlightFolder]);

  const getPreviewVideoUrl = (platform: "instagram" | "facebook" | "x" | "youtube" | "tiktok", variant?: string) => {
    let selectedMediaType = "VIDEO";
    if (platform === "instagram") selectedMediaType = mediaTypeSelections.instagram;
    else if (platform === "facebook") selectedMediaType = mediaTypeSelections.facebook;
    else if (platform === "x") selectedMediaType = mediaTypeSelections.x;

    // Force VIDEO for formats that are always video or where Post As option was removed
    if (platform === 'instagram' && (variant === 'story' || variant == 'reel')) {
      selectedMediaType = 'VIDEO';
    }

    if (isHighlight && selectedMediaType === "VIDEO" && highlightPreviewUrl) return highlightPreviewUrl;
    return currentVideoUrl;
  };

  const sanitizeTagBody = (raw: string) => {
    const withoutHash = String(raw || '').trim().replace(/^#+/, '');
    if (!withoutHash) return '';
    const replaced = withoutHash.replace(/[^A-Za-z0-9_]/g, '_').replace(/_+/g, '_');
    return replaced;
    // return replaced.replace(/^_+|_+$/g, '');
  };

  const sanitizeNewTagInput = (raw: string) => {
    const trimmed = String(raw || '');
    const hasLeadingHash = trimmed.trim().startsWith('#');
    const body = sanitizeTagBody(trimmed);
    if (!body) return hasLeadingHash ? '#' : '';
    return hasLeadingHash ? `#${body}` : body;
  };

  const formatTag = (t: string) => {
    const body = sanitizeTagBody(t);
    if (!body) return "";
    return `#${body}`;
  };

  const allTags = useMemo(() => {
    const normalized = [...clipTags.map(formatTag), ...addedTags.map(formatTag)];
    const unique = Array.from(new Set(normalized));
    return unique.filter((t) => !removedTags.includes(t));
  }, [clipTags, addedTags, removedTags]);

  const displayTags = useMemo(() => {
    if (generatedTags && generatedTags.length > 0) {
      const formattedGen = generatedTags.map(formatTag);
      const merged = Array.from(new Set([...formattedGen, ...allTags]));
      return merged.filter((t) => !removedTags.includes(t));
    }
    return allTags;
  }, [generatedTags, allTags, removedTags]);

  const handleNewTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const formatted = formatTag(newTag);
      if (formatted && !allTags.includes(formatted)) {
        setAddedTags(prev => [...prev, formatted]);
      }
      // If previously removed, re-allow it
      setRemovedTags(prev => prev.filter(t => t !== formatted));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setAddedTags(prev => prev.filter(t => formatTag(t) !== tagToRemove));
    setRemovedTags(prev => (prev.includes(tagToRemove) ? prev : [...prev, tagToRemove]));
  };

  // const renderYouTubeOptions = (variant: 'post' | 'shorts') => (
  //   <>
  //     <div className="grid grid-cols-2 gap-5 mt-3">
  //       <div className="space-y-2">
  //         <SearchableSelect
  //           label="Profile"
  //           placeholder="Select profile"
  //           options={[
  //             { value: "Studio sales", label: "Studio sales" },
  //             { value: "Studio main", label: "Studio main" },
  //             { value: "Studio demo", label: "Studio demo" },
  //           ]}
  //           value={profile}
  //           onChange={(val) => setProfile(String(val))}
  //         />
  //       </div>
  //       <div className="space-y-2">
  //         <SearchableSelect
  //           label="Privacy"
  //           placeholder="Select privacy"
  //           options={[
  //             { value: "Public", label: "Public" },
  //             { value: "Private", label: "Private" },
  //             { value: "Unlisted", label: "Unlisted" },
  //           ]}
  //           value={privacy}
  //           searchable={false}
  //           onChange={(val) => setPrivacy(String(val))}
  //         />
  //       </div>
  //     </div>

  //     <div className="space-y-3 mt-4">
  //       <label className="text-xs text-white font-medium">Thumbnail</label>
  //       <div className="flex items-center gap-6">
  //         <div className="w-[320px] h-[200px] bg-[#1B1B1B] rounded-2xl shadow-md shadow-black/30 flex items-center justify-center">
  //           <div className="rounded-xl overflow-hidden bg-[#252525]" style={{ width: thumbWidth, aspectRatio: aspectCss }}>
  //             <img src={selectedThumbUrl} alt="Thumbnail" className="w-full h-full object-cover" />
  //           </div>
  //         </div>
  //         <div className="w-[280px] space-y-4">
  //           <div className="text-center space-y-3">
  //             <div className="flex items-center gap-1 justify-center">
  //               <SVGIcon src={SparkleGradient} className="w-3 h-3 flex-shrink-0" aria-label="Generated" />
  //               <span className="text-xs font-bold text-white">Select from generated</span>
  //             </div>
  //             <div className="mx-auto w-full flex justify-center">
  //               <GradientRailSlider
  //                 label=""
  //                 min={1}
  //                 max={10}
  //                 step={1}
  //                 value={generatedSelection}
  //                 onChange={(v) => setGeneratedSelection(v)}
  //                 formatValue={(v) => `#${Math.round(v)}`}
  //                 railWidth={240}
  //                 height={40}
  //                 pillWidth={48}
  //               />
  //             </div>
  //           </div>
  //           <div className="flex items-center justify-center">
  //             <span className="text-xs text-white/80">or</span>
  //           </div>
  //           <div className="flex justify-center">
  //             <button className="h-[42px] bg-[#1B1B1B] border border-white rounded-xl px-4 text-sm text-white">Upload New</button>
  //           </div>
  //         </div>
  //       </div>
  //     </div>

  //     <div className="space-y-3 mt-4">
  //       <div className="flex items-center justify-between">
  //         <label className="text-xs text-white font-medium">Title</label>
  //       </div>
  //       <input className="w-full bg-[#252525] rounded-xl p-3 text-white text-sm" placeholder="Add a title" defaultValue={(currentClip as any)?.title || ''} />
  //     </div>

  //     <div className="space-y-3 mt-4">
  //       <div className="flex items-center justify-between">
  //         <label className="text-xs text-white font-medium">Description</label>
  //         <button type="button" className="flex items-center gap-1 text-xs font-bold text-white hover:underline" onClick={async () => {
  //           try {
  //             if (isHighlight) { toast.success("Description updated"); return; }
  //             if (!currentClip?._id) return;
  //             const res = await updateClip(currentClip._id, { description: descriptionText });
  //             if (res.success) { toast.success("Description saved to clip"); } else { toast.error(res.error || res.message || "Failed to save"); }
  //           } catch (e: any) { toast.error(e.message || "Failed to save"); }
  //         }}>
  //           <SVGIcon src={SparkleGradient} className="w-3 h-3 flex-shrink-0" aria-label="Generate" />
  //           <span>Generate</span>
  //         </button>
  //       </div>
  //       <textarea className="w-full bg-[#252525] rounded-xl p-4 text-white text-sm" rows={4} value={descriptionText || (isHighlight ? (highlightFolder?.description || "") : (currentClip?.description || ""))} onChange={(e) => setDescriptionText(e.target.value)} placeholder="Add a description" />
  //     </div>

  //     <div className="pb-2 space-y-2 mt-2">
  //       <div className="flex items-center justify-between">
  //         <label className="text-xs text-white font-medium">Tags</label>
  //       </div>
  //       <div className="bg-[#252525] rounded-xl p-4 space-y-3">
  //         <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={handleNewTagKeyDown} placeholder="Type and press Enter to add a tag" className="w-full h-[36px] bg-[#1B1B1B] rounded-lg px-3 text-sm text-white placeholder:text-white/60" />
  //         <div className="flex flex-wrap gap-2">
  //           {allTags.map((tag, index) => (
  //             <div key={index} className="flex items-center gap-1 bg-[#1B1B1B] rounded-full px-3 py-1">
  //               <span className="text-sm text-white">{tag}</span>
  //               <button type="button" onClick={() => removeTag(tag)} className="p-0.5 text-white/70 hover:text-white" aria-label={`Remove ${tag}`}>
  //                 <X className="w-3 h-3" />
  //               </button>
  //             </div>
  //           ))}
  //         </div>
  //       </div>
  //     </div>
  //   </>
  // );

  const handlePublish = async (platformKey: string, variantKey: string) => {
    const platform = platformKey.toLowerCase();
    const variant = variantKey.toLowerCase();

    // Validation logic (basic checks)
    if (platform === 'youtube' && variant === 'post' && !titleText) {
      toast.error("Title is required for YouTube Post");
      return;
    }

    const durationInSeconds = clipDurationSeconds;
    let mediaTypeForPayload = 'VIDEO';
    if (platform === 'instagram' && (variant === 'post' || variant === 'story') && mediaTypeSelections.instagram === 'IMAGE') mediaTypeForPayload = 'IMAGE';
    if (platform === 'facebook' && (variant === 'post' || variant === 'story') && mediaTypeSelections.facebook === 'IMAGE') mediaTypeForPayload = 'IMAGE';
    if (platform === 'x' && mediaTypeSelections.x === 'IMAGE') mediaTypeForPayload = 'IMAGE';

    if (mediaTypeForPayload === 'IMAGE' && !selectedThumbUrl) {
      toast.error("No thumbnail/image selected to publish");
      return;
    }

    if (mediaTypeForPayload === 'VIDEO') {
      if (platform === 'instagram' && variant === 'story' && typeof durationInSeconds === 'number' && durationInSeconds > 15) {
        toast.error("Instagram Story supports videos up to 15 seconds");
        return;
      }
      if (platform === 'instagram' && variant === 'reel' && typeof durationInSeconds === 'number' && durationInSeconds > 90) {
        toast.error("Instagram Reel supports videos up to 90 seconds");
        return;
      }
      if (platform === 'youtube' && variant === 'shorts' && typeof durationInSeconds === 'number' && durationInSeconds > 180) {
        toast.error("YouTube Shorts supports videos up to 180 seconds");
        return;
      }
      if (platform === 'facebook' && variant === 'story' && typeof durationInSeconds === 'number' && durationInSeconds > 60) {
        toast.error("Facebook Story supports videos up to 60 seconds");
        return;
      }
      if (platform === 'instagram' && (variant === 'story' || variant === 'reel') && !isVerticalAspect) {
        toast.error("Instagram Story/Reel requires a 9:16 (vertical) aspect ratio");
        return;
      }

      const videoUrl = (isHighlight && highlightPreviewUrl) ? highlightPreviewUrl : currentVideoUrl;
      if (!videoUrl) {
        toast.error("No video URL found to publish");
        return;
      }
    }

    const videoUrl = (isHighlight && highlightPreviewUrl) ? highlightPreviewUrl : currentVideoUrl;

    const ayrsharePlatformMap: Record<string, string> = {
      instagram: 'instagram',
      youtube: 'youtube',
      facebook: 'facebook',
      x: 'x-twitter',
      tiktok: 'tiktok'
    };
    
    const ayrsharePlatform = ayrsharePlatformMap[platform] || platform;

    const isInstagramStory = platform === 'instagram' && variant === 'story';
    const tagsForCaption = isInstagramStory ? [] : displayTags;
    const baseCaption = isInstagramStory ? '' : (descriptionText || '');
    const captionWithTags = `${baseCaption} ${tagsForCaption.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')}`.trim();

    const normalizedCaptionForLimit = platform === 'tiktok' ? captionWithTags.replace(/\n/g, '') : captionWithTags;
    const captionLimit =
      platform === 'instagram' ? 2200 :
      platform === 'youtube' ? 5000 :
      platform === 'x' ? 280 :
      platform === 'tiktok' ? 2200 :
      (platform === 'facebook' && variant === 'story') ? 280 :
      undefined;
    if (typeof captionLimit === 'number' && normalizedCaptionForLimit.length > captionLimit) {
      toast.error(`Caption must be ≤ ${captionLimit} characters for ${platform} ${variant}`);
      return;
    }

    if (platform === 'youtube') {
      const t = String(titleText || '').trim();
      if (variant === 'post' && !t) {
        toast.error("Title is required for YouTube Post");
        return;
      }
      if (t.length > 100) {
        toast.error("YouTube title must be ≤ 100 characters");
        return;
      }
    }

    const payload: any = {
      platform: ayrsharePlatform,
      caption: captionWithTags,
      media: [{
        url: mediaTypeForPayload === 'IMAGE' ? selectedThumbUrl : videoUrl,
        type: mediaTypeForPayload === 'IMAGE' ? 'image' : 'video',
        durationInSeconds: mediaTypeForPayload === 'VIDEO' && typeof durationInSeconds === 'number' ? durationInSeconds : undefined,
        aspectRatio: (platform === 'instagram' && (variant === 'reel' || variant === 'story')) || (platform === 'facebook' && variant === 'story')
          ? selectedAspectNumber
          : undefined,
      }],
      options: {},
      flags: {},
    };
    if (selectedProfileKey) {
      payload.profileKey = selectedProfileKey;
    }
    if (selectedThumbUrl) {
      payload.options.thumbnailUrl = selectedThumbUrl;
    }
    if (platform === 'facebook' && variant === 'post' && facebookRestrictedCountries.length > 0) {
      payload.options.targetCountries = facebookRestrictedCountries.slice(0, 25);
    }

    if (platform === 'youtube') {
      payload.options.title = (titleText || '').trim() || (descriptionText || '').trim().slice(0, 99) || 'Video';
      payload.options.visibility = privacy?.toLowerCase() === 'public' ? 'public' : 'private';
      if (variant === 'shorts') {
        payload.flags.isShort = true;
      }
    }

    if (platform === 'instagram') {
      if (variant === 'story') {
        payload.flags.isStory = true;
      } else if (variant === 'reel') {
        payload.flags.isReel = true;
      }
    }

    if (platform === 'facebook' && variant === 'story') {
      payload.flags.isStory = true;
    }

    if (platform === 'tiktok') {
      payload.options.visibility = privacy?.toLowerCase() === 'public' ? 'public' : 'private';
    }

    // Call API
    try {
      const loadingId = toast.loading(`Publishing to ${platform} ${variant}...`);
      await socialApi.publish(payload);
      toast.dismiss(loadingId);
      toast.success(`Successfully published to ${platform} ${variant}`);
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Failed to publish: ${error.message || error}`);
    }
  };

  const handleCancel = (platformKey: string, variantKey: string) => {
    handleSocialMediaToggle(platformKey, variantKey);
  };

  function isFormValid(platform: string, variant: string) {
    const isInstagramStory = platform === 'instagram' && variant === 'story';
    const rawCaption = String(descriptionText || (isHighlight ? (highlightFolder?.description || "") : (currentClip as any)?.description || ""));
    const tagsForCaption = !isInstagramStory ? displayTags : [];
    const computedCaptionWithTags = `${!isInstagramStory ? rawCaption : ''} ${tagsForCaption.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')}`.trim();
    const normalizedCaptionForLimit = platform === 'tiktok' ? computedCaptionWithTags.replace(/\n/g, '') : computedCaptionWithTags;
    
    const captionLimit =
      platform === 'instagram' ? 2200 :
      platform === 'youtube' ? 5000 :
      platform === 'x' ? 280 :
      platform === 'tiktok' ? 2200 :
      (platform === 'facebook' && variant === 'story') ? 280 :
      undefined;

    if (typeof captionLimit === 'number' && normalizedCaptionForLimit.length > captionLimit) {
      return false;
    }

    if (platform === 'youtube' && variant === 'post') {
      const t = String(titleText || '').trim();
      if (!t) return false;
      if (t.length > 100) return false;
    }

    let mediaTypeForValidation: 'VIDEO' | 'IMAGE' = 'VIDEO';
    if (platform === 'instagram' && (variant === 'post' || variant === 'story') && mediaTypeSelections.instagram === 'IMAGE') {
      mediaTypeForValidation = 'IMAGE';
    }
    if (platform === 'facebook' && (variant === 'post' || variant === 'story') && mediaTypeSelections.facebook === 'IMAGE') {
      mediaTypeForValidation = 'IMAGE';
    }
    if (platform === 'x' && mediaTypeSelections.x === 'IMAGE') {
      mediaTypeForValidation = 'IMAGE';
    }

    if (mediaTypeForValidation === 'IMAGE') {
      if (!selectedThumbUrl) return false;
    } else {
      const videoUrl = (isHighlight && highlightPreviewUrl) ? highlightPreviewUrl : currentVideoUrl;
      if (!videoUrl) return false;
    }

    const durationInSeconds = clipDurationSeconds;
    if (platform === 'instagram' && variant === 'story' && mediaTypeForValidation === 'VIDEO') {
      if (!isVerticalAspect) return false;
      if (typeof durationInSeconds === 'number' && durationInSeconds > 15) return false;
    }
    if (platform === 'instagram' && variant === 'reel') {
      if (!isVerticalAspect) return false;
      if (typeof durationInSeconds === 'number' && durationInSeconds > 90) return false;
    }
    if (platform === 'youtube' && variant === 'shorts') {
      if (typeof durationInSeconds === 'number' && durationInSeconds > 180) return false;
    }
    if (platform === 'facebook' && variant === 'story' && mediaTypeForValidation === 'VIDEO') {
      if (typeof durationInSeconds === 'number' && durationInSeconds > 60) return false;
    }

    return true;
  }

  const renderCommonOptions = (platformKey: string = 'other', variantKey: string = '') => {
    const platform = platformKey;
    const showTitle = platform === 'youtube-post' || (platform === 'youtube' && variantKey === 'post');
    const isInstagramStory = platform === 'instagram' && variantKey === 'story';
    const showDescription = !isInstagramStory;
    const showTags = !isInstagramStory;

    const supportsMediaTypeSelection =
      (platform === 'instagram' && variantKey === 'post') ||
      (platform === 'instagram' && variantKey !== 'reel' && variantKey !== 'story') ||
      (platform === 'facebook' && variantKey === 'post') ||
      (platform === 'facebook' && variantKey === 'story') ||
      (platform === 'x'); // X only has post variant essentially

    const currentMediaType =
      platform === 'instagram' ? mediaTypeSelections.instagram :
        platform === 'facebook' ? mediaTypeSelections.facebook :
          platform === 'x' ? mediaTypeSelections.x : 'VIDEO';

    const handleMediaTypeChange = (type: 'VIDEO' | 'IMAGE') => {
      if (platform === 'instagram') setMediaTypeSelections(prev => ({ ...prev, instagram: type }));
      if (platform === 'facebook') setMediaTypeSelections(prev => ({ ...prev, facebook: type }));
      if (platform === 'x') setMediaTypeSelections(prev => ({ ...prev, x: type }));
    };

    const rawCaption = String(descriptionText || (isHighlight ? (highlightFolder?.description || "") : (currentClip as any)?.description || ""));
    const tagsForCaption = showTags ? displayTags : [];
    const computedCaptionWithTags = `${showDescription ? rawCaption : ''} ${tagsForCaption.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')}`.trim();
    const normalizedCaptionForLimit = platform === 'tiktok' ? computedCaptionWithTags.replace(/\n/g, '') : computedCaptionWithTags;
    const captionLimit =
      platform === 'instagram' ? 2200 :
      platform === 'youtube' ? 5000 :
      platform === 'x' ? 280 :
      platform === 'tiktok' ? 2200 :
      (platform === 'facebook' && variantKey === 'story') ? 280 :
      undefined;
    const captionOverLimit = typeof captionLimit === 'number' ? normalizedCaptionForLimit.length > captionLimit : false;
    const youtubeTitleRequired = platform === 'youtube' && variantKey === 'post';
    const titleTrimmed = String(titleText || '').trim();
    const youtubeTitleOver = platform === 'youtube' ? titleTrimmed.length > 100 : false;
    const youtubeTitleMissing = youtubeTitleRequired && !titleTrimmed;
    const controls = (
      <div className="flex items-center gap-3">
        <div className="w-[160px]">
          <SearchableSelect
            placeholder="Language"
            options={languageOptions}
            value={selectedLanguage}
            searchable={true}
            onChange={(value) => setSelectedLanguage(String(value))}
            triggerClassName="h-[28px] bg-[#1B1B1B] border-[#1B1B1B] text-white rounded-md text-[12px]"
          />
        </div>
        <button type="button" className="flex items-center gap-1 text-xs font-bold text-white hover:underline" onClick={async () => {
          try {
            const transcript = isHighlight ? String(aggregatedFolderTranscript || descriptionText || (highlightFolder?.title || "")) : String(descriptionText || (currentClip as any)?.title || "");
            const sport = isHighlight ? String(highlightFolder?.category || "") : String((currentClip as any)?.customData?.sportName || "");
            const events = isHighlight ? aggregatedFolderTags : (Array.isArray((currentClip as any)?.tags) ? (currentClip as any)?.tags : []);
            let teamsLabel = String(currentStream?.title || "");
            const t1 = String(currentStream?.team1Id || "");
            const t2 = String(currentStream?.team2Id || "");
            const team1 = teams.find((t: any) => String(t._id) === t1);
            const team2 = teams.find((t: any) => String(t._id) === t2);
            if (team1 || team2) {
              teamsLabel = `${team1?.name || ""}${team1 || team2 ? " Vs " : ""}${team2?.name || ""}`.trim();
            }
            let competitionName = "";
            const compId = String(currentStream?.tournamentId || "");
            const comp = competitions.find((c: any) => String(c._id) === compId);
            if (comp) competitionName = String(comp.name || "");

            const resultPromise = new Promise<any>((resolve, reject) => {
              generateSocialDescription({ transcript, teams: teamsLabel, events, Competition: competitionName, sport, language: selectedLanguage })
                .then((r) => {
                  if (!r?.status || !r?.data) return reject(new Error(r?.message || 'Failed to generate description and tags'));
                  resolve(r);
                })
                .catch(reject);
            });
            toast.promise(resultPromise, {
              loading: 'AI is generating description and tags…',
              success: 'Description and tags generated',
              error: (e) => e?.message || 'Failed to generate description and tags',
            });
            const resp = await resultPromise;
            if (resp?.data) {
              const d = resp.data;
              console.log(d?.description, d?.title, d?.tags);
              if (d?.description || d[0]?.description) setDescriptionText(String(d.description || d[0].description));
              if (d?.title || d[0]?.title) setTitleText(String(d.title || d[0].title));
              if (Array.isArray(d?.tags) || Array.isArray(d[0]?.tags)) setGeneratedTags(Array.isArray(d?.tags) ? d.tags : d[0].tags);
            }
          } catch (e: any) { }
        }}>
          <SVGIcon src={SparkleGradient} className="w-3 h-3 flex-shrink-0" aria-label="Generate" />
          <span>Generate</span>
        </button>
      </div>
    );

    return (
      <>
        <div className="grid grid-cols-2 gap-5 mt-3">
          <div className="space-y-2">
            <SearchableSelect
              label="Profile"
              placeholder="Select profile"
              options={profileOptions}
              value={selectedProfileKey}
              onChange={(val) => {
                const v = String(val || "");
                setSelectedProfileKey(v);
                const opt = profileOptions.find(o => o.value === v);
                if (opt) setProfile(opt.label);
              }}
            />
          </div>
          <div className="space-y-2">
            <SearchableSelect
              label="Privacy"
              placeholder="Select privacy"
              options={[
                { value: "Public", label: "Public" },
                // { value: "Private", label: "Private" },
                // { value: "Unlisted", label: "Unlisted" },
              ]}
              value={privacy}
              searchable={false}
              onChange={(val) => setPrivacy(String(val))}
            />
          </div>
        </div>

        {supportsMediaTypeSelection && (
          <div className="space-y-3 mt-4">
            <label className="text-xs text-white font-medium">Post As</label>
            <div className="flex bg-[#1B1B1B] w-fit rounded-lg p-1">
              <button
                type="button"
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${currentMediaType === 'VIDEO' ? 'bg-[#252525] border border-[#0BF] text-white shadow-sm' : 'text-white/60 hover:text-white'}`}
                onClick={() => handleMediaTypeChange('VIDEO')}
              >
                Video
              </button>
              <button
                type="button"
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${currentMediaType === 'IMAGE' ? 'bg-[#252525] border border-[#0BF] text-white shadow-sm' : 'text-white/60 hover:text-white'}`}
                onClick={() => handleMediaTypeChange('IMAGE')}
              >
                Image
              </button>
            </div>
          </div>
        )}

        {platform === 'facebook' && variantKey === 'post' && (
          <div className="space-y-3 mt-4">
            <SearchableSelect
              label="Restricted locations"
              placeholder="Select countries"
              options={facebookCountryOptions}
              value={facebookRestrictedCountries}
              multiple
              searchable
              onChange={(val) => {
                const values = Array.isArray(val) ? val : [String(val || "")];
                setFacebookRestrictedCountries(values.filter(Boolean).slice(0, 25));
              }}
            />
          </div>
        )}

        <div className="space-y-3 mt-4">
          <label className="text-xs text-white font-medium">Thumbnail</label>
          <div className="flex items-center gap-6">
            <div 
              className="w-[320px] h-[200px] bg-[#1B1B1B] rounded-2xl shadow-md shadow-black/30 flex items-center justify-center cursor-pointer hover:border-2 hover:border-white/20 transition-all"
              onClick={() => setIsThumbnailPreviewOpen(true)}
            >
              <div className="rounded-xl overflow-hidden bg-[#252525]" style={{ width: thumbWidth, aspectRatio: aspectCss }}>
                <img src={selectedThumbUrl} alt="Thumbnail" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="w-[280px] space-y-4">
              <div className="text-center space-y-3">
                <div className="flex items-center gap-1 justify-center">
                  <SVGIcon src={SparkleGradient} className="w-3 h-3 flex-shrink-0" aria-label="Generated" />
                  <span className="text-xs font-bold text-white">Select from generated</span>
                </div>
                <div className="mx-auto w-full flex justify-center">
                  <GradientRailSlider
                    label=""
                    min={1}
                    max={10}
                    step={1}
                    value={generatedSelection}
                    onChange={(v) => setGeneratedSelection(v)}
                    formatValue={(v) => `#${Math.round(v)}`}
                    railWidth={240}
                    height={40}
                    pillWidth={48}
                  />
                </div>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-xs text-white/80">or</span>
              </div>
              <div className="flex justify-center">
                <button className="h-[42px] bg-[#1B1B1B] border border-white rounded-xl px-4 text-sm text-white">Upload New</button>
              </div>
            </div>
          </div>
        </div>

        {showTitle && (
          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <label className="text-xs text-white font-medium">Title</label>
              {controls}
            </div>
            <input
              className="w-full bg-[#252525] rounded-xl p-3 text-white text-sm"
              placeholder="Add a title"
              value={titleText}
              maxLength={platform === 'youtube' ? 100 : undefined}
              onChange={(e) => setTitleText(e.target.value)}
            />
            {platform === 'youtube' && (youtubeTitleMissing || youtubeTitleOver) && (
              <div className="text-xs text-red-500">
                {youtubeTitleMissing ? 'Title is required for YouTube Post.' : 'Title must be ≤ 100 characters.'}
              </div>
            )}
          </div>
        )}

        {showDescription && (
          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <label className="text-xs text-white font-medium">Description</label>
              {!showTitle && controls}
            </div>
            <textarea
              className="w-full bg-[#252525] rounded-xl p-4 text-white text-sm"
              rows={4}
              value={descriptionText || (isHighlight ? (highlightFolder?.description || "") : (currentClip?.description || ""))}
              maxLength={platform === 'instagram' ? 2200 : platform === 'youtube' ? 5000 : platform === 'x' ? 280 : platform === 'tiktok' ? 2200 : (platform === 'facebook' && variantKey === 'story') ? 280 : undefined}
              onChange={(e) => setDescriptionText(e.target.value)}
              placeholder="Add a description"
            />
            {typeof captionLimit === 'number' && (
              <div className={`text-xs ${captionOverLimit ? 'text-red-500' : 'text-white/60'}`}>
                {normalizedCaptionForLimit.length}/{captionLimit}
              </div>
            )}
          </div>
        )}

        {showTags && (
          <div className="pb-2 space-y-2 mt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-white font-medium">Tags</label>
            </div>
            <div className="bg-[#252525] rounded-xl p-4 space-y-3">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(sanitizeNewTagInput(e.target.value))}
                onKeyDown={handleNewTagKeyDown}
                placeholder="Type and press Enter to add a tag"
                className="w-full h-[36px] bg-[#1B1B1B] rounded-lg px-3 text-sm text-white placeholder:text-white/60"
              />
              <div className="flex flex-wrap gap-2">
                {displayTags.map((tag, index) => (
                  <div key={index} className="flex items-center gap-1 bg-[#1B1B1B] rounded-full px-3 py-1">
                    <span className="text-sm text-white">{tag}</span>
                    <button type="button" onClick={() => removeTag(tag)} className="p-0.5 text-white/70 hover:text-white" aria-label={`Remove ${tag}`}>
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              {typeof captionLimit === 'number' && captionOverLimit && (
                <div className="text-xs text-red-500">
                  Caption with tags exceeds {captionLimit} characters.
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Social media"
        iconSrc={SocialMediaIcon}
        expanded={isSocialMediaOpen}
        onClick={() => setIsSocialMediaOpen(prev => !prev)}
      />

      <div id="social-media-section" className={isSocialMediaOpen ? '' : 'hidden'}>
        {/* Instagram checkbox group */}
        {/* Instagram */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-[18px] h-[18px] rounded border-[1.5px] cursor-pointer flex items-center justify-center ${selectedSocialMedia.instagram.selected ? 'bg-white border-white' : 'bg-[#18191B] border-white'}`}
              onClick={() => handleSocialMediaToggle('instagram')}
            >
              {selectedSocialMedia.instagram.selected && (
                <svg width="11" height="8" viewBox="0 0 11 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0.742432 2.87734L3.89243 6.02734L9.66743 0.777344" stroke="url(#paint0_linear)" strokeWidth="2.1" />
                  <defs>
                    <linearGradient id="paint0_linear" x1="12.9251" y1="3.43348" x2="7.00799" y2="-3.13514" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#00BBFF" />
                      <stop offset="1" stopColor="#0051FF" />
                    </linearGradient>
                  </defs>
                </svg>
              )}
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 0C14.2091 0 16 1.79086 16 4V12C16 14.2091 14.2091 16 12 16H4C1.79086 16 0 14.2091 0 12V4C0 1.79086 1.79086 0 4 0H12ZM8 4C5.79086 4 4 5.79086 4 8C4 10.2091 5.79086 12 8 12C10.2091 12 12 10.2091 12 8C12 5.79086 10.2091 4 8 4ZM13 2C12.4477 2 12 2.44772 12 3C12 3.55228 12.4477 4 13 4C13.5523 4 14 3.55228 14 3C14 2.44772 13.5523 2 13 2Z" fill="white" />
            </svg>
            <span className="text-sm text-white">Instagram</span>
            {/* <button className="ml-auto text-white"> */}
            {/* <div className="w-3 h-0.5 bg-white rounded"></div> */}
            {selectedSocialMedia.instagram.selected ? <button className="ml-auto" onClick={() => handleSocialMediaToggle('instagram')}>
              <Minus size={12} className="text-white" />
            </button> :
              <button className="ml-auto" onClick={() => handleSocialMediaToggle('instagram')}>
                <Plus size={12} className="text-white" />
              </button>}
            {/* </button> */}
          </div>

          {/* Instagram Sub-options */}
          {selectedSocialMedia.instagram.selected && (
            <div className="ml-9 space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-[18px] h-[18px] rounded border-[1.5px] cursor-pointer flex items-center justify-center ${selectedSocialMedia.instagram.post ? 'bg-white border-white' : 'bg-[#18191B] border-white'}`}
                  onClick={() => handleSocialMediaToggle('instagram', 'post')}
                >
                  {selectedSocialMedia.instagram.post && (
                    <svg width="11" height="8" viewBox="0 0 11 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M0.742432 2.87734L3.89243 6.02734L9.66743 0.777344" stroke="url(#paint0_linear_post)" strokeWidth="2.1" />
                      <defs>
                        <linearGradient id="paint0_linear_post" x1="12.9251" y1="3.43348" x2="7.00799" y2="-3.13514" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#00BBFF" />
                          <stop offset="1" stopColor="#0051FF" />
                        </linearGradient>
                      </defs>
                    </svg>
                  )}
                </div>
                <span className="text-sm text-white">Post</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-white/60 hover:text-white cursor-pointer ml-1" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-black text-white border-white/20 max-w-[300px]">
                      <p>{validationRules.instagram.post}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {selectedSocialMedia.instagram.post && <Button
                  className="bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white h-6 px-4 hover:opacity-90 transition-opacity ml-auto"
                  onClick={() => { setPreviewPlatform('instagram'); setPreviewVariant('post'); setIsPreviewOpen(true); }}
                >
                  Preview
                </Button>}
              </div>
            </div>
          )}
        </div>

        {selectedSocialMedia.instagram.post && (
          <div className="ml-9">
            {renderCommonOptions('instagram', 'post')}
            <div className="flex gap-3 mt-4">
              <Button onClick={() => handleCancel('instagram', 'post')} variant="outline" className="flex-1 bg-transparent border-white text-white hover:bg-white/10">Cancel</Button>
              <Button onClick={() => handlePublish('instagram', 'post')} disabled={!isFormValid('instagram', 'post')} className="flex-1 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] disabled:opacity-50 disabled:cursor-not-allowed">Publish</Button>
            </div>
          </div>
        )}

        {/* Restricted Locations */}
        {/* <div className="space-y-3">
                <label className="text-sm text-white font-medium">Restricted locations</label>
                <div className="flex items-center gap-3">
                  <button className="h-[42px] bg-[#1B1B1B] border border-white rounded-xl px-4 flex items-center gap-3 text-sm text-white">
                    <span>Belgium</span>
                    <X size={8} />
                  </button>
                  <button className="w-[42px] h-[42px] bg-[#1B1B1B] border border-white rounded-[10.5px] flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.12974e-05 5.85486L13.7756 5.85507L13.7756 7.9214L5.29209e-05 7.9212L2.12974e-05 5.85486Z" fill="url(#paint0_linear_add)"/>
                      <path d="M7.92133 13.7755L7.92112 -2.01873e-05L5.85479 -5.1376e-05L5.855 13.7755L7.92133 13.7755Z" fill="url(#paint1_linear_add)"/>
                      <defs>
                        <linearGradient id="paint0_linear_add" x1="18.1547" y1="18.2486" x2="18.1545" y2="-3.8988" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#00EEFF"/>
                          <stop offset="1" stopColor="#0051FF"/>
                        </linearGradient>
                        <linearGradient id="paint1_linear_add" x1="18.1547" y1="18.2486" x2="18.1545" y2="-3.8988" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#00EEFF"/>
                          <stop offset="1" stopColor="#0051FF"/>
                        </linearGradient>
                      </defs>
                    </svg>
                  </button>
                </div>
              </div> */}

        {/* Schedule */}
        {/* <div className="space-y-4 mt-2 mb-4">
              <div className="space-y-4"> */}
        {/* <div className="flex items-center justify-between">
                  <label className="text-sm text-white font-medium">Schedule date and time</label>
                  <button
                    className={`w-[52px] h-[26px] rounded-md flex items-center ${scheduleEnabled ? 'bg-[#252525]' : 'bg-[#252525]'}`}
                    onClick={onToggleSchedule}
                  >
                    <div className={`w-[22px] h-[18px] rounded bg-gradient-to-r from-[#00BBFF] to-[#0051FF] transition-all ${scheduleEnabled ? 'ml-auto mr-1' : 'ml-1'}`}></div>
                  </button>
                </div> */}

        {/* {scheduleEnabled && (
                  <div className="grid grid-cols-4 gap-3"> */}
        {/* Date  */}
        {/* <div className="space-y-2">
                      <label className="text-xs text-white font-medium">Date</label>
                      <div className="relative">
                        <input
                          type="text"
                          className="w-full h-[42px] bg-[#252525] rounded-xl px-4 text-sm text-white"
                          value={date}
                          onChange={(e) => onDateChange(e.target.value)}
                        />
                        <svg className="absolute right-3 top-3 w-4 h-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 1.6H15.2C15.4122 1.6 15.6157 1.68429 15.7657 1.83431C15.9157 1.98434 16 2.18783 16 2.4V15.2C16 15.4122 15.9157 15.6157 15.7657 15.7657C15.6157 15.9157 15.4122 16 15.2 16H0.8C0.587827 16 0.384344 15.9157 0.234315 15.7657C0.0842854 15.6157 0 15.4122 0 15.2V2.4C0 2.18783 0.0842854 1.98434 0.234315 1.83431C0.384344 1.68429 0.587827 1.6 0.8 1.6H4V0H5.6V1.6H10.4V0H12V1.6ZM1.6 6.4V14.4H14.4V6.4H1.6ZM3.2 9.6H7.2V12.8H3.2V9.6Z" fill="white" />
                        </svg>
                      </div>
                    </div> */}

        {/* Time */}
        {/* <div className="space-y-2">
                      <label className="text-xs text-white font-medium">Time</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          className="w-[60px] h-[42px] bg-[#252525] rounded-xl px-3 text-sm text-white text-center"
                          value={time.hours}
                          onChange={(e) => onTimeChange({ ...time, hours: e.target.value })}
                        />
                        <span className="text-white">:</span>
                        <input
                          type="text"
                          className="w-[60px] h-[42px] bg-[#252525] rounded-xl px-3 text-sm text-white text-center"
                          value={time.minutes}
                          onChange={(e) => onTimeChange({ ...time, minutes: e.target.value })}
                        />
                      </div>
                    </div> */}

        {/* AM/PM */}
        {/* <div className="space-y-2">
                      <label className="text-xs text-white font-medium invisible">Period</label>
                      <div className="flex h-[42px] border border-[#252525] rounded-xl overflow-hidden">
                        <button
                          className={`flex-1 text-sm font-medium ${time.period === 'AM' ? 'bg-[#252525] text-white border border-white' : 'bg-transparent text-white'}`}
                          onClick={() => onTimeChange({ ...time, period: 'AM' })}
                        >
                          AM
                        </button>
                        <button
                          className={`flex-1 text-sm font-medium ${time.period === 'PM' ? 'bg-[#252525] text-white border border-white' : 'bg-transparent text-white'}`}
                          onClick={() => onTimeChange({ ...time, period: 'PM' })}
                        >
                          PM
                        </button>
                      </div>
                    </div> */}

        {/* Timezone */}
        {/* <div className="space-y-2">
                      <label className="text-xs text-white font-medium">Timezone</label>
                      <button
                        className="w-full h-[42px] bg-[#252525] rounded-xl px-4 flex items-center justify-between text-sm text-white"
                        onClick={onTimezoneClick}
                      >
                        <span>{timezone}</span>
                        <ChevronDown size={16} />
                      </button>
                    </div> */}
        {/* </div>
                )} */}
        {/* </div>
            </div> */}

        {selectedSocialMedia.instagram.selected && (<div className="mt-3 ml-9 space-y-3">
          <div className={`flex items-center gap-3 ${(!isVerticalAspect || (typeof clipDurationSeconds === 'number' && clipDurationSeconds > 90)) ? 'opacity-50' : ''}`}>
            <div
              className={`w-[18px] h-[18px] rounded border-[1.5px] flex items-center justify-center ${selectedSocialMedia.instagram.reel ? 'bg-white border-white' : 'bg-[#18191B] border-white'} ${(!isVerticalAspect || (typeof clipDurationSeconds === 'number' && clipDurationSeconds > 90)) ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={() => {
                if (!isVerticalAspect) return toast.error('Instagram Reel requires 9:16 aspect ratio');
                if (typeof clipDurationSeconds === 'number' && clipDurationSeconds > 90) return toast.error('Instagram Reel supports videos up to 90 seconds');
                handleSocialMediaToggle('instagram', 'reel');
              }}
              title={!isVerticalAspect ? 'Requires 9:16 aspect ratio' : (typeof clipDurationSeconds === 'number' && clipDurationSeconds > 90) ? 'Max 90 seconds' : undefined}
            >
              {selectedSocialMedia.instagram.reel && (
                <svg width="11" height="8" viewBox="0 0 11 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0.742432 2.87734L3.89243 6.02734L9.66743 0.777344" stroke="url(#paint0_linear_reel)" strokeWidth="2.1" />
                  <defs>
                    <linearGradient id="paint0_linear_reel" x1="12.9251" y1="3.43348" x2="7.00799" y2="-3.13514" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#00BBFF" />
                      <stop offset="1" stopColor="#0051FF" />
                    </linearGradient>
                  </defs>
                </svg>
              )}
            </div>
            <span className="text-sm text-white">Reel</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 text-white/60 hover:text-white cursor-pointer ml-1" />
                </TooltipTrigger>
                <TooltipContent className="bg-black text-white border-white/20 max-w-[300px]">
                  <p>{validationRules.instagram.reel}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {selectedSocialMedia.instagram.reel && <Button
              className="bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white h-6 px-4 hover:opacity-90 transition-opacity ml-auto"
              onClick={() => { setPreviewVariant('reel'); setIsPreviewOpen(true); }}
            >
              Preview
            </Button>}
          </div>
          {selectedSocialMedia.instagram.reel && (
            <>
              {renderCommonOptions('instagram', 'reel')}
              <div className="flex gap-3 mt-4">
                <Button onClick={() => handleCancel('instagram', 'reel')} variant="outline" className="flex-1 bg-transparent border-white text-white hover:bg-white/10">Cancel</Button>
                <Button onClick={() => handlePublish('instagram', 'reel')} disabled={!isFormValid('instagram', 'reel')} className="flex-1 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] disabled:opacity-50 disabled:cursor-not-allowed">Publish</Button>
              </div>
            </>
          )}
          <div className={`flex items-center gap-3 ${(!isVerticalAspect || (typeof clipDurationSeconds === 'number' && clipDurationSeconds > 15)) ? 'opacity-50' : ''}`}>
            <div
              className={`w-[18px] h-[18px] rounded border-[1.5px] flex items-center justify-center ${selectedSocialMedia.instagram.story ? 'bg-white border-white' : 'bg-[#18191B] border-white'} ${(!isVerticalAspect || (typeof clipDurationSeconds === 'number' && clipDurationSeconds > 15)) ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={() => {
                if (!isVerticalAspect) return toast.error('Instagram Story requires 9:16 aspect ratio');
                if (typeof clipDurationSeconds === 'number' && clipDurationSeconds > 15) return toast.error('Instagram Story supports videos up to 15 seconds');
                handleSocialMediaToggle('instagram', 'story');
              }}
              title={!isVerticalAspect ? 'Requires 9:16 aspect ratio' : (typeof clipDurationSeconds === 'number' && clipDurationSeconds > 15) ? 'Max 15 seconds' : undefined}
            >
              {selectedSocialMedia.instagram.story && (
                <svg width="11" height="8" viewBox="0 0 11 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0.742432 2.87734L3.89243 6.02734L9.66743 0.777344" stroke="url(#paint0_linear_story)" strokeWidth="2.1" />
                  <defs>
                    <linearGradient id="paint0_linear_story" x1="12.9251" y1="3.43348" x2="7.00799" y2="-3.13514" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#00BBFF" />
                      <stop offset="1" stopColor="#0051FF" />
                    </linearGradient>
                  </defs>
                </svg>
              )}
            </div>
            <span className="text-sm text-white">Story</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 text-white/60 hover:text-white cursor-pointer ml-1" />
                </TooltipTrigger>
                <TooltipContent className="bg-black text-white border-white/20 max-w-[300px]">
                  <p>{validationRules.instagram.story}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {selectedSocialMedia.instagram.story && <Button
              className="bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white h-6 px-4 hover:opacity-90 transition-opacity ml-auto"
              onClick={() => { setPreviewVariant('story'); setIsPreviewOpen(true); }}
            >
              Preview
            </Button>}
          </div>
          {selectedSocialMedia.instagram.story && (
            <>
              {renderCommonOptions('instagram', 'story')}
              <div className="flex gap-3 mt-4">
                <Button onClick={() => handleCancel('instagram', 'story')} variant="outline" className="flex-1 bg-transparent border-white text-white hover:bg-white/10">Cancel</Button>
                <Button onClick={() => handlePublish('instagram', 'story')} disabled={!isFormValid('instagram', 'story')} className="flex-1 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] disabled:opacity-50 disabled:cursor-not-allowed">Publish</Button>
              </div>
            </>
          )}
        </div>)}

        <div className="space-y-4 mt-4">
          {/* YouTube */}
          <div className="flex items-center gap-3">
            <div
              className={`w-[18px] h-[18px] rounded border-[1.5px] cursor-pointer flex items-center justify-center ${selectedSocialMedia.youtube.selected ? 'bg-white border-white' : 'bg-[#18191B] border-white'}`}
              onClick={() => handleSocialMediaToggle('youtube')}
            >
              {selectedSocialMedia.youtube.selected && (
                <svg width="11" height="8" viewBox="0 0 11 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0.742432 2.87734L3.89243 6.02734L9.66743 0.777344" stroke="url(#paint0_linear_youtube)" strokeWidth="2.1" />
                  <defs>
                    <linearGradient id="paint0_linear_youtube" x1="12.9251" y1="3.43348" x2="7.00799" y2="-3.13514" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#00BBFF" />
                      <stop offset="1" stopColor="#0051FF" />
                    </linearGradient>
                  </defs>
                </svg>
              )}
            </div>
            <svg width="18" height="13" viewBox="0 0 18 13" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 1.14538e-09C9.01549 7.16445e-07 14.6309 0.000163857 16.0322 0.375977C16.8072 0.583418 17.4166 1.19283 17.624 1.96777C17.9961 3.36054 18 6.25664 18 6.2998C18 6.2998 18.0004 9.22955 17.624 10.6328C17.4166 11.4077 16.8072 12.0172 16.0322 12.2246C14.6309 12.6004 9.01549 12.6006 9 12.6006C9 12.6006 3.37121 12.601 1.96777 12.2246C1.19284 12.0172 0.583418 11.4077 0.375977 10.6328C-0.000339341 9.22955 1.09977e-09 6.2998 1.09977e-09 6.2998C2.08206e-05 6.25664 0.00246392 3.36054 0.375977 1.96777C0.583418 1.19283 1.19284 0.583418 1.96777 0.375977C3.3712 -0.000343977 9 1.14538e-09 9 1.14538e-09ZM7.20117 9L11.8779 6.30078L7.20117 3.60059V9Z" fill="white" />
            </svg>
            <span className="text-sm text-white">Youtube</span>
            {selectedSocialMedia.youtube.selected ? <button className="ml-auto" onClick={() => handleSocialMediaToggle('youtube')}>
              <Minus size={12} className="text-white" />
            </button> :
              <button className="ml-auto" onClick={() => handleSocialMediaToggle('youtube')}>
                <Plus size={12} className="text-white" />
              </button>}
          </div>

          {selectedSocialMedia.youtube.selected && (
            <>
              <div className="ml-9 space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-[18px] h-[18px] rounded border-[1.5px] cursor-pointer flex items-center justify-center ${selectedSocialMedia.youtube.post ? 'bg-white border-white' : 'bg-[#18191B] border-white'}`}
                    onClick={() => handleSocialMediaToggle('youtube', 'post')}
                  >
                    {selectedSocialMedia.youtube.post && (
                      <svg width="11" height="8" viewBox="0 0 11 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0.742432 2.87734L3.89243 6.02734L9.66743 0.777344" stroke="url(#paint0_linear_youtube_post)" strokeWidth="2.1" />
                        <defs>
                          <linearGradient id="paint0_linear_youtube_post" x1="12.9251" y1="3.43348" x2="7.00799" y2="-3.13514" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#00BBFF" />
                            <stop offset="1" stopColor="#0051FF" />
                          </linearGradient>
                        </defs>
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-white">YouTube post</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 text-white/60 hover:text-white cursor-pointer ml-1" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-black text-white border-white/20 max-w-[300px]">
                        <p>{validationRules.youtube.post}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {selectedSocialMedia.youtube.post && <Button
                    className="bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white h-6 px-4 hover:opacity-90 transition-opacity ml-auto"
                    onClick={() => { setPreviewPlatform('youtube'); setPreviewVariant('post'); setIsPreviewOpen(true); }}
                  >
                    Preview
                  </Button>}
                </div>
                {selectedSocialMedia.youtube.post && (
                  <>
                    {renderCommonOptions('youtube', 'post')}
                    <div className="flex gap-3 mt-4">
                      <Button onClick={() => handleCancel('youtube', 'post')} variant="outline" className="flex-1 bg-transparent border-white text-white hover:bg-white/10">Cancel</Button>
                      <Button onClick={() => handlePublish('youtube', 'post')} disabled={!isFormValid('youtube', 'post')} className="flex-1 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] disabled:opacity-50 disabled:cursor-not-allowed">Publish</Button>
                    </div>
                  </>
                )}
                <div className={`flex items-center gap-3 ${(typeof clipDurationSeconds === 'number' && clipDurationSeconds > 180) ? 'opacity-50' : ''}`}>
                  <div
                    className={`w-[18px] h-[18px] rounded border-[1.5px] flex items-center justify-center ${selectedSocialMedia.youtube.shorts ? 'bg-white border-white' : 'bg-[#18191B] border-white'} ${(typeof clipDurationSeconds === 'number' && clipDurationSeconds > 180) ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    onClick={() => {
                      if (typeof clipDurationSeconds === 'number' && clipDurationSeconds > 180) return toast.error('YouTube Shorts supports videos up to 180 seconds');
                      handleSocialMediaToggle('youtube', 'shorts');
                    }}
                    title={(typeof clipDurationSeconds === 'number' && clipDurationSeconds > 180) ? 'Max 180 seconds' : undefined}
                  >
                    {selectedSocialMedia.youtube.shorts && (
                      <svg width="11" height="8" viewBox="0 0 11 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0.742432 2.87734L3.89243 6.02734L9.66743 0.777344" stroke="url(#paint0_linear_youtube_shorts)" strokeWidth="2.1" />
                        <defs>
                          <linearGradient id="paint0_linear_youtube_shorts" x1="12.9251" y1="3.43348" x2="7.00799" y2="-3.13514" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#00BBFF" />
                            <stop offset="1" stopColor="#0051FF" />
                          </linearGradient>
                        </defs>
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-white">YouTube shorts</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 text-white/60 hover:text-white cursor-pointer ml-1" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-black text-white border-white/20 max-w-[300px]">
                        <p>{validationRules.youtube.shorts}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {selectedSocialMedia.youtube.shorts && <Button
                    className="bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white h-6 px-4 hover:opacity-90 transition-opacity ml-auto"
                    onClick={() => { setPreviewPlatform('youtube'); setPreviewVariant('shorts'); setIsPreviewOpen(true); }}
                  >
                    Preview
                  </Button>}
                </div>
                {selectedSocialMedia.youtube.shorts && (
                  <>
                    {renderCommonOptions('youtube', 'shorts')}
                    <div className="flex gap-3 mt-4">
                      <Button onClick={() => handleCancel('youtube', 'shorts')} variant="outline" className="flex-1 bg-transparent border-white text-white hover:bg-white/10">Cancel</Button>
                      <Button onClick={() => handlePublish('youtube', 'shorts')} disabled={!isFormValid('youtube', 'shorts')} className="flex-1 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] disabled:opacity-50 disabled:cursor-not-allowed">Publish</Button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {/* TikTok */}
          <div className="flex items-center gap-3">
            <div
              className={`w-[18px] h-[18px] rounded border-[1.5px] cursor-pointer flex items-center justify-center ${selectedSocialMedia.tiktok.selected ? 'bg-white border-white' : 'bg-[#18191B] border-white'}`}
              onClick={() => handleSocialMediaToggle('tiktok')}
            >
              {selectedSocialMedia.tiktok.selected && (
                <svg width="11" height="8" viewBox="0 0 11 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0.742432 2.87734L3.89243 6.02734L9.66743 0.777344" stroke="url(#paint0_linear_tiktok)" strokeWidth="2.1" />
                  <defs>
                    <linearGradient id="paint0_linear_tiktok" x1="12.9251" y1="3.43348" x2="7.00799" y2="-3.13514" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#00BBFF" />
                      <stop offset="1" stopColor="#0051FF" />
                    </linearGradient>
                  </defs>
                </svg>
              )}
            </div>
            <svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.1404 3.42183C12.0324 3.36602 11.9273 3.30483 11.8254 3.23851C11.5292 3.04267 11.2576 2.81191 11.0165 2.55121C10.4132 1.86091 10.1879 1.16061 10.1049 0.6703H10.1082C10.0389 0.26332 10.0675 0 10.0719 0H7.324V10.6255C7.324 10.7681 7.324 10.9091 7.31801 11.0484C7.31801 11.0658 7.31634 11.0818 7.31534 11.1004C7.31534 11.1081 7.31534 11.1161 7.31367 11.1241C7.31367 11.1261 7.31367 11.1281 7.31367 11.1301C7.28471 11.5114 7.1625 11.8796 6.95779 12.2026C6.75309 12.5255 6.47216 12.7931 6.13973 12.982C5.79326 13.1791 5.4014 13.2825 5.00279 13.282C3.72252 13.282 2.6849 12.2381 2.6849 10.9488C2.6849 9.65952 3.72252 8.61557 5.00279 8.61557C5.24514 8.61535 5.48599 8.65348 5.71642 8.72856L5.71975 5.9307C5.02024 5.84035 4.3096 5.89594 3.63265 6.09398C2.9557 6.29201 2.32713 6.62819 1.78661 7.08131C1.31299 7.49283 0.914818 7.98383 0.610007 8.53224C0.494013 8.73223 0.0563678 9.53586 0.00337045 10.8401C-0.0299612 11.5804 0.192361 12.3474 0.298356 12.6644V12.671C0.365019 12.8577 0.623339 13.4947 1.04432 14.0316C1.38378 14.4624 1.78484 14.8407 2.23459 15.1546V15.1479L2.24126 15.1546C3.57153 16.0585 5.04645 15.9992 5.04645 15.9992C5.30177 15.9889 6.15706 15.9992 7.12835 15.5389C8.20563 15.0286 8.81893 14.2683 8.81893 14.2683C9.21074 13.814 9.52229 13.2963 9.74022 12.7374C9.98887 12.0837 10.0719 11.2998 10.0719 10.9865V5.3494C10.1052 5.3694 10.5492 5.66305 10.5492 5.66305C10.5492 5.66305 11.1888 6.07303 12.1868 6.34002C12.9027 6.53001 13.8673 6.57001 13.8673 6.57001V3.84214C13.5294 3.87881 12.8431 3.77215 12.1404 3.42183Z" fill="white" />
            </svg>
            <span className="text-sm text-white">TikTok</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 text-white/60 hover:text-white cursor-pointer ml-1" />
                </TooltipTrigger>
                <TooltipContent className="bg-black text-white border-white/20 max-w-[300px]">
                  <p>{validationRules.tiktok.post}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <button className="ml-auto" onClick={() => handleSocialMediaToggle('tiktok')}>
              {selectedSocialMedia.tiktok.selected ? <Minus size={12} className="text-white" /> : <Plus size={12} className="text-white" />}
            </button>
          </div>
          {selectedSocialMedia.tiktok.selected && (
            <div className="ml-9 mt-2">
              <Button
                className="bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white h-6 px-4 hover:opacity-90 transition-opacity"
                onClick={() => { setPreviewPlatform('tiktok'); setPreviewVariant('post'); setIsPreviewOpen(true); }}
              >
                Preview
              </Button>
            </div>
          )}
          {selectedSocialMedia.tiktok.selected && (
            <>
              {renderCommonOptions('tiktok', 'post')}
              <div className="flex gap-3 mt-4">
                <Button onClick={() => handleCancel('tiktok', 'post')} variant="outline" className="flex-1 bg-transparent border-white text-white hover:bg-white/10">Cancel</Button>
                <Button onClick={() => handlePublish('tiktok', 'post')} disabled={!isFormValid('tiktok', 'post')} className="flex-1 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] disabled:opacity-50 disabled:cursor-not-allowed">Publish</Button>
              </div>
            </>
          )}

          {/* Facebook */}
          <div className="flex items-center gap-3">
            <div
              className={`w-[18px] h-[18px] rounded border-[1.5px] cursor-pointer flex items-center justify-center ${selectedSocialMedia.facebook.selected ? 'bg-white border-white' : 'bg-[#18191B] border-white'}`}
              onClick={() => handleSocialMediaToggle('facebook')}
            >
              {selectedSocialMedia.facebook.selected && (
                <svg width="11" height="8" viewBox="0 0 11 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0.742432 2.87734L3.89243 6.02734L9.66743 0.777344" stroke="url(#paint0_linear_facebook)" strokeWidth="2.1" />
                  <defs>
                    <linearGradient id="paint0_linear_facebook" x1="12.9251" y1="3.43348" x2="7.00799" y2="-3.13514" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#00BBFF" />
                      <stop offset="1" stopColor="#0051FF" />
                    </linearGradient>
                  </defs>
                </svg>
              )}
            </div>
            <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.04004 0C12.462 1.72961e-05 16.0801 3.61805 16.0801 8.04004C16.0801 12.0198 13.1852 15.3166 9.36621 16L9.3291 15.9697C9.35567 15.9652 9.38261 15.9619 9.40918 15.957V10.2891H11.1777L11.54 8.03809H9.40918V6.4707C9.40918 5.8275 9.65043 5.34473 10.6152 5.34473H11.6602V3.29492C11.0974 3.21453 10.4543 3.1338 9.8916 3.13379C8.0424 3.13379 6.75586 4.25953 6.75586 6.26953V8.03809H4.74609V10.2891H6.75586V15.957C6.75839 15.9575 6.76114 15.9576 6.76367 15.958L6.71387 16C2.89487 15.3166 1.56638e-05 12.0198 0 8.04004C0 3.61804 3.61804 0 8.04004 0Z" fill="white" />
            </svg>
            <span className="text-sm text-white">Facebook</span>
            {selectedSocialMedia.facebook.selected ? <button className="ml-auto" onClick={() => handleSocialMediaToggle('facebook')}>
              <Minus size={12} className="text-white" />
            </button> :
              <button className="ml-auto" onClick={() => handleSocialMediaToggle('facebook')}>
                <Plus size={12} className="text-white" />
              </button>}
          </div>
          {selectedSocialMedia.facebook.selected && (
            <div className="mt-3 ml-9 space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-[18px] h-[18px] rounded border-[1.5px] cursor-pointer flex items-center justify-center ${selectedSocialMedia.facebook.post ? 'bg-white border-white' : 'bg-[#18191B] border-white'}`}
                  onClick={() => handleSocialMediaToggle('facebook', 'post')}
                >
                  {selectedSocialMedia.facebook.post && (
                    <svg width="11" height="8" viewBox="0 0 11 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M0.742432 2.87734L3.89243 6.02734L9.66743 0.777344" stroke="url(#paint0_linear_facebook_post)" strokeWidth="2.1" />
                      <defs>
                        <linearGradient id="paint0_linear_facebook_post" x1="12.9251" y1="3.43348" x2="7.00799" y2="-3.13514" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#00BBFF" />
                          <stop offset="1" stopColor="#0051FF" />
                        </linearGradient>
                      </defs>
                    </svg>
                  )}
                </div>
                <span className="text-sm text-white">Facebook post</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-white/60 hover:text-white cursor-pointer ml-1" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-black text-white border-white/20 max-w-[300px]">
                      <p>{validationRules.facebook.post}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {selectedSocialMedia.facebook.post && <Button
                  className="bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white h-6 px-4 hover:opacity-90 transition-opacity ml-auto"
                  onClick={() => { setPreviewPlatform('facebook'); setPreviewVariant('post'); setIsPreviewOpen(true); }}
                >
                  Preview
                </Button>}
              </div>
              {selectedSocialMedia.facebook.post && (
                <>
                  {renderCommonOptions('facebook', 'post')}
                  <div className="flex gap-3 mt-4">
                    <Button onClick={() => handleCancel('facebook', 'post')} variant="outline" className="flex-1 bg-transparent border-white text-white hover:bg-white/10">Cancel</Button>
                    <Button onClick={() => handlePublish('facebook', 'post')} disabled={!isFormValid('facebook', 'post')} className="flex-1 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] disabled:opacity-50 disabled:cursor-not-allowed">Publish</Button>
                  </div>
                </>
              )}
              <div className="flex items-center gap-3">
                <div
                  className={`w-[18px] h-[18px] rounded border-[1.5px] cursor-pointer flex items-center justify-center ${selectedSocialMedia.facebook.story ? 'bg-white border-white' : 'bg-[#18191B] border-white'}`}
                  onClick={() => handleSocialMediaToggle('facebook', 'story')}
                >
                  {selectedSocialMedia.facebook.story && (
                    <svg width="11" height="8" viewBox="0 0 11 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M0.742432 2.87734L3.89243 6.02734L9.66743 0.777344" stroke="url(#paint0_linear_facebook_story)" strokeWidth="2.1" />
                      <defs>
                        <linearGradient id="paint0_linear_facebook_story" x1="12.9251" y1="3.43348" x2="7.00799" y2="-3.13514" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#00BBFF" />
                          <stop offset="1" stopColor="#0051FF" />
                        </linearGradient>
                      </defs>
                    </svg>
                  )}
                </div>
                <span className="text-sm text-white">Facebook story</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-white/60 hover:text-white cursor-pointer ml-1" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-black text-white border-white/20 max-w-[300px]">
                      <p>{validationRules.facebook.story}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {selectedSocialMedia.facebook.story && <Button
                  className="bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white h-6 px-4 hover:opacity-90 transition-opacity ml-auto"
                  onClick={() => { setPreviewPlatform('facebook'); setPreviewVariant('story'); setIsPreviewOpen(true); }}
                >
                  Preview
                </Button>}
              </div>
              {selectedSocialMedia.facebook.story && (
                <>
                  {renderCommonOptions('facebook', 'story')}
                  <div className="flex gap-3 mt-4">
                    <Button onClick={() => handleCancel('facebook', 'story')} variant="outline" className="flex-1 bg-transparent border-white text-white hover:bg-white/10">Cancel</Button>
                    <Button onClick={() => handlePublish('facebook', 'story')} disabled={!isFormValid('facebook', 'story')} className="flex-1 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] disabled:opacity-50 disabled:cursor-not-allowed">Publish</Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* X (Twitter) */}
          <div className="flex items-center gap-3">
            <div
              className={`w-[18px] h-[18px] rounded border-[1.5px] cursor-pointer flex items-center justify-center ${selectedSocialMedia.x.selected ? 'bg-white border-white' : 'bg-[#18191B] border-white'}`}
              onClick={() => handleSocialMediaToggle('x')}
            >
              {selectedSocialMedia.x.selected && (
                <svg width="11" height="8" viewBox="0 0 11 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0.742432 2.87734L3.89243 6.02734L9.66743 0.777344" stroke="url(#paint0_linear_x)" strokeWidth="2.1" />
                  <defs>
                    <linearGradient id="paint0_linear_x" x1="12.9251" y1="3.43348" x2="7.00799" y2="-3.13514" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#00BBFF" />
                      <stop offset="1" stopColor="#0051FF" />
                    </linearGradient>
                  </defs>
                </svg>
              )}
            </div>
            <svg width="16" height="15" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_x)">
                <path d="M12.5858 0H15.0391L9.65243 6.13333L15.9458 14.4533H11.0071L7.14043 9.39733L2.71376 14.4533H0.26043L5.9671 7.89333L-0.0595703 0H5.00176L8.4951 4.61867L12.5858 0ZM11.7271 13.0133H13.0871L4.2871 1.38667H2.82576L11.7271 13.0133Z" fill="white" />
              </g>
              <defs>
                <clipPath id="clip0_x">
                  <rect width="16" height="14.4533" fill="white" />
                </clipPath>
              </defs>
            </svg>
            <span className="text-sm text-white">X</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 text-white/60 hover:text-white cursor-pointer ml-1" />
                </TooltipTrigger>
                <TooltipContent className="bg-black text-white border-white/20 max-w-[300px]">
                  <p>{validationRules.x.post}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <button className="ml-auto" onClick={() => handleSocialMediaToggle('x')}>
              {selectedSocialMedia.x.selected ? <Minus size={12} className="text-white" /> : <Plus size={12} className="text-white" />}
            </button>
          </div>
          {selectedSocialMedia.x.selected && (
            <div className="ml-9 mt-2">
              <Button
                className="bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white h-6 px-4 hover:opacity-90 transition-opacity"
                onClick={() => { setPreviewPlatform('x'); setPreviewVariant('post'); setIsPreviewOpen(true); }}
              >
                Preview
              </Button>
            </div>
          )}
          {selectedSocialMedia.x.selected && (
            <>
              {renderCommonOptions('x', 'post')}
              <div className="flex gap-3 mt-4">
                <Button onClick={() => handleCancel('x', 'post')} variant="outline" className="flex-1 bg-transparent border-white text-white hover:bg-white/10">Cancel</Button>
                <Button onClick={() => handlePublish('x', 'post')} disabled={!isFormValid('x', 'post')} className="flex-1 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] disabled:opacity-50 disabled:cursor-not-allowed">Publish</Button>
              </div>
            </>
          )}
        </div>
      </div>
      {
        previewVariant === 'post' && previewPlatform === 'instagram' && (
          <InstagramPostPreviewModal
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            profileName={profile || ""}
            thumbnailUrl={selectedThumbUrl}
            description={previewDescription}
            tags={allTags}
            mediaType={mediaTypeSelections.instagram}
            videoUrl={getPreviewVideoUrl('instagram', 'post')}
          />
        )
      }
      {
        previewVariant === 'post' && previewPlatform === 'x' && (
          <XPostPreviewModal
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            profileName={profile || ""}
            thumbnailUrl={selectedThumbUrl}
            description={previewDescription}
            tags={allTags}
            mediaType={mediaTypeSelections.x}
            videoUrl={getPreviewVideoUrl('x', 'post')}
          />
        )
      }
      {
        previewVariant === 'post' && previewPlatform === 'tiktok' && (
          <TikTokPreviewModal
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            profileName={profile || ""}
            thumbnailUrl={selectedThumbUrl}
            description={previewDescription}
            tags={allTags}
            videoUrl={getPreviewVideoUrl('tiktok', 'post')}
          />
        )
      }
      {
        previewVariant === 'post' && previewPlatform === 'facebook' && (
          <FacebookPostPreviewModal
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            profileName={profile || ""}
            thumbnailUrl={selectedThumbUrl}
            description={previewDescription}
            tags={allTags}
            mediaType={mediaTypeSelections.facebook}
            videoUrl={getPreviewVideoUrl('facebook', 'post')}
          />
        )
      }
      {
        previewVariant === 'post' && previewPlatform === 'youtube' && (
          <YouTubePostPreviewModal
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            profileName={profile || ""}
            thumbnailUrl={selectedThumbUrl}
            description={descriptionText || (isHighlight ? (highlightFolder?.description || "") : (currentClip?.description || ""))}
            tags={allTags}
            title={titleText || ''}
            videoUrl={getPreviewVideoUrl('youtube', 'post')}
          />
        )
      }
      {
        previewVariant === 'story' && previewPlatform === 'facebook' && (
          <FacebookStoryPreviewModal
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            profileName={profile || ""}
            thumbnailUrl={selectedThumbUrl}
            videoUrl={getPreviewVideoUrl('facebook', 'story')}
          />
        )
      }
      {
        previewVariant === 'reel' && previewPlatform === 'instagram' && (
          <InstagramReelPreviewModal
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            profileName={profile || ""}
            thumbnailUrl={selectedThumbUrl}
            description={previewDescription}
            tags={allTags}
            videoUrl={getPreviewVideoUrl('instagram', 'reel')}
          />
        )
      }
      {
        previewVariant === 'story' && previewPlatform === 'instagram' && (
          <InstagramStoryPreviewModal
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            profileName={profile || ""}
            thumbnailUrl={selectedThumbUrl}
            videoUrl={getPreviewVideoUrl('instagram', 'story')}
          />
        )
      }
      {
        previewVariant === 'shorts' && previewPlatform === 'youtube' && (
          <YouTubeShortsPreviewModal
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            profileName={profile || ""}
            thumbnailUrl={selectedThumbUrl}
            description={previewDescription}
            tags={allTags}
            videoUrl={getPreviewVideoUrl('youtube', 'shorts')}
          />
        )
      }

      {isThumbnailPreviewOpen && (
        <PreviewModal
          isOpen={isThumbnailPreviewOpen}
          onClose={() => setIsThumbnailPreviewOpen(false)}
          clipData={{
            id: (currentClip as any)?._id || 'temp',
            title: titleText || 'Thumbnail Preview',
            timeRange: '',
            duration: '',
            aspectRatio: selectedAspect || '',
            rating: 0,
            poster: selectedThumbUrl,
            type: 'graphic',
            videoUrl: '',
          }}
          page="social-media"
        />
      )}
    </div >
  );
};

export default SocialMediaTab;
