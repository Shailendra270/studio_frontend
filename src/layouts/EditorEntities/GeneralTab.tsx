import React, { useState } from "react";
import ManageTagsModal from "@/components/modals/ManageTagsModal";
import { fetchFolderById, selectCurrentFolder, selectCurrentFolderLoading, selectCurrentFolderError } from "@/store/slices/foldersSlice";
import { selectCurrentClip } from "@/store/slices/clipsSlice";
import { useAppDispatch, useAppSelector } from "@/store";
import SVGIcon from "@/components/common/SVGIcon";
import SparkleGradient from "@/assets/svg/SparkleGradient.svg"

interface ClipItem {
  id: string;
  title: string;
  duration: string;
  aspectRatio: string;
  thumbnail: string;
  timestamp: string;
  tags: string[];
  rating: number;
  date: string;
  time: string;
}

interface GeneralTabProps {
  activeClip?: ClipItem;
  page: string;
  onSaveChanges?: React.MutableRefObject<(() => Promise<void>) | null>;
  clipName?: string;
  setClipName?: (name: string) => void;
  tags?: string[];
  setTags?: (tags: string[]) => void;
  rating?: number;
  setRating?: (rating: number) => void;
}
const GeneralTab: React.FC<GeneralTabProps> = ({ 
  activeClip, 
  page, 
  onSaveChanges, 
  clipName: parentClipName, 
  setClipName: parentSetClipName, 
  tags: parentTags, 
  setTags: parentSetTags, 
  rating: parentRating, 
  setRating: parentSetRating 
}) => {
  const currentFolder = useAppSelector(selectCurrentFolder);
  const currentClipStore = useAppSelector(selectCurrentClip);
  
  // Use parent-provided state if available, otherwise use default values
  const clipName = parentClipName ?? (page === "editor-page" ? currentFolder?.title || '' : activeClip?.title || '');
  const tags = parentTags ?? (page === "editor-page" ? currentFolder?.tags || [] : activeClip?.tags || []);
  const rating = parentRating ?? (page === "editor-page" ? currentFolder?.rating || 0 : activeClip?.rating || 0);
  const transcriptionText = (() => {
    const val = (
      (page === "editor-page" ? (currentFolder as any)?.description : (activeClip as any)?.description) ||
      (currentClipStore as any)?.description ||
      (activeClip as any)?.customData?.description ||
      (currentFolder as any)?.customData?.description
    );
    return typeof val === "string" && val.trim() ? val : "";
  })();
  
  const [showManageTagsModal, setShowManageTagsModal] = useState(false);
  const handleUpdateTags = (newTags: string[]) => {
    if (parentSetTags) {
      parentSetTags(newTags);
    }
    setShowManageTagsModal(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (parentSetTags) {
      parentSetTags(tags.filter(tag => tag !== tagToRemove));
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <button
        key={index}
        onClick={() => parentSetRating ? parentSetRating(index + 1) : undefined}
        className="hover:scale-110 transition-transform"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10.9395 4.52098C11.3235 3.68501 12.6766 3.68501 13.0605 4.52098L15.3534 9.31537C15.5169 9.75772 15.9389 10.0353 16.4171 10.065L21.9578 10.4924C22.8631 10.5531 23.2336 11.8196 22.5407 12.3917L18.4935 15.7245C18.1246 16.0248 17.9654 16.5374 18.0836 17.0319L19.5367 22.3662C19.786 23.2955 18.7106 24.0361 17.9187 23.5822L13.0408 20.6042C12.6048 20.3416 12.0452 20.3416 11.6092 20.6042L6.73134 23.5822C5.9394 24.0361 4.864 23.2955 5.11335 22.3662L6.56644 17.0319C6.68459 16.5374 6.52541 16.0248 6.15653 15.7245L2.10933 12.3917C1.41639 11.8196 1.78692 10.5531 2.69222 10.4924L8.23289 10.065C8.71106 10.0353 9.13312 9.75772 9.29662 9.31537L11.5895 4.52098H10.9395Z"
            fill={index < rating ? "#FFF" : "none"}
            stroke="#FFF"
            strokeWidth="1"
          />
        </svg>
      </button>
    ));
  };

  return (
    <div className="p-6">
      {/* Clip Name Input */}
      <div className="mb-6">
        <div className="bg-[#252525] rounded-xl p-4 flex items-center">
          <input
            type="text"
            value={clipName}
            onChange={(e) => parentSetClipName ? parentSetClipName(e.target.value) : undefined}
            className="bg-transparent text-white text-sm flex-1 outline-none"
            placeholder="Clip name"
          />
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="ml-2"
          >
            <path
              d="M4.85567 12.4217H14V13.9773H0V10.6772L7.7 2.97717L10.9993 6.27806L4.85489 12.4217H4.85567ZM8.799 1.87817L10.4494 0.227723C10.5953 0.0819121 10.7931 0 10.9993 0C11.2056 0 11.4034 0.0819121 11.5492 0.227723L13.7496 2.42806C13.8954 2.57391 13.9773 2.77171 13.9773 2.97795C13.9773 3.18418 13.8954 3.38198 13.7496 3.52783L12.0991 5.1775L8.79978 1.87817H8.799Z"
              fill="white"
            />
          </svg>
        </div>
      </div>

      {/* Tags Section */}
      {page === "clipeditor-page" && (<div className="mb-6">
        <h3 className="text-white text-sm font-bold mb-3">Tags</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Applied Tags */}
          {tags.map((tag, index) => (
            <div
              key={index}
              className="bg-[#1B1B1B] border border-white rounded-lg px-3 py-2 flex items-center gap-2"
            >
              <span className="text-white text-sm">{tag}</span>
              <button
                onClick={() => handleRemoveTag(tag)}
                className="text-white hover:text-gray-300"
              >
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 8 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7.37966e-05 6.95656L6.95653 0.000315231L8 1.04375L1.04354 8L7.37966e-05 6.95656Z"
                    fill="currentColor"
                  />
                  <path
                    d="M7.99993 6.95625L1.04347 0L0 1.04344L6.95646 7.99968L7.99993 6.95625Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>
          ))}

          {/* Add Tag Button */}
            <button
            onClick={() => setShowManageTagsModal(true)}
            className="w-10 h-9 bg-[#1B1B1B] border border-white rounded-lg flex items-center justify-center hover:bg-[#252525] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M0.783313 5.24805L11.279 5.24821L11.279 6.82256L0.783337 6.8224L0.783313 5.24805Z" fill="url(#paint0_linear_2422_1876)" />
              <path d="M6.8186 11.2829L6.81844 0.787187L5.24409 0.787163L5.24425 11.2828L6.8186 11.2829Z" fill="url(#paint1_linear_2422_1876)" />
              <defs>
                <linearGradient id="paint0_linear_2422_1876" x1="14.6154" y1="14.6909" x2="14.6153" y2="-2.18331" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#00EEFF" />
                  <stop offset="1" stop-color="#0051FF" />
                </linearGradient>
                <linearGradient id="paint1_linear_2422_1876" x1="14.6154" y1="14.6909" x2="14.6153" y2="-2.18331" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#00EEFF" />
                  <stop offset="1" stop-color="#0051FF" />
                </linearGradient>
              </defs>
            </svg>
          </button>
        </div>
      </div>)}

      {/* Rating Section */}
      <div className="mb-6">
        <h3 className="text-white text-sm font-bold mb-3">Rating</h3>
        <div className="flex items-center gap-2">
          {renderStars(rating)}
        </div>
      </div>

      {transcriptionText && page !== "editor-page" && page !== "clipeditor-page" && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-white text-sm font-bold">Transcription</span>
            <SVGIcon src={SparkleGradient} className="w-3 h-3 flex-shrink-0" aria-label="Transcription" />
          </div>
          <div className="bg-[#1B1B1B] border border-[#434343] rounded-lg p-4 text-white text-sm leading-6 h-[150px] overflow-y-auto overflow-x-hidden whitespace-pre-wrap pr-2">
            {transcriptionText}
          </div>
        </div>
      )}

      {/* Manage Tags Modal */}
      <ManageTagsModal
        isOpen={showManageTagsModal}
        onClose={() => setShowManageTagsModal(false)}
        appliedTags={tags}
        onUpdateTags={async (tgs, scores) => {
          await handleUpdateTags(tgs);
          if (scores) {
            try {
              const id = (activeClip as any)?._id || (currentClipStore as any)?._id;
              if (!id) return;
              const { updateClip } = await import('@/api/clipApi');
              await updateClip(id, { clip_ai_score: scores });
            } catch {}
          }
        }}
        category={
          (currentFolder?.category) ||
          (activeClip?.customData?.sportName) ||
          (currentClipStore as any)?.customData?.sportName ||
          "cricket"
        }
        page="clips"
        streamId={
          (currentFolder?.streamId) ||
          (activeClip as any)?.streamId ||
          (currentClipStore as any)?.streamId ||
          ""
        }
        initialScores={
          ((activeClip as any)?.clip_ai_score) ||
          ((activeClip as any)?.scores) ||
          ((currentClipStore as any)?.clip_ai_score) ||
          ((currentClipStore as any)?.scores) ||
          ""
        }
      />
    </div>
  );
};

export default GeneralTab;
