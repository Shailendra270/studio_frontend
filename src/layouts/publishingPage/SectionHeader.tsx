import React from 'react';
import SVGIcon from '@/components/common/SVGIcon';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  expanded?: boolean;
  onClick?: () => void;
  className?: string;
  iconSrc?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, expanded, onClick, className, iconSrc }) => {
  return (
    <button
      className={`w-full h-[52px] bg-[#252525] rounded-xl px-4 flex items-center justify-between text-white ${className ?? ''}`}
      onClick={onClick}
      aria-expanded={!!expanded}
    >
      <span className="text-lg font-medium flex items-center gap-2">
        {iconSrc && <SVGIcon src={iconSrc} className="w-4 h-4" />}
        {title}
      </span>
      {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
    </button>
  );
};

export default SectionHeader;
