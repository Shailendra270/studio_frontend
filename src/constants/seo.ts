export const SEO_DEFAULTS = {
  SITE_NAME: 'ClipMaster',
  SITE_URL: 'https://clipmaster.app',
  DEFAULT_DESCRIPTION: 'Advanced video clipping and editing platform for content creators',
  DEFAULT_KEYWORDS: ['video editing', 'clips', 'highlights', 'content creation', 'streaming'],
  DEFAULT_OG_IMAGE: '/assets/images/og-default.png',
  TWITTER_HANDLE: '@clipmaster',
} as const;

export const PAGE_SEO_CONFIGS = {
  CLIPS: {
    title: 'Clips - ClipMaster',
    description: 'Manage and edit your video clips with advanced AI-powered tools',
    keywords: ['video clips', 'clip management', 'video editing', 'AI editing'],
  },
  DASHBOARD: {
    title: 'Dashboard - ClipMaster',
    description: 'Your content creation dashboard with analytics and clip management',
    keywords: ['dashboard', 'analytics', 'content management', 'video statistics'],
  },
  HIGHLIGHTS: {
    title: 'Highlights - ClipMaster',
    description: 'Create and manage video highlights from your clips',
    keywords: ['highlights', 'video highlights', 'clip compilation', 'video editing'],
  },
} as const;