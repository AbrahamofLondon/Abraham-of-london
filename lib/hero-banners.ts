// lib/hero-banners.ts
export type Banner = {
  poster: string;
  videoSources: Array<{ src: string; type: string; media?: string }>;
  overlay?: {
    eyebrow?: string;
    title?: string;
    body?: string;
    cta?: { href: string; label: string };
  };
  mobileObjectPositionClass?: string;
  heightClassName?: string;
};

const V = "/assets/video";
const poster = "/assets/images/abraham-of-london-banner@2560.webp";

const DEFAULT_BANNER: Banner = {
  poster,
  videoSources: [
    // AV1 first
    { src: `${V}/brand-reel-2160p-av1.webm`, type: "video/webm", media: "(min-width:1600px)" },
    { src: `${V}/brand-reel-1440p-av1.webm`, type: "video/webm", media: "(min-width:1100px)" },
    { src: `${V}/brand-reel-1080p-av1.webm`, type: "video/webm" },
    // VP9 fallback
    { src: `${V}/brand-reel-2160p.webm`, type: "video/webm", media: "(min-width:1600px)" },
    { src: `${V}/brand-reel-1440p.webm`, type: "video/webm", media: "(min-width:1100px)" },
    { src: `${V}/brand-reel-1080p.webm`, type: "video/webm" },
    // H.264 fallback
    { src: `${V}/brand-reel-2160p.mp4`, type: "video/mp4", media: "(min-width:1600px)" },
    { src: `${V}/brand-reel-1440p.mp4`, type: "video/mp4", media: "(min-width:1100px)" },
    { src: `${V}/brand-reel-1080p.mp4`, type: "video/mp4" },
  ],
  overlay: {
    eyebrow: "Abraham of London",
    title: "Principled Strategy. Writing that Clarifies. Ventures that Endure.",
    body: "Chatham Rooms available — discreet, off the record.",
    cta: { href: "/contact", label: "Work with me" },
  },
  mobileObjectPositionClass: "object-[50%_35%]",
  heightClassName: "h-[min(88vh,900px)] sm:h-[82vh]",
};

export function getActiveBanner(): Banner {
  return DEFAULT_BANNER;
}
