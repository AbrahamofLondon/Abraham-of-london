// lib/hero-banners.ts
// -----------------------------------------------------------------------------
// Central registry for hero banner configurations (no JSX here).
// This keeps "which hero do we show on which page?" out of components.
// -----------------------------------------------------------------------------

export type HeroBannerKey =
  | "home"
  | "strategy"
  | "books"
  | "downloads"
  | "fathering"
  | "generic";

export interface HeroBannerCta {
  label: string;
  href: string;
  external?: boolean;
}

export interface HeroBannerConfig {
  /** Unique key to reference this banner */
  key: HeroBannerKey;
  /** Optional route this banner is primarily associated with */
  route?: string;
  /** Main heading text */
  title: string;
  /** Optional secondary strapline */
  subtitle?: string;
  /** Short descriptive copy */
  description?: string;
  /** Background image path (public/…) */
  backgroundImage?: string;
  /** Optional accent token for theming */
  accent?: "gold" | "blue" | "neutral";
  /** Primary CTA */
  primaryCta?: HeroBannerCta;
  /** Secondary CTA */
  secondaryCta?: HeroBannerCta;
  /** Whether this configuration is active */
  enabled: boolean;
  /** Extra metadata bag for future use */
  meta?: Record<string, unknown>;
}

// Default hero used as fallback
const DEFAULT_HERO: HeroBannerConfig = {
  key: "generic",
  title: "Abraham of London",
  subtitle: "Faithful strategy for fathers, founders, and board-level leaders.",
  description:
    "Strategy, fatherhood, and marketplace leadership held together in one integrated conversation.",
  backgroundImage: "/assets/images/abraham-of-london-banner.webp",
  accent: "gold",
  primaryCta: {
    label: "Explore strategy thinking",
    href: "/strategy/sample-strategy",
  },
  secondaryCta: {
    label: "Preview upcoming books",
    href: "/books",
  },
  enabled: true,
};

// Concrete registry
export const HERO_BANNERS: HeroBannerConfig[] = [
  {
    key: "home",
    route: "/",
    title: "Building strategy your grandchildren will thank you for.",
    subtitle: "Legacy-first thinking from London to Lagos.",
    description:
      "From board decisions to the quiet work of fatherhood, the mandate is the same: build in truth, protect what matters, and leave something worth inheriting.",
    backgroundImage: "/assets/images/abraham-of-london-banner.webp",
    accent: "gold",
    primaryCta: {
      label: "Start with strategy",
      href: "/strategy",
    },
    secondaryCta: {
      label: "See legacy tools",
      href: "/downloads",
    },
    enabled: true,
  },
  {
    key: "strategy",
    route: "/strategy",
    title: "Strategy that honours both heaven and the balance sheet.",
    subtitle: "Advisory for boards, founders, and investors.",
    description:
      "We help you navigate complexity, de-risk decisions, and build structures that can survive storms — not just funding rounds.",
    backgroundImage: "/assets/images/abraham-of-london-banner.webp",
    accent: "neutral",
    primaryCta: {
      label: "View strategy notes",
      href: "/strategy/sample-strategy",
    },
    secondaryCta: {
      label: "Enquire about advisory",
      href: "/contact",
    },
    enabled: true,
  },
  {
    key: "books",
    route: "/books",
    title: "Fathering Without Fear & other forthcoming works.",
    subtitle: "Books for men who refuse to outsource responsibility.",
    description:
      "Explore upcoming projects that blend story, theology, and strategy for fathers, founders, and leaders.",
    backgroundImage: "/assets/images/writing-desk.webp",
    accent: "gold",
    primaryCta: {
      label: "Preview upcoming titles",
      href: "/books",
    },
    secondaryCta: {
      label: "Join the list",
      href: "/downloads/brotherhood-covenant",
    },
    enabled: true,
  },
  {
    key: "downloads",
    route: "/downloads",
    title: "Legacy tools you can put on the table tonight.",
    subtitle: "Covenants, liturgies, and strategic cue-cards.",
    description:
      "Download practical, print-ready tools for boardrooms, family tables, and brotherhood circles.",
    backgroundImage: "/assets/images/abraham-of-london-banner.webp",
    accent: "neutral",
    primaryCta: {
      label: "See all downloads",
      href: "/downloads",
    },
    secondaryCta: {
      label: "Start with the Brotherhood Starter Kit",
      href: "/resources/brotherhood-starter-kit",
    },
    enabled: true,
  },
  {
    key: "fathering",
    route: "/strategy/fathering-without-fear",
    title: "Fathering Without Fear.",
    subtitle: "Rebuilding the courage to stay, lead, and bless.",
    description:
      "A long-term project on fatherhood, legacy, and the quiet resilience required to hold your post when systems fail you.",
    backgroundImage: "/assets/images/abraham-of-london-banner.webp",
    accent: "gold",
    primaryCta: {
      label: "Read the teaser",
      href: "/strategy/fathering-without-fear",
    },
    secondaryCta: {
      label: "Download family altar liturgy",
      href: "/downloads/family-altar-liturgy",
    },
    enabled: true,
  },
];

// Helper: find hero by key
export function getHeroBannerByKey(
  key: HeroBannerKey | string,
): HeroBannerConfig {
  const normalized = key as HeroBannerKey;
  return HERO_BANNERS.find((b) => b.key === normalized) ?? DEFAULT_HERO;
}

// Helper: find hero by route (e.g. "/books")
export function getHeroBannerForRoute(route: string): HeroBannerConfig {
  const cleanRoute = route.split("?")[0].split("#")[0] || "/";
  return (
    HERO_BANNERS.find(
      (b) => b.route && b.route.toLowerCase() === cleanRoute.toLowerCase(),
    ) ?? DEFAULT_HERO
  );
}

// Explicit default export if you want simple consumption
const heroBannersApi = {
  all: HERO_BANNERS,
  getByKey: getHeroBannerByKey,
  getForRoute: getHeroBannerForRoute,
  defaultHero: DEFAULT_HERO,
};

export default heroBannersApi;