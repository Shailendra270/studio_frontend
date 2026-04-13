import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SportsDropdown from "@/components/common/SportsDropdown";
import { useDispatch, useSelector } from "react-redux";
import { selectTagsLoading } from "@/store/slices/tagsSlice";
import { sportOptions } from "@/constants/AddVideo";
import { toast } from "sonner";
import { selectUser } from "@/store/slices/authSlice";
import AddTeamModal from "@/components/modals/SettingPageModals/AddTeamModal";
import EditTeamModal from "@/components/modals/SettingPageModals/EditTeamModal";
import { TeamData, createTeam, fetchTeams, selectTeams, selectTeamsLoading, deleteTeam, selectTeamsTotalCount, updateTeam } from "@/store/slices/teamsSlice";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { truncateText } from "@/utils/text";
import { importPlayersFromDSG } from "@/api/tagsApi";
import { usePermissions } from "@/hooks/usePermissions";

const TeamsTab: React.FC = () => {
  // Initialize to first sport option (remove 'all')
  const validTagCategories = ["cricket", "football", "basketball", "tennis", "hockey", "other"] as const;
  const initialSport = (sportOptions.find(opt => validTagCategories.includes(opt.value as any))?.value) || "football";
  const [selectedSport, setSelectedSport] = useState(initialSport);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamData | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const dispatch = useDispatch();
  const teams = useSelector(selectTeams);
  const teamsLoading = useSelector(selectTeamsLoading);
  const loading = useSelector(selectTagsLoading);
  const teamsTotalCount = useSelector(selectTeamsTotalCount);
  const user = useSelector(selectUser);
  const { canCreate, canEdit, canDelete } = usePermissions();

  // Fetch teams when sport or search changes
  
  useEffect(() => {
    const id = setTimeout(() => setSearchQuery(searchInput.trim()), 750);
    return () => clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    if (!selectedSport) return;
    (dispatch as any)(fetchTeams({ category: selectedSport, search: searchQuery, pageNo: currentPage, limit: PAGE_SIZE, userId: user?.userId || '' }));
  }, [selectedSport, searchQuery, currentPage, dispatch, user?.userId]);

  // Convert backend tags to table rows
  const backendRows = useMemo(() => {
    const teamsForSport = teams.filter((t: TeamData) => t.category === selectedSport);
    return teamsForSport.map((team: TeamData) => ({
      id: team._id,
      name: team.name,
      sport: selectedSport as "basketball" | "football",
      createdDate: team.createdAt ? new Date(team.createdAt).toLocaleDateString() : "",
      teams: team.playerIds?.length || 0,
      status: "active" as const,
      team_id: team.team_id || '',
      isDatafeed: team.isDatafeed || false,
      country: team.country || '',
      seasonId: team.seasonId || '',
    }));
  }, [teams, selectedSport]);

  const combinedRows = backendRows;

  const searchedRows = useMemo(() => {
    if (!searchQuery) return combinedRows;
    const q = searchQuery.toLowerCase();
    return combinedRows.filter((row: any) => {
      return (
        row.name.toLowerCase().includes(q) ||
        String(row.team_id || '').toLowerCase().includes(q) ||
        String(row.seasonId || '').toLowerCase().includes(q)
      );
    });
  }, [combinedRows, searchQuery]);

  const totalPages = Math.max(1, Math.ceil((teamsTotalCount || combinedRows.length) / PAGE_SIZE));
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSport, searchQuery]);

  const paginatedRows = useMemo(() => {
    return searchedRows;
  }, [searchedRows]);

  // Simple menu state to show delete action for a row
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const toggleMenu = (rowId: string) => {
    setMenuOpenId(prev => (prev === rowId ? null : rowId));
  };

  const handleDelete = async (rowId: string) => {
    try {
      await (dispatch as any)(deleteTeam({ _id: rowId })).unwrap();
      toast.success("Team deleted successfully!");
      setMenuOpenId(null);
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete team");
    }
  };
  const handleSync = async (Id: string) => {
    try {
      const team = teams.find((t: TeamData) => t?.team_id === Id);
      if (!team) {
        toast.error("Team not found");
        return;
      }
      const teamIdToSend = String(team.team_id || team.id || "");
      if (!teamIdToSend) {
        toast.error("Missing team identifier");
        return;
      }
      const p = importPlayersFromDSG({ teamId: teamIdToSend, seasonId: team?.seasonId, category: selectedSport, userId: user?.userId || '' });
      toast.promise(p, {
        loading: "Syncing squad and players…",
        success: (r) => r?.message || "Players synced",
        error: (e) => e?.message || "Failed to sync players",
      });
      await p;
      (dispatch as any)(fetchTeams({ category: selectedSport, search: searchQuery, pageNo: currentPage, limit: PAGE_SIZE, userId: user?.userId || '' }));
      setMenuOpenId(null);
    } catch (e: any) {}
  };
  const handleEdit = (rowId: string) => {
    const team = teams.find((t: TeamData) => t._id === rowId);
    if (team) {
      setEditingTeam(team);
      setIsEditOpen(true);
    }
  };
  const handleAddTeam = () => {
    setIsModalOpen(true);
  };

  const handleTeamSubmit = async (data: { sport: string; teamName: string; playerIds: string[]; players: { _id: string; name: string }[] }) => {
    try {
      const payload = {
        name: data.teamName,
        playerIds: data.playerIds,
        players: data.players,
        category: data.sport,
        userId: user?.userId || "",
      };
      const res = await (dispatch as any)(createTeam(payload)).unwrap();
      toast.success(res?.message || "Team created successfully");
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error?.message || "Failed to create team");
    }
  };

  const handleTeamUpdate = async (data: { sport: string; teamName: string; playerIds: string[]; players: { _id: string; name: string }[] }) => {
    if (!editingTeam) return;
    try {
      const payload = {
        _id: editingTeam._id,
        name: data.teamName,
        playerIds: data.playerIds,
        players: data.players,
        category: data.sport,
        userId: user?.userId || "",
      };
      const res = await (dispatch as any)(updateTeam(payload)).unwrap();
      toast.success(res?.message || "Team updated successfully");
      setIsEditOpen(false);
      setEditingTeam(null);
      setMenuOpenId(null);
    } catch (error: any) {
      toast.error(error?.message || "Failed to update team");
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
              placeholder="Search teams..."
              className="h-[48px] bg-[#1B1B1B] text-white placeholder-[#707070]"
            />
          </div>
          {canCreate('Teams') && (
            <Button
              onClick={handleAddTeam}
              className="w-[200px] h-[48px] bg-[#1B1B1B] border-2 border-[#0BF] text-white text-base font-semibold rounded-[15px] hover:bg-[#252525] transition-colors"
            >
              Add team
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#252525] rounded-xl overflow-visible">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[#373737] text-white text-sm font-medium">
          <div className="col-span-3">Name</div>
          <div className="col-span-2 text-center">Created / modified</div>
          <div className="col-span-2 text-center">Country</div>
          <div className="col-span-2 text-center">Team ID</div>
          <div className="col-span-2 text-center">No. of Players</div>
          <div className="col-span-1"></div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-[#373737]">
          {paginatedRows.map((team, index) => (
            <div
              key={`${team.id}-${index}`}
              className="grid grid-cols-12 gap-4 px-6 py-4 text-white text-sm font-medium hover:bg-[#2A2A2A] transition-colors"
            >
              {/* Name with Icon */}
              <div className="col-span-3 flex items-center gap-3">
                {/* {getSportIcon(team.sport)} */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="truncate max-w-[180px]">{truncateText(team.name, 25)}</span>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start">
                    <p>{team.name}</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Created Date */}
              <div className="col-span-2 text-center">
                {team.createdDate}
              </div>

               {/* Country */}
              <div className="col-span-2 text-center">
                {team?.country || '-'}  
              </div>

              {/* Team ID */}
              <div className="col-span-2 text-center">
                {team?.team_id || '-'}  
              </div>

              {/* Status */}
              <div className="col-span-2 text-center">
                {team?.teams || '-'}  
              </div>

              {/* Status Indicator */}
              {/* <div className="col-span-2 flex justify-center"> */}
                {/* <div
                  className={`w-[10px] h-[10px] rounded-sm ${
                    team.status === "active" ? "bg-[#2EE500]" : "bg-[#E50000]"  
                  }`}
                ></div> */}
              {/* </div> */}

              {/* Menu Button */}
              {(canEdit('Teams') || canDelete('Teams')) && (
                <div className="col-span-1 flex justify-center relative">
                  <button
                    onClick={() => toggleMenu(team.id)}
                    className="w-[30px] h-[24px] bg-black rounded-md flex items-center justify-center hover:bg-[#373737] transition-colors"
                  >
                    <svg width="30" height="24" viewBox="0 0 30 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="8" cy="12" r="2" fill="white" />
                      <circle cx="15" cy="12" r="2" fill="white" />
                      <circle cx="22" cy="12" r="2" fill="white" />
                    </svg>
                  </button>
                  {menuOpenId === team.id && (
                    <div className="absolute right-10 bg-[#1B1B1B] border border-[#373737] rounded-md shadow-lg z-50">
                      {team?.isDatafeed && canEdit('Teams') && (
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#252525]"
                          onClick={() => handleSync(team?.team_id)}
                        >
                          Sync
                        </button>
                      )}
                      {canEdit('Teams') && (
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#252525]"
                          onClick={() => handleEdit(team.id)}
                        >
                          Edit
                        </button>
                      )}
                      {canDelete('Teams') && (
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#252525]"
                          onClick={() => handleDelete(team.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {(teamsTotalCount === 0) && (
        <div className="bg-[#252525] rounded-xl p-12 text-center">
          <p className="text-gray-400 text-lg">No teams found for the selected sport.</p>
        </div>
      )}

      {/* Pagination */}
      {teamsTotalCount > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-white text-sm px-2">
            Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, teamsTotalCount)}-
            {Math.min(currentPage * PAGE_SIZE, teamsTotalCount)} of {teamsTotalCount}
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

      {/* Edit Team Modal */}
      {isEditOpen && editingTeam && (
        <EditTeamModal
          isOpen={isEditOpen}
          onClose={() => { setIsEditOpen(false); setEditingTeam(null); }}
          onSubmit={handleTeamUpdate}
          initialData={{
            sport: editingTeam.category,
            teamName: editingTeam.name,
            playerIds: editingTeam.playerIds || [],
            players: Array.isArray(editingTeam.players) ? editingTeam.players as any : [],
          }}
        />
      )}

      {/* Add Team Modal */}
      <AddTeamModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleTeamSubmit}
        defaultSport={selectedSport}
      />
    </div>
  );
};

export default TeamsTab;
