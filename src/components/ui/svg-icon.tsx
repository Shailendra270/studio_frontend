// import React, { useMemo } from "react";
// import { cn } from "../lib/utils";
// import { getAssetPath } from "@/utils/assets";
// import { SVGPath } from "@/utils/assets";

// interface SVGIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
//   src: SVGPath;
//   alt?: string;
//   small?: boolean;
//   className?: string;
// }

// const SVGIcon: React.FC<SVGIconProps> = ({
//   className,
//   src,
//   alt = "",
//   small = false,
//   ...rest
// }) => {
//   const imageSrc = useMemo(() => getAssetPath(src), [src]);

//   return (
//     <img
//       {...rest}
//       className={cn(small ? "w-4 h-4" : "w-6 h-6", "object-contain", className)}
//       src={imageSrc}
//       loading="lazy"
//       alt={alt || imageSrc}
//     />
//   );
// };

// export default SVGIcon;

import React from "react";
// import add-highlight from "../assets/components/ClipCard/add-highlight.svg";

interface SvgIconProps {
  name: string;
  size?: number | string;
  width?: number | string;
  height?: number | string;
  className?: string;
  fill?: string;
  stroke?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

const SvgIcon: React.FC<SvgIconProps> = ({
  name,
  size = 24,
  width,
  height,
  className = "",
  fill = "currentColor",
  stroke,
  onClick,
  style,
}) => {
  const iconWidth = width || size;
  const iconHeight = height || size;

  // SVG paths and viewBox configurations
  const svgData: Record<string, { viewBox: string; path: string | JSX.Element }> = {
    // Navigation
    "chevron-left": {
      viewBox: "0 0 8 13",
      path: "M2.828 6.364L7.778 1.414L6.364 0L0 6.364L6.364 12.728L7.778 11.314L2.828 6.364Z"
    },
    "chevron-right": {
      viewBox: "0 0 8 13",
      path: "M5.172 6.364L0.222 1.414L1.636 0L8 6.364L1.636 12.728L0.222 11.314L5.172 6.364Z"
    },
    
    // Media Controls
    "three-dots": {
      viewBox: "0 0 30 24",
      path: (
        <>
          <rect width="30" height="24" rx="5" fill="#252525" />
          <circle cx="8" cy="12" r="2" fill="#D9D9D9" />
          <circle cx="15" cy="12" r="2" fill="#D9D9D9" />
          <circle cx="22" cy="12" r="2" fill="#D9D9D9" />
        </>
      )
    },
    
    // AI Icon
    "ai-icon": {
      viewBox: "0 0 20 13",
      path: (
        <>
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M5.8861 0C6.71112 0 7.4522 0.15989 8.10897 0.47983C8.55076 0.689648 8.93788 0.954157 9.27103 1.2726V0.252657L13.0602 0.252657L13.0602 12.5299H9.27103V11.5342C8.94828 11.8394 8.56945 12.0957 8.13419 12.3025C7.46048 12.6224 6.71112 12.7825 5.8861 12.7825C4.75773 12.7825 3.74717 12.5046 2.8546 11.9489C1.97896 11.3931 1.27986 10.6352 0.757651 9.6753C0.252549 8.71538 0 7.62062 0 6.39124C0 5.16187 0.252549 4.06711 0.757651 3.10717C1.27986 2.14725 1.97896 1.38935 2.8546 0.833578C3.74717 0.277859 4.75773 0 5.8861 0ZM5.66688 3.97625C5.10552 3.65219 4.40395 4.05725 4.40395 4.70546V8.05998C4.40395 8.70818 5.10552 9.11327 5.66688 8.78918L8.57209 7.11203C9.13346 6.78791 9.13346 5.97753 8.57209 5.65341L5.66688 3.97625Z"
            fill="url(#paint0_linear_ai_icon)"
          />
          <path
            d="M20.0001 12.5302H16.1349L16.1349 0.25293L20.0001 0.25293V12.5302Z"
            fill="url(#paint1_linear_ai_icon)"
          />
          <defs>
            <linearGradient
              id="paint0_linear_ai_icon"
              x1="25.1839"
              y1="6.46706"
              x2="7.31798"
              y2="-11.7867"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#00EEFF" />
              <stop offset="1" stopColor="#0051FF" />
            </linearGradient>
            <linearGradient
              id="paint1_linear_ai_icon"
              x1="25.1844"
              y1="6.46733"
              x2="7.31854"
              y2="-11.7864"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#00EEFF" />
              <stop offset="1" stopColor="#0051FF" />
            </linearGradient>
          </defs>
        </>
      )
    },
    
    // Star Rating
    "star": {
      viewBox: "0 0 12 12",
      path: "M5.46973 1.32049C5.66167 0.842504 6.33833 0.842503 6.53027 1.32048L7.67669 4.17532C7.75843 4.37886 7.94946 4.51766 8.16831 4.5325L11.2377 4.74062C11.7516 4.77546 11.9607 5.419 11.5654 5.74925L9.20456 7.72175C9.03623 7.86239 8.96327 8.08696 9.01678 8.29968L9.76733 11.2831C9.893 11.7827 9.34557 12.1804 8.90934 11.9065L6.30383 10.2708C6.11807 10.1541 5.88193 10.1541 5.69617 10.2707L3.09066 11.9065C2.65443 12.1804 2.107 11.7827 2.23267 11.2831L2.98322 8.29968C3.03674 8.08696 2.96377 7.86239 2.79544 7.72175L0.434597 5.74925C0.0393227 5.41899 0.24842 4.77546 0.762323 4.74062L3.8317 4.5325C4.05054 4.51766 4.24157 4.37886 4.32331 4.17532L5.46973 1.32049Z"
    },
    
    // Highlight Star
    "highlight-star": {
      viewBox: "0 0 13 13",
      path: (
        <>
          <path
            d="M12.813 6.72926C8.61288 7.60808 7.60808 8.61288 6.72926 12.813C6.67709 13.0623 6.32291 13.0623 6.27074 12.813C5.39192 8.61288 4.38712 7.60808 0.186959 6.72926C-0.0623197 6.67709 -0.0623197 6.32291 0.186959 6.27074C4.38712 5.39192 5.39192 4.38712 6.27074 0.186959C6.32291 -0.0623197 6.67709 -0.0623197 6.72926 0.186959C7.60808 4.38712 8.61288 5.39192 12.813 6.27074C13.0624 6.32291 13.0624 6.67709 12.813 6.72926Z"
            fill="url(#paint0_linear_highlight)"
          />
          <defs>
            <linearGradient
              id="paint0_linear_highlight"
              x1="25.0679"
              y1="6.5771"
              x2="6.89386"
              y2="-11.5968"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#00EEFF" />
              <stop offset="1" stopColor="#0051FF" />
            </linearGradient>
          </defs>
        </>
      )
    },
    
    // User Icon
    "user": {
      viewBox: "0 0 10 13",
      path: "M9.90476 13H0V11.7619C0 10.941 0.326105 10.1537 0.906574 9.57324C1.48704 8.99277 2.27433 8.66667 3.09524 8.66667H6.80952C7.63043 8.66667 8.41772 8.99277 8.99819 9.57324C9.57866 10.1537 9.90476 10.941 9.90476 11.7619V13ZM4.95238 7.42857C4.46461 7.42857 3.98162 7.3325 3.53099 7.14584C3.08035 6.95918 2.67089 6.68559 2.32598 6.34068C1.98108 5.99578 1.70749 5.58632 1.52083 5.13568C1.33417 4.68504 1.2381 4.20205 1.2381 3.71429C1.2381 3.22652 1.33417 2.74353 1.52083 2.29289C1.70749 1.84225 1.98108 1.43279 2.32598 1.08789C2.67089 0.742986 3.08035 0.469393 3.53099 0.282733C3.98162 0.0960728 4.46461 -7.26829e-09 4.95238 0C5.93747 1.4679e-08 6.88221 0.391325 7.57878 1.08789C8.27534 1.78445 8.66667 2.7292 8.66667 3.71429C8.66667 4.69938 8.27534 5.64412 7.57878 6.34068C6.88221 7.03725 5.93747 7.42857 4.95238 7.42857Z"
    },
    
    // Video Editor Icon
    "video-editor": {
      viewBox: "0 0 15 12",
      path: (
        <>
          <path
            d="M10.9091 4.27202L14.4634 1.78338C14.5145 1.74756 14.5745 1.72645 14.6368 1.72236C14.699 1.71827 14.7612 1.73136 14.8166 1.7602C14.872 1.78903 14.9183 1.83251 14.9507 1.88589C14.983 1.93928 15.0001 2.00051 15 2.06293V10.2993C15.0001 10.3617 14.983 10.4229 14.9507 10.4763C14.9183 10.5297 14.872 10.5732 14.8166 10.602C14.7612 10.6309 14.699 10.6439 14.6368 10.6399C14.5745 10.6358 14.5145 10.6147 14.4634 10.5788L10.9091 8.0902V10.9538C10.9091 11.1347 10.8373 11.3081 10.7094 11.436C10.5815 11.5638 10.4081 11.6357 10.2273 11.6357H0.681818C0.500989 11.6357 0.327566 11.5638 0.1997 11.436C0.0718342 11.3081 0 11.1347 0 10.9538V1.40838C0 1.22755 0.0718342 1.05413 0.1997 0.926263C0.327566 0.798397 0.500989 0.726562 0.681818 0.726562H10.2273C10.4081 0.726562 10.5815 0.798397 10.7094 0.926263C10.8373 1.05413 10.9091 1.22755 10.9091 1.40838V4.27202ZM2.72727 3.45384V4.81747H4.09091V3.45384H2.72727Z"
            fill="white"
          />
          <path
            d="M2.04545 2.77202H4.77273V5.49929H2.04545V2.77202Z"
            fill="white"
          />
        </>
      )
    },
    
    // Refresh Icon
    "refresh": {
      viewBox: "0 0 14 14",
      path: "M7 0C3.1339 0 0 3.1339 0 7C0 10.8661 3.1339 14 7 14C10.8661 14 14 10.8661 14 7H12.6C12.6 10.0926 10.0926 12.6 7 12.6C3.9074 12.6 1.4 10.0926 1.4 7C1.4 3.9074 3.9074 1.4 7 1.4C8.7248 1.4 10.2676 2.1798 11.2945 3.4055L9.8 4.9H14V0.7L12.2871 2.4122C11.004 0.9352 9.1112 0 7 0Z"
    },
    
    // Plus Icon
    "plus": {
      viewBox: "0 0 24 24",
      path: "M12 5v14m-7-7h14"
    },
    
    // Live Indicator
    "live-dot": {
      viewBox: "0 0 8 8",
      path: "M4 8A4 4 0 1 0 4 0a4 4 0 0 0 0 8Z"
    }
  };

  const iconData = svgData[name];

  if (!iconData) {
    console.warn(`SVG icon "${name}" not found`);
    return null;
  }

  return (
    <svg
      width={iconWidth}
      height={iconHeight}
      viewBox={iconData.viewBox}
      fill={fill}
      stroke={stroke}
      className={className}
      onClick={onClick}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      {typeof iconData.path === 'string' ? (
        <path d={iconData.path} />
      ) : (
        iconData.path
      )}
    </svg>
  );
};

export default SvgIcon;