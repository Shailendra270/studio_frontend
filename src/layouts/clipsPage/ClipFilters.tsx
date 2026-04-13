import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DateRangeSelector } from "@/components/ui/date-range-selector";
import SearchBar from "../../containers/filters/SearchBar";
import { EventsSection, defaultEventOptions, cricketEventsOptions } from "../../containers/filters/EventsSection";
import { useClipsContext } from '@/contexts/useClipsContext';
import PlayersSection from "@/containers/filters/PlayersSection";
import { AspectRatioSection } from "../../containers/filters/AspectRatioSection";
// import { StatusSection } from "../../containers/filters/StatusSection";
import { RatingSection } from "../../containers/filters/RatingSection";
import { DurationFilterSection } from "../../containers/filters/DurationFilterSection";

import { SortBySection } from "../../containers/filters/SortBySection";
import { Dayjs } from "dayjs";
import SortDropdown from "@/containers/filters/SortByDropDown";
import { setFilters, selectClipsFilters, ClipsFilters } from "../../store/slices/clipsSlice";
import { RootState, AppDispatch } from "../../store";

interface ClipFiltersProps {
  activeTab: string;
  page: string;
  streamId: string;
  counts?: {
    tags: Record<string, number>;
    ratings: Record<string, number>;
    aspectRatios: Record<string, number>;
  };
}

const ClipFilters: React.FC<ClipFiltersProps> = ({ activeTab, page, streamId, counts }) => {
  const dispatch = useDispatch<AppDispatch>();
  const clipsFilters = useSelector(selectClipsFilters);
  const { currentStream } = useSelector((state: RootState) => state.streams);
  const { eventTags, playerTags } = useClipsContext();

  // Local state for UI components
  const [searchQuery, setSearchQuery] = useState(clipsFilters.search);
  const [selectedEvents, setSelectedEvents] = useState<string[]>(clipsFilters.tags);
  
  const availableEventNames = useMemo(() => {
    let options: { label: string }[] = [];
    if (eventTags && eventTags.length > 0) {
      options = eventTags.map(tag => ({ label: tag.name }));
    } else if (currentStream?.category === "cricket") {
      options = cricketEventsOptions;
    } else {
      options = defaultEventOptions;
    }
    return new Set(options.map(o => o.label));
  }, [eventTags, currentStream?.category]);

  const availablePlayerNames = useMemo(() => {
    if (playerTags && playerTags.length > 0) {
      return new Set(playerTags.map(tag => tag.name || tag.metaData?.playerName || ''));
    }
    return new Set<string>();
  }, [playerTags]);

  const currentSelectedEventTags = useMemo(() => 
    selectedEvents.filter(tag => availableEventNames.has(tag) || tag === "all"),
  [selectedEvents, availableEventNames]);

  const currentSelectedPlayerTags = useMemo(() => 
    selectedEvents.filter(tag => availablePlayerNames.has(tag)),
  [selectedEvents, availablePlayerNames]);

  const [selectedAspectRatios, setSelectedAspectRatios] = useState<string[]>(
    clipsFilters.aspectRatio ? [clipsFilters.aspectRatio] : []
  );
  const [selectedStatus, setSelectedStatus] = useState<string[]>(
    clipsFilters.status !== 'all' ? [clipsFilters.status] : []
  );
  const [selectedDuration, setSelectedDuration] = useState<string>(clipsFilters.duration || '');
  const [selectedRatings, setSelectedRatings] = useState<string[]>(clipsFilters.rating);
  const [sortBy, setSortBy] = useState(clipsFilters.sortBy);
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  // Update local state when Redux state changes
  useEffect(() => {
    setSearchQuery(clipsFilters.search);
    setSelectedEvents(clipsFilters.tags);
    setSelectedRatings(clipsFilters.rating);
    setSelectedDuration(clipsFilters.duration || '');
    setSelectedAspectRatios(clipsFilters.aspectRatio ? [clipsFilters.aspectRatio] : []);
    setSelectedStatus(clipsFilters.status !== 'all' ? [clipsFilters.status] : []);
    setSortBy(clipsFilters.sortBy);
  }, [clipsFilters]);

  // Reset all filters when page changes
  useEffect(() => {
    const resetFilters = {
      search: '',
      tags: [],
      aspectRatio: '',
      status: 'all' as any,
      rating: [],
      duration: '',
      sortBy: 'latest' as any,
      dateRange: null
    };

    // Reset Redux state
    dispatch(setFilters(resetFilters));

    // Reset local state
    setSearchQuery('');
    setSelectedEvents([]);
    setSelectedAspectRatios([]);
    setSelectedStatus([]);
    setSelectedRatings([]);
    setSelectedDuration('');
    setSortBy('latest');
    setDateRange(null);
  }, [page, dispatch]);

  // Debounced search handler
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      dispatch(setFilters({ search: searchQuery }));
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, dispatch]);

  const handleEventChange = (eventId: string, checked: boolean) => {
    let newSelection: string[];

    if (eventId === "all") {
      newSelection = checked ? ["all"] : [];
    } else {
      newSelection = checked
        ? [...selectedEvents.filter((id) => id !== "all"), eventId]
        : selectedEvents.filter((id) => id !== eventId);
    }

    setSelectedEvents(newSelection);
    // Send empty array to backend when "all" is selected, otherwise send the actual selection
    const tagsForBackend = newSelection.includes("all") ? [] : newSelection;
    dispatch(setFilters({ tags: tagsForBackend }));
  };

  const handleAspectRatioChange = (aspectRatioId: string, checked: boolean) => {
    let newSelection: string[];

    if (aspectRatioId === "all") {
      newSelection = checked ? ["all"] : [];
    } else {
      // For aspect ratio, only allow one selection at a time (excluding 'all')
      if (checked) {
        newSelection = [aspectRatioId]; // Replace any existing selection with the new one
      } else {
        newSelection = selectedAspectRatios.filter((id) => id !== aspectRatioId);
      }
    }

    setSelectedAspectRatios(newSelection);
    dispatch(setFilters({
      aspectRatio: newSelection.length > 0 && newSelection[0] !== 'all' ? newSelection[0] : ''
    }));
  };

  const handleStatusChange = (statusId: string, checked: boolean) => {
    let newSelection: string[];

    if (statusId === "all") {
      newSelection = checked ? ["all"] : [];
    } else {
      newSelection = checked
        ? [...selectedStatus.filter((id) => id !== "all"), statusId]
        : selectedStatus.filter((id) => id !== statusId);
    }

    setSelectedStatus(newSelection);
    dispatch(setFilters({
      status: newSelection.length > 0 && newSelection[0] !== 'all' ? newSelection[0] as any : 'all'
    }));
  };

  const handleRatingChange = (ratingId: string, checked: boolean) => {
    let newSelection: string[];

    if (ratingId === "all") {
      newSelection = checked ? ["all"] : [];
    } else {
      newSelection = checked
        ? [...selectedRatings.filter((id) => id !== "all"), ratingId]
        : selectedRatings.filter((id) => id !== ratingId);
    }

    setSelectedRatings(newSelection);
    dispatch(setFilters({
      rating: newSelection.includes('all') ? [] : newSelection
    }));
  };

  const handleDurationChange = (durationId: string) => {
    setSelectedDuration(durationId);
    dispatch(setFilters({
      duration: durationId
    }));
  };

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
    dispatch(setFilters({ sortBy: newSortBy as any }));
  };

  const handleDateRangeChange = (newDateRange: [Dayjs | null, Dayjs | null] | null) => {
    setDateRange(newDateRange);
    if (newDateRange && newDateRange[0] && newDateRange[1]) {
      // Format dates with full timestamp to ensure proper day range filtering
      // Start date: beginning of day (00:00:00)
      // End date: end of day (23:59:59)
      dispatch(setFilters({
        dateRange: {
          startDate: newDateRange[0].startOf('day').toISOString(),
          endDate: newDateRange[1].endOf('day').toISOString()
        }
      }));
    } else {
      dispatch(setFilters({
        dateRange: { startDate: '', endDate: '' }
      }));
    }
  };

  // Reset Handlers
  const handleResetEvents = () => {
    const newSelection = selectedEvents.filter(tag => !availableEventNames.has(tag) && tag !== "all");
    setSelectedEvents(newSelection);
    dispatch(setFilters({ tags: newSelection }));
  };

  const handleResetPlayers = () => {
    const newSelection = selectedEvents.filter(tag => !availablePlayerNames.has(tag) && tag !== "all");
    setSelectedEvents(newSelection);
    dispatch(setFilters({ tags: newSelection }));
  };

  const handleResetAspectRatio = () => {
    setSelectedAspectRatios([]);
    dispatch(setFilters({ aspectRatio: '' }));
  };

  const handleResetRating = () => {
    setSelectedRatings([]);
    dispatch(setFilters({ rating: [] }));
  };

  const handleResetDuration = () => {
    setSelectedDuration('');
    dispatch(setFilters({ duration: '' }));
  };

  const handleResetSortBy = () => {
    setSortBy('latest');
    dispatch(setFilters({ sortBy: 'latest' as any }));
  };

  const handleResetDateRange = () => {
    setDateRange(null);
    dispatch(setFilters({ dateRange: { startDate: '', endDate: '' } }));
  };

  return (
    <div className="w-80 h-full bg-[#18191B] border-r border-[#252525] p-6 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500">
      <h2 className="text-lg font-bold text-white text-center mb-6">Filters</h2>

      {/* Main Search */}
      {page !== "my-highlights" && (<div className="mb-6">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search..."
        />
      </div>)}

      {/* Events Section with integrated search */}
      {activeTab !== "highlights" && page !== "my-highlights" && (
        <EventsSection
          selectedEvents={currentSelectedEventTags}
          onEventChange={handleEventChange}
          category={currentStream?.category}
          streamId={currentStream?.streamId}
          counts={counts?.tags}
          onReset={handleResetEvents}
        />
      )}

      {/* Players Section with integrated search */}
      {activeTab !== "highlights" && page !== "my-highlights" && (
        <PlayersSection
          selectedEvents={currentSelectedPlayerTags}
          onEventChange={handleEventChange}
          category={currentStream?.category}
          streamId={currentStream?.streamId}
          counts={counts?.tags}
          onReset={handleResetPlayers}
        />
      )}

      {/* Sort Dropdown */}
      {page === "my-highlights" && (
        <div className="mb-6">
          <SortDropdown value={sortBy} onChange={handleSortChange} />
        </div>
      )}

      {/* Aspect Ratio Section */}
      <AspectRatioSection
        selectedAspectRatios={selectedAspectRatios}
        onAspectRatioChange={handleAspectRatioChange}
        counts={counts?.aspectRatios}
        page={page}
        activeTab={activeTab}
        onReset={handleResetAspectRatio}
      />

      {/* Duration Section */}
      {page === "my-highlights" && (<DurationFilterSection
        selectedDuration={selectedDuration}
        onDurationChange={handleDurationChange}
        onReset={handleResetDuration}
      />)}

      {/* Status Section */}
      {/* {page === "my-highlights" && (
      <StatusSection
        selectedStatus={selectedStatus}
        onStatusChange={handleStatusChange}
      />)} */}

      {/* Rating Section */}
      <RatingSection
        selectedRatings={selectedRatings}
        onRatingChange={handleRatingChange}
        counts={counts?.ratings}
        page={page}
        activeTab={activeTab}
        onReset={handleResetRating}
      />



      {/* Date Range */}
      {page === "my-highlights" || activeTab === "highlights" && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-white">Date Range</h3>
            {dateRange && (
              <button
                onClick={handleResetDateRange}
                className="text-xs bg-gradient-to-r from-[#00EEFF] to-[#0051FF] bg-clip-text text-transparent font-medium hover:opacity-80 transition-opacity"
              >
                Reset
              </button>
            )}
          </div>
          <DateRangeSelector
            value={dateRange}
            onChange={handleDateRangeChange}
            placeholder={["Start date", "End date"]}
          />
        </div>
      )}

      {/* Sort By Section */}
      {activeTab !== "highlights" && (
        <SortBySection sortBy={sortBy} onSortChange={handleSortChange} onReset={handleResetSortBy} />
      )}
    </div>
  );
};

export default ClipFilters;
