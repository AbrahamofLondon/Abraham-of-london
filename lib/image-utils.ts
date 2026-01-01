// lib/image-utils.ts
import { safeString } from "./utils";

/* -------------------------------------------------------------------------- */
/* TYPES & INTERFACES                                                         */
/* -------------------------------------------------------------------------- */

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
  type: "book" | "post" | "avatar" | "project";
  theme?: "light" | "dark" | "gradient";
  category?: string;
}

interface ImageValidationResult {
  isValid: boolean;
  reason?:
    | "invalid-url"
    | "missing-protocol"
    | "unsupported-format"
    | "size-too-large";
  suggestedFix?: string;
}

/* -------------------------------------------------------------------------- */
/* CONSTANTS & CONFIGURATION                                                  */
/* -------------------------------------------------------------------------- */

const CDN_BASE_URL =
  process.env.NEXT_PUBLIC_CDN_URL || "https://cdn.abrahamoflondon.org";

const SUPPORTED_FORMATS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "avif",
  "gif",
  "svg",
] as const;

type SupportedFormat = (typeof SUPPORTED_FORMATS)[number];

const PREFERRED_FORMAT: SupportedFormat = "webp";

// ✅ FIXED: Use mutable array types instead of readonly arrays
interface ImageConfig {
  widths: number[];
  quality: number;
  formats: SupportedFormat[];
}

const IMAGE_OPTIMIZATION: Record<string, ImageConfig> = {
  cover: {
    widths: [320, 640, 768, 1024, 1280, 1536, 1920],
    quality: 85,
    formats: ["webp", "jpg"],
  },
  thumbnail: {
    widths: [100, 200, 300, 400],
    quality: 75,
    formats: ["webp"],
  },
  avatar: {
    widths: [32, 64, 128, 256],
    quality: 90,
    formats: ["webp"],
  },
};

const FALLBACK_IMAGES = {
  book: {
    default: [
      "/assets/images/books/default-cover-1.webp",
      "/assets/images/books/default-cover-2.webp",
      "/assets/images/books/default-cover-3.webp",
    ],
    fiction: "/assets/images/books/fallback-fiction.webp",
    nonFiction: "/assets/images/books/fallback-nonfiction.webp",
    philosophy: "/assets/images/books/fallback-philosophy.webp",
    business: "/assets/images/books/fallback-business.webp",
    gradient: "/assets/images/gradients/book-gradient-1.svg",
  },

  post: {
    default: [
      "/assets/images/posts/default-1.webp",
      "/assets/images/posts/default-2.webp",
      "/assets/images/posts/default-3.webp",
    ],
    essay: "/assets/images/posts/essay-default.webp",
    article: "/assets/images/posts/article-default.webp",
    thought: "/assets/images/posts/thought-default.webp",
    gradient: "/assets/images/gradients/post-gradient-1.svg",
  },

  project: {
    default: "/assets/images/projects/default-project.webp",
    active: "/assets/images/projects/active-project.webp",
    archived: "/assets/images/projects/archived-project.webp",
    gradient: "/assets/images/gradients/project-gradient-1.svg",
  },

  avatar: {
    default: "/assets/images/avatars/default-avatar.webp",
    author: "/assets/images/avatars/author-avatar.webp",
    guest: "/assets/images/avatars/guest-avatar.webp",
    gradient: "/assets/images/gradients/avatar-gradient-1.svg",
  },

  generic: {
    placeholder: "/assets/images/placeholder.webp",
    gradient: {
      light: "/assets/images/gradients/light-gradient.svg",
      dark: "/assets/images/gradients/dark-gradient.svg",
      gold: "/assets/images/gradients/gold-gradient.svg",
      forest: "/assets/images/gradients/forest-gradient.svg",
    },
  },
} as const;

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function getFileExtension(path: string): string {
  const fileName = path.split("/").pop() || "";
  const extension = fileName.split(".").pop() || "";
  return extension.toLowerCase();
}

function toBase64(str: string): string {
  // Safe for both Node and browser
  if (typeof window === "undefined") {
    // Node.js runtime
    // eslint-disable-next-line no-undef
    return Buffer.from(str).toString("base64");
  }
  // Browser runtime
  return window.btoa(unescape(encodeURIComponent(str)));
}

/* -------------------------------------------------------------------------- */
/* URL VALIDATION & NORMALIZATION                                             */
/* -------------------------------------------------------------------------- */

function isValidImageUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== "string" || url.trim() === "") {
    return false;
  }

  const trimmedUrl = url.trim();

  // Data URL
  if (trimmedUrl.startsWith("data:")) {
    return trimmedUrl.startsWith("data:image/");
  }

  // Local path
  if (trimmedUrl.startsWith("/")) {
    return true;
  }

  // External URL
  try {
    const parsed = new URL(trimmedUrl);
    const ext = getFileExtension(parsed.pathname).toLowerCase() as
      | SupportedFormat
      | "";
    return (SUPPORTED_FORMATS as readonly string[]).includes(ext);
  } catch {
    return false;
  }
}

function normalizeImageUrl(
  url: string | undefined | null,
  options: {
    baseUrl?: string;
    forceHttps?: boolean;
    addCdnPrefix?: boolean;
  } = {}
): string {
  if (!url || typeof url !== "string" || url.trim() === "") {
    return "";
  }

  const { baseUrl = "", forceHttps = true, addCdnPrefix = false } = options;
  let normalized = url.trim();

  // Data URLs
  if (normalized.startsWith("data:")) {
    return normalized;
  }

  // Local paths
  if (normalized.startsWith("/")) {
    if (baseUrl && !normalized.startsWith(baseUrl)) {
      normalized = `${baseUrl.replace(/\/$/, "")}${normalized}`;
    }
  } else if (
    !normalized.startsWith("http://") &&
    !normalized.startsWith("https://")
  ) {
    // Relative path without leading slash
    normalized = `/${normalized}`;
    if (baseUrl) {
      normalized = `${baseUrl.replace(/\/$/, "")}${normalized}`;
    }
  }

  if (forceHttps && normalized.startsWith("http://")) {
    normalized = normalized.replace("http://", "https://");
  }

  if (addCdnPrefix && CDN_BASE_URL && !normalized.includes(CDN_BASE_URL)) {
    if (normalized.startsWith("/")) {
      normalized = `${CDN_BASE_URL}${normalized}`;
    } else if (normalized.startsWith("http")) {
      // Already absolute - leave it
    } else {
      normalized = `${CDN_BASE_URL}/${normalized}`;
    }
  }

  return normalized;
}

function validateImageUrl(url: string | null | undefined): ImageValidationResult {
  if (!url) {
    return { isValid: false, reason: "invalid-url" };
  }

  if (!isValidImageUrl(url)) {
    return { isValid: false, reason: "unsupported-format" };
  }

  if (url.startsWith("http://")) {
    return {
      isValid: true,
      reason: "missing-protocol",
      suggestedFix: url.replace("http://", "https://"),
    };
  }

  return { isValid: true };
}

/* -------------------------------------------------------------------------- */
/* FALLBACK IMAGE MANAGEMENT                                                  */
/* -------------------------------------------------------------------------- */

function getFallbackImage(config: FallbackConfig = { type: "book" }): string {
  const { type, theme = "gradient", category } = config;
  const fallbacks = FALLBACK_IMAGES[type];

  // Category-specific
  if (category && category in fallbacks) {
    const categoryFallback =
      fallbacks[category as keyof (typeof fallbacks)];
    if (typeof categoryFallback === "string") {
      return categoryFallback;
    }
  }

  // Default array
  if ("default" in fallbacks && Array.isArray(fallbacks.default)) {
    const defaultArray = fallbacks.default as string[];
    if (defaultArray.length === 0) {
      return FALLBACK_IMAGES.generic.placeholder;
    }
    
    const index = category
      ? Math.abs(
          category
            .split("")
            .reduce((acc, char) => acc + char.charCodeAt(0), 0)
        ) % defaultArray.length
      : 0;
    
    // Safe array access with fallback
    const selected = defaultArray[index];
    return selected ?? defaultArray[0] ?? FALLBACK_IMAGES.generic.placeholder;
  }

  // Gradient
  if (theme === "gradient" && "gradient" in fallbacks) {
    return fallbacks.gradient as string;
  }

  // Generic placeholder
  return FALLBACK_IMAGES.generic.placeholder;
}

function createFallbackSequence(
  seed: string | number,
  config: FallbackConfig = { type: "book" }
): string[] {
  const sequence: string[] = [];
  const seedNum =
    typeof seed === "string"
      ? seed
          .split("")
          .reduce((acc, char) => acc + char.charCodeAt(0), 0)
      : seed;

  const fallbacks = FALLBACK_IMAGES[config.type];

  if ("default" in fallbacks && Array.isArray(fallbacks.default)) {
    const defaultArray = fallbacks.default as string[];
    
    if (defaultArray.length > 0) {
      const primaryIndex = Math.abs(seedNum) % defaultArray.length;
      const primaryImage = defaultArray[primaryIndex];
      
      if (primaryImage) {
        sequence.push(primaryImage);
      }

      for (let i = 0; i < defaultArray.length; i += 1) {
        if (i !== primaryIndex) {
          const image = defaultArray[i];
          if (image) {
            sequence.push(image);
          }
        }
      }
    }
  }

  if ("gradient" in fallbacks) {
    sequence.push(fallbacks.gradient as string);
  }

  sequence.push(FALLBACK_IMAGES.generic.placeholder);

  return sequence;
}

/* -------------------------------------------------------------------------- */
/* IMAGE OPTIMIZATION & TRANSFORMATION                                        */
/* -------------------------------------------------------------------------- */

function generateOptimizedImageUrls(
  baseUrl: string,
  options: {
    widths?: number[];
    quality?: number;
    format?: SupportedFormat;
    context?: keyof typeof IMAGE_OPTIMIZATION;
  } = {}
): Array<{ src: string; width: number; format: string }> {
  const {
    widths,
    quality,
    format = PREFERRED_FORMAT,
    context = "cover",
  } = options;

  const config = IMAGE_OPTIMIZATION[context]!;
  const targetWidths = widths || config.widths;
  const targetQuality = quality || config.quality;
  const targetFormats: SupportedFormat[] =
    format != null ? [format] : config.formats;

  const urls: Array<{ src: string; width: number; format: string }> = [];

  if (baseUrl.startsWith("data:") || getFileExtension(baseUrl) === "svg") {
    return [
      {
        src: baseUrl,
        width: 0,
        format: getFileExtension(baseUrl),
      },
    ];
  }

  for (const width of targetWidths) {
    for (const fmt of targetFormats) {
      let optimizedUrl = baseUrl;

      if (CDN_BASE_URL && baseUrl.includes(CDN_BASE_URL)) {
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

function calculateAspectRatio(
  width: number | undefined,
  height: number | undefined
): number | undefined {
  if (!width || !height || width <= 0 || height <= 0) return undefined;
  return width / height;
}

function generateBlurDataURL(
  width: number = 20,
  height: number = 20,
  color: string = "#6B7280"
): string {
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

  const base64 = toBase64(canvas);
  return `data:image/svg+xml;base64,${base64}`;
}

/* -------------------------------------------------------------------------- */
/* IMAGE LOADING & ERROR HANDLING                                             */
/* -------------------------------------------------------------------------- */

function createImageLoader(
  initialUrl: string | undefined,
  fallbackConfig?: FallbackConfig,
  onError?: (error: Error, attempt: number) => void
) {
  let currentAttempt = 0;
  const fallbackSequence: string[] = [];

  if (initialUrl) {
    fallbackSequence.push(initialUrl, ...createFallbackSequence(initialUrl, fallbackConfig));
  } else if (fallbackConfig) {
    fallbackSequence.push(
      ...createFallbackSequence(Date.now(), fallbackConfig)
    );
  }

  const loadImage = async (): Promise<{
    url: string;
    width?: number;
    height?: number;
    metadata?: Partial<ImageMetadata>;
  }> => {
    if (currentAttempt >= fallbackSequence.length) {
      throw new Error("All image loading attempts failed");
    }

    const url = fallbackSequence[currentAttempt];
    if (!url) {
      throw new Error("Invalid fallback URL");
    }
    
    currentAttempt += 1;

    try {
      if (typeof window !== "undefined") {
        await new Promise<void>((resolve, reject) => {
          const img = new window.Image();
          img.onload = () => resolve();
          img.onerror = () =>
            reject(new Error(`Failed to load image: ${url}`));
          img.src = url;
        });
      }

      return {
        url,
        metadata: {
          src: url,
          format: getFileExtension(url),
        },
      };
    } catch (error) {
      if (onError) {
        onError(error as Error, currentAttempt);
      }

      if (currentAttempt < fallbackSequence.length) {
        return loadImage();
      }

      throw error;
    }
  };

  return {
    load: loadImage,
    getCurrentUrl: () => {
      const index = Math.min(currentAttempt, Math.max(fallbackSequence.length - 1, 0));
      return fallbackSequence[index] ?? FALLBACK_IMAGES.generic.placeholder;
    },
    hasMoreAttempts: () => currentAttempt < fallbackSequence.length,
    reset: () => {
      currentAttempt = 0;
    },
  };
}

/* -------------------------------------------------------------------------- */
/* SAFE IMAGE PROPS FOR NEXT/IMAGE                                            */
/* -------------------------------------------------------------------------- */

function getSafeImageProps(
  image: unknown,
  alt: string = "",
  options: {
    width?: number;
    height?: number;
    priority?: boolean;
    loading?: "lazy" | "eager";
    fallbackConfig?: FallbackConfig;
  } = {}
): {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority: boolean;
  loading: "lazy" | "eager";
  blurDataURL?: string;
} {
  const {
    width,
    height,
    priority = false,
    loading = "lazy",
    fallbackConfig = { type: "book" },
  } = options;

  let src = "";

  if (typeof image === "string") {
    src = normalizeImageUrl(image);
  } else if (image && typeof image === "object") {
    const imgObj = image as { src?: unknown; url?: unknown };
    if (typeof imgObj.src === "string") {
      src = normalizeImageUrl(imgObj.src);
    } else if (typeof imgObj.url === "string") {
      src = normalizeImageUrl(imgObj.url);
    }
  }

  if (!isValidImageUrl(src)) {
    src = getFallbackImage(fallbackConfig);
  }

  const blurDataURL =
    width && height && width * height > 100_000
      ? generateBlurDataURL(
          Math.min(20, width),
          Math.min(20, height),
          "#D1D5DB"
        )
      : undefined;

  return {
    src,
    alt: safeString(alt, "Image"),
    width: width || undefined,
    height: height || undefined,
    priority,
    loading,
    blurDataURL,
  };
}

/* -------------------------------------------------------------------------- */
/* EXPORTS                                                                    */
/* -------------------------------------------------------------------------- */

export type { ImageMetadata, FallbackConfig, ImageValidationResult };

export {
  CDN_BASE_URL,
  SUPPORTED_FORMATS,
  PREFERRED_FORMAT,
  IMAGE_OPTIMIZATION,
  FALLBACK_IMAGES,
};

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

export default {
  CDN_BASE_URL,
  SUPPORTED_FORMATS,
  PREFERRED_FORMAT,
  IMAGE_OPTIMIZATION,
  FALLBACK_IMAGES,
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