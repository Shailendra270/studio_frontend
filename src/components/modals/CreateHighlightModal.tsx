import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
// import { createHighlight } from '../../store/slices/highlightsSlice';
import { createFolder, getFolderById, createAIHighlight, getAIHighlightProgress } from '../../api/folderApi';
import { getClips, getClipFilterCounts } from '@/api/clipApi';
import { SearchableSelect } from '../ui/searchable-select';
import { SelectOption } from '../ui/searchable-select';
import SportsDropdown from '@/components/common/SportsDropdown';
import { selectUser } from '@/store/slices/authSlice';
import { fetchCompetitions, selectCompetitions } from '@/store/slices/competitionsSlice';
import { upsertUserHighlight, upsertFolder } from '@/store/slices/foldersSlice';
import { fetchStreams } from '@/store/slices/streamsSlice';
import { fetchTeams, selectTeams } from '@/store/slices/teamsSlice';
import { useNavigate } from 'react-router-dom';
import { Button } from "../ui/button";
import {
  CreateHighlightFormData,
  AspectRatioOption,
} from "../../types/highlight";
import { Timer, X } from 'lucide-react';

interface CreateHighlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClips: string[];
  onCreateHighlight: (data: CreateHighlightFormData) => void;
  onManualSelect: () => void;
  setIsLoading: (loading: boolean) => void;
  setIsPreviewModalOpen: (open: boolean) => void;
  setFolderData: (data: any) => void;
}

