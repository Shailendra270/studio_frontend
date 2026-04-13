import React, { useState, useRef } from "react";
import GeneralTab from "@/layouts/EditorEntities/GeneralTab";
import TrimTab from "@/layouts/EditorEntities/TrimTab";
import BumpersTab from "@/layouts/EditorEntities/BumpersTab";
import GraphicsTab from "@/layouts/EditorEntities/GraphicsTab";
import OverlaysTab from "@/layouts/EditorEntities/OverlaysTab";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/store";
import { selectCurrentFolder } from "@/store/slices/foldersSlice";

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

interface EditorSidebarProps {
  activeClip: ClipItem;
  clipsInfo: ClipItem[];
  page: string;
  isGenerating?: boolean;
  generationProgress?: number;
  generationStatus?: string;
  onGenerateHighlight?: () => void;
  saveChangesRef?: React.MutableRefObject<(() => Promise<void>) | null>;
  clipName?: string;
  setClipName?: (name: string) => void;
  tags?: string[];
  setTags?: (tags: string[]) => void;
  rating?: number;
  setRating?: (rating: number) => void;
}

const EditorSidebar: React.FC<EditorSidebarProps> = ({ 
  activeClip, 
  clipsInfo, 
  page, 
  isGenerating: externalIsGenerating, 
  generationProgress: externalGenerationProgress, 
  generationStatus: externalGenerationStatus, 
  onGenerateHighlight,
  saveChangesRef,
  clipName,
  setClipName,
  tags,
  setTags,
  rating,
  setRating
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("general");
  const generalTabSaveRef = useRef<(() => Promise<void>) | null>(null);
 
  // Use external props if provided (for ClipEditorPage), otherwise use internal state (for HighlightEditorPage)
  const currentIsGenerating = externalIsGenerating !== undefined ? externalIsGenerating : isGenerating;
  const currentGenerationProgress = externalGenerationProgress !== undefined ? externalGenerationProgress : generationProgress;
  const currentGenerationStatus = externalGenerationStatus !== undefined ? externalGenerationStatus : generationStatus;
  const currentFolder = useAppSelector(selectCurrentFolder);
  const hasFolderPreview = Boolean((currentFolder as any)?.previewUrl);
  const hasClipPreview = Boolean((activeClip as any)?.editedPreviewUrl || (activeClip as any)?.previewUrl || (activeClip as any)?.editedClipData?.previewUrl);
  const generateLabel = currentIsGenerating ? 'Generating...' : ((hasFolderPreview || hasClipPreview) ? 'Regenerate' : 'Generate');
  // const { folderId } = useParams<{ folderId: string }>();
  // const currentFolder = useAppSelector(selectCurrentFolder);
  // const { graphicsState } = useGraphics();

  const tabs = [
    {
      id: "general",
      label: "General",
      icon: (isActive: boolean) => (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4.58588 17.5984C4.81308 16.9545 5.23443 16.3969 5.79184 16.0024C6.34925 15.608 7.01528 15.3962 7.69811 15.3962C8.38095 15.3962 9.04698 15.608 9.60439 16.0024C10.1618 16.3969 10.5831 16.9545 10.8104 17.5984H21.9946V19.7978H10.8104C10.5831 20.4418 10.1618 20.9994 9.60439 21.3938C9.04698 21.7882 8.38095 22 7.69811 22C7.01528 22 6.34925 21.7882 5.79184 21.3938C5.23443 20.9994 4.81308 20.4418 4.58588 19.7978H0V17.5984H4.58588ZM11.1843 9.90027C11.4115 9.25634 11.8328 8.69874 12.3902 8.30433C12.9476 7.90992 13.6137 7.69811 14.2965 7.69811C14.9793 7.69811 15.6454 7.90992 16.2028 8.30433C16.7602 8.69874 17.1815 9.25634 17.4087 9.90027H21.9946V12.0997H17.4087C17.1815 12.7437 16.7602 13.3013 16.2028 13.6957C15.6454 14.0901 14.9793 14.3019 14.2965 14.3019C13.6137 14.3019 12.9476 14.0901 12.3902 13.6957C11.8328 13.3013 11.4115 12.7437 11.1843 12.0997H0V9.90027H11.1843ZM4.58588 2.20216C4.81308 1.55823 5.23443 1.00063 5.79184 0.606216C6.34925 0.211804 7.01528 0 7.69811 0C8.38095 0 9.04698 0.211804 9.60439 0.606216C10.1618 1.00063 10.5831 1.55823 10.8104 2.20216H21.9946V4.40162H10.8104C10.5831 5.04555 10.1618 5.60315 9.60439 5.99756C9.04698 6.39197 8.38095 6.60377 7.69811 6.60377C7.01528 6.60377 6.34925 6.39197 5.79184 5.99756C5.23443 5.60315 4.81308 5.04555 4.58588 4.40162H0V2.20216H4.58588Z" fill={isActive ? "url(#paint0_linear_general)" : "white"} />
          {isActive && (
            <defs>
              <linearGradient id="paint0_linear_general" x1="42.4121" y1="11.1305" x2="11.656" y2="-19.6177" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00EEFF" />
                <stop offset="1" stopColor="#0051FF" />
              </linearGradient>
            </defs>
          )}
        </svg>
      )
    },
    ...(page === 'editor-page' ? [] : [{
      id: "trim",
      label: "Trim",
      icon: (isActive: boolean) => (
        <svg width="21" height="23" viewBox="0 0 21 23" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10.4918 13.3082L8.68117 15.1188C9.26084 16.0956 9.46436 17.2503 9.25358 18.3664C9.0428 19.4826 8.43219 20.4835 7.5362 21.1816C6.64022 21.8797 5.52038 22.2271 4.38659 22.1586C3.25281 22.0901 2.18292 21.6105 1.37749 20.8096C0.572051 20.0087 0.0863617 18.9415 0.0114619 17.8082C-0.0634378 16.6748 0.277594 15.553 0.970632 14.6531C1.66367 13.7532 2.66113 13.1369 3.77604 12.9198C4.89096 12.7027 6.04677 12.8997 7.02683 13.4738L8.841 11.6585L5.19633 8.01267C4.86826 7.68449 4.68396 7.23945 4.68396 6.77542C4.68396 6.31138 4.86826 5.86634 5.19633 5.53817L5.60933 5.12517L10.4918 10.0077L15.379 5.1205L15.7908 5.5335C16.1186 5.86163 16.3026 6.30642 16.3026 6.77017C16.3026 7.23392 16.1186 7.67871 15.7908 8.00683L12.1415 11.6585L13.9627 13.4785C14.9411 12.9016 16.0964 12.7013 17.2119 12.9153C18.3274 13.1292 19.3266 13.7426 20.0222 14.6406C20.7178 15.5386 21.062 16.6594 20.9903 17.793C20.9186 18.9266 20.4359 19.9951 19.6327 20.7982C18.8296 21.6014 17.7611 22.0841 16.6275 22.1558C15.4939 22.2275 14.3731 21.8833 13.4751 21.1877C12.5771 20.4921 11.9637 19.4929 11.7498 18.3774C11.5358 17.2619 11.7361 16.1066 12.313 15.1282L10.4918 13.3082ZM18.6667 11.6667V2.33333H2.33333V11.6667H0V1.16667C0 0.857247 0.122916 0.560501 0.341709 0.341709C0.560501 0.122916 0.857247 0 1.16667 0H19.8333C20.1428 0 20.4395 0.122916 20.6583 0.341709C20.8771 0.560501 21 0.857247 21 1.16667V11.6667H18.6667ZM4.66667 19.8333C5.2855 19.8333 5.879 19.5875 6.31658 19.1499C6.75417 18.7123 7 18.1188 7 17.5C7 16.8812 6.75417 16.2877 6.31658 15.8501C5.879 15.4125 5.2855 15.1667 4.66667 15.1667C4.04783 15.1667 3.45434 15.4125 3.01675 15.8501C2.57917 16.2877 2.33333 16.8812 2.33333 17.5C2.33333 18.1188 2.57917 18.7123 3.01675 19.1499C3.45434 19.5875 4.04783 19.8333 4.66667 19.8333ZM16.3333 19.8333C16.9522 19.8333 17.5457 19.5875 17.9832 19.1499C18.4208 18.7123 18.6667 18.1188 18.6667 17.5C18.6667 16.8812 18.4208 16.2877 17.9832 15.8501C17.5457 15.4125 16.9522 15.1667 16.3333 15.1667C15.7145 15.1667 15.121 15.4125 14.6834 15.8501C14.2458 16.2877 14 16.8812 14 17.5C14 18.1188 14.2458 18.7123 14.6834 19.1499C15.121 19.5875 15.7145 19.8333 16.3333 19.8333Z" fill={isActive ? "url(#paint0_linear_trim)" : "white"} />
          {isActive && (
            <defs>
              <linearGradient id="paint0_linear_trim" x1="40.4942" y1="11.215" x2="9.54974" y2="-18.0997" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00EEFF" />
                <stop offset="1" stopColor="#0051FF" />
              </linearGradient>
            </defs>
          )}
        </svg>
      )
    }]),
    {
      id: "bumpers",
      label: "Bumpers",
      icon: (isActive: boolean) => (
        <svg width="23" height="20" viewBox="0 0 23 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.7756 4.44444L20.3422 0H21.12C21.7289 0 22.2222 0.494445 22.2222 1.10333V18.8967C22.2202 19.1885 22.1034 19.4678 21.8972 19.6742C21.691 19.8806 21.4118 19.9977 21.12 20H1.10222C0.809793 19.9997 0.529441 19.8833 0.322766 19.6764C0.116091 19.4696 -1.48284e-07 19.1891 0 18.8967V1.10333C0.00203338 0.811531 0.118778 0.532242 0.325014 0.325797C0.531251 0.119353 0.810422 0.00232739 1.10222 0H4.44222L1.87556 4.44444H4.44222L7.00889 0H11.1089L8.54222 4.44444H11.1089L13.6756 0H17.7756L15.2089 4.44444H17.7756Z" fill={isActive ? "url(#paint0_linear_bumpers)" : "white"} />
          {isActive && (
            <defs>
              <linearGradient id="paint0_linear_bumpers" x1="42.4121" y1="11.1305" x2="11.656" y2="-19.6177" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00EEFF" />
                <stop offset="1" stopColor="#0051FF" />
              </linearGradient>
            </defs>
          )}
        </svg>
      )
    },
    {
      id: "graphics",
      label: "Graphics",
      icon: (isActive: boolean) => (
        <svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19.8 2.2H2.2V17.6L12.4212 7.3766C12.6275 7.17038 12.9072 7.05453 13.1989 7.05453C13.4906 7.05453 13.7703 7.17038 13.9766 7.3766L19.8 13.211V2.2ZM0 1.0923C0.00201305 0.803416 0.11759 0.526919 0.321764 0.322539C0.525938 0.11816 0.802318 0.00230411 1.0912 0H20.9088C21.5116 0 22 0.4895 22 1.0923V18.7077C21.998 18.9966 21.8824 19.2731 21.6782 19.4775C21.4741 19.6818 21.1977 19.7977 20.9088 19.8H1.0912C0.801695 19.7997 0.524146 19.6845 0.319538 19.4797C0.11493 19.2749 -1.46801e-07 18.9972 0 18.7077V1.0923ZM6.6 8.8C6.01652 8.8 5.45694 8.56821 5.04436 8.15563C4.63178 7.74305 4.4 7.18348 4.4 6.6C4.4 6.01652 4.63178 5.45694 5.04436 5.04436C5.45694 4.63178 6.01652 4.4 6.6 4.4C7.18348 4.4 7.74305 4.63178 8.15563 5.04436C8.56821 5.45694 8.8 6.01652 8.8 6.6C8.8 7.18348 8.56821 7.74305 8.15563 8.15563C7.74305 8.56821 7.18348 8.8 6.6 8.8Z" fill={isActive ? "url(#paint0_linear_graphics)" : "white"} />
          {isActive && (
            <defs>
              <linearGradient id="paint0_linear_graphics" x1="42.4121" y1="11.1305" x2="11.656" y2="-19.6177" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00EEFF" />
                <stop offset="1" stopColor="#0051FF" />
              </linearGradient>
            </defs>
          )}
        </svg>
      )
    },
    {
      id: "overlays",
      label: "Overlays",
      icon: (isActive: boolean) => (
        <div className="w-6 h-5 relative">
          <div className={`w-4 h-4 rounded-sm absolute left-0 top-1 ${isActive ? 'bg-gradient-to-br from-[#00EEFF] to-[#0051FF]' : 'bg-white'}`}></div>
          <div className={`w-4 h-4 rounded-sm absolute left-2 top-0 ${isActive ? 'bg-gradient-to-br from-[#00EEFF] to-[#0051FF]' : 'bg-white'}`}></div>
        </div>
      )
    },
  ];

  // Expose the save function to parent component
  React.useEffect(() => {
    if (saveChangesRef) {
      saveChangesRef.current = generalTabSaveRef.current;
    }
  }, [saveChangesRef]);

  // Handle tab switching with automatic save
  const handleTabSwitch = async (newTabId: string) => {
    // If switching away from general tab, save changes first
    if (activeTab === "general" && generalTabSaveRef.current) {
      try {
        await generalTabSaveRef.current();
      } catch (error) {
        console.error('Failed to save changes before tab switch:', error);
        // Continue with tab switch even if save fails
      }
    }
    setActiveTab(newTabId);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return <GeneralTab 
          activeClip={activeClip} 
          page={page} 
          onSaveChanges={generalTabSaveRef}
          clipName={clipName}
          setClipName={setClipName}
          tags={tags}
          setTags={setTags}
          rating={rating}
          setRating={setRating}
        />;
      case "trim":
        return <TrimTab activeClip={activeClip} />;
      case "bumpers":
        return <BumpersTab activeClip={activeClip} page={page} />;
      case "graphics":
        return <GraphicsTab activeClip={activeClip} />;
      case "overlays":
        return <OverlaysTab activeClip={activeClip} />;
      default:
        return null;
    }
  };

  return (
    <div
      className="bg-[#18191B] border-l border-[#252525] flex flex-col w-full max-w-[540px] min-w-[320px] flex-shrink-0"
    >
      {/* Tab Headers */}
      <div className="border-b border-[#252525] p-6">
        <div className="flex justify-between items-center">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <div key={tab.id} className="rounded-lg" style={isActive ? { padding: "1px", background: "linear-gradient(135deg, #00EEFF, #0051FF)" } : {}}>
                <button
                  type="button"
                  onClick={() => handleTabSwitch(tab.id)}
                  className={`flex flex-col items-center w-28 text-xs font-medium px-4 py-4 rounded-lg transition-colors ${isActive ? "bg-[#18191B] text-white" : "text-white hover:bg-[#252525]"}`}
                >
                  <div className="mb-1 w-6 h-6 flex items-center justify-center">
                    {typeof tab.icon === 'function' ? tab.icon(isActive) : tab.icon}
                  </div>
                  <span>{tab.label}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 217px)' }}>
        <div className="h-full">
          {renderTabContent()}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="border-t border-[#252525] p-6">
        {/* Progress UI */}
        {/* {currentIsGenerating && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white text-sm font-medium">Generating Highlight</span>
              <span className="text-white text-sm">{currentGenerationProgress}%</span>
            </div>
            <div className="w-full bg-[#1B1B1B] rounded-full h-2 mb-2">
              <div 
                className="bg-gradient-to-r from-[#00BBFF] to-[#0051FF] h-2 rounded-full transition-all duration-300"
                style={{ width: `${currentGenerationProgress}%` }}
              ></div>
            </div>
            <p className="text-gray-400 text-xs">{currentGenerationStatus}</p>
          </div>
        )} */}
        
        <div className="flex gap-6">
          <button
            type="button"
            className="bg-[#1B1B1B] border border-[#00EEFF]/50 text-white rounded-xl hover:bg-[#252525] hover:border-[#00EEFF] transition-colors flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ height: '42px' }}
            disabled={currentIsGenerating}
            onClick={() => navigate(`/clips/${activeClip?.streamId}`)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="text-white rounded-xl hover:opacity-90 transition-opacity flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ height: '42px', background: 'linear-gradient(135deg, #00EEFF 0%, #0051FF 100%)' }}
            onClick={onGenerateHighlight}
            disabled={currentIsGenerating}
          >
            {generateLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorSidebar;
