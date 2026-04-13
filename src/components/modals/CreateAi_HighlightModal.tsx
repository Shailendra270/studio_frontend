import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { SearchableSelect } from "../ui/searchable-select";
import { SelectOption } from "../ui/searchable-select";
import { Button } from "../ui/button";
import { useAppSelector } from '@/store';
import { selectTagsByCategoryAndType } from '@/store/slices/tagsSlice';
import { selectUser } from '@/store/slices/authSlice';
import { shouldUseActionsNaming } from '@/utils/text';
import { useDispatch } from 'react-redux';
import { createFolder, getFolderById, createAIHighlight, getAIHighlightProgress } from "@/api/folderApi";
import { getClips, getClipFilterCounts } from '@/api/clipApi';
import { upsertUserHighlight, upsertFolder } from '@/store/slices/foldersSlice';
import { getCompetitions as getCompetitionsApi } from '@/api/competitionsApi';
import { selectTeams } from '@/store/slices/teamsSlice';
import { X } from "lucide-react";
interface CreateAi_HighlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateHighlight: (data: HighlightFormData) => void;
  category?: string;
  setIsLoading: (loading: boolean) => void;
  // setIsPreviewModalOpen: (open: boolean) => void;
  setFolderData: (data: any) => void;
  streamId?: string;
}

interface Tag {
  id: string;
  name: string;
  category: 'game' | 'player' | 'pulse';
  streamId?: string;
}

interface HighlightFormData {
  events: string[];
  aspectRatio: string;
  duration: string;
  replay: boolean;
}

interface AspectRatioOption {
  id: string;
  label: string;
  dimensions: string;
}

