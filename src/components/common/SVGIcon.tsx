import React, { useMemo } from "react";

interface SVGIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  src: string; // Path to the SVG file
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Reusable SVG Icon Component
 * @param src - Local or remote path to the SVG file
 * @param className - Tailwind classes or styles to apply
 */
const SVGIcon: React.FC<SVGIconProps> = ({ src, className = "", style, ...rest }) => {
  // If src ends with .svg and is a local import, render inline SVG
  const isLocalSVG = src.endsWith('.svg') && !src.startsWith('http');

  // Memoize SVG content if local
  const svgContent = useMemo(() => {
    if (isLocalSVG) {
      try {
        // Dynamic import for local SVGs
        // @ts-ignore
        const svg = require(`${src}`);
        return svg.default || svg;
      } catch {
        return null;
      }
    }
    return null;
  }, [src, isLocalSVG]);

  if (isLocalSVG && svgContent) {
    return (
      <span
        className={className}
        style={style}
        dangerouslySetInnerHTML={{ __html: svgContent }}
        {...rest}
      />
    );
  }

  // Fallback to <img> for remote SVGs or if import fails
  return <img src={src} className={className} style={style} alt="icon" {...rest} />;
};

export default SVGIcon;
