import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import SportsDropdown from "@/components/common/SportsDropdown";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useDispatch, useSelector } from "react-redux";
import { fetchTeams, selectTeams } from "@/store/slices/teamsSlice";
import { getTeams } from "@/api/teamsApi";

interface EditCompetitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { sport: string; competitionName: string; teamIds: string[]; teams?: { teamId: string; name: string }[] }) => void;
  initialData: { sport: string; competitionName: string; teamIds: string[]; teams?: { _id: string; teamId: string; name: string }[] };
}

const EditCompetitionModal: React.FC<EditCompetitionModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const dispatch = useDispatch();
  const [sport, setSport] = useState<string>(initialData?.sport || "football");
  const [competitionName, setCompetitionName] = useState<string>(initialData?.competitionName || "");
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>(initialData?.teamIds || []);
  const [teamOptionsDynamic, setTeamOptionsDynamic] = useState<{ value: string; label: string }[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<{ value: string; label: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedTerm, setDebouncedTerm] = useState<string>("");
  const teams = useSelector(selectTeams);
  const user = useSelector((state: any) => state.auth.user);

  useEffect(() => {
    setSport(initialData?.sport || "football");
    setCompetitionName(initialData?.competitionName || "");
    setSelectedTeamIds(initialData?.teamIds || []);
  }, [initialData]);

  // useEffect(() => {
  //   if (sport) {
  //     dispatch<any>(fetchTeams({ category: sport, limit: 100, userId: user?.userId || '' }));
  //   }
  // }, [sport, dispatch]);

  // const teamOptions = useMemo(
  //   () => (teams || [])
  //     .filter((t: any) => t.category === sport)
  //     .map((t: any) => ({ value: t.id, label: t.name })),
  //   [teams, sport]
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
        const resp = await getTeams({ category: sport || '', limit: 20, pageNo: 1, userId: user?.userId || '' });
        const data = resp?.teams || [];
        const filtered = data
          .filter((t: any) => !sport || t.category === sport)
          .map((t: any) => ({ value: t.id, label: t.name }));
        const initialOpts = Array.isArray(initialData?.teams) ? initialData.teams.map(t => ({ value: t.teamId, label: t.name })) : [];
        if (!cancelled) setTeamOptionsDynamic([...initialOpts, ...filtered]);
        if (!cancelled && initialOpts.length) {
          const ids = initialOpts.map(o => String(o.value));
          setSelectedOptions(initialOpts);
          setSelectedTeamIds(prev => prev.length ? prev : ids);
        }
      } catch {
        // if (!cancelled) setTeamOptionsDynamic(teamOptions);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [isOpen, sport, user?.userId]);

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
        const resp = await getTeams({ category: sport || '', search: term, limit: 20, pageNo: 1, userId: user?.userId || '' });
        const data = resp?.teams || [];
        const filtered = data
          .filter((t: any) => !sport || t.category === sport)
          .map((t: any) => ({ value: t.id, label: t.name }));
        if (!cancelled) setTeamOptionsDynamic(filtered);
      } catch {}
    };
    run();
    return () => { cancelled = true; };
  }, [debouncedTerm, sport, user?.userId, teamOptionsDynamic]);

  const mergedOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of [...selectedOptions, ...teamOptionsDynamic]) map.set(String(o.value), String(o.label));
    const selectedSet = new Set(selectedTeamIds.map(String));
    const selectedList: { value: string; label: string }[] = [];
    const restList: { value: string; label: string }[] = [];
    for (const [value, label] of map.entries()) {
      (selectedSet.has(value) ? selectedList : restList).push({ value, label });
    }
    return [...selectedList, ...restList];
  }, [selectedOptions, teamOptionsDynamic, selectedTeamIds]);
  const handleSubmit = () => {
    if (!competitionName.trim()) return;
    if (!sport) return;
    const idToLabel = new Map(mergedOptions.map(o => [String(o.value), String(o.label)]));
    const teams = (selectedTeamIds || []).map(id => ({ teamId: String(id), name: idToLabel.get(String(id)) || '' }));
    onSubmit({ sport, competitionName: competitionName.trim(), teamIds: selectedTeamIds, teams });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-90"></div>
      <div className="relative w-[630px] bg-black border-2 border-[#373737] rounded-[50px] z-10">
        {/* Header */}
        <div className="relative px-8 py-8 border-b border-[#373737]">
          <h2 className="text-[28px] font-medium text-white text-center font-montserrat">Edit competition</h2>
          <button onClick={onClose} className="absolute right-8 top-8 text-white hover:text-gray-400 transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.000147593 13.9131L13.9131 0.000630463L16 2.0875L2.08709 16L0.000147593 13.9131Z" fill="white"/>
              <path d="M15.9999 13.9125L2.08694 0L0 2.08687L13.9129 15.9994L15.9999 13.9125Z" fill="white"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-16 py-8 space-y-8">
          {/* Sport */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Sport</label>
            <SportsDropdown
              mode="field"
              value={sport}
              onChange={(val: string | string[]) => {
                const v = Array.isArray(val) ? val[0] : val;
                if (v) setSport(v);
              }}
              multiple={false}
              placeholder="Select sport"
            />
          </div>

          {/* Competition Name */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">Competition name</label>
            <input
              value={competitionName}
              onChange={(e) => setCompetitionName(e.target.value)}
              placeholder="Enter competition name"
              className="w-full h-[50px] px-4 bg-[#252525] border-none rounded-xl text-white text-base font-medium placeholder-[#707070] focus:outline-none focus:ring-2 focus:ring-[#00BBFF]"
            />
          </div>

          {/* Teams */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Teams</label>
            <SearchableSelect
              placeholder="Select teams"
              options={mergedOptions}
              value={selectedTeamIds}
              onChange={(value) => {
                const vals = Array.isArray(value) ? (value as string[]) : [value as string];
                setSelectedTeamIds(vals.map(String));
                const idToLabel = new Map(mergedOptions.map(o => [String(o.value), String(o.label)]));
                const mergedSel = vals.map(id => ({ value: String(id), label: idToLabel.get(String(id)) || '' }));
                setSelectedOptions(mergedSel);
              }}
              onSearch={(term) => setSearchTerm(term)}
              className="w-full"
              multiple
              searchable
              triggerClassName="min-h-[48px] bg-[#252525] border-[#252525] text-white rounded-xl text-[14px] placeholder:text-[#707070]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-16 pb-12 pt-4 flex items-center justify-center gap-5">
          <Button onClick={onClose} className="w-[160px] h-[42px] bg-[#1B1B1B] border-none text-white text-sm font-medium rounded-xl hover:bg-[#252525] transition-colors">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!sport || !competitionName.trim()}
            className={`w-[160px] h-[42px] text-white text-sm font-medium rounded-xl transition-colors ${
              sport && competitionName.trim()
                ? "bg-gradient-to-r from-[#0BF] to-[#0051FF] hover:opacity-90"
                : "bg-[#373737] text-[#707070] cursor-not-allowed"
            }`}
          >
            Update competition
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditCompetitionModal;
