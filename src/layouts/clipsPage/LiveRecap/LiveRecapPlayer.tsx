import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Star, ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX, X, Plus } from 'lucide-react';
import { ClipData } from '@/mocks/clips_mockData/mockClips';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import moment from 'moment';

interface LiveRecapPlayerProps {
    clips: ClipData[];
}

const LiveRecapPlayer: React.FC<LiveRecapPlayerProps> = ({ clips }) => {
    const [currentClipIndex, setCurrentClipIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);
    //  const currentClip = clips[currentClipIndex];

    const getClipTime = (clip: any) => {
        if (clip?.createdAt) {
            const t = new Date(clip.createdAt).getTime();
            return Number.isFinite(t) ? t : 0;
        }
        if ((clip as any)?.date) {
            const d = (clip as any).date;
            const tm = (clip as any).time;
            const formatted = `${d}${tm ? ` ${tm}` : ''}`;
            const m = moment(formatted, ['MMM DD, YYYY HH:mm', 'MMM DD, YYYY']);
            const v = m.valueOf();
            return Number.isFinite(v) ? v : 0;
        }
        return 0;
    };

    const storyClips = clips.filter(clip => clip.type === 'Story' || clip.type === 'Clip');
    const displayClips = (storyClips.length > 0 ? storyClips : clips)
        .slice()
        .sort((a, b) => getClipTime(a) - getClipTime(b));
    const currentClip = displayClips[currentClipIndex] || displayClips[0];

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const updateProgress = () => {
            if (video.duration) {
                setProgress((video.currentTime / video.duration) * 100);
            }
        };

        const handleEnded = () => {
            if (currentClipIndex < displayClips.length - 1) {
                setCurrentClipIndex(prev => prev + 1);
            } else {
                setIsPlaying(false);
            }
        };

        video.addEventListener('timeupdate', updateProgress);
        video.addEventListener('ended', handleEnded);

        return () => {
            video.removeEventListener('timeupdate', updateProgress);
            video.removeEventListener('ended', handleEnded);
        };
    }, [currentClipIndex, displayClips.length]);

    useEffect(() => {
        const video = videoRef.current;
        if (video && currentClip?.videoUrl) {
            video.src = currentClip.videoUrl;
            video.load();
            setProgress(0);
        }
    }, [currentClip]);

    const handlePlayPause = () => {
        const video = videoRef.current;
        if (!video) return;

        if (isPlaying) {
            video.pause();
        } else {
            video.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handlePrevious = () => {
        if (currentClipIndex > 0) {
            setCurrentClipIndex(prev => prev - 1);
            setIsPlaying(true);
        }
    };

    const handleNext = () => {
        if (currentClipIndex < displayClips.length - 1) {
            setCurrentClipIndex(prev => prev + 1);
            setIsPlaying(true);
        }
    };

    const handleMute = () => {
        const video = videoRef.current;
        if (!video) return;

        video.muted = !video.muted;
        setIsMuted(!isMuted);
    };

    const renderStars = (rating: number) => {
        return Array.from({ length: rating }, (_, i) => (
            <Star key={i} size={14} className="fill-current text-white" />
        ));
    };

    if (!currentClip) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-white">
                    <h3 className="text-xl font-medium mb-2">No clips available</h3>
                    <p className="text-gray-400">Add some clips to view the live recap.</p>
                </div>
            </div>
        );
    }

    const truncateText = (text: string, maxLength: number = 25) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    };

    return (
        <div className="flex-1 flex flex-col bg-[#18191B] h-full">
            {/* Main Container */}
            <div className="flex-1 bg-[#252525] rounded-xl m-5 overflow-hidden relative">
                <div className="flex h-full">
                    {/* Video Player Area */}
                    <div className="flex-1 relative">
                        {/* Progress Bars */}
                        <div className="absolute top-4 left-4 right-4 flex gap-2 z-20">
                            {displayClips.map((_, index) => (
                                <div key={index} className="flex-1 h-1 bg-[#18191B] rounded">
                                    <div
                                        className="h-full bg-white rounded transition-all duration-300"
                                        style={{
                                            width: index < currentClipIndex ? '100%' :
                                                index === currentClipIndex ? `${progress}%` : '0%'
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                        {/* Video Element */}
                        <video
                            ref={videoRef}
                            className="object-cover"
                            poster={currentClip.thumbnail}
                            muted={isMuted}
                            playsInline
                            autoPlay
                            controls
                            controlsList="nodownload"
                        />

                        {/* Video Controls Overlay */}
                        {/* <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 z-10 bg-black/20">
                            <button
                                onClick={handlePlayPause}
                                className="w-20 h-20 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                            >
                                {isPlaying ? <Pause size={32} /> : <Play size={32} />}
                            </button>
                        </div> */}

                        {/* Navigation Controls */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-20">
                            <button
                                onClick={handlePrevious}
                                disabled={currentClipIndex === 0}
                                className="w-10 h-10 bg-[#18191B] rounded-xl flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#252525] transition-colors"
                            >
                                <ChevronLeft size={20} />
                            </button>

                            {/* <button
                                onClick={handlePlayPause}
                                className="w-10 h-10 bg-[#18191B] rounded-xl flex items-center justify-center text-white hover:bg-[#252525] transition-colors"
                            >
                                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                            </button> */}

                            <button
                                onClick={handleNext}
                                disabled={currentClipIndex === displayClips.length - 1}
                                className="w-10 h-10 bg-[#18191B] rounded-xl flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#252525] transition-colors"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        {/* Progress Bar */}
                        {/* <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                            <div
                                className="h-full bg-white transition-all duration-200"
                                style={{ width: `${progress}%` }}
                            />
                        </div> */}

                        {/* Mute Button */}
                        {/* <div className="absolute top-4 left-4 z-20">
                            <button
                                onClick={handleMute}
                                className="w-10 h-8 bg-[#18191B] rounded-md flex items-center justify-center text-white hover:bg-[#252525] transition-colors"
                            >
                                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                            </button>
                        </div> */}
                    </div>

                    {/* Right Side Panel - Clip Details */}
                    <div className="w-[350px] p-6 bg-[#252525] flex flex-col justify-center">
                        {/* Clip Title */}
                        <div className="mb-6">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <h2 className="text-xl font-bold text-white mb-4">{truncateText(currentClip.title, 15)}</h2>
                                </TooltipTrigger>
                                <TooltipContent side="top" align="start" className="max-w-xs">
                                    <p>{currentClip ? currentClip?.title : "Untitled"}</p>
                                </TooltipContent>
                            </Tooltip>
                            {/* Rating, Aspect Ratio, Duration */}
                            <div className="flex items-center gap-4 mb-6">
                                {/* Rating */}
                                <div className="flex items-center gap-1 px-3 py-1 bg-black rounded-md">
                                    <div className="flex items-center gap-1">
                                        {renderStars(currentClip.rating)}
                                    </div>
                                    <span className="text-white text-xs font-bold ml-1">{currentClip.rating}</span>
                                </div>

                                {/* Aspect Ratio */}
                                <div className="px-3 py-1 bg-black rounded-md">
                                    <span className="text-white text-xs">16 : 9</span>
                                </div>

                                {/* Duration */}
                                <div className="px-3 py-1 bg-black rounded-md">
                                    <span className="text-white text-xs">{currentClip?.duration ? moment.utc(currentClip.duration * 1000).format('mm:ss') : '00:00'}</span>
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 mb-8">
                                {(Array.isArray(currentClip?.tags) ? currentClip.tags : []).map((tag: string, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2 px-4 py-2 border border-white rounded-lg bg-[#1B1B1B]">
                                        <span className="text-white text-xs">{tag}</span>
                                        <button className="text-white hover:text-gray-300">
                                            <X size={8} />
                                        </button>
                                    </div>
                                ))}

                                {/* <button
                                    // onClick={() => setShowManageTagsModal(true)}
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
                                </button> */}
                            </div>
                        </div>

                        {/* Action Button */}
                        {/* <Button className="w-full bg-[#1B1B1B] border border-[#00BBFF] text-white hover:bg-[#00BBFF]/10 h-11 rounded-xl">
              Move to editor
            </Button> */}
                    </div>
                </div>
            </div>

            {/* Chat/Feedback Button */}
            {/* <div className="absolute bottom-8 right-8">
        <button className="w-16 h-11 bg-white rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors">
          <svg width="23" height="22" viewBox="0 0 23 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.02615 18.0513L0 22V1.12821C0 0.828987 0.118864 0.542023 0.330444 0.330444C0.542023 0.118864 0.828987 0 1.12821 0H21.4359C21.7351 0 22.0221 0.118864 22.2337 0.330444C22.4452 0.542023 22.5641 0.828987 22.5641 1.12821V16.9231C22.5641 17.2223 22.4452 17.5093 22.2337 17.7208C22.0221 17.9324 21.7351 18.0513 21.4359 18.0513H5.02615ZM10.1538 12.4103V14.6667H12.4103V12.4103H10.1538ZM7.40892 6.55826L9.62246 7.00164C9.68528 6.68736 9.83605 6.39738 10.0572 6.16543C10.2784 5.93349 10.5609 5.76913 10.8719 5.69146C11.1828 5.6138 11.5094 5.62603 11.8137 5.72674C12.118 5.82744 12.3874 6.01247 12.5906 6.26031C12.7938 6.50815 12.9225 6.80859 12.9616 7.1267C13.0007 7.4448 12.9487 7.76747 12.8116 8.05717C12.6746 8.34687 12.458 8.59169 12.1872 8.76314C11.9165 8.93459 11.6026 9.02562 11.2821 9.02564H10.1538V11.2821H11.2821C12.0298 11.2818 12.7621 11.0693 13.3938 10.6692C14.0255 10.2691 14.5306 9.69781 14.8503 9.02188C15.1701 8.34596 15.2913 7.59314 15.2 6.851C15.1086 6.10886 14.8085 5.40791 14.3344 4.82968C13.8603 4.25145 13.2317 3.81973 12.5219 3.58472C11.812 3.3497 11.0501 3.32107 10.3246 3.50215C9.59909 3.68323 8.93993 4.06658 8.42378 4.60759C7.90763 5.14861 7.5557 5.82506 7.40892 6.55826Z" fill="url(#paint0_linear_2744_4967)"/>
            <defs>
              <linearGradient id="paint0_linear_2744_4967" x1="30.8" y1="11.1305" x2="7.7463" y2="-4.30979" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00BBFF"/>
                <stop offset="1" stopColor="#0051FF"/>
              </linearGradient>
            </defs>
          </svg>
        </button>
      </div> */}
        </div>
    );
};

export default LiveRecapPlayer;
