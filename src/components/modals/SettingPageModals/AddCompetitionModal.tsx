import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import SportsDropdown from "@/components/common/SportsDropdown";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useDispatch, useSelector } from "react-redux";
import { fetchTeams, selectTeams } from "@/store/slices/teamsSlice";
import { getTeams } from "@/api/teamsApi";
import { fetchCompetitions } from "@/store/slices/competitionsSlice";
import { useAppSelector } from "@/store";
import { selectUser } from "@/store/slices/authSlice";
import { X } from "lucide-react";
import { toast } from "sonner";

interface AddCompetitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CompetitionFormData) => void;
  defaultSport?: string;
}

interface CompetitionFormData {
  sport: string;
  competitionName: string;
  //   competitionId: string;
  teamIds: string[];
  teams?: { teamId: string; name: string }[];
}

// Use shared sportOptions for consistency across app

const AddCompetitionModal: React.FC<AddCompetitionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultSport = "",
}) => {
  const [formData, setFormData] = useState<CompetitionFormData>({
    sport: defaultSport || "",
    competitionName: "",
    // competitionId: "",
    teamIds: [],
  });
  const [teamOptionsDynamic, setTeamOptionsDynamic] = useState<{ value: string; label: string }[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<{ value: string; label: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedTerm, setDebouncedTerm] = useState<string>("");
  const [syncing, setSyncing] = useState(false);
  const dispatch = useDispatch();
  const teams = useSelector(selectTeams);
  const user = useAppSelector(selectUser);
  // SportsDropdown manages open/close internally


  const handleSubmit = () => {
    if (formData.sport && formData.competitionName) {
      const idToLabel = new Map(selectedOptions.map(o => [String(o.value), String(o.label)]));
      const teams = (formData.teamIds || []).map(id => ({ teamId: String(id), name: idToLabel.get(String(id)) || '' }));
      onSubmit({ ...formData, teams });
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      sport: "",
      competitionName: "",
      //   competitionId: "",
      teamIds: [],
    });
    onClose();
  };

  const handleSync = () => {
    const seasonId = (document.getElementById('competition-season-id') as HTMLInputElement)?.value || '';
    const disciplineId = (document.getElementById('competition-discipline-id') as HTMLInputElement)?.value || '';
    const trimmed = String(seasonId).trim();
    const discTrim = String(disciplineId).trim();
    if (!/^\d{5}$/.test(trimmed)) {
      toast.error("Enter a valid 5-digit Season ID (season)");
      return;
    }
    if (!/^\d{1,5}$/.test(discTrim) || Number(discTrim) < 1) {
      toast.error("Enter a valid Discipline ID (max 5 digits, numeric)");
      return;
    }
    const apiBase = (import.meta as any).env?.VITE_VIDEO_API_URL || '';
    const uid = user?.userId || '';
    const category = formData.sport === "football" ? "soccer" : formData.sport;
    setSyncing(true);
    handleClose();
    toast.promise(
      (async () => {
        const r = await fetch(`${apiBase}/api/competitions/sync/${trimmed}?userId=${encodeURIComponent(uid)}&category=${encodeURIComponent(category)}&disciplineId=${encodeURIComponent(discTrim)}`, { credentials: 'include' });
        const j = await r.json();
        if (!r.ok || j?.success === false) throw new Error(j?.message || 'Sync failed');
        const data = j?.data || {};
        const comp = data?.competition || {};
        const teams = Array.isArray(data?.teams) ? data.teams : [];
        const teamIds = teams.map((t: any) => t.teamId);
        setFormData(prev => ({
          ...prev,
          competitionName: comp?.name || prev.competitionName,
          sport: comp?.category || prev.sport,
          teamIds: teamIds
        }));
        dispatch<any>(fetchCompetitions({ category: comp?.category || prev.sport || '', limit: 100, userId: uid }));
        setSyncing(false);
        return `Synced competition ${comp?.name || ''} with ${teams.length} teams successfully`;
      })(),
      {
        loading: "Syncing competition...",
        success: (msg) => msg as string,
        error: (e) => {
          setSyncing(false);
          return (e as any)?.message || "Sync failed";
        }
      }
    );
  };

  // Keep sport in sync if defaultSport changes while modal is open
  React.useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({ ...prev, sport: defaultSport || prev.sport || "" }));
    }
  }, [defaultSport, isOpen]);

  // Selected sport is stored in formData.sport
  // useEffect(() => {
  //   if (formData.sport) {
  //     dispatch<any>(fetchTeams({ category: formData.sport, userId: user?.userId || '' }));
  //   }
  // }, [formData.sport, dispatch]);

  // const teamOptions = useMemo(
  //   () => (teams || [])
  //     .filter((t: any) => t.category === formData.sport)
  //     .map((t: any) => ({ value: t.id, label: t.name })),
  //   [teams, formData.sport]
  // );

  // useEffect(() => {
  //   setTeamOptionsDynamic(teamOptions);
  // }, [teamOptions]);

  // Preload all teams when modal opens (then filter by selected sport)
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!isOpen) return;
      try {
        const resp = await getTeams({ category: formData?.sport || '', limit: 20, pageNo: 1, userId: user?.userId || '' });
        const data = resp?.teams || [];
        const filtered = data
          .filter((t: any) => !formData.sport || t.category === formData.sport)
          .map((t: any) => ({ value: t.id, label: t.name }));
        if (!cancelled) setTeamOptionsDynamic(filtered);
      } catch {
        // fallback to existing options
        // if (!cancelled) setTeamOptionsDynamic(teamOptions);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [formData.sport, user?.userId, isOpen]);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 300);
    return () => clearTimeout(id);
  }, [searchTerm]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const term = debouncedTerm;
      if (!term) return;
      const localHas = teamOptionsDynamic.some(o => String(o.label).toLowerCase().includes(term.toLowerCase()));
      if (localHas) return;
      try {
        const resp = await getTeams({ category: formData?.sport || '', search: term, limit: 20, pageNo: 1, userId: user?.userId || '' });
        const data = resp?.teams || [];
        const filtered = data
          .filter((t: any) => !formData.sport || t.category === formData.sport)
          .map((t: any) => ({ value: t.id, label: t.name }));
        if (!cancelled) setTeamOptionsDynamic(filtered);
      } catch {}
    };
    run();
    return () => { cancelled = true; };
  }, [debouncedTerm, formData.sport, user?.userId, teamOptionsDynamic]);

  const mergedOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of [...selectedOptions, ...teamOptionsDynamic]) map.set(String(o.value), String(o.label));
    const selectedSet = new Set(formData.teamIds.map(String));
    const selectedList: { value: string; label: string }[] = [];
    const restList: { value: string; label: string }[] = [];
    for (const [value, label] of map.entries()) {
      (selectedSet.has(value) ? selectedList : restList).push({ value, label });
    }
    return [...selectedList, ...restList];
  }, [selectedOptions, teamOptionsDynamic, formData.teamIds]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black opacity-90"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="relative w-[630px] bg-black border-2 border-[#373737] rounded-[50px] z-10">
        {/* Header */}
        <div className="relative px-8 py-8 border-b border-[#373737]">
          <h2 className="text-[28px] font-medium text-white text-center font-montserrat">
            Add competition
          </h2>
          <button
            onClick={handleClose}
            className="absolute right-8 top-8 text-white hover:text-gray-400 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <div className="px-16 py-8 space-y-8">
          {/* Sport Dropdown */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Sport
            </label>
            <div className="relative">
              <SportsDropdown
                mode="field"
                value={formData.sport}
                onChange={(val: string | string[]) => {
                  const v = Array.isArray(val) ? val[0] : val;
                  setFormData({ ...formData, sport: v || "" });
                }}
                multiple={false}
                placeholder="Sport selector"
              />
            </div>
          </div>

          {/* Competition Name */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Competition name
            </label>
            <input
              type="text"
              value={formData.competitionName}
              onChange={(e) =>
                setFormData({ ...formData, competitionName: e.target.value })
              }
              placeholder="Enter competition name"
              className="w-full h-[50px] px-4 bg-[#252525] border-none rounded-xl text-white text-base font-medium placeholder-[#707070] focus:outline-none focus:ring-2 focus:ring-[#00BBFF]"
            />
          </div>

          {/* Teams by selected sport */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Teams</label>
            <SearchableSelect
              placeholder="Select teams"
              options={mergedOptions}
              value={formData.teamIds}
              onChange={(value) => {
                const vals = Array.isArray(value) ? (value as string[]) : [value as string];
                setFormData(prev => ({ ...prev, teamIds: vals }));
                const idToLabel = new Map(mergedOptions.map(o => [String(o.value), String(o.label)]));
                const mergedSel = vals.map(id => ({ value: String(id), label: idToLabel.get(String(id)) || '' }));
                setSelectedOptions(mergedSel);
              }}
              onSearch={(term) => setSearchTerm(term)}
              className="w-full"
              multiple
              searchable
              triggerClassName="min-h-[32px] h-auto bg-[#252525] border-[#252525] text-white rounded-xl text-[14px] placeholder:text-[#707070] flex flex-wrap items-start gap-2 py-2"
            />
          </div>

          {/* IDs Row */}
          {/* <div>
            <div className="flex items-end gap-3">
              <div>
                <label htmlFor="competition-season-id" className="block text-white text-sm font-medium mb-2">
                  Season ID
                </label>
                <input
                  id="competition-season-id"
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  pattern="\\d{5}"
                  placeholder="Season ID (5 digits)"
                  onInput={(e) => {
                    const el = e.currentTarget;
                    let v = el.value.replace(/\D/g, '').slice(0, 5);
                    el.value = v;
                  }}
                  className="w-[180px] h-[42px] px-4 bg-[#252525] border-none rounded-xl text-white text-base font-medium placeholder-[#707070] focus:outline-none focus:ring-2 focus:ring-[#00BBFF]"
                />
              </div>
              <div>
                <label htmlFor="competition-discipline-id" className="block text-white text-sm font-medium mb-2">
                  Discipline ID
                </label>
                <input
                  id="competition-discipline-id"
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  pattern="\\d{1,5}"
                  placeholder="Discipline ID (max 5 digits)"
                  onInput={(e) => {
                    const el = e.currentTarget;
                    let v = el.value.replace(/\D/g, '').slice(0, 5);
                    // Enforce min 1 (no leading empties/zero)
                    if (v.length > 0 && Number(v) < 1) v = '1';
                    el.value = v;
                  }}
                  className="w-[180px] h-[42px] px-4 bg-[#252525] border-none rounded-xl text-white text-base font-medium placeholder-[#707070] focus:outline-none focus:ring-2 focus:ring-[#00BBFF]"
                />
              </div>
              <div className="pb-0">
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className={`w-[90px] h-[42px] border-[1.5px] border-white rounded-xl text-white text-base font-medium transition-colors ${syncing ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#252525]'}`}
                >
                  {syncing ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                      Sync
                    </span>
                  ) : (
                    "Sync"
                  )}
                </button>
              </div>
            </div>
          </div> */}
        </div>

        {/* Footer Buttons */}
        <div className="px-16 pb-12 pt-4 flex items-center justify-center gap-5">
          <Button
            onClick={handleClose}
            className="w-[160px] h-[42px] bg-[#1B1B1B] border-none text-white text-sm font-medium rounded-xl hover:bg-[#252525] transition-colors"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.sport || !formData.competitionName
              // || !formData.competitionId
            }
            className={`w-[160px] h-[42px] text-white text-sm font-medium rounded-xl transition-colors ${formData.sport && formData.competitionName
                //   && formData.competitionId
                ? "bg-gradient-to-r from-[#0BF] to-[#0051FF] hover:opacity-90"
                : "bg-[#373737] text-[#707070] cursor-not-allowed"
              }`}
          >
            Add competition
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddCompetitionModal;
