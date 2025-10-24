// lib/hero-banners.ts
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
  overlay?: never; // (optional overlay if you use one)
};

/**
 * Standard, high-res adaptive video configuration.
 * Groups sources by format (WebM first) and then orders by resolution (highest media query first).
 */
const BRAND_REEL_SOURCES: VideoSource[] = [
  // --- WEB M / VP9 (Best quality/compression on modern browsers) ---
  { src: "/assets/video/brand-reel-2160p.webm", type: "video/webm", media: "(min-width: 1600px)" },
  { src: "/assets/video/brand-reel-1440p.webm", type: "video/webm", media: "(min-width: 1200px)" },
  { src: "/assets/video/brand-reel-1080p.webm", type: "video/webm" }, // Default WebM

  // --- MP4 / H.264 (Fallback for Safari/older browsers) ---
  { src: "/assets/video/brand-reel-2160p.mp4", type: "video/mp4", media: "(min-width: 1600px)" },
  { src: "/assets/video/brand-reel-1440p.mp4", type: "video/mp4", media: "(min-width: 1200px)" },
  { src: "/assets/video/brand-reel-1080p.mp4", type: "video/mp4" }, // Default MP4/Final Fallback
];

/** Example Banner: Full adaptive resolution sources. */
export const brandBanner: BannerConfig = {
  poster: "/assets/images/abraham-of-london-banner@2560.webp",
  heightClassName: "h-[56svh] md:h-[70svh] lg:h-[78svh]",
  mobileObjectPositionClass: "object-center",
  videoSources: BRAND_REEL_SOURCES, // Use the shared, optimized source list
};

/**
 * The primary banner used on the homepage/default views.
 * This version simplifies the sources for slightly faster client-side logic
 * by only providing the default (1080p) resolutions.
 */
export function getActiveBanner(): BannerConfig {
  return {
    poster: "/assets/images/abraham-of-london-banner@2560.webp",
    // Prioritize WebM 1080p, then fall back to MP4 1080p
    videoSources: [
      { src: "/assets/video/brand-reel-1080p.webm", type: "video/webm" },
      { src: "/assets/video/brand-reel-1080p.mp4", type: "video/mp4" },
    ],
    // shift view so the *left* of the frame is prioritized (crops the right edge)
    mobileObjectPositionClass: "object-left md:object-[30%_center] lg:object-[40%_center]",
    heightClassName: "min-h-[70svh] sm:min-h-[72svh] lg:min-h-[78svh]",
  } as const;
}