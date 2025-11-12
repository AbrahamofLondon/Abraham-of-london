// config/site.ts
// Central site configuration with strict typing and safe fallbacks.

export type SocialPlatform =
  | "x"
  | "twitter"
  | "linkedin"
  | "instagram"
  | "youtube"
  | "facebook"
  | "github"
  | "website"
  | "email";

export interface SocialLink {
  kind: SocialPlatform;
  label: string;
  href: string;
  handle?: string;
  priority?: number;
}

export interface SiteBrand {
  name: string;
  tagline?: string;
  logo?: string;            // path to raster logo
  logoSvg?: string;         // path to SVG logo
  favicon?: string;
  primaryColor?: string;    // CSS var or hex
  accentColor?: string;
}

export interface SiteAuthor {
  name: string;
  title?: string;
  image?: string;           // avatar image path
  email?: string;
}

export interface SeoDefaults {
  title: string;
  description: string;
  keywords?: string[];
  openGraphImage?: string;
  twitterCard?: "summary" | "summary_large_image";
}

export interface SiteConfig {
  url: string;              // canonical origin without trailing slash
  brand: SiteBrand;
  author: SiteAuthor;
  socials: SocialLink[];
  seo: SeoDefaults;
  features?: {
    recaptcha?: boolean;
    darkMode?: boolean;
    newsletter?: boolean;
  };
}

const ORIGIN =
  (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "") ||
  "https://www.abrahamoflondon.org";

export const siteConfig: SiteConfig = {
  url: ORIGIN,
  brand: {
    name: "Abraham of London",
    tagline: "Leadership • Legacy • Discipline",
    logo: "/assets/images/abraham-logo.jpg",
    logoSvg: "/assets/images/logo/abraham-of-london.svg",
    favicon: "/assets/icons/favicon.ico",
    primaryColor: "var(--color-primary)",
    accentColor: "var(--color-accent)",
  },
  author: {
    name: "Abraham Adaramola",
    title: "Strategy & Leadership",
    image: "/assets/images/profile-portrait.webp",
    email: "info@abrahamoflondon.org",
  },
  socials: [
    {
      kind: "x",
      label: "X (Twitter)",
      href: "https://x.com/AbrahamAda48634?t=vXINB5EdYjhjr-eeb6tnjw&s=09",
      priority: 1,
    },
    {
      kind: "linkedin",
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/abraham-adaramola-06630321/",
      priority: 2,
    },
    {
      kind: "instagram",
      label: "Instagram",
      href: "https://www.instagram.com/abraham_of_london",
      priority: 3,
    },
    {
      kind: "youtube",
      label: "YouTube",
      href: "https://youtube.com",
      priority: 4,
    },
    {
      kind: "website",
      label: "Website",
      href: "https://www.abrahamoflondon.org",
      priority: 99,
    },
    {
      kind: "email",
      label: "Email",
      href: "mailto:info@abrahamoflondon.org",
      priority: 100,
    },
  ],
  seo: {
    title: "Abraham of London",
    description:
      "Leadership and legacy—strategy, discipline, and timeless principles applied.",
    keywords: [
      "leadership",
      "strategy",
      "legacy",
      "fatherhood",
      "business",
      "Abraham of London",
    ],
    openGraphImage: "/assets/images/social/og-image.jpg",
    twitterCard: "summary_large_image",
  },
  features: {
    recaptcha: Boolean(process.env.RECAPTCHA_SITE_KEY),
    darkMode: true,
    newsletter: false,
  },
};

// Convenience getters
export const authorImage = siteConfig.author.image || "/assets/images/profile-portrait.webp";
export const canonicalUrl = (path = "/") =>
  `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;