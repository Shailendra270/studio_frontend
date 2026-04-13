import React from "react";
import SVGIcon from "../../common/SVGIcon";
import AI_Icon from "../../../assets/svg/AI_Icon.svg";
import FBArrow from "../../../assets/svg/Social_media_Icons/fb_story_arrow.svg";
import FBLikeCircle from "../../../assets/svg/Social_media_Icons/fb_story_like.svg";
import InstaMore from "../../../assets/svg/Social_media_Icons/insta_more.svg";
import InstaLike from "../../../assets/svg/Social_media_Icons/insta_like.svg";

type FacebookStoryPreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  profileName: string;
  thumbnailUrl?: string;
  videoUrl?: string;
};

const FacebookStoryPreviewModal: React.FC<FacebookStoryPreviewModalProps> = ({ isOpen, onClose, profileName, thumbnailUrl, videoUrl }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/80" />
      <div className="relative bg-[#2F2F31] rounded-[32px] border border-[#434343] w-full max-w-[880px] max-h-[92vh] overflow-hidden">
        <div className="relative px-8 pt-6 pb-2 flex items-center justify-center">
          <h2 className="text-white text-[20px] font-bold">Facebook story preview</h2>
          <button onClick={onClose} className="absolute right-8 top-6 text-white">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 13.913L13.913 0L16 2.087L2.087 16L0 13.913Z" fill="currentColor"/><path d="M16 13.913L2.087 0L0 2.087L13.913 16L16 13.913Z" fill="currentColor"/></svg>
          </button>
        </div>
        <div className="px-8 pb-8">
          <div className="mx-auto w-[360px] h-[640px] bg-black rounded-md shadow-xl relative overflow-hidden border border-black">
            <div className="absolute top-4 left-3 right-3 flex items-center z-20">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center">
                  <SVGIcon src={AI_Icon} className="w-5 h-5" aria-label="Avatar" />
                </div>
                <span className="text-white text-sm font-semibold">{profileName || "Your account"}</span>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <SVGIcon src={InstaMore} className="w-4 h-4 text-white" />
                <button onClick={onClose} className="text-white">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 13.913L13.913 0L16 2.087L2.087 16L0 13.913Z" fill="currentColor"/><path d="M16 13.913L2.087 0L0 2.087L13.913 16L16 13.913Z" fill="currentColor"/></svg>
                </button>
              </div>
            </div>
            <div className="absolute inset-0">
              {videoUrl ? (
                <video src={videoUrl} autoPlay className="w-full h-full object-cover" />
              ) : thumbnailUrl ? (
                <img src={thumbnailUrl} alt="Story" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#222]" />
              )}
            </div>
            <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 z-10">
                <SVGIcon src={FBArrow} className="w-12 h-10" />
              <div className="flex items-center gap-2 bg-white/25 backdrop-blur rounded-full px-8 py-3">
                <span className="text-white text-xm">Send message</span>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <SVGIcon src={FBLikeCircle} className="w-9 h-9" />
                <div className="w-9 h-9 rounded-full bg-white/20 border border-white/40 flex items-center justify-center">
                  <SVGIcon src={InstaLike} className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacebookStoryPreviewModal;
