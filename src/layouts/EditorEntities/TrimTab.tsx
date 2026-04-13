import React, { useState } from "react";
import { useAppDispatch } from "@/store";
import { setTrimOverrides } from "@/store/slices/clipsSlice";
import GradientRailSlider from "@/components/ui/gradient-rail-slider";
import { validateStartTimeOnSeconds, validateEndTimeOnSeconds, secondPattern, isSameOrBefore } from "@/utils/validations.tsx";

interface TrimTabProps {
  activeClip: {
    id: string;
    title: string;
    duration: string;
    aspectRatio: string;
    thumbnail: string;
    timestamp: string;
    tags: string[];
    rating: number;
    date: string;
    time: string;
    start_time?: string;
    end_time?: string;
  };
}

const TrimTab: React.FC<TrimTabProps> = ({ activeClip }) => {
  const dispatch = useAppDispatch();
  const [startTime, setStartTime] = useState(activeClip?.start_time || "00:00:00");
  const [endTime, setEndTime] = useState(activeClip?.end_time || "00:00:00");
  const [speed, setSpeed] = useState(1);
  const [startError, setStartError] = useState("");
  const [endError, setEndError] = useState("");
  const [startTouched, setStartTouched] = useState(false);
  const [endTouched, setEndTouched] = useState(false);

  // Calculate duration based on start and end times
  const calculateDuration = (start: string, end: string) => {
    // Convert time strings to seconds for calculation
    const parseTime = (timeStr: string) => {
      if (!secondPattern.test(timeStr)) return NaN;
      const [hours, minutes, seconds] = timeStr.split(':').map(Number);
      return hours * 3600 + minutes * 60 + seconds;
    };

    const startSeconds = parseTime(start);
    const endSeconds = parseTime(end);
    const durationSeconds = isNaN(startSeconds) || isNaN(endSeconds) || !isSameOrBefore(start, end) ? 0 : endSeconds - startSeconds;

    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  const duration = calculateDuration(startTime, endTime);

  React.useEffect(() => {
    if (startTouched) {
      setStartError(validateStartTimeOnSeconds(startTime, endTime, true));
    }
    if (endTouched) {
      setEndError(validateEndTimeOnSeconds(endTime));
    }
  }, [startTime, endTime, startTouched, endTouched]);

  React.useEffect(() => {
    const s = (activeClip as any)?.start_time;
    const e = (activeClip as any)?.end_time;
    if (typeof s === 'string' && s.trim()) setStartTime(s);
    if (typeof e === 'string' && e.trim()) setEndTime(e);
    dispatch(setTrimOverrides({ start: s || null, end: e || null, streamUrl: (activeClip as any)?.url || null }));
    setStartTouched(false);
    setEndTouched(false);
    setStartError("");
    setEndError("");
  }, [activeClip?.id]);

  const handleSpeedChange = (value: number) => {
    setSpeed(value);
  };

  const getSpeedMultiplier = () => {
    return `${speed}x`;
  };

  return (
    <div className="p-6 text-white space-y-8">
      {/* Trim Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-white">Trim</h3>

        {/* Time Controls */}
        <div className="flex items-center gap-4">
          {/* Start Time */}
          <div className="flex-1 min-w-0 flex flex-col">
            <input
              type="text"
              value={startTime}
              onChange={(e) => {
                setStartTime(e.target.value);
                if (startTouched) {
                  setStartError(validateStartTimeOnSeconds(e.target.value, endTime, true));
                } else {
                  setStartError("");
                }
              }}
              onBlur={(e) => {
                const v = e.target.value;
                setStartTouched(true);
                setStartError(validateStartTimeOnSeconds(v, endTime, true));
                if (!validateStartTimeOnSeconds(v, endTime, true)) {
                  dispatch(setTrimOverrides({ start: v }));
                }
              }}
              className={`w-full h-9 px-4 bg-[#252525] border rounded-lg text-white text-center font-medium text-base focus:outline-none ${startError ? "focus:ring-1 focus:ring-red-500 border-red-500" : "focus:ring-1 focus:ring-[#00BBFF] border-white"}`}
              placeholder="01:11:10"
            />
            <div className="h-4 mt-1 text-xs">
              {startError && <span className="text-red-500">{startError}</span>}
            </div>
          </div>

          {/* Duration Display */}
          <div className="px-4 mb-4">
            <span className="text-white font-bold text-base">{duration}</span>
          </div>

          {/* End Time */}
          <div className="flex-1 min-w-0 flex flex-col">
            <input
              type="text"
              value={endTime}
              onChange={(e) => {
                setEndTime(e.target.value);
                if (endTouched) {
                  setEndError(validateEndTimeOnSeconds(e.target.value));
                } else {
                  setEndError("");
                }
              }}
              onBlur={(e) => {
                const v = e.target.value;
                setEndTouched(true);
                setEndError(validateEndTimeOnSeconds(v));
                if (!validateEndTimeOnSeconds(v)) {
                  dispatch(setTrimOverrides({ end: v }));
                }
              }}
              className={`w-full h-9 px-4 bg-[#252525] border rounded-lg text-white text-center font-medium text-base focus:outline-none ${endError ? "focus:ring-1 focus:ring-red-500 border-red-500" : "focus:ring-1 focus:ring-[#00BBFF] border-white"}`}
              placeholder="01:13:00"
            />
            <div className="h-4 mt-1 text-xs">
              {endError && <span className="text-red-500">{endError}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Speed Control */}
      <GradientRailSlider
        label="Speed"
        min={0.25}
        max={2}
        step={0.25}
        value={speed}
        onChange={handleSpeedChange}
        formatValue={(v) => `${v}x`}
        railWidth={300}
        height={40}
        pillWidth={48}
      />

    </div>
  );
};

export default TrimTab;
