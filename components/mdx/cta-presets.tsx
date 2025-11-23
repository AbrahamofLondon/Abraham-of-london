// components/mdx/cta-presets.ts

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type BadgeType = "new" | "popular" | "featured" | "free" | "premium";

export type LinkItem = {
  href: string;
  label: string;
  sub?: string;
  icon?: string; // typically emoji or short symbol
  badge?: BadgeType | string;
  external?: boolean;
};

export type CTAPresetTheme =
  | "fatherhood"
  | "leadership"
  | "brotherhood"
  | "mentorship"
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
/* Preset Configuration                                                       */
/* -------------------------------------------------------------------------- */

export const CTA_PRESETS: Record<CTAKey, CTAPreset> = {
  fatherhood: {
    title: "Explore Fatherhood Resources",
    description:
      "Transform your fatherhood journey with proven frameworks and brotherhood support.",
    theme: "fatherhood",
    reads: [
      {
        href: "/leadership-begins-at-home",
        label: "Leadership Begins at Home",
        sub: "Lead from the inside out.",
        icon: "🏠",
        badge: "popular",
      },
      {
        href: "/the-brotherhood-code",
        label: "The Brotherhood Code",
        sub: "Build your band of brothers.",
        icon: "🤝",
        badge: "featured",
      },
      {
        href: "/reclaiming-the-narrative",
        label: "Reclaiming the Narrative",
        sub: "Court-season clarity.",
        icon: "✍️",
      },
    ],
    downloads: [
      {
        href: "/downloads/Fatherhood_Guide.pdf",
        label: "Fatherhood Guide",
        sub: "Complete framework for modern fathers.",
        badge: "free",
      },
      {
        href: "/downloads/Mentorship_Starter_Kit.pdf",
        label: "Mentorship Starter Kit",
        sub: "Step-by-step mentorship framework.",
      },
    ],
    actions: [
      {
        href: "/brotherhood",
        label: "Join Brotherhood",
        sub: "Exclusive community access.",
        badge: "new",
      },
      {
        href: "/consultation",
        label: "Book Consultation",
        sub: "1-on-1 guidance session.",
      },
    ],
    related: [
      {
        href: "/content",
        label: "Fatherhood essays",
        sub: "Long-form reflections on duty and consequence.",
      },
    ],
    featured: {
      href: "/fatherhood-masterclass",
      label: "Fatherhood Masterclass",
      sub: "7-day transformative program.",
    },
  },

  leadership: {
    title: "Leadership & Strategy",
    description:
      "Leadership thinking for founders, directors, and men who carry responsibility for others.",
    theme: "leadership",
    reads: [
      {
        href: "/content",
        label: "Leadership Essays",
        sub: "Strategy, governance, and the burden of decision-making.",
        badge: "popular",
      },
    ],
    downloads: [
      {
        href: "/downloads/Leadership_Playbook.pdf",
        label: "Leadership Playbook",
        sub: "Structured tools for high-stakes decisions.",
        badge: "free",
      },
    ],
    actions: [
      {
        href: "/consulting",
        label: "Explore Consulting",
        sub: "Board-level and founder advisory.",
      },
      {
        href: "/contact",
        label: "Request Strategic Advisory",
        sub: "Outline your context, objectives, and time horizon.",
        badge: "premium",
      },
    ],
    related: [
      {
        href: "/events",
        label: "Leadership Workshops & Salons",
        sub: "Closed-door conversations for serious operators.",
      },
    ],
    featured: {
      href: "/contact",
      label: "Secure a Leadership Conversation",
      sub: "For founders, boards, and decision-makers.",
      badge: "featured",
    },
  },

  brotherhood: {
    title: "Brotherhood & Community",
    description:
      "Spaces for men to think clearly, speak honestly, and sharpen one another.",
    theme: "brotherhood",
    reads: [
      {
        href: "/content",
        label: "Community & Culture Essays",
        sub: "On friendship, loyalty, and standing firm in a soft age.",
      },
    ],
    actions: [
      {
        href: "/chatham-rooms",
        label: "Discover Chatham Rooms",
        sub: "Closed-door conversations built on trust and confidentiality.",
        badge: "featured",
      },
      {
        href: "/newsletter",
        label: "Join The Inner Circle",
        sub: "Invites to private rooms and small gatherings.",
      },
    ],
    related: [
      {
        href: "/events",
        label: "Brotherhood Gatherings",
        sub: "Salons, circles, and small tables.",
      },
    ],
    featured: {
      href: "/chatham-rooms",
      label: "Explore Chatham Rooms",
      sub: "For men who need serious, discreet conversation.",
      badge: "featured",
    },
  },

  mentorship: {
    title: "Mentorship & Guidance",
    description:
      "Structured support for men navigating leadership, fatherhood, and calling.",
    theme: "mentorship",
    reads: [
      {
        href: "/content",
        label: "Mentorship Reflections",
        sub: "Lessons learned the hard way, shared plainly.",
      },
    ],
    actions: [
      {
        href: "/contact",
        label: "Enquire About Mentorship",
        sub: "Share context, objectives, and your commitment.",
        badge: "premium",
      },
    ],
    related: [
      {
        href: "/events",
        label: "Mentorship Circles",
        sub: "Small, high-trust cohorts for shared growth.",
      },
    ],
    featured: {
      href: "/contact",
      label: "Request a Mentorship Conversation",
      sub: "Serious enquiries only; clarity over volume.",
      badge: "featured",
    },
  },

  "free-resources": {
    title: "Free Resources",
    description:
      "Downloadable tools, prompts, and frameworks you can put to work immediately.",
    theme: "default",
    downloads: [
      {
        href: "/downloads",
        label: "All Free Downloads",
        sub: "Fatherhood frameworks, founder tools, and leadership prompts.",
        badge: "free",
      },
    ],
    actions: [
      {
        href: "/newsletter",
        label: "Get New Tools First",
        sub: "Priority access to fresh resources and printables.",
        badge: "popular",
      },
    ],
    featured: {
      href: "/downloads",
      label: "Browse Free Downloads",
      sub: "Start with what you can act on this week.",
      badge: "featured",
    },
  },

  premium: {
    title: "Premium Advisory & Experiences",
    description:
      "Deep work, private rooms, and bespoke advisory for leaders with real stakes.",
    theme: "leadership",
    reads: [
      {
        href: "/ventures",
        label: "Ventures & Platforms",
        sub: "Alomarada, InnovateHub, Endureluxe and more.",
      },
    ],
    actions: [
      {
        href: "/consulting",
        label: "Consulting & Board Support",
        sub: "Structured engagements with clear outcomes.",
        badge: "premium",
      },
      {
        href: "/contact",
        label: "Strategic Advisory Enquiry",
        sub: "For complex, multi-stakeholder, or cross-border matters.",
      },
    ],
    featured: {
      href: "/contact",
      label: "Secure Premium Advisory",
      sub: "Outline mandate, governance, and decision authority.",
      badge: "premium",
    },
  },

  community: {
    title: "Community & Gatherings",
    description:
      "Salons, workshops, and quiet rooms for people who care about truth, duty, and legacy.",
    theme: "brotherhood",
    reads: [
      {
        href: "/content",
        label: "Event Reflections & Recaps",
        sub: "Lessons carried out of the room, not left on the table.",
      },
    ],
    actions: [
      {
        href: "/events",
        label: "View Upcoming Events",
        sub: "Founder Salons, leadership workshops, and more.",
        badge: "popular",
      },
      {
        href: "/newsletter",
        label: "Inner Circle Invites",
        sub: "Private gatherings announced to email first.",
      },
    ],
    featured: {
      href: "/events",
      label: "See Upcoming Gatherings",
      sub: "Decide which room you need to be in next.",
      badge: "featured",
    },
  },

  newsletter: {
    title: "The Inner Circle",
    description:
      "The only email worth opening: essays, tools, and early access for serious men.",
    theme: "default",
    reads: [
      {
        href: "/content",
        label: "Featured Essays",
        sub: "Sample the kind of thinking that lands in your inbox.",
      },
    ],
    actions: [
      {
        href: "/newsletter",
        label: "Subscribe to The Inner Circle",
        sub: "Curated reflections for founders, fathers, and leaders.",
        badge: "featured",
      },
    ],
    related: [
      {
        href: "/privacy-policy",
        label: "Privacy & Data Use",
        sub: "How your information is handled and protected.",
      },
    ],
    featured: {
      href: "/newsletter",
      label: "Join The Inner Circle",
      sub: "Zero spam. Clear thinking. Real stakes.",
      badge: "featured",
    },
  },
};

/* -------------------------------------------------------------------------- */
/* Utilities                                                                  */
/* -------------------------------------------------------------------------- */

export function validatePresetKey(key: string): key is CTAKey {
  return Object.prototype.hasOwnProperty.call(CTA_PRESETS, key);
}

export function getCtaPreset(key?: string): CTAPreset | null {
  if (!key) return null;
  const normalised = String(key).trim().toLowerCase() as CTAKey;
  return CTA_PRESETS[normalised] ?? null;
}

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

  return featured.slice(0, 3);
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
    typeof candidate.href === "string" && typeof candidate.label === "string"
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
        brokenLinks.push(`${category}: ${item.label} – Missing or invalid href`);
      }
    });
  });

  return {
    valid: brokenLinks.length === 0,
    brokenLinks,
  };
}

/* -------------------------------------------------------------------------- */
/* Default Export                                                             */
/* -------------------------------------------------------------------------- */

export default CTA_PRESETS;