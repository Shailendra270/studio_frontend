import React from "react";
import SVGIcon from "../../common/SVGIcon";
import AI_Icon from "../../../assets/svg/AI_Icon.svg";
import InstaLike from "../../../assets/svg/Social_media_Icons/insta_like.svg";
import InstaShare from "../../../assets/svg/Social_media_Icons/insta_share.svg";

type InstagramStoryPreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  profileName: string;
  thumbnailUrl?: string;
  videoUrl?: string;
};

const InstagramStoryPreviewModal: React.FC<InstagramStoryPreviewModalProps> = ({ isOpen, onClose, profileName, thumbnailUrl, videoUrl }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/80" />
      <div className="relative bg-[#2F2F31] rounded-[32px] border border-[#434343] w-full max-w-[880px] max-h-[92vh] overflow-hidden">
        <div className="relative px-8 pt-6 pb-2 flex items-center justify-center">
          <h2 className="text-white text-[20px] font-bold">Instagram story preview</h2>
          <button onClick={onClose} className="absolute right-8 top-6 text-white">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 13.913L13.913 0L16 2.087L2.087 16L0 13.913Z" fill="currentColor"/><path d="M16 13.913L2.087 0L0 2.087L13.913 16L16 13.913Z" fill="currentColor"/></svg>
          </button>
        </div>
        <div className="px-8 pb-8">
          <div className="mx-auto w-[360px] h-[640px] bg-[#111] rounded-[10px] border border-white/20 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-20">
              <div className="h-full w-1/3 bg-white" />
            </div>
            <div className="absolute top-5 left-3 right-3 flex items-center z-10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
                  <SVGIcon src={AI_Icon} className="w-4 h-4" aria-label="Avatar" />
                </div>
                <span className="text-white text-xs font-semibold">{profileName || "Your account"}</span>
              </div>
              <button onClick={onClose} className="ml-auto text-white">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 13.913L13.913 0L16 2.087L2.087 16L0 13.913Z" fill="currentColor"/><path d="M16 13.913L2.087 0L0 2.087L13.913 16L16 13.913Z" fill="currentColor"/></svg>
              </button>
            </div>
            <div className="absolute inset-0 z-0">
              {videoUrl ? (
                <video src={videoUrl} autoPlay className="w-full h-full object-cover" />
              ) : thumbnailUrl ? (
                <img src={thumbnailUrl} alt="Story" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#222]" />
              )}
            </div>
            <div className="absolute bottom-4 left-3 right-3 z-10">
              <div className="flex items-center gap-3">
                <input
                  className="flex-1 h-9 bg-[#0F1011]/80 border border-white/30 text-white placeholder:text-white/70 rounded-full px-4 text-xs"
                  placeholder="Send message"
                />
                <div className="flex items-center gap-3 text-white">
                  <SVGIcon src={InstaLike} className="w-5 h-5" />
                  <SVGIcon src={InstaShare} className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstagramStoryPreviewModal;
