import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SocialProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { profileTitle: string }) => void;
  initialData?: { profileTitle: string } | null;
}

const SocialProfileModal: React.FC<SocialProfileModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [profileTitle, setProfileTitle] = useState("");

  useEffect(() => {
    if (isOpen) {
      setProfileTitle(initialData?.profileTitle || "");
    }
  }, [isOpen, initialData]);

  const handleSubmit = () => {
    if (!profileTitle.trim()) return;
    onSubmit({ profileTitle: profileTitle.trim() });
    handleClose();
  };

  const handleClose = () => {
    setProfileTitle("");
    onClose();
  };

  if (!isOpen) return null;

  const isEditMode = !!initialData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black opacity-90"
        onClick={handleClose}
      ></div>
      
      {/* Modal Container */}
      <div className="relative w-[500px] bg-black border-2 border-[#373737] rounded-[30px] z-10 overflow-hidden">
        {/* Header */}
        <div className="relative px-8 py-6 border-b border-[#373737]">
          <h2 className="text-[24px] font-medium text-white text-center font-montserrat">
            {isEditMode ? "Edit social Profile" : "Add social Profile"}
          </h2>
          <button 
            onClick={handleClose} 
            className="absolute right-6 top-6 text-white hover:text-gray-400 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.000147593 13.9131L13.9131 0.000630463L16 2.0875L2.08709 16L0.000147593 13.9131Z" fill="white"/>
              <path d="M15.9999 13.9125L2.08694 0L0 2.08687L13.9129 15.9994L15.9999 13.9125Z" fill="white"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-8 space-y-6">
          <div>
            <label className="block text-white text-sm font-medium mb-2">Profile Title</label>
            <Input
              value={profileTitle}
              onChange={(e) => setProfileTitle(e.target.value)}
              placeholder="Enter profile title"
              className="w-full h-[50px] px-4 bg-[#252525] border-none rounded-xl text-white text-base font-medium placeholder-[#707070] focus:outline-none focus:ring-2 focus:ring-[#00BBFF]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 flex items-center justify-center gap-4">
          <Button 
            onClick={handleClose} 
            className="w-[140px] h-[42px] bg-[#1B1B1B] border-none text-white text-sm font-medium rounded-xl hover:bg-[#252525] transition-colors"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!profileTitle.trim()}
            className={`w-[140px] h-[42px] text-white text-sm font-medium rounded-xl transition-colors ${
              profileTitle.trim()
                ? "bg-gradient-to-r from-[#0BF] to-[#0051FF] hover:opacity-90"
                : "bg-[#373737] text-[#707070] cursor-not-allowed"
            }`}
          >
            {isEditMode ? "Update" : "Add"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SocialProfileModal;
