import React from "react";
import SVGIcon from "../../common/SVGIcon";
import AI_Icon from "../../../assets/svg/AI_Icon.svg";
import YLike from "../../../assets/svg/Social_media_Icons/youtube_like.svg";
import YDislike from "../../../assets/svg/Social_media_Icons/youtube_dislike.svg";
import YComment from "../../../assets/svg/Social_media_Icons/youtube_comment.svg";
import YShare from "../../../assets/svg/Social_media_Icons/youtube_share.svg";
import YRemix from "../../../assets/svg/Social_media_Icons/youtube_remix.svg";

type YouTubeShortsPreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  profileName: string;
  thumbnailUrl?: string;
  description?: string;
  tags?: string[];
  videoUrl?: string;
};

const YouTubeShortsPreviewModal: React.FC<YouTubeShortsPreviewModalProps> = ({ isOpen, onClose, profileName, thumbnailUrl, description, tags, videoUrl }) => {
  if (!isOpen) return null;
  const text = (description || '') + (tags && tags.length ? ` ${tags.join(' ')}` : '');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/80" />
      <div className="relative bg-[#2F2F31] rounded-[32px] border border-[#434343] w-full max-w-[880px] max-h-[92vh] overflow-hidden">
        <div className="relative px-8 pt-6 pb-2 flex items-center justify-center">
          <h2 className="text-white text-[20px] font-bold">Youtube shorts preview</h2>
          <button onClick={onClose} className="absolute right-8 top-6 text-white">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 13.913L13.913 0L16 2.087L2.087 16L0 13.913Z" fill="currentColor"/><path d="M16 13.913L2.087 0L0 2.087L13.913 16L16 13.913Z" fill="currentColor"/></svg>
          </button>
        </div>
        <div className="px-8 pb-8">
          <div className="mx-auto w-[360px] h-[640px] bg-black rounded-md shadow-xl relative overflow-hidden">
            <div className="absolute inset-0">
              {videoUrl ? (
                <video src={videoUrl} autoPlay className="w-full h-full object-cover" />
              ) : thumbnailUrl ? (
                <img src={thumbnailUrl} alt="Short" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#222]" />
              )}
            </div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
              <div className="flex flex-col items-center gap-1 text-white">
                <SVGIcon src={YLike} className="w-7 h-7" />
                <span className="text-[11px] opacity-80">Like</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-white">
                <SVGIcon src={YDislike} className="w-7 h-7" />
                <span className="text-[11px] opacity-80">Dislike</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-white">
                <SVGIcon src={YComment} className="w-7 h-7" />
                <span className="text-[11px] opacity-80">106</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-white">
                <SVGIcon src={YShare} className="w-7 h-7" />
                <span className="text-[11px] opacity-80">Share</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-white">
                <SVGIcon src={YRemix} className="w-7 h-7" />
                <span className="text-[11px] opacity-80">Remix</span>
              </div>
            </div>
            <div className="absolute left-3 bottom-4 right-16 text-white">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center"><SVGIcon src={AI_Icon} className="w-4 h-4" /></div>
                <span className="text-[16px] opacity-90">@your_account</span>
                <span className="text-[11px] bg-white text-black rounded px-2 py-0.5">Subscribe</span>
              </div>
              <div className="text-[14px] mt-2 opacity-90">{text}</div>
              <div className="text-[14px] mt-2 opacity-80 flex items-center gap-2"><span>♬</span><span>Original Sound</span></div>
            </div>
            <div className="absolute bottom-3 right-3 w-8 h-8 rounded-md bg-white/30" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouTubeShortsPreviewModal;

