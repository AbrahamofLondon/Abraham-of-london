// lib/hero-banners.ts

// --- Type Definitions ---

export type VideoSource = {
  src: string;
  type: "video/webm" | "video/mp4";
  /** optional media query for this source (e.g., "(min-width: 1600px)") */
  media?: string;
};

export type BannerConfig = {
  poster: string;
  videoSources: VideoSource[];
  heightClassName?: string;
  mobileObjectPositionClass?: string;
  // Use a precise type for overlay if it's ever needed, otherwise keep 'never' for strictness
  overlay?: React.ReactNode | never; 
};

// --- Core Data & Generator Function ---

interface VideoResolution {
    id: '2160p' | '1440p' | '1080p';
    media?: string;
}

const RESOLUTIONS: VideoResolution[] = [
    // Order from largest to smallest for the <source> tag priority
    { id: '2160p', media: "(min-width: 1600px)" },
    { id: '1440p', media: "(min-width: 1200px)" },
    { id: '1080p', media: undefined }, // Default/final fallback resolution
];

const FORMATS: Array<{ type: VideoSource['type']; extension: string; }> = [
    // WebM first for modern browsers (VP9/VP8, better compression)
    { type: "video/webm", extension: "webm" },
    // MP4 second for broad compatibility (H.264 fallback)
    { type: "video/mp4", extension: "mp4" }, 
];

/**
 * Programmatically generates the full, adaptive list of video sources.
 */
function generateAdaptiveVideoSources(): VideoSource[] {
    const sources: VideoSource[] = [];

    // Prioritize formats (WebM then MP4)
    for (const format of FORMATS) {
        // Within each format, prioritize resolutions (highest media query first)
        for (const resolution of RESOLUTIONS) {
            sources.push({
                src: `/assets/video/brand-reel-${resolution.id}.${format.extension}`,
                type: format.type,
                media: resolution.media,
            });
        }
    }
    return sources;
}

/** * Standard, high-res adaptive video configuration using all resolutions.
 */
export const BRAND_REEL_SOURCES: VideoSource[] = generateAdaptiveVideoSources();

// --- Exported Banner Configurations ---

/** Example Banner: Full adaptive resolution sources. */
export const brandBanner: BannerConfig = {
  poster: "/assets/images/abraham-of-london-banner@2560.webp",
  heightClassName: "h-[56svh] md:h-[70svh] lg:h-[78svh]",
  mobileObjectPositionClass: "object-center",
  videoSources: BRAND_REEL_SOURCES, // Use the generated, optimized source list
};

/**
 * The primary banner used on the homepage/default views.
 * This function specifically returns a simplified config for potentially faster client-side logic 
 * by only providing the default (1080p) resolutions.
 */
export function getActiveBanner(): BannerConfig {
  // Filter the full list to only include 1080p sources
  const simplifiedSources = BRAND_REEL_SOURCES.filter(s => !s.media);

  return {
    poster: "/assets/images/abraham-of-london-banner@2560.webp",
    // Use the filtered list (WebM 1080p, then MP4 1080p)
    videoSources: simplifiedSources, 
    // Shift view so the *left* of the frame is prioritized (crops the right edge)
    mobileObjectPositionClass: "object-left md:object-[30%_center] lg:object-[40%_center]",
    heightClassName: "min-h-[70svh] sm:min-h-[72svh] lg:min-h-[78svh]",
  } as const;
}