// lib/brands.ts
// -----------------------------------------------------------------------------
// Comprehensive brand registry with validation, utilities, and integration
// -----------------------------------------------------------------------------

import type { ContentBase } from "@/types/index";

// -----------------------------------------------------------------------------
// TYPE DEFINITIONS
// -----------------------------------------------------------------------------

export type BrandKey = "abraham" | "endom" | "alomarada" | "endureluxe";

export type BrandColorPalette = {
  primary: string;
  secondary: string;
  accent?: string;
  text: string;
  background: string;
  muted?: string;
  highlight?: string;
  error?: string;
  warning?: string;
  success?: string;
};

export type BrandLogo = {
  svg?: string;
  raster?: string;
  favicon?: string;
  mark?: string;
  wordmark?: string;
  dark?: string;
  light?: string;
  dimensions?: {
    width: number;
    height: number;
    aspectRatio: string;
  };
};

export type BrandSocial = {
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  github?: string;
  youtube?: string;
  facebook?: string;
  tiktok?: string;
};

export type BrandContact = {
  email?: string;
  phone?: string;
  address?: string;
  supportEmail?: string;
  salesEmail?: string;
};

export type BrandMetadata = {
  description?: string;
  tagline?: string;
  mission?: string;
  vision?: string;
  founded?: string;
  founder?: string;
  industry?: string[];
  location?: string;
  languages?: string[];
  timezone?: string;
};

export type BrandContent = {
  blog?: boolean;
  newsletter?: boolean;
  podcast?: boolean;
  video?: boolean;
  courses?: boolean;
  events?: boolean;
  downloads?: boolean;
  community?: boolean;
};

export type BrandSettings = {
  theme?: "light" | "dark" | "auto";
  fontFamily?: {
    heading?: string;
    body?: string;
    mono?: string;
  };
  borderRadius?: string;
  animation?: "subtle" | "moderate" | "none";
  shadows?: "light" | "medium" | "heavy" | "none";
  typography?: {
    scale?: number;
    lineHeight?: number;
    letterSpacing?: number;
  };
};

export interface Brand extends ContentBase {
  key: BrandKey;
  name: string;
  short?: string;
  displayName?: string;
  legalName?: string;
  colors: BrandColorPalette;
  logo?: BrandLogo;
  social?: BrandSocial;
  contact?: BrandContact;
  metadata?: BrandMetadata;
  content?: BrandContent;
  settings?: BrandSettings;
  url: string;
  domains?: string[];
  canonicalUrl?: string;
  isActive?: boolean;
  isVerified?: boolean;
  parentBrand?: BrandKey;
  childBrands?: BrandKey[];
  featured?: boolean;
  order?: number;
}

export interface BrandContentFilter extends Partial<ContentBase> {
  brand?: BrandKey | BrandKey[];
  contentType?: string | string[];
  status?: string;
  featured?: boolean;
}

// -----------------------------------------------------------------------------
// BRAND REGISTRY
// -----------------------------------------------------------------------------
// NOTE: Paths aligned with known assets in /public/assets/images/*
//   - /assets/images/abraham-logo.jpg
//   - /assets/images/abraham-of-london-on-cursive.svg
//   - /assets/images/alomarada-ltd.webp
//   - /assets/images/endureluxe-ltd.webp
//   - /assets/images/social/og-image.jpg

export const brandRegistry: Record<BrandKey, Brand> = {
  abraham: {
    key: "abraham",
    slug: "abraham",
    title: "Abraham of London",
    name: "Abraham of London",
    short: "AoL",
    displayName: "Abraham",
    legalName: "Abraham of London Ltd",
    colors: {
      primary: "#0F172A", // deep charcoal
      secondary: "#D1B37D", // soft gold
      accent: "#7C3AED", // vibrant purple
      text: "#F9FAFB",
      background: "#020617",
      muted: "#64748B",
      highlight: "#1E293B",
      error: "#DC2626",
      warning: "#F59E0B",
      success: "#059669",
    },
    logo: {
      // Wordmark / cursive SVG we actually have
      svg: "/assets/images/abraham-of-london-on-cursive.svg",
      // Main square/raster logo
      raster: "/assets/images/abraham-logo.jpg",
      // Re-use raster as mark if no separate asset
      mark: "/assets/images/abraham-logo.jpg",
      wordmark: "/assets/images/abraham-of-london-on-cursive.svg",
      favicon: "/favicon.ico",
      dimensions: {
        width: 200,
        height: 60,
        aspectRatio: "10/3",
      },
    },
    social: {
      twitter: "https://twitter.com/abrahamoflondon",
      linkedin: "https://www.linkedin.com/company/abrahamoflondon",
      instagram: "https://www.instagram.com/abrahamoflondon",
      github: "https://github.com/abraham-of-london",
      youtube: "https://www.youtube.com/@abrahamoflondon",
    },
    contact: {
      email: "hello@abrahamoflondon.org",
      supportEmail: "support@abrahamoflondon.org",
      address: "London, United Kingdom",
    },
    metadata: {
      description:
        "Strategic frameworks, Christian realism, and enduring principles for modern leadership.",
      tagline: "Wisdom for the strategic mind.",
      mission: "To equip leaders and builders with frameworks that outlast headlines.",
      vision:
        "A world where strategic, moral, and theological clarity are normal, not rare.",
      founded: "2023",
      founder: "Abraham",
      industry: ["Education", "Publishing", "Consulting"],
      location: "London, UK",
      languages: ["English"],
      timezone: "Europe/London",
    },
    content: {
      blog: true,
      newsletter: true,
      podcast: false,
      video: true,
      courses: true,
      events: true,
      downloads: true,
      community: true,
    },
    settings: {
      theme: "dark",
      fontFamily: {
        heading: "'Cormorant Garamond', serif",
        body: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
      },
      borderRadius: "0.75rem",
      animation: "subtle",
      shadows: "medium",
      typography: {
        scale: 1.2,
        lineHeight: 1.6,
        letterSpacing: 0.01,
      },
    },
    url: "https://www.abrahamoflondon.org",
    domains: ["abrahamoflondon.org", "www.abrahamoflondon.org"],
    canonicalUrl: "https://www.abrahamoflondon.org",
    isActive: true,
    isVerified: true,
    featured: true,
    order: 1,
    date: "2023-01-01",
    category: "brand",
    tags: ["abraham", "leadership", "strategy", "canon"],
  },

  endom: {
    key: "endom",
    slug: "endom",
    title: "Endom",
    name: "Endom",
    colors: {
      primary: "#111827",
      secondary: "#9CA3AF",
      accent: "#3B82F6",
      text: "#111827",
      background: "#F9FAFB",
      muted: "#6B7280",
      highlight: "#E5E7EB",
    },
    logo: {
      // No dedicated asset confirmed yet – use generic writing desk / placeholder if needed
      raster: "/assets/images/writing-desk.webp",
    },
    metadata: {
      description: "Endurance and performance optimisation.",
      industry: ["Performance", "Health", "Wellness"],
      location: "Global",
    },
    url: "https://endom.co",
    isActive: true,
    order: 2,
    date: "2023-01-01",
    category: "brand",
    tags: ["performance", "health", "endom"],
  },

  alomarada: {
    key: "alomarada",
    slug: "alomarada",
    title: "Alomarada Ltd",
    name: "Alomarada Ltd",
    colors: {
      primary: "#020617",
      secondary: "#D1B37D",
      accent: "#10B981",
      text: "#F9FAFB",
      background: "#020617",
      muted: "#475569",
      highlight: "#111827",
    },
    logo: {
      raster: "/assets/images/alomarada-ltd.webp",
      mark: "/assets/images/alomarada-ltd.webp",
    },
    metadata: {
      description:
        "Advisory, infrastructure, and outsourced operations for Africa-facing ventures.",
      industry: ["Consulting", "Infrastructure", "Operations"],
      location: "London & Lagos",
    },
    url: "https://alomarada.com",
    isActive: true,
    order: 3,
    date: "2023-01-01",
    category: "brand",
    tags: ["alomarada", "africa", "consulting"],
  },

  endureluxe: {
    key: "endureluxe",
    slug: "endureluxe",
    title: "EndureLuxe",
    name: "EndureLuxe",
    colors: {
      primary: "#101010",
      secondary: "#CBA35C",
      accent: "#EF4444",
      text: "#101010",
      background: "#FAFAFA",
      muted: "#737373",
      highlight: "#E5E5E5",
    },
    logo: {
      raster: "/assets/images/endureluxe-ltd.webp",
      mark: "/assets/images/endureluxe-ltd.webp",
    },
    metadata: {
      description: "Enduring luxury products and experiences.",
      industry: ["Luxury", "Lifestyle", "Retail"],
      location: "Global",
    },
    url: "https://endureluxe.com",
    isActive: true,
    order: 4,
    date: "2023-01-01",
    category: "brand",
    tags: ["endureluxe", "luxury", "endurance"],
  },
};

// -----------------------------------------------------------------------------
// CORE FUNCTIONS
// -----------------------------------------------------------------------------

export function getBrand(key: BrandKey): Brand | null {
  try {
    const brand = brandRegistry[key];
    if (!brand) {
      console.warn(`[lib/brands] Brand "${key}" not found in registry`);
      return null;
    }
    return brand;
  } catch (error) {
    console.error(`[lib/brands] Error getting brand "${key}":`, error);
    return null;
  }
}

export function getBrandBySlug(slug: string): Brand | null {
  try {
    const brands = listBrands();
    const brand = brands.find((b) => b.slug === slug);
    return brand || null;
  } catch (error) {
    console.error(`[lib/brands] Error getting brand by slug "${slug}":`, error);
    return null;
  }
}

export function listBrands(): Brand[] {
  try {
    return Object.values(brandRegistry);
  } catch (error) {
    console.error("[lib/brands] Error listing brands:", error);
    return [];
  }
}

export function getActiveBrands(): Brand[] {
  try {
    return listBrands().filter((brand) => brand.isActive !== false);
  } catch (error) {
    console.error("[lib/brands] Error getting active brands:", error);
    return [];
  }
}

export function getFeaturedBrands(): Brand[] {
  try {
    return listBrands()
      .filter((brand) => brand.featured === true)
      .sort((a, b) => (a.order || 99) - (b.order || 99));
  } catch (error) {
    console.error("[lib/brands] Error getting featured brands:", error);
    return [];
  }
}

// -----------------------------------------------------------------------------
// BRAND UTILITIES
// -----------------------------------------------------------------------------

export function isValidBrandKey(key: string): key is BrandKey {
  return Object.prototype.hasOwnProperty.call(brandRegistry, key);
}

export function getBrandColors(key: BrandKey): Record<string, string> {
  try {
    const brand = getBrand(key);
    if (!brand) return {};

    const colors = brand.colors;
    const cssVars: Record<string, string> = {};

    Object.entries(colors).forEach(([name, value]) => {
      if (value) {
        cssVars[`--color-${name}`] = String(value);
      }
    });

    return cssVars;
  } catch (error) {
    console.error(`[lib/brands] Error getting colors for brand "${key}":`, error);
    return {};
  }
}

export function getBrandSettings(key: BrandKey): Record<string, unknown> {
  try {
    const brand = getBrand(key);
    if (!brand) return {};

    return {
      colors: brand.colors,
      typography: brand.settings?.typography,
      fontFamily: brand.settings?.fontFamily,
      borderRadius: brand.settings?.borderRadius,
      animation: brand.settings?.animation,
    };
  } catch (error) {
    console.error(
      `[lib/brands] Error getting settings for brand "${key}":`,
      error,
    );
    return {};
  }
}

export function getBrandMetadata(key: BrandKey): Record<string, unknown> {
  try {
    const brand = getBrand(key);
    if (!brand) return {};

    return {
      title: brand.name,
      description: brand.metadata?.description || brand.name,
      url: brand.url,
      canonicalUrl: brand.canonicalUrl ?? brand.url,
      image:
        brand.logo?.raster ??
        "/assets/images/social/og-image.jpg", // known social OG
      siteName: brand.name,
      type: "website",
      locale: "en_GB",
      ...brand.metadata,
    };
  } catch (error) {
    console.error(
      `[lib/brands] Error getting metadata for brand "${key}":`,
      error,
    );
    return {};
  }
}

// -----------------------------------------------------------------------------
// CONTENT FILTERING BY BRAND
// -----------------------------------------------------------------------------

export function filterContentByBrand<T extends ContentBase>(
  content: T[],
  brandKey: BrandKey | BrandKey[],
): T[] {
  try {
    const brandKeys = Array.isArray(brandKey) ? brandKey : [brandKey];

    return content.filter((item) => {
      if (!item.category && !item.tags) return false;

      if (item.category && typeof item.category === "string") {
        if (brandKeys.includes(item.category as BrandKey)) return true;
      }

      if (Array.isArray(item.tags)) {
        return item.tags.some((tag) => brandKeys.includes(tag as BrandKey));
      }

      return false;
    });
  } catch (error) {
    console.error("[lib/brands] Error filtering content by brand:", error);
    return [];
  }
}

export function groupContentByBrand<T extends ContentBase>(
  content: T[],
): Record<BrandKey, T[]> {
  try {
    const groups: Record<BrandKey, T[]> = {
      abraham: [],
      endom: [],
      alomarada: [],
      endureluxe: [],
    };

    content.forEach((item) => {
      const assignedBrands: BrandKey[] = [];

      if (item.category && typeof item.category === "string") {
        const categoryBrand = item.category as BrandKey;
        if (isValidBrandKey(categoryBrand)) {
          assignedBrands.push(categoryBrand);
        }
      }

      if (Array.isArray(item.tags)) {
        item.tags.forEach((tag) => {
          if (isValidBrandKey(tag)) {
            assignedBrands.push(tag);
          }
        });
      }

      assignedBrands.forEach((brand) => {
        groups[brand].push(item);
      });

      if (assignedBrands.length === 0) {
        groups.abraham.push(item);
      }
    });

    return groups;
  } catch (error) {
    console.error("[lib/brands] Error grouping content by brand:", error);
    return {
      abraham: [],
      endom: [],
      alomarada: [],
      endureluxe: [],
    };
  }
}

// -----------------------------------------------------------------------------
// BRAND STATISTICS
// -----------------------------------------------------------------------------

export function getBrandStats<T extends ContentBase>(content: T[] = []): {
  byBrand: Record<
    BrandKey,
    {
      total: number;
      featured: number;
      byType: Record<string, number>;
      byCategory: Record<string, number>;
    }
  >;
  totalContent: number;
  featuredContent: number;
} {
  try {
    const grouped = groupContentByBrand(content);

    const stats = {
      byBrand: {} as Record<
        BrandKey,
        {
          total: number;
          featured: number;
          byType: Record<string, number>;
          byCategory: Record<string, number>;
        }
      >,
      totalContent: content.length,
      featuredContent: content.filter((item) => item.featured === true).length,
    };

    (Object.entries(grouped) as [BrandKey, T[]][]).forEach(
      ([brandKey, brandContent]) => {
        const byType: Record<string, number> = {};
        const byCategory: Record<string, number> = {};

        brandContent.forEach((item) => {
          const type = (item as any).type || "unknown";
          byType[type] = (byType[type] || 0) + 1;

          if (item.category) {
            const category = Array.isArray(item.category)
              ? item.category.join(", ")
              : item.category;
            byCategory[category] = (byCategory[category] || 0) + 1;
          }
        });

        stats.byBrand[brandKey] = {
          total: brandContent.length,
          featured: brandContent.filter(
            (item) => item.featured === true,
          ).length,
          byType,
          byCategory,
        };
      },
    );

    return stats;
  } catch (error) {
    console.error("[lib/brands] Error getting brand stats:", error);
    return {
      byBrand: {
        abraham: { total: 0, featured: 0, byType: {}, byCategory: {} },
        endom: { total: 0, featured: 0, byType: {}, byCategory: {} },
        alomarada: { total: 0, featured: 0, byType: {}, byCategory: {} },
        endureluxe: { total: 0, featured: 0, byType: {}, byCategory: {} },
      },
      totalContent: 0,
      featuredContent: 0,
    };
  }
}

// -----------------------------------------------------------------------------
// BRAND RELATIONSHIPS
// -----------------------------------------------------------------------------

export function getBrandHierarchy(): Record<
  BrandKey,
  {
    parent?: BrandKey;
    children: BrandKey[];
    level: number;
  }
> {
  try {
    const hierarchy: Record<
      BrandKey,
      {
        parent?: BrandKey;
        children: BrandKey[];
        level: number;
      }
    > = {
      abraham: { parent: undefined, children: [], level: 0 },
      endom: { parent: undefined, children: [], level: 0 },
      alomarada: { parent: undefined, children: [], level: 0 },
      endureluxe: { parent: undefined, children: [], level: 0 },
    };

    // If later you wire parentBrand / childBrands in registry,
    // this will still be safe.
    Object.values(brandRegistry).forEach((brand) => {
      const current = hierarchy[brand.key];
      if (!current) return;

      current.parent = brand.parentBrand;
      current.children = brand.childBrands ?? [];
    });

    const calculateLevel = (key: BrandKey, visited = new Set<BrandKey>()): number => {
      if (visited.has(key)) return 0;
      visited.add(key);
      const node = hierarchy[key];
      if (!node?.parent) return 0;
      return calculateLevel(node.parent, visited) + 1;
    };

    (Object.keys(hierarchy) as BrandKey[]).forEach((key) => {
      hierarchy[key].level = calculateLevel(key);
    });

    return hierarchy;
  } catch (error) {
    console.error("[lib/brands] Error getting brand hierarchy:", error);
    return {
      abraham: { parent: undefined, children: [], level: 0 },
      endom: { parent: undefined, children: [], level: 0 },
      alomarada: { parent: undefined, children: [], level: 0 },
      endureluxe: { parent: undefined, children: [], level: 0 },
    };
  }
}

export function getRelatedBrands(key: BrandKey): Brand[] {
  try {
    const hierarchy = getBrandHierarchy();
    const current = hierarchy[key];
    if (!current) return [];

    const relatedKeys = new Set<BrandKey>();

    if (current.parent) relatedKeys.add(current.parent);
    current.children.forEach((child) => relatedKeys.add(child));

    (Object.entries(hierarchy) as [BrandKey, { parent?: BrandKey }][]).forEach(
      ([brandKey, info]) => {
        if (brandKey !== key && info.parent === current.parent) {
          relatedKeys.add(brandKey);
        }
      },
    );

    return Array.from(relatedKeys)
      .map((k) => getBrand(k))
      .filter((b): b is Brand => b != null)
      .sort((a, b) => (a.order || 99) - (b.order || 99));
  } catch (error) {
    console.error(
      `[lib/brands] Error getting related brands for "${key}":`,
      error,
    );
    return [];
  }
}

// -----------------------------------------------------------------------------
// DEFAULT EXPORT (VALUES ONLY – NO TYPES)
// -----------------------------------------------------------------------------

const brandApi = {
  brandRegistry,
  getBrand,
  getBrandBySlug,
  listBrands,
  getActiveBrands,
  getFeaturedBrands,
  isValidBrandKey,
  getBrandColors,
  getBrandSettings,
  getBrandMetadata,
  filterContentByBrand,
  groupContentByBrand,
  getBrandStats,
  getBrandHierarchy,
  getRelatedBrands,
};

export default brandApi;