export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonical?: string;
  noIndex?: boolean;
  noFollow?: boolean;
}

export const setSEOMetadata = (config: SEOConfig) => {
  // Set document title
  document.title = config.title;

  // Helper function to set meta tag
  const setMetaTag = (name: string, content: string, property?: boolean) => {
    const attribute = property ? 'property' : 'name';
    let meta = document.querySelector(`meta[${attribute}="${name}"]`);
    
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attribute, name);
      document.head.appendChild(meta);
    }
    
    meta.setAttribute('content', content);
  };

  // Set basic meta tags
  setMetaTag('description', config.description);
  
  if (config.keywords) {
    setMetaTag('keywords', config.keywords.join(', '));
  }

  // Set Open Graph tags
  setMetaTag('og:title', config.ogTitle || config.title, true);
  setMetaTag('og:description', config.ogDescription || config.description, true);
  setMetaTag('og:type', 'website', true);
  
  if (config.ogImage) {
    setMetaTag('og:image', config.ogImage, true);
  }
  
  if (config.ogUrl) {
    setMetaTag('og:url', config.ogUrl, true);
  }

  // Set Twitter Card tags
  setMetaTag('twitter:card', config.twitterCard || 'summary_large_image');
  setMetaTag('twitter:title', config.twitterTitle || config.title);
  setMetaTag('twitter:description', config.twitterDescription || config.description);
  
  if (config.twitterImage) {
    setMetaTag('twitter:image', config.twitterImage);
  }

  // Set canonical URL
  if (config.canonical) {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', config.canonical);
  }

  // Set robots meta tag
  if (config.noIndex || config.noFollow) {
    const robotsContent = [
      config.noIndex ? 'noindex' : 'index',
      config.noFollow ? 'nofollow' : 'follow'
    ].join(', ');
    
    setMetaTag('robots', robotsContent);
  }
};