import React from 'react';

interface ClipGenerationCardProps {
  clip: {
    id: string;
    title: string;
    date: string;
    progress: number;
    duration: string;
    aspectRatio: string;
    rating: number;
    thumbnail: string;
    timeRange: string;
  };
}

const ClipGenerationCard: React.FC<ClipGenerationCardProps> = ({ clip }) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <svg
        key={index}
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="inline"
      >
        <path
          d="M5.46973 1.32049C5.66167 0.842504 6.33833 0.842503 6.53027 1.32048L7.67669 4.17532C7.75843 4.37886 7.94946 4.51766 8.16831 4.5325L11.2377 4.74062C11.7516 4.77546 11.9607 5.419 11.5654 5.74925L9.20456 7.72175C9.03623 7.86239 8.96327 8.08696 9.01678 8.29968L9.76733 11.2831C9.893 11.7827 9.34557 12.1804 8.90934 11.9065L6.30383 10.2708C6.11807 10.1541 5.88193 10.1541 5.69617 10.2707L3.09066 11.9065C2.65443 12.1804 2.107 11.7827 2.23267 11.2831L2.98322 8.29968C3.03674 8.08696 2.96377 7.86239 2.79544 7.72175L0.434597 5.74925C0.0393227 5.41899 0.24842 4.77546 0.762323 4.74062L3.8317 4.5325C4.05054 4.51766 4.24157 4.37886 4.32331 4.17532L5.46973 1.32049Z"
          fill={index < rating ? "#FFF" : "#666"}
        />
      </svg>
    ));
  };

  return (
    <div className="bg-[#1A1B1E] rounded-xl border-2 border-[#00BBFF] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[#373737]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white text-lg font-bold">{clip.title}</h3>
          <button className="text-white hover:text-gray-300 transition-colors">
            <svg width="30" height="24" viewBox="0 0 30 24" fill="none">
              <rect width="30" height="24" rx="5" fill="#252525"/>
              <circle cx="8" cy="12" r="2" fill="#D9D9D9"/>
              <circle cx="15" cy="12" r="2" fill="#D9D9D9"/>
              <circle cx="22" cy="12" r="2" fill="#D9D9D9"/>
            </svg>
          </button>
        </div>
        <p className="text-gray-400 text-sm">{clip.date}</p>
      </div>

      {/* Thumbnail and video icon */}
      <div className="relative aspect-video bg-gray-700 overflow-hidden">
        <img
          src={clip.thumbnail}
          alt={clip.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/api/placeholder/320/180";
          }}
        />
        
        {/* Video play icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width="35" height="26" viewBox="0 0 35 26" fill="none">
            <path d="M25.4545 8.27273L33.748 2.46591C33.8672 2.38232 34.0071 2.33306 34.1524 2.32352C34.2978 2.31398 34.4429 2.34452 34.5721 2.41181C34.7012 2.4791 34.8094 2.58055 34.8849 2.70511C34.9604 2.82966 35.0002 2.97255 35 3.11818V22.3364C35.0002 22.482 34.9604 22.6249 34.8849 22.7494C34.8094 22.874 34.7012 22.9754 34.5721 23.0427C34.4429 23.11 34.2978 23.1406 34.1524 23.131C34.0071 23.1215 33.8672 23.0722 33.748 22.9886L25.4545 17.1818V23.8636C25.4545 24.2856 25.2869 24.6902 24.9886 24.9886C24.6902 25.2869 24.2856 25.4545 23.8636 25.4545H1.59091C1.16897 25.4545 0.76432 25.2869 0.465966 24.9886C0.167613 24.6902 0 24.2856 0 23.8636V1.59091C0 1.16897 0.167613 0.76432 0.465966 0.465967C0.76432 0.167613 1.16897 0 1.59091 0H23.8636C24.2856 0 24.6902 0.167613 24.9886 0.465967C25.2869 0.76432 25.4545 1.16897 25.4545 1.59091V8.27273ZM25.4545 13.2984L31.8182 17.753V7.7L25.4545 12.1545V13.2968V13.2984ZM3.18182 3.18182V22.2727H22.2727V3.18182H3.18182ZM6.36364 6.36364H9.54545V9.54545H6.36364V6.36364Z" fill="white"/>
          </svg>
        </div>
      </div>

      {/* Progress section */}
      <div className="p-4">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-4">
          {/* Progress badge */}
          <div className="bg-[#252525] rounded px-3 py-1 relative overflow-hidden">
            <div 
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#00BBFF] to-[#0051FF] rounded"
              style={{ width: `${clip.progress}%` }}
            />
            <span className="relative z-10 text-white text-xs font-medium">
              Generating {clip.progress}%
            </span>
          </div>

          {/* Aspect ratio badge */}
          <div className="bg-[#252525] rounded px-2 py-1">
            <span className="text-white text-xs font-medium">{clip.aspectRatio}</span>
          </div>

          {/* Duration badge */}
          <div className="bg-[#252525] rounded px-2 py-1">
            <span className="text-white text-xs font-medium">{clip.duration}</span>
          </div>

          {/* Rating with star */}
          <div className="flex items-center gap-1">
            <span className="text-white text-xs font-bold">{clip.rating}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M5.46973 1.32049C5.66167 0.842504 6.33833 0.842503 6.53027 1.32048L7.67669 4.17532C7.75843 4.37886 7.94946 4.51766 8.16831 4.5325L11.2377 4.74062C11.7516 4.77546 11.9607 5.419 11.5654 5.74925L9.20456 7.72175C9.03623 7.86239 8.96327 8.08696 9.01678 8.29968L9.76733 11.2831C9.893 11.7827 9.34557 12.1804 8.90934 11.9065L6.30383 10.2708C6.11807 10.1541 5.88193 10.1541 5.69617 10.2707L3.09066 11.9065C2.65443 12.1804 2.107 11.7827 2.23267 11.2831L2.98322 8.29968C3.03674 8.08696 2.96377 7.86239 2.79544 7.72175L0.434597 5.74925C0.0393227 5.41899 0.24842 4.77546 0.762323 4.74062L3.8317 4.5325C4.05054 4.51766 4.24157 4.37886 4.32331 4.17532L5.46973 1.32049Z" fill="white"/>
            </svg>
          </div>
        </div>

        {/* Time range */}
        <div className="bg-[#252525] rounded px-3 py-1 inline-block">
          <span className="text-white text-xs font-medium">{clip.timeRange}</span>
        </div>
      </div>
    </div>
  );
};

export default ClipGenerationCard;