const CreateAi_HighlightModal: React.FC<CreateAi_HighlightModalProps> = ({
  isOpen,
  onClose,
  onCreateHighlight,
  category,
  setIsLoading,
  // setIsPreviewModalOpen,
  setFolderData,
  streamId,
}) => {
  const [formData, setFormData] = useState<HighlightFormData>({
    events: [],
    aspectRatio: "16:9", // Default selected
    duration: '3 min', // Default selected as shown in Figma
    replay: false,
  });
  const eventsTags = useAppSelector(state => selectTagsByCategoryAndType(state, category || 'cricket', 'event'));
  const { currentStream } = useAppSelector(state => state.streams);
  const teams = useAppSelector(selectTeams);
  const user = useAppSelector(selectUser);
  const [errors, setErrors] = useState<Partial<HighlightFormData>>({});
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>("16:9");
  const dispatch = useDispatch();
  const userId = ((user as any)?.userId || (user as any)?.id || (user as any)?._id || localStorage.getItem('userId') || '').toString();
  const useActionsNaming = shouldUseActionsNaming(userId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventCounts, setEventCounts] = useState<Record<string, { count: number; tagType: 'event' | 'player' | string }>>({});
  const [aspectCounts, setAspectCounts] = useState<Record<string, number>>({});

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
    return tags;
  };

  // Get tags based on the category
  const allTags: Tag[] = getTagsByCategory();

  // Helper function to get team names from team IDs
  const getTeamNamesFromStream = (stream: any) => {
    if (!stream?.team1Id || !stream?.team2Id) {
      return stream?.title || 'Event';
    }
    const team1 = teams.find((team: any) => team.id == stream.team1Id);
    const team2 = teams.find((team: any) => team.id == stream.team2Id);
    
    if (team1 && team2) {
      return `${team1.name} Vs ${team2.name}`;
    }

    // Fallback to stream title if teams not found
    return stream?.title || 'Event';
  };

  // Fetch tag counts when open
  useEffect(() => {
    const fetchCounts = async () => {
      if (!isOpen || !streamId) return;
      try {
        const resp = await getClipFilterCounts({
          streamId,
        });
        const tagsMap: Record<string, { count: number; tagType: 'event' | 'player' | string }> = {};
        (resp?.data?.tags || []).forEach((t: any) => {
          const keyRaw = (t.tag ?? t.label ?? t.name ?? t._id ?? '').toString();
          const key = keyRaw.trim();
          const tType = (t.tagType || '').toString();
          if (key) tagsMap[key] = { count: Number(t.count) || 0, tagType: (tType as any) || 'event' };
        });
        setEventCounts(tagsMap);

        const aspectsMap: Record<string, number> = {};
        (resp?.data?.aspectRatios || []).forEach((a: any) => {
          const key = String(a.aspectRatio || '').trim();
          if (key) aspectsMap[key] = a.count ?? 0;
        });
        setAspectCounts(aspectsMap);
      } catch (e) {
        // non-blocking
      }
    };
    fetchCounts();
  }, [isOpen, streamId]);

  // Function to get filtered events based on category and counts
  const getFilteredEvents = (): SelectOption[] => {
    // Prefer tag counts derived from clips (eventCounts); include those with count > 0
    if (eventCounts && Object.keys(eventCounts).length > 0) {
      const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
      const evOpts: SelectOption[] = [];
      const plOpts: SelectOption[] = [];
      Object.entries(eventCounts).forEach(([key, info]) => {
        if (!info || (Number(info.count) || 0) <= 0) return;
        const lower = key.toLowerCase().trim();
        const match = (eventsTags || []).find((t: any) => String(t.name).toLowerCase().trim() === lower);
        const opt: SelectOption = { value: lower, label: cap(match ? match.name : key) };
        if ((info.tagType || '').toString().toLowerCase() === 'player') plOpts.push(opt);
        else evOpts.push(opt);
      });
      return [...evOpts, ...plOpts];
    }
    // Fallback to backend-provided event tags
    if (eventsTags && eventsTags.length > 0) {
      return eventsTags.map((tag: any) => {
        const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
        return {
          value: String(tag.name).toLowerCase(),
          label: cap(tag.name),
        };
      });
    }
    return [];
  };

  // const getFilteredEvents = (): SelectOption[] => {
  //   // Show backend-provided event tags across categories; value equals tag name (lowercase)
  //   if (eventsTags && eventsTags.length > 0) {
  //     return eventsTags
  //       .filter((tag: any) => {
  //         const key = String(tag.name).toLowerCase().trim();
  //         if (!eventCounts || Object.keys(eventCounts).length === 0) return true;
  //         const count = eventCounts[key] ?? 0;
  //         return count > 0;
  //       })
  //       .map((tag: any) => ({
  //         value: String(tag.name).toLowerCase(),
  //         label: tag.name,
  //       }));
  //   }
  //   return [];
  // };

  // Convert filtered events to SelectOption format for the SearchableSelect component
  const eventOptions: SelectOption[] = getFilteredEvents();
  // Duration options
  // const durationOptions = ['3 min', '5 min', '7 min', '10 min'];

  // Aspect ratio options with visual representations
  const aspectRatioOptions: AspectRatioOption[] = [
    { id: "16:9", label: "16 : 9", dimensions: "16:9" },
    { id: "9:16", label: "9 : 16", dimensions: "9:16" },
    { id: "9:18", label: "9 : 18", dimensions: "9:18" },
    { id: "3:4", label: "3 : 4", dimensions: "3:4" },
    { id: "1:1", label: "1 : 1", dimensions: "1:1" },
    { id: "4:3", label: "4 : 3", dimensions: "4:3" },
    { id: "4:5", label: "4 : 5", dimensions: "4:5" },
  ];

  const resetFormData = () => {
    setFormData({
      events: [],
      aspectRatio: "16:9", // Reset to default
      duration: '3 min', // Reset to default
      replay: false,
    });
    setSelectedAspectRatio("16:9"); // Reset to default
    setErrors({}); // Clear any validation errors
  };

  const handleClose = () => {
    resetFormData();
    onClose();
  };

  // Handle overlay click to close modal
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleInputChange = (field: keyof HighlightFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleAspectRatioChange = (ratioId: string) => {
    setSelectedAspectRatio(ratioId);
    handleInputChange('aspectRatio', ratioId);
  };

  const renderAspectRatioIcon = (dimensions: string) => {
    const [width, height] = dimensions.split(":").map(Number);
    const aspectRatio = width / height;

    // Calculate dimensions for consistent visual representation
    let iconWidth, iconHeight;
    if (aspectRatio > 1) {
      iconWidth = 24;
      iconHeight = 24 / aspectRatio;
    } else {
      iconHeight = 24;
      iconWidth = 24 * aspectRatio;
    }

    return (
      <div
        className="border border-white rounded-sm"
        style={{
          width: `${iconWidth}px`,
          height: `${iconHeight}px`,
          minWidth: `${iconWidth}px`,
          minHeight: `${iconHeight}px`,
        }}
      />
    );
  };

  const validateForm = () => {
    const newErrors: Partial<HighlightFormData> = {};

    if (!formData.events || formData.events.length === 0) {
      // @ts-ignore
      newErrors.events = 'Event tags are required';
    }
    if (!formData.aspectRatio) {
      newErrors.aspectRatio = 'Aspect ratio is required';
    }
    if (!formData.duration) {
      newErrors.duration = 'Duration is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!streamId) {
      toast.error('Missing streamId to create highlight');
      return;
    }

    try {
      setIsSubmitting(true);
      setIsLoading(true);

      // Create folder first
      const folderPayload = {
        aspectRatio: formData.aspectRatio,
        userId: userId,
        streamId: streamId,
        title: `Untitled AI Highlight ${new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}`,
        type: 'highlight' as const,
        isAiCreated: true,
        category: category || 'cricket',
      };
      const folderResponse = await createFolder(folderPayload);
      if (!folderResponse?.success) {
        throw new Error(folderResponse?.message || 'Failed to create highlight folder');
      }
      const folderId = folderResponse.data._id;

      // Immediately insert into highlights lists
      try {
        (dispatch as any)(upsertUserHighlight(folderResponse.data));
        (dispatch as any)(upsertFolder(folderResponse.data));
      } catch {}

      // Resolve stream details to derive competition name and event title using Redux currentStream
      let streamTitle = currentStream?.title || '';
      let streamCategory = currentStream?.category || category || 'cricket';
      let tournamentId: string | undefined = currentStream?.tournamentId || undefined;

      // Fetch competition name using tournamentId
      let competitionName = '';
      if (tournamentId) {
        try {
          const compsResp = await getCompetitionsApi({ category: streamCategory, userId, pageNo: 1, limit: 100 });
          const comps = compsResp?.competitions || [];
          const selectedComp = comps.find((c: any) => c.id === tournamentId);
          competitionName = selectedComp?.name || competitionName;
        } catch (e) {
          // Non-blocking: fallback to tournamentId if lookup fails
        }
      }

      // Fetch clips for stream to pass to AI server
      const clipsResp = await getClips({ streamId, limit: 200, sortBy: 'oldest' });
      const toSeconds = (t: any) => {
        const s = String(t || '').trim();
        if (!s) return 0;
        const parts = s.split(':').map(Number);
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        return Number(s) || 0;
      };
      const eligibleClips = (clipsResp?.clips || [])
        .filter((clip: any) => {
          const selectedAR = formData.aspectRatio;
          if (selectedAR && selectedAR !== '16:9') {
            const edited = Array.isArray(clip.editedVideos) ? clip.editedVideos : [];
            const match = edited.find((ev: any) => ev?.aspect_ratio === selectedAR && ev?.videoUrl);
            return !!match;
          }
          const ratingVal = typeof clip.rating === 'number' ? clip.rating : (clip.clipRating || 0);
          return (Array.isArray(clip.tags) && clip.tags.length > 0) || ratingVal > 0;
        })
        .sort((a: any, b: any) => {
          const aStart = toSeconds(a.start_time);
          const bStart = toSeconds(b.start_time);
          if (aStart !== bStart) return aStart - bStart;
          const aEnd = toSeconds(a.end_time);
          const bEnd = toSeconds(b.end_time);
          return aEnd - bEnd;
        })
        .map((clip: any, idx: number) => {
          const selectedAR = formData.aspectRatio;
          const edited = Array.isArray(clip.editedVideos) ? clip.editedVideos : [];
          const match = selectedAR === '16:9'
            ? null
            : edited.find((ev: any) => ev?.aspect_ratio === selectedAR && ev?.event !== 'DYNAMIC' && ev?.videoUrl);
          const url = match?.videoUrl || clip.videoUrl;
          return ({
            id: idx,
            url,
            scene_id: clip._id || clip.id,
            duration: clip.duration,
            rating: typeof clip.rating === 'number' ? clip.rating : (clip.clipRating || 0),
            events: Array.isArray(clip.tags) && clip.tags.length > 0 ? clip.tags.map((tag: string) => tag.toLowerCase()) : []
          });
        });
        
      // Build AI payload with requested schema (AI modal -> 5000)
      const AIPayload = {
        sports: streamCategory,
        competition: competitionName || '',
        event: getTeamNamesFromStream(currentStream),
        events_request: formData.events,
        stream_id: streamId,
        player: [],
        // duration_request: formData.duration,
        replay_request: formData.replay ? 'yes' : 'no',
        highlight_id: folderId,
        intro: 'None',
        outro: 'None',
        aspect_ratio: formData.aspectRatio,
        clips: eligibleClips,
      };

      // Kick off AI highlight via backend proxy (now pointing to :5000)
      const aiInit = await createAIHighlight(AIPayload);
      if (!aiInit?.success) {
        throw new Error(aiInit?.message || 'Failed to initiate AI highlight');
      }

      // Fetch latest folder state to reflect initial AI status/progress
      try {
        const initialFolderState = await getFolderById(folderId);
        if (initialFolderState?.success) {
          (dispatch as any)(upsertUserHighlight(initialFolderState.data));
          // Also update general folders list for Clips page highlights tab
          (dispatch as any)(upsertFolder(initialFolderState.data));
        }
      } catch {}

      // Close modal and show initiation toast
      handleClose();
      toast.success('AI highlight creation initiated!');

      // Poll for progress via backend proxy
      const pollInterval = setInterval(async () => {
        try {
          const progressResp = await getAIHighlightProgress(folderId);
          if (progressResp?.success) {
            const p = progressResp.data;

            // Fetch and upsert latest folder state to update UI
            const latestFolder = await getFolderById(folderId);
            if (latestFolder?.success) {
              (dispatch as any)(upsertUserHighlight(latestFolder.data));
              (dispatch as any)(upsertFolder(latestFolder.data));
            }

            if (p.status === 'completed' && p.percent === 100) {
              clearInterval(pollInterval);
              if (latestFolder?.success) {
                setFolderData(latestFolder.data);
              }
              toast.success('Highlight created successfully!');
              // setIsPreviewModalOpen(true);
            }
          } else {
            clearInterval(pollInterval);
            toast.error('Failed to get progress status');
          }
        } catch (err: any) {
          clearInterval(pollInterval);
          toast.error(err?.message || 'Error while tracking progress');
        }
      }, 3000);
    } catch (error: any) {
      console.error('Create highlight error:', error);
      toast.error(error?.message || 'Failed to create highlight');
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  const isFormValid = (Array.isArray(formData.events) && formData.events.length > 0) && !!formData.aspectRatio;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Modal */}
      <div className="relative bg-black rounded-[50px] border-2 border-[#373737] w-full max-w-[550px] max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-center relative pt-8 pb-6 px-16">
          <h2 className="text-white text-[28px] font-medium leading-[70%] text-center">
            Create highlight
          </h2>
          <button
            onClick={handleClose}
            className="absolute right-8 top-8 text-white hover:text-gray-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1">
          <div className="flex-1 overflow-y-auto px-16 py-4 space-y-6">
            {/* Event Field */}
            <div className="space-y-2">
              <label className="text-white text-[14px] font-medium leading-[70%]">
                {useActionsNaming ? 'Actions' : 'Categories'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <SearchableSelect
                  options={eventOptions}
                  value={formData.events}
                  onChange={(value) => {
                    const vals = Array.isArray(value) ? (value as string[]) : [String(value)];
                    setFormData(prev => ({ ...prev, events: vals }));
                    if ((errors as any).events) {
                      setErrors(prev => ({ ...prev, events: undefined }));
                    }
                  }}
                  multiple
                  placeholder={useActionsNaming ? 'Search actions or players' : 'Search events or players'}
                  className="w-full"
                  searchable
                  triggerClassName="min-h-[48px] bg-[#252525] border-[#252525] text-white rounded-xl text-[14px] placeholder:text-[#707070]"
                />
                {(errors as any).events && (
                  <div className="text-red-500 text-sm mt-1">{(errors as any).events}</div>
                )}
              </div>
            </div>

            {/* Aspect Ratio Section */}
            <div className="space-y-4">
              <label className="text-white text-[14px] font-medium leading-[70%]">
                Aspect ratio <span className="text-red-500">*</span>
              </label>

              {/* Aspect Ratio Grid */}
              <div className="grid grid-cols-4 gap-4">
                {aspectRatioOptions.map((ratio) => {
                  const count = aspectCounts[ratio.id] ?? 0;
                  const isAvailable = count > 0;
                  const isSelected = selectedAspectRatio === ratio.id;
                  const baseClasses = "flex items-center justify-center gap-2 h-11 rounded-xl border-2 cursor-pointer transition-colors";
                  const availableClasses = isSelected ? "border-white bg-[#252525]" : "border-[#252525] hover:border-gray-600";
                  const unavailableClasses = "bg-red-500/10 border-red-500/40 hover:border-red-500/50";
                  return (
                    <div
                      key={ratio.id}
                      className={`${baseClasses} ${isAvailable ? availableClasses : unavailableClasses}`}
                      onClick={() => {
                        if (isAvailable) {
                          handleAspectRatioChange(ratio.id);
                        } else {
                          toast.info(`No clips available in ${ratio.id}. Please generate clips in ${ratio.id} first, then create highlights.`);
                        }
                      }}
                    >
                      {renderAspectRatioIcon(ratio.dimensions)}
                      <span className="text-sm font-medium text-white">
                        {ratio.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              {errors.aspectRatio && (
                <div className="text-red-500 text-sm">{errors.aspectRatio}</div>
              )}
            </div>

            {/* Duration Section */}
            {/* <div className="space-y-2">
              <label className="text-white text-[14px] font-medium leading-[70%]">
                Duration <span className="text-red-500">*</span>
              </label>

              <div className="flex bg-[#1B1B1B] rounded-xl p-0">
                {durationOptions.map((duration, index) => {
                  const isSelected = formData.duration === duration;
                  return (
                    <button
                      key={duration}
                      type="button"
                      onClick={() => handleInputChange('duration', duration)}
                      className={`
                        flex-1 h-[50px] text-[14px] font-medium leading-[170%] transition-colors
                        ${index === 0 ? 'rounded-l-xl' : ''}
                        ${index === durationOptions.length - 1 ? 'rounded-r-xl' : ''}
                        ${isSelected
                          ? 'bg-[#1B1B1B] border border-white text-white'
                          : 'bg-[#1B1B1B] text-white hover:bg-[#252525]'
                        }
                      `}
                    >
                      {duration}
                    </button>
                  );
                })}
              </div>
            </div> */}

            {/* Replay Section */}

            {/* Replay Toggle */}
            {/* {(category === "cricket" || category === "football") && <div className="flex bg-[#1B1B1B] rounded-xl p-0 w-[186px]">
              <div className="space-y-2">
                <label className="text-white text-[14px] font-medium leading-[70%]">
                  Replay <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, replay: true }))}
                  className={`
                    flex-1 h-[50px] text-[14px] font-medium leading-[170%] transition-colors rounded-l-xl
                    ${formData.replay as boolean
                      ? 'bg-[#1B1B1B] border border-white text-white'
                      : 'bg-[#1B1B1B] text-white hover:bg-[#252525]'
                    }
                  `}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, replay: false }))}
                  className={`
                    flex-1 h-[50px] text-[16px] font-medium font-['Montserrat'] leading-[170%] transition-colors rounded-r-xl
                    ${!formData.replay as boolean
                      ? 'bg-[#1B1B1B] border border-white text-white'
                      : 'bg-[#1B1B1B] text-white hover:bg-[#252525]'
                    }
                  `}
                >
                  No
                </button>
              </div>
            </div>} */}
          </div>

          {/* Footer Buttons */}
          <div className="flex-shrink-0 flex items-center justify-center gap-5 pt-6 pb-10 px-16">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="bg-[#1B1B1B] border-[#00BBFF] text-white hover:bg-[#00BBFF]/10 h-[42px] px-6 rounded-xl text-sm font-medium min-w-[160px]"
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              className={`
                h-[42px] px-6 rounded-xl text-sm font-medium min-w-[160px] flex items-center gap-3
                ${(isFormValid && !isSubmitting)
                  ? "bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white hover:opacity-90"
                  : "bg-[#373737] text-[#707070] cursor-not-allowed"
                }
              `}
            >
              {/* Star Icon */}
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11.8274 6.21162C7.95032 7.02284 7.02281 7.95035 6.2116 11.8274C6.16344 12.0575 5.83651 12.0575 5.78835 11.8274C4.97714 7.95035 4.04963 7.02284 0.172577 6.21162C-0.0575256 6.16347 -0.0575256 5.83653 0.172577 5.78838C4.04963 4.97716 4.97714 4.04965 5.78835 0.172578C5.83651 -0.0575259 6.16344 -0.0575259 6.2116 0.172578C7.02281 4.04965 7.95032 4.97716 11.8274 5.78838C12.0575 5.83653 12.0575 6.16347 11.8274 6.21162Z"
                    fill="currentColor"
                  />
                </svg>
              )}
              {isSubmitting ? 'Creating...' : 'Create highlight'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAi_HighlightModal;
