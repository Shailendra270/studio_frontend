import { X } from "lucide-react";
import React from "react";

type SaveStep = "choice" | "new";

interface SaveAsClipModalProps {
  isOpen: boolean;
  onClose: () => void;
  step: SaveStep;
  onChangeStep: (step: SaveStep) => void;
  currentTitle?: string;
  streamId?: string;
  aspectRatio?: string;
  newTitle: string;
  onChangeTitle: (value: string) => void;
  onOverwrite: () => void;
  onSaveNew: () => void;
}

const SaveAsClipModal: React.FC<SaveAsClipModalProps> = ({
  isOpen,
  onClose,
  step,
  onChangeStep,
  currentTitle,
  streamId,
  aspectRatio,
  newTitle,
  onChangeTitle,
  onOverwrite,
  onSaveNew,
}) => {
  if (!isOpen) return null;

  // Handle overlay click to close modal
  const handleClose = () => {
    onChangeTitle("");
    onClose();
  };
  const handleSaveNew = () => {
    onSaveNew();
    onChangeTitle("");
  };
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleOverlayClick}>
      <div className="absolute inset-0 bg-black bg-opacity-60" />
      <div className="relative bg-[#252525] rounded-2xl w-full max-w-md p-6 border border-[#3a3a3a]" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={handleClose}
          className="absolute right-8 top-8 text-white hover:text-gray-300 transition-colors"
        >
          <X size={20} />
        </button>
        <h3 className="text-white text-lg font-semibold mb-4">Save As Clip</h3>
        {step === "choice" ? (
          <>
            <p className="text-gray-300 text-sm mb-6">Do you wish to overwrite the clip or save it as a new clip?</p>
            <div className="flex justify-end gap-3">
              <button className="bg-[#3A3B3E] text-white rounded-xl px-4 py-2" onClick={onOverwrite}>Overwrite</button>
              <button className="bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white rounded-xl px-4 py-2" onClick={() => onChangeStep("new")}>Save as New</button>
            </div>
          </>
        ) : (
          <>
            <label className="block text-white text-sm font-medium mb-2">Title *</label>
            <input className="w-full h-10 px-3 rounded-xl bg-[#18191B] border border-[#3a3a3a] text-white mb-3" value={newTitle} onChange={(e) => onChangeTitle(e.target.value)} placeholder="Enter title" />
            <p className="text-gray-400 text-xs mb-6">Current Title - {currentTitle} | StreamId - {streamId} {aspectRatio ? `| Aspect Ratio - ${aspectRatio}` : ''}</p>
            <div className="flex justify-end gap-3">
              <button className="bg-[#3A3B3E] text-white rounded-xl px-4 py-2" onClick={handleClose}>Close</button>
              <button className="bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white rounded-xl px-4 py-2" onClick={handleSaveNew}>Save</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(SaveAsClipModal, (prev, next) => {
  return (
    prev.isOpen === next.isOpen &&
    prev.step === next.step &&
    prev.currentTitle === next.currentTitle &&
    prev.streamId === next.streamId &&
    prev.aspectRatio === next.aspectRatio &&
    prev.newTitle === next.newTitle &&
    prev.onClose === next.onClose &&
    prev.onOverwrite === next.onOverwrite &&
    prev.onSaveNew === next.onSaveNew
  );
});
