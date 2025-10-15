// lib/hero-banners.ts
export type VideoSource = { src: string; type: string };

export type BannerOverlay = {
  eyebrow?: string;
  title?: string;
  body?: string;
  cta?: { href: string; label: string };
};

export type BannerDefinition = {
  poster: string;
  videoSources?: VideoSource[];
  mobileObjectPositionClass?: string;
  heightClassName?: string;
  overlay?: BannerOverlay;
};

export const HERO_BANNERS = {
  home: {
    poster: "/assets/images/abraham-of-london-banner.webp",
    videoSources: [
      { src: "/assets/video/brand-reel.webm", type: "video/webm" },
      { src: "/assets/video/brand-reel.mp4", type: "video/mp4" },
    ],
    mobileObjectPositionClass: "object-[50%_45%] md:object-center",
    heightClassName: "h-[56svh] md:h-[72svh] lg:h-[78svh]",
    overlay: {
      eyebrow: "Abraham of London",
      title: "Clarity. Standards. Legacy.",
      body:
        "Strategy, writing, and ventures—prioritising signal over noise. Chatham Rooms available for off-the-record counsel.",
      cta: { href: "/contact", label: "Enquire" },
    },
  },
} as const satisfies Record<string, BannerDefinition>;

/** Simple selector today; easy to extend with time-based rotation or A/B flags later. */
export function getActiveBanner(): BannerDefinition {
  return HERO_BANNERS.home;
}

export default HERO_BANNERS;
