// -----------------------------------------------------------------------------
// Comprehensive brand registry with validation, utilities, and integration
// -----------------------------------------------------------------------------

import type { ContentBase } from "@/types/index";

// -----------------------------------------------------------------------------
// TYPE DEFINITIONS
// -----------------------------------------------------------------------------

export type BrandKey =
  | "abraham"
  | "endom"
  | "alomarada"
  | "endureluxe"
  | "innovatehub";

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

// NB: ContentBase already has `content?: string`, so we omit it and
// introduce our own richer `content?: BrandContent`.
export interface Brand extends Omit<ContentBase, "content"> {
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

// Fix type clash with ContentBase.status by reusing its type
export interface BrandContentFilter
  extends Omit<Partial<ContentBase>, "status"> {
  brand?: BrandKey | BrandKey[];
  contentType?: string | string[];
  status?: ContentBase["status"];
  featured?: boolean;
}

// -----------------------------------------------------------------------------
// BRAND REGISTRY
// -----------------------------------------------------------------------------
// Paths aligned with your actual assets:
//   /public/assets/images/abraham-logo.jpg
//   /public/assets/images/alomarada-ltd.webp
//   /public/assets/images/endureluxe-ltd.webp
//   /public/assets/images/logo/abraham-of-london-logo.svg
//   /public/assets/images/logo/alomarada.svg
//   /public/assets/images/logo/endureluxe.svg
//   /public/assets/images/logo/innovatehub-logo-full.jpg
//   /public/assets/images/social/og-image.jpg

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
      primary: "#0F172A",
      secondary: "#D1B37D",
      accent: "#7C3AED",
      text: "#F9FAFB",
      background: "#020617",
      muted: "#64748B",
      highlight: "#1E293B",
      error: "#DC2626",
      warning: "#F59E0B",
      success: "#059669",
    },
    logo: {
      svg: "/assets/images/logo/abraham-of-london-logo.svg",
      raster: "/assets/images/abraham-logo.jpg",
      mark: "/assets/images/abraham-logo.jpg",
      wordmark: "/assets/images/logo/abraham-of-london-logo.svg",
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
      mission:
        "To equip leaders and builders with frameworks that outlast headlines.",
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
      // No dedicated logo asset specified yet - fallback to a neutral image
      raster: "/assets/images/writing-desk.webp",
    },
    metadata: {
      description: "Endurance and performance optimisation.",
      industry: ["Performance", "Health", "Wellness"],
      location: "Global",
    },
    url: "https://endom.co",
    canonicalUrl: "https://endom.co",
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
      svg: "/assets/images/logo/alomarada.svg",
      raster: "/assets/images/alomarada-ltd.webp",
      mark: "/assets/images/logo/alomarada.svg",
    },
    metadata: {
      description:
        "Advisory, infrastructure, and outsourced operations for Africa-facing ventures.",
      industry: ["Consulting", "Infrastructure", "Operations"],
      location: "London & Lagos",
    },
    url: "https://alomarada.com",
    canonicalUrl: "https://alomarada.com",
    domains: ["alomarada.com", "www.alomarada.com"],
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
      svg: "/assets/images/logo/endureluxe.svg",
      raster: "/assets/images/endureluxe-ltd.webp",
      mark: "/assets/images/logo/endureluxe.svg",
    },
    metadata: {
      description: "Enduring luxury products and experiences.",
      industry: ["Luxury", "Lifestyle", "Retail"],
      location: "Global",
    },
    // Primary brand domain
    url: "https://endureluxe.com",
    // Canonical under Alomarada umbrella (per your note)
    canonicalUrl: "https://alomarada.com/endureluxe",
    domains: [
      "endureluxe.com",
      "www.endureluxe.com",
      "alomarada.com/endureluxe",
    ],
    isActive: true,
    order: 4,
    date: "2023-01-01",
    category: "brand",
    tags: ["endureluxe", "luxury", "endurance"],
  },

  innovatehub: {
    key: "innovatehub",
    slug: "innovatehub",
    title: "InnovateHub",
    name: "InnovateHub",
    colors: {
      primary: "#020617",
      secondary: "#38BDF8",
      accent: "#F97316",
      text: "#F9FAFB",
      background: "#020617",
      muted: "#6B7280",
      highlight: "#111827",
    },
    logo: {
      raster: "/assets/images/logo/innovatehub-logo-full.jpg",
      mark: "/assets/images/logo/innovatehub-logo-full.jpg",
    },
    metadata: {
      description:
        "A focused space for founders, operators, and builders to design, stress-test, and launch durable ventures.",
      industry: ["Innovation", "Startups", "Advisory"],
      location: "London, UK",
    },
    url: "https://innovatehub.abrahamoflondon.org",
    canonicalUrl: "https://innovatehub.abrahamoflondon.org",
    domains: ["innovatehub.abrahamoflondon.org"],
    isActive: true,
    order: 5,
    date: "2023-01-01",
    category: "brand",
    tags: ["innovatehub", "founders", "innovation"],
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
    console.error(
      `[lib/brands] Error getting colors for brand "${key}":`,
      error,
    );
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
        "/assets/images/social/og-image.jpg",
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
      innovatehub: [],
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
            assignedBrands.push(tag as BrandKey);
          }
        });
      }

      assignedBrands.forEach((brand) => {
        groups[brand].push(item);
      });

      // Default to Abraham if nothing explicitly assigned
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
      innovatehub: [],
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
        innovatehub: { total: 0, featured: 0, byType: {}, byCategory: {} },
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
      innovatehub: { parent: undefined, children: [], level: 0 },
    };

    Object.values(brandRegistry).forEach((brand) => {
      const current = hierarchy[brand.key];
      if (!current) return;
      current.parent = brand.parentBrand;
      current.children = brand.childBrands ?? [];
    });

    const calculateLevel = (
      key: BrandKey,
      visited = new Set<BrandKey>(),
    ): number => {
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
      innovatehub: { parent: undefined, children: [], level: 0 },
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

    (Object.entries(hierarchy) as [
      BrandKey,
      { parent?: BrandKey },
    ][]).forEach(([brandKey, info]) => {
      if (brandKey !== key && info.parent === current.parent) {
        relatedKeys.add(brandKey);
      }
    });

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
// DEFAULT EXPORT
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