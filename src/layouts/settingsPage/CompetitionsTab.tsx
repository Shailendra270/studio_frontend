import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import SportsDropdown from "@/components/common/SportsDropdown";
import { sportOptions } from "@/constants/AddVideo";
import AddCompetitionModal from "@/components/modals/SettingPageModals/AddCompetitionModal";
import EditCompetitionModal from "@/components/modals/SettingPageModals/EditCompetitionModal";
import { useAppDispatch, useAppSelector } from "@/store";
import { selectUser } from "@/store/slices/authSlice";
import { CompetitionDataType, createCompetition, deleteCompetition, fetchCompetitions, selectCompetitions, selectCompetitionsLoading, selectCompetitionsTotalCount, updateCompetition } from "@/store/slices/competitionsSlice";
import { selectTeams } from "@/store/slices/teamsSlice";
import { toast } from "sonner";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { truncateText } from "@/utils/text";
import { Input } from "@/components/ui/input";
import { usePermissions } from "@/hooks/usePermissions";

// Using competitions from Redux slice

const CompetitionsTab: React.FC = () => {
  // Initialize to first sport option (exclude 'all') like other tabs
  const validTagCategories = ["cricket", "football", "basketball", "tennis", "hockey", "other"] as const;
  const initialSport = (sportOptions.find(opt => validTagCategories.includes(opt.value as any))?.value) || "football";
  const [selectedSport, setSelectedSport] = useState(initialSport);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCompetition, setEditingCompetition] = useState<CompetitionDataType | null>(null);
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const competitions = useAppSelector(selectCompetitions);
  const isLoading = useAppSelector(selectCompetitionsLoading);
  const teamsList = useAppSelector(selectTeams);
  const totalCount = useAppSelector(selectCompetitionsTotalCount);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const { canCreate, canEdit, canDelete } = usePermissions();

  useEffect(() => {
    if (!selectedSport) return;
    const category = selectedSport === 'all' ? '' : selectedSport;
    dispatch(fetchCompetitions({ category, limit: PAGE_SIZE, pageNo: currentPage, userId: user?.userId || '', search: searchQuery }));
  }, [selectedSport, dispatch, searchQuery, user?.userId, currentPage]);

  useEffect(() => {
    const id = setTimeout(() => setSearchQuery(searchInput.trim()), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSport, searchQuery]);

  const filteredCompetitions = useMemo(() => {
    if (selectedSport === 'all') return competitions;
    return (competitions || []).filter((c: any) => c.category === selectedSport && c.name?.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [competitions, selectedSport, searchQuery]);

  const getSportIcon = (sport: "basketball" | "football") => {
    if (sport === "basketball") {
      return (
        <img
          src="https://api.builder.io/api/v1/image/assets/TEMP/b8883410be8836385237162bb9fbac29b2fc2351?width=34"
          alt="basketball"
          className="w-[17px] h-[17px]"
        />
      );
    }
    return (
      <img
        src="https://api.builder.io/api/v1/image/assets/TEMP/0d1dbf0007e718285d221360f27ba510bc63823f?width=34"
        alt="football"
        className="w-[17px] h-[17px]"
      />
    );
  };

  const handleAddCompetition = () => {
    setIsModalOpen(true);
  };

  const handleModalSubmit = (data: { sport: string; competitionName: string; teamIds: string[]; teams?: { teamId: string; name: string }[] }) => {
    const userId = user?.userId || '';
    const teamsArr = Array.isArray(data.teams) && data.teams.length
      ? data.teams.map(t => {
          const found = (teamsList || []).find((tm: any) => tm.id === t.teamId);
          return found ? { _id: found._id, teamId: t.teamId, name: t.name || found.name } : { teamId: t.teamId, name: t.name };
        })
      : (data.teamIds || []).map(shortId => {
          const t = (teamsList || []).find((tm: any) => tm.id === shortId);
          return t ? { _id: t._id, teamId: t.id, name: t.name } : null;
        }).filter(Boolean) as any[];
    dispatch(createCompetition({ name: data.competitionName, category: data.sport, teams: teamsArr, userId }))
      .unwrap()
      .then(() => {
        toast.success('Competition added successfully', { description: `${data.competitionName} has been added.` });
        setIsModalOpen(false);
      })
      .catch((err: any) => {
        toast.error('Failed to add competition', { description: err?.message || 'Unknown error' });
      });
  };

  const toggleMenu = (id: string) => {
    setMenuOpenId(prev => (prev === id ? null : id));
  };

  const handleEdit = (id: string) => {
    const comp = (competitions || []).find((c: any) => c._id === id);
    if (!comp) return;
    setEditingCompetition(comp);
    setIsEditOpen(true);
    setMenuOpenId(null);
  };

  const handleDelete = (id: string) => {
    dispatch(deleteCompetition({ _id: id }))
      .unwrap()
      .then(() => toast.success('Competition deleted'))
      .catch((err: any) => toast.error('Failed to delete competition', { description: err?.message || 'Unknown error' }));
    setMenuOpenId(null);
  };

  return (
    <div className="w-full">
      {/* Header Section with Filter and Add Button */}
      <div className="flex items-center justify-between mb-8">
        {/* Sport Filter Dropdown */}
        <div className="relative w-[400px]">
          <SportsDropdown
            mode="field"
            // icon={<SportsDropdownIcon />}
            value={selectedSport}
            onChange={(val: string | string[]) => {
              const v = Array.isArray(val) ? val[0] : val;
              if (v) setSelectedSport(v);
            }}
            multiple={false}
            placeholder="Sport selector"
          />
        </div>
        {/* Add Competition Button */}
        <div className="flex items-center gap-4">
        <div className="w-[300px]">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search Competition..."
            className="h-[48px] bg-[#1B1B1B] text-white placeholder-[#707070]"
          />
          </div>
        {canCreate('Competitions') && (
          <Button
            onClick={handleAddCompetition}
            className="w-[200px] h-[48px] bg-[#1B1B1B] border-2 border-[#0BF] text-white text-base font-semibold rounded-[15px] hover:bg-[#252525] transition-colors"
          >
            Add competition
          </Button>
        )}
      </div>
    </div>

      {/* Table */ }
  <div className="bg-[#252525] rounded-xl overflow-visible">
    {/* Table Header */}
    <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[#373737] text-white text-sm font-medium">
      <div className="col-span-3">Name</div>
      <div className="col-span-2 text-center">Created / modified</div>
      <div className="col-span-2 text-center">Teams</div>
      <div className="col-span-2 text-center">Competition logo</div>
      <div className="col-span-2 text-center">Season ID</div>
      <div className="col-span-1"></div>
    </div>

    {/* Table Body */}
    <div className="divide-y divide-[#373737]">
      {filteredCompetitions.map((competition: any, index: number) => {
        const hasLogo = competition?.logo !== "";
        return (
          <div
            key={`${competition._id}-${index}`}
            className="grid grid-cols-12 gap-4 px-6 py-4 text-white text-sm font-medium hover:bg-[#2A2A2A] transition-colors"
          >
            {/* Name with Icon */}
            <div className="col-span-3 flex items-center gap-3">
              {getSportIcon(competition.category as "basketball" | "football")}
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="truncate max-w-[180px]">{truncateText(competition.name, 25)}</span>
                </TooltipTrigger>
                <TooltipContent side="top" align="start">
                  <p>{competition.name}</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Created Date */}
            <div className="col-span-2 text-center">
              {new Date(competition.createdAt || Date.now()).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" }).replace(/\//g, ".")}
            </div>

            {/* Teams Count */}
            <div className="col-span-2 text-center">
              {Array.isArray(competition.teams) ? competition.teams.length : 0}
            </div>

            {/* Competition Logo Status */}
            <div className="col-span-2 flex justify-center items-center">
              {hasLogo ? (
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 3.8L5.23529 8L13 1" stroke="#2EE500" strokeWidth="2.1" />
                </svg>
              ) : (
                // <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                //   <path d="M9.22458e-05 8.6957L8.69566 0.000394039L10 1.30469L1.30443 10L9.22458e-05 8.6957Z" fill="#E50000" />
                //   <path d="M9.99991 8.69531L1.30434 0L0 1.3043L8.69557 9.99961L9.99991 8.69531Z" fill="#E50000" />
                // </svg>
                <div className="col-span-2 text-center">
                  {"-"}
                </div>
              )}
            </div>

            {/* Competition ID Status */}
            <div className="col-span-2 flex justify-center items-center">
              {competition.seasonId !== "" ? (
                // <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                //   <path d="M1 3.8L5.23529 8L13 1" stroke="#2EE500" strokeWidth="2.1"/>
                // </svg>
                <div className="col-span-2 text-center">
                  {competition.seasonId}
                </div>
              ) : (
                // <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                //   <path d="M9.22458e-05 8.6957L8.69566 0.000394039L10 1.30469L1.30443 10L9.22458e-05 8.6957Z" fill="#E50000"/>
                //   <path d="M9.99991 8.69531L1.30434 0L0 1.3043L8.69557 9.99961L9.99991 8.69531Z" fill="#E50000"/>
                // </svg>
                <div className="col-span-2 text-center">
                  {"-"}
                </div>
              )}
            </div>

            {/* Menu Button */}
            {(canEdit('Competitions') || canDelete('Competitions')) && (
              <div className="col-span-1 flex justify-center relative">
                <button
                  onClick={() => toggleMenu(competition._id)}
                  className="w-[30px] h-[24px] bg-black rounded-md flex items-center justify-center hover:bg-[#373737] transition-colors"
                >
                  <svg width="30" height="24" viewBox="0 0 30 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="12" r="2" fill="white" />
                    <circle cx="15" cy="12" r="2" fill="white" />
                    <circle cx="22" cy="12" r="2" fill="white" />
                  </svg>
                </button>
                {menuOpenId === competition._id && (
                  <div className="absolute right-10 bg-[#1B1B1B] border border-[#373737] rounded-md shadow-lg z-50">
                    {canEdit('Competitions') && (
                      <button
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#252525]"
                        onClick={() => handleEdit(competition._id)}
                      >
                        Edit
                      </button>
                    )}
                    {canDelete('Competitions') && (
                      <button
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#252525]"
                        onClick={() => handleDelete(competition._id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>


  {/* Empty State */ }
  {
    filteredCompetitions.length === 0 && (
      <div className="bg-[#252525] rounded-xl p-12 text-center">
        <p className="text-gray-400 text-lg">No competitions found for the selected sport.</p>
      </div>
    )
  }

  {/* Pagination */}
  {totalCount > 0 && (
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
        <span className="text-white text-sm">Page {currentPage} of {Math.max(1, Math.ceil(totalCount / PAGE_SIZE))}</span>
        <Button
          onClick={() => setCurrentPage(p => Math.min(Math.max(1, Math.ceil(totalCount / PAGE_SIZE)), p + 1))}
          disabled={currentPage >= Math.max(1, Math.ceil(totalCount / PAGE_SIZE))}
          className={`h-[36px] px-4 text-white text-sm rounded-md ${currentPage >= Math.max(1, Math.ceil(totalCount / PAGE_SIZE)) ? "bg-[#373737]" : "bg-[#1B1B1B]"}`}
        >
          Next
        </Button>
      </div>
    </div>
  )}
  {/* Add Competition Modal */ }
  <AddCompetitionModal
    isOpen={isModalOpen}
    onClose={() => setIsModalOpen(false)}
    onSubmit={handleModalSubmit}
    defaultSport={selectedSport}
  />

  {/* Edit Competition Modal */ }
  {
    isEditOpen && editingCompetition && (
      <EditCompetitionModal
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setEditingCompetition(null); }}
        onSubmit={(payload: { sport: string; competitionName: string; teamIds: string[]; teams?: { teamId: string; name: string }[] }) => {
          const userId = user?.userId || '';
          const teamsArr = Array.isArray(payload.teams) && payload.teams.length
            ? payload.teams.map(t => {
                const found = (teamsList || []).find((tm: any) => tm.id === t.teamId);
                return found ? { _id: found._id, teamId: t.teamId, name: t.name || found.name } : { teamId: t.teamId, name: t.name };
              })
            : (payload.teamIds || []).map(shortId => {
                const t = (teamsList || []).find((tm: any) => tm.id === shortId);
                return t ? { _id: t._id, teamId: t.id, name: t.name } : null;
              }).filter(Boolean) as any[];
          dispatch(updateCompetition({ _id: editingCompetition._id, name: payload.competitionName, category: payload.sport, teams: teamsArr, userId }))
            .unwrap()
            .then(() => {
              toast.success('Competition updated');
              setIsEditOpen(false);
              setEditingCompetition(null);
            })
            .catch((err: any) => toast.error('Failed to update competition', { description: err?.message || 'Unknown error' }));
        }}
        initialData={{
          sport: editingCompetition.category,
          competitionName: editingCompetition.name,
          teamIds: Array.isArray(editingCompetition.teams) ? (editingCompetition.teams as any[]).map((t: any) => t.teamId) : [],
          teams: Array.isArray(editingCompetition.teams) ? (editingCompetition.teams as any[]) : [],
        }}
      />
    )
  }
    </div >
  );
};

export default CompetitionsTab;
