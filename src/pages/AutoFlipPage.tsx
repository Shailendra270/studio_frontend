import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import HelpButton from "@/containers/help_section/HelpButton";
import Sidebar from "@/layouts/dashboard/Sidebar";
import DownloadPanel from "@/components/download/DownloadPanel";
import EditorHeader from "@/layouts/highlightEditor/EditorHeader";
import AiReframeTab, { AiReframeRatioGrid, AiReframeHeader, AI_REFRAME_RESTRICTED_RATIOS_ACCOUNT_EMAIL, AI_REFRAME_ALLOWED_RATIOS_FOR_RESTRICTED } from "@/layouts/autoFlipPage/AiReframeTab";
import ManualTab, { ManualPreview, ManualHeader } from "@/layouts/autoFlipPage/ManualTab";
import SaveAsClipModal from "@/components/modals/SaveAsClipModal";
import { deleteEditedClip, overwriteClipById, saveClipAsNew } from "@/api/clipApi";
import { toast } from "sonner";
import { downloadFile } from '@/utils/download';
import { autoflip } from "@/api/clipApi";
import { fetchClipById, selectCurrentClip, selectClipLoading, selectClipsError, clearCurrentClip } from '../store/slices/clipsSlice';
import { useAppDispatch, useAppSelector } from '../store';
import { selectUser } from '../store/slices/authSlice';

interface AspectRatio {
    id: string;
    label: string;
    ratio: string;
    dimensions: string;
    isSelected?: boolean;
}

interface ClipData {
    id: string;
    title: string;
    aspectRatio: string;
    thumbnail: string;
    videoUrl?: string;
    duration: string;
    thumbnailUrl?: string;
}

interface AutoFlipProps {
    page: string;
}

const AutoFlipPage: React.FC<AutoFlipProps> = () => {
    const { clipId } = useParams<{ clipId: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const user = useAppSelector(selectUser);
    const allowedRatios = user?.email === AI_REFRAME_RESTRICTED_RATIOS_ACCOUNT_EMAIL ? AI_REFRAME_ALLOWED_RATIOS_FOR_RESTRICTED : undefined;

    // State hooks
    const [activeTab, setActiveTab] = useState<"ai-reframe" | "manual">("ai-reframe");
    const [selectedRatio, setSelectedRatio] = useState<string>("4:3");
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState("1.25x");
    const [ratio, setRatio] = useState("9 : 16");
    const [overrideVideoUrl, setOverrideVideoUrl] = useState<string | undefined>();
    const [overridePosterUrl, setOverridePosterUrl] = useState<string | undefined>();
    const [generating, setGenerating] = useState<Record<string, { active: boolean; event: 'autoFlip' | 'dynamicCropped' }>>({});
    const [generatingDynamic, setGeneratingDynamic] = useState<Array<{ ratio: string; active: boolean }>>([]);
    const [manualCropBox, setManualCropBox] = useState<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 0, height: 0 });
    const [manualDims, setManualDims] = useState<{ width: number; height: number }>({ width: 800, height: 450 });
    const [manualCurrentTime, setManualCurrentTime] = useState<number>(0);
    const [manualPlaybackRate, setManualPlaybackRate] = useState<number>(1.25);
    const [previewEnabled, setPreviewEnabled] = React.useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [saveStep, setSaveStep] = useState<"choice" | "new">("choice");
    const [newClipTitle, setNewClipTitle] = useState("");
    const [pendingAspectRatio, setPendingAspectRatio] = useState<string | undefined>(undefined);
    const [pendingDocumentId, setPendingDocumentId] = useState<string | undefined>(undefined);
    // Crop box state
    const [cropBox, setCropBox] = useState({
        x: 100, // Default position
        y: 50,
        width: 253, // Default 9:16 ratio
        height: 450
    });

    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Ref hook
    // const cropBoxRef = useRef<HTMLDivElement>(null);

    // Redux selectors
    const currentClip = useAppSelector(selectCurrentClip);
    const clipLoading = useAppSelector(selectClipLoading);
    const error = useAppSelector(selectClipsError);

    // When account is restricted to 16:9 and 9:16, keep selectedRatio in that set
    useEffect(() => {
        if (allowedRatios?.length && activeTab === "ai-reframe" && !allowedRatios.includes(selectedRatio)) {
            setSelectedRatio(allowedRatios[0]);
        }
    }, [allowedRatios, activeTab, selectedRatio]);

    // Use only real clip data from Redux
    const activeClip = currentClip;

    const handleCloseSaveModal = useCallback(() => setIsSaveModalOpen(false), []);
    const handleOverwriteModal = useCallback(async () => {
        try {
            const id = (activeClip as any)?._id || (activeClip as any)?.id;
            if (!id) return;
            const resp = await overwriteClipById(id);
            if (resp?.success) {
                toast.success('Clip overwritten successfully');
                setIsSaveModalOpen(false);
                dispatch(fetchClipById(id));
            } else {
                toast.error(resp?.message || 'Overwrite failed');
            }
        } catch (e: any) {
            toast.error(e?.message || 'Overwrite failed');
        }
    }, [activeClip, dispatch]);

    const handleSaveNewModal = useCallback(async () => {
        try {
            const id = (activeClip as any)?._id || (activeClip as any)?.id;
            if (!id || !newClipTitle.trim()) { toast.error('Please enter a title'); return; }
            const resp = await saveClipAsNew(
                id,
                newClipTitle.trim(),
                pendingAspectRatio || String(selectedRatio || '') || (activeClip as any)?.aspectRatio || '16:9',
                pendingDocumentId
            );
            if (resp?.success) {
                toast.success('New clip created');
                setIsSaveModalOpen(false);
            } else {
                toast.error(resp?.message || 'Save failed');
            }
        } catch (e: any) {
            toast.error(e?.message || 'Save failed');
        }
    }, [activeClip, newClipTitle, pendingAspectRatio, selectedRatio, pendingDocumentId]);

    const getEditedVideoForRatio = useCallback((r: string) => {
        const list = (activeClip as any)?.editedVideos || [];
        const normalize = (s: string) => String(s || '').replace(/\s/g, '');
        return list.find((ev: any) => normalize(ev.aspect_ratio) === normalize(r) && String(ev?.event || '').toLowerCase() === 'autoflip');
    }, [activeClip]);

    const handleGenerate = useCallback(async (r: string) => {
        if (!clipId) return;
        setGenerating(prev => ({ ...prev, [r]: { active: true, event: 'autoFlip' } }));
        toast.success("Process initiated successfully!");
        try {
            const res = await autoflip(clipId, r);
            toast.success(`Clip generated successfully for ratio ${r}`);
            // Refresh clip details to get updated editedVideos
            dispatch(fetchClipById(clipId));
        } catch (e: any) {
            toast.error(e?.message || `Failed to start ${r}`);
        }
    }, [clipId, dispatch]);
    
    useEffect(() => {
        // When editedVideos arrives for a ratio, clear its generating flag
        const gens = Object.keys(generating || {});
        if (!gens.length) return;
        const next: Record<string, { active: boolean; event: 'autoFlip' | 'dynamicCropped' }> = { ...generating };
        gens.forEach((r) => {
            const current = generating[r];
            if (current?.active) {
                const ev: any = getEditedVideoForRatio(r);
                if (ev) next[r] = { ...current, active: false };
            }
        });
        // Only update if any changed
        if (JSON.stringify(next) !== JSON.stringify(generating)) {
            setGenerating(next);
        }
    }, [activeClip, generating, getEditedVideoForRatio]);

    useEffect(() => {
        // Clear manual placeholders once server reflects the generating entry
        const list = (activeClip as any)?.editedVideos || [];
        if (!Array.isArray(list) || !list.length) return;
        const presentRatios = new Set<string>(
            list.map((ev: any) => String(ev?.aspect_ratio || '').replace(/\s/g, ''))
        );
        const next = (generatingDynamic || []).filter(item => !presentRatios.has(String(item.ratio).replace(/\s/g, '')));
        if (JSON.stringify(next) !== JSON.stringify(generatingDynamic)) setGeneratingDynamic(next);
    }, [activeClip, generatingDynamic]);

    const handlePlay = useCallback((r: string) => {
        let videoUrl: string | undefined;
        let poster: string | undefined;

        if (r === String(activeClip?.aspectRatio || '').replace(/\s/g, '')) {
            videoUrl = (activeClip as any)?.videoUrl;
            poster = (activeClip as any)?.thumbnailUrl || (activeClip as any)?.thumbnail;
        }

        if (!videoUrl) {
            const ev: any = getEditedVideoForRatio(r);
            videoUrl = ev?.videoUrl;
            poster = ev?.thumbnailUrl || (Array.isArray(ev?.thumbnails) ? ev.thumbnails[0] : undefined);
        }

        if (videoUrl) {
            setOverrideVideoUrl(videoUrl);
            setOverridePosterUrl(poster);
            setActiveTab("ai-reframe");
            setSelectedRatio(r);
        } else {
            toast.info("No video available yet for this ratio");
        }
    }, [activeClip, getEditedVideoForRatio]);

    const getThumbForRatio = useCallback((r: string): string | undefined => {
        if (r === String(activeClip?.aspectRatio || '').replace(/\s/g, '')) {
            return (activeClip as any)?.thumbnailUrl || (activeClip as any)?.thumbnail;
        }
        const ev: any = getEditedVideoForRatio(r);
        if (!ev || String(ev?.event || '').toLowerCase() !== 'autoflip') return undefined;
        return ev?.thumbnailUrl || (Array.isArray(ev?.thumbnails) ? ev.thumbnails[0] : undefined);
    }, [activeClip, getEditedVideoForRatio]);

    // Video container dimensions
    const videoWidth = 800;
    const videoHeight = 450;

    // Calculate crop box dimensions based on ratio
    const calculateCropDimensions = useCallback((selectedRatio: string) => {
        let aspectRatio = 9 / 16; // Default

        switch (selectedRatio) {
            case "9 : 16":
                aspectRatio = 9 / 16;
                break;
            case "9 : 18":
                aspectRatio = 9 / 18;
                break;
            case "4 : 5":
                aspectRatio = 4 / 5;
                break;
            case "4 : 3":
                aspectRatio = 4 / 3;
                break;
            case "3 : 4":
                aspectRatio = 3 / 4;
                break;
            case "1 : 1":
                aspectRatio = 1;
                break;
        }

        let width, height;

        if (aspectRatio > videoWidth / videoHeight) {
            // Width-constrained
            width = Math.min(videoWidth * 0.6, videoWidth);
            height = width / aspectRatio;
        } else {
            // Height-constrained
            height = Math.min(videoHeight * 0.9, videoHeight);
            width = height * aspectRatio;
        }

        return { width: Math.round(width), height: Math.round(height) };
    }, [videoWidth, videoHeight]);

    // Handle ratio change
    const handleRatioChange = useCallback((newRatio: string) => {
        setRatio(newRatio);
        const newDimensions = calculateCropDimensions(newRatio);

        setCropBox(prev => ({
            ...prev,
            width: newDimensions.width,
            height: newDimensions.height,
            // Center the crop box
            x: Math.max(0, Math.min((videoWidth - newDimensions.width) / 2, videoWidth - newDimensions.width)),
            y: Math.max(0, Math.min((videoHeight - newDimensions.height) / 2, videoHeight - newDimensions.height))
        }));
    }, [calculateCropDimensions, videoWidth, videoHeight]);

    // Drag handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({
            x: e.clientX - cropBox.x,
            y: e.clientY - cropBox.y
        });
    }, [cropBox.x, cropBox.y]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;

        // Get the video container bounds for more accurate positioning
        const videoContainer = document.querySelector('.video-crop-area');
        if (!videoContainer) return;

        const rect = videoContainer.getBoundingClientRect();
        const relativeX = e.clientX - rect.left - dragStart.x;
        const relativeY = e.clientY - rect.top - dragStart.y;

        const newX = Math.max(0, Math.min(relativeX, videoWidth - cropBox.width));
        const newY = Math.max(0, Math.min(relativeY, videoHeight - cropBox.height));

        setCropBox(prev => ({
            ...prev,
            x: newX,
            y: newY
        }));
    }, [isDragging, dragStart, videoWidth, videoHeight, cropBox.width, cropBox.height]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Calculate preview crop area
    const getPreviewStyle = useCallback(() => {
        const scaleX = 100 / cropBox.width; // Assuming preview is about 100% of crop area
        const scaleY = 100 / cropBox.height;

        return {
            backgroundImage: `url('https://api.builder.io/api/v1/image/assets/TEMP/f08ef499d0e3060b3159a6747ba6b56973b9551c?width=1630')`,
            backgroundPosition: `-${cropBox.x * scaleX}% -${cropBox.y * scaleY}%`,
            backgroundSize: `${(videoWidth * scaleX)}% ${(videoHeight * scaleY)}%`,
            backgroundRepeat: 'no-repeat'
        };
    }, [cropBox, videoWidth, videoHeight]);

    // Fetch clip data when component mounts or clipId changes
    useEffect(() => {
        if (clipId) {
            dispatch(fetchClipById(clipId));
        }
        // Cleanup when component unmounts
        return () => {
            dispatch(clearCurrentClip());
        };
    }, [clipId, dispatch]);

    // Initialize crop box on mount
    useEffect(() => {
        const initialDimensions = calculateCropDimensions(ratio);
        setCropBox({
            x: Math.max(0, (videoWidth - initialDimensions.width) / 2),
            y: Math.max(0, (videoHeight - initialDimensions.height) / 2),
            width: initialDimensions.width,
            height: initialDimensions.height
        });
    }, [ratio, calculateCropDimensions, videoWidth, videoHeight]);

    // Add global mouse event listeners
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    const handleGoBack = () => {
        navigate(-1);
    };

    const handleDownload = async () => {
        try {
            const url = (activeClip as any)?.videoUrl || '';
            if (!url) { toast.error('Video not available for download'); return; }
            await downloadFile(url, (activeClip as any)?.title || 'video');
        } catch (e) {
            toast.error('Download failed');
        }
    };

    const handleShare = () => {
        console.log('Share clip:', activeClip?._id);
    };

    const handleReframeVideo = () => {
        console.log('Reframe video with ratio:', selectedRatio);
        toast.success(`Reframing video to ${selectedRatio} aspect ratio`);
    };

    const handleCancel = () => {
        navigate(-1);
    };

    const SpeedIcon = () => (
        <svg width="19" height="20" viewBox="0 0 19 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 6V10L0 5L6 0V4H11C13.1217 4 15.1566 4.84285 16.6569 6.34315C18.1571 7.84344 19 9.87827 19 12C19 14.1217 18.1571 16.1566 16.6569 17.6569C15.1566 19.1571 13.1217 20 11 20H2V18H11C12.5913 18 14.1174 17.3679 15.2426 16.2426C16.3679 15.1174 17 13.5913 17 12C17 10.4087 16.3679 8.88258 15.2426 7.75736C14.1174 6.63214 12.5913 6 11 6H6Z" fill="white" />
        </svg>
    );

    const ForwardIcon = () => (
        <svg width="19" height="20" viewBox="0 0 19 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 6V10L19 5L13 0V4H8C5.87827 4 3.84344 4.84285 2.34315 6.34315C0.842854 7.84344 0 9.87827 0 12C0 14.1217 0.842854 16.1566 2.34315 17.6569C3.84344 19.1571 5.87827 20 8 20H17V18H8C6.4087 18 4.88258 17.3679 3.75736 16.2426C2.63214 15.1174 2 13.5913 2 12C2 10.4087 2.63214 8.88258 3.75736 7.75736C4.88258 6.63214 6.4087 6 8 6H13Z" fill="white" />
        </svg>
    );

    const PlayIcon = () => (
        <svg width="11" height="18" viewBox="0 0 11 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.2857 9L-3.14722e-06 18L0 0L10.2857 9Z" fill="white" />
        </svg>
    );

    const PauseIcon = () => (
        <div className="flex gap-1">
            <div className="w-1 h-5 bg-white rounded"></div>
            <div className="w-1 h-5 bg-white rounded"></div>
        </div>
    );

    // Show loading state while fetching clip data
    if (clipLoading) {
        return (
            <div className="flex h-screen bg-[#18191B] text-white items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p>Loading clip...</p>
                </div>
            </div>
        );
    }

    // Show error state if there's an error or no clip found
    if (error || !activeClip) {
        return (
            <div className="flex h-screen bg-[#18191B] text-white items-center justify-center">
                <div className="text-center">
                    <p>{error || 'Clip not found'}</p>
                    <Button onClick={() => navigate('/clips')} className="mt-4">
                        Go back to clips
                    </Button>
                </div>
            </div>
        );
    }

    // Log active clip for debugging
    // console.log('Active clip:', activeClip);

    return (
        <>
            <div className="h-screen bg-[#18191B] text-white flex overflow-x-auto overflow-y-auto">
                {/* Left Sidebar */}
                <Sidebar />

                {/* Main Content */}
                <div className="flex-1 flex">
                    <div className="flex-1">
                        <div className="flex items-center gap-5 px-2 py-2 flex-shrink-0 bg-[#18191B] z-10">
                            {/* Header */}
                            <EditorHeader
                                highlightName={activeClip?.title || "Untitled"}
                                aspectRatio={activeClip?.aspectRatio || ""}
                                onBack={() => navigate(`/clips/${activeClip?.streamId}`)}
                                onDownload={handleDownload}
                                data={activeClip}
                                type="clip"
                            />
                        </div>

                        {/* Content Area */}
                        <div className="flex-1" style={{ maxWidth: "1000px" }}>
                            {/* Video Player Area */}
                            {activeTab === "ai-reframe" && (
                                <AiReframeTab clip={activeClip} videoUrlOverride={overrideVideoUrl} posterOverride={overridePosterUrl} />
                            )}
                            {activeTab === "manual" && (
                                <ManualTab
                                    clip={activeClip}
                                    ratio={ratio}
                                    onRatioChange={handleRatioChange}
                                    onCropChange={(box, dims) => { setManualCropBox(box); if (dims) setManualDims(dims); }}
                                    onTimeUpdate={setManualCurrentTime}
                                    onPlaybackRateChange={setManualPlaybackRate}
                                    previewEnabled={previewEnabled}
                                    setPreviewEnabled={setPreviewEnabled}
                                    isPlaying={isPlaying}
                                    setIsPlaying={setIsPlaying}
                                    onSubmittingChange={(v: boolean) => {
                                        const keyRatio = String(ratio).replace(/\s/g, '');
                                        setGenerating(prev => ({ ...prev, [keyRatio]: { active: v, event: 'dynamicCropped' } }));
                                        if (v) setGeneratingDynamic(prev => ([...prev, { ratio: keyRatio, active: true }]));
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    {/* Right Sidebar - Aspect Ratios */}
                    <div className="flex-1 flex flex-col px-6">
                        {/* AI Reframe / Manual Flip Selector */}
                        <div className="mb-1">
                            <div className="flex bg-[#1B1B1B] rounded-xl p-1">
                                <button
                                    className={`flex-1 py-4 px-4 rounded-lg text-base font-medium transition-all shadow-lg ${activeTab === "ai-reframe"
                                        ? "bg-[#000] text-white"
                                        : "text-gray-400 hover:bg-[#2A2A2A] hover:text-white"
                                        }`}
                                    onClick={() => setActiveTab("ai-reframe")}
                                >
                                    <div className="flex items-center justify-center mb-3">
                                        <svg
                                            width="19"
                                            height="22"
                                            viewBox="0 0 19 22"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M7.33333 3.14286V0L12.5714 4.19048L7.33333 8.38095V5.2381H5.2381C4.40456 5.2381 3.60516 5.56922 3.01576 6.15862C2.42636 6.74802 2.09524 7.54742 2.09524 8.38095V12.5714H0V8.38095C0 6.99172 0.551869 5.65939 1.5342 4.67706C2.51654 3.69473 3.84887 3.14286 5.2381 3.14286H7.33333ZM6.28571 10.4762C6.28571 10.1983 6.39609 9.93188 6.59256 9.73541C6.78902 9.53895 7.05549 9.42857 7.33333 9.42857H17.8095C18.0874 9.42857 18.3538 9.53895 18.5503 9.73541C18.7468 9.93188 18.8571 10.1983 18.8571 10.4762V20.9524C18.8571 21.2302 18.7468 21.4967 18.5503 21.6932C18.3538 21.8896 18.0874 22 17.8095 22H7.33333C7.05549 22 6.78902 21.8896 6.59256 21.6932C6.39609 21.4967 6.28571 21.2302 6.28571 20.9524V10.4762Z"
                                                fill="url(#paint0_linear_ai_icon)"
                                            />
                                            <defs>
                                                <linearGradient
                                                    id="paint0_linear_ai_icon"
                                                    x1="36.3621"
                                                    y1="11.1305"
                                                    x2="5.96791"
                                                    y2="-14.9213"
                                                    gradientUnits="userSpaceOnUse"
                                                >
                                                    <stop stopColor="#00EEFF" />
                                                    <stop offset="1" stopColor="#0051FF" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                    </div>{" "}
                                    AI reframe
                                </button>
                                <button
                                    className={`flex-1 py-4 px-4 rounded-lg text-base font-medium transition-all shadow-lg ${activeTab === "manual"
                                        ? "bg-[#000] text-white"
                                        : "text-gray-400 hover:bg-[#2A2A2A] hover:text-white"
                                        } ${String((activeClip as any)?.aspectRatio || '') !== '16:9' ? 'cursor-not-allowed' : ''}`}
                                    disabled={String((activeClip as any)?.aspectRatio || '') !== '16:9'}
                                    onClick={() => { if (String((activeClip as any)?.aspectRatio || '') === '16:9') setActiveTab("manual") }}
                                >
                                    <div className="mb-3 flex justify-center">
                                        <svg
                                            width="22"
                                            height="22"
                                            viewBox="0 0 22 22"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M13.2 4.4H15.4V6.6H20.9C21.1917 6.6 21.4715 6.71589 21.6778 6.92218C21.8841 7.12847 22 7.40826 22 7.7V15.95L15.4 12.1L15.4396 20.9682L17.8849 18.6032L19.8451 22H7.7C7.40826 22 7.12847 21.8841 6.92218 21.6778C6.71589 21.4715 6.6 21.1917 6.6 20.9V15.4H4.4V13.2H6.6V7.7C6.6 7.40826 6.71589 7.12847 6.92218 6.92218C7.12847 6.71589 7.40826 6.6 7.7 6.6H13.2V4.4ZM22 16.8718V20.9C22.0001 21.0146 21.9823 21.1286 21.9472 21.2377L19.7912 17.5043L22 16.8718ZM2.2 13.2V15.4H0V13.2H2.2ZM2.2 8.8V11H0V8.8H2.2ZM2.2 4.4V6.6H0V4.4H2.2ZM2.2 0V2.2H0V0H2.2ZM6.6 0V2.2H4.4V0H6.6ZM11 0V2.2H8.8V0H11ZM15.4 0V2.2H13.2V0H15.4Z"
                                                fill="white"
                                            />
                                        </svg>
                                    </div>{" "}
                                    Manual flip
                                </button>
                            </div>
                        </div>

                        {/* Available Ratios */}
                        {activeTab === "ai-reframe" && (<AiReframeHeader />)}

                        {activeTab === "manual" && (<ManualHeader ratio={ratio} />)}

                        {/* Aspect Ratio Grid */}
                        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 mb-8">
                            {activeTab === "ai-reframe" && (
                                <AiReframeRatioGrid
                                    selectedRatio={selectedRatio}
                                    onSelectRatio={setSelectedRatio}
                                    getThumbForRatio={getThumbForRatio}
                                    getEditedVideoForRatio={getEditedVideoForRatio}
                                    generating={generating}
                                    onPlay={handlePlay}
                                    onGenerate={handleGenerate}
                                    clipAspectRatio={String((activeClip as any)?.aspectRatio || '')}
                                    allowedRatios={allowedRatios}
                                />
                            )}
                            {activeTab === "manual" && (
                                <div className="mt-6">
                                    <ManualPreview
                                        videoUrl={(activeClip as any)?.videoUrl}
                                        currentTime={manualCurrentTime}
                                        playbackRate={manualPlaybackRate}
                                        cropBox={manualCropBox}
                                        videoWidth={manualDims.width}
                                        videoHeight={manualDims.height}
                                        ratio={ratio}
                                        previewEnabled={previewEnabled}
                                        isPlaying={isPlaying}
                                        editedVideos={(activeClip as any)?.editedVideos || []}
                                        generating={generating}
                                        generatingDynamic={generatingDynamic}
                                        onSaveAsClip={(ar: string, docId: string) => { setSaveStep("new"); setPendingAspectRatio(String(ar || '')); setPendingDocumentId(String(docId || '')); setIsSaveModalOpen(true); }}
                                        onDelete={async (docId: string) => {
                                            try {
                                                const id = (activeClip as any)?._id || (activeClip as any)?.id;
                                                if (!id || !docId) return;
                                                const resp = await deleteEditedClip(id, docId);
                                                if (resp?.success) {
                                                    toast.success('Clip deleted successfully');
                                                    dispatch(fetchClipById(id));
                                                } else {
                                                    toast.error(resp?.message || 'Delete failed');
                                                }
                                            } catch (e: any) {
                                                toast.error(e?.message || 'Delete failed');
                                            }
                                        }}
                                        onOverwriteClip={async () => {
                                            try {
                                                const id = (activeClip as any)?._id || (activeClip as any)?.id;
                                                if (!id) return;
                                                const resp = await overwriteClipById(id);
                                                if (resp?.success) {
                                                    toast.success('Clip overwritten successfully');
                                                    setIsSaveModalOpen(false);
                                                    dispatch(fetchClipById(id));
                                                } else {
                                                    toast.error(resp?.message || 'Overwrite failed');
                                                }
                                            } catch (e: any) {
                                                toast.error(e?.message || 'Overwrite failed');
                                            }
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        {/* <div className="flex justify-between items-center mt-6">
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 bg-transparent border border-[#373737] text-white rounded-lg hover:bg-[#2A2A2A] transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleReframeVideo}
                            className="px-6 py-2 bg-[#00BBFF] text-white rounded-lg hover:bg-[#0099CC] transition-colors font-medium text-sm"
                        >
                            Save as new
                        </button>
                    </div> */}

                        {/* Help Button */}
                        <HelpButton />
                    </div>
                </div>
                {/* </div> */}
            </div>
            {/* // </div> */}
            <SaveAsClipModal
                isOpen={isSaveModalOpen}
                onClose={handleCloseSaveModal}
                step={saveStep}
                onChangeStep={setSaveStep}
                currentTitle={(activeClip as any)?.title}
                streamId={(activeClip as any)?.streamId}
                aspectRatio={pendingAspectRatio || String(selectedRatio || '') || (activeClip as any)?.aspectRatio}
                newTitle={newClipTitle}
                onChangeTitle={setNewClipTitle}
                onOverwrite={handleOverwriteModal}
                onSaveNew={handleSaveNewModal}
            />
        <DownloadPanel />
        </>
    );
};

export default AutoFlipPage;
