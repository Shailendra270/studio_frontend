import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useDispatch } from 'react-redux';
import VideoPlayer from '@/components/common/VideoPlayer';
import { isSame, isSameOrBefore } from '@/utils/validations';
import ManageTagsModal from '@/components/modals/ManageTagsModal';
import { generateClip, ClipProgressTracker } from '@/api/clipApi';
import { fetchClips } from '@/store/slices/clipsSlice';
import { AppDispatch } from '@/store';
import { toast } from 'sonner';
interface SaveNewClipProps {
    onClose: () => void;
    clipStartTime?: number;
    clipEndTime?: number;
    streamUrl?: string;
    streamId?: string;
    sports?: string;
    entityId?: string;
    userId?: string;
    title?: string;
    unsavedClipId?: string;
    onSave?: (clipData: any) => void;
    onDelete?: () => void;
    onClipGenerated?: (clipData: any, unsavedClipId?: string) => void;
    onGenerateStart?: (unsavedClipId?: string) => void;
    onShowClipsSidebar?: () => void;
}

// Validation schema for the clip form
const clipValidationSchema = Yup.object().shape({
    clipName: Yup.string()
        .trim()
        .min(2, "Clip name must be at least 2 characters")
        .max(150, "Clip name must be at most 150 characters")
        .required("Clip name is required"),
    clipStartTime: Yup.string()
        .matches(/^\d{2}:\d{2}:\d{2}$/, "Time format must be HH:MM:SS")
        .test("not empty", "Start time can't be empty", function (value) {
            return !!value;
        })
        .test("start_time_test", "Start time must be greater than 00:00:00", function (value) {
            const endTime = "00:00:00";
            return !isSame(value || "", endTime);
        })
        .test("start_time_test", "Start time and End time cannot be same", function (value) {
            const { clipEndTime } = this.parent;
            return !isSame(value || "", clipEndTime || "");
        })
        .test("start_time_test", "Start time must be before end time", function (value) {
            const { clipEndTime } = this.parent;
            return isSameOrBefore(value || "", clipEndTime || "");
        })
        .required("Start time is required"),
    clipEndTime: Yup.string()
        .matches(/^\d{2}:\d{2}:\d{2}$/, "Time format must be HH:MM:SS")
        .test("not empty", "End time can't be empty", function (value) {
            return !!value;
        })
        .required("End time is required"),
});

const SaveNewClip: React.FC<SaveNewClipProps> = ({
    onClose,
    clipStartTime = "00:00:00",
    clipEndTime = "00:00:30",
    streamUrl = "",
    streamId = "Studio_test_stream",
    sports = "",
    entityId = "",
    userId = "",
    title = "",
    unsavedClipId,
    onSave,
    onDelete,
    onClipGenerated,
    onGenerateStart,
    onShowClipsSidebar
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const [rating, setRating] = useState(1);
    const [speed, setSpeed] = useState(1);
    const [tags, setTags] = useState([]);
    const [newTag, setNewTag] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentPreviewTime, setCurrentPreviewTime] = useState(clipStartTime);
    const [isMuted, setIsMuted] = useState(true);
    const [localClipStartTime, setLocalClipStartTime] = useState(clipStartTime);
    const [localClipEndTime, setLocalClipEndTime] = useState(clipEndTime);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progressTracker, setProgressTracker] = useState<ClipProgressTracker | null>(null);

    // Update local state when props change
    useEffect(() => {
        setLocalClipStartTime(clipStartTime);
        setLocalClipEndTime(clipEndTime);
    }, [clipStartTime, clipEndTime]);

    // Cleanup progress tracker on unmount
    useEffect(() => {
        return () => {
            if (progressTracker) {
                progressTracker.disconnect();
            }
        };
    }, [progressTracker]);

    // Polling mechanism to refresh clips while generating
    useEffect(() => {
        let pollInterval: NodeJS.Timeout;
        
        if (isGenerating && streamId) {
            // Poll every 3 seconds while generating
            pollInterval = setInterval(() => {
                dispatch(fetchClips({ streamId }));
            }, 3000);
        }
        
        return () => {
            if (pollInterval) {
                clearInterval(pollInterval);
            }
        };
    }, [isGenerating, streamId, dispatch]);

    // Video player reference for seek functionality
    const videoPlayerRef = useRef<any>(null);
    const clipVideoRef = useRef<HTMLDivElement>(null);
    const calculateDuration = (startTime: number, endTime: number) => {
        const diff = Math.max(0, endTime - startTime);
        return Math.floor(diff); // whole seconds, no decimals
    };
    const clipDuration = calculateDuration(localClipStartTime, localClipEndTime);
    const [showManageTagsModal, setShowManageTagsModal] = useState(false);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatTimeForInput = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const wholeSecs = Math.floor(seconds % 60);
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${wholeSecs.toString().padStart(2, '0')}`;
    };

    const parseTimeInput = (timeString: string): number => {
        if (!timeString) return -1; // Return -1 for invalid/empty input

        // Remove any extra spaces
        const cleanTimeStr = timeString.trim();

        // Check if it matches the expected HH:MM:SS format
        const timeRegex = /^\d{1,2}:\d{1,2}:\d{1,2}$/;
        if (!timeRegex.test(cleanTimeStr)) {
            return -1; // Invalid format
        }

        const parts = cleanTimeStr.split(':');
        if (parts.length === 3) {
            const hrs = parseInt(parts[0]) || 0;
            const mins = parseInt(parts[1]) || 0;
            const secs = parseInt(parts[2]) || 0;

            // Validate ranges
            if (mins >= 60 || secs >= 60) {
                return -1; // Invalid time values
            }

            return hrs * 3600 + mins * 60 + secs;
        }

        return -1; // Invalid format
    };

    const handleRatingClick = (newRating: number) => {
        setRating(newRating);
    };

    // const handleAddTag = () => {
    //     if (newTag.trim() && !tags.includes(newTag.trim())) {
    //         setTags([...tags, newTag.trim()]);
    //         setNewTag('');
    //     }
    // };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleDelete = () => {
        onDelete?.();
    };

    const handleOpenManageTagsModal = () => {
        setShowManageTagsModal(true);
    };

    const handleUpdateTags = (newTags: string[]) => {
        setTags(newTags);
        setShowManageTagsModal(false);
    };

    const initialValues = {
        clipName: title || '',
        clipStartTime: formatTimeForInput(clipStartTime),
        clipEndTime: formatTimeForInput(clipEndTime),
    };

    const handleSpeedChange = (newSpeed: number) => {
        setSpeed(newSpeed);
        if (videoPlayerRef.current) {
            videoPlayerRef.current.playbackRate(newSpeed);
        }
    };

    const handleMuteToggle = () => {
        if (videoPlayerRef.current) {
            const newMutedState = !isMuted;
            videoPlayerRef.current.muted(newMutedState);
            setIsMuted(newMutedState);
        }
    };

    const handleSeekBackward = () => {
        const newTime = Math.max(clipStartTime, currentPreviewTime - 10);
        seekToTime(newTime);
    };

    const handleSeekForward = () => {
        const newTime = Math.min(clipEndTime, currentPreviewTime + 10);
        seekToTime(newTime);
    };

    const handlePlayPause = () => {
        if (videoPlayerRef.current) {
            if (isPlaying) {
                videoPlayerRef.current.pause();
            } else {
                // Ensure we start from the current preview time within clip bounds
                const playTime = Math.max(clipStartTime, Math.min(clipEndTime, currentPreviewTime));
                videoPlayerRef.current.currentTime(playTime);
                setCurrentPreviewTime(playTime);
                videoPlayerRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = (time: number) => {
        setCurrentTime(time);
        // Strictly enforce clip boundaries with millisecond precision
        if (time >= clipStartTime && time <= clipEndTime) {
            setCurrentPreviewTime(time);
        } else if (time > clipEndTime) {
            // Pause and reset to start when exceeding end time
            if (videoPlayerRef.current) {
                videoPlayerRef.current.pause();
                videoPlayerRef.current.currentTime(clipStartTime);
                setCurrentPreviewTime(clipStartTime);
                setIsPlaying(false);
            }
        } else if (time < clipStartTime) {
            // Jump to start if somehow we're before the clip start
            if (videoPlayerRef.current) {
                videoPlayerRef.current.currentTime(clipStartTime);
                setCurrentPreviewTime(clipStartTime);
            }
        }
    };

    const handleDurationChange = (newDuration: number) => {
        setDuration(newDuration);
    };

    const seekToTime = (time: number) => {
        // Ensure seeking is constrained to clip boundaries
        const constrainedTime = Math.max(clipStartTime, Math.min(clipEndTime, time));
        if (videoPlayerRef.current) {
            videoPlayerRef.current.currentTime(constrainedTime);
            setCurrentPreviewTime(constrainedTime);
        }
    };

    // Get video player reference when component mounts
    useEffect(() => {
        const interval = setInterval(() => {
            // Look for video player specifically within the clip preview container
            const playerElement = clipVideoRef.current?.querySelector('.video-js');
            if (playerElement && (playerElement as any).player) {
                videoPlayerRef.current = (playerElement as any).player;

                // Set up event listeners for play/pause state
                const player = videoPlayerRef.current;
                player.on('play', () => setIsPlaying(true));
                player.on('pause', () => setIsPlaying(false));

                // Set up time update listener
                player.on('timeupdate', () => {
                    const currentTime = player.currentTime();
                    handleTimeUpdate(currentTime);
                });

                // Set initial time to clip start
                player.currentTime(clipStartTime);
                setCurrentPreviewTime(clipStartTime);

                clearInterval(interval);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [clipStartTime]);

    // Update preview time when clip times change
    useEffect(() => {
        setCurrentPreviewTime(clipStartTime);
        if (videoPlayerRef.current) {
            videoPlayerRef.current.currentTime(clipStartTime);
        }
    }, [clipStartTime, clipEndTime]);

    return (
        <div className="flex-shrink-0 w-[40vw] bg-[#18191B] border-l-2 border-[#252525] h-screen flex flex-col">
            <div className="flex-1 overflow-y-auto px-6 space-y-6">
                <Formik
                    initialValues={initialValues}
                    enableReinitialize={true}
                    validationSchema={clipValidationSchema}
                    onSubmit={async (values) => {
                        if (isGenerating) return;

                        setIsGenerating(true);

                        // Call onGenerateStart immediately when generate button is clicked
                        onGenerateStart?.(unsavedClipId);

                        try {
                            // Helper function to convert seconds to HH:MM:SS format
                            const formatSecondsToHHMMSS = (seconds: number): string => {
                                const hours = Math.floor(seconds / 3600);
                                const minutes = Math.floor((seconds % 3600) / 60);
                                const secs = Math.floor(seconds % 60);
                                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                            };

                            const clipData = {
                                streamId,
                                title: values.clipName,
                                startTime: formatSecondsToHHMMSS(localClipStartTime),
                                endTime: formatSecondsToHHMMSS(localClipEndTime),
                                speed,
                                rating,
                                tags,
                                aspectRatio: '16:9',
                                sports: sports,
                                streamUrl,
                                entityId,
                                userId,
                                duration: clipDuration
                            };

                            const response = await generateClip(clipData);

                            if (response.success && response.data) {
                                toast.success('Clip generation started successfully!');

                                // Immediately fetch clips to show the processing clip
                                if (streamId) {
                                    dispatch(fetchClips({ streamId }));
                                }

                                // Start progress tracking
                                const tracker = new ClipProgressTracker(
                                    response.data.jobId,
                                    (progress) => {
                                        console.log(`Clip generation progress: ${progress}%`);
                                        
                                        // Periodically refresh clips to update progress
                                        if (streamId && progress > 0) {
                                            dispatch(fetchClips({ streamId }));
                                        }
                                    },
                                    (data) => {
                                        console.log('Clip generation completed:', data);
                                        toast.success('Clip generated successfully!');
                                        setIsGenerating(false);
                                        setProgressTracker(null);
                                        
                                        // Fetch clips again to move completed clip to completed section
                                        if (streamId) {
                                            dispatch(fetchClips({ streamId }));
                                        }
                                        
                                        onClipGenerated?.({
                                            ...clipData,
                                            clipId: response.data.clipId,
                                            jobId: response.data.jobId,
                                            status: 'completed'
                                        }, unsavedClipId);
                                    },
                                    (error) => {
                                        console.error('Clip generation failed:', error);
                                        toast.error(`Clip generation failed: ${error}`);
                                        setIsGenerating(false);
                                        setProgressTracker(null);
                                        
                                        // Fetch clips to update any failed status
                                        if (streamId) {
                                            dispatch(fetchClips({ streamId }));
                                        }
                                    }
                                );

                                setProgressTracker(tracker);
                                tracker.connect();

                                // Close SaveNewClip and show ClipsSidebar
                                onClose();
                                onShowClipsSidebar?.();

                            } else {
                                toast.error(response.message || 'Failed to start clip generation');
                            }
                        } catch (error: any) {
                            console.error('Clip generation error:', error);
                            toast.error(error.response?.data?.message || 'Failed to generate clip');
                        } finally {
                            setIsGenerating(false);
                        }
                    }}
                >
                    {({ values, errors, touched, handleChange, handleBlur, setFieldValue }) => (
                        <Form className="flex flex-col h-full">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-800">
                                <div className="flex items-center gap-4">
                                    <div className="bg-[#252525] rounded-xl px-4 py-2.5 flex items-center gap-3">
                                        <Field
                                            type="text"
                                            name="clipName"
                                            value={values.clipName}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className="bg-transparent text-white text-sm font-medium outline-none w-20"
                                        />
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                                            <path d="M4.85567 12.4217H14V13.9773H0V10.6772L7.7 2.97717L10.9993 6.27806L4.85489 12.4217H4.85567ZM8.799 1.87817L10.4494 0.227723C10.5953 0.0819121 10.7931 0 10.9993 0C11.2056 0 11.4034 0.0819121 11.5492 0.227723L13.7496 2.42806C13.8954 2.57391 13.9773 2.77171 13.9773 2.97795C13.9773 3.18418 13.8954 3.38198 13.7496 3.52783L12.0991 5.1775L8.79978 1.87817H8.799Z" fill="white" />
                                        </svg>
                                    </div>
                                    <div className="text-white px-6 font-bold text-base">
                                        {clipDuration}s
                                    </div>
                                    <div className="bg-white text-black px-3 py-1 rounded text-xs font-semibold">
                                        In preview
                                    </div>
                                </div>
                                <button type="button" onClick={onClose} className="text-white hover:text-gray-300">
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Error messages for clip name */}
                            {errors.clipName && touched.clipName && (
                                <div className="text-red-500 text-xs px-6">{errors.clipName}</div>
                            )}

                            {/* Content */}
                            <div className="flex-1 flex flex-col p-2 space-y-4">
                                {/* Video Player */}
                                <div className="relative" ref={clipVideoRef}>
                                    <div className="w-full max-w-4xl mx-auto bg-black rounded-lg overflow-hidden">
                                        {/* <VideoPlayer
                                            onTimeUpdate={() => { }}
                                            onDurationChange={() => { }}
                                            currentTime={clipStartTime}
                                            width={600}
                                            height={338}
                                            autoplay={false}
                                            controls={false}
                                            isLive={false}
                                            playbackRate={speed}
                                            onPlaybackRateChange={handleSpeedChange}
                                            videoPlayerRef={videoPlayerRef}
                                        /> */}

                                        {/* <Preview_VideoPlayer
                                            videoUrl={"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"}
                                            poster={"https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885__340.jpg"}
                                        /> */}
                                        <VideoPlayer
                                            onTimeUpdate={handleTimeUpdate}
                                            onDurationChange={handleDurationChange}
                                            currentTime={currentPreviewTime}
                                            isPlaying={isPlaying}
                                            videoUrl={streamUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"}
                                            autoplay={true}
                                            controls={true}
                                            playbackRate={speed}
                                            isMuted={isMuted}
                                            onPlayStateChange={(playing) => setIsPlaying(playing)}
                                            controlBarChildren={["fullscreenToggle"]}
                                        />
                                    </div>
                                </div>

                                {/* Timeline Controls */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between gap-4">
                                        {/* Start Time Field */}
                                        <div className="bg-[#252525] text-white px-6 py-2 rounded-lg border border-[#00BBFF] text-sm">
                                            <Field
                                                type="text"
                                                name="clipStartTime"
                                                value={values.clipStartTime}
                                                onChange={(e) => {
                                                    const inputValue = e.target.value;
                                                    handleChange(e);

                                                    // Allow free editing - update form value immediately
                                                    setFieldValue('clipStartTime', inputValue);

                                                    // Try to parse and update local state for duration calculation
                                                    const newStartTime = parseTimeInput(inputValue);
                                                    if (newStartTime >= 0) {
                                                        setLocalClipStartTime(newStartTime);
                                                        // Only seek if the time is valid and different
                                                        if (newStartTime !== currentPreviewTime) {
                                                            seekToTime(newStartTime);
                                                        }
                                                    }
                                                }}
                                                onBlur={(e) => {
                                                    handleBlur(e);
                                                    // Format the input on blur if it's a valid time
                                                    const parsedTime = parseTimeInput(e.target.value);
                                                    if (parsedTime >= 0) {
                                                        const formattedTime = formatTimeForInput(parsedTime);
                                                        setFieldValue('clipStartTime', formattedTime);
                                                    }
                                                }}
                                                className="bg-transparent text-white text-sm outline-none w-28 cursor-text"
                                                placeholder="00:00:00"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 text-white text-[16px] font-bold font-montserrat">
                                            {/* 10s backward */}
                                            <button
                                                type="button"
                                                onClick={handleSeekBackward}
                                                className="flex items-center gap-1 hover:text-gray-300 transition-colors"
                                            >
                                                <svg
                                                    width="19"
                                                    height="20"
                                                    viewBox="0 0 19 20"
                                                    fill="none"
                                                >
                                                    <path
                                                        d="M6 6V10L0 5L6 0V4H11C13.1217 4 15.1566 4.84285 16.6569 6.34315C18.1571 7.84344 19 9.87827 19 12C19 14.1217 18.1571 16.1566 16.6569 17.6569C15.1566 19.1571 13.1217 20 11 20H2V18H11C12.5913 18 14.1174 17.3679 15.2426 16.2426C16.3679 15.1174 17 13.5913 17 12C17 10.4087 16.3679 8.88258 15.2426 7.75736C14.1174 6.63214 12.5913 6 11 6H6Z"
                                                        fill="white"
                                                    />
                                                </svg>
                                                <span className="text-white text-sm font-medium font-montserrat">
                                                    10s
                                                </span>
                                            </button>
                                            {/* Play/Pause Button */}
                                            <button
                                                type="button"
                                                onClick={handlePlayPause}
                                                className="flex items-center justify-center w-6 h-6 text-white hover:text-[#00BBFF] transition-colors"
                                            >
                                                {isPlaying ? (
                                                    <div className="flex gap-1">
                                                        <div className="w-1 h-5 bg-white" />
                                                        <div className="w-1 h-5 bg-white" />
                                                    </div>
                                                ) : (
                                                    <Play size={18} fill="white" />
                                                )}
                                            </button>
                                            {/* 10s forward */}
                                            <button
                                                type="button"
                                                onClick={handleSeekForward}
                                                className="flex items-center gap-1 hover:text-gray-300 transition-colors"
                                            >
                                                <span className="text-white text-sm font-medium font-montserrat">
                                                    10s
                                                </span>
                                                <svg
                                                    width="19"
                                                    height="20"
                                                    viewBox="0 0 19 20"
                                                    fill="none"
                                                >
                                                    <path
                                                        d="M13 6V10L19 5L13 0V4H8C5.87827 4 3.84344 4.84285 2.34315 6.34315C0.842854 7.84344 0 9.87827 0 12C0 14.1217 0.842854 16.1566 2.34315 17.6569C3.84344 19.1571 5.87827 20 8 20H17V18H8C6.4087 18 4.88258 17.3679 3.75736 16.2426C2.63214 15.1174 2 13.5913 2 12C2 10.4087 2.63214 8.88258 3.75736 7.75736C4.88258 6.63214 6.4087 6 8 6H13Z"
                                                        fill="white"
                                                    />
                                                </svg>
                                            </button>
                                            {/* Mute/Unmute Button */}
                                            <button
                                                type="button"
                                                onClick={handleMuteToggle}
                                                className="flex items-center justify-center w-8 h-8 text-white hover:text-[#00BBFF] transition-colors"
                                            >
                                                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                                            </button>
                                        </div>

                                        {/* End Time Field */}
                                        <div className="bg-[#252525] text-white px-6 py-2 rounded-lg border border-[#00BBFF] text-sm">
                                            <Field
                                                type="text"
                                                name="clipEndTime"
                                                value={values.clipEndTime}
                                                onChange={(e) => {
                                                    const inputValue = e.target.value;
                                                    handleChange(e);

                                                    // Allow free editing - update form value immediately
                                                    setFieldValue('clipEndTime', inputValue);

                                                    // Try to parse and update local state for duration calculation
                                                    const newEndTime = parseTimeInput(inputValue);
                                                    if (newEndTime >= 0 && newEndTime > localClipStartTime) {
                                                        setLocalClipEndTime(newEndTime);
                                                        // If current preview time is beyond new end time, seek to start
                                                        if (currentPreviewTime > newEndTime) {
                                                            seekToTime(localClipStartTime);
                                                        }
                                                    }
                                                }}
                                                onBlur={(e) => {
                                                    handleBlur(e);
                                                    // Format the input on blur if it's a valid time
                                                    const parsedTime = parseTimeInput(e.target.value);
                                                    if (parsedTime >= 0) {
                                                        const formattedTime = formatTimeForInput(parsedTime);
                                                        setFieldValue('clipEndTime', formattedTime);
                                                    }
                                                }}
                                                className="bg-transparent text-white text-sm outline-none w-28 cursor-text"
                                                placeholder="00:00:00"
                                            />
                                        </div>
                                    </div>
                                    {/* Error messages for time fields */}
                                    <div className="flex justify-between text-xs">
                                        {errors.clipStartTime && touched.clipStartTime && (
                                            <div className="text-red-500">{errors.clipStartTime}</div>
                                        )}
                                        {errors.clipEndTime && touched.clipEndTime && (
                                            <div className="text-red-500">{errors.clipEndTime}</div>
                                        )}
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="relative">
                                        <div className="w-full h-2 bg-white rounded-full">
                                            <div
                                                className="h-2 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] rounded-full"
                                                // style={{ width: `${calculateDuration(localClipStartTime, localClipEndTime) > 0 ? ((currentPreviewTime - localClipStartTime) / calculateDuration(localClipStartTime, localClipEndTime)) * 100 : 0}%` }}
                                                style={{ width: `${((currentPreviewTime - localClipStartTime) / calculateDuration(localClipStartTime, localClipEndTime)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Speed Control */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-white font-bold text-xs whitespace-nowrap">Speed</span>

                                        {/* Slider + Value */}
                                        <div className="flex items-center gap-3 w-full">
                                            <div className="relative w-[50%] h-1">
                                                <div className="w-full h-1 bg-white rounded-full">
                                                    <div
                                                        className="h-1 bg-gray-400 rounded-full relative"
                                                        style={{ width: `${((speed - 0.25) / (2 - 0.25)) * 100}%` }}
                                                    >
                                                        <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-[#00BBFF] cursor-grab hover:scale-110 transition-transform"></div>
                                                    </div>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0.25"
                                                    max="2"
                                                    step="0.25"
                                                    value={speed}
                                                    onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                            </div>

                                            <div className="bg-gradient-to-r from-[#00EEFF] to-[#0051FF] px-3 py-1 rounded text-white font-bold text-sm min-w-[50px] text-center">
                                                {speed}x
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Rating */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-4">
                                        <span className="text-white font-bold text-xs whitespace-nowrap">Rating</span>
                                        <div className="flex w-[50%] items-center gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => handleRatingClick(star)}
                                                    className="text-white hover:text-yellow-400 transition-colors"
                                                >
                                                    {star <= rating ? (
                                                        <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M9.09097 1.26369C9.42001 0.444292 10.58 0.444291 10.909 1.26369L12.8743 6.15769C13.0145 6.50662 13.3419 6.74456 13.7171 6.76999L18.9789 7.12677C19.8598 7.18651 20.2183 8.28971 19.5407 8.85586L15.4935 12.2373C15.205 12.4784 15.0799 12.8634 15.1716 13.228L16.4583 18.3425C16.6737 19.1988 15.7353 19.8807 14.9874 19.4112L10.5209 16.607C10.2024 16.4071 9.7976 16.4071 9.47914 16.607L5.01257 19.4112C4.26473 19.8807 3.32629 19.1988 3.54172 18.3425L4.82838 13.228C4.92012 12.8634 4.79503 12.4784 4.50647 12.2373L0.459312 8.85586C-0.218301 8.28971 0.14015 7.18651 1.02113 7.12677L6.28291 6.76999C6.65806 6.74456 6.98555 6.50662 7.12567 6.15769L9.09097 1.26369Z" fill="white" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-6 h-6" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                                                            <path d="M9.55469 1.4502C9.71578 1.04903 10.2842 1.04903 10.4453 1.4502L12.4102 6.34375C12.6218 6.87079 13.117 7.23013 13.6836 7.26855L18.9453 7.62598C19.3764 7.65544 19.5514 8.19456 19.2197 8.47168L15.1729 11.8535C14.7371 12.2176 14.5482 12.799 14.6865 13.3496L15.9736 18.3648C16.0787 18.8839 15.6189 19.2171 15.2529 18.9873L10.7871 16.1836C10.3061 15.8816 9.6939 15.8816 9.21289 16.1836L4.74707 18.9873C4.38105 19.2171 3.92126 18.8839 4.02637 18.3648L5.31348 13.3496C5.45183 12.799 5.26286 12.2176 4.82715 11.8535L0.780273 8.47168C0.448616 8.19456 0.623591 7.65544 1.05469 7.62598L6.31641 7.26855C6.88305 7.23013 7.3782 6.87078 7.58984 6.34375L9.55469 1.4502Z" strokeWidth="1" />
                                                        </svg>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Tags */}
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <h3 className="text-white font-bold text-xs whitespace-nowrap">Tags</h3>
                                        <div className="flex flex-col gap-2 w-full">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {tags.map((tag, index) => (
                                                    <div key={index} className="flex items-center gap-1 bg-[#1B1B1B] border border-white rounded-lg px-3 py-2">
                                                        <span className="text-white text-xs">{tag}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveTag(tag)}
                                                            className="text-white hover:text-red-400 ml-1"
                                                        >
                                                            <svg className="w-2 h-2" viewBox="0 0 8 8" fill="none">
                                                                <path d="M7.37966e-05 6.95656L6.95653 0.000315231L8 1.04375L1.04354 8L7.37966e-05 6.95656Z" fill="currentColor" />
                                                                <path d="M7.99993 6.95625L1.04347 0L0 1.04344L6.95646 7.99968L7.99993 6.95625Z" fill="currentColor" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {/* <input
                                                    type="text"
                                                    value={newTag}
                                                    onChange={(e) => setNewTag(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                                                    placeholder="New tag"
                                                    className="bg-[#1B1B1B] border border-white rounded-lg px-3 py-2 text-white text-xs w-20"
                                                /> */}
                                                <button
                                                    type="button"
                                                    onClick={handleOpenManageTagsModal}
                                                    className="bg-[#1B1B1B] border border-white rounded-lg p-2 text-white hover:text-[#00BBFF]"
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
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="p-6 border-t border-gray-800">
                                <div className="flex items-center gap-5">
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        className="flex-1 bg-[#1B1B1B] border-[1.5px] border-red-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-red-500/10 transition-colors"
                                    >
                                        Delete
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isGenerating}
                                        className="flex-1 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white py-3 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Generating...
                                            </>
                                        ) : (
                                            'Generate clip'
                                        )}
                                    </button>
                                </div>


                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
            {/* Manage Tags Modal */}
            <ManageTagsModal
                isOpen={showManageTagsModal}
                onClose={() => setShowManageTagsModal(false)}
                appliedTags={tags}
                onUpdateTags={(tgs) => handleUpdateTags(tgs)}
                category={sports}
                streamId={streamId}
                page="live-video"
                initialScores={''}
            />
        </div>
    );
};

export default SaveNewClip;
