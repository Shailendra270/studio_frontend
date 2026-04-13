import React from "react";
import SVGIcon from "../../common/SVGIcon";
import AI_Icon from "../../../assets/svg/AI_Icon.svg";
import InstaLike from "../../../assets/svg/Social_media_Icons/insta_like.svg";
import InstaComment from "../../../assets/svg/Social_media_Icons/insta_comment.svg";
import InstaShare from "../../../assets/svg/Social_media_Icons/insta_share.svg";
import InstaMore from "../../../assets/svg/Social_media_Icons/insta_more.svg";

type InstagramReelPreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  profileName: string;
  thumbnailUrl?: string;
  description: string;
  tags: string[];
  videoUrl?: string;
};

const InstagramReelPreviewModal: React.FC<InstagramReelPreviewModalProps> = ({ isOpen, onClose, profileName, thumbnailUrl, description, tags, videoUrl }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/80" />
      <div className="relative bg-[#2F2F31] rounded-[32px] border border-[#434343] w-full max-w-[880px] max-h-[92vh] overflow-hidden">
        <div className="relative px-8 pt-6 pb-2 flex items-center justify-center">
          <h2 className="text-white text-[20px] font-bold">Instagram reel preview</h2>
          <button onClick={onClose} className="absolute right-8 top-6 text-white">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 13.913L13.913 0L16 2.087L2.087 16L0 13.913Z" fill="currentColor"/><path d="M16 13.913L2.087 0L0 2.087L13.913 16L16 13.913Z" fill="currentColor"/></svg>
          </button>
        </div>
        <div className="px-8 pb-8">
          <div className="mx-auto w-[360px] h-[640px] bg-[#111] rounded-md shadow-xl relative overflow-hidden">
            <div className="absolute top-2 left-3 text-white text-xs font-semibold z-10">Reels</div>
            <div className="absolute top-2 right-3 text-white z-10"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C14.209 0 16 1.791 16 4V12C16 14.209 14.209 16 12 16H4C1.791 16 0 14.209 0 12V4C0 1.791 1.791 0 4 0H12ZM8 4C5.791 4 4 5.791 4 8C4 10.209 5.791 12 8 12C10.209 12 12 10.209 12 8C12 5.791 10.209 4 8 4ZM13 2C12.448 2 12 2.448 12 3C12 3.552 12.448 4 13 4C13.552 4 14 3.552 14 3C14 2.448 13.552 2 13 2Z" fill="white"/></svg></div>
            <div className="absolute inset-0">
              {videoUrl ? (
                <video src={videoUrl} autoPlay className="w-full h-full object-cover" />
              ) : thumbnailUrl ? (
                <img src={thumbnailUrl} alt="Reel" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#222]" />
              )}
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/8 flex flex-col items-center text-white">
              <div className="flex flex-col items-center gap-6">
                <SVGIcon src={InstaLike} className="w-5 h-5" />
                <SVGIcon src={InstaComment} className="w-5 h-5" />
                <SVGIcon src={InstaShare} className="w-5 h-5" />
              </div>
              <SVGIcon src={InstaMore} className="w-5 h-5 mt-6" />
            </div>
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center"><SVGIcon src={AI_Icon} className="w-4 h-4" aria-label="Avatar" /></div>
                <span className="text-xs">Your account</span>
                <span className="text-xs ml-2 px-2 py-[2px] rounded bg-white text-black">Follow</span>
              </div>
              <p className="text-xs truncate">{description} {tags.map((t, i) => (
                  <span key={i} className="text-[12px]">{t}</span>
                ))}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstagramReelPreviewModal;
