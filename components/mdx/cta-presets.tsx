/* components/mdx/cta-presets.tsx - RECONCILED INSTITUTIONAL VERSION */
import * as React from "react";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type ThemeName = "default" | "premium" | "exclusive" | "light" | "dark";

export type Badge = "new" | "popular" | "featured" | "free" | "premium" | "exclusive";

export type LinkItem = {
  href: string;
  label: string;
  sub?: string;
  badge?: Badge | string;
  priority?: number;
  external?: boolean;
  icon?: React.ReactNode;
};

export type CTAPreset = {
  title: string;
  description?: string;
  theme?: ThemeName;
  layout?: "grid" | "stack" | "featured-first";
  featured?: LinkItem;
  reads?: LinkItem[];
  downloads?: LinkItem[];
  actions?: LinkItem[];
  related?: LinkItem[];
};

export type ThemeTokens = {
  gradient: string;
  primary: string;
  glow: string;
};

export type CTAKey =
  | "fatherhood"
  | "leadership"
  | "brotherhood"
  | "mentorship"
  | "free-resources"
  | "premium"
  | "community"
  | "newsletter";

/* -------------------------------------------------------------------------- */
/* Registry                                                                   */
/* -------------------------------------------------------------------------- */

export const CTA_PRESETS: Record<CTAKey, CTAPreset> = {
  fatherhood: {
    title: "Fatherhood",
    description: "Tools, essays, and frameworks for present fathers.",
    theme: "default",
    layout: "grid",
    actions: [
      { href: "/canon", label: "Explore The Canon", sub: "Foundations, governance, formation", priority: 1 },
      { href: "/shorts", label: "Read Shorts", sub: "3-minute convictions", priority: 2 },
    ],
  },
  leadership: {
    title: "Leadership",
    description: "Strategic thinking with moral weight.",
    theme: "premium",
    layout: "grid",
    actions: [
      { href: "/strategy", label: "Strategic Frameworks", sub: "Operating systems for builders", priority: 1 },
      { href: "/resources", label: "Resource Library", sub: "Battle-tested tools", priority: 2 },
    ],
  },
  brotherhood: {
    title: "Brotherhood",
    description: "Strength through shared discipline and duty.",
    theme: "default",
    layout: "stack",
    actions: [
      { href: "/inner-circle", label: "Join The Inner Circle", sub: "Private invites + tools", badge: "featured", priority: 1 },
    ],
  },
  mentorship: {
    title: "Mentorship",
    description: "Guidance for builders who take responsibility seriously.",
    theme: "default",
    layout: "grid",
    actions: [
      { href: "/contact", label: "Request Mentorship", sub: "If you're serious, reach out", priority: 1 },
    ],
  },
  "free-resources": {
    title: "Free Resources",
    description: "Start here. No gimmicks. No fluff.",
    theme: "light",
    layout: "grid",
    downloads: [
      { href: "/downloads", label: "Browse Downloads", sub: "Templates, worksheets, cue cards", badge: "free", priority: 1 },
    ],
  },
  premium: {
    title: "Premium",
    description: "For builders who want leverage, not noise.",
    theme: "premium",
    layout: "featured-first",
    featured: {
      href: "/inner-circle",
      label: "Join The Inner Circle",
      sub: "Primary channel for essays, tools, and private invites",
      badge: "featured",
      priority: 0,
    },
    actions: [
      { href: "/events", label: "Attend Upcoming Events", sub: "Workshops, salons, and closed-room conversations", priority: 1 },
    ],
  },
  community: {
    title: "Community",
    description: "Gathering without compromise.",
    theme: "default",
    layout: "stack",
    actions: [
      { href: "/events", label: "See Events", sub: "Meet in rooms that matter", priority: 1 },
      { href: "/inner-circle", label: "Inner Circle", sub: "Private channel", badge: "featured", priority: 2 },
    ],
  },
  newsletter: {
    title: "The Inner Circle",
    description: "Deep essays, exclusive tools, and early access for serious builders.",
    theme: "premium",
    layout: "stack",
    featured: {
      href: "/newsletter",
      label: "Join The Inner Circle Today",
      sub: "Clear thinking. Real stakes. Transformative impact.",
      badge: "exclusive",
      priority: 0,
    },
  },
} as const;

/* -------------------------------------------------------------------------- */
/* Utilities & Exports                                                        */
/* -------------------------------------------------------------------------- */

export function validatePresetKey(key: string): key is CTAKey {
  return Object.prototype.hasOwnProperty.call(CTA_PRESETS, key);
}

export function getCtaPreset(key?: string): CTAPreset | null {
  if (!key) return null;
  const normalised = String(key).trim().toLowerCase();
  if (!validatePresetKey(normalised)) return null;
  return CTA_PRESETS[normalised];
}

/**
 * RESTORED: Required by CtaPresetComponent.tsx
 */
export function getSortedItems(
  preset: CTAPreset,
  bucket: "reads" | "downloads" | "actions" | "related"
): LinkItem[] {
  const list = preset[bucket] ?? [];
  return [...list].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
}

/**
 * RESTORED: Required by search hooks
 */
export function searchPresets(query: string): (CTAPreset & { id: string })[] {
  const q = query.toLowerCase();
  return Object.entries(CTA_PRESETS)
    .filter(([key, preset]) => 
      key.includes(q) || 
      preset.title.toLowerCase().includes(q) || 
      preset.description?.toLowerCase().includes(q)
    )
    .map(([id, preset]) => ({ ...preset, id }));
}

/**
 * RESTORED: Required by featured components
 */
export function getFeaturedItems(key: CTAKey): LinkItem[] {
  const preset = CTA_PRESETS[key];
  if (!preset || !preset.featured) return [];
  return [preset.featured];
}

export function getThemeColors(theme: ThemeName = "default"): ThemeTokens {
  switch (theme) {
    case "premium":
      return {
        gradient: "bg-gradient-to-br from-amber-50 to-white",
        primary: "from-amber-500 to-yellow-400",
        glow: "hover:shadow-[0_10px_30px_rgba(217,171,74,0.25)]",
      };
    case "exclusive":
      return {
        gradient: "bg-gradient-to-br from-black to-zinc-900",
        primary: "from-amber-500 to-yellow-400",
        glow: "hover:shadow-[0_10px_30px_rgba(217,171,74,0.35)]",
      };
    default:
      return {
        gradient: "bg-gradient-to-br from-white to-gray-50",
        primary: "from-slate-700 to-slate-900",
        glow: "hover:shadow-[0_10px_30px_rgba(0,0,0,0.10)]",
      };
  }
}

// Canonical Exports
export const ctaPresets = CTA_PRESETS;
export default CTA_PRESETS;