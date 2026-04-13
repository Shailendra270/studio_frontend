import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface QuickActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayPause: () => void;
  onMuteToggle: () => void;
  onSeekBackward: () => void;
  onSeekForward: () => void;
  onStartEndCut: () => void;
}

const QuickActionsModal: React.FC<QuickActionsModalProps> = ({
  isOpen,
  onClose,
  onPlayPause,
  onMuteToggle,
  onSeekBackward,
  onSeekForward,
  onStartEndCut
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'Space':
          event.preventDefault();
          onPlayPause();
          break;
        case 'KeyM':
          event.preventDefault();
          onMuteToggle();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          onSeekBackward();
          break;
        case 'ArrowRight':
          event.preventDefault();
          onSeekForward();
          break;
        case 'KeyQ':
          event.preventDefault();
          onStartEndCut();
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onPlayPause, onMuteToggle, onSeekBackward, onSeekForward, onStartEndCut, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-90"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-[1086px] mx-4 sm:mx-6 lg:mx-8">
        <div className="bg-black border-2 border-[#373737] rounded-[50px] p-6 sm:p-8 lg:p-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 sm:mb-10">
            <h2 className="text-white text-2xl sm:text-3xl lg:text-[28px] font-medium font-montserrat text-center flex-1">
              Quick actions
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 transition-colors p-1"
            >
              <X size={16} />
            </button>
          </div>

          {/* Actions Grid */}
          <div className="space-y-6">
            {/* Desktop Layout */}
            <div className="hidden lg:grid lg:grid-cols-4 gap-8">
              {/* Start/End Cut */}
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-[#252525] border border-[#00EEFF] rounded-[5px] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl font-bold font-montserrat">Q</span>
                </div>
                <div className="text-white text-lg font-medium font-montserrat leading-[170%]">
                  Start / End cut
                </div>
              </div>

              {/* Play/Pause */}
              <div className="flex items-center gap-6">
                <div className="w-[90px] h-12 bg-[#252525] border border-[#00EEFF] rounded-[5px] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl font-bold font-montserrat">Space</span>
                </div>
                <div className="text-white text-lg font-medium font-montserrat leading-[170%]">
                  Play / Pause
                </div>
              </div>

              {/* Mute/Unmute */}
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-[#252525] border border-[#00EEFF] rounded-[5px] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl font-bold font-montserrat">M</span>
                </div>
                <div className="text-white text-lg font-medium font-montserrat leading-[170%]">
                  Mute / Unmute
                </div>
              </div>

              {/* Forward/Backward */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-[#252525] border border-[#00EEFF] rounded-[5px] flex items-center justify-center">
                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M0 7L8 0V14L0 7Z" fill="white"/>
                    </svg>
                  </div>
                  <div className="w-12 h-12 bg-[#252525] border border-[#00EEFF] rounded-[5px] flex items-center justify-center">
                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 7L0 0V14L8 7Z" fill="white"/>
                    </svg>
                  </div>
                </div>
                <div className="text-white text-lg font-medium font-montserrat leading-[170%]">
                  - / + 10s
                </div>
              </div>
            </div>

            {/* Tablet Layout */}
            <div className="hidden sm:block lg:hidden">
              <div className="grid grid-cols-2 gap-6">
                {/* Start/End Cut */}
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-[#252525] border border-[#00EEFF] rounded-[5px] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-lg font-bold font-montserrat">Q</span>
                  </div>
                  <div className="text-white text-base font-medium font-montserrat leading-[170%]">
                    Start / End cut
                  </div>
                </div>

                {/* Play/Pause */}
                <div className="flex items-center gap-4">
                  <div className="w-[80px] h-11 bg-[#252525] border border-[#00EEFF] rounded-[5px] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-lg font-bold font-montserrat">Space</span>
                  </div>
                  <div className="text-white text-base font-medium font-montserrat leading-[170%]">
                    Play / Pause
                  </div>
                </div>

                {/* Mute/Unmute */}
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-[#252525] border border-[#00EEFF] rounded-[5px] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-lg font-bold font-montserrat">M</span>
                  </div>
                  <div className="text-white text-base font-medium font-montserrat leading-[170%]">
                    Mute / Unmute
                  </div>
                </div>

                {/* Forward/Backward */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-11 h-11 bg-[#252525] border border-[#00EEFF] rounded-[5px] flex items-center justify-center">
                      <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 7L8 0V14L0 7Z" fill="white"/>
                      </svg>
                    </div>
                    <div className="w-11 h-11 bg-[#252525] border border-[#00EEFF] rounded-[5px] flex items-center justify-center">
                      <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 7L0 0V14L8 7Z" fill="white"/>
                      </svg>
                    </div>
                  </div>
                  <div className="text-white text-base font-medium font-montserrat leading-[170%]">
                    - / + 10s
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="block sm:hidden">
              <div className="space-y-6">
                {/* Start/End Cut */}
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-[#252525] border border-[#00EEFF] rounded-[5px] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-lg font-bold font-montserrat">Q</span>
                  </div>
                  <div className="text-white text-lg font-medium font-montserrat leading-[170%]">
                    Start / End cut
                  </div>
                </div>

                {/* Play/Pause */}
                <div className="flex items-center gap-4">
                  <div className="w-[90px] h-11 bg-[#252525] border border-[#00EEFF] rounded-[5px] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-lg font-bold font-montserrat">Space</span>
                  </div>
                  <div className="text-white text-lg font-medium font-montserrat leading-[170%]">
                    Play / Pause
                  </div>
                </div>

                {/* Mute/Unmute */}
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-[#252525] border border-[#00EEFF] rounded-[5px] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-lg font-bold font-montserrat">M</span>
                  </div>
                  <div className="text-white text-lg font-medium font-montserrat leading-[170%]">
                    Mute / Unmute
                  </div>
                </div>

                {/* Forward/Backward */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-11 h-11 bg-[#252525] border border-[#00EEFF] rounded-[5px] flex items-center justify-center">
                      <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 7L8 0V14L0 7Z" fill="white"/>
                      </svg>
                    </div>
                    <div className="w-11 h-11 bg-[#252525] border border-[#00EEFF] rounded-[5px] flex items-center justify-center">
                      <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 7L0 0V14L8 7Z" fill="white"/>
                      </svg>
                    </div>
                  </div>
                  <div className="text-white text-lg font-medium font-montserrat leading-[170%]">
                    - / + 10s
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActionsModal;
