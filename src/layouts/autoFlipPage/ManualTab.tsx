import { Button } from "@/components/ui/button";
import GradientRailSlider from "@/components/ui/gradient-rail-slider";
import React from "react";
import EntityCard from "@/layouts/EditorEntities/EntityCard";
import { generateDynamicCrop } from "@/api/clipApi";
import { useAppDispatch, useAppSelector } from "@/store";
import { generateInputRatioClip } from "@/api/clipApi";
import { toast } from "sonner";
import { fetchClipById } from "@/store/slices/clipsSlice";

interface ClipLike {
  videoUrl?: string;
  thumbnailUrl?: string;
}

interface ManualTabProps {
  clip?: ClipLike;
  ratio: string;
  onRatioChange: (newRatio: string) => void;
  onCropChange?: (box: { x: number; y: number; width: number; height: number }, dims?: { width: number; height: number }) => void;
  onTimeUpdate?: (t: number) => void;
  onPlaybackRateChange?: (r: number) => void;
  onGeneratePreview?: (payload: {
    ratio: string;
    timeSec: number;
    playbackRate: number;
    videoUrl?: string;
    cropRect: { x_px: number; y_px: number; width_px: number; height_px: number; x_norm: number; y_norm: number; width_norm: number; height_norm: number };
  }) => void | Promise<void>;
  previewEnabled: boolean;
  setPreviewEnabled: (enabled: boolean) => void;
  isPlaying: boolean;
  setIsPlaying: (enabled: boolean) => void;
  onSubmittingChange?: (value: boolean, ratio?: string) => void;
}

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

const ManualTab: React.FC<ManualTabProps> = ({ clip, ratio, onRatioChange, onCropChange, onTimeUpdate, onPlaybackRateChange, onGeneratePreview, previewEnabled, setPreviewEnabled, isPlaying, setIsPlaying, onSubmittingChange }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const [duration, setDuration] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [playbackRate, setPlaybackRate] = React.useState(1);

  const [cropBox, setCropBox] = React.useState({ x: 100, y: 50, width: 253, height: 450 });
  const [dragging, setDragging] = React.useState(false);
  const dragStart = React.useRef({ x: 0, y: 0 });
  const [resizing, setResizing] = React.useState<null | 'n' | 's' | 'w' | 'e' | 'nw' | 'ne' | 'sw' | 'se'>(null);
  const [dims, setDims] = React.useState({ width: 800, height: 450 });
  const [lockRatio, setLockRatio] = React.useState(true);
  const [cropEnabled, setCropEnabled] = React.useState(false);
  const currentStreamId = useAppSelector((state) => (state as any)?.clips?.currentStreamId);
  const [coordSeries, setCoordSeries] = React.useState<Array<{ timeStamp: number; coordinates: number[] }>>([]);
  const lastAppendRef = React.useRef<number>(-1);

  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onLoaded = () => setDuration(v.duration || 0);
    const onTime = () => {
      const ct = v.currentTime || 0;
      setCurrentTime(ct);
      onTimeUpdate?.(ct);
    };
    v.addEventListener('loadedmetadata', onLoaded);
    v.addEventListener('timeupdate', onTime);
    return () => {
      v.removeEventListener('loadedmetadata', onLoaded);
      v.removeEventListener('timeupdate', onTime);
    };
  }, []);

  React.useEffect(() => {
    const v = videoRef.current;
    if (v) v.playbackRate = playbackRate;
    onPlaybackRateChange?.(playbackRate);
  }, [playbackRate]);

  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) {
      v.play().catch(() => { });
    } else {
      v.pause();
    }
  }, [isPlaying]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };

  const seekBy = (delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(duration, v.currentTime + delta));
  };

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const vw = dims.width;
  const vh = dims.height;

  const calculateCrop = (val: string) => {
    const map: Record<string, number> = {
      '9 : 16': 9 / 16,
      '9 : 18': 9 / 18,
      '4 : 5': 4 / 5,
      '4 : 3': 4 / 3,
      '3 : 4': 3 / 4,
      '1 : 1': 1,
    };
    const ar = map[val] ?? 9 / 16;
    let h = vh;
    let w = Math.round(h * ar);
    if (w > vw) {
      w = vw;
      h = Math.round(w / ar);
    }
    const x = Math.max(0, Math.round((vw - w) / 2));
    const y = 0;
    return { x: Math.round(x), y: Math.round(y), width: Math.round(w), height: Math.round(h) };
  };

  React.useEffect(() => {
    setCropBox(calculateCrop(ratio));
  }, [ratio, vw, vh]);

  React.useEffect(() => {
    const measure = () => {
      const el = containerRef.current;
      if (!el) return;
      const { width, height } = el.getBoundingClientRect();
      setDims({ width: Math.round(width), height: Math.round(height) });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    const rect = containerRef.current?.getBoundingClientRect();
    const baseX = (e.clientX - (rect?.left || 0)) - cropBox.x;
    const baseY = (e.clientY - (rect?.top || 0)) - cropBox.y;
    dragStart.current = { x: baseX, y: baseY };
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setDragging(true);
    const rect = containerRef.current?.getBoundingClientRect();
    const touch = e.touches[0];
    const baseX = (touch.clientX - (rect?.left || 0)) - cropBox.x;
    const baseY = (touch.clientY - (rect?.top || 0)) - cropBox.y;
    dragStart.current = { x: baseX, y: baseY };
  };

  const onHandleDown = (mode: 'n' | 's' | 'w' | 'e' | 'nw' | 'ne' | 'sw' | 'se', e: React.MouseEvent) => {
    e.stopPropagation();
    setResizing(mode);
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const onTouchHandleDown = (mode: 'n' | 's' | 'w' | 'e' | 'nw' | 'ne' | 'sw' | 'se', e: React.TouchEvent) => {
    e.stopPropagation();
    setResizing(mode);
    const touch = e.touches[0];
    dragStart.current = { x: touch.clientX, y: touch.clientY };
  };

  React.useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      let clientX: number;
      let clientY: number;

      if ('touches' in e) {
        if (e.touches.length === 0) return;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      if (dragging && !resizing) {
        if ('touches' in e) e.preventDefault();
        const relX = clientX - rect.left;
        const relY = clientY - rect.top;
        const newX = Math.max(0, Math.min(relX - dragStart.current.x, vw - cropBox.width));
        const newY = Math.max(0, Math.min(relY - dragStart.current.y, vh - cropBox.height));
        setCropBox(prev => ({ ...prev, x: newX, y: newY }));
        return;
      }
      if (resizing && !lockRatio) {
        if ('touches' in e) e.preventDefault();
        const dx = clientX - dragStart.current.x;
        const dy = clientY - dragStart.current.y;
        dragStart.current = { x: clientX, y: clientY };
        const map: Record<string, number> = { '9 : 16': 9 / 16, '9 : 18': 9 / 18, '4 : 5': 4 / 5, '4 : 3': 4 / 3, '3 : 4': 3 / 4, '1 : 1': 1 };
        const ar = lockRatio ? (map[ratio] ?? 9 / 16) : null;
        setCropBox(prev => {
          let { x, y, width, height } = prev;
          const minSize = 40;
          const applyBounds = () => {
            width = Math.max(minSize, Math.min(width, vw - x));
            height = Math.max(minSize, Math.min(height, vh - y));
          };
          if (resizing.includes('e')) width += dx;
          if (resizing.includes('s')) height += dy;
          if (resizing.includes('w')) { x += dx; width -= dx; }
          if (resizing.includes('n')) { y += dy; height -= dy; }
          if (ar) {
            if (resizing.includes('e') || resizing.includes('w')) height = Math.round(width / ar);
            else if (resizing.includes('n') || resizing.includes('s')) width = Math.round(height * ar);
          }
          applyBounds();
          if (x < 0) { width += x; x = 0; }
          if (y < 0) { height += y; y = 0; }
          if (x + width > vw) width = vw - x;
          if (y + height > vh) height = vh - y;
          return { x, y, width, height };
        });
      }
    };
    const onUp = () => { setDragging(false); setResizing(null); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };
  }, [dragging, resizing, cropBox.width, cropBox.height, vw, vh, ratio, lockRatio]);

  React.useEffect(() => {
    onCropChange?.(cropBox, dims);
  }, [cropBox, dims, onCropChange]);

  const startCropper = () => {
    setCropEnabled(true);
    setPreviewEnabled(true);
    setCoordSeries([]);
    lastAppendRef.current = -1;
  };
  const removeCropper = () => {
    setCropEnabled(false);
    setPreviewEnabled(false);
    setCoordSeries([]);
    lastAppendRef.current = -1;
  };

  const computeCoordsPerc = () => {
    const v = videoRef.current;
    const el = containerRef.current;
    if (!v || !el) return null;
    const vidW = v.videoWidth || dims.width;
    const vidH = v.videoHeight || dims.height;
    const contW = dims.width;
    const contH = dims.height;
    const scale = Math.min(contW / vidW, contH / vidH);
    const dispW = vidW * scale;
    const dispH = vidH * scale;
    const offsetX = Math.max(0, (contW - dispW) / 2);
    const offsetY = Math.max(0, (contH - dispH) / 2);
    const x_px = Math.round((cropBox.x - offsetX) / scale);
    const y_px = Math.round((cropBox.y - offsetY) / scale);
    const width_px = Math.round(cropBox.width / scale);
    const height_px = Math.round(cropBox.height / scale);
    const x_norm = x_px / vidW;
    const y_norm = y_px / vidH;
    const w_norm = width_px / vidW;
    const h_norm = height_px / vidH;
    const clamp = (n: number) => Math.max(0, Math.min(100, n));
    const left = clamp(Number((x_norm * 100).toFixed(6)));
    const top = clamp(Number((y_norm * 100).toFixed(6)));
    const right = clamp(Number(((x_norm + w_norm) * 100).toFixed(6)));
    const bottom = clamp(Number(((y_norm + h_norm) * 100).toFixed(6)));
    return [left, top, right, bottom];
  };

  React.useEffect(() => {
    if (!previewEnabled || !isPlaying) return;
    const coords = computeCoordsPerc();
    if (!coords) return;
    const t = currentTime;
    if (lastAppendRef.current < 0 || Math.abs(t - lastAppendRef.current) > 0.05) {
      setCoordSeries((prev) => [...prev, { timeStamp: t, coordinates: coords }]);
      lastAppendRef.current = t;
    }
  }, [currentTime, cropBox]);

  React.useEffect(() => {
    if (!previewEnabled || !isPlaying) return;
    const id = window.setInterval(() => {
      const v = videoRef.current;
      if (!v) return;
      const t = v.currentTime || 0;
      const coords = computeCoordsPerc();
      if (!coords) return;
      if (lastAppendRef.current < 0 || Math.abs(t - lastAppendRef.current) > 0.2) {
        setCoordSeries((prev) => [...prev, { timeStamp: t, coordinates: coords }]);
        lastAppendRef.current = t;
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [previewEnabled, isPlaying, cropBox, dims.width, dims.height]);

  const [isPreviewSubmitting, setIsPreviewSubmitting] = React.useState(false);
 
  const generatePreview = async () => {
    if (isPreviewSubmitting) return;
    setIsPreviewSubmitting(true);
    onSubmittingChange?.(true, ratio);
    setPreviewEnabled(true);
    const v = videoRef.current;
    const el = containerRef.current;
    if (!v || !el) return;
    const vidW = v.videoWidth || dims.width;
    const vidH = v.videoHeight || dims.height;
    const contW = dims.width;
    const contH = dims.height;
    // object-contain mapping
    const scale = Math.min(contW / vidW, contH / vidH);
    const dispW = vidW * scale;
    const dispH = vidH * scale;
    const offsetX = Math.max(0, (contW - dispW) / 2);
    const offsetY = Math.max(0, (contH - dispH) / 2);
    const x_px = Math.round((cropBox.x - offsetX) / scale);
    const y_px = Math.round((cropBox.y - offsetY) / scale);
    const width_px = Math.round(cropBox.width / scale);
    const height_px = Math.round(cropBox.height / scale);
    const x_norm = Number((x_px / vidW).toFixed(6));
    const y_norm = Number((y_px / vidH).toFixed(6));
    const width_norm = Number((width_px / vidW).toFixed(6));
    const height_norm = Number((height_px / vidH).toFixed(6));
    const payload = {
      ratio,
      timeSec: currentTime,
      playbackRate,
      videoUrl: clip?.videoUrl,
      cropRect: { x_px, y_px, width_px, height_px, x_norm, y_norm, width_norm, height_norm }
    };
    try {
      await onGeneratePreview?.(payload);
      const ratioFmt = String(ratio).replace(/\s/g, '').replace(/x/i, ':');
      const single = [
        Number((payload.cropRect.x_norm * 100).toFixed(6)),
        Number((payload.cropRect.y_norm * 100).toFixed(6)),
        Number(((payload.cropRect.x_norm + payload.cropRect.width_norm) * 100).toFixed(6)),
        Number(((payload.cropRect.y_norm + payload.cropRect.height_norm) * 100).toFixed(6)),
      ];
      const series = coordSeries.length > 0 ? coordSeries : [{ timeStamp: currentTime, coordinates: single }];
      toast.success("Request initiated successfully!");
      const dynResp = await generateDynamicCrop({
        videoUrl: clip?.videoUrl || "",
        streamId: currentStreamId || '',
        coordinates: series,
        clipTitle: (clip as Clip)?.title || (clip as Clip)?.name || '',
        clipId: (clip as Clip)?._id || "manual-preview",
        event: 'dynamicCropped',
        aspectRatio: ratioFmt,
      });
      if (dynResp?.success) {
        toast.success("Preview generated successfully!");
      onSubmittingChange?.(false, ratio);
        const id = (clip as Clip)?._id;
        if (id) {
          try { dispatch(fetchClipById(id)); setPreviewEnabled(false); } catch { }
        }
      } else {
        toast.error(dynResp?.message || "Crop preview request failed");
      }
    } catch (err: any) {
      toast.error(err?.message || "Crop preview failed");
    } finally {
      setIsPreviewSubmitting(false);
    }
  };

  return (
    <div className="flex-1 items-center justify-center ml-4">
      <div className="relative">
        <div ref={containerRef} className="relative h-[400px] bg-black video-crop-area">
          {clip?.videoUrl ? (
            <video ref={videoRef} src={clip.videoUrl} poster={clip.thumbnailUrl} autoPlay={true} className="w-full h-full object-contain rounded-lg" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-6xl mb-4">📹</div>
                <p>No video available</p>
              </div>
            </div>
          )}
          {cropEnabled && (
            <div className="absolute inset-0">
              <div className="absolute left-0 top-0 h-full bg-black/50" style={{ width: `${cropBox.x}px` }}></div>
              <div className="absolute right-0 top-0 h-full bg-black/50" style={{ width: `${vw - cropBox.x - cropBox.width}px` }}></div>
              <div className="absolute top-0 left-0 bg-black/50" style={{ width: `${cropBox.width}px`, height: `${cropBox.y}px`, transform: `translate(${cropBox.x}px, 0)` }}></div>
              <div className="absolute bottom-0 left-0 bg-black/50" style={{ width: `${cropBox.width}px`, height: `${vh - cropBox.y - cropBox.height}px`, transform: `translate(${cropBox.x}px, 0)` }}></div>
              <div className="absolute" style={{ left: `${cropBox.x}px`, top: `${cropBox.y}px`, width: `${cropBox.width}px`, height: `${cropBox.height}px` }}>
                <div className="absolute inset-0 border-2 border-dashed border-white rounded cursor-move" onMouseDown={onMouseDown} onTouchStart={onTouchStart}></div>
                {!lockRatio && (
                  <>
                    <div className="absolute w-3 h-3 bg-white rounded-full -top-1 -left-1 cursor-nw-resize" onMouseDown={(e) => onHandleDown('nw', e)} onTouchStart={(e) => onTouchHandleDown('nw', e)}></div>
                    <div className="absolute w-3 h-3 bg-white rounded-full -top-1 -right-1 cursor-ne-resize" onMouseDown={(e) => onHandleDown('ne', e)} onTouchStart={(e) => onTouchHandleDown('ne', e)}></div>
                    <div className="absolute w-3 h-3 bg-white rounded-full -bottom-1 -left-1 cursor-sw-resize" onMouseDown={(e) => onHandleDown('sw', e)} onTouchStart={(e) => onTouchHandleDown('sw', e)}></div>
                    <div className="absolute w-3 h-3 bg-white rounded-full -bottom-1 -right-1 cursor-se-resize" onMouseDown={(e) => onHandleDown('se', e)} onTouchStart={(e) => onTouchHandleDown('se', e)}></div>
                    <div className="absolute w-3 h-3 bg-white rounded-full left-1/2 -translate-x-1/2 -top-1 cursor-n-resize" onMouseDown={(e) => onHandleDown('n', e)} onTouchStart={(e) => onTouchHandleDown('n', e)}></div>
                    <div className="absolute w-3 h-3 bg-white rounded-full left-1/2 -translate-x-1/2 -bottom-1 cursor-s-resize" onMouseDown={(e) => onHandleDown('s', e)} onTouchStart={(e) => onTouchHandleDown('s', e)}></div>
                    <div className="absolute w-3 h-3 bg-white rounded-full top-1/2 -translate-y-1/2 -left-1 cursor-w-resize" onMouseDown={(e) => onHandleDown('w', e)} onTouchStart={(e) => onTouchHandleDown('w', e)}></div>
                    <div className="absolute w-3 h-3 bg-white rounded-full top-1/2 -translate-y-1/2 -right-1 cursor-e-resize" onMouseDown={(e) => onHandleDown('e', e)} onTouchStart={(e) => onTouchHandleDown('e', e)}></div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="mt-6 w-full">
          <div className="relative w-full h-2 bg-white/20 rounded-full">
            <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#00BBFF] to-[#0051FF] rounded-full" style={{ width: `${pct}%` }}></div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-8">
          <GradientRailSlider
            label="Speed"
            min={0.25}
            max={2}
            step={0.25}
            value={playbackRate}
            onChange={setPlaybackRate}
            formatValue={(v) => `${v}x`}
            railWidth={250}
            height={40}
            pillWidth={48}
          />
          <div className="flex items-center gap-8">
            <button className="flex items-center gap-2" onClick={() => seekBy(-10)}>
              <SpeedIcon />
              <span className="text-white text-sm">10s</span>
            </button>
            <button onClick={togglePlay} className="flex items-center justify-center">
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button className="flex items-center gap-2" onClick={() => seekBy(10)}>
              <span className="text-white items-center text-sm">10s</span>
              <ForwardIcon />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white text-xs font-bold">Ratio</span>
            <div className="relative">
              <select value={ratio} onChange={(e) => onRatioChange(e.target.value)} className="bg-[#252525] border border-white rounded-xl px-4 py-2 text-white text-sm appearance-none cursor-pointer min-w-[90px]">
                <option value="9 : 16">9 : 16</option>
                <option value="9 : 18">9 : 18</option>
                <option value="4 : 5">4 : 5</option>
                <option value="4 : 3">4 : 3</option>
                <option value="3 : 4">3 : 4</option>
                <option value="1 : 1">1 : 1</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-2 h-2 text-white transform rotate-90" fill="currentColor" viewBox="0 0 10 6">
                  <path d="M4.7373 3.68474L1.05257 0L0 1.05257L4.7373 5.78987L9.47461 1.05257L8.42204 0L4.7373 3.68474Z" />
                </svg>
              </div>
            </div>
            {/* <label className="flex items-center gap-2 text-white text-xs">
              <input type="checkbox" checked={lockRatio} onChange={(e) => setLockRatio(e.target.checked)} />
              Lock
            </label> */}
          </div>
        </div>
        <div className="mt-6 flex items-center gap-4">
          <Button
            onClick={startCropper}
            disabled={previewEnabled}
            className="bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white h-8 sm:h-8 px-4 sm:px-4 hover:opacity-90 transition-opacity"
          >
            Start Cropper</Button>
          <Button
            onClick={removeCropper}
            disabled={!previewEnabled}
            className="bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white h-8 sm:h-8 px-4 sm:px-4 hover:opacity-90 transition-opacity"
          >
            Remove Cropper</Button>
          <Button
            onClick={generatePreview}
            disabled={(!previewEnabled && !coordSeries.length) || isPreviewSubmitting}
            className="bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white h-8 sm:h-8 px-4 sm:px-4 hover:opacity-90 transition-opacity"
          >
            {isPreviewSubmitting ? 'Generating...' : 'Generate Preview'}</Button>
        </div>
      </div>
    </div >
  );
};

export default ManualTab;

interface ManualPreviewProps {
  videoUrl?: string;
  currentTime: number;
  playbackRate: number;
  cropBox: { x: number; y: number; width: number; height: number };
  videoWidth: number;
  videoHeight: number;
  ratio: string;
  isPreviewSubmitting?: boolean;
  generatingDynamic?: Array<{ ratio: string; active: boolean }>;
}

export const ManualPreview: React.FC<ManualPreviewProps & { previewEnabled?: boolean; isPlaying?: boolean; editedVideos?: any[]; generating?: Record<string, { active: boolean; event: 'autoFlip' | 'dynamicCropped' }>; onSaveAsClip?: (aspectRatio: string, documentId: string) => void; onDelete?: (documentId: string) => Promise<void> | void; onOverwriteClip?: () => Promise<void> | void; }> = ({ videoUrl, currentTime, playbackRate, cropBox, videoWidth, videoHeight, ratio, previewEnabled = true, isPlaying = false, editedVideos = [], generating = {}, onSaveAsClip, onDelete, onOverwriteClip, isPreviewSubmitting = false, generatingDynamic = [] }) => {
  const map: Record<string, number> = {
    '9 : 16': 9 / 16,
    '9 : 18': 9 / 18,
    '4 : 5': 4 / 5,
    '4 : 3': 4 / 3,
    '3 : 4': 3 / 4,
    '1 : 1': 1,
  };
  const ar = map[ratio] ?? 9 / 16;
  const previewW = 360;
  const previewH = Math.round(previewW / ar);
  const scale = cropBox.width > 0 ? previewW / cropBox.width : 1;
  const contentW = Math.round(videoWidth * scale);
  const contentH = Math.round(videoHeight * scale);
  const offsetX = Math.round(cropBox.x * scale);
  const offsetY = Math.round(cropBox.y * scale);
  const vref = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    const v = vref.current;
    if (!v) return;
    try {
      // Only update currentTime when user seeks significantly to avoid stutter
      if (!isNaN(currentTime) && Math.abs((v.currentTime || 0) - currentTime) > 0.1) v.currentTime = currentTime;
      v.playbackRate = playbackRate;
      if (isPlaying && videoUrl) {
        v.play().catch(() => { });
      } else {
        v.pause();
      }
    } catch { }
  }, [currentTime, playbackRate, videoUrl, isPlaying]);

  return (
    <div className="flex-1 px-6 pb-6">
      <div className="w-full h-[600px] bg-[#1B1B1B] rounded-2xl p-4 overflow-hidden relative flex items-center justify-center">
        {previewEnabled ? (
          <div style={{ width: `${previewW}px`, height: `${previewH}px`, borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
            <div style={{ width: `${contentW}px`, height: `${contentH}px`, position: 'absolute', left: `-${offsetX}px`, top: `-${offsetY}px` }}>
              {/* {videoUrl ? ( */}
              <video ref={vref} src={videoUrl} muted playsInline className="w-full h-full object-cover" />
            </div>
          </div>
        ) : (
          // <div className="flex-1 px-6 pb-6">
          //   <div className="w-full h-[500px] bg-[#1B1B1B] rounded-2xl p-4 overflow-hidden relative flex items-center justify-center">
          <div style={{ width: `${previewW}px`, height: `${previewH}px`, borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
              <div className="text-center text-white/70 text-xs sm:text-sm md:text-base">
                Preview not available
                <br />
                Please click on "Start Cropper" and play the video to preview
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 bg-[#1B1B1B] rounded-2xl p-4">
        <h4 className="text-white text-base font-semibold mb-4">Generated/ Processed clips</h4>
        <div className="flex flex-wrap gap-4">
          {(editedVideos || [])
            .filter((ev: any) => String(ev?.event || '').toLowerCase() === 'dynamiccropped')
            .map((ev: any, idx: number) => {
              const durRaw = ev?.duration ?? 0;
              const duration = typeof durRaw === 'number' ? durRaw : Number(durRaw) || 0;
              return (
                <EntityCard
                  key={ev?.documentId || idx}
                  type="bumper"
                  id={String(ev?.documentId || idx)}
                  title={""}
                  date={""}
                  thumbnail={ev?.videoUrl}
                  fileFormat={"MP4"}
                  duration={duration}
                  aspectRatio={String(ev?.aspect_ratio || '')}
                  tab="bumper"
                  showClipActions
                  onSaveAsClip={() => onSaveAsClip?.(String(ev?.aspect_ratio || ''), String(ev?.documentId || ''))}
                  onDelete={(docId: string) => onDelete?.(docId)}
                  onOverwriteClip={() => onOverwriteClip?.()}
                />
              );
            })}

          {(generatingDynamic || [])
            .filter((item: any) => item && item.active)
            .map((item: any, idx: number) => (
              <div key={`gen-${String(item?.ratio)}-${idx}`} className="w-60 h-[140px] rounded-xl relative overflow-hidden bg-[#1f2023] border border-[#2a2a2a]">
                <div className="absolute top-2.5 left-2.5">
                  <div className="bg-[#252525] rounded-md px-2 py-1 h-6 flex items-center">
                    <span className="text-white text-xs font-medium">{String(item.ratio || '')}</span>
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="px-4 py-1 rounded-full text-white text-sm font-medium bg-gradient-to-r from-[#00BBFF] to-[#0051FF]">
                    Generating...
                  </div>
                </div>
                {/* <div className="absolute bottom-2.5 left-0 right-0 text-center text-gray-300 text-xs">Cancel</div> */}
              </div>
            ))}

          {(!((editedVideos || []).some((ev: any) => String(ev?.event || '').toLowerCase() === 'dynamiccropped'))) && (
            <div className="text-white/60 text-sm">No processed clips yet</div>
          )}
        </div>
      </div>
    </div>
  );
};

export const ManualHeader: React.FC<{ ratio: string }> = ({ ratio }) => (
  <div className="text-center">
    <h3 className="text-white text-xl font-medium mt-2 mb-2">
      <span className="text-transparent bg-gradient-to-br from-[#00EEFF] to-[#0051FF] bg-clip-text text-xl font-bold">{ratio}</span>
      <span className="text-white text-xl font-bold"> dynamic preview</span>
    </h3>
  </div>
);
