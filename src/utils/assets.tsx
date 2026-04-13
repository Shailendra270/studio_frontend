// Utility functions for managing asset paths

export const getAssetPath = (path: string): string => {
  try {
    new URL(path);
    return path;
  } catch (error) {
    return `/assets/${path}?v=${Date.now()}`;
  }
};

// Common SVG paths for easy import
export const SVG_PATHS = {
  // Header icons
  ADD_HIGHLIGHT: "icons/add-highlight.svg",
  sportSelectorIcon:"src/assets/components/Header/sportSelectorIcon.svg",
  // Common icons
  USER: "icons/user.svg",
  SETTINGS: "icons/settings.svg",

  // Add more paths as needed
} as const;

export type SVGPath = (typeof SVG_PATHS)[keyof typeof SVG_PATHS] | string;
