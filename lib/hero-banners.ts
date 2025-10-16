// lib/hero-banners.ts
export type VideoSource = {
  src: string;
  type: "video/webm" | "video/mp4";
  /** optional media query for this source */
  media?: string;
};

export type BannerConfig = {
  poster: string;
  videoSources: VideoSource[];
  heightClassName?: string;
  mobileObjectPositionClass?: string;
  overlay?: never; // (optional overlay if you use one)
};

const brandBanner: BannerConfig = {
  poster: "/assets/images/abraham-of-london-banner@2560.webp",
  heightClassName: "h-[56svh] md:h-[70svh] lg:h-[78svh]",
  mobileObjectPositionClass: "object-center",

  videoSources: [
    // Prefer WebM/VP9 on Chromium/Firefox
    { src: "/assets/video/brand-reel-2160p.webm", type: "video/webm", media: "(min-width: 1600px)" },
    { src: "/assets/video/brand-reel-1440p.webm", type: "video/webm", media: "(min-width: 1200px)" },
    { src: "/assets/video/brand-reel-1080p.webm", type: "video/webm" },

    // MP4/H.264 fallback (Safari, older browsers)
    { src: "/assets/video/brand-reel-2160p.mp4", type: "video/mp4", media: "(min-width: 1600px)" },
    { src: "/assets/video/brand-reel-1440p.mp4", type: "video/mp4", media: "(min-width: 1200px)" },
    { src: "/assets/video/brand-reel-1080p.mp4", type: "video/mp4" },
  ],
};

export function getActiveBanner() {
  return {
    poster: "/assets/images/abraham-of-london-banner@2560.webp",
    videoSources: [
      { src: "/assets/video/brand-reel-1080p.webm", type: "video/webm" },
      { src: "/assets/video/brand-reel-1080p.mp4", type: "video/mp4" },
    ],
    // 👇 shift view so the *left* of the frame is prioritized (crops the right edge)
    mobileObjectPositionClass: "object-left md:object-[30%_center] lg:object-[40%_center]",
    heightClassName: "min-h-[70svh] sm:min-h-[72svh] lg:min-h-[78svh]",
  } as const;
}