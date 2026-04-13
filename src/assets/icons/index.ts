export const IconNames = {
  // Navigation
  CHEVRON_LEFT: 'chevron-left',
  CHEVRON_RIGHT: 'chevron-right',
  
  // Media Controls
  THREE_DOTS: 'three-dots',
  
  // AI & Features
  AI_ICON: 'ai-icon',
  
  // Rating & Highlights
  STAR: 'star',
  HIGHLIGHT_STAR: 'highlight-star',
  
  // User
  USER: 'user',
  
  // Video
  VIDEO_EDITOR: 'video-editor',
  
  // Actions
  REFRESH: 'refresh',
  PLUS: 'plus',
  
  // Status
  LIVE_DOT: 'live-dot'
} as const;

export type IconName = typeof IconNames[keyof typeof IconNames];