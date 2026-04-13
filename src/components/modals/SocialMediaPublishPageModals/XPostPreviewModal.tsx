import React from "react";
import SVGIcon from "../../common/SVGIcon";
import AI_Icon from "../../../assets/svg/AI_Icon.svg";
import XComment from "../../../assets/svg/Social_media_Icons/x_comment.svg";
import XRetweetL from "../../../assets/svg/Social_media_Icons/x_retweet_left.svg";
import XRetweetR from "../../../assets/svg/Social_media_Icons/x_retweet_right.svg";
import XHeart from "../../../assets/svg/Social_media_Icons/x_heart.svg";
import XBarchart from "../../../assets/svg/Social_media_Icons/x_barchart.svg";
import XBookmark from "../../../assets/svg/Social_media_Icons/x_bookmark.svg";

type XPostPreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  profileName: string;
  thumbnailUrl?: string;
  description?: string;
  tags?: string[];
  mediaType?: 'VIDEO' | 'IMAGE';
  videoUrl?: string;
};

const XPostPreviewModal: React.FC<XPostPreviewModalProps> = ({ isOpen, onClose, profileName, thumbnailUrl, description, tags, mediaType, videoUrl }) => {
  if (!isOpen) return null;
  const text = (description || '') + (tags && tags.length ? ` ${tags.join(' ')}` : '');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/80" />
      <div className="relative bg-[#2F2F31] rounded-[32px] border border-[#434343] w-full max-w-[880px] max-h-[92vh] overflow-hidden">
        <div className="relative px-8 pt-6 pb-2 flex items-center justify-center">
          <h2 className="text-white text-[20px] font-bold">X post preview</h2>
          <button onClick={onClose} className="absolute right-8 top-6 text-white">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 13.913L13.913 0L16 2.087L2.087 16L0 13.913Z" fill="currentColor"/><path d="M16 13.913L2.087 0L0 2.087L13.913 16L16 13.913Z" fill="currentColor"/></svg>
          </button>
        </div>
        <div className="px-8 pb-8">
          <div className="mx-auto w-[360px] bg-white rounded-xl shadow-xl">
            <div className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center">
                  <SVGIcon src={AI_Icon} className="w-4 h-4" aria-label="Avatar" />
                </div>
                <div className="flex-1">
                  <div className="text-[13px] text-black font-semibold">{profileName || 'Your account'}</div>
                  <div className="text-[12px] text-black/60">@your_account · Now</div>
                </div>
              </div>
              <div className="text-[13px] text-black mt-3 leading-5">
                {text}
                <div className="text-[12px] text-[#1470FF] mt-1">Show more</div>
              </div>
              <div className="mt-3">
                <div className="rounded-xl overflow-hidden bg-[#eee]">
                  {mediaType === 'VIDEO' && videoUrl ? (
                    <video src={videoUrl} autoPlay className="w-full h-auto rounded-xl" />
                  ) : thumbnailUrl ? (
                    <img src={thumbnailUrl} alt="Post" className="w-full h-auto" />
                  ) : (
                    <div className="w-full h-[220px]" />
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between px-2">
                <SVGIcon src={XComment} className="w-4 h-4" />
                <div className="relative w-6 h-4">
                  <SVGIcon src={XRetweetL} className="absolute left-0 top-0 w-5 h-5" />
                  <SVGIcon src={XRetweetR} className="absolute left-2 top-0 w-5 h-5" />
                </div>
                <SVGIcon src={XHeart} className="w-4 h-4" />
                <SVGIcon src={XBarchart} className="w-4 h-4" />
                <SVGIcon src={XBookmark} className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XPostPreviewModal;
