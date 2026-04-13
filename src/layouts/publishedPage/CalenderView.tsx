import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthNames,dayNames } from "@/constants/AddVideo";

interface CalendarViewProps {
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  currentMonth: number;
  currentYear: number;
  onMonthChange: (month: number, year: number) => void;
  selectedEventType?: "published" | "failed" | "all";
  onEventTypeChange?: (type: "published" | "failed" | "all") => void;
  monthCounts: Record<string, { published: number; failed: number }>;
}

interface CalendarDay {
  day: number;
  isCurrentMonth: boolean;
  publishedCount: number;
  failedCount: number;
  hasContent: boolean;
}

const getMonthName = (month: number, year: number): string => {
  return `${monthNames[month - 1]}, ${String(year).slice(-2)}`;
};

const CalendarView: React.FC<CalendarViewProps> = ({
  selectedDate,
  onDateSelect,
  currentMonth,
  currentYear,
  onMonthChange,
  selectedEventType = "all",
  onEventTypeChange,
  monthCounts,
}) => {
  // Get current date for initialization
  const today = new Date();
  const currentRealMonth = today.getMonth() + 1; // getMonth() returns 0-11
  const currentRealYear = today.getFullYear();

  // Initialize displayedMonths with current month in center (index 4)
  const initializeDisplayedMonths = () => {
    const months = [];
    for (let i = -4; i <= 4; i++) {
      let month = currentRealMonth + i;
      let year = currentRealYear;
      
      while (month <= 0) {
        month += 12;
        year -= 1;
      }
      while (month > 12) {
        month -= 12;
        year += 1;
      }
      
      months.push({ month, year });
    }
    return months;
  };

  const [displayedMonths, setDisplayedMonths] = useState(initializeDisplayedMonths());
  const centerMonths = (centerMonth: number, centerYear: number) => {
    const months = [];
    for (let i = -4; i <= 4; i++) {
      let m = centerMonth + i;
      let y = centerYear;
      while (m <= 0) {
        m += 12;
        y -= 1;
      }
      while (m > 12) {
        m -= 12;
        y += 1;
      }
      months.push({ month: m, year: y });
    }
    return months;
  };

  // Initialize with current month on first load
  useEffect(() => {
    if (currentMonth !== currentRealMonth || currentYear !== currentRealYear) {
      onMonthChange(currentRealMonth, currentRealYear);
    }
  }, []);

  const buildCalendarData = (year: number, month: number): CalendarDay[] => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
    const calendar: CalendarDay[] = [];
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const counts = monthCounts[dateStr];
      calendar.push({
        day,
        isCurrentMonth: false,
        publishedCount: counts?.published || 0,
        failedCount: counts?.failed || 0,
        hasContent: Boolean(counts),
      });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const counts = monthCounts[dateStr];
      calendar.push({
        day,
        isCurrentMonth: true,
        publishedCount: counts?.published || 0,
        failedCount: counts?.failed || 0,
        hasContent: Boolean(counts),
      });
    }
    const remainingDays = 42 - calendar.length;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    for (let day = 1; day <= remainingDays; day++) {
      const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const counts = monthCounts[dateStr];
      calendar.push({
        day,
        isCurrentMonth: false,
        publishedCount: counts?.published || 0,
        failedCount: counts?.failed || 0,
        hasContent: Boolean(counts),
      });
    }
    return calendar;
  };

  const calendarData = buildCalendarData(currentYear, currentMonth);

  const handlePrevMonth = () => {
    const newMonths = displayedMonths.map(m => {
      const newMonth = m.month === 1 ? 12 : m.month - 1;
      const newYear = m.month === 1 ? m.year - 1 : m.year;
      return { month: newMonth, year: newYear };
    });
    setDisplayedMonths(newMonths);
    onMonthChange(newMonths[4].month, newMonths[4].year);
  };

  const handleNextMonth = () => {
    const newMonths = displayedMonths.map(m => {
      const newMonth = m.month === 12 ? 1 : m.month + 1;
      const newYear = m.month === 12 ? m.year + 1 : m.year;
      return { month: newMonth, year: newYear };
    });
    setDisplayedMonths(newMonths);
    onMonthChange(newMonths[4].month, newMonths[4].year);
  };

  const formatDateString = (year: number, month: number, day: number): string => {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const isDateSelected = (year: number, month: number, day: number): boolean => {
    const dateStr = formatDateString(year, month, day);
    return selectedDate === dateStr;
  };

  const currentDay = today.getDate();

  const isCurrentDate = (year: number, month: number, day: number): boolean => {
    return year === currentRealYear && month === currentRealMonth && day === currentDay;
  };

  const isCurrentMonth = (year: number, month: number): boolean => {
    return year === currentRealYear && month === currentRealMonth;
  };

  return (
    <div className="w-full">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="w-[42px] h-[42px] rounded-xl border-1.5 border-[#252525] flex items-center justify-center hover:bg-[#252525] transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>

        <div className="flex gap-4">
          {displayedMonths.map((monthData, index) => {
            const isCenter = index === 4; // Center month
            return (
              <div
                key={index}
                className={`px-4 py-2 rounded-xl text-center ${
                  isCenter
                    ? "border border-white bg-transparent"
                    : "bg-[#252525]"
                }`}
                onClick={() => {
                  const newStrip = centerMonths(monthData.month, monthData.year);
                  setDisplayedMonths(newStrip);
                  onMonthChange(monthData.month, monthData.year);
                }}
              >
                <span className="text-sm font-medium text-white">
                  {getMonthName(monthData.month, monthData.year)}
                </span>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleNextMonth}
          className="w-[42px] h-[42px] rounded-xl border-1.5 border-[#252525] flex items-center justify-center hover:bg-[#252525] transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-3 lg:gap-4">
        {/* Day Headers */}
        {dayNames.map((day) => (
          <div key={day} className="text-center py-2">
            <span className="text-white text-xs font-medium">{day}</span>
          </div>
        ))}

        {/* Calendar Days */}
        {calendarData.map((dayData: CalendarDay, index: number) => {
          const dateStr = formatDateString(currentYear, currentMonth, dayData.day);
          const isSelected = isDateSelected(currentYear, currentMonth, dayData.day);
          const isTodayDate = isCurrentDate(currentYear, currentMonth, dayData.day);

          return (
            <div
              key={index}
              className={`relative h-[90px] rounded-xl cursor-pointer transition-all ${
                dayData.isCurrentMonth
                  ? isTodayDate
                    ? "border-2 border-[#00BBFF] bg-[#252525] shadow-lg shadow-[#00BBFF]/20"
                    : isSelected
                    ? "border border-white bg-[#252525]"
                    : "bg-[#252525] hover:bg-[#333]"
                  : "bg-[#1a1a1a] opacity-50"
              }`}
              onClick={() => {
                if (dayData.isCurrentMonth) {
                  onDateSelect(dateStr);
                }
              }}
            >
              {/* Day Number */}
              <div className="p-2 lg:p-3">
                <span
                  className={`text-lg lg:text-xl font-medium ${
                    isTodayDate
                      ? "bg-gradient-to-r from-[#00BBFF] to-[#0051FF] bg-clip-text text-transparent font-bold"
                      : "text-white"
                  }`}
                >
                  {dayData.day}
                </span>
              </div>

              {/* Event Counters */}
              {dayData.hasContent && (
                <div className="absolute bottom-2 lg:bottom-3 left-2 lg:left-3 flex gap-1">
                  {dayData.publishedCount > 0 && (
                    <div className="flex gap-1">
                      <div className="w-6 lg:w-[36px] h-5 lg:h-6 bg-white rounded flex items-center justify-center">
                        <span className="text-black text-xs lg:text-sm font-bold">
                          {dayData.publishedCount}
                        </span>
                      </div>
                      <div className="w-6 lg:w-[36px] h-5 lg:h-6 bg-[#18191B] rounded flex items-center justify-center">
                        <span className="text-white text-xs lg:text-sm font-bold">
                          {dayData.failedCount}
                        </span>
                      </div>
                    </div>
                  )}
                  {dayData.publishedCount === 0 && dayData.failedCount > 0 && (
                    <div className="w-6 lg:w-[36px] h-5 lg:h-6 bg-[#18191B] rounded flex items-center justify-center">
                      <span className="text-white text-xs lg:text-sm font-bold">
                        {dayData.failedCount}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* No Content Indicator */}
              {!dayData.hasContent && dayData.isCurrentMonth && (
                <div className="absolute bottom-2 lg:bottom-3 left-1/2 transform -translate-x-1/2">
                  <span className="text-white text-sm font-bold">–</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Radio Button Legend */}
      <div className="flex items-center gap-8 mt-6 px-4">
        <div className="flex items-center gap-3 bg-[#252525] px-6 py-4 rounded-xl">
        <label className="flex items-center gap-3 cursor-pointer">
          {/* <input
            type="radio"
            name="eventType"
            value="published"
            checked={selectedEventType === "published"}
            onChange={(e) => onEventTypeChange?.(e.target.value as "published")}
            className="w-4 h-4 text-[#00BBFF] bg-transparent border-gray-400 focus:ring-[#00BBFF] focus:ring-2"
          /> */}
          <div className="w-5 h-5 bg-white rounded-md"></div>
          <span className="text-white text-xs font-bold">Published events</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          {/* <input
            type="radio"
            name="eventType"
            value="failed"
            checked={selectedEventType === "failed"}
            onChange={(e) => onEventTypeChange?.(e.target.value as "failed")}
            className="w-4 h-4 text-[#00BBFF] bg-transparent border-gray-400 focus:ring-[#00BBFF] focus:ring-2"
          /> */}
          <div className="w-5 h-5 bg-[#18191B] rounded-md"></div>
          <span className="text-white text-xs font-bold">Failed events</span>
        </label>
        </div>
        {/* <label className="flex items-center gap-3 cursor-pointer bg-[#252525] px-4 py-2 rounded-xl">
          <input
            type="radio"
            name="eventType"
            value="all"
            checked={selectedEventType === "all"}
            onChange={(e) => onEventTypeChange?.(e.target.value as "all")}
            className="w-4 h-4 text-[#00BBFF] bg-transparent border-gray-400 focus:ring-[#00BBFF] focus:ring-2"
          />
          <span className="text-white text-xs font-bold">All events</span>
        </label> */}
      </div>
    </div>
  );
};

export default CalendarView;
