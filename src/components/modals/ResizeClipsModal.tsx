import React from "react";
import { AUTOFLIP_SUPPORTED_CATEGORIES } from '@/constants/autoflip';

type ResizeClipsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  aspectRatio: string;
  category?: string;
  onAutoFlip?: () => void;
  onCenterCrop?: () => void;
};

const ResizeClipsModal: React.FC<ResizeClipsModalProps> = ({ isOpen, onClose, aspectRatio, category, onAutoFlip, onCenterCrop }) => {
  if (!isOpen) return null;
  const cat = (category || '').toLowerCase();
  const showAutoFlip = AUTOFLIP_SUPPORTED_CATEGORIES.includes(cat);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative bg-[#2F2F31] rounded-2xl border border-[#434343] w-full max-w-[600px] overflow-hidden">
        <div className="px-6 py-4 flex items-center">
          <h2 className="text-white text-[18px] font-semibold">Resize clips to {aspectRatio}</h2>
          <button onClick={onClose} className="ml-auto text-white/80 hover:text-white">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 13.913L13.913 0L16 2.087L2.087 16L0 13.913Z" fill="currentColor"/><path d="M16 13.913L2.087 0L0 2.087L13.913 16L16 13.913Z" fill="currentColor"/></svg>
          </button>
        </div>
        <div className="px-6 pb-4">
          <div className="bg-[#3A2F2F] rounded-xl p-4 border border-[#7A4F4F]">
            <div className="flex items-center gap-2 text-white">
              <span className="inline-flex w-5 h-5 items-center justify-center rounded bg-[#FF7A7A] text-black font-bold">?</span>
              <span className="font-semibold">Resizing clips</span>
            </div>
            <p className="text-white/80 text-sm mt-2">Clips are not in sync with the highlight aspect ratio ({aspectRatio})</p>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            {/* {showAutoFlip && (
              <button className="bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white px-4 py-2 rounded-lg hover:opacity-90" onClick={onAutoFlip}>Auto-flip</button>
            )} */}
            <button className="bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white px-4 py-2 rounded-lg hover:opacity-90" onClick={onCenterCrop}>Center-crop</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResizeClipsModal;

