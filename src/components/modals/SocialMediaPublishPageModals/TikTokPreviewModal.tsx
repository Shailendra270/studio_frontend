import React from "react";
import SVGIcon from "../../common/SVGIcon";
import AI_Icon from "../../../assets/svg/AI_Icon.svg";
import TikHeart from "../../../assets/svg/Social_media_Icons/tiktok_heart.svg";
import TikComment from "../../../assets/svg/Social_media_Icons/tiktok_comment.svg";
import TikShare from "../../../assets/svg/Social_media_Icons/tiktok_share.svg";

type TikTokPreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  profileName: string;
  thumbnailUrl?: string;
  description?: string;
  tags?: string[];
  videoUrl?: string;
};

const TikTokPreviewModal: React.FC<TikTokPreviewModalProps> = ({ isOpen, onClose, profileName, thumbnailUrl, description, tags, videoUrl }) => {
  if (!isOpen) return null;
  const text = (description || '') + (tags && tags.length ? ` ${tags.join(' ')}` : '');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/80" />
      <div className="relative bg-[#2F2F31] rounded-[32px] border border-[#434343] w-full max-w-[880px] max-h-[92vh] overflow-hidden">
        <div className="relative px-8 pt-6 pb-2 flex items-center justify-center">
          <h2 className="text-white text-[20px] font-bold">TikTok story preview</h2>
          <button onClick={onClose} className="absolute right-8 top-6 text-white">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 13.913L13.913 0L16 2.087L2.087 16L0 13.913Z" fill="currentColor"/><path d="M16 13.913L2.087 0L0 2.087L13.913 16L16 13.913Z" fill="currentColor"/></svg>
          </button>
        </div>
        <div className="px-8 pb-8">
          <div className="mx-auto w-[360px] h-[640px] bg-black rounded-md shadow-xl relative overflow-hidden">
            <div className="absolute top-1 left-0 right-0 text-center text-white text-[11px] z-10">Following  For You</div>
            <div className="absolute inset-0">
              {videoUrl ? (
                <video src={videoUrl} autoPlay className="w-full h-full object-cover" />
              ) : thumbnailUrl ? (
                <img src={thumbnailUrl} alt="Story" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#222]" />
              )}
            </div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-6">
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow">
                <SVGIcon src={AI_Icon} className="w-5 h-5" />
              </div>
              <SVGIcon src={TikHeart} className="w-9 h-9" />
              <SVGIcon src={TikComment} className="w-9 h-9" />
              <div className="flex flex-col items-center">
                <SVGIcon src={TikShare} className="w-9 h-9" />
                <span className="text-white text-[10px] mt-1">Share</span>
              </div>
            </div>
            <div className="absolute left-4 bottom-6 right-12 text-white">
              <div className="text-[18px]">@your_account</div>
              <div className="text-[14px] mt-2 opacity-90">{text}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TikTokPreviewModal;
