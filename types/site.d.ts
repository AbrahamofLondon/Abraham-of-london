// types/site.ts

/**
 * Auto-generated type definitions for site configuration
 * Simplified version for easy consumption across the app
 */
export interface SiteConfig {
  // Core identity
  name: string;
  title: string;
  description: string;
  url: string;

  // SEO & Social
  ogImage: string | undefined;
  twitterImage: string | undefined;
  twitterHandle?: string;

  // Social links
  links: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    youtube?: string;
    instagram?: string;
    email?: string;
  };

  // Additional optional fields for flexibility
  subtitle?: string;
  language?: string;
  theme?: "light" | "dark" | "auto";
  version?: string;
}

/**
 * Default site configuration
 * This should be your single source of truth for site config
 */
export const siteConfig: SiteConfig = {
  name: "Abraham of London",
  title: "Abraham of London - Strategic Insights",
  description: "Strategic insights and analysis from Abraham of London",
  url: process.env.SITE_URL || "https://abrahamoflondon.com",

  // Default OG image - adjust path as needed
  ogImage: undefined, // Will be set dynamically or use default
  twitterImage: undefined, // Will be set dynamically or use default
  twitterHandle: undefined, // Add your Twitter handle if needed

  links: {
    twitter: undefined, // Add your Twitter URL
    github: undefined, // Add your GitHub URL
    linkedin: undefined, // Add your LinkedIn URL
    // Add other social links as needed
  },

  // Additional configuration
  subtitle: "Strategic Insights & Analysis",
  language: "en",
  theme: "auto",
  version: "1.0.0",
};

/**
 * Utility functions for site configuration
 */
export const getSiteConfig = (): SiteConfig => siteConfig;

export const getFullUrl = (path: string = ""): string => {
  const baseUrl = siteConfig.url.replace(/\/+$/, "");
  const cleanPath = path.replace(/^\/+/, "");
  return cleanPath ? `${baseUrl}/${cleanPath}` : baseUrl;
};

export const getOgImageUrl = (imagePath?: string): string => {
  if (imagePath) {
    return imagePath.startsWith("http") ? imagePath : getFullUrl(imagePath);
  }
  // Fallback to default OG image
  return getFullUrl("/images/og-default.jpg");
};

export const getTwitterImageUrl = (imagePath?: string): string => {
  if (imagePath) {
    return imagePath.startsWith("http") ? imagePath : getFullUrl(imagePath);
  }
  // Fallback to default Twitter image or use OG image
  return getOgImageUrl();
};

export const getSocialUrl = (
  platform: keyof SiteConfig["links"],
): string | undefined => {
  return siteConfig.links[platform];
};

export const isSocialLinkConfigured = (
  platform: keyof SiteConfig["links"],
): boolean => {
  return !!siteConfig.links[platform];
};

/**
 * SEO helper functions
 */
export const generateSeoConfig = (
  overrides: Partial<{
    title: string;
    description: string;
    ogImage: string;
    twitterImage: string;
  }> = {},
) => {
  return {
    title: overrides.title || siteConfig.title,
    description: overrides.description || siteConfig.description,
    ogImage: getOgImageUrl(overrides.ogImage),
    twitterImage: getTwitterImageUrl(overrides.twitterImage),
    twitterHandle: siteConfig.twitterHandle,
  };
};

/**
 * Type guards and validation
 */
export const isValidSiteConfig = (config: unknown): config is SiteConfig => {
  return (
    typeof config === "object" &&
    config !== null &&
    "name" in config &&
    "title" in config &&
    "description" in config &&
    "url" in config &&
    "ogImage" in config &&
    "links" in config
  );
};

export const validateSiteConfig = (): string[] => {
  const errors: string[] = [];

  if (!siteConfig.name.trim()) {
    errors.push("Site name is required");
  }

  if (!siteConfig.title.trim()) {
    errors.push("Site title is required");
  }

  if (!siteConfig.description.trim()) {
    errors.push("Site description is required");
  }

  if (!siteConfig.url.trim()) {
    errors.push("Site URL is required");
  }

  // Validate URL format
  try {
    new URL(siteConfig.url);
  } catch {
    errors.push("Site URL must be a valid URL");
  }

  return errors;
};

/**
 * Runtime configuration helpers for client-side usage
 */
export const getClientConfig = (): SiteConfig => {
  if (typeof window !== "undefined") {
    // You can hydrate from window object if needed
    return (window as any).__SITE_CONFIG__ || siteConfig;
  }
  return siteConfig;
};

// Make siteConfig available globally in development
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  (window as any).siteConfig = siteConfig;
}
