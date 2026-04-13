import React from "react";

interface ClipLike {
  videoUrl?: string;
  thumbnailUrl?: string;
}

interface AiReframeTabProps {
  clip?: ClipLike;
  videoUrlOverride?: string;
  posterOverride?: string;
}

const AiReframeTab: React.FC<AiReframeTabProps> = ({ clip, videoUrlOverride, posterOverride }) => {
  return (
    <div className="flex-1">
      <div className="bg-[#1B1B1B] rounded-2xl p-4 h-[500px]">
        {clip?.videoUrl || videoUrlOverride ? (
          <video
            src={videoUrlOverride || clip?.videoUrl}
            poster={posterOverride || clip?.thumbnailUrl}
            controls
            autoPlay
            className="w-full h-full object-contain rounded-lg"
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-6xl mb-4">📹</div>
              <p>No video available</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiReframeTab;

/** For accounts that may only use 16:9 and 9:16 in AI reframe (e.g. spigno@legavolleyfemminile.it) */
export const AI_REFRAME_RESTRICTED_RATIOS_ACCOUNT_EMAIL = "spigno@legavolleyfemminile.it";
export const AI_REFRAME_ALLOWED_RATIOS_FOR_RESTRICTED = ["16:9", "9:16"];

interface AiReframeRatioGridProps {
  selectedRatio: string;
  onSelectRatio: (r: string) => void;
  getThumbForRatio: (r: string) => string | undefined;
  getEditedVideoForRatio: (r: string) => any;
  generating: Record<string, { active: boolean; event: 'autoFlip' | 'dynamicCropped' }>;
  onPlay: (r: string) => void;
  onGenerate: (r: string) => void;
  clipAspectRatio?: string;
  /** When set, only these ratios are shown (e.g. for restricted accounts) */
  allowedRatios?: string[];
}

export const AiReframeRatioGrid: React.FC<AiReframeRatioGridProps> = ({ selectedRatio, onSelectRatio, getThumbForRatio, getEditedVideoForRatio, generating, onPlay, onGenerate, clipAspectRatio, allowedRatios }) => {
  const isRatioVisible = (r: string) => !allowedRatios || allowedRatios.includes(r);

  const genActive = (r: string, ev: any) => {
    const evAuto = ev && String(ev?.event || '').toLowerCase() === 'autoflip';
    return (generating[r]?.active && generating[r]?.event === 'autoFlip') || (evAuto && ev?.status === 'processing');
  };
  const isApplicable = (r: string) => {
    const ar = String(clipAspectRatio || '').replace(/\s/g, '');
    if (!ar) return true;
    if (ar === '16:9') return true;
    return r.replace(/\s/g, '') === ar;
  };
  return (
    <div className="grid grid-cols-2 gap-6">
      {isRatioVisible("16:9") && (
      <div className="flex flex-col items-center">
        <div className={`w-full h-32 border-2 rounded-xl mb-3 relative group flex items-center justify-center ${isApplicable("16:9") ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} transition-all ${selectedRatio === "16:9" ? "border-[#00BBFF] bg-[#00BBFF]/10" : "border-[#252525] hover:border-[#373737]"}`} onClick={() => isApplicable("16:9") && onSelectRatio("16:9")}>
          <div className="w-36 h-24 bg-[#252525] rounded overflow-hidden flex items-center justify-center">
            {(() => {
              if (!isApplicable("16:9")) {
                return (
                  <svg width="16" height="12" viewBox="0 0 35 26" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M25.4545 8.27273L33.748 2.46591C33.8672 2.38232 34.0071 2.33306 34.1524 2.32352C34.2978 2.31398 34.4429 2.34452 34.5721 2.41181C34.7012 2.4791 34.8094 2.58055 34.8849 2.70511C34.9604 2.82966 35.0002 2.97255 35 3.11818V22.3364C35.0002 22.482 34.9604 22.6249 34.8849 22.7494C34.8094 22.874 34.7012 22.9754 34.5721 23.0427C34.4429 23.11 34.2978 23.1406 34.1524 23.131C34.0071 23.1215 33.8672 23.0722 33.748 22.9886L25.4545 17.1818V23.8636C25.4545 24.2856 25.2869 24.6902 24.9886 24.9886C24.6902 25.2869 24.2856 25.4545 23.8636 25.4545H1.59091C1.16897 25.4545 0.76432 25.2869 0.465966 24.9886C0.167613 24.6902 0 24.2856 0 23.8636V1.59091C0 1.16897 0.167613 0.76432 0.465966 0.465967C0.76432 0.167613 1.16897 0 1.59091 0H23.8636C24.2856 0 24.6902 0.167613 24.9886 0.465967C25.2869 0.76432 25.4545 1.16897 25.4545 1.59091V8.27273ZM25.4545 13.2984L31.8182 17.753V7.7L25.4545 12.1545V13.2968V13.2984ZM3.18182 3.18182V22.2727H22.2727V3.18182H3.18182ZM6.36364 6.36364H9.54545V9.54545H6.36364V6.36364Z" fill="white" /></svg>
                );
              }
              const thumb = getThumbForRatio("16:9");
              return thumb ? (<img src={thumb} alt="16:9 preview" className="w-full h-full object-cover" />) : (
                <svg width="16" height="12" viewBox="0 0 35 26" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M25.4545 8.27273L33.748 2.46591C33.8672 2.38232 34.0071 2.33306 34.1524 2.32352C34.2978 2.31398 34.4429 2.34452 34.5721 2.41181C34.7012 2.4791 34.8094 2.58055 34.8849 2.70511C34.9604 2.82966 35.0002 2.97255 35 3.11818V22.3364C35.0002 22.482 34.9604 22.6249 34.8849 22.7494C34.8094 22.874 34.7012 22.9754 34.5721 23.0427C34.4429 23.11 34.2978 23.1406 34.1524 23.131C34.0071 23.1215 33.8672 23.0722 33.748 22.9886L25.4545 17.1818V23.8636C25.4545 24.2856 25.2869 24.6902 24.9886 24.9886C24.6902 25.2869 24.2856 25.4545 23.8636 25.4545H1.59091C1.16897 25.4545 0.76432 25.2869 0.465966 24.9886C0.167613 24.6902 0 24.2856 0 23.8636V1.59091C0 1.16897 0.167613 0.76432 0.465966 0.465967C0.76432 0.167613 1.16897 0 1.59091 0H23.8636C24.2856 0 24.6902 0.167613 24.9886 0.465967C25.2869 0.76432 25.4545 1.16897 25.4545 1.59091V8.27273ZM25.4545 13.2984L31.8182 17.753V7.7L25.4545 12.1545V13.2968V13.2984ZM3.18182 3.18182V22.2727H22.2727V3.18182H3.18182ZM6.36364 6.36364H9.54545V9.54545H6.36364V6.36364Z" fill="white" /></svg>
              );
            })()}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            {(() => {
              if (!isApplicable("16:9")) return (<div className="px-3 py-2 bg-[#252525] rounded text-white text-xs">Not Applicable</div>);
              const ev: any = getEditedVideoForRatio("16:9");
              if (genActive("16:9", ev)) return (<div className="px-3 py-2 bg-[#252525] rounded text-white text-xs">Generating...</div>);
              if (clipAspectRatio === "16:9" || ev && String(ev?.event || '').toLowerCase() === 'autoflip' && ev?.videoUrl) return (<button className="px-3 py-2 bg-white text-black rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); onPlay("16:9"); }}>Play</button>);
              // return (<button className="px-3 py-2 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); onGenerate("16:9"); }}>Generate</button>);
            })()}
          </div>
        </div>
        <span className="text-white text-xs font-medium">16:9</span>
      </div>
      )}
      {isRatioVisible("9:16") && (
      <div className="flex flex-col items-center">
        <div className={`w-full h-32 border-2 rounded-xl mb-3 relative group flex items-center justify-center ${isApplicable("9:16") ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} transition-all ${selectedRatio === "9:16" ? "border-[#00BBFF] bg-[#00BBFF]/10" : "border-[#252525] hover:border-[#373737]"}`} onClick={() => isApplicable("9:16") && onSelectRatio("9:16")}>
          <div className="w-16 h-24 bg-[#252525] rounded overflow-hidden flex items-center justify-center">
            {(() => {
              if (!isApplicable("9:16")) return (
                <svg width="16" height="12" viewBox="0 0 35 26" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M25.4545 8.27273L33.748 2.46591C33.8672 2.38232 34.0071 2.33306 34.1524 2.32352C34.2978 2.31398 34.4429 2.34452 34.5721 2.41181C34.7012 2.4791 34.8094 2.58055 34.8849 2.70511C34.9604 2.82966 35.0002 2.97255 35 3.11818V22.3364C35.0002 22.482 34.9604 22.6249 34.8849 22.7494C34.8094 22.874 34.7012 22.9754 34.5721 23.0427C34.4429 23.11 34.2978 23.1406 34.1524 23.131C34.0071 23.1215 33.8672 23.0722 33.748 22.9886L25.4545 17.1818V23.8636C25.4545 24.2856 25.2869 24.6902 24.9886 24.9886C24.6902 25.2869 24.2856 25.4545 23.8636 25.4545H1.59091C1.16897 25.4545 0.76432 25.2869 0.465966 24.9886C0.167613 24.6902 0 24.2856 0 23.8636V1.59091C0 1.16897 0.167613 0.76432 0.465966 0.465967C0.76432 0.167613 1.16897 0 1.59091 0H23.8636C24.2856 0 24.6902 0.167613 24.9886 0.465967C25.2869 0.76432 25.4545 1.16897 25.4545 1.59091V8.27273ZM25.4545 13.2984L31.8182 17.753V7.7L25.4545 12.1545V13.2968V13.2984ZM3.18182 3.18182V22.2727H22.2727V3.18182H3.18182ZM6.36364 6.36364H9.54545V9.54545H6.36364V6.36364Z" fill="white" /></svg>
              );
              const thumb = getThumbForRatio("9:16");
              return thumb ? (<img src={thumb} alt="9:16 preview" className="w-full h-full object-cover" />) : (
                <svg width="16" height="12" viewBox="0 0 35 26" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M25.4545 8.27273L33.748 2.46591C33.8672 2.38232 34.0071 2.33306 34.1524 2.32352C34.2978 2.31398 34.4429 2.34452 34.5721 2.41181C34.7012 2.4791 34.8094 2.58055 34.8849 2.70511C34.9604 2.82966 35.0002 2.97255 35 3.11818V22.3364C35.0002 22.482 34.9604 22.6249 34.8849 22.7494C34.8094 22.874 34.7012 22.9754 34.5721 23.0427C34.4429 23.11 34.2978 23.1406 34.1524 23.131C34.0071 23.1215 33.8672 23.0722 33.748 22.9886L25.4545 17.1818V23.8636C25.4545 24.2856 25.2869 24.6902 24.9886 24.9886C24.6902 25.2869 24.2856 25.4545 23.8636 25.4545H1.59091C1.16897 25.4545 0.76432 25.2869 0.465966 24.9886C0.167613 24.6902 0 24.2856 0 23.8636V1.59091C0 1.16897 0.167613 0.76432 0.465966 0.465967C0.76432 0.167613 1.16897 0 1.59091 0H23.8636C24.2856 0 24.6902 0.167613 24.9886 0.465967C25.2869 0.76432 25.4545 1.16897 25.4545 1.59091V8.27273ZM25.4545 13.2984L31.8182 17.753V7.7L25.4545 12.1545V13.2968V13.2984ZM3.18182 3.18182V22.2727H22.2727V3.18182H3.18182ZM6.36364 6.36364H9.54545V9.54545H6.36364V6.36364Z" fill="white" /></svg>
              );
            })()}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            {(() => {
              if (!isApplicable("9:16")) return (<div className="px-3 py-2 bg-[#252525] rounded text-white text-xs">Not Applicable</div>);
              const ev: any = getEditedVideoForRatio("9:16");
              if (genActive("9:16", ev)) return (<div className="px-3 py-2 bg-[#252525] rounded text-white text-xs">Generating...</div>);
              if (clipAspectRatio === "9:16" || ev && String(ev?.event || '').toLowerCase() === 'autoflip' && ev?.videoUrl) return (<button className="px-3 py-2 bg-white text-black rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); onPlay("9:16"); }}>Play</button>);
              return (<button className="px-3 py-2 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); onGenerate("9:16"); }}>Generate</button>);
            })()}
          </div>
        </div>
        <span className="text-white text-xs font-medium">9:16</span>
      </div>
      )}
      {isRatioVisible("1:1") && (
      <div className="flex flex-col items-center">
        <div className={`w-full h-32 border-2 rounded-xl mb-3 relative group flex items-center justify-center ${isApplicable("1:1") ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} transition-all ${selectedRatio === "1:1" ? "border-[#00BBFF] bg-[#00BBFF]/10" : "border-[#252525] hover:border-[#373737]"}`} onClick={() => isApplicable("1:1") && onSelectRatio("1:1")}>
          <div className="w-24 h-24 bg-[#252525] rounded overflow-hidden flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 35 26" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M25.4545 8.27273L33.748 2.46591C33.8672 2.38232 34.0071 2.33306 34.1524 2.32352C34.2978 2.31398 34.4429 2.34452 34.5721 2.41181C34.7012 2.4791 34.8094 2.58055 34.8849 2.70511C34.9604 2.82966 35.0002 2.97255 35 3.11818V22.3364C35.0002 22.482 34.9604 22.6249 34.8849 22.7494C34.8094 22.874 34.7012 22.9754 34.5721 23.0427C34.4429 23.11 34.2978 23.1406 34.1524 23.131C34.0071 23.1215 33.8672 23.0722 33.748 22.9886L25.4545 17.1818V23.8636C25.4545 24.2856 25.2869 24.6902 24.9886 24.9886C24.6902 25.2869 24.2856 25.4545 23.8636 25.4545H1.59091C1.16897 25.4545 0.76432 25.2869 0.465966 24.9886C0.167613 24.6902 0 24.2856 0 23.8636V1.59091C0 1.16897 0.167613 0.76432 0.465966 0.465967C0.76432 0.167613 1.16897 0 1.59091 0H23.8636C24.2856 0 24.6902 0.167613 24.9886 0.465967C25.2869 0.76432 25.4545 1.16897 25.4545 1.59091V8.27273ZM25.4545 13.2984L31.8182 17.753V7.7L25.4545 12.1545V13.2968V13.2984ZM3.18182 3.18182V22.2727H22.2727V3.18182H3.18182ZM6.36364 6.36364H9.54545V9.54545H6.36364V6.36364Z" fill="white" /></svg>
            {(() => { if (!isApplicable("1:1")) return null; const thumb = getThumbForRatio("1:1"); return thumb ? (<img src={thumb} alt="1:1 preview" className="w-full h-full object-cover" />) : null; })()}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            {(() => { if (!isApplicable("1:1")) return (<div className="px-3 py-2 bg-[#252525] rounded text-white text-xs">Not Applicable</div>); const ev: any = getEditedVideoForRatio("1:1"); if (genActive("1:1", ev)) return (<div className="px-3 py-2 bg-[#252525] rounded text-white text-xs">Generating...</div>); if (clipAspectRatio === "1:1" || ev && String(clipAspectRatio === "1:1" || ev?.event || '').toLowerCase() === 'autoflip' && ev?.videoUrl) return (<button className="px-3 py-2 bg-white text-black rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); onPlay("1:1"); }}>Play</button>); return (<button className="px-3 py-2 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); onGenerate("1:1"); }}>Generate</button>); })()}
          </div>
        </div>
        <span className="text-white text-xs font-medium">1:1</span>
      </div>
      )}
      {isRatioVisible("9:18") && (
      <div className="flex flex-col items-center">
        <div className={`w-full h-32 border-2 rounded-xl mb-3 relative group flex items-center justify-center ${isApplicable("9:18") ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} transition-all ${selectedRatio === "9:18" ? "border-[#00BBFF] bg-[#00BBFF]/10" : "border-[#252525] hover:border-[#373737]"}`} onClick={() => isApplicable("9:18") && onSelectRatio("9:18")}>
          <div className="w-12 h-24 bg-[#252525] rounded overflow-hidden flex items-center justify-center relative">
            <svg width="16" height="12" viewBox="0 0 35 26" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M25.4545 8.27273L33.748 2.46591C33.8672 2.38232 34.0071 2.33306 34.1524 2.32352C34.2978 2.31398 34.4429 2.34452 34.5721 2.41181C34.7012 2.4791 34.8094 2.58055 34.8849 2.70511C34.9604 2.82966 35.0002 2.97255 35 3.11818V22.3364C35.0002 22.482 34.9604 22.6249 34.8849 22.7494C34.8094 22.874 34.7012 22.9754 34.5721 23.0427C34.4429 23.11 34.2978 23.1406 34.1524 23.131C34.0071 23.1215 33.8672 23.0722 33.748 22.9886L25.4545 17.1818V23.8636C25.4545 24.2856 25.2869 24.6902 24.9886 24.9886C24.6902 25.2869 24.2856 25.4545 23.8636 25.4545H1.59091C1.16897 25.4545 0.76432 25.2869 0.465966 24.9886C0.167613 24.6902 0 24.2856 0 23.8636V1.59091C0 1.16897 0.167613 0.76432 0.465966 0.465967C0.76432 0.167613 1.16897 0 1.59091 0H23.8636C24.2856 0 24.6902 0.167613 24.9886 0.465967C25.2869 0.76432 25.4545 1.16897 25.4545 1.59091V8.27273ZM25.4545 13.2984L31.8182 17.753V7.7L25.4545 12.1545V13.2968V13.2984ZM3.18182 3.18182V22.2727H22.2727V3.18182H3.18182ZM6.36364 6.36364H9.54545V9.54545H6.36364V6.36364Z" fill="white" /></svg>
            {(() => { if (!isApplicable("9:18")) return null; const thumb = getThumbForRatio("9:18"); return thumb ? (<img src={thumb} alt="9:18 preview" className="absolute inset-0 w-full h-full object-cover" />) : null; })()}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            {(() => { if (!isApplicable("9:18")) return (<div className="px-3 py-2 bg-[#252525] rounded text-white text-xs">Not Applicable</div>); const ev: any = getEditedVideoForRatio("9:18"); if (genActive("9:18", ev)) return (<div className="px-3 py-2 bg-[#252525] rounded text-white text-xs">Generating...</div>); if (clipAspectRatio === "9:18" || ev && String(ev?.event || '').toLowerCase() === 'autoflip' && ev?.videoUrl) return (<button className="px-3 py-2 bg-white text-black rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); onPlay("9:18"); }}>Play</button>); return (<button className="px-3 py-2 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); onGenerate("9:18"); }}>Generate</button>); })()}
          </div>
        </div>
        <span className="text-white text-xs font-medium">9:18</span>
      </div>
      )}
      {isRatioVisible("4:3") && (
      <div className="flex flex-col items-center">
        <div className={`w-full h-32 border-2 rounded-xl mb-3 relative group flex items-center justify-center ${isApplicable("4:3") ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} transition-all ${selectedRatio === "4:3" ? "border-[#00BBFF] bg-[#00BBFF]/10" : "border-[#252525] hover:border-[#373737]"}`} onClick={() => isApplicable("4:3") && onSelectRatio("4:3")}>
          <div className="w-28 h-24 bg-[#252525] rounded overflow-hidden flex items-center justify-center">
            <svg width="16" height="12" viewBox="0 0 35 26" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M25.4545 8.27273L33.748 2.46591C33.8672 2.38232 34.0071 2.33306 34.1524 2.32352C34.2978 2.31398 34.4429 2.34452 34.5721 2.41181C34.7012 2.4791 34.8094 2.58055 34.8849 2.70511C34.9604 2.82966 35.0002 2.97255 35 3.11818V22.3364C35.0002 22.482 34.9604 22.6249 34.8849 22.7494C34.8094 22.874 34.7012 22.9754 34.5721 23.0427C34.4429 23.11 34.2978 23.1406 34.1524 23.131C34.0071 23.1215 33.8672 23.0722 33.748 22.9886L25.4545 17.1818V23.8636C25.4545 24.2856 25.2869 24.6902 24.9886 24.9886C24.6902 25.2869 24.2856 25.4545 23.8636 25.4545H1.59091C1.16897 25.4545 0.76432 25.2869 0.465966 24.9886C0.167613 24.6902 0 24.2856 0 23.8636V1.59091C0 1.16897 0.167613 0.76432 0.465966 0.465967C0.76432 0.167613 1.16897 0 1.59091 0H23.8636C24.2856 0 24.6902 0.167613 24.9886 0.465967C25.2869 0.76432 25.4545 1.16897 25.4545 1.59091V8.27273ZM25.4545 13.2984L31.8182 17.753V7.7L25.4545 12.1545V13.2968V13.2984ZM3.18182 3.18182V22.2727H22.2727V3.18182H3.18182ZM6.36364 6.36364H9.54545V9.54545H6.36364V6.36364Z" fill="white" /></svg>
            {(() => { if (!isApplicable("4:3")) return null; const thumb = getThumbForRatio("4:3"); return thumb ? (<img src={thumb} alt="4:3 preview" className="w-full h-full object-cover" />) : null; })()}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            {(() => { if (!isApplicable("4:3")) return (<div className="px-3 py-2 bg-[#252525] rounded text-white text-xs">Not Applicable</div>); const ev: any = getEditedVideoForRatio("4:3"); if (genActive("4:3", ev)) return (<div className="px-3 py-2 bg-[#252525] rounded text-white text-xs">Generating...</div>); if (clipAspectRatio === "4:3" || ev && String(ev?.event || '').toLowerCase() === 'autoflip' && ev?.videoUrl) return (<button className="px-3 py-2 bg-white text-black rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); onPlay("4:3"); }}>Play</button>); return (<button className="px-3 py-2 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); onGenerate("4:3"); }}>Generate</button>); })()}
          </div>
        </div>
        <span className="text-white text-xs font-medium">4:3</span>
      </div>
      )}
      {isRatioVisible("3:4") && (
      <div className="flex flex-col items-center">
        <div className={`w-full h-32 border-2 rounded-xl mb-3 relative group flex items-center justify-center ${isApplicable("3:4") ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} transition-all ${selectedRatio === "3:4" ? "border-[#00BBFF] bg-[#00BBFF]/10" : "border-[#252525] hover:border-[#373737]"}`} onClick={() => isApplicable("3:4") && onSelectRatio("3:4")}>
          <div className="w-20 h-24 bg-[#252525] rounded overflow-hidden flex items-center justify-center relative">
            <svg width="16" height="12" viewBox="0 0 35 26" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M25.4545 8.27273L33.748 2.46591C33.8672 2.38232 34.0071 2.33306 34.1524 2.32352C34.2978 2.31398 34.4429 2.34452 34.5721 2.41181C34.7012 2.4791 34.8094 2.58055 34.8849 2.70511C34.9604 2.82966 35.0002 2.97255 35 3.11818V22.3364C35.0002 22.482 34.9604 22.6249 34.8849 22.7494C34.8094 22.874 34.7012 22.9754 34.5721 23.0427C34.4429 23.11 34.2978 23.1406 34.1524 23.131C34.0071 23.1215 33.8672 23.0722 33.748 22.9886L25.4545 17.1818V23.8636C25.4545 24.2856 25.2869 24.6902 24.9886 24.9886C24.6902 25.2869 24.2856 25.4545 23.8636 25.4545H1.59091C1.16897 25.4545 0.76432 25.2869 0.465966 24.9886C0.167613 24.6902 0 24.2856 0 23.8636V1.59091C0 1.16897 0.167613 0.76432 0.465966 0.465967C0.76432 0.167613 1.16897 0 1.59091 0H23.8636C24.2856 0 24.6902 0.167613 24.9886 0.465967C25.2869 0.76432 25.4545 1.16897 25.4545 1.59091V8.27273ZM25.4545 13.2984L31.8182 17.753V7.7L25.4545 12.1545V13.2968V13.2984ZM3.18182 3.18182V22.2727H22.2727V3.18182H3.18182ZM6.36364 6.36364H9.54545V9.54545H6.36364V6.36364Z" fill="white" /></svg>
            {(() => { if (!isApplicable("3:4")) return null; const thumb = getThumbForRatio("3:4"); return thumb ? (<img src={thumb} alt="3:4 preview" className="absolute inset-0 w-full h-full object-cover" />) : null; })()}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            {(() => { if (!isApplicable("3:4")) return (<div className="px-3 py-2 bg-[#252525] rounded text-white text-xs">Not Applicable</div>); const ev: any = getEditedVideoForRatio("3:4"); if (genActive("3:4", ev)) return (<div className="px-3 py-2 bg-[#252525] rounded text-white text-xs">Generating...</div>); if (clipAspectRatio === "3:4" || ev && String(ev?.event || '').toLowerCase() === 'autoflip' && ev?.videoUrl) return (<button className="px-3 py-2 bg-white text-black rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); onPlay("3:4"); }}>Play</button>); return (<button className="px-3 py-2 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); onGenerate("3:4"); }}>Generate</button>); })()}
          </div>
        </div>
        <span className="text-white text-xs font-medium">3:4</span>
      </div>
      )}
      {isRatioVisible("4:5") && (
      <div className="flex flex-col items-center">
        <div className={`w-full h-32 border-2 rounded-xl mb-3 relative group flex items-center justify-center ${isApplicable("4:5") ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} transition-all ${selectedRatio === "4:5" ? "border-[#00BBFF] bg-[#00BBFF]/10" : "border-[#252525] hover:border-[#373737]"}`} onClick={() => isApplicable("4:5") && onSelectRatio("4:5")}>
          <div className="w-16 h-24 bg-[#252525] rounded overflow-hidden flex items-center justify-center">
            <svg width="16" height="12" viewBox="0 0 35 26" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M25.4545 8.27273L33.748 2.46591C33.8672 2.38232 34.0071 2.33306 34.1524 2.32352C34.2978 2.31398 34.4429 2.34452 34.5721 2.41181C34.7012 2.4791 34.8094 2.58055 34.8849 2.70511C34.9604 2.82966 35.0002 2.97255 35 3.11818V22.3364C35.0002 22.482 34.9604 22.6249 34.8849 22.7494C34.8094 22.874 34.7012 22.9754 34.5721 23.0427C34.4429 23.11 34.2978 23.1406 34.1524 23.131C34.0071 23.1215 33.8672 23.0722 33.748 22.9886L25.4545 17.1818V23.8636C25.4545 24.2856 25.2869 24.6902 24.9886 24.9886C24.6902 25.2869 24.2856 25.4545 23.8636 25.4545H1.59091C1.16897 25.4545 0.76432 25.2869 0.465966 24.9886C0.167613 24.6902 0 24.2856 0 23.8636V1.59091C0 1.16897 0.167613 0.76432 0.465966 0.465967C0.76432 0.167613 1.16897 0 1.59091 0H23.8636C24.2856 0 24.6902 0.167613 24.9886 0.465967C25.2869 0.76432 25.4545 1.16897 25.4545 1.59091V8.27273ZM25.4545 13.2984L31.8182 17.753V7.7L25.4545 12.1545V13.2968V13.2984ZM3.18182 3.18182V22.2727H22.2727V3.18182H3.18182ZM6.36364 6.36364H9.54545V9.54545H6.36364V6.36364Z" fill="white" /></svg>
            {(() => { if (!isApplicable("4:5")) return null; const thumb = getThumbForRatio("4:5"); return thumb ? (<img src={thumb} alt="4:5 preview" className="w-full h-full object-cover" />) : null; })()}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            {(() => { if (!isApplicable("4:5")) return (<div className="px-3 py-2 bg-[#252525] rounded text-white text-xs">Not Applicable</div>); const ev: any = getEditedVideoForRatio("4:5"); if (genActive("4:5", ev)) return (<div className="px-3 py-2 bg-[#252525] rounded text-white text-xs">Generating...</div>); if (clipAspectRatio === "4:5" || ev && String(ev?.event || '').toLowerCase() === 'autoflip' && ev?.videoUrl) return (<button className="px-3 py-2 bg-white text-black rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); onPlay("4:5"); }}>Play</button>); return (<button className="px-3 py-2 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); onGenerate("4:5"); }}>Generate</button>); })()}
          </div>
        </div>
        <span className="text-white text-xs font-medium">4:5</span>
      </div>
      )}
    </div>
  );
};

export const AiReframeHeader: React.FC = () => (
  <div className="text-center">
    <h3 className="text-white text-xl font-medium mt-10 mb-10">Available ratios</h3>
  </div>
);
