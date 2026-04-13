import { Download, Link, Save } from "lucide-react";
import React from "react";
import SVGIcon from '@/components/common/SVGIcon';
import SparkleGradient from '@/assets/svg/SparkleGradient.svg';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
interface EditorHeaderProps {
  type: string,
  data: {},
  highlightName: string;
  aspectRatio: string;
  onBack: () => void;
  onDownload: () => void;
  onPreview?: () => void;
  onCopyLink?: () => void;
  onSaveAsClip?: () => void;
  isAiCreated?: boolean;
  isPreviewAvailable?: boolean;
  showControls?: boolean;
}

const EditorHeader: React.FC<EditorHeaderProps> = ({
  type,
  data,
  highlightName,
  aspectRatio,
  onBack,
  onDownload,
  onPreview,
  onCopyLink,
  onSaveAsClip,
  isAiCreated = false,
  isPreviewAvailable = false,
  showControls = false
}) => {

  const truncateText = (text: string | undefined | null, maxLength: number = 25) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Check if buttons should be disabled
  const isHighlightWithoutPreview = type === 'highlight' && !(data as any)?.previewUrl;
  const isClipWithoutPreview = type === 'clip' && !isPreviewAvailable;
  const previewDisabled = isHighlightWithoutPreview || isClipWithoutPreview;

  return (
      <div className="bg-[#18191B] border-b border-[#252525] w-full">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-6 py-4 min-h-[58px] gap-4">
          {/* Left side - Back button and title */}
          <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto">
            <button
              onClick={onBack}
              className="text-white hover:text-gray-300 transition-colors flex items-center justify-center w-8 h-8"
            >
              <svg
                width="8"
                height="13"
                viewBox="0 0 8 13"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2.83125 6.364L7.78125 1.414L6.36725 0L0.00325012 6.364L6.36725 12.728L7.78125 11.314L2.83125 6.364Z"
                  fill="currentColor"
                />
              </svg>
            </button>

            <div className="flex items-center gap-3">
              {/* AI Sparkle Icon */}
              {isAiCreated && (
                <SVGIcon src={SparkleGradient} className="w-5 h-5" aria-label="AI Created" />
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <h1 className="text-lg md:text-xl lg:text-2xl font-medium text-white leading-none mt-3"> {truncateText(data?.title, 25)}</h1>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{data?.title}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Right side - Controls */}
          {showControls && (
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Aspect Ratio */}
            <div className="bg-[#252525] rounded-xl px-4 py-3 w-[54px] h-[42px] flex items-center justify-center">
              <span className="text-white text-base font-medium">
                {aspectRatio}
              </span>
            </div>

            {/* Preview Button */}
            <button
              className={`rounded-xl px-4 py-3 w-[84px] h-[42px] flex items-center justify-center transition-colors ${previewDisabled
                  ? 'bg-[#1a1a1a] cursor-not-allowed'
                  : 'bg-[#252525] hover:bg-[#3A3B3E] cursor-pointer'
                }`}
              onClick={previewDisabled ? undefined : onPreview}
              disabled={previewDisabled}
              title={previewDisabled ? 'Preview not available' : 'Preview'}
            >
              <span className={`text-base font-medium ${previewDisabled ? 'text-gray-500' : 'text-white'
                }`}>
                {"Preview"}
              </span>
            </button>

             {/* Publish Button */}
            {/* <button
              className={`rounded-xl px-4 py-3 w-[74px] h-[42px] flex items-center justify-center transition-colors ${isHighlightWithoutPreview
                  ? 'bg-[#1a1a1a] cursor-not-allowed'
                  : 'bg-[#252525] hover:bg-[#3A3B3E] cursor-pointer'
                }`}
              // onClick={isHighlightWithoutPreview ? undefined : onPreview}
              disabled={isHighlightWithoutPreview}
              title={isHighlightWithoutPreview ? 'Publish' : 'Publish'}
            >
              <span className={`text-base font-medium ${isHighlightWithoutPreview ? 'text-gray-500' : 'text-white'
                }`}>
                {"Publish"}
              </span>
            </button> */}

            {/* Download Button */}
            <button
              className={`p-3 rounded-xl transition-colors w-[42px] h-[42px] flex items-center justify-center ${isHighlightWithoutPreview
                  ? 'bg-[#1a1a1a] cursor-not-allowed'
                  : 'bg-[#252525] hover:bg-[#3A3B3E] cursor-pointer'
                }`}
              onClick={isHighlightWithoutPreview ? undefined : onDownload}
              disabled={isHighlightWithoutPreview}
              title="Download"
            >
              <Download
                size={18}
                color={isHighlightWithoutPreview ? '#6b7280' : 'white'}
                className="w-[22px] h-[22px]"
              />
            </button>

           {/* Save as New Button */}
            <button
             onClick={previewDisabled ? undefined : onSaveAsClip}
              disabled={previewDisabled}
              title="Save as clip">
              <Save
                size={18}
                color={previewDisabled ? '#6b7280' : 'white'}
                className={`p-3 rounded-xl transition-colors w-[42px] h-[42px] flex items-center justify-center ${previewDisabled
                  ? 'bg-[#1a1a1a] cursor-not-allowed'
                  : 'bg-[#252525] hover:bg-[#3A3B3E] cursor-pointer'
                }`}
              />
            </button>

            {/* Copy Link Button */}
            <button
              className={`p-3 rounded-xl transition-colors w-[42px] h-[42px] flex items-center justify-center ${previewDisabled
                  ? 'bg-[#1a1a1a] cursor-not-allowed'
                  : 'bg-[#252525] hover:bg-[#3A3B3E] cursor-pointer'
                }`}
              onClick={previewDisabled ? undefined : onCopyLink}
              disabled={previewDisabled}
              title="Copy Link"
            >
               <Link
                size={18}
                color={previewDisabled ? '#6b7280' : 'white'}
              />
            </button>
          </div>
          )}
        </div>
      </div>
  );
};

export default EditorHeader;
