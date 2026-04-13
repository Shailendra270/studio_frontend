import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import SportsDropdown from "@/components/common/SportsDropdown";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useDispatch, useSelector } from "react-redux";
import { getTags, TagData } from "@/api/tagsApi";
import { selectUser } from "@/store/slices/authSlice";

interface EditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { sport: string; teamName: string; playerIds: string[]; players: { _id: string; name: string }[] }) => void;
  initialData: { sport: string; teamName: string; playerIds: string[]; players?: { _id: string; name: string }[] };
}

const EditTeamModal: React.FC<EditTeamModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [sport, setSport] = useState<string>(initialData?.sport || "football");
  const [teamName, setTeamName] = useState<string>(initialData?.teamName || "");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(initialData?.playerIds || []);

  const [playerTags, setPlayerTags] = useState<TagData[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<{ value: string; label: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedTerm, setDebouncedTerm] = useState<string>("");

  useEffect(() => {
    // Reset fields when initialData changes
    setSport(initialData?.sport || "football");
    setTeamName(initialData?.teamName || "");
    setSelectedPlayerIds(initialData?.playerIds || []);
  }, [initialData]);

  // Fetch player tags for the selected sport in local state
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!sport) return;
      try {
        const resp = await getTags({ category: sport, tagType: "player", userId: user?.userId || '' });
        if (!cancelled && resp.success) {
          setPlayerTags(resp.data || []);
        }
      } catch {
        if (!cancelled) setPlayerTags([]);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [sport]);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 300);
    return () => clearTimeout(id);
  }, [searchTerm]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const term = debouncedTerm;
      if (!term) return;
      const localHas = playerTags.some(t => (t.metaData?.playerName || t.name || "").toLowerCase().includes(term.toLowerCase()));
      if (localHas) return;
      try {
        const resp = await getTags({ category: sport, tagType: "player", userId: user?.userId || '', limit: 20, pageNo: 1, search: term });
        if (!cancelled && resp.success) {
          setPlayerTags(resp.data || []);
        }
      } catch {}
    };
    run();
    return () => { cancelled = true; };
  }, [debouncedTerm, sport, playerTags, user?.userId]);

  const playerOptions = useMemo(() => {
    const backendPlayerTagsForSport = playerTags.filter((t: TagData) => t.category === sport);
    const baseOpts = backendPlayerTagsForSport.map((tag: TagData) => ({ value: String(tag._id), label: String(tag.metaData?.playerName || tag.name) }));
    const initialPlayers = Array.isArray(initialData?.players) ? initialData.players : [];
    const initialOpts = initialPlayers.map(p => ({ value: String(p._id), label: String(p.name) }));
    const map = new Map<string, string>();
    for (const o of [...selectedOptions, ...initialOpts, ...baseOpts]) map.set(String(o.value), String(o.label));
    const selectedSet = new Set(selectedPlayerIds.map(String));
    const selectedList: { value: string; label: string }[] = [];
    const restList: { value: string; label: string }[] = [];
    for (const [value, label] of map.entries()) {
      (selectedSet.has(value) ? selectedList : restList).push({ value, label });
    }
    return [...selectedList, ...restList];
  }, [playerTags, sport, initialData?.players, selectedOptions, selectedPlayerIds]);

  const handleSubmit = () => {
    if (!teamName.trim()) return;
    if (!sport) return;
    const idToLabel = new Map(playerOptions.map(o => [String(o.value), String(o.label)]));
    const players = selectedPlayerIds.map(id => ({ _id: id, name: idToLabel.get(id) || '' }));
    onSubmit({ sport, teamName: teamName.trim(), playerIds: selectedPlayerIds, players });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-90"></div>
      <div className="relative w-[630px] bg-black border-2 border-[#373737] rounded-[50px] z-10">
        {/* Header */}
        <div className="relative px-8 py-8 border-b border-[#373737]">
          <h2 className="text-[28px] font-medium text-white text-center font-montserrat">Edit team</h2>
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

          {/* Team Name */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">Team name</label>
            <Input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name"
              className="w-full h-[50px] px-4 bg-[#252525] border-none rounded-xl text-white text-base font-medium placeholder-[#707070] focus:outline-none focus:ring-2 focus:ring-[#00BBFF]"
            />
          </div>

          {/* Players */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Players</label>
            <SearchableSelect
              placeholder="Select players"
              options={playerOptions}
              value={selectedPlayerIds}
              onChange={(value) => {
                const ids = Array.isArray(value) ? (value as string[]) : [String(value as string)];
                setSelectedPlayerIds(ids.map(String));
                const idToLabel = new Map(playerOptions.map(o => [String(o.value), String(o.label)]));
                const merged = ids.map(id => ({ value: String(id), label: idToLabel.get(String(id)) || '' }));
                setSelectedOptions(merged);
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
            disabled={!sport || !teamName.trim()}
            className={`w-[160px] h-[42px] text-white text-sm font-medium rounded-xl transition-colors ${
              sport && teamName.trim()
                ? "bg-gradient-to-r from-[#0BF] to-[#0051FF] hover:opacity-90"
                : "bg-[#373737] text-[#707070] cursor-not-allowed"
            }`}
          >
            Update team
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditTeamModal;
