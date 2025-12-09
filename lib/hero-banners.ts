// lib/hero-banners.ts
// -----------------------------------------------------------------------------
// Central registry for hero banner configurations (no JSX here).
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
  /** Optional secondary strapline (used as eyebrow or subtitle) */
  subtitle?: string;
  /** Short descriptive copy (used as body copy under the title) */
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

// -----------------------------------------------------------------------------
// Default hero used as fallback
// -----------------------------------------------------------------------------

const DEFAULT_HERO: HeroBannerConfig = {
  key: "generic",
  route: "/",
  title: "Abraham of London",
  subtitle: "Faith · Strategy · Fatherhood",
  description:
    "Strategy, fatherhood, and marketplace leadership held together in one integrated conversation.",
  backgroundImage: "/assets/images/abraham-of-london-banner.webp",
  accent: "gold",
  primaryCta: {
    label: "Explore strategic insights",
    href: "/content",
  },
  secondaryCta: {
    label: "View downloads",
    href: "/downloads",
  },
  enabled: true,
};

// -----------------------------------------------------------------------------
// Concrete registry
// -----------------------------------------------------------------------------

export const HERO_BANNERS: HeroBannerConfig[] = [
  {
    key: "home",
    route: "/",
    title: "When the system breaks you, purpose keeps you standing.",
    subtitle: "Legacy-first thinking from London to Lagos.",
    description:
      "From board decisions to the quiet work of fatherhood, the mandate is the same: build in truth, protect what matters, and leave something worth inheriting.",
    backgroundImage: "/assets/images/abraham-of-london-banner.webp",
    accent: "gold",
    primaryCta: {
      label: "Start with the latest insight",
      href: "/content",
    },
    secondaryCta: {
      label: "See legacy tools",
      href: "/downloads",
    },
    enabled: true,
  },
  {
    key: "strategy",
    route: "/consulting",
    title: "Faith-rooted strategy for founders, boards, and builders.",
    subtitle: "Advisory & consulting",
    description:
      "Structured, accountable advisory at the intersection of strategy, governance, and character — for leaders who carry real weight.",
    backgroundImage: "/assets/images/london-skyline-gold.webp",
    accent: "neutral",
    primaryCta: {
      label: "Request a consultation",
      href: "/contact",
    },
    secondaryCta: {
      label: "View upcoming salons",
      href: "/events",
    },
    enabled: true,
  },
  {
    key: "books",
    route: "/books",
    title: "Fathering Without Fear, and other forthcoming works.",
    subtitle: "Books & manuscripts",
    description:
      "Forthcoming titles that blend story, theology, and strategy for fathers, founders, and leaders who refuse to outsource responsibility.",
    backgroundImage: "/assets/images/writing-desk.webp",
    accent: "gold",
    primaryCta: {
      label: "Preview upcoming titles",
      href: "/books",
    },
    secondaryCta: {
      label: "Download the teaser",
      href: "/downloads/Fathering_Without_Fear_Teaser-Mobile",
    },
    enabled: true,
  },
  {
    key: "downloads",
    route: "/downloads",
    title: "Legacy tools you can put on the table tonight.",
    subtitle: "Downloads & printables",
    description:
      "Covenants, liturgies, and strategic cue-cards for boardrooms, family tables, and brotherhood circles.",
    backgroundImage: "/assets/images/abraham-of-london-banner.webp",
    accent: "neutral",
    primaryCta: {
      label: "View all downloads",
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
    subtitle: "A long-term work on courage, consequence, and legacy.",
    description:
      "Rebuilding the courage to stay, lead, and bless — when legal systems, markets, and culture cut against fathers.",
    backgroundImage: "/assets/images/abraham-of-london-banner.webp",
    accent: "gold",
    primaryCta: {
      label: "Read the core essay",
      href: "/strategy/fathering-without-fear",
    },
    secondaryCta: {
      label: "Download the family altar liturgy",
      href: "/downloads/family-altar-liturgy",
    },
    enabled: true,
  },
];

// -----------------------------------------------------------------------------
// Helper: find hero by key
// -----------------------------------------------------------------------------

export function getHeroBannerByKey(
  key: HeroBannerKey | string
): HeroBannerConfig {
  const normalized = key as HeroBannerKey;
  return HERO_BANNERS.find((b) => b.key === normalized) ?? DEFAULT_HERO;
}

// Helper: find hero by route (e.g. "/books")
export function getHeroBannerForRoute(route: string): HeroBannerConfig {
  const cleanRoute = route.split("?")[0].split("#")[0] || "/";
  return (
    HERO_BANNERS.find(
      (b) => b.route && b.route.toLowerCase() === cleanRoute.toLowerCase()
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
