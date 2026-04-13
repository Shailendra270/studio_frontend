import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SportsDropdown from "@/components/common/SportsDropdown";
import AddEventModal from "@/components/modals/SettingPageModals/AddEventModal";
import { useDispatch, useSelector } from "react-redux";
import { selectTagsLoading, createNewTag, deleteExistingTag } from "@/store/slices/tagsSlice";
import { getTags, TagData } from "@/api/tagsApi";
import { sportOptions }  from "@/constants/AddVideo";
import { toast } from "sonner";
import { selectUser } from "@/store/slices/authSlice";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { truncateText } from "@/utils/text";

const EventsTab: React.FC = () => {
  // Initialize to first sport option (remove 'all')
  const validTagCategories = ["cricket", "football", "basketball", "tennis", "hockey", "other"] as const;
  const initialSport = (sportOptions.find(opt => validTagCategories.includes(opt.value as any))?.value) || "football";
  const [selectedSport, setSelectedSport] = useState(initialSport);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const dispatch = useDispatch();
  const [eventTags, setEventTags] = useState<TagData[]>([]);
  const loading = useSelector(selectTagsLoading);
  const user = useSelector(selectUser);

  // Fetch event tags when sport changes (local state only)
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!selectedSport) return;
      try {
      const resp = await getTags({ category: selectedSport, tagType: "event", userId: user?.userId || '', limit: 100, pageNo: 1 });
        if (!cancelled && resp.success) {
          setEventTags(resp.data || []);
        }
      }catch (error: any) {
        toast.error(error?.message || "Failed to fetch events");
        if (!cancelled) setEventTags([]);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [selectedSport, user?.userId]);

  // Convert backend tags to table rows
  const backendRows = useMemo(() => {
    return (eventTags || []).map((tag: TagData) => ({
      id: tag._id,
      name: tag.name,
      sport: selectedSport as "basketball" | "football",
      createdDate: new Date(tag.createdAt).toLocaleDateString(),
      teams: 0,
      status: "active" as const,
    }));
  }, [eventTags, selectedSport]);

  const combinedRows = backendRows;

  const searchedRows = useMemo(() => {
    if (!searchQuery) return combinedRows;
    return combinedRows.filter((row: any) => row.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [combinedRows, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(searchedRows.length / PAGE_SIZE));
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSport, searchQuery]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return searchedRows.slice(start, start + PAGE_SIZE);
  }, [searchedRows, currentPage]);

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
      toast.success("Event deleted successfully!");
      setCurrentPage(1);
      setMenuOpenId(null);
      setEventTags(prev => prev.filter(t => t._id !== rowId));
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete event");
    }
  };
  const handleAddEvent = () => {
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (data: { sport: string; eventName: string }) => {
    try {
      // Duplicate check against backend rows for the current sport (case-insensitive)
      const exists = (eventTags || []).some((t: TagData) => t.name.trim().toLowerCase() === data.eventName.trim().toLowerCase());
      if (exists) {
        toast.error("Event with this name already exists!");
        // Keep modal open; let user change name
        return;
      }
      const payload: any = {
        category: data.sport,
        name: data.eventName.trim(),
        tagType: "event",
      };
      if (user?.userId) {
        payload.userId = user.userId;
      }
      const res = await (dispatch as any)(createNewTag(payload)).unwrap();
      toast.success(res?.message || "Event created successfully");
      // Refresh local list
      try {
        const resp = await getTags({ category: selectedSport, tagType: "event", userId: user?.userId || '', limit: 100, pageNo: 1 });
        if (resp.success) setEventTags(resp.data || []);
      } catch (error: any) {
        toast.error(error?.message || "Failed to fetch events after creation");
      }
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error?.message || "Failed to create event");
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
        {/* Search and Add Event */}
        <div className="flex items-center gap-4">
          <div className="w-[300px]">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events..."
              className="h-[48px] bg-[#1B1B1B] text-white placeholder-[#707070]"
            />
          </div>
          <Button
            onClick={handleAddEvent}
            className="w-[200px] h-[48px] bg-[#1B1B1B] border-2 border-[#0BF] text-white text-base font-semibold rounded-[15px] hover:bg-[#252525] transition-colors"
          >
            Add event
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
          {paginatedRows.map((event, index) => (
            <div
              key={`${event.id}-${index}`}
              className="grid grid-cols-12 gap-4 px-6 py-4 text-white text-sm font-medium hover:bg-[#2A2A2A] transition-colors"
            >
              {/* Name with Icon */}
              <div className="col-span-4 flex items-center gap-3">
                {getSportIcon(event.sport)}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="truncate max-w-[180px]">{truncateText(event.name, 25)}</span>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start">
                    <p>{event.name}</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Created Date */}
              <div className="col-span-3 text-center">
                {event.createdDate}
              </div>

              {/* Teams Count */}
              <div className="col-span-2 text-center">
                {/* {event.teams} */}
              </div>

              {/* Status Indicator */}
              <div className="col-span-2 flex justify-center">
                {/* <div
                  className={`w-[10px] h-[10px] rounded-sm ${
                    event.status === "active" ? "bg-[#2EE500]" : "bg-[#E50000]"
                  }`}
                ></div> */}
              </div>

              {/* Menu Button */}
              <div className="col-span-1 flex justify-center relative">
                <button
                  onClick={() => toggleMenu(event.id)}
                  className="w-[30px] h-[24px] bg-black rounded-md flex items-center justify-center hover:bg-[#373737] transition-colors"
                >
                  <svg width="30" height="24" viewBox="0 0 30 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="12" r="2" fill="white" />
                    <circle cx="15" cy="12" r="2" fill="white" />
                    <circle cx="22" cy="12" r="2" fill="white" />
                  </svg>
                </button>
                {menuOpenId === event.id && (
                  <div className="absolute right-10 bg-[#1B1B1B] border border-[#373737] rounded-md shadow-lg z-50">
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#252525]"
                      onClick={() => handleDelete(event.id)}
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
          <p className="text-gray-400 text-lg">No events found for the selected sport.</p>
        </div>
      )}

      {/* Pagination */}
      {searchedRows.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-white text-sm px-2">
            Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, searchedRows.length)}-
            {Math.min(currentPage * PAGE_SIZE, searchedRows.length)} of {searchedRows.length}
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

      {/* Add Event Modal */}
      <AddEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        defaultSport={selectedSport}
      />
    </div>
  );
};

export default EventsTab;
