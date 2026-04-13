import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { SearchableSelect, SelectOption } from "../ui/searchable-select";
import { toast } from "sonner";

interface FolderOption {
  id: string;
  title: string;
  clips: string[];
}

interface AddToExistingHighlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClips: string[];
  streamId: string;
  onAddToHighlight: (folderId: string, clipsToAdd: string[]) => Promise<void>;
  folders: FolderOption[];
  isLoading?: boolean;
}

const AddToExistingHighlightModal: React.FC<AddToExistingHighlightModalProps> = ({
  isOpen,
  onClose,
  selectedClips,
  streamId,
  onAddToHighlight,
  folders,
  isLoading = false,
}) => {
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedFolder("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Handle escape key press and body overflow
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Handle overlay click to close modal
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle folder selection
  const handleFolderSelect = (folderId: string) => {
    setSelectedFolder(folderId);
  };

  // Convert folders to SelectOption format for SearchableSelect
  const folderOptions: SelectOption[] = folders
    ? folders
        .filter(folder => folder && folder.id && folder.title) // Filter out invalid folders
        .map(folder => ({
          value: folder.id,
          label: folder.title,
        }))
    : [];

  // Get selected folder details
  const getSelectedFolderDetails = () => {
    if (!folders || !selectedFolder) return null;
    return folders.find(folder => folder.id === selectedFolder);
  };

  // Check which clips already exist in the selected folder
  const getClipStatus = () => {
    const selectedFolderData = getSelectedFolderDetails();
    if (!selectedFolderData) return { newClips: selectedClips, existingClips: [] };

    // Extract clip IDs from folder.clips (handle both clip objects and clip ID strings)
    const folderClipIds = selectedFolderData.clips.map((clip: any) => {
      if (typeof clip === 'string') {
        return clip; // Already a clip ID
      } else if (clip && (clip._id || clip.id)) {
        return clip._id || clip.id; // Extract ID from clip object
      }
      return null;
    }).filter(Boolean);

    const existingClips = selectedClips.filter(clipId => 
      folderClipIds.includes(clipId)
    );
    const newClips = selectedClips.filter(clipId => 
      !folderClipIds.includes(clipId)
    );

    return { newClips, existingClips };
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedFolder) {
      toast.error("Please select a folder");
      return;
    }

    const { newClips, existingClips } = getClipStatus();
    const selectedFolderData = getSelectedFolderDetails();

    // If no new clips to add
    if (newClips.length === 0) {
      if (existingClips.length === selectedClips.length) {
        toast.info(`All selected clips already exist in "${selectedFolderData?.title}"`);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      console.log(newClips);
      await onAddToHighlight(selectedFolder, newClips);
      
      // Show appropriate success message
      if (existingClips.length === 0) {
        toast.success(`${newClips.length} clip${newClips.length > 1 ? 's' : ''} added to "${selectedFolderData?.title}"`);
      } else {
        toast.success(`${newClips.length} clip${newClips.length > 1 ? 's' : ''} added and ${existingClips.length} clip${existingClips.length > 1 ? 's' : ''} already exist${existingClips.length === 1 ? 's' : ''} in "${selectedFolderData?.title}"`);
      }
      
      onClose();
    } catch (error) {
      console.error("Error adding clips to folder:", error);
      toast.error("Failed to add clips to folder");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const { newClips, existingClips } = selectedFolder ? getClipStatus() : { newClips: selectedClips, existingClips: [] };
  const selectedFolderData = getSelectedFolderDetails();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-90" />

      {/* Modal */}
      <div className="relative bg-black rounded-[50px] border-2 border-[#373737] w-full max-w-[550px] max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-center relative pt-8 pb-6 px-16">
          <h2 className="text-white text-[28px] font-medium leading-[70%] text-center">
            Adding clip to highlight
          </h2>
          <button
            onClick={onClose}
            className="absolute right-8 top-8 text-white hover:text-gray-300 transition-colors"
            disabled={isSubmitting}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0.000147593 13.9131L13.9131 0.000630463L16 2.0875L2.08709 16L0.000147593 13.9131Z"
                fill="currentColor"
              />
              <path
                d="M15.9999 13.9125L2.08694 0L0 2.08687L13.9129 15.9994L15.9999 13.9125Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-visible px-16 py-4 space-y-6">
          {/* Folder Selection */}
          <div className="space-y-2">
            <SearchableSelect
              label="Highlight"
              placeholder="Select existing highlight"
              options={folderOptions}
              value={selectedFolder}
              searchable={true}
              required={true}
              disabled={isLoading || isSubmitting}
              onChange={(value) => handleFolderSelect(value as string)}
              className="w-full"
              triggerClassName="h-[50px] bg-[#1B1B1B] border-2 border-[#373737] rounded-xl px-4 text-white text-[16px] hover:border-[#00BBFF] focus:border-[#00BBFF]"
              contentClassName="bg-[#1B1B1B] border-2 border-[#373737] rounded-xl shadow-xl"
              labelClassName="text-white text-[14px] font-medium leading-[70%] after:content-['*'] after:text-red-500 after:ml-1"
            />
          </div>

          {/* Clip Status Information */}
          {selectedFolder && (
            <div className="bg-[#252525] rounded-xl p-4 space-y-2 border-2 border-[#373737]">
              <div className="text-sm text-white">
                <span className="font-medium">Selected clips:</span> {selectedClips.length}
              </div>
              {newClips.length > 0 && (
                <div className="text-sm text-green-400">
                  <span className="font-medium">New clips to add:</span> {newClips.length}
                </div>
              )}
              {existingClips.length > 0 && (
                <div className="text-sm text-yellow-400">
                  <span className="font-medium">Already in folder:</span> {existingClips.length}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex-shrink-0 flex items-center justify-center gap-5 pt-6 pb-10 px-16">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="bg-[#1B1B1B] border-[#00BBFF] text-white hover:bg-[#00BBFF]/10 h-[42px] px-6 rounded-xl text-sm font-medium min-w-[160px]"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedFolder || isSubmitting || newClips.length === 0}
            className={`
              h-[42px] px-6 rounded-xl text-sm font-medium min-w-[160px] flex items-center gap-3
              ${
                selectedFolder && !isSubmitting && newClips.length > 0
                  ? "bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white hover:opacity-90"
                  : "bg-[#373737] text-[#707070] cursor-not-allowed"
              }
            `}
          >
            {/* Plus Icon */}
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 0V12M0 6H12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            {isSubmitting ? "Adding..." : "Add to highlight"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddToExistingHighlightModal;