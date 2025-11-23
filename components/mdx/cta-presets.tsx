// components/mdx/cta-presets.ts

/* ---------- Types ---------- */
export type LinkItem = {
  href: string;
  label: string;
  sub?: string;
  icon?: string;
  badge?: "new" | "popular" | "featured" | "free";
  external?: boolean;
};

export type CTAPreset = {
  title: string;
  description?: string;
  reads?: LinkItem[];
  downloads?: LinkItem[];
  actions?: LinkItem[];
  related?: LinkItem[];
  theme?: "fatherhood" | "leadership" | "brotherhood" | "mentorship" | "default";
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

/* ---------- Preset Configuration ---------- */
export const CTA_PRESETS: Record<CTAKey, CTAPreset> = {
  fatherhood: {
    title: "Explore Fatherhood Resources",
    description: "Transform your fatherhood journey with proven frameworks and brotherhood support",
    theme: "fatherhood",
    reads: [
      {
        href: "/leadership-begins-at-home",
        label: "Leadership Begins at Home",
        sub: "Lead from the inside out",
        icon: "🏠",
        badge: "popular",
      },
      {
        href: "/the-brotherhood-code",
        label: "The Brotherhood Code",
        sub: "Build your band of brothers",
        icon: "🤝",
        badge: "featured",
      },
      {
        href: "/reclaiming-the-narrative",
        label: "Reclaiming the Narrative",
        sub: "Court-season clarity",
        icon: "✍️",
      },
    ],
    downloads: [
      {
        href: "/downloads/Fatherhood_Guide.pdf",
        label: "Fatherhood Guide",
        sub: "Complete framework for modern fathers",
        badge: "free",
      },
      {
        href: "/downloads/Mentorship_Starter_Kit.pdf",
        label: "Mentorship Starter Kit",
        sub: "Step-by-step mentorship framework",
      },
    ],
    actions: [
      {
        href: "/brotherhood",
        label: "Join Brotherhood",
        sub: "Exclusive community access",
        badge: "new",
      },
      {
        href: "/consultation",
        label: "Book Consultation",
        sub: "1-on-1 guidance session",
      },
    ],
    featured: {
      href: "/fatherhood-masterclass",
      label: "Fatherhood Masterclass",
      sub: "7-day transformative program",
    },
  },

  // ... other presets remain the same
} as const;

/* ---------- Enhanced Utilities ---------- */
export function validatePresetKey(key: string): key is CTAKey {
  return Object.keys(CTA_PRESETS).includes(key);
}

export function getCtaPreset(key?: string): CTAPreset | null {
  if (!key) return null;
  const k = String(key).trim().toLowerCase() as CTAKey;
  return CTA_PRESETS[k] || null;
}

export function getAllPresetKeys(): CTAKey[] {
  return Object.keys(CTA_PRESETS) as CTAKey[];
}

export function getPresetByTheme(theme: NonNullable<CTAPreset["theme"]>): CTAPreset[] {
  return Object.values(CTA_PRESETS).filter((p) => p.theme === theme);
}

export function getFeaturedItems(presetKey: CTAKey): LinkItem[] {
  const preset = CTA_PRESETS[presetKey];
  if (!preset) return [];

  const featured: LinkItem[] = [];
  if (preset.featured) featured.push(preset.featured);

  // Get all items with badges
  (['reads', 'downloads', 'actions', 'related'] as const).forEach((category) => {
    const items = preset[category];
    if (Array.isArray(items)) {
      featured.push(...items.filter(item => item.badge));
    }
  });

  // Return top 3 featured items
  return featured.slice(0, 3);
}

export function getAllDownloads(): LinkItem[] {
  const downloads: LinkItem[] = [];
  Object.values(CTA_PRESETS).forEach(preset => {
    if (preset.downloads) {
      downloads.push(...preset.downloads);
    }
  });
  return downloads;
}

export function searchPresets(query: string): CTAPreset[] {
  const searchTerm = query.toLowerCase().trim();
  if (!searchTerm) return [];

  return Object.values(CTA_PRESETS).filter(preset => {
    // Search in title and description
    if (
      preset.title.toLowerCase().includes(searchTerm) ||
      preset.description?.toLowerCase().includes(searchTerm)
    ) {
      return true;
    }

    // Search in all link items
    const categories: (keyof CTAPreset)[] = ['reads', 'downloads', 'actions', 'related'];
    return categories.some(category => {
      const items = preset[category];
      return Array.isArray(items) && items.some(item =>
        item.label.toLowerCase().includes(searchTerm) ||
        item.sub?.toLowerCase().includes(searchTerm)
      );
    });
  });
}

// Type guards
export function isCTAPreset(obj: unknown): obj is CTAPreset {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'title' in obj &&
    typeof (obj as any).title === 'string'
  );
}

export function isLinkItem(obj: unknown): obj is LinkItem {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'href' in obj &&
    'label' in obj &&
    typeof (obj as any).href === 'string' &&
    typeof (obj as any).label === 'string'
  );
}

// New utility: Get presets by category
export function getPresetsByCategory(category: keyof Omit<CTAPreset, 'title' | 'description' | 'theme' | 'featured'>): Record<CTAKey, LinkItem[]> {
  const result: Partial<Record<CTAKey, LinkItem[]>> = {};
  
  (Object.keys(CTA_PRESETS) as CTAKey[]).forEach(key => {
    const items = CTA_PRESETS[key][category];
    result[key] = Array.isArray(items) ? items : [];
  });

  return result as Record<CTAKey, LinkItem[]>;
}

// New utility: Validate all links in a preset
export function validatePresetLinks(presetKey: CTAKey): { valid: boolean; brokenLinks: string[] } {
  const preset = CTA_PRESETS[presetKey];
  if (!preset) return { valid: false, brokenLinks: ['Preset not found'] };

  const brokenLinks: string[] = [];
  const categories: (keyof CTAPreset)[] = ['reads', 'downloads', 'actions', 'related'];

  categories.forEach(category => {
    const items = preset[category];
    if (Array.isArray(items)) {
      items.forEach(item => {
        // Basic validation - you might want to enhance this with actual link checking
        if (!item.href || item.href === '#') {
          brokenLinks.push(`${category}: ${item.label} - Missing href`);
        }
      });
    }
  });

  return {
    valid: brokenLinks.length === 0,
    brokenLinks
  };
}

export default CTA_PRESETS;