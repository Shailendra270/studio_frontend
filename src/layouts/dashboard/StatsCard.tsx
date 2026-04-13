import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import SVGIcon from "@/components/common/SVGIcon";
import totalVideosIcon from "@/assets/svg/dashBoard_StatsIcon/total-videos-icon.svg";
import liveStreamsIcon from "@/assets/svg/dashBoard_StatsIcon/live-streams-icon.svg";
import completedVideosIcon from "@/assets/svg/dashBoard_StatsIcon/completed-videos-icon.svg";
import highlightsIcon from "@/assets/svg/dashBoard_StatsIcon/highlights-icon.svg";
import publishedIcon from "@/assets/svg/dashBoard_StatsIcon/published-icon.svg";

interface StatsCardProps {
  label: string;
  value: string;
  iconType: string;
  color: string;
}

const getIcon = (iconType: string) => {
  switch (iconType) {
    case "total-videos":
      return <SVGIcon src={totalVideosIcon} className="w-[22px] h-[16px]" />;
    case "live-streams":
      return <SVGIcon src={liveStreamsIcon} className="w-[22px] h-[16px]" />;
    case "completed-videos":
      return <SVGIcon src={completedVideosIcon} className="w-[22px] h-[16px]" />;
    case "highlights":
      return <SVGIcon src={highlightsIcon} className="w-[22px] h-[16px]" />;
    case "published":
      return <SVGIcon src={publishedIcon} className="w-[22px] h-[19px]" />;
    default:
      return <SVGIcon src={totalVideosIcon} className="w-[22px] h-[16px]" />;
  }
};

const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  iconType,
  color,
}) => {
  return (
    <Card
      className="bg-[#252525] border-none hover:bg-[#2A2B2E] transition-colors"
      style={{ borderRadius: "12px" }}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white mb-1">{label}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
          <div className={color}>{getIcon(iconType)}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
