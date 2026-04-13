import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import SportsDropdown from "@/components/common/SportsDropdown";

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PlayerFormData) => void;
  defaultSport?: string;
}

interface PlayerFormData {
  sport: string;
  playerName: string;
}

const AddPlayerModal: React.FC<AddPlayerModalProps> = ({ isOpen, onClose, onSubmit, defaultSport }) => {
  const [formData, setFormData] = useState<PlayerFormData>({
    sport: defaultSport || "",
    playerName: "",
  });

  // Keep sport in sync if defaultSport changes while modal is open
  React.useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({ ...prev, sport: defaultSport || prev.sport || "" }));
    }
  }, [defaultSport, isOpen]);

  // Ensure player name clears whenever modal closes (including parent-driven closes)
  React.useEffect(() => {
    if (!isOpen) {
      setFormData(prev => ({ ...prev, playerName: "" }));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (formData.sport && formData.playerName) {
      // Do not close here; parent closes on successful submit
      onSubmit(formData);
    }
  };

  const handleClose = () => {
    setFormData(prev => ({ ...prev, playerName: "" }));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-90"></div>

      <div className="relative w-[630px] bg-black border-2 border-[#373737] rounded-[50px] z-10">
        <div className="relative px-8 py-8 border-b border-[#373737]">
          <h2 className="text-[28px] font-medium text-white text-center font-montserrat">Add player</h2>
          <button onClick={handleClose} className="absolute right-8 top-8 text-white hover:text-gray-400 transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.000147593 13.9131L13.9131 0.000630463L16 2.0875L2.08709 16L0.000147593 13.9131Z" fill="white"/>
              <path d="M15.9999 13.9125L2.08694 0L0 2.08687L13.9129 15.9994L15.9999 13.9125Z" fill="white"/>
            </svg>
          </button>
        </div>

        <div className="px-16 py-8 space-y-8">
          <div>
            <label className="block text-white text-sm font-medium mb-2">Sport</label>
            <div className="relative">
              <SportsDropdown
                mode="field"
                value={formData.sport}
                onChange={(val: string | string[]) => {
                  const v = Array.isArray(val) ? val[0] : val;
                  setFormData({ ...formData, sport: v || "" });
                }}
                multiple={false}
                placeholder="Sport selector"
              />
            </div>
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">Player name</label>
            <input
              type="text"
              value={formData.playerName}
              onChange={(e) => setFormData({ ...formData, playerName: e.target.value })}
              placeholder="Enter player name"
              className="w-full h-[50px] px-4 bg-[#252525] border-none rounded-xl text-white text-base font-medium placeholder-[#707070] focus:outline-none focus:ring-2 focus:ring-[#00BBFF]"
            />
          </div>

          {/* Jersey number removed as per requirements */}
        </div>

        <div className="px-16 pb-12 pt-4 flex items-center justify-center gap-5">
          <Button onClick={handleClose} className="w-[160px] h-[42px] bg-[#1B1B1B] border-none text-white text-sm font-medium rounded-xl hover:bg-[#252525] transition-colors">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.sport || !formData.playerName}
            className={`w-[160px] h-[42px] text-white text-sm font-medium rounded-xl transition-colors ${
              formData.sport && formData.playerName
                ? "bg-gradient-to-r from-[#0BF] to-[#0051FF] hover:opacity-90"
                : "bg-[#373737] text-[#707070] cursor-not-allowed"
            }`}
          >
            Add player
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddPlayerModal;