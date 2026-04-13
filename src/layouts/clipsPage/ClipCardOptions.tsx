// components/ClipCardOptions.tsx
import React, { useRef, useEffect, useState } from "react";
import { Download, Edit, Trash2, PlusSquare, FlipHorizontal, UploadCloud } from "lucide-react";
import { Rate } from "antd";
import { ClipData } from "@/mocks/clips_mockData/mockClips";
import { FolderData } from "@/store/slices/foldersSlice";
import ManageTagsModal from "@/components/modals/ManageTagsModal";
import DeleteConfirmationModal from "@/components/modals/DeleteConfirmationModal";
import RenameModal from "@/components/modals/RenameModal";
import PreviewModal from "@/components/modals/PreviewModal";
import { updateClip, deleteClip, exportClipJson} from "@/api/clipApi";
import { deleteFolder, updateFolder } from "@/api/folderApi";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { downloadFile } from '@/utils/download';
import { useAppDispatch, useAppSelector } from "@/store";
import { removeClip, upsertClip } from "@/store/slices/clipsSlice";
import { usePermissions } from "@/hooks/usePermissions";

interface ClipCardOptionsProps {
  showDropdown?: boolean;
  show?: boolean;
  onClose?: () => void;
  setShowDropdown?: (show: boolean) => void;
  activeTab: string;
  clip?: ClipData;
  folder?: FolderData;
  isFolder?: boolean;
  lazyLoad?: boolean;
  page: string;
  triggerRef?: React.RefObject<HTMLDivElement>;
  onRefresh?: () => void;
}
const ClipCardOptions: React.FC<ClipCardOptionsProps> = ({
  showDropdown,
  show,
  onClose,
  setShowDropdown,
  activeTab,
  clip,
  folder,
  isFolder = false,
  lazyLoad,
  page,
  triggerRef,
  onRefresh,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showManageTagsModal, setShowManageTagsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { canEdit, canDelete, canCreate } = usePermissions();
  const filtersAspectRatio = useAppSelector((state) => (state as any)?.clips?.filters?.aspectRatio);
  const selectedAspectRatio = Array.isArray(filtersAspectRatio)
    ? (filtersAspectRatio[0] || "")
    : (filtersAspectRatio || "");
  
  // Use show prop if available, otherwise use showDropdown
  const isVisible = show !== undefined ? show : showDropdown;
  const handleClose = onClose || (() => setShowDropdown?.(false));

  // Get current item (clip or folder)
  const currentItem = isFolder ? folder : clip;
  const currentRating = isFolder && folder ?
    (folder.rating || 0)
    : (clip?.rating || 0);

  // Handle rating change
  const handleRatingChange = async (rating: number) => {
    if ((!clip && !folder) || isUpdating) return;

    setIsUpdating(true);
    try {
      if (isFolder && folder) {
        const response = await updateFolder(folder._id, {
          rating: rating
        });
        if (response?.success) {
          toast.success('Rating updated successfully!');
          if (onRefresh) {
            onRefresh();
          }
        } else {
          toast.error(response?.error || response?.message || 'Failed to update rating');
        }
      } else if (clip) {
        const response = await updateClip(clip._id || clip.id, {
          rating: rating
        });
        if (response?.success) {
          toast.success('Rating updated successfully!');
          if (page === 'clips' && activeTab === 'clips') {
            dispatch(upsertClip(response.data));
          } else if (onRefresh) {
            onRefresh();
          }
        } else if (onRefresh) {
          onRefresh();
        } else {
          toast.error(response?.error || response?.message || 'Failed to update rating');
        }
      }
    } catch (error: any) {
      console.error('Failed to update rating:', error);
      toast.error(error.message || 'Failed to update rating. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle tag update
  const handleUpdateTags = async (tags: string[], scores?: string) => {
    if ((!clip && !folder) || isUpdating) return;

    setIsUpdating(true);
    try {
      if (isFolder && folder) {
        const response = await updateFolder(folder._id, {
          tags: tags
        });
        if (response?.success) {
          toast.success('Tags updated successfully!');
          if (onRefresh) {
            onRefresh();
          }
        } else {
          toast.error(response?.error || response?.message || 'Failed to update tags');
        }
      } else if (clip) {
        const payload: any = { tags };
        if (scores !== undefined) {
          payload.clip_ai_score = scores;
        }
        const response = await updateClip(clip._id || clip.id, payload);

        if (response?.success) {
          toast.success('Tags updated successfully!');
          if (page === 'clips' && activeTab === 'clips') {
            dispatch(upsertClip(response.data));
          } else if (onRefresh) {
            onRefresh();
          }
        } else if (onRefresh) {
          onRefresh();
        } else {
          toast.error(response?.error || response?.message || 'Failed to update tags');
        }
      }
    } catch (error: any) {
      console.error('Failed to update tags:', error);
      toast.error(error.message || 'Failed to update tags. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle clip deletion
  const handleDeleteClip = async () => {
    if (!clip || isFolder || isUpdating) return;

    setIsUpdating(true);
    try {
      const response = await deleteClip(clip._id || clip.id);
      
      if (response.success) {
        toast.success('Clip deleted successfully!');
        // Close dropdown and refresh clips list
        handleClose();
        if (page === 'clips' && activeTab === 'clips') {
          dispatch(removeClip(String(clip._id || clip.id)));
        } else if (onRefresh) {
          onRefresh();
        }
      } else {
        toast.error(response.error || response.message || 'Failed to delete clip');
      }
    } catch (error: any) {
      console.error('Failed to delete clip:', error);
      toast.error(error.message || 'Failed to delete clip. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle folder deletion
  const handleDeleteFolder = async () => {
    if (!folder || !isFolder || isUpdating) return;

    setIsUpdating(true);
    try {
      const response = await deleteFolder(folder._id);
      
      if (response.success) {
        toast.success('Highlight deleted successfully!');
        // Close dropdown
        handleClose();
        // Also call onRefresh if available
        if (onRefresh) {
          onRefresh();
        }
      } else {
        toast.error(response.message || 'Failed to delete folder');
      }
    } catch (error: any) {
      console.error('Failed to delete folder:', error);
      toast.error(error.message || 'Failed to delete folder. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle clip rename
  const handleRenameClip = async (newTitle: string) => {
    if (!clip || isFolder || isUpdating) return;

    setIsUpdating(true);
    try {
      const response = await updateClip(clip._id || clip.id, {
        title: newTitle.trim()
      });
      
      if (response.success) {
        toast.success('Clip renamed successfully!');
        // Close modals
        setShowRenameModal(false);
        handleClose();
        if (page === 'clips' && activeTab === 'clips' && response.data) {
          dispatch(upsertClip(response.data));
        } else if (onRefresh) {
          onRefresh();
        }
      } else {
        toast.error(response.error || response.message || 'Failed to rename clip');
      }
    } catch (error: any) {
      console.error('Failed to rename clip:', error);
      toast.error(error.message || 'Failed to rename clip. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle folder rename
  const handleRenameFolder = async (newTitle: string) => {
    if (!folder || !isFolder || isUpdating) return;

    setIsUpdating(true);
    try {
      const response = await updateFolder(folder._id, {
        title: newTitle.trim()
      });
      
      if (response.success) {
        toast.success('Folder renamed successfully!');
        // Close modals
        setShowRenameModal(false);
        handleClose();
        // Refresh folders list
        if (onRefresh) {
          onRefresh();
        }
      } else {
        toast.error(response.message || 'Failed to rename folder');
      }
    } catch (error: any) {
      console.error('Failed to rename folder:', error);
      toast.error(error.message || 'Failed to rename folder. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle rename submission
  const handleRename = async (formData: any) => {
    const newTitle = typeof formData === 'string' ? formData : formData.title;
    if (isFolder) {
      await handleRenameFolder(newTitle);
    } else {
      await handleRenameClip(newTitle);
    }
  };

  const handleDownload = async () => {
     try {
      const videoUrl = isFolder ? currentItem?.previewUrl : clip.videoUrl;
      await downloadFile(String(videoUrl || ''), String(currentItem?.title || 'video'));
    } catch (error) {
      console.error('Error downloading video:', error);
    }
  };

  const handleExportJson = async () => {
    try {
      if (!clip) return;
      const id = clip._id || (clip as any)?.id;
      const resp = await exportClipJson(String(id));
      if (resp?.success && resp?.data) {
        const jsonStr = JSON.stringify(resp.data, null, 2);
        const dataUrl = `data:application/json;charset=utf-8,${encodeURIComponent(jsonStr)}`;
        await downloadFile(dataUrl, `${clip.title || 'clip'}.json`);
      } else {
        toast.error(resp?.message || 'Failed to export JSON');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to export JSON');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClose]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="absolute z-[100] top-10 right-0 bg-[#252525] border border-[#2A2A2A] rounded-lg py-2 shadow-xl min-w-[180px] calendar-scroll"
      ref={dropdownRef}
      onClick={(e) => e.stopPropagation()} //full mr-2 Prevent closing when clicking inside dropdown
    >
      {/* Star Rating Section */}
      {/* {(activeTab !== "highlights" || page === "my-highlights" || activeTab === "clips") && (
        )} */}
      {/* Clip-specific options */}
      {/* {activeTab !== "highlights" && page !== "my-highlights" && ( */}
      <>
        {(isFolder ? canEdit('Highlights') : canEdit('Clips')) && (
          <div className="flex items-center justify-center py-4 border-[#373737]">
            <Rate
              value={currentRating}
              onChange={handleRatingChange}
              disabled={isUpdating}
              style={{
                color: "#FFF",
                fontSize: "24px",
              }}
              className="custom-rate"
            />
          </div>
        )}
        {page !== "my-highlights" && canEdit('Tags') && (
          <button
            className="w-full px-4 py-2 text-left text-white hover:bg-[#434343] transition-colors flex items-center gap-2"
            onClick={() => setShowManageTagsModal(true)}
            disabled={isUpdating}
          >
            <PlusSquare size={14} />
            Add tags
          </button>
        )}
      </>
      {/* )} */}
      <hr className="border-[#2A2A2A] my-1" />
      {!isFolder && canEdit('Clips') && (
        <button className="w-full px-4 py-2 text-left text-white hover:bg-[#434343] transition-colors flex items-center gap-2" onClick={() => {
          const base = `/clip-editor?clipId=${clip?._id || clip?.id}?aspectRatio=${selectedAspectRatio || clip?.aspectRatio}`;
          navigate(base);
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2.30426 7.52212L3.65333 8.8719L4.69835 7.82691L3.3478 6.47861L4.39134 5.4351L5.74115 6.78414L6.78469 5.74063L5.43635 4.39085L6.47989 3.34734L7.82749 4.69786L8.87176 3.65361L7.52195 2.30457L9.60977 0.217548C9.74817 0.0791972 9.93585 0.00147604 10.1315 0.00147604C10.3272 0.00147604 10.5149 0.0791972 10.6533 0.217548L13.7839 3.34808C13.9223 3.48647 14 3.67415 14 3.86984C14 4.06552 13.9223 4.2532 13.7839 4.39159L4.39134 13.7839C4.25294 13.9223 4.06526 14 3.86957 14C3.67388 14 3.4862 13.9223 3.3478 13.7839L0.217185 10.6534C0.0788305 10.515 0.0011071 10.3273 0.0011071 10.1316C0.0011071 9.93595 0.0788305 9.74828 0.217185 9.60988L2.30426 7.52212ZM8.56623 11.6962L11.6976 8.56564L13.643 10.511V13.6422H10.5123L8.56623 11.6962ZM2.30426 5.43436L0.216447 3.34734C0.14783 3.2788 0.0933954 3.19741 0.0562558 3.10782C0.0191163 3.01823 0 2.9222 0 2.82522C0 2.72824 0.0191163 2.6322 0.0562558 2.54261C0.0933954 2.45302 0.14783 2.37163 0.216447 2.30309L2.30426 0.216072C2.44266 0.0777211 2.63034 0 2.82603 0C3.02172 0 3.2094 0.0777211 3.3478 0.216072L5.43635 2.30309L2.30426 5.43436Z" fill="url(#paint0_linear_2457_4685)" />
            <defs>
              <linearGradient id="paint0_linear_2457_4685" x1="26.9961" y1="7.08303" x2="7.42404" y2="-12.4888" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00EEFF" />
                <stop offset="1" stopColor="#0051FF" />
              </linearGradient>
            </defs>
          </svg>
          Clip studio
        </button>
      )}
      {/* <button className="w-full px-4 py-2 text-left text-white hover:bg-[#434343] transition-colors flex items-center gap-2">
            <ScissorsIcon size={14} />
            Trim clip
          </button> */}
      {!isFolder && canEdit('Clips') && (
        <button className="w-full px-4 py-2 text-left text-white hover:bg-[#434343] transition-colors flex items-center gap-2" onClick={() => {
          navigate(`/auto-flip/${clip?._id || clip?.id}`);
        }}>
          <FlipHorizontal size={14} />
          Auto reframe
        </button>
      )}
      {/* <button className="w-full px-4 py-2 text-left text-white hover:bg-[#434343] transition-colors flex items-center gap-2">
            <Image size={14} />
            Set Thumbnail
          </button> */}

      {/* Folder-specific options */}
      {isFolder && canEdit('Highlights') && (page !== "my-highlights" || !!currentItem?.previewUrl) && (
        <>
          <button className="w-full px-4 py-2 text-left text-white hover:bg-[#434343] transition-colors flex items-center gap-2" onClick={() => navigate(`/editor-page/${folder?._id}?aspectRatio=${folder?.aspectRatio}`)}>
            {/* <Edit size={14} /> */}
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.30426 7.52212L3.65333 8.8719L4.69835 7.82691L3.3478 6.47861L4.39134 5.4351L5.74115 6.78414L6.78469 5.74063L5.43635 4.39085L6.47989 3.34734L7.82749 4.69786L8.87176 3.65361L7.52195 2.30457L9.60977 0.217548C9.74817 0.0791972 9.93585 0.00147604 10.1315 0.00147604C10.3272 0.00147604 10.5149 0.0791972 10.6533 0.217548L13.7839 3.34808C13.9223 3.48647 14 3.67415 14 3.86984C14 4.06552 13.9223 4.2532 13.7839 4.39159L4.39134 13.7839C4.25294 13.9223 4.06526 14 3.86957 14C3.67388 14 3.4862 13.9223 3.3478 13.7839L0.217185 10.6534C0.0788305 10.515 0.0011071 10.3273 0.0011071 10.1316C0.0011071 9.93595 0.0788305 9.74828 0.217185 9.60988L2.30426 7.52212ZM8.56623 11.6962L11.6976 8.56564L13.643 10.511V13.6422H10.5123L8.56623 11.6962ZM2.30426 5.43436L0.216447 3.34734C0.14783 3.2788 0.0933954 3.19741 0.0562558 3.10782C0.0191163 3.01823 0 2.9222 0 2.82522C0 2.72824 0.0191163 2.6322 0.0562558 2.54261C0.0933954 2.45302 0.14783 2.37163 0.216447 2.30309L2.30426 0.216072C2.44266 0.0777211 2.63034 0 2.82603 0C3.02172 0 3.2094 0.0777211 3.3478 0.216072L5.43635 2.30309L2.30426 5.43436Z" fill="url(#paint0_linear_2457_4685)" />
            <defs>
              <linearGradient id="paint0_linear_2457_4685" x1="26.9961" y1="7.08303" x2="7.42404" y2="-12.4888" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00EEFF" />
                <stop offset="1" stopColor="#0051FF" />
              </linearGradient>
            </defs>
          </svg>
            Highlight studio
          </button>
        </>
      )}
      {isFolder && currentItem?.previewUrl && canCreate('Published') && (
        <>
          <button className="w-full px-4 py-2 text-left text-white hover:bg-[#434343] transition-colors flex items-center gap-2" onClick={() => navigate(`/publish/HighlightId=${folder._id}`)}>
            <UploadCloud size={14} />
            Publish
          </button>
        </>
      )}
      {/* {currentItem?.previewUrl && (<button className="w-full px-4 py-2 text-left text-white hover:bg-[#434343] transition-colors flex items-center gap-2" onClick={() => setShowPreviewModal(true)}>
        <Tv size={14} />
        Preview
      </button>)} */}
      {currentItem?.previewUrl && (<button className="w-full px-4 py-2 text-left text-white hover:bg-[#434343] transition-colors flex items-center gap-2" onClick={handleDownload}>
        <Download size={14} />
        Download
      </button>)}
      {activeTab !== "highlights" && page !== "my-highlights" && canCreate('Published') && (
        <button className="w-full px-4 py-2 text-left text-white hover:bg-[#434343] transition-colors flex items-center gap-2" onClick={() => {
          navigate(`/publish/${clip?._id || clip?.id}`);
          setShowDropdown(false);
        }}>
          <UploadCloud size={14} />
          Publish
        </button>
      )}
      {(isFolder ? canEdit('Highlights') : canEdit('Clips')) && (
        <button
          className="w-full px-4 py-2 text-left text-white hover:bg-[#434343] transition-colors flex items-center gap-2"
          onClick={() => setShowRenameModal(true)}
          disabled={isUpdating}
        >
          <Edit size={14} />
          Rename
        </button>
      )}
      {activeTab !== "highlights" && page !== "my-highlights" && (<button className="w-full px-4 py-2 text-left text-white hover:bg-[#434343] transition-colors flex items-center gap-2" onClick={handleExportJson}>
        {/* <ArrowUp size={14} /> */}
        <svg xmlns="http://www.w3.org/2000/svg" width="19" height="14" viewBox="0 0 19 14" fill="none">
          <path d="M1.55287 11.6667V8.78889C1.55287 8.47947 1.42995 8.18272 1.21116 7.96393C0.992369 7.74514 0.695623 7.62222 0.386203 7.62222H-0.00268555V6.37778H0.386203C0.539412 6.37778 0.691121 6.3476 0.832667 6.28897C0.974214 6.23034 1.10283 6.1444 1.21116 6.03607C1.3195 5.92773 1.40543 5.79912 1.46406 5.65758C1.52269 5.51603 1.55287 5.36432 1.55287 5.21111V2.33333C1.55287 1.71449 1.7987 1.121 2.23629 0.683418C2.67387 0.245833 3.26736 0 3.8862 0H4.66398V1.55556H3.8862C3.67992 1.55556 3.48209 1.6375 3.33623 1.78336C3.19037 1.92922 3.10843 2.12705 3.10843 2.33333V5.52222C3.10851 5.84968 3.00525 6.1688 2.81337 6.43414C2.62148 6.69949 2.35076 6.89751 2.03976 7C2.35076 7.10249 2.62148 7.30051 2.81337 7.56586C3.00525 7.8312 3.10851 8.15032 3.10843 8.47778V11.6667C3.10843 11.8729 3.19037 12.0708 3.33623 12.2166C3.48209 12.3625 3.67992 12.4444 3.8862 12.4444H4.66398V14H3.8862C3.26736 14 2.67387 13.7542 2.23629 13.3166C1.7987 12.879 1.55287 12.2855 1.55287 11.6667ZM17.1084 8.78889V11.6667C17.1084 12.2855 16.8626 12.879 16.425 13.3166C15.9874 13.7542 15.3939 14 14.7751 14H13.9973V12.4444H14.7751C14.9814 12.4444 15.1792 12.3625 15.3251 12.2166C15.4709 12.0708 15.5529 11.8729 15.5529 11.6667V8.47778C15.5528 8.15032 15.656 7.8312 15.8479 7.56586C16.0398 7.30051 16.3105 7.10249 16.6215 7C16.3105 6.89751 16.0398 6.69949 15.8479 6.43414C15.656 6.1688 15.5528 5.84968 15.5529 5.52222V2.33333C15.5529 2.12705 15.4709 1.92922 15.3251 1.78336C15.1792 1.6375 14.9814 1.55556 14.7751 1.55556H13.9973V0H14.7751C15.3939 0 15.9874 0.245833 16.425 0.683418C16.8626 1.121 17.1084 1.71449 17.1084 2.33333V5.21111C17.1084 5.52053 17.2313 5.81728 17.4501 6.03607C17.6689 6.25486 17.9657 6.37778 18.2751 6.37778H18.664V7.62222H18.2751C17.9657 7.62222 17.6689 7.74514 17.4501 7.96393C17.2313 8.18272 17.1084 8.47947 17.1084 8.78889Z" fill="white" />
          <path d="M9.81372 6.6123L9.81372 10.1123L8.93872 10.1123L8.93872 6.6123L5.87622 6.61231L9.37622 3.1123L12.8762 6.6123L9.81372 6.6123Z" fill="white" />
        </svg>
        Export JSON
      </button>)}
      {(isFolder ? canDelete('Highlights') : canDelete('Clips')) && (
        <button
          className="w-full px-4 py-2 text-left text-red-400 hover:bg-[#434343] transition-colors flex items-center gap-2"
          onClick={() => setShowDeleteModal(true)}
          disabled={isUpdating}
        >
          <Trash2 size={14} />
          Delete
        </button>
      )}

      {/* Manage Tags Modal */}
      <ManageTagsModal
        isOpen={showManageTagsModal}
        onClose={() => setShowManageTagsModal(false)}
        appliedTags={isFolder ? (folder?.tags || []) : (clip?.tags || [])}
        onUpdateTags={(tags, scores) => handleUpdateTags(tags, scores)}
        category={isFolder ? folder?.category || "" : (clip?.customData?.sportName || "")}
        streamId={isFolder ? folder?.streamId || "" : (clip?.streamId || "")}
        page="clips"
        initialScores={isFolder ? "" : ((clip as any)?.customData?.clip_ai_score || "")}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={isFolder ? handleDeleteFolder : handleDeleteClip}
        itemName={isFolder ? (folder?.name || folder?.title || "this folder") : (clip?.title || "this clip")}
      />

      {/* Rename Modal */}
      <RenameModal
        isOpen={showRenameModal}
        onClose={() => setShowRenameModal(false)}
        onRename={handleRename}
        itemType={isFolder ? "folder" : "clip"}
        currentTitle={isFolder ? (folder?.name || folder?.title || "") : (clip?.title || "")}
      />

      {/* Preview Modal */}
      {currentItem?.previewUrl && (
        <PreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          clipData={{
            id: currentItem._id || currentItem.id || '',
            title: isFolder ? (folder?.title || 'Untitled Folder') : (clip?.title || 'Untitled Clip'),
            timeRange: isFolder ? 'AI Highlight Video' : `${clip?.start_time || '00:00'} - ${clip?.end_time || '00:00'}`,
            duration: isFolder ? currentItem.totalDuration || '00:00' : currentItem.duration,
            aspectRatio: currentItem.aspectRatio || '16:9',
            rating: currentRating,
            videoUrl: isFolder ? currentItem.previewUrl : currentItem.videoUrl,
            poster: currentItem.thumbnail || currentItem.poster,
            type: isFolder ? 'folder' : 'clip'
          }}
          page={page}
        />
      )}
    </div>
  );
};

export default ClipCardOptions;
