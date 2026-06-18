import React, { useCallback, useEffect, useState } from "react";
import { Field, Form, Formik, FormikProps } from "formik";
import SportsDropdown from "@/components/common/SportsDropdown";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getStreamById, updateStream } from "@/api/streams";
import { getPreStreamTemplateById, getPreStreamTemplatesByUser } from "@/api/prestreamTemplatesApi";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchCompetitions, selectCompetitions } from "@/store/slices/competitionsSlice";
import { fetchStreams } from "@/store/slices/streamsSlice";
import { CleanMatch, extractMatchData } from "@/utils/dsg";
import { step1Schema, step2Schema } from "@/utils/validations";
import { languageOptions, timezoneOptions, videoTypeOptions } from "@/constants/AddVideo";
import dayjs, { Dayjs } from "dayjs";
import { Video, X } from "lucide-react";
import { toast } from "sonner";

interface EditVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: {
    id: string;
    shortId?: string;
    title: string;
    category: string;
    url?: string;
    team1Id?: string;
    team2Id?: string;
    tournamentId?: string;
    videoType?: string;
    competitionType?: string;
  };
  onUpdated?: () => void;
}

interface FormData {
  title: string;
  competitionId: string;
  category: string;
  team1Id: string;
  team2Id: string;
  date: string;
  time: string;
  timeMinutes: string;
  amPm: string;
  timezone: string;
  matchId: string;
  scheduleAt: boolean;
  videoUrl: string;
  sharingOptions: string;
  streamTemplate: string;
  videoTemplateId: string;
  videoType: string;
  streamLanguage: string;
}

type CompetitionTeam = { _id: string; teamId: string; name: string };
type CompetitionLike = {
  _id?: string;
  id: string;
  name: string;
  category: string;
  competitionId?: string;
  teams?: CompetitionTeam[];
};

type PreStreamTemplate = { _id: string; name: string };

const EditVideoModal: React.FC<EditVideoModalProps> = ({ isOpen, onClose, video, onUpdated }) => {
  const dispatch = useAppDispatch();
  const { pagination } = useAppSelector((state) => state.streams);
  const { user } = useAppSelector((state) => state.auth);
  const competitions = useAppSelector(selectCompetitions) as CompetitionLike[];

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [selectedCategory, setSelectedCategory] = useState<string>(video?.category || "");
  const [competitionSelected, setCompetitionSelected] = useState<boolean>(!!video?.tournamentId);
  const [syncingMatch, setSyncingMatch] = useState(false);
  const [preStreamTemplateOptions, setPreStreamTemplateOptions] = useState<{ label: string; value: string }[]>([]);

  const [initialValues, setInitialValues] = useState<FormData>(() => {
    const now = dayjs();
    return {
      title: video?.title || "",
      competitionId: video?.tournamentId || "",
      category: video?.category || "",
      team1Id: video?.team1Id || "",
      team2Id: video?.team2Id || "",
      date: now.format("DD.MM.YY"),
      time: "HH",
      timeMinutes: "MM",
      amPm: "PM",
      timezone: "UTC",
      matchId: "",
      scheduleAt: false,
      videoUrl: video?.url || "",
      sharingOptions: "dont-share",
      streamTemplate: "auto",
      videoTemplateId: "",
      videoType: video?.videoType || "",
      streamLanguage: "",
    };
  });

  const handleModalClose = useCallback(() => {
    setCurrentStep(1);
    onClose();
  }, [onClose]);

  useEffect(() => {
    const loadPreStreamTemplates = async () => {
      try {
        if (!isOpen || !user?.userId) return;
        const res = await getPreStreamTemplatesByUser(user.userId, { limit: 100 });
        const list = Array.isArray((res as { data?: unknown })?.data) ? ((res as { data: unknown[] }).data as unknown[]) : [];
        if ((res as { success?: unknown })?.success && list.length > 0) {
          setPreStreamTemplateOptions(
            list
              .filter((t): t is PreStreamTemplate => {
                if (typeof t !== "object" || t === null) return false;
                const rec = t as Record<string, unknown>;
                return typeof rec._id === "string" && typeof rec.name === "string";
              })
              .map((t) => ({ label: t.name, value: t._id }))
          );
        }
      } catch {
        setPreStreamTemplateOptions([]);
      }
    };
    loadPreStreamTemplates();
  }, [isOpen, user?.userId]);

  useEffect(() => {
    const ensureSelectedTemplateInOptions = async () => {
      try {
        if (!isOpen) return;
        const templateId = initialValues.videoTemplateId;
        if (!templateId) return;
        if (preStreamTemplateOptions.some((o) => o.value === templateId)) return;

        const res = await getPreStreamTemplateById(templateId);
        const data = (res as { data?: unknown; success?: unknown })?.data;
        const name =
          typeof data === "object" && data !== null && "name" in data
            ? String((data as { name?: unknown }).name ?? "")
            : "";
        if ((res as { success?: unknown })?.success && name) {
          setPreStreamTemplateOptions((prev) => [{ label: name, value: templateId }, ...prev]);
        }
      } catch {
        return;
      }
    };
    ensureSelectedTemplateInOptions();
  }, [isOpen, initialValues.videoTemplateId, preStreamTemplateOptions]);

  useEffect(() => {
    if (isOpen && selectedCategory && user?.userId) {
      dispatch(fetchCompetitions({ category: selectedCategory, limit: 500, userId: user.userId }));
    }
  }, [dispatch, isOpen, selectedCategory, user?.userId]);

  useEffect(() => {
    if (!isOpen) return;
    const now = dayjs();
    setSelectedDate(now);
    setSelectedCategory(video?.category || "");
    setCompetitionSelected(!!video?.tournamentId);
    setCurrentStep(1);
    setInitialValues((prev) => ({
      ...prev,
      title: video?.title || "",
      category: video?.category || "",
      competitionId: video?.tournamentId || "",
      team1Id: video?.team1Id || "",
      team2Id: video?.team2Id || "",
      videoUrl: video?.url || "",
      videoType: video?.videoType || "",
      videoTemplateId: "",
      date: now.format("DD.MM.YY"),
      time: "HH",
      timeMinutes: "MM",
      amPm: "PM",
      timezone: "UTC",
      matchId: "",
    }));
  }, [isOpen, video]);

  useEffect(() => {
    async function prefill() {
      if (!isOpen || (!video?.shortId && !video?.id)) return;
      try {
        const res = await getStreamById(video.shortId || video.id);
        const s = res?.data?.stream || res?.data || res?.stream;
        if (!s) return;

        const matchDate = s.matchDate ? dayjs(s.matchDate) : null;
        const matchDateValid = !!matchDate && matchDate.isValid();
        const nextDate = matchDateValid ? (matchDate as Dayjs) : dayjs();
        setSelectedDate(nextDate);

        const metaTime = String(s?.metadata?.time || "");
        const timeMatch = metaTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        const timeHH = timeMatch ? timeMatch[1].padStart(2, "0") : matchDateValid ? (matchDate as Dayjs).format("hh") : "HH";
        const timeMM = timeMatch ? timeMatch[2] : matchDateValid ? (matchDate as Dayjs).format("mm") : "MM";
        const amPm = timeMatch ? timeMatch[3].toUpperCase() : matchDateValid ? (matchDate as Dayjs).format("A") : "PM";

        const category = String(s.category || video?.category || "");
        setSelectedCategory(category);
        setCompetitionSelected(!!s.tournamentId);

        setInitialValues((prev) => ({
          ...prev,
          title: s.title || prev.title,
          category,
          competitionId: s.tournamentId || prev.competitionId,
          team1Id: s.team1Id || prev.team1Id,
          team2Id: s.team2Id || prev.team2Id,
          matchId: s.matchId || s.eventId || prev.matchId,
          videoUrl: s.url || prev.videoUrl,
          videoType: s.videoType || prev.videoType,
          videoTemplateId: s.videoTemplateId || s?.metadata?.videoTemplateId || prev.videoTemplateId,
          streamLanguage: s.streamLanguage || s.language || s?.metadata?.streamLanguage || prev.streamLanguage,
          date: matchDateValid ? (matchDate as Dayjs).format("DD.MM.YY") : String(s?.metadata?.date || prev.date),
          time: timeHH,
          timeMinutes: timeMM,
          amPm,
          timezone: String(s?.metadata?.timezone || prev.timezone),
        }));
      } catch {
        return;
      }
    }
    prefill();
  }, [isOpen, video?.id, video?.shortId, video?.category]);

  const getCurrentValidationSchema = () => {
    switch (currentStep) {
      case 1:
        return step1Schema;
      case 2:
        return step2Schema;
      default:
        return step1Schema;
    }
  };

  const handleNext = (values: FormData, validateForm: () => Promise<Record<string, unknown>>) => {
    validateForm().then((errors) => {
      if (Object.keys(errors).length === 0) {
        if (currentStep === 1) setCurrentStep(2);
      }
    });
  };

  const handleBack = () => {
    if (currentStep === 2) setCurrentStep(1);
  };

  const handleSubmit = async (values: FormData) => {
    if (!video?.shortId && !video?.id) return;
    setIsSubmitting(true);
    try {
      let matchDateIso: string | undefined = undefined;
      try {
        const dateStr = values.date;
        const [dayStr, monthStr, yearStr] = dateStr.split(".");
        const dayNum = parseInt(dayStr, 10);
        const monthNum = parseInt(monthStr, 10);
        const yearNum = parseInt(yearStr, 10);
        const hourStr = values.time;
        const minuteStr = values.timeMinutes;
        const hourNum = parseInt(hourStr, 10);
        const minuteNum = parseInt(minuteStr, 10);
        if (
          !Number.isNaN(dayNum) &&
          !Number.isNaN(monthNum) &&
          !Number.isNaN(yearNum) &&
          !Number.isNaN(hourNum) &&
          !Number.isNaN(minuteNum) &&
          (values.amPm === "AM" || values.amPm === "PM")
        ) {
          const fullYear = yearNum < 100 ? 2000 + yearNum : yearNum;
          let hour24 = hourNum % 12;
          if (values.amPm === "PM") {
            hour24 += 12;
          }
          const m = dayjs()
            .year(fullYear)
            .month(monthNum - 1)
            .date(dayNum)
            .hour(hour24)
            .minute(minuteNum)
            .second(0)
            .millisecond(0);
          if (m.isValid()) {
            matchDateIso = m.toISOString();
          }
        }
      } catch {
        matchDateIso = undefined;
      }

      const hasValidTime =
        values.time &&
        values.timeMinutes &&
        values.time !== "HH" &&
        values.timeMinutes !== "MM" &&
        (values.amPm === "AM" || values.amPm === "PM");

      const updateData: Record<string, unknown> = {
        title: values.title,
        url: values.videoUrl,
        category: values.category,
        tournamentId: values.competitionId || undefined,
        team1Id: values.team1Id || undefined,
        team2Id: values.team2Id || undefined,
        matchId: values.matchId || undefined,
        matchDate: matchDateIso,
        videoTemplateId: values.videoTemplateId,
        videoType: values.videoType,
        isLive: values.videoType === "live",
        streamLanguage: values.streamLanguage,
        metadata: {
          tournamentId: values.competitionId,
          date: values.date,
          time: hasValidTime ? `${values.time}:${values.timeMinutes} ${values.amPm}` : undefined,
          timezone: hasValidTime ? values.timezone : undefined,
          matchId: values.matchId,
          matchDate: matchDateIso,
          videoTemplateId: values.videoTemplateId,
          streamLanguage: values.streamLanguage,
        },
      };

      await updateStream(video.shortId || video.id, updateData);

      if (user?.userId) {
        dispatch(fetchStreams({
          filters: {
            userId: user.userId,
            sortBy: "createdAt",
            sortOrder: "desc",
          },
          page: 1,
          limit: pagination?.limit || 10,
          useCache: false,
        }));
      }
      onUpdated?.();
      handleModalClose();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update stream");
    } finally {
      setIsSubmitting(false);
    }
  };

  const GRADIENT_BG = "linear-gradient(135deg, #00EEFF 0%, #0051FF 100%)";

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const onEscape = (e: KeyboardEvent) => { if (e.key === "Escape") handleModalClose(); };
    window.addEventListener("keydown", onEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onEscape);
    };
  }, [isOpen, handleModalClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={handleModalClose} role="dialog" aria-modal="true" aria-labelledby="edit-video-feed-title" aria-describedby="edit-video-feed-desc">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden />
      <div
        className="relative w-full max-w-[900px] max-h-[90vh] flex flex-col rounded-2xl overflow-hidden border border-[#252525] shadow-2xl bg-[#18191B]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — same structure as Manage tags: icon + title + subtitle + close */}
        <div className="relative shrink-0 px-6 py-4 border-b border-[#252525]">
          <div className="absolute inset-0 opacity-5 rounded-t-2xl" style={{ background: GRADIENT_BG }} />
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: GRADIENT_BG }}>
              <Video className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 id="edit-video-feed-title" className="text-lg font-semibold text-white leading-snug mt-2.5 mb-0">Edit video feed</h2>
              <p id="edit-video-feed-desc" className="text-xs text-gray-400 mt-0">Update stream name, sport, tournament and other details</p>
            </div>
            <button
              type="button"
              onClick={handleModalClose}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#252525] transition-all shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body with Formik matching AddNewVideoModal */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <Formik
            initialValues={initialValues}
            validationSchema={getCurrentValidationSchema()}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {(formik: FormikProps<FormData>) => {
              const selectedCompetitionObj = competitions.find((c) => c.id === formik.values.competitionId);
              const competitionTeamsRaw = selectedCompetitionObj?.teams ?? [];
              const competitionTeams = competitionTeamsRaw.map((t) => ({
                value: String(t.teamId || t._id || ""),
                label: String(t.name || ""),
              }));

              const asErrorMessage = (err: unknown): string | undefined => {
                if (typeof err === "string") return err;
                if (err === undefined || err === null) return undefined;
                return String(err);
              };

              const normalizeSelectValue = (val: unknown): string => {
                if (Array.isArray(val)) return String(val[0] ?? "");
                return String(val ?? "");
              };

  const getDisciplineIdFromPayload = (obj: unknown): string => {
    const asRecord = (v: unknown): Record<string, unknown> | undefined =>
      typeof v === "object" && v !== null ? (v as Record<string, unknown>) : undefined;
    const first = (v: unknown): unknown => (Array.isArray(v) ? v[0] : v);

    const root = asRecord(obj);
    if (!root) return "";
    const ds = asRecord(root["datasportsgroup"] ?? root);
    if (!ds) return "";

    const tour = asRecord(first(ds["tour"]));
    const tourSeason = asRecord(first(tour?.["tour_season"]));
    const competition = asRecord(first(tourSeason?.["competition"]));
    const season = asRecord(first(competition?.["season"]));
    const discipline = asRecord(first(season?.["discipline"]));
    const disciplineId = discipline?.["discipline_id"] ?? discipline?.["disciplineId"] ?? discipline?.["id"];
    return String(disciplineId ?? "").trim();
  };

  const findTeamIdByName = (teams: Array<{ value: string; label: string }>, teamName: string | undefined): string => {
    const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
    const target = norm(String(teamName || ""));
    if (!target) return "";
    const hit = teams.find((t) => norm(String(t.label || "")) === target);
    return hit ? String(hit.value || "") : "";
  };

              const getMatchMetadataPayload = (obj: unknown): unknown => {
                if (typeof obj === "object" && obj !== null && "data" in obj) {
                  return (obj as { data?: unknown }).data ?? obj;
                }
                return obj;
              };

              const getSportFromPayload = (obj: unknown): string => {
                if (typeof obj !== "object" || obj === null) return "";
                const root = obj as Record<string, unknown>;
                const dsg = root.datasportsgroup;
                if (typeof dsg !== "object" || dsg === null) return "";
                const sport = (dsg as Record<string, unknown>).sport;
                return typeof sport === "string" ? sport : String(sport ?? "");
              };

              return (
              <Form className="space-y-6">
                {/* Step Indicators */}
                <div className="flex justify-center mb-8">
                  <div className="flex border-[1.5px] border-[#252525] rounded-lg overflow-hidden w-[400px] h-[42px]">
                    <button
                      type="button"
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${
                        currentStep === 1
                          ? "bg-[#252525] text-white border border-white rounded-lg"
                          : "bg-transparent text-white hover:bg-[#252525]"
                      }`}
                      onClick={() => setCurrentStep(1)}
                    >
                      Event details
                    </button>
                    <button
                      type="button"
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${
                        currentStep >= 2
                          ? "bg-[#252525] text-white border border-white rounded-lg"
                          : "bg-transparent text-white hover:bg-[#252525]"
                      }`}
                      onClick={() => setCurrentStep(2)}
                    >
                      Video details
                    </button>
                  </div>
                </div>

                {/* Step 1: Event Details */}
                {currentStep === 1 && (
                  <div className="space-y-6 max-w-[800px] mx-auto">
                    <div className="flex gap-4 items-end">
                      <div className="w-[390px]">
                        <SportsDropdown
                          mode="field"
                          label="Sport"
                          value={formik.values.category}
                          placeholder="Select sport"
                          disabled
                          onChange={(value) => {
                            const newCat = normalizeSelectValue(value);
                            formik.setFieldValue("category", newCat);
                            setSelectedCategory(newCat);
                            formik.setFieldValue("competitionId", "");
                            formik.setFieldValue("team1Id", "");
                            formik.setFieldValue("team2Id", "");
                            setCompetitionSelected(false);
                            if (newCat) {
                              dispatch(fetchCompetitions({ category: newCat, limit: 500, userId: user?.userId || "" }));
                            }
                          }}
                          error={
                            formik.errors.category && formik.touched.category
                              ? asErrorMessage(formik.errors.category)
                              : undefined
                          }
                          required
                          touched={formik.touched.category}
                        />
                      </div>

                      <div className="w-[390px]">
                        <Label className="text-white text-sm font-medium block mb-2">
                          Competition
                        </Label>
                        <SearchableSelect
                          placeholder={selectedCategory ? "Select competition" : "Select sport first"}
                          options={(competitions || [])
                            .filter((c) => !selectedCategory || c.category === selectedCategory)
                            .map((c) => ({ value: c.id, label: c.name }))}
                          value={formik.values.competitionId}
                          disabled={!selectedCategory}
                          searchable
                          onChange={(val) => {
                            const v = normalizeSelectValue(val);
                            formik.setFieldValue("competitionId", v);
                            formik.setFieldValue("team1Id", "");
                            formik.setFieldValue("team2Id", "");
                            setCompetitionSelected(!!v);
                          }}
                          className="w-full"
                          triggerClassName={`min-h-[42px] bg-[#252525] border-[#252525] text-white rounded-lg ${!selectedCategory ? "opacity-60 cursor-not-allowed" : ""}`}
                          error={
                            formik.errors.competitionId && formik.touched.competitionId
                              ? asErrorMessage(formik.errors.competitionId)
                              : undefined
                          }
                        />
                      </div>
                    </div>

                    {competitionSelected && (
                      <div className="grid grid-cols-2 gap-4 w-full max-w-[720px]">
                        <div>
                          <Label className="text-white text-sm font-medium block mb-2">Team 1</Label>
                          <SearchableSelect
                            placeholder={competitionSelected ? "Select Team 1" : "Select competition first"}
                            options={competitionTeams}
                            value={formik.values.team1Id}
                            disabled={!competitionSelected}
                            searchable
                            onChange={(val) => {
                              const v = normalizeSelectValue(val);
                              formik.setFieldValue("team1Id", v);
                              if (formik.values.team2Id === v) {
                                formik.setFieldValue("team2Id", "");
                              }
                            }}
                            className="w-full"
                            triggerClassName="min-h-[42px] bg-[#252525] border-[#252525] text-white rounded-lg"
                          />
                        </div>
                        <div>
                          <Label className="text-white text-sm font-medium block mb-2">Team 2</Label>
                          <SearchableSelect
                            placeholder={competitionSelected ? "Select Team 2" : "Select competition first"}
                            options={competitionTeams.filter((t) => t.value !== formik.values.team1Id)}
                            value={formik.values.team2Id}
                            disabled={!competitionSelected}
                            searchable
                            onChange={(val) => {
                              const v = normalizeSelectValue(val);
                              formik.setFieldValue("team2Id", v);
                            }}
                            className="w-full"
                            triggerClassName="min-h-[42px] bg-[#252525] border-[#252525] text-white rounded-lg"
                          />
                        </div>
                      </div>
                    )}

                    {/* <div>
                      <Label htmlFor="matchId" className="text-white text-sm font-medium block mb-2">
                        Match ID (optional)
                      </Label>
                      <div className="flex gap-3">
                        <Field
                          as={Input}
                          id="matchId"
                          name="matchId"
                          type="text"
                          inputMode="numeric"
                          maxLength={7}
                          value={formik.values.matchId}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const next = e.target.value.replace(/\D/g, "").slice(0, 7);
                            formik.setFieldValue("matchId", next);
                          }}
                          placeholder="Enter match ID"
                          className="flex-1 bg-[#252525] border-[#252525] text-white placeholder-gray-400 rounded-lg h-[42px]"
                        />
                        <button
                          type="button"
                          disabled={syncingMatch}
                          onClick={async () => {
                            const id = formik.values.matchId.trim();
                            const categoryParam = String(formik.values.category || "").trim();
                            if (!categoryParam && !id) {
                              formik.setFieldTouched("category", true, false);
                              formik.setFieldError("category", "Sport, MatchId is required");
                              formik.setFieldTouched("matchId", true, false);
                              formik.setFieldError("matchId", "Sport, MatchId is required");
                              toast.error("Sport, MatchId is required");
                              return;
                            }
                            if (!categoryParam) {
                              formik.setFieldTouched("category", true, false);
                              formik.setFieldError("category", "Sport is required");
                              formik.setFieldError("matchId", undefined);
                              toast.error("Sport is required");
                              return;
                            }
                            if (!id) {
                              formik.setFieldTouched("matchId", true, false);
                              formik.setFieldError("matchId", "MatchId is required");
                              formik.setFieldError("category", undefined);
                              toast.error("MatchId is required");
                              return;
                            }
                            formik.setFieldError("category", undefined);
                            formik.setFieldError("matchId", undefined);
                            if (!/^\d{7}$/.test(id)) {
                              formik.setFieldTouched("matchId", true, false);
                              formik.setFieldError("matchId", "Match ID must be 7 digits");
                              toast.error("Enter a valid 7-digit Match ID");
                              return;
                            }
                            setSyncingMatch(true);
                            await toast.promise((async () => {
                              try {
                                const apiBase = import.meta.env.VITE_VIDEO_API_URL || "";
                              const qs = `?category=${encodeURIComponent(categoryParam)}`;
                              const resp = await fetch(`${apiBase}/api/streams/match/${id}/metadata${qs}`, { credentials: "include" });
                              const json = await resp.json();
                              if (!resp.ok) throw new Error("Upstream unauthorized");
                              const payload = getMatchMetadataPayload(json);
                              const matchPayload = Array.isArray(payload) ? payload[0] : payload;
                              const cleaned = extractMatchData(matchPayload);
                              const selected: CleanMatch | null =
                                cleaned.find((m) => String(m.matchId) === String(id)) || cleaned[0] || null;
                              if (!selected) throw new Error("No match found");
                              const sport = getSportFromPayload(matchPayload).toLowerCase();
                              const category = sport === "soccer" ? "football" : sport || formik.values.category || "football";
                              formik.setFieldValue("category", category);
                              setSelectedCategory(category);
                              const titleText = `${selected?.team_a?.name || ""} vs ${selected?.team_b?.name || ""}`;
                              formik.setFieldValue("title", titleText);
                              if (category) {
                                const action = await dispatch(fetchCompetitions({ category, limit: 500, userId: user?.userId || "" }));
                                const compList = fetchCompetitions.fulfilled.match(action)
                                  ? action.payload.competitions
                                  : [];
                                const compMatch = compList.find(
                                  (c) => String((c as CompetitionLike).competitionId || "") === String(selected?.competition?.id || "")
                                );
                                const shouldSyncCompetition = !compMatch || !Array.isArray(compMatch.teams) || compMatch.teams.length < 2;
                                if (shouldSyncCompetition) {
                                  const seasonId = String(selected?.season?.id || "").trim();
                                  const disciplineId = getDisciplineIdFromPayload(matchPayload);
                                  const userId = String(user?.userId || "").trim();
                                  const authApiBase = import.meta.env.VITE_API_HOSTNAME || "";
                                  const sportPath = category === "football" ? "soccer" : category;

                                  if (!authApiBase) throw new Error("Core API is not configured");
                                  if (!seasonId || !disciplineId || !userId) throw new Error("Unable to sync competition from metadata");

                                  const apiRoot = String(authApiBase)
                                    .replace(/\/api\/auth\/?$/i, "")
                                    .replace(/\/$/, "");
                                  const teamIds = [selected?.team_a?.id, selected?.team_b?.id].map(String).map((s) => s.trim()).filter(Boolean);
                                  const params = new URLSearchParams({
                                    userId,
                                    category: sportPath,
                                    disciplineId,
                                  });
                                  if (teamIds.length) params.set("teamIds", teamIds.join(","));
                                  const syncQs = params.toString();
                                  const syncResp = await fetch(`${apiRoot}/api/competitions/sync/${encodeURIComponent(seasonId)}?${syncQs}`, {
                                    credentials: "include",
                                  });
                                  const syncJson = await syncResp.json();
                                  if (!syncResp.ok || !syncJson?.success) {
                                    throw new Error(syncJson?.message || "Failed to sync competition");
                                  }

                                  const action2 = await dispatch(fetchCompetitions({ category, limit: 500, userId }));
                                  const compList2 = fetchCompetitions.fulfilled.match(action2)
                                    ? action2.payload.competitions
                                    : [];
                                  const compMatch2 = compList2.find(
                                    (c) => String((c as CompetitionLike).competitionId || "") === String(selected?.competition?.id || "")
                                  );
                                  if (compMatch2) {
                                    formik.setFieldValue("competitionId", compMatch2.id);
                                    setCompetitionSelected(true);

                                    const teams = compMatch2.teams ?? [];
                                    const teamOptions = teams.map((t) => ({
                                      value: String(t.teamId || t._id || ""),
                                      label: String(t.name || ""),
                                    }));
                                    const team1Id = findTeamIdByName(teamOptions, selected?.team_a?.name);
                                    const team2Id = findTeamIdByName(teamOptions, selected?.team_b?.name);
                                    if (team1Id) formik.setFieldValue("team1Id", team1Id);
                                    if (team2Id) formik.setFieldValue("team2Id", team2Id);
                                  }
                                }

                                if (compMatch) {
                                  formik.setFieldValue("competitionId", compMatch.id);
                                  setCompetitionSelected(true);

                                  const teams = compMatch.teams ?? [];
                                  const teamOptions = teams.map((t) => ({
                                    value: String(t.teamId || t._id || ""),
                                    label: String(t.name || ""),
                                  }));
                                  const team1Id = findTeamIdByName(teamOptions, selected?.team_a?.name);
                                  const team2Id = findTeamIdByName(teamOptions, selected?.team_b?.name);
                                  if (team1Id) formik.setFieldValue("team1Id", team1Id);
                                  if (team2Id) formik.setFieldValue("team2Id", team2Id);
                                }
                              }
                              return "Synced successfully";
                              } finally {
                                setSyncingMatch(false);
                              }
                            })(), {
                              loading: "Syncing...",
                              success: (msg) => msg as string,
                              error: (e) => (e instanceof Error ? e.message : "Sync failed"),
                            });
                          }}
                          className={`px-4 rounded-lg border-2 border-[#00BBFF] text-white h-[42px] ${syncingMatch ? "opacity-60 cursor-not-allowed" : "hover:bg-[#252525]"}`}
                        >
                          {syncingMatch ? (
                            <span className="inline-flex items-center gap-2">
                              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                              Sync
                            </span>
                          ) : (
                            "Sync"
                          )}
                        </button>
                      </div>
                      {formik.errors.matchId && formik.touched.matchId && (
                        <div className="text-red-500 text-sm mt-1">
                          {asErrorMessage(formik.errors.matchId)}
                        </div>
                      )}
                    </div> */}

                    <div>
                      <Label
                        htmlFor="title"
                        className="text-white text-sm font-medium block mb-2 after:content-['*'] after:text-red-500 after:ml-1"
                      >
                        Match name
                      </Label>
                      <Field
                        as={Input}
                        id="title"
                        name="title"
                        placeholder="Enter match name"
                        className="bg-[#252525] border-[#252525] text-white placeholder-gray-400 rounded-lg h-[42px] w-full"
                      />
                      {formik.errors.title && formik.touched.title && (
                        <div className="text-red-500 text-sm mt-1">
                          {asErrorMessage(formik.errors.title)}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-12 gap-6 items-end">
                      <div className="col-span-3">
                        <DatePicker
                          label="Date"
                          value={selectedDate}
                          onChange={(date, dateString) => {
                            if (date) {
                              setSelectedDate(date);
                              formik.setFieldValue("date", dateString);
                            }
                          }}
                          format="DD.MM.YY"
                          required
                        />
                        {formik.errors.date && formik.touched.date && (
                          <div className="text-red-500 text-xs mt-1">
                            {asErrorMessage(formik.errors.date)}
                          </div>
                        )}
                      </div>

                      <div className="col-span-3">
                        <Label className="text-white text-sm font-medium block mb-2">
                          Time
                        </Label>
                        <div className="flex items-center gap-2">
                          <div>
                            <Select
                              value={formik.values.time}
                              onValueChange={(value) => formik.setFieldValue("time", value)}
                            >
                              <SelectTrigger
                                className={`bg-[#252525] border-[#252525] text-white rounded-lg h-[42px] w-[65px] ${formik.errors.time && formik.touched.time ? "border-red-500" : ""}`}
                              >
                                <SelectValue placeholder="HH" />
                              </SelectTrigger>
                              <SelectContent className="bg-[#252525] border-[#373737] text-white">
                                {Array.from({ length: 12 }, (_, i) => {
                                  const hour = String(i + 1).padStart(2, "0");
                                  return (
                                    <SelectItem
                                      key={hour}
                                      value={hour}
                                      className="text-white hover:bg-[#373737] focus:bg-[#373737]"
                                    >
                                      {hour}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            {formik.errors.time && formik.touched.time && (
                              <div className="text-red-500 text-xs mt-1 text-center">
                                {asErrorMessage(formik.errors.time)}
                              </div>
                            )}
                          </div>
                          <div className="text-white text-lg">:</div>
                          <div>
                            <Select
                              value={formik.values.timeMinutes}
                              onValueChange={(value) => formik.setFieldValue("timeMinutes", value)}
                            >
                              <SelectTrigger
                                className={`bg-[#252525] border-[#252525] text-white rounded-lg h-[42px] w-[65px] ${formik.errors.timeMinutes && formik.touched.timeMinutes ? "border-red-500" : ""}`}
                              >
                                <SelectValue placeholder="MM" />
                              </SelectTrigger>
                              <SelectContent className="bg-[#252525] border-[#373737] text-white">
                                {Array.from({ length: 60 }, (_, i) => {
                                  const minute = String(i).padStart(2, "0");
                                  return (
                                    <SelectItem
                                      key={minute}
                                      value={minute}
                                      className="text-white hover:bg-[#373737] focus:bg-[#373737]"
                                    >
                                      {minute}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            {formik.errors.timeMinutes && formik.touched.timeMinutes && (
                              <div className="text-red-500 text-xs mt-1 text-center">
                                {asErrorMessage(formik.errors.timeMinutes)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="col-span-3">
                        <div
                          className={`flex border-[1.5px] rounded-lg overflow-hidden h-[42px] ${formik.errors.amPm && formik.touched.amPm ? "border-red-500" : "border-[#252525]"}`}
                        >
                          <button
                            type="button"
                            className={`flex-1 text-sm font-medium transition-colors ${formik.values.amPm === "AM" ? "bg-[#252525] text-white" : "bg-transparent text-white hover:bg-[#252525]"}`}
                            onClick={() => formik.setFieldValue("amPm", "AM")}
                          >
                            AM
                          </button>
                          <button
                            type="button"
                            className={`flex-1 text-sm font-medium transition-colors border-l border-[#252525] ${formik.values.amPm === "PM" ? "bg-[#252525] text-white border border-white 2px" : "bg-transparent text-white hover:bg-[#252525]"}`}
                            onClick={() => formik.setFieldValue("amPm", "PM")}
                          >
                            PM
                          </button>
                        </div>
                        {formik.errors.amPm && formik.touched.amPm && (
                          <div className="text-red-500 text-xs mt-1 text-center">
                            {asErrorMessage(formik.errors.amPm)}
                          </div>
                        )}
                      </div>

                      <div className="col-span-3">
                        <SearchableSelect
                          options={timezoneOptions}
                          value={formik.values.timezone}
                          defaultValue="UTC"
                          // searchable={true}
                          onChange={(value) => formik.setFieldValue("timezone", value)}
                          error={
                            formik.errors.timezone && formik.touched.timezone
                              ? asErrorMessage(formik.errors.timezone)
                              : undefined
                          }
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-4 pt-6 border-t border-[#252525] pt-6 mt-2">
                      <button
                        type="button"
                        onClick={handleModalClose}
                        className="rounded-xl border border-[#252525] bg-transparent min-w-[120px] h-10 px-5 text-sm font-medium text-gray-300 hover:bg-[#252525] hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNext(formik.values, formik.validateForm)}
                        className="rounded-xl min-w-[120px] h-10 px-5 text-sm font-semibold text-white transition-all hover:opacity-95"
                        style={{ background: GRADIENT_BG }}
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Video Details */}
                {currentStep === 2 && (
                  <div className="space-y-6 max-w-[800px] mx-auto">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white text-sm font-medium block mb-2 after:content-['*'] after:text-red-500 after:ml-1">
                          Video URL
                        </Label>
                        <Field
                          as={Input}
                          name="videoUrl"
                          placeholder="Enter video URL"
                          disabled
                          className="bg-[#252525] border-[#252525] text-white placeholder-gray-400 rounded-lg h-[42px] w-full disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                        {formik.errors.videoUrl && formik.touched.videoUrl && (
                          <div className="text-red-500 text-sm mt-1">
                            {asErrorMessage(formik.errors.videoUrl)}
                          </div>
                        )}
                      </div>
                    <SearchableSelect
                      label="Video type"
                      placeholder="Select video type"
                      options={videoTypeOptions}
                      value={formik.values.videoType}
                      searchable={false}
                      required
                      onChange={(value) => formik.setFieldValue("videoType", value)}
                      error={
                        formik.errors.videoType && formik.touched.videoType
                          ? asErrorMessage(formik.errors.videoType)
                          : undefined
                      }
                    />
                    </div>


                    <div className="grid grid-cols-2 gap-4">
                      <SearchableSelect
                        label="Video template"
                        placeholder="Select video template"
                        options={preStreamTemplateOptions}
                        value={formik.values.videoTemplateId}
                        searchable={true}
                        onChange={(value) => formik.setFieldValue("videoTemplateId", value)}
                        error={
                          formik.errors.videoTemplateId && formik.touched.videoTemplateId
                            ? asErrorMessage(formik.errors.videoTemplateId)
                            : undefined
                        }
                      />

                      <SearchableSelect
                        label="Stream language"
                        placeholder="Select stream language"
                        options={languageOptions}
                        value={formik.values.streamLanguage}
                        searchable={true}
                        onChange={(value) => formik.setFieldValue("streamLanguage", value)}
                        error={
                          formik.errors.streamLanguage && formik.touched.streamLanguage
                            ? asErrorMessage(formik.errors.streamLanguage)
                            : undefined
                        }
                      />
                    </div>

                    <div className="flex items-center justify-center gap-4 pt-6 border-t border-[#252525] pt-6 mt-2">
                      <button
                        type="button"
                        onClick={handleBack}
                        className="rounded-xl border border-[#252525] bg-transparent min-w-[120px] h-10 px-5 text-sm font-medium text-gray-300 hover:bg-[#252525] hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-xl min-w-[120px] h-10 px-5 text-sm font-semibold text-white transition-all hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: GRADIENT_BG }}
                      >
                        {isSubmitting ? "Saving..." : "Save changes"}
                      </button>
                    </div>
                  </div>
                )}
              </Form>
            )}}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default EditVideoModal;
