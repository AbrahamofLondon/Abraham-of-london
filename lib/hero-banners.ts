// lib/hero-banners.ts
// Typed registry of hero banner configurations (no JSX in here).

export type HeroBannerKey =
  | "default"
  | "strategy"
  | "fatherhood"
  | "ventures"
  | "downloads";

export interface HeroBannerCta {
  href: string;
  label: string;
}

export interface HeroBannerConfig {
  key: HeroBannerKey;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  overlay?: "dark" | "light" | "none";
  primaryCta?: HeroBannerCta;
  secondaryCta?: HeroBannerCta;
  tags?: string[];
}

/**
 * Central hero banner registry.
 * Images assume your existing assets under /public/assets/images.
 */
const HERO_BANNERS: Record<HeroBannerKey, HeroBannerConfig> = {
  default: {
    key: "default",
    title: "Abraham of London",
    subtitle: "Faithful strategy for fathers, founders, and boards.",
    description:
      "One life, many mandates: boardroom strategy, fatherhood, and legacy-building integrated under a single calling.",
    image: "/assets/images/abraham-of-london-banner.webp",
    overlay: "dark",
    primaryCta: {
      href: "/strategy",
      label: "Explore strategy thinking",
    },
    secondaryCta: {
      href: "/downloads",
      label: "Legacy tools & downloads",
    },
    tags: ["London", "Strategy", "Legacy"],
  },

  strategy: {
    key: "strategy",
    title: "Strategy for real-world complexity",
    subtitle: "Africa, London, and the boardroom.",
    description:
      "From infrastructure to family governance, the work is the same: cut through noise, define reality, and build what lasts.",
    image: "/assets/images/abraham-of-london-banner.webp",
    overlay: "dark",
    primaryCta: {
      href: "/strategy",
      label: "View strategy pieces",
    },
    secondaryCta: {
      href: "/ventures",
      label: "See current ventures",
    },
    tags: ["Markets", "Governance", "Execution"],
  },

  fatherhood: {
    key: "fatherhood",
    title: "Fathering Without Fear",
    subtitle: "Rewriting the story they thought they knew.",
    description:
      "A movement for men who refuse to outsource their responsibilities — fathers who build altars, not just careers.",
    image: "/assets/images/writing-desk.webp",
    overlay: "dark",
    primaryCta: {
      href: "/resources/brotherhood-starter-kit",
      label: "Start with the Brotherhood kit",
    },
    secondaryCta: {
      href: "/downloads",
      label: "Download liturgies & covenants",
    },
    tags: ["Fatherhood", "Legacy", "Brotherhood"],
  },

  ventures: {
    key: "ventures",
    title: "Ventures with a mandate",
    subtitle: "Alomarada, EndureLuxe, InfraNova Africa.",
    description:
      "Every venture sits under a single thesis: build resilient systems that honour truth, create value, and serve generations.",
    image: "/assets/images/abraham-of-london-banner.webp",
    overlay: "dark",
    primaryCta: {
      href: "/ventures",
      label: "Explore ventures",
    },
    secondaryCta: {
      href: "/contact",
      label: "Discuss collaboration",
    },
    tags: ["Alomarada", "EndureLuxe", "InfraNova"],
  },

  downloads: {
    key: "downloads",
    title: "Working tools for serious builders",
    subtitle: "Templates, liturgies, and operating packs.",
    description:
      "Not theory for theory’s sake — practical downloads you can print, use, and revisit with your board or your family.",
    image: "/assets/images/writing-desk.webp",
    overlay: "dark",
    primaryCta: {
      href: "/downloads",
      label: "Browse downloads",
    },
    secondaryCta: {
      href: "/content",
      label: "View unified content index",
    },
    tags: ["Tools", "Templates", "Operations"],
  },
};

/**
 * Get a specific hero banner by key.
 * Falls back to "default" if the key is unknown.
 */
export function getHeroBanner(
  key?: HeroBannerKey | null,
): HeroBannerConfig {
  if (key && HERO_BANNERS[key]) {
    return HERO_BANNERS[key];
  }
  return HERO_BANNERS.default;
}

/**
 * List all configured hero banners.
 */
export function listHeroBanners(): HeroBannerConfig[] {
  return Object.values(HERO_BANNERS);
}