import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SportsDropdown from "@/components/common/SportsDropdown";
import { useDispatch, useSelector } from "react-redux";
import { selectTagsLoading, TagData, createNewTag, deleteExistingTag } from "@/store/slices/tagsSlice";
import { getTags } from "@/api/tagsApi";
import { sportOptions } from "@/constants/AddVideo";
import AddPlayerModal from "@/components/modals/SettingPageModals/AddPlayerModal";
import { toast } from "sonner";
import { selectUser } from "@/store/slices/authSlice";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { truncateText } from "@/utils/text";


const PlayersTab: React.FC = () => {
  // Initialize to first sport option (remove 'all')
  const validTagCategories = ["cricket", "football", "basketball", "tennis", "hockey", "other"] as const;
  const initialSport = (sportOptions.find(opt => validTagCategories.includes(opt.value as any))?.value) || "football";
  const [selectedSport, setSelectedSport] = useState(initialSport);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const dispatch = useDispatch();
  const [playerTags, setPlayerTags] = useState<TagData[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const loading = useSelector(selectTagsLoading);
  const user = useSelector(selectUser);

  // Fetch player tags when sport or page changes
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!selectedSport) return;
      try {
        const resp = await getTags({ category: selectedSport, tagType: "player", userId: user?.userId || '', limit: PAGE_SIZE, pageNo: currentPage, search: searchQuery || "" });
        if (!cancelled && resp.success) {
          setPlayerTags(resp.data || []);
          setTotalCount(Number(resp.total || resp.count || (resp.data?.length ?? 0)));
        }
      } catch {
        if (!cancelled) setPlayerTags([]);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [selectedSport, currentPage, searchQuery]);

  // Convert backend tags to table rows
  const backendRows = useMemo(() => {
    const backendPlayerTagsForSport = playerTags.filter((t: TagData) => t.category === selectedSport);
    return backendPlayerTagsForSport.map((tag: TagData) => ({
      id: tag._id,
      name: tag.metaData?.playerName || tag.name,
      sport: selectedSport as "basketball" | "football",
      createdDate: new Date(tag.createdAt).toLocaleDateString(),
      teams: 0,
      status: "active" as const,
    }));
  }, [playerTags, selectedSport]);

  const combinedRows = backendRows;

  const searchedRows = useMemo(() => {
    if (!searchQuery) return combinedRows;
    return combinedRows.filter((row: any) => row.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [combinedRows, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSport, searchQuery]);

  // Debounce search input
  useEffect(() => {
    const id = setTimeout(() => setSearchQuery(searchInput.trim()), 800);
    return () => clearTimeout(id);
  }, [searchInput]);

  const paginatedRows = useMemo(() => {
    // Backend already paginates; apply client-side search filter on current page
    return searchedRows;
  }, [searchedRows]);

  const getSportIcon = (sport: string) => {
    if (sport === "basketball") {
      return (
        <img
          src="https://api.builder.io/api/v1/image/assets/TEMP/b8883410be8836385237162bb9fbac29b2fc2351?width=34"
          alt="basketball"
          className="w-[17px] h-[17px]"
        />
      );
    }
  }

  // Simple menu state to show delete action for a row
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const toggleMenu = (rowId: string) => {
    setMenuOpenId(prev => (prev === rowId ? null : rowId));
  };
  const handleDelete = async (rowId: string) => {
    try {
      await (dispatch as any)(deleteExistingTag(rowId)).unwrap();
      toast.success("Player deleted successfully!");
      setMenuOpenId(null);
      setPlayerTags(prev => prev.filter(t => t._id !== rowId));
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete player");
    }
  };
  const handleAddPlayer = () => {
    setIsModalOpen(true);
  };
  const handleModalSubmit = async (data: { sport: string; playerName: string }) => {
    try {
      // Duplicate check against backend rows for the current sport (case-insensitive)
      const exists = playerTags
        .filter((t: TagData) => t.category === data.sport)
        .some((t: TagData) => (t.metaData?.playerName || t.name || "").trim().toLowerCase() === data.playerName.trim().toLowerCase());
      if (exists) {
        toast.error("Player with this name already exists!");
        // Keep modal open; let user change name
        return;
      }
      const payload: any = {
        category: data.sport,
        name: data.playerName.trim(),
        tagType: "player",
        metaData: {
          playerName: data.playerName.trim(),
        },
      };
      if (user?.userId) {
        payload.userId = user.userId;
      }
      try {
        const res = await (dispatch as any)(createNewTag(payload)).unwrap();
        console.log(res);
        if (res?.success) {
          toast.success(res?.message || "Player created successfully");
        } else {
          toast.error("Failed to create player");
        }
      } catch (error) {
        toast.error(error?.message || "Failed to create player");
      }
      // Refresh local list
      try {
        const resp = await getTags({ category: selectedSport, tagType: "player", userId: user?.userId || '', limit: PAGE_SIZE, pageNo: currentPage, search: searchQuery });
        if (resp.success) setPlayerTags(resp.data || []);
      } catch (error: any) {
        toast.error(error?.message || "Failed to fetch player");
      }
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error?.message || "Failed to create player");
    }
  };
  return (
    <div className="w-full">
      {/* Header Section with Filter and Add Button */}
      <div className="flex items-center justify-between mb-8">
        {/* Sport Filter Dropdown */}
        <div className="relative w-[400px]">
          <SportsDropdown
            mode="field"
            value={selectedSport}
            onChange={(val: string | string[]) => {
              const v = Array.isArray(val) ? val[0] : val;
              if (v) setSelectedSport(v);
            }}
            multiple={false}
            placeholder="Sport selector"
          />
        </div>
        {/* Search and Add Player */}
        <div className="flex items-center gap-4">
          <div className="w-[300px]">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search players..."
              className="h-[48px] bg-[#1B1B1B] text-white placeholder-[#707070]"
            />
          </div>
          <Button
            onClick={handleAddPlayer}
            className="w-[200px] h-[48px] bg-[#1B1B1B] border-2 border-[#0BF] text-white text-base font-semibold rounded-[15px] hover:bg-[#252525] transition-colors"
          >
            Add player
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#252525] rounded-xl overflow-visible">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[#373737] text-white text-sm font-medium">
          <div className="col-span-4">Name</div>
          <div className="col-span-3 text-center">Created / modified</div>
          {/* <div className="col-span-2 text-center">Teams</div> */}
          {/* <div className="col-span-2 text-center">Competition ID</div> */}
          <div className="col-span-1"></div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-[#373737]">
          {paginatedRows.map((player, index) => (
            <div
              key={`${player.id}-${index}`}
              className="grid grid-cols-12 gap-4 px-6 py-4 text-white text-sm font-medium hover:bg-[#2A2A2A] transition-colors"
            >
              {/* Name with Icon */}
              <div className="col-span-4 flex items-center gap-3">
                {getSportIcon(player.sport)}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="truncate max-w-[180px]">{truncateText(player.name, 25)}</span>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start">
                    <p>{player.name}</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Created Date */}
              <div className="col-span-3 text-center">
                {player.createdDate}
              </div>

              {/* Teams Count */}
              <div className="col-span-2 text-center">
                {/* {player.teams} */}
              </div>

              {/* Status Indicator */}
              <div className="col-span-2 flex justify-center">
                {/* <div
                  className={`w-[10px] h-[10px] rounded-sm ${
                    player.status === "active" ? "bg-[#2EE500]" : "bg-[#E50000]"
                  }`}
                ></div> */}
              </div>

              {/* Menu Button */}
              <div className="col-span-1 flex justify-center relative">
                <button
                  onClick={() => toggleMenu(player.id)}
                  className="w-[30px] h-[24px] bg-black rounded-md flex items-center justify-center hover:bg-[#373737] transition-colors"
                >
                  <svg width="30" height="24" viewBox="0 0 30 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="12" r="2" fill="white" />
                    <circle cx="15" cy="12" r="2" fill="white" />
                    <circle cx="22" cy="12" r="2" fill="white" />
                  </svg>
                </button>
                {menuOpenId === player.id && (
                  <div className="absolute right-10 bg-[#1B1B1B] border border-[#373737] rounded-md shadow-lg z-50">
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#252525]"
                      onClick={() => handleDelete(player.id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {searchedRows.length === 0 && (
        <div className="bg-[#252525] rounded-xl p-12 text-center">
          <p className="text-gray-400 text-lg">No players found for the selected sport.</p>
        </div>
      )}

      {/* Pagination */}
      {searchedRows.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-white text-sm px-2">
            Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, totalCount)}-
            {Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount}
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`h-[36px] px-4 text-white text-sm rounded-md ${currentPage === 1 ? "bg-[#373737]" : "bg-[#1B1B1B]"}`}
            >
              Prev
            </Button>
            <span className="text-white text-sm">Page {currentPage} of {totalPages}</span>
            <Button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`h-[36px] px-4 text-white text-sm rounded-md ${currentPage === totalPages ? "bg-[#373737]" : "bg-[#1B1B1B]"}`}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add Player Modal */}
      <AddPlayerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        defaultSport={selectedSport}
      />
    </div>
  );
};

export default PlayersTab;
