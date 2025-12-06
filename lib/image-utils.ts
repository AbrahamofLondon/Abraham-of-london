// lib/image-utils.ts
import { safeString } from './utils';

/* -------------------------------------------------------------------------- */
/* TYPES & INTERFACES - DECLARED WITHOUT EXPORT                              */
/* -------------------------------------------------------------------------- */

// Declare interfaces WITHOUT export keyword
interface ImageMetadata {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  format?: string;
  quality?: number;
  blurDataURL?: string;
}

interface FallbackConfig {
  type: 'book' | 'post' | 'avatar' | 'project';
  theme?: 'light' | 'dark' | 'gradient';
  category?: string;
}

interface ImageValidationResult {
  isValid: boolean;
  reason?: 'invalid-url' | 'missing-protocol' | 'unsupported-format' | 'size-too-large';
  suggestedFix?: string;
}

/* -------------------------------------------------------------------------- */
/* CONSTANTS & CONFIGURATION                                                  */
/* -------------------------------------------------------------------------- */

// Base CDN URL for optimized images
const CDN_BASE_URL = process.env.NEXT_PUBLIC_CDN_URL || 'https://cdn.abrahamoflondon.org';

// Supported image formats
const SUPPORTED_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'svg'] as const;
const PREFERRED_FORMAT: typeof SUPPORTED_FORMATS[number] = 'webp';

// Image optimization settings by context
const IMAGE_OPTIMIZATION = {
  cover: {
    widths: [320, 640, 768, 1024, 1280, 1536, 1920],
    quality: 85,
    formats: ['webp', 'jpg'] as const,
  },
  thumbnail: {
    widths: [100, 200, 300, 400],
    quality: 75,
    formats: ['webp'] as const,
  },
  avatar: {
    widths: [32, 64, 128, 256],
    quality: 90,
    formats: ['webp'] as const,
  },
} as const;

// Fallback images organized by type and theme
const FALLBACK_IMAGES = {
  // Books
  book: {
    default: [
      '/assets/images/books/default-cover-1.webp',
      '/assets/images/books/default-cover-2.webp',
      '/assets/images/books/default-cover-3.webp',
    ],
    fiction: '/assets/images/books/fallback-fiction.webp',
    nonFiction: '/assets/images/books/fallback-nonfiction.webp',
    philosophy: '/assets/images/books/fallback-philosophy.webp',
    business: '/assets/images/books/fallback-business.webp',
    gradient: '/assets/images/gradients/book-gradient-1.svg',
  },
  
  // Posts
  post: {
    default: [
      '/assets/images/posts/default-1.webp',
      '/assets/images/posts/default-2.webp',
      '/assets/images/posts/default-3.webp',
    ],
    essay: '/assets/images/posts/essay-default.webp',
    article: '/assets/images/posts/article-default.webp',
    thought: '/assets/images/posts/thought-default.webp',
    gradient: '/assets/images/gradients/post-gradient-1.svg',
  },
  
  // Projects
  project: {
    default: '/assets/images/projects/default-project.webp',
    active: '/assets/images/projects/active-project.webp',
    archived: '/assets/images/projects/archived-project.webp',
    gradient: '/assets/images/gradients/project-gradient-1.svg',
  },
  
  // Avatars
  avatar: {
    default: '/assets/images/avatars/default-avatar.webp',
    author: '/assets/images/avatars/author-avatar.webp',
    guest: '/assets/images/avatars/guest-avatar.webp',
    gradient: '/assets/images/gradients/avatar-gradient-1.svg',
  },
  
  // Generic
  generic: {
    placeholder: '/assets/images/placeholder.webp',
    gradient: {
      light: '/assets/images/gradients/light-gradient.svg',
      dark: '/assets/images/gradients/dark-gradient.svg',
      gold: '/assets/images/gradients/gold-gradient.svg',
      forest: '/assets/images/gradients/forest-gradient.svg',
    },
  },
} as const;

/* -------------------------------------------------------------------------- */
/* URL VALIDATION & NORMALIZATION                                             */
/* -------------------------------------------------------------------------- */

/**
 * Validates if a string is a valid image URL
 */
function isValidImageUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return false;
  }

  const trimmedUrl = url.trim();
  
  // Check if it's a data URL
  if (trimmedUrl.startsWith('data:')) {
    return trimmedUrl.startsWith('data:image/');
  }
  
  // Check if it's a local path
  if (trimmedUrl.startsWith('/')) {
    return true;
  }
  
  // Check if it's a valid URL
  try {
    const parsed = new URL(trimmedUrl);
    const ext = getFileExtension(parsed.pathname).toLowerCase();
    
    // Check if it's an image format
    return SUPPORTED_FORMATS.includes(ext as any);
  } catch {
    return false;
  }
}

/**
 * Extracts file extension from URL or path
 */
function getFileExtension(path: string): string {
  const fileName = path.split('/').pop() || '';
  const extension = fileName.split('.').pop() || '';
  return extension.toLowerCase();
}

/**
 * Normalizes an image URL to ensure it's properly formatted
 */
function normalizeImageUrl(
  url: string | undefined | null,
  options: {
    baseUrl?: string;
    forceHttps?: boolean;
    addCdnPrefix?: boolean;
  } = {}
): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return '';
  }

  const { baseUrl = '', forceHttps = true, addCdnPrefix = false } = options;
  let normalized = url.trim();

  // Handle data URLs
  if (normalized.startsWith('data:')) {
    return normalized;
  }

  // Handle local paths
  if (normalized.startsWith('/')) {
    if (baseUrl && !normalized.startsWith(baseUrl)) {
      normalized = `${baseUrl.replace(/\/$/, '')}${normalized}`;
    }
  } else if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    // Relative path without leading slash
    normalized = `/${normalized}`;
    if (baseUrl) {
      normalized = `${baseUrl.replace(/\/$/, '')}${normalized}`;
    }
  }

  // Force HTTPS if needed
  if (forceHttps && normalized.startsWith('http://')) {
    normalized = normalized.replace('http://', 'https://');
  }

  // Add CDN prefix if needed
  if (addCdnPrefix && CDN_BASE_URL && !normalized.includes(CDN_BASE_URL)) {
    if (normalized.startsWith('/')) {
      normalized = `${CDN_BASE_URL}${normalized}`;
    } else if (normalized.startsWith('http')) {
      // Already absolute, keep as is
    } else {
      normalized = `${CDN_BASE_URL}/${normalized}`;
    }
  }

  return normalized;
}

/**
 * Validates and analyzes an image URL
 */
function validateImageUrl(url: string): ImageValidationResult {
  if (!url) {
    return { isValid: false, reason: 'invalid-url' };
  }

  if (!isValidImageUrl(url)) {
    return { isValid: false, reason: 'unsupported-format' };
  }

  // Check protocol for external URLs
  if (url.startsWith('http://')) {
    return {
      isValid: true,
      reason: 'missing-protocol',
      suggestedFix: url.replace('http://', 'https://'),
    };
  }

  return { isValid: true };
}

/* -------------------------------------------------------------------------- */
/* FALLBACK IMAGE MANAGEMENT                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Gets appropriate fallback image based on context
 */
function getFallbackImage(config: FallbackConfig = { type: 'book' }): string {
  const { type, theme = 'gradient', category } = config;
  
  const fallbacks = FALLBACK_IMAGES[type];
  
  // Try category-specific fallback
  if (category && category in fallbacks) {
    const categoryFallback = fallbacks[category as keyof typeof fallbacks];
    if (typeof categoryFallback === 'string') {
      return categoryFallback;
    }
  }
  
  // Try default array
  if ('default' in fallbacks && Array.isArray(fallbacks.default)) {
    const defaultArray = fallbacks.default as string[];
    // Use a deterministic but varied selection based on category
    const index = category ? 
      Math.abs(category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % defaultArray.length : 
      0;
    return defaultArray[index];
  }
  
  // Try gradient fallback
  if (theme === 'gradient' && 'gradient' in fallbacks) {
    return fallbacks.gradient as string;
  }
  
  // Fall back to generic placeholder
  return FALLBACK_IMAGES.generic.placeholder;
}

/**
 * Creates a deterministic fallback sequence for an item
 */
function createFallbackSequence(
  seed: string | number,
  config: FallbackConfig = { type: 'book' }
): string[] {
  const sequence: string[] = [];
  
  // Convert seed to a number for deterministic selection
  const seedNum = typeof seed === 'string' 
    ? seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    : seed;
  
  const fallbacks = FALLBACK_IMAGES[config.type];
  
  // Add primary fallback based on seed
  if ('default' in fallbacks && Array.isArray(fallbacks.default)) {
    const defaultArray = fallbacks.default as string[];
    const primaryIndex = Math.abs(seedNum) % defaultArray.length;
    sequence.push(defaultArray[primaryIndex]);
    
    // Add other defaults in order (excluding primary)
    for (let i = 0; i < defaultArray.length; i++) {
      if (i !== primaryIndex) {
        sequence.push(defaultArray[i]);
      }
    }
  }
  
  // Add gradient fallback
  if ('gradient' in fallbacks) {
    sequence.push(fallbacks.gradient as string);
  }
  
  // Add generic fallback as last resort
  sequence.push(FALLBACK_IMAGES.generic.placeholder);
  
  return sequence;
}

/* -------------------------------------------------------------------------- */
/* IMAGE OPTIMIZATION & TRANSFORMATION                                        */
/* -------------------------------------------------------------------------- */

/**
 * Generates optimized image URLs for responsive images
 */
function generateOptimizedImageUrls(
  baseUrl: string,
  options: {
    widths?: number[];
    quality?: number;
    format?: typeof SUPPORTED_FORMATS[number];
    context?: keyof typeof IMAGE_OPTIMIZATION;
  } = {}
): Array<{ src: string; width: number; format: string }> {
  const { 
    widths, 
    quality, 
    format = PREFERRED_FORMAT,
    context = 'cover'
  } = options;
  
  const config = IMAGE_OPTIMIZATION[context];
  const targetWidths = widths || config.widths;
  const targetQuality = quality || config.quality;
  const targetFormats = format ? [format] : config.formats;
  
  const urls: Array<{ src: string; width: number; format: string }> = [];
  
  // Skip optimization for data URLs and SVGs
  if (baseUrl.startsWith('data:') || getFileExtension(baseUrl) === 'svg') {
    return [{ src: baseUrl, width: 0, format: getFileExtension(baseUrl) }];
  }
  
  for (const width of targetWidths) {
    for (const fmt of targetFormats) {
      // For CDN-based optimization (e.g., Cloudinary, Imgix, Next.js Image Optimization)
      // This is a placeholder - implement based on your actual CDN
      let optimizedUrl = baseUrl;
      
      if (CDN_BASE_URL && baseUrl.includes(CDN_BASE_URL)) {
        // Example: /images/photo.jpg -> /images/w_300,q_85/photo.webp
        optimizedUrl = baseUrl.replace(
          /(\.[a-z]+)$/i,
          `_w${width},q${targetQuality}.${fmt}`
        );
      }
      
      urls.push({
        src: optimizedUrl,
        width,
        format: fmt,
      });
    }
  }
  
  return urls;
}

/**
 * Calculates aspect ratio from width and height
 */
function calculateAspectRatio(
  width: number | undefined,
  height: number | undefined
): number | undefined {
  if (!width || !height || width <= 0 || height <= 0) {
    return undefined;
  }
  
  return width / height;
}

/**
 * Generates a blur placeholder for images
 */
function generateBlurDataURL(
  width: number = 20,
  height: number = 20,
  color: string = '#6B7280'
): string {
  // Simplified blur placeholder - in practice, you might want to generate
  // a proper base64 encoded image or use a service
  const canvas = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="${color}" opacity="0.2"/>
    <rect x="0" y="0" width="100%" height="100%" fill="url(#gradient)" opacity="0.5"/>
    <defs>
      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0.1"/>
      </linearGradient>
    </defs>
  </svg>`;
  
  return `data:image/svg+xml;base64,${Buffer.from(canvas).toString('base64')}`;
}

/* -------------------------------------------------------------------------- */
/* IMAGE LOADING & ERROR HANDLING                                             */
/* -------------------------------------------------------------------------- */

/**
 * Creates a robust image loading handler with fallback support
 */
function createImageLoader(
  initialUrl: string | undefined,
  fallbackConfig?: FallbackConfig,
  onError?: (error: Error, attempt: number) => void
) {
  let currentAttempt = 0;
  const maxAttempts = 3;
  let fallbackSequence: string[] = [];
  
  // Initialize fallback sequence
  if (initialUrl) {
    fallbackSequence = [initialUrl, ...createFallbackSequence(initialUrl, fallbackConfig)];
  } else if (fallbackConfig) {
    fallbackSequence = createFallbackSequence(Date.now(), fallbackConfig);
  }
  
  const loadImage = async (): Promise<{
    url: string;
    width?: number;
    height?: number;
    metadata?: Partial<ImageMetadata>;
  }> => {
    if (currentAttempt >= fallbackSequence.length) {
      throw new Error('All image loading attempts failed');
    }
    
    const url = fallbackSequence[currentAttempt];
    currentAttempt++;
    
    try {
      // For client-side loading, we could use Image object to preload
      if (typeof window !== 'undefined') {
        await new Promise((resolve, reject) => {
          const img = new window.Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
          img.src = url;
        });
      }
      
      // Return success with URL
      return { 
        url,
        metadata: {
          src: url,
          format: getFileExtension(url),
        }
      };
    } catch (error) {
      if (onError) {
        onError(error as Error, currentAttempt);
      }
      
      // Try next fallback
      if (currentAttempt < fallbackSequence.length) {
        return loadImage();
      }
      
      throw error;
    }
  };
  
  return {
    load: loadImage,
    getCurrentUrl: () => fallbackSequence[Math.min(currentAttempt, fallbackSequence.length - 1)],
    hasMoreAttempts: () => currentAttempt < fallbackSequence.length,
    reset: () => {
      currentAttempt = 0;
    },
  };
}

/**
 * Safe wrapper for Next.js Image component props
 */
function getSafeImageProps(
  image: unknown,
  alt: string = '',
  options: {
    width?: number;
    height?: number;
    priority?: boolean;
    loading?: 'lazy' | 'eager';
    fallbackConfig?: FallbackConfig;
  } = {}
): {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority: boolean;
  loading: 'lazy' | 'eager';
  blurDataURL?: string;
} {
  const {
    width,
    height,
    priority = false,
    loading = 'lazy',
    fallbackConfig = { type: 'book' },
  } = options;
  
  let src = '';
  
  // Extract src from various input types
  if (typeof image === 'string') {
    src = normalizeImageUrl(image);
  } else if (image && typeof image === 'object') {
    if ('src' in image && typeof image.src === 'string') {
      src = normalizeImageUrl(image.src);
    } else if ('url' in image && typeof image.url === 'string') {
      src = normalizeImageUrl(image.url);
    }
  }
  
  // Validate and get fallback if needed
  if (!isValidImageUrl(src)) {
    src = getFallbackImage(fallbackConfig);
  }
  
  // Generate blur placeholder for large images
  const blurDataURL = width && height && width * height > 100000 
    ? generateBlurDataURL(Math.min(20, width), Math.min(20, height), '#D1D5DB')
    : undefined;
  
  return {
    src,
    alt: safeString(alt, 'Image'),
    width: width || undefined,
    height: height || undefined,
    priority,
    loading,
    blurDataURL,
  };
}

/* -------------------------------------------------------------------------- */
/* COMPREHENSIVE EXPORTS SECTION                                             */
/* -------------------------------------------------------------------------- */

// Export all types and interfaces
export type {
  ImageMetadata,
  FallbackConfig,
  ImageValidationResult,
};

// Export all constants
export {
  CDN_BASE_URL,
  SUPPORTED_FORMATS,
  PREFERRED_FORMAT,
  IMAGE_OPTIMIZATION,
  FALLBACK_IMAGES,
};

// Export all functions
export {
  isValidImageUrl,
  getFileExtension,
  normalizeImageUrl,
  validateImageUrl,
  getFallbackImage,
  createFallbackSequence,
  generateOptimizedImageUrls,
  calculateAspectRatio,
  generateBlurDataURL,
  createImageLoader,
  getSafeImageProps,
};

// Default exports for easy importing
export default {
  // Constants
  CDN_BASE_URL,
  SUPPORTED_FORMATS,
  PREFERRED_FORMAT,
  IMAGE_OPTIMIZATION,
  FALLBACK_IMAGES,
  
  // URL handling
  isValidImageUrl,
  getFileExtension,
  normalizeImageUrl,
  validateImageUrl,
  
  // Fallback management
  getFallbackImage,
  createFallbackSequence,
  
  // Optimization
  generateOptimizedImageUrls,
  calculateAspectRatio,
  generateBlurDataURL,
  
  // Loading
  createImageLoader,
  getSafeImageProps,
};