import React from 'react';
import { X } from 'lucide-react';

interface EndStreamConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  /** Stream title to show in the confirmation message */
  streamTitle?: string;
}

const EndStreamConfirmationModal: React.FC<EndStreamConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  streamTitle,
}) => {
  if (!isOpen) return null;

  const titleLabel = streamTitle ? `End stream "${streamTitle}"?` : 'End Stream?';
  const description = streamTitle
    ? `This will end the stream "${streamTitle}". You won't be able to resume it. Are you sure you want to continue?`
    : "This action will end the stream, and you won't be able to resume it. Are you sure you want to continue?";

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg"
        style={{ animation: 'slideUp 0.25s cubic-bezier(.22,1,.36,1)' }}
      >
        {/* Gradient border */}
        <div
          className="rounded-2xl p-px"
          style={{ background: 'linear-gradient(135deg, #00EEFF33, #0051FF33, #00EEFF11)' }}
        >
          <div className="rounded-2xl bg-[#18191B] overflow-hidden">
            {/* Header */}
            <div className="relative px-6 py-4 border-b border-[#252525]">
              <div
                className="absolute inset-0 opacity-5"
                style={{ background: 'linear-gradient(135deg, #00EEFF, #0051FF)' }}
              />
              <div className="relative flex items-center">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-white font-montserrat leading-snug mt-1 mb-0 text-center">
                    {titleLabel}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="ml-auto p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#252525] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5 space-y-6">
              <p className="text-sm text-gray-300 text-center">
                {description}
              </p>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 py-2.5 rounded-lg border border-[#2A2A2A] text-gray-300 text-sm font-medium hover:bg-[#252525] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #00EEFF, #0051FF)' }}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Ending...
                    </>
                  ) : (
                    'Yes, End Stream'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EndStreamConfirmationModal;
