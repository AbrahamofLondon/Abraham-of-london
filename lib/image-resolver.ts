/**
 * Unified Image Resolver for Abraham of London
 * 
 * This module provides a single canonical source for resolving cover/hero images
 * across all content surfaces. It handles:
 * - Local image paths (ensuring they start with /assets/images/)
 * - Remote URLs (validating they're supported by Next.js Image component)
 * - Fallback images for different content types
 * - Image type normalization (string vs object with src property)
 */

// Default fallback images for different content types.
// IMPORTANT: Every path here must correspond to a file that exists under public/.
// Verified against disk on 2026-04-16.
export const FALLBACK_IMAGES = {
  // Primary fallback - used when no specific type matches
  DEFAULT: '/assets/images/writing-desk.webp',

  // Content type specific fallbacks (all verified to exist on disk)
  BLOG: '/assets/images/blog/default-blog-cover.jpg',
  BOOK: '/assets/images/books/the-architecture-of-human-purpose.jpg',
  CANON: '/assets/images/canon/canon-resources.jpg',
  DOWNLOAD: '/assets/images/writing-desk.webp',
  RESOURCE: '/assets/images/canon/canon-resources.jpg',
  STRATEGY: '/assets/images/writing-desk.webp',
  EVENT: '/assets/images/writing-desk.webp',
  PRINT: '/assets/images/writing-desk.webp',
  SHORT: '/assets/images/writing-desk.webp',
  BRIEF: '/assets/images/canon/canon-resources.jpg',
  ARTIFACT: '/assets/images/writing-desk.webp',
  PLAYBOOK: '/assets/images/writing-desk.webp',
} as const;

// Next.js supported image domains (from next.config.mjs)
const SUPPORTED_IMAGE_DOMAINS = [
  'images.unsplash.com',
  'assets.vercel.com',
  '*.vercel.app',
  '*.netlify.app',
  '*.cloudfront.net',
  // Add any other domains used in the project
];

/**
 * Normalizes an image input to a string URL
 * Handles: string, object with src property, null, undefined
 */
export function normalizeImageInput(image: any): string | null {
  if (!image) return null;
  
  if (typeof image === 'string') {
    return image.trim() || null;
  }
  
  if (typeof image === 'object' && image !== null) {
    const src = (image as any).src;
    if (typeof src === 'string') {
      return src.trim() || null;
    }
  }
  
  return null;
}

/**
 * Validates if a URL is a local path (starts with /)
 */
export function isLocalPath(url: string): boolean {
  return url.startsWith('/');
}

/**
 * Validates if a URL is a supported remote URL
 */
export function isSupportedRemoteUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    
    // Check against supported domains
    return SUPPORTED_IMAGE_DOMAINS.some(pattern => {
      if (pattern.startsWith('*.')) {
        const domain = pattern.slice(2);
        return hostname.endsWith(domain);
      }
      return hostname === pattern;
    });
  } catch {
    // If URL parsing fails, it's not a valid remote URL
    return false;
  }
}

/**
 * Ensures local paths are properly formatted
 * - Adds leading slash if missing
 * - Ensures it points to /assets/images/ for consistency
 */
export function normalizeLocalPath(path: string): string {
  // Ensure leading slash
  let normalized = path.startsWith('/') ? path : `/${path}`;
  
  // If it's a local path but doesn't start with /assets/images/,
  // we should log a warning but still return it
  if (!normalized.startsWith('/assets/images/')) {
    console.warn(`Image path "${normalized}" doesn't follow /assets/images/ convention`);
  }
  
  return normalized;
}

/**
 * Main resolver function - resolves cover/hero image for any document
 */
export function resolveDocCoverImage(
  doc: any,
  options: {
    contentType?: keyof typeof FALLBACK_IMAGES;
    fallback?: string;
    strict?: boolean;
  } = {}
): string {
  const {
    contentType,
    fallback = contentType ? FALLBACK_IMAGES[contentType] : FALLBACK_IMAGES.DEFAULT,
    strict = false
  } = options;

  // Try multiple possible image fields in order of preference
  const imageFields = [
    'coverImage',
    'image',
    'heroImage',
    'thumbnail',
    'ogImage',
    'cover',
    'featuredImage',
    'coverArt'
  ];

  for (const field of imageFields) {
    const imageValue = doc?.[field];
    const normalized = normalizeImageInput(imageValue);

    if (normalized) {
      // Handle local paths — trust them as valid public URLs.
      // Never validate against the filesystem: at ISR runtime the public/
      // directory does not exist on disk (Netlify serves statics from CDN),
      // so fs.existsSync would reject every valid path and collapse all
      // covers to the fallback.
      if (isLocalPath(normalized)) {
        return normalizeLocalPath(normalized);
      }

      // Handle remote URLs
      if (isSupportedRemoteUrl(normalized)) {
        return normalized;
      }

      // If strict mode, we don't accept unsupported remote URLs
      if (strict) {
        console.warn(`Unsupported remote image URL: ${normalized}`);
        continue;
      }

      // In non-strict mode, return the URL anyway
      return normalized;
    }
  }

  // No valid image found, return fallback
  return fallback;
}

/**
 * Resolves image for specific content types with appropriate fallbacks
 */
export const resolveImageFor = {
  blog: (doc: any) => resolveDocCoverImage(doc, { contentType: 'BLOG' }),
  book: (doc: any) => resolveDocCoverImage(doc, { contentType: 'BOOK' }),
  canon: (doc: any) => resolveDocCoverImage(doc, { contentType: 'CANON' }),
  download: (doc: any) => resolveDocCoverImage(doc, { contentType: 'DOWNLOAD' }),
  resource: (doc: any) => resolveDocCoverImage(doc, { contentType: 'RESOURCE' }),
  strategy: (doc: any) => resolveDocCoverImage(doc, { contentType: 'STRATEGY' }),
  event: (doc: any) => resolveDocCoverImage(doc, { contentType: 'EVENT' }),
  print: (doc: any) => resolveDocCoverImage(doc, { contentType: 'PRINT' }),
  short: (doc: any) => resolveDocCoverImage(doc, { contentType: 'SHORT' }),
  brief: (doc: any) => resolveDocCoverImage(doc, { contentType: 'BRIEF' }),
  artifact: (doc: any) => resolveDocCoverImage(doc, { contentType: 'ARTIFACT' }),
  playbook: (doc: any) => resolveDocCoverImage(doc, { contentType: 'PLAYBOOK' }),
  
  // Generic resolver
  any: (doc: any, contentType?: keyof typeof FALLBACK_IMAGES) => 
    resolveDocCoverImage(doc, { contentType }),
};

/**
 * Utility to check if an image should be unoptimized (for local images with Next.js Image)
 */
export function shouldUnoptimizeImage(src: string): boolean {
  return isLocalPath(src);
}

/**
 * Gets image props for Next.js Image component
 */
export function getImageProps(
  doc: any,
  options: {
    contentType?: keyof typeof FALLBACK_IMAGES;
    alt?: string;
    sizes?: string;
    priority?: boolean;
  } = {}
) {
  const {
    contentType,
    alt = doc?.title || 'Cover image',
    sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    priority = false
  } = options;

  const src = resolveDocCoverImage(doc, { contentType });
  const unoptimized = shouldUnoptimizeImage(src);

  return {
    src,
    alt,
    sizes,
    priority,
    unoptimized,
  };
}

// Export the main resolver as default for backward compatibility
export default resolveDocCoverImage;