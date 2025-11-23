/* -------------------------------------------------------------------------- */
/* Enhanced Types & Design System                                             */
/* -------------------------------------------------------------------------- */

export type BadgeType =
  | "new"
  | "popular"
  | "featured"
  | "free"
  | "premium"
  | "exclusive";

export type LinkItem = {
  href: string;
  label: string;
  sub?: string;
  icon?: string;
  badge?: BadgeType | string;
  external?: boolean;
  priority?: number; // For sorting
  image?: string; // For visual CTAs
};

export type CTAPresetTheme =
  | "fatherhood"
  | "leadership"
  | "brotherhood"
  | "mentorship"
  | "premium"
  | "community"
  | "default";

export type CTAPreset = {
  title: string;
  description?: string;
  reads?: LinkItem[];
  downloads?: LinkItem[];
  actions?: LinkItem[];
  related?: LinkItem[];
  theme?: CTAPresetTheme;
  featured?: LinkItem;
  layout?: "grid" | "stack" | "featured-first";
  accentColor?: string;
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
/* Premium Color System                                                       */
/* -------------------------------------------------------------------------- */

export const THEME_COLORS: Record<
  CTAPresetTheme,
  {
    primary: string;
    secondary: string;
    gradient: string;
    glow: string;
  }
> = {
  fatherhood: {
    primary: "from-blue-600 to-cyan-500",
    secondary: "bg-blue-50 border-blue-200 text-blue-800",
    gradient: "bg-gradient-to-br from-blue-500/10 to-cyan-400/5",
    glow: "hover:shadow-lg hover:shadow-blue-500/20",
  },
  leadership: {
    primary: "from-amber-600 to-orange-500",
    secondary: "bg-amber-50 border-amber-200 text-amber-800",
    gradient: "bg-gradient-to-br from-amber-500/10 to-orange-400/5",
    glow: "hover:shadow-lg hover:shadow-amber-500/20",
  },
  brotherhood: {
    primary: "from-emerald-600 to-green-500",
    secondary: "bg-emerald-50 border-emerald-200 text-emerald-800",
    gradient: "bg-gradient-to-br from-emerald-500/10 to-green-400/5",
    glow: "hover:shadow-lg hover:shadow-emerald-500/20",
  },
  mentorship: {
    primary: "from-purple-600 to-indigo-500",
    secondary: "bg-purple-50 border-purple-200 text-purple-800",
    gradient: "bg-gradient-to-br from-purple-500/10 to-indigo-400/5",
    glow: "hover:shadow-lg hover:shadow-purple-500/20",
  },
  premium: {
    primary: "from-gold to-yellow-400",
    secondary: "bg-yellow-50 border-yellow-200 text-yellow-800",
    gradient: "bg-gradient-to-br from-gold/10 to-yellow-400/5",
    glow: "hover:shadow-lg hover:shadow-yellow-500/30",
  },
  community: {
    primary: "from-rose-600 to-pink-500",
    secondary: "bg-rose-50 border-rose-200 text-rose-800",
    gradient: "bg-gradient-to-br from-rose-500/10 to-pink-400/5",
    glow: "hover:shadow-lg hover:shadow-rose-500/20",
  },
  default: {
    primary: "from-slate-600 to-gray-500",
    secondary: "bg-slate-50 border-slate-200 text-slate-800",
    gradient: "bg-gradient-to-br from-slate-500/10 to-gray-400/5",
    glow: "hover:shadow-lg hover:shadow-slate-500/20",
  },
};

export type ThemeTokens = (typeof THEME_COLORS)[CTAPresetTheme];

/* -------------------------------------------------------------------------- */
/* Enhanced Preset Configuration                                              */
/* -------------------------------------------------------------------------- */

export const CTA_PRESETS: Record<CTAKey, CTAPreset> = {
  fatherhood: {
    title: "Transform Your Fatherhood Journey",
    description:
      "Proven frameworks, brotherhood support, and legacy-building tools for modern fathers committed to excellence.",
    theme: "fatherhood",
    layout: "featured-first",
    reads: [
      {
        href: "/leadership-begins-at-home",
        label: "Leadership Begins at Home",
        sub: "Lead your family with confidence and clarity",
        icon: "👑",
        badge: "popular",
        priority: 1,
      },
      {
        href: "/the-brotherhood-code",
        label: "The Brotherhood Code",
        sub: "Build your band of brothers for lifelong support",
        icon: "🤝",
        badge: "featured",
        priority: 2,
      },
      {
        href: "/reclaiming-the-narrative",
        label: "Reclaiming the Narrative",
        sub: "Court-season clarity for intentional fatherhood",
        icon: "✍️",
        priority: 3,
      },
    ],
    downloads: [
      {
        href: "/downloads/Fatherhood_Guide.pdf",
        label: "Complete Fatherhood Framework",
        sub: "Step-by-step system for modern fatherhood",
        badge: "free",
        priority: 1,
      },
      {
        href: "/downloads/Mentorship_Starter_Kit.pdf",
        label: "Mentorship Starter Kit",
        sub: "Guide to building meaningful mentorship relationships",
        priority: 2,
      },
    ],
    actions: [
      {
        href: "/brotherhood",
        label: "Join Brotherhood Community",
        sub: "Exclusive access to fatherhood circles and support",
        badge: "new",
        priority: 1,
      },
      {
        href: "/consultation",
        label: "Book Strategy Session",
        sub: "1-on-1 guidance for your unique fatherhood journey",
        priority: 2,
      },
    ],
    featured: {
      href: "/fatherhood-masterclass",
      label: "7-Day Fatherhood Transformation",
      sub: "Complete system to elevate your leadership at home",
      badge: "featured",
      priority: 0,
    },
  },

  leadership: {
    title: "Elevate Your Leadership Impact",
    description:
      "Strategic frameworks and high-level advisory for founders, directors, and men carrying significant responsibility.",
    theme: "leadership",
    layout: "grid",
    reads: [
      {
        href: "/ancient-future-leadership",
        label: "Ancient-Future Leadership",
        sub: "Timeless principles for modern strategic challenges",
        badge: "popular",
        priority: 1,
      },
      {
        href: "/decision-fatigue",
        label: "Mastering Decision Fatigue",
        sub: "Preserve cognitive capacity for high-stakes choices",
        priority: 2,
      },
    ],
    downloads: [
      {
        href: "/downloads/Leadership_Playbook.pdf",
        label: "Executive Leadership Playbook",
        sub: "Structured tools for board-level decision making",
        badge: "free",
        priority: 1,
      },
    ],
    actions: [
      {
        href: "/consulting",
        label: "Explore Strategic Advisory",
        sub: "Board-level and founder advisory services",
        priority: 1,
      },
      {
        href: "/contact",
        label: "Request Priority Consultation",
        sub: "For complex, multi-stakeholder leadership challenges",
        badge: "premium",
        priority: 2,
      },
    ],
    featured: {
      href: "/contact",
      label: "Secure Leadership Strategy Session",
      sub: "For founders, boards, and enterprise decision-makers",
      badge: "exclusive",
      priority: 0,
    },
  },

  brotherhood: {
    title: "Join Serious Men in Purposeful Community",
    description:
      "Spaces for men to think clearly, speak honestly, and sharpen one another in trusted confidence.",
    theme: "brotherhood",
    layout: "stack",
    actions: [
      {
        href: "/chatham-rooms",
        label: "Discover Chatham Rooms",
        sub: "Closed-door conversations built on absolute trust and discretion",
        badge: "featured",
        priority: 1,
      },
      {
        href: "/newsletter",
        label: "Join The Inner Circle",
        sub: "Priority invites to private gatherings and curated content",
        priority: 2,
      },
    ],
    featured: {
      href: "/chatham-rooms",
      label: "Explore Private Conversation Rooms",
      sub: "For men who need serious, discreet dialogue without posturing",
      badge: "exclusive",
      priority: 0,
    },
  },

  mentorship: {
    title: "Mentorship That Actually Changes Trajectory",
    description:
      "Structured, intentional mentoring for men who refuse to drift and want to compound wisdom across generations.",
    theme: "mentorship",
    layout: "stack",
    reads: [
      {
        href: "/mentorship-as-stewardship",
        label: "Mentorship as Stewardship",
        sub: "Why passing on wisdom is a moral duty, not a hobby",
        priority: 1,
      },
    ],
    actions: [
      {
        href: "/mentorship",
        label: "Explore Mentorship Tracks",
        sub: "Clarity calls, structured cohorts, and 1:1 options",
        badge: "premium",
        priority: 1,
      },
    ],
  },

  "free-resources": {
    title: "Start With Free, High-Value Resources",
    description:
      "No paywall. No gimmicks. Just serious, field-tested tools to help you move.",
    theme: "community",
    layout: "grid",
    downloads: [
      {
        href: "/downloads/Fatherhood_Guide.pdf",
        label: "Fatherhood Guide",
        sub: "Core principles for leading at home",
        badge: "free",
        priority: 1,
      },
      {
        href: "/downloads/Leadership_Playbook.pdf",
        label: "Leadership Playbook",
        sub: "Tactics for higher-stakes decisions",
        badge: "free",
        priority: 2,
      },
    ],
    actions: [
      {
        href: "/downloads",
        label: "Browse All Free Downloads",
        sub: "Frameworks, checklists, and field notes",
        badge: "popular",
        priority: 3,
      },
    ],
  },

  premium: {
    title: "Premium Access for Men Carrying Real Weight",
    description:
      "For fathers, founders, and directors who need more than generic motivation – they need strategic partnership.",
    theme: "premium",
    layout: "featured-first",
    actions: [
      {
        href: "/consulting",
        label: "Explore Advisory & Consulting",
        sub: "Engage at the level of your responsibility and risk",
        badge: "premium",
        priority: 1,
      },
      {
        href: "/chatham-rooms",
        label: "Apply for Chatham Rooms",
        sub: "Closed-door, off-record rooms for high-stakes men",
        badge: "exclusive",
        priority: 2,
      },
    ],
    featured: {
      href: "/contact",
      label: "Request a Private Strategy Conversation",
      sub: "For when the stakes are too high for trial-and-error",
      badge: "exclusive",
      priority: 0,
    },
  },

  community: {
    title: "Stay Connected to a Serious Community",
    description:
      "Regular touchpoints, private gatherings, and aligned men building lives that actually matter.",
    theme: "community",
    layout: "stack",
    actions: [
      {
        href: "/newsletter",
        label: "Join The Inner Circle",
        sub: "Primary channel for essays, tools, and private invites",
        badge: "featured",
        priority: 1,
      },
      {
        href: "/events",
        label: "Attend Upcoming Events",
        sub: "Workshops, salons, and closed-room conversations",
        priority: 2,
      },
    ],
  },

  newsletter: {
    title: "The Inner Circle – Curated Wisdom Delivered",
    description:
      "The only email worth opening: deep essays, exclusive tools, and early access for serious builders and leaders.",
    theme: "premium",
    layout: "stack",
    actions: [
      {
        href: "/newsletter",
        label: "Subscribe to The Inner Circle",
        sub: "Curated reflections for founders, fathers, and legacy builders",
        badge: "featured",
        priority: 1,
      },
    ],
    featured: {
      href: "/newsletter",
      label: "Join The Inner Circle Today",
      sub: "Zero spam. Clear thinking. Real stakes. Transformative impact.",
      badge: "exclusive",
      priority: 0,
    },
  },
};

/* -------------------------------------------------------------------------- */
/* Enhanced Utilities with Sorting & Filtering                                */
/* -------------------------------------------------------------------------- */

export function validatePresetKey(key: string): key is CTAKey {
  return Object.prototype.hasOwnProperty.call(CTA_PRESETS, key);
}

export function getCtaPreset(key?: string): CTAPreset | null {
  if (!key) return null;
  const normalised = String(key).trim().toLowerCase() as CTAKey;
  return CTA_PRESETS[normalised] ?? null;
}

// Sort items by priority (lower = higher priority)
export function getSortedItems(
  preset: CTAPreset,
  category: keyof CTAPreset,
): LinkItem[] {
  const items = preset[category];
  if (!Array.isArray(items)) return [];

  return [...items].sort(
    (a, b) => (a.priority ?? 999) - (b.priority ?? 999),
  );
}

export function getThemeColors(theme: CTAPresetTheme = "default"): ThemeTokens {
  return THEME_COLORS[theme];
}

// Collect all items for a preset (sorted by priority)
export function getAllPresetItems(presetKey: CTAKey): LinkItem[] {
  const preset = CTA_PRESETS[presetKey];
  if (!preset) return [];

  const allItems: LinkItem[] = [];

  if (preset.featured) {
    allItems.push({
      ...preset.featured,
      priority: preset.featured.priority ?? 0,
    });
  }

  const categories: (keyof CTAPreset)[] = [
    "reads",
    "downloads",
    "actions",
    "related",
  ];

  categories.forEach((category) => {
    const items = getSortedItems(preset, category);
    allItems.push(...items);
  });

  // Global sort by priority
  return allItems.sort(
    (a, b) => (a.priority ?? 999) - (b.priority ?? 999),
  );
}

/* -------------------------------------------------------------------------- */
/* Existing Utilities (Enhanced where needed)                                 */
/* -------------------------------------------------------------------------- */

export function getAllPresetKeys(): CTAKey[] {
  return Object.keys(CTA_PRESETS) as CTAKey[];
}

export function getPresetByTheme(
  theme: NonNullable<CTAPreset["theme"]>,
): CTAPreset[] {
  return Object.values(CTA_PRESETS).filter((p) => p.theme === theme);
}

export function getFeaturedItems(presetKey: CTAKey): LinkItem[] {
  const preset = CTA_PRESETS[presetKey];
  if (!preset) return [];

  const featured: LinkItem[] = [];
  if (preset.featured) featured.push(preset.featured);

  (["reads", "downloads", "actions", "related"] as const).forEach(
    (category) => {
      const items = preset[category];
      if (Array.isArray(items)) {
        featured.push(...items.filter((item) => Boolean(item.badge)));
      }
    },
  );

  return featured.slice(0, 4);
}

export function getAllDownloads(): LinkItem[] {
  const downloads: LinkItem[] = [];
  Object.values(CTA_PRESETS).forEach((preset) => {
    if (preset.downloads) {
      downloads.push(...preset.downloads);
    }
  });
  return downloads;
}

export function searchPresets(query: string): CTAPreset[] {
  const searchTerm = query.toLowerCase().trim();
  if (!searchTerm) return [];

  return Object.values(CTA_PRESETS).filter((preset) => {
    if (
      preset.title.toLowerCase().includes(searchTerm) ||
      preset.description?.toLowerCase().includes(searchTerm)
    ) {
      return true;
    }

    const categories: (keyof CTAPreset)[] = [
      "reads",
      "downloads",
      "actions",
      "related",
    ];

    return categories.some((category) => {
      const items = preset[category];
      if (!Array.isArray(items)) return false;

      return items.some((item) => {
        if (item.label.toLowerCase().includes(searchTerm)) return true;
        if (item.sub && item.sub.toLowerCase().includes(searchTerm)) return true;
        return false;
      });
    });
  });
}

/* -------------------------------------------------------------------------- */
/* Type Guards                                                                */
/* -------------------------------------------------------------------------- */

export function isCTAPreset(obj: unknown): obj is CTAPreset {
  if (!obj || typeof obj !== "object") return false;
  const candidate = obj as { title?: unknown };
  return typeof candidate.title === "string";
}

export function isLinkItem(obj: unknown): obj is LinkItem {
  if (!obj || typeof obj !== "object") return false;
  const candidate = obj as { href?: unknown; label?: unknown };
  return (
    typeof candidate.href === "string" &&
    typeof candidate.label === "string"
  );
}

/* -------------------------------------------------------------------------- */
/* Higher-Level Utilities                                                     */
/* -------------------------------------------------------------------------- */

export function getPresetsByCategory(
  category: keyof Omit<
    CTAPreset,
    "title" | "description" | "theme" | "featured"
  >,
): Record<CTAKey, LinkItem[]> {
  const result: Partial<Record<CTAKey, LinkItem[]>> = {};

  (Object.keys(CTA_PRESETS) as CTAKey[]).forEach((key) => {
    const items = CTA_PRESETS[key][category];
    result[key] = Array.isArray(items) ? items : [];
  });

  return result as Record<CTAKey, LinkItem[]>;
}

export function validatePresetLinks(
  presetKey: CTAKey,
): { valid: boolean; brokenLinks: string[] } {
  const preset = CTA_PRESETS[presetKey];
  if (!preset) {
    return { valid: false, brokenLinks: ["Preset not found"] };
  }

  const brokenLinks: string[] = [];
  const categories: (keyof CTAPreset)[] = [
    "reads",
    "downloads",
    "actions",
    "related",
  ];

  categories.forEach((category) => {
    const items = preset[category];
    if (!Array.isArray(items)) return;

    items.forEach((item) => {
      if (!item.href || item.href === "#") {
        brokenLinks.push(
          `${String(category)}: ${item.label} – Missing or invalid href`,
        );
      }
    });
  });

  return {
    valid: brokenLinks.length === 0,
    brokenLinks,
  };
}

export default CTA_PRESETS;