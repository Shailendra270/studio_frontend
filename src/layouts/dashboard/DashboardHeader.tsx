import { DateRangeSelector } from "../../components/ui/date-range-selector";
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Dayjs } from "dayjs";
import SportsDropdown from '@/components/common/SportsDropdown';
import SVGIcon from "@/components/common/SVGIcon";
import SportSelectorIcon from "../../assets/svg/SportSelectorIcon.svg";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import SearchBar from "@/containers/filters/SearchBar";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchStreams, updateFilters } from "@/store/slices/streamsSlice";
import { debounce } from "lodash";

interface DashboardHeaderProps {
  title: string;
  onAddVideoFeed?: () => void;
  userId?: string;
}

// Utility function to get sport icon dynamically
function getSportIconPath(sportName: string): string | null {
  // @ts-ignore: Vite/webpack will replace import.meta.glob at build time
  const svgModules = import.meta.glob('@/assets/svg/Zentag_full_white_sport_icons/*.svg', { eager: true });

  // Normalize sport name for matching
  const normalizedName = sportName.toLowerCase().replace(/\s+/g, '_');

  // Find matching SVG file
  for (const [path, mod] of Object.entries(svgModules)) {
    if (!mod || typeof mod !== 'object' || !('default' in mod)) continue;

    const fileName = path.split('/').pop()?.replace('.svg', '') || '';
    if (fileName === normalizedName) {
      return (mod as { default: string }).default;
    }
  }

  return null;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onAddVideoFeed,
  userId,
}) => {
  const dispatch = useAppDispatch();
  const { filters, isLoading } = useAppSelector((state) => state.streams);
  const { user } = useAppSelector((state) => state.auth);

  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  // Get userId from props or auth state
  const currentUserId = userId || user?.userId;

  // Debounced function to fetch streams
  const debouncedFetchStreams = useCallback(
    debounce((filterParams: any) => {
      if (currentUserId) {
        dispatch(fetchStreams({
          filters: {
            userId: currentUserId,
            ...filterParams,
          },
          page: 1,
          limit: 20,
        }));
      }
    }, 500),
    [dispatch, currentUserId]
  );

  // Effect to fetch streams when filters change
  useEffect(() => {
    const filterParams: any = {
      userId: currentUserId, // Always include userId
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };

    // Only add filters if they have values
    if (selectedSports.length > 0) {
      filterParams.category = selectedSports;
    }

    if (searchQuery.trim()) {
      filterParams.searchText = searchQuery.trim();
    }

    if (dateRange && dateRange[0] && dateRange[1]) {
      // Format dates with full timestamp to ensure proper day range filtering
      // Start date: beginning of day (00:00:00)
      // End date: end of day (23:59:59)
      filterParams.startDate = dateRange[0].startOf('day').toISOString();
      filterParams.endDate = dateRange[1].endOf('day').toISOString();
    }

    // Update Redux filters - this will replace all filters
    dispatch(updateFilters(filterParams));

    // Debounced API call
    debouncedFetchStreams(filterParams);
  }, [selectedSports, searchQuery, dateRange, dispatch, debouncedFetchStreams, currentUserId]);

  // Initial load
  useEffect(() => {
    if (currentUserId) {
      dispatch(fetchStreams({
        filters: { userId: currentUserId },
        page: 1,
        limit: 20,
      }));
    }
  }, [currentUserId, dispatch]);

  const addSport = (sport: string | string[]) => {
    if (Array.isArray(sport)) {
      setSelectedSports(sport);
    } else {
      if (!selectedSports.includes(sport)) {
        setSelectedSports([...selectedSports, sport]);
      }
    }
  };

  const removeSport = (sport: string) => {
    setSelectedSports(selectedSports.filter((s) => s !== sport));
  };

  const handleDateRangeChange = (
    dates: [Dayjs | null, Dayjs | null] | null,
    dateStrings: [string, string],
  ) => {
    setDateRange(dates);
    console.log("Date range selected:", dateStrings);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedSports([]);
    setSearchQuery('');
    setDateRange(null);
  };

  // Check if any filters are active
  const hasActiveFilters = selectedSports.length > 0 || searchQuery.trim() || dateRange;

  // Render sport chip component
  const renderSportChip = (sport: string) => {
    const iconPath = getSportIconPath(sport);
    const displayName = sport.charAt(0).toUpperCase() + sport.slice(1);

    return (
      <div
        key={sport}
        className="flex items-center gap-2 px-3 py-2 bg-[#252525] border border-[#373737] text-white text-sm rounded-lg hover:border-[#4A4A4A] transition-colors"
      >
        {iconPath && (
          <div className="w-5 h-5 flex-shrink-0">
            <SVGIcon src={iconPath} className="w-5 h-5" />
          </div>
        )}
        <span className="font-medium">{displayName}</span>
        <button
          onClick={() => removeSport(sport)}
          className="ml-1 p-0.5 hover:bg-[#373737] rounded transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  };

  return (
    <header className="bg-[#18191B] px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Sport Selector */}
        <div className="relative w-full sm:w-auto min-w-60">
          <SportsDropdown
            mode="field"
            icon={<SVGIcon src={SportSelectorIcon} />}
            value={selectedSports}
            onChange={addSport}
            multiple={true}
            placeholder="Sport selector"
          />
        </div>

        {/* Selected sport chips on the right */}
        {selectedSports.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedSports.length === 1 ? (
              // Show single sport chip
              renderSportChip(selectedSports[0])
            ) : (
              // Show first sport + remaining count with tooltip
              <>
                {renderSportChip(selectedSports[0])}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 px-3 py-2 bg-[#252525] border border-[#373737] text-white text-sm rounded-lg hover:border-[#4A4A4A] transition-colors cursor-pointer">
                        <span className="font-medium">+{selectedSports.length - 1}</span>
                        <button
                          onClick={() => {
                            // Remove all sports except the first one
                            setSelectedSports([selectedSports[0]]);
                          }}
                          className="ml-1 p-0.5 hover:bg-[#373737] rounded transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-[#2A2A2A] border border-[#373737] text-white p-3">
                      <div className="space-y-2">
                        <p className="text-sm font-medium mb-2">Selected Sports:</p>
                        {selectedSports.slice(1).map((sport) => {
                          const iconPath = getSportIconPath(sport);
                          const displayName = sport.charAt(0).toUpperCase() + sport.slice(1);

                          return (
                            <div key={sport} className="flex items-center gap-2">
                              {iconPath && (
                                <div className="w-4 h-4 flex-shrink-0">
                                  <SVGIcon src={iconPath} className="w-4 h-4" />
                                </div>
                              )}
                              <span className="text-sm">{displayName}</span>
                              <button
                                onClick={() => removeSport(sport)}
                                className="ml-1 p-0.5 hover:bg-[#373737] rounded transition-colors"
                              >
                                <X className="w-2 h-2" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </TooltipContent>
                  </Tooltip>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-end w-full sm:w-auto">
        {/* Search */}
        <div className="relative w-full sm:w-64 md:w-72">
          {/* <Input
            placeholder="Search..."
            className="bg-[#252525] border-none text-white placeholder-gray-400 focus:border-blue-500 h-10 rounded-lg"
          /> */}
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search streams..."
            className="bg-[#252525] border-none text-white placeholder-gray-400 rounded-xl h-11"
          />
        </div>

        {/* Date Range Selector */}
        <div className="w-full sm:w-64 md:w-80">
          <DateRangeSelector
            placeholder={["Start date", "End date"]}
            value={dateRange}
            onChange={handleDateRangeChange}
            format="YYYY-MM-DD"
            allowClear={true}
            className="w-full"
          />
        </div>
        {/* Clear Filters Button */}
        {hasActiveFilters && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={clearAllFilters}
                  className="h-9 px-2 border-[#373737] text-xs text-white hover:bg-[#373737] hover:text-white rounded-lg"
                >
                  <X className="w-3 h-3 mr-0.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" align="start" className="max-w-xs">
                Clear Filters
              </TooltipContent>
            </Tooltip>
        )}

        {onAddVideoFeed && (
          <Button
            className="bg-gradient-to-r from-[#00BBFF] to-[#0051FF] hover:from-[#0099CC] hover:to-[#003DCC] h-10 rounded-lg"
            onClick={onAddVideoFeed}
          >
            + Add video feed
          </Button>
        )}
      </div>
    </header>
  );
};

export default DashboardHeader;