const CreateHighlightModal: React.FC<CreateHighlightModalProps> = ({
  isOpen,
  onClose,
  selectedClips,
  onCreateHighlight,
  onManualSelect,
  setIsLoading,
  setFolderData,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateHighlightFormData>({
    sport: "",
    competition: "",
    event: "",
    aspectRatio: "16:9", // Default selected as shown in Figma
    duration: '3 min', // Default selected as shown in Figma
    replay: false,
  });

  const [errors, setErrors] = useState<Partial<CreateHighlightFormData>>({});
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>(
    "16:9" // Default selected as shown in Figma
  );
  const [streamClips, setStreamClips] = useState<any[]>([]);
  const [aspectCounts, setAspectCounts] = useState<Record<string, number>>({});
  const [aspectsReady, setAspectsReady] = useState(false);
  // Current user (for API calls)
  const user = useSelector(selectUser);
  const userId = user?.userId || localStorage.getItem('userId') || '';
  // const userHighlightsFilters = useSelector(selectUserHighlightsFilters);
  // const userHighlightsPagination = useSelector(selectUserHighlightsPagination);

  // Competitions and Streams from store
  const competitions = useSelector(selectCompetitions);
  const streams = useSelector((state: any) => state.streams.streams);
  const teams = useSelector(selectTeams);

  // Derived options from store data
  const competitionOptions: SelectOption[] = useMemo(() => {
    if (!formData.sport) return [];
    // Map competitions of selected sport
    return competitions
      .filter((c: any) => c.category === formData.sport)
      .map((c: any) => ({ value: c.id, label: c.name }));
  }, [competitions, formData.sport]);

  const eventOptions: SelectOption[] = useMemo(() => {
    if (!formData.competition) return [];
    // Streams fetched by tournamentId; fallback filter to ensure association
    return streams
      .filter((s: any) => s.tournamentId === formData.competition)
      .map((s: any) => ({ value: s.streamId, label: s.title }));
  }, [streams, formData.competition]);

  // Duration options
  const durationOptions = ['3 min', '5 min', '7 min', '10 min'];

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
      sport: "",
      competition: "",
      event: "",
      aspectRatio: "16:9", // Reset to default
      duration: '3 min', // Reset to default
      replay: false,
    });
    setSelectedAspectRatio("16:9"); // Reset aspect ratio selection
    setStreamClips([]); // Reset stream clips
    setErrors({}); // Clear any validation errors
  };

  // Fetch competitions when sport changes
  useEffect(() => {
    if (!isOpen) return;
    if (formData.sport && userId) {
      dispatch(
        fetchCompetitions({ category: formData.sport, userId, pageNo: 1, limit: 50 })
      );
    }
  }, [formData.sport, userId, isOpen, dispatch]);

  // Fetch teams when sport changes
  useEffect(() => {
    if (!isOpen) return;
    if (formData.sport && userId) {
      dispatch(
        fetchTeams({ category: formData.sport, limit: 500, userId })
      );
    }
  }, [formData.sport, userId, isOpen, dispatch]);

  // Fetch streams when competition changes (by tournamentId)
  useEffect(() => {
    if (!isOpen) return;
    if (formData.competition && userId) {
      dispatch(
        fetchStreams({
          filters: { userId, category: formData.sport, tournamentId: formData.competition },
          page: 1,
          limit: 50,
          useCache: false,
        })
      );
    }
  }, [formData.competition, formData.sport, userId, isOpen, dispatch]);

  // Fetch clips when event (stream) changes
  useEffect(() => {
    const fetchClipsForStream = async () => {
      if (!isOpen || !formData.event) {
        setStreamClips([]);
        return;
      }

      try {
        const selectedStream = streams.find((s: any) => s.streamId === formData.event);
        if (selectedStream?.streamId) {
          const clipsResp = await getClips({
            streamId: selectedStream.streamId,
            limit: 200,
            sortBy: 'oldest'
          });
          setStreamClips(clipsResp?.clips || []);

          try {
            setAspectsReady(false);
            const countsResp = await getClipFilterCounts({ streamId: selectedStream.streamId });
            const aspectsMap: Record<string, number> = {};
            (countsResp?.data?.aspectRatios || []).forEach((a: any) => {
              const key = String(a.aspectRatio || '').trim();
              if (key) aspectsMap[key] = a.count ?? 0;
            });
            setAspectCounts(aspectsMap);
            setAspectsReady(true);
          } catch {}
        }
      } catch (error) {
        console.error('Error fetching clips:', error);
        setStreamClips([]);
      }
    };

    fetchClipsForStream();
  }, [formData.event, streams, isOpen]);

  const handleClose = () => {
    resetFormData();
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleEscapeKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "hidden";
    } else {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "unset";
    }
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleInputChange = (
    field: keyof CreateHighlightFormData,
    value: string
  ) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Reset dependent dropdowns when parent selection changes
      if (field === 'sport') {
        newData.competition = '';
        newData.event = '';
      } else if (field === 'competition') {
        newData.event = '';
      }

      return newData;
    });

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateHighlightFormData> = {};

    if (!formData.sport) {
      newErrors.sport = "Sport is required";
    }
    if (!formData.competition) {
      newErrors.competition = "Competition is required";
    }
    if (!formData.event) {
      newErrors.event = "Event is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper function to check if any clip has replay tag (including tags containing "replay")
  const hasReplayTag = (clips: any[]) => {
    return clips.some((clip: any) =>
      Array.isArray(clip.tags) && clip.tags.some((tag: string) =>
        tag.toLowerCase().includes('replay')
      )
    );
  };

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

  const handleCreateHighlight = async () => {
    // Prevent multiple clicks triggering parallel requests
    if (isSubmitting) return;
    if (!validateForm()) {
      toast.error("Please fill in all required fields", {
        description: "All fields are required to create a highlight.",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Resolve selected competition and stream
      const selectedCompetition = competitions.find((c: any) => c.id === formData.competition);
      const selectedStream = streams.find((s: any) => s.streamId === formData.event);

      if (!selectedCompetition || !selectedStream) {
        throw new Error('Invalid competition or event selection');
      }

      // Fetch clips for selected stream and filter eligible ones
      const clipsResp = await getClips({ streamId: selectedStream.streamId, limit: 200, sortBy: 'oldest' });
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
          let url = clip.videoUrl;
          if (selectedAR && selectedAR !== '16:9') {
            const edited = Array.isArray(clip.editedVideos) ? clip.editedVideos : [];
            const match = edited.find((ev: any) => ev?.aspect_ratio === selectedAR && ev?.videoUrl);
            url = match?.videoUrl || url;
          }
          return ({
            id: idx,
            url,
            scene_id: clip._id || clip.id,
            duration: clip.duration,
            rating: typeof clip.rating === 'number' ? clip.rating : (clip.clipRating || 0),
            events: Array.isArray(clip.tags) && clip.tags.length > 0 ? clip.tags.map((tag: string) => tag.toLowerCase()) : []
          });
        });

      // Create folder first
      const folderPayload = {
        aspectRatio: formData.aspectRatio,
        userId: userId,
        streamId: selectedStream.streamId,
        title: `Untitled AI Highlight ${new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}`,
        type: 'highlight' as const,
        isAiCreated: true,
        category: selectedStream.category || formData.sport,
      };
      const folderResponse = await createFolder(folderPayload);
      if (!folderResponse?.success) {
        throw new Error(folderResponse?.message || 'Failed to create highlight folder');
      }
      const folderId = folderResponse.data._id;

      // Immediately insert the newly created folder into both lists
      try {
        (dispatch as any)(upsertUserHighlight(folderResponse.data));
        (dispatch as any)(upsertFolder(folderResponse.data));
      } catch { }
      // Build AI payload
      const AIPayload = {
        sports: formData.sport,
        competition: selectedCompetition?.name || formData.competition,
        event: getTeamNamesFromStream(selectedStream),
        stream_id: selectedStream.streamId,
        // events_request: [],
        // player: [],
        duration_request: formData.duration,
        replay_request: formData.replay ? 'yes' : 'no',
        highlight_id: folderId,
        intro: 'None',
        outro: 'None',
        aspect_ratio: formData.aspectRatio,
        clips: eligibleClips,
      };

      // Kick off AI highlight
      const aiInit = await createAIHighlight(AIPayload);
      if (!aiInit?.success) {
        throw new Error(aiInit?.message || 'Failed to initiate AI highlight');
      }
      const initData = aiInit.data;

      // Backend proxy already updates folder with initial AI response

      // Fetch latest folder state to reflect initial AI status/progress
      try {
        const initialFolderState = await getFolderById(folderId);
        if (initialFolderState?.success) {
          (dispatch as any)(upsertUserHighlight(initialFolderState.data));
          (dispatch as any)(upsertFolder(initialFolderState.data));
        }
      } catch { }

      // Close modal and show initiation toast
      handleClose();
      toast.success('AI highlight creation initiated!');

      // Poll progress
      const pollInterval = setInterval(async () => {
        try {
          const progressResp = await getAIHighlightProgress(folderId);
          if (progressResp?.success) {
            const p = progressResp.data;

            // Backend proxy updates folder progress; fetch latest folder state
            const latestFolder = await getFolderById(folderId);

            if (p.status === 'completed' && p.percent === 100) {
              clearInterval(pollInterval);

              // Folder is updated by backend; update UI and store
              if (latestFolder?.success) {
                setFolderData(latestFolder.data);
                (dispatch as any)(upsertUserHighlight(latestFolder.data));
                (dispatch as any)(upsertFolder(latestFolder.data));
              }
              toast.success('Highlight created successfully!');
              // No full refetch; rely on upsert updates above
            }
          } else {
            clearInterval(pollInterval);
            toast.error('Failed to get progress status');
          }
        } catch (err: any) {
          clearInterval(pollInterval);
          toast.error(err?.message || 'Error while tracking progress');
        }
        // During progress, upsert latest folder state to update overlay percent
        try {
          const latestFolderDuringProgress = await getFolderById(folderId);
          if (latestFolderDuringProgress?.success) {
            (dispatch as any)(upsertUserHighlight(latestFolderDuringProgress.data));
            (dispatch as any)(upsertFolder(latestFolderDuringProgress.data));
          }
        } catch { }
      }, 3000);
    } catch (error: any) {
      console.error('Create highlight error:', error);
      toast.error(error?.message || 'Failed to create highlight');
    } finally {
      setIsSubmitting(false);
    }
  };

  // const handleManualSelect = () => {
  //   toast.info("Opening manual selection...", {
  //     description: "You can now manually select specific parts of your clips.",
  //   });
  //   onManualSelect();
  //   handleClose();
  // };

  const handleManualSelect = () => {
    toast.info('Opening manual selection...', {
      description: 'You can now manually select specific parts of your clips.',
    });

    // Navigate to the create-highlight page with current context
    navigate('/create-highlight', {
      state: {
        selectedClips: selectedClips,
        matchInfo: 'Bangladesh vs Bhutan | FIFA Friendly match', // This could be dynamic based on context
        formData: formData
      }
    });

    onManualSelect();
    onClose();
  };



  const handleAspectRatioChange = (aspectRatioId: string) => {
    setSelectedAspectRatio(aspectRatioId);
    // Update form data with selected aspect ratio
    setFormData((prev) => ({ ...prev, aspectRatio: aspectRatioId }));
    notifyDurationIfLimited(formData.duration, aspectRatioId);
  };

  const notifyDurationIfLimited = (duration: string, ratioId?: string) => {
    const ar = ratioId || selectedAspectRatio;
    const count = aspectCounts[ar] ?? 0;
    if (duration === '10 min' && count < 35) {
      toast.info(`Only ${count} clips available in ${ar}. A 10 min highlight may be shorter.`);
    } else if (duration === '7 min' && count < 25) {
      toast.info(`Only ${count} clips available in ${ar}. A 7 min highlight may be shorter.`);
    } else if ((duration === '5 min' || duration === '7 min' || duration === '10 min') && count < 15) {
      toast.info(`Only ${count} clips available in ${ar}. A 5 min highlight may be shorter.`);
    }
  };

  const renderAspectRatioIcon = (dimensions: string) => {
    const [width, height] = dimensions.split(":").map(Number);
    const isVertical = height > width;
    const isSquare = height === width;

    if (isSquare) {
      return (
        <div className="w-5 h-5 bg-gradient-to-br from-[#00BBFF] to-[#0051FF] rounded-sm flex-shrink-0"></div>
      );
    }

    return (
      <div
        className={`bg-gradient-to-br from-[#00BBFF] to-[#0051FF] rounded-sm flex-shrink-0 ${isVertical ? "w-3 h-5" : "w-5 h-3"
          }`}
      ></div>
    );
  };

  const isFormValid = formData.sport && formData.competition && formData.event;
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-90" />

      {/* Modal */}
      <div className="relative bg-black rounded-[50px] border-2 border-[#373737] w-full max-w-[550px] max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-center relative pt-6 pb-4 px-12">
          <h2 className="text-white text-[24px] font-medium leading-[70%]  text-center">
            Create highlight
          </h2>
          <button
            onClick={handleClose}
            className="absolute right-8 top-8 text-white hover:text-gray-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 px-12 pb-2 space-y-5">
          {/* Sport Field */}
          <div className="space-y-1.5">
            <label className="text-white text-[14px] font-medium  leading-[70%]">
              Sport <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <SportsDropdown
                mode="field"
                placeholder="Select sport"
                value={formData.sport}
                onChange={(value: string | string[]) =>
                  handleInputChange(
                    'sport',
                    Array.isArray(value) ? value[0] : value
                  )
                }
                required
                error={errors.sport}
                className="w-full"
              />
            </div>
          </div>

          {/* Competition Field */}
          <div className="space-y-1.5">
            <label className="text-white text-[14px] font-medium  leading-[70%]">
              Competition <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <SearchableSelect
                placeholder="Select competition"
                options={competitionOptions}
                value={formData.competition}
                onChange={(value) =>
                  handleInputChange(
                    "competition",
                    Array.isArray(value) ? value[0] : value
                  )
                }
                className="w-full"
                triggerClassName="h-[40px] bg-[#252525] border-[#252525] text-white rounded-xl text-[14px] placeholder:text-[#707070] "
                error={errors.competition}
              />
            </div>
          </div>

          {/* Event Field */}
          <div className="space-y-1.5">
            <label className="text-white text-[14px] font-medium  leading-[70%]">
              Event <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <SearchableSelect
                placeholder="Select event"
                options={eventOptions}
                value={formData.event}
                onChange={(value) =>
                  handleInputChange(
                    "event",
                    Array.isArray(value) ? value[0] : value
                  )
                }
                className="w-full"
                triggerClassName="h-[40px] bg-[#252525] border-[#252525] text-white rounded-xl text-[14px] placeholder:text-[#707070] "
                error={errors.event}
              />
            </div>
          </div>

          {/* Aspect Ratio Section */}
          {formData.event && (
          <div className="space-y-3">
            <label className="text-white text-[14px] font-medium  leading-[70%]">
              Aspect ratio
            </label>

            {/* Aspect Ratio Grid */}
            <div className="grid grid-cols-4 gap-4">
              {aspectRatioOptions.map((ratio) => {
                const count = aspectCounts[ratio.id] ?? 0;
                const isAvailable = count > 0;
                const isSelected = selectedAspectRatio === ratio.id;
                const baseClasses = "flex items-center justify-center gap-2 h-9 rounded-xl border-2 cursor-pointer transition-colors";
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
                        toast.info(`No clips available in ${ratio.id}. Please generate clips with ${ratio.id} first, then create highlights.`);
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
          </div>
          )}

          {/* Duration Section */}
          <div className="space-y-1.5">
            <label className="text-white text-[14px] font-medium leading-[70%]">
              Duration <span className="text-red-500">*</span>
            </label>

            {/* Duration Options */}
            <div className="flex bg-[#1B1B1B] rounded-xm p-0">
              {durationOptions.map((duration, index) => {
                const isSelected = formData.duration === duration;
                return (
                  <button
                    key={duration}
                    type="button"
                    onClick={() => { handleInputChange('duration', duration); notifyDurationIfLimited(duration); }}
                    className={`
                        flex-1 h-[40px] text-[14px] font-medium leading-[170%] transition-colors
                        ${index === 0 ? 'rounded-l-xl' : ''}
                        ${index === durationOptions.length - 1 ? 'rounded-r-xl' : ''}
                        ${isSelected
                        ? 'bg-[#1B1B1B] border border-white text-white'
                        : 'bg-[#1B1B1B] text-white hover:bg-[#252525]'
                      }
                      `}
                  >
                    {/* <Timer size={24} /> */}
                    {/* <span className="text-sm font-medium text-white"> */}
                      {duration}
                    {/* </span> */}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Replay Section */}
          {/* Replay Section - Only show for cricket or football AND if selected stream clips have replay tag */}
          {(formData.sport === "cricket" || formData.sport === "football") && hasReplayTag(streamClips) && (
            <div className="space-y-1.5">
              <label className="text-white text-[14px] font-medium leading-[70%]">
                Replay <span className="text-red-500">*</span>
              </label>

              {/* Replay Toggle */}
              <div className="flex bg-[#1B1B1B] rounded-xm p-0 w-[186px]">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, replay: true }))}
                  className={`
                      flex-1 h-[40px] text-[14px] font-medium leading-[170%] transition-colors rounded-l-xl
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
                      flex-1 h-[40px] text-[14px] font-medium font-['Montserrat'] leading-[170%] transition-colors rounded-r-xl
                      ${!formData.replay as boolean
                      ? 'bg-[#1B1B1B] border border-white text-white'
                      : 'bg-[#1B1B1B] text-white hover:bg-[#252525]'
                    }
                    `}
                >
                  No
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex-shrink-0 flex items-center justify-center gap-4 pt-3 pb-6 px-12">
          <Button
            type="button"
            variant="outline"
            onClick={handleManualSelect}
            className="bg-[#1B1B1B] border-[#00BBFF] text-white hover:bg-[#00BBFF]/10 h-[44px] px-8 rounded-xl text-sm font-medium  min-w-[160px]"
          >
            Manual select
          </Button>

          <Button
            type="button"
            onClick={handleCreateHighlight}
            disabled={!isFormValid || isSubmitting}
            className={`
              h-[44px] px-6 rounded-xl text-sm font-medium  min-w-[160px] flex items-center gap-3
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
  );
};

export default CreateHighlightModal;
