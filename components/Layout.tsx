// components/Layout.tsx – HARDENED FOR PAGES ROUTER + NEXT EXPORT

import * as React from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

// NOTE: If you don't use this, remove it to avoid extra imports.
// import Header from "@/components/Header";

// ---------------------------------------------------------------------
// Dynamic imports (HARD MODE)
// ---------------------------------------------------------------------
// Export/SSG dies if these components touch window/document at import time.
// To be absolutely resilient, do NOT SSR them. Use lightweight shells.
const LuxuryNavbar = dynamic(() => import("@/components/LuxuryNavbar"), {
  ssr: false,
  loading: () => (
    <div className="h-16 border-b border-gray-800 bg-gradient-to-b from-gray-900 to-black" />
  ),
});

const Footer = dynamic(() => import("@/components/Footer"), {
  ssr: false,
  loading: () => <div className="h-64 bg-gradient-to-b from-black to-gray-900" />,
});

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

export interface StructuredData {
  "@context": string;
  "@type": string;
  [key: string]: any;
}

export type LayoutProps = {
  children: React.ReactNode;

  // Title options
  title?: string;
  pageTitle?: string;

  // SEO metadata
  description?: string;
  keywords?: string[];
  canonicalUrl?: string; // absolute or relative

  // Open Graph / Twitter
  ogImage?: string; // absolute or relative
  ogType?: string;
  twitterCard?: string;

  // Structured data
  structuredData?: StructuredData;

  // Layout options
  transparentHeader?: boolean;
  className?: string;
  fullWidth?: boolean;

  // Additional head elements
  additionalHead?: React.ReactNode;

  // Mobile optimizations
  mobileFriendly?: boolean;
};

// ---------------------------------------------------------------------
// Safe helpers (NO throws, EVER)
// ---------------------------------------------------------------------

const DEFAULT_SEO = {
  siteName: "Abraham of London",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org",
  defaultDescription:
    "Faith-rooted strategy and leadership for fathers, founders, and board-level leaders who refuse to outsource responsibility.",
  defaultOgImage: "/assets/images/social/og-image.jpg",
  defaultOgType: "website",
  defaultTwitterCard: "summary_large_image",
  twitterHandle: "@abrahamoflondon",
} as const;

function safeStr(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function safeTrim(v: unknown, fallback = ""): string {
  const s = safeStr(v, fallback);
  return s ? s.trim() : fallback;
}

function isAbsHttpUrl(v: string): boolean {
  return v.startsWith("http://") || v.startsWith("https://");
}

function toAbsoluteUrl(pathOrUrl: unknown): string | null {
  const s = safeTrim(pathOrUrl, "");
  if (!s) return null;

  if (isAbsHttpUrl(s)) return s;

  // If it's a proper absolute path
  if (s.startsWith("/")) return `${DEFAULT_SEO.siteUrl}${s}`;

  // If it's a relative asset path, normalize safely
  return `${DEFAULT_SEO.siteUrl}/${s.replace(/^\/+/, "")}`;
}

function safeCanonicalFromPath(path: unknown): string {
  const p = safeTrim(path, "/");
  if (!p) return DEFAULT_SEO.siteUrl;

  if (isAbsHttpUrl(p)) return p;

  if (p.startsWith("/")) return `${DEFAULT_SEO.siteUrl}${p}`;

  return `${DEFAULT_SEO.siteUrl}/${p}`;
}

// Helper function to get page title
const getPageTitle = (title?: string): string => {
  const baseTitle = DEFAULT_SEO.siteName;
  const t = safeTrim(title, "");
  if (!t) return baseTitle;
  if (t.includes(baseTitle)) return t;
  return `${t} | ${baseTitle}`;
};

// Device type (safe; never touches window outside useEffect)
const useDeviceType = () => {
  const [deviceType, setDeviceType] =
    React.useState<"mobile" | "tablet" | "desktop">("desktop");

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const checkDevice = () => {
      const width = window.innerWidth || 1024;
      if (width < 768) setDeviceType("mobile");
      else if (width < 1024) setDeviceType("tablet");
      else setDeviceType("desktop");
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  return deviceType;
};

// ---------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------

export default function Layout({
  children,
  title,
  pageTitle,
  description,
  keywords = [],
  canonicalUrl,
  ogImage,
  ogType = DEFAULT_SEO.defaultOgType,
  twitterCard = DEFAULT_SEO.defaultTwitterCard,
  structuredData,
  transparentHeader = false,
  className = "",
  fullWidth = false,
  additionalHead,
  mobileFriendly = true,
}: LayoutProps): JSX.Element {
  const router = useRouter();
  const deviceType = useDeviceType();
  const isMobile = deviceType === "mobile";

  // Title/description always safe
  const effectiveTitle = getPageTitle(title ?? pageTitle);
  const fullDescription = safeTrim(description, DEFAULT_SEO.defaultDescription);

  // Canonical:
  // - prefer prop canonicalUrl (page knows best)
  // - else use router.asPath if available
  // - else fallback to site root
  const asPath =
    typeof router?.asPath === "string" && router.asPath
      ? router.asPath.split("#")[0].split("?")[0]
      : "/";

  const fullCanonicalUrl = canonicalUrl
    ? safeCanonicalFromPath(canonicalUrl)
    : safeCanonicalFromPath(asPath);

  // OG image: always absolute, always safe
  const fullOgImage =
    toAbsoluteUrl(ogImage) ??
    toAbsoluteUrl(DEFAULT_SEO.defaultOgImage) ??
    `${DEFAULT_SEO.siteUrl}${DEFAULT_SEO.defaultOgImage}`;

  const containerClass = fullWidth
    ? "w-full"
    : "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

  return (
    <div
      className={[
        "min-h-screen flex flex-col",
        "bg-gradient-to-b from-gray-50 to-white text-gray-900",
        "dark:from-gray-950 dark:to-black dark:text-white",
        mobileFriendly ? "touch-manipulation" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Head>
        {/* Viewport */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover"
        />

        {/* Basic metadata */}
        <title>{effectiveTitle}</title>
        <meta name="description" content={fullDescription} />
        <meta
          name="theme-color"
          content="#ffffff"
          media="(prefers-color-scheme: light)"
        />
        <meta
          name="theme-color"
          content="#000000"
          media="(prefers-color-scheme: dark)"
        />

        {/* Keywords */}
        {Array.isArray(keywords) && keywords.length > 0 ? (
          <meta name="keywords" content={keywords.filter(Boolean).join(", ")} />
        ) : null}

        {/* Canonical */}
        <link rel="canonical" href={fullCanonicalUrl} />

        {/* Open Graph */}
        <meta property="og:title" content={effectiveTitle} />
        <meta property="og:description" content={fullDescription} />
        <meta property="og:type" content={safeTrim(ogType, DEFAULT_SEO.defaultOgType)} />
        <meta property="og:url" content={fullCanonicalUrl} />
        <meta property="og:image" content={fullOgImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content={DEFAULT_SEO.siteName} />
        <meta property="og:locale" content="en_GB" />

        {/* Twitter */}
        <meta name="twitter:card" content={safeTrim(twitterCard, DEFAULT_SEO.defaultTwitterCard)} />
        <meta name="twitter:site" content={DEFAULT_SEO.twitterHandle} />
        <meta name="twitter:creator" content={DEFAULT_SEO.twitterHandle} />
        <meta name="twitter:title" content={effectiveTitle} />
        <meta name="twitter:description" content={fullDescription} />
        <meta name="twitter:image" content={fullOgImage} />

        {/* Structured data */}
        {structuredData ? (
          <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(structuredData),
            }}
          />
        ) : null}

        {additionalHead}

        {/* Preconnects */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </Head>

      {/* Header */}
      <LuxuryNavbar variant="dark" transparent={transparentHeader} />

      {/* Main */}
      <main className={`flex-1 ${containerClass} ${isMobile ? "pt-4" : "pt-8"}`}>
        {children}
      </main>

      {/* Footer */}
      <Footer />

      {/* Global styles */}
      <style jsx global>{`
        @media (max-width: 768px) {
          input,
          select,
          textarea {
            font-size: 16px !important;
          }
          button,
          a[role="button"],
          .touch-target {
            min-height: 44px;
            min-width: 44px;
          }
          html {
            -webkit-overflow-scrolling: touch;
          }
          body {
            overscroll-behavior-y: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        html {
          scroll-behavior: smooth;
        }

        *:focus-visible {
          outline: 2px solid #f59e0b;
          outline-offset: 2px;
        }

        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }

        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }

        @media (prefers-color-scheme: dark) {
          ::-webkit-scrollbar-track {
            background: #2d3748;
          }
          ::-webkit-scrollbar-thumb {
            background: #4a5568;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #718096;
          }
        }

        @media print {
          nav,
          footer,
          .no-print {
            display: none !important;
          }
          * {
            background: white !important;
            color: black !important;
          }
          a {
            color: black !important;
            text-decoration: underline !important;
          }
        }
      `}</style>
    </div>
  );
}

// Export helper for page titles
export { getPageTitle };

// ---------------------------------------------------------------------
// Layout helpers (kept, but hardened)
// ---------------------------------------------------------------------

export const LayoutHelpers = {
  article: (config: {
    title: string;
    description?: string;
    datePublished: string;
    dateModified?: string;
    authorName?: string;
    authorUrl?: string;
    image?: string;
    canonicalUrl?: string;
    tags?: string[];
  }) => {
    const canonical = safeCanonicalFromPath(config.canonicalUrl ?? "");
    const imageAbs = toAbsoluteUrl(config.image);

    const structuredData: StructuredData = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: config.title,
      description: safeTrim(config.description, DEFAULT_SEO.defaultDescription),
      datePublished: config.datePublished,
      dateModified: config.dateModified || config.datePublished,
      author: {
        "@type": "Person",
        name: safeTrim(config.authorName, DEFAULT_SEO.siteName),
        ...(config.authorUrl ? { url: config.authorUrl } : {}),
      },
      publisher: {
        "@type": "Organization",
        name: DEFAULT_SEO.siteName,
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": canonical || DEFAULT_SEO.siteUrl,
      },
      ...(imageAbs ? { image: imageAbs } : {}),
      ...(config.tags?.length ? { keywords: config.tags.join(", ") } : {}),
      inLanguage: "en-GB",
    };

    return {
      title: config.title,
      description: config.description,
      canonicalUrl: config.canonicalUrl,
      ogType: "article" as const,
      structuredData,
      ogImage: config.image,
      keywords: config.tags,
    };
  },

  website: (config: {
    title: string;
    description?: string;
    canonicalUrl?: string;
    image?: string;
  }) => {
    const structuredData: StructuredData = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: config.title,
      description: safeTrim(config.description, DEFAULT_SEO.defaultDescription),
      url: safeCanonicalFromPath(config.canonicalUrl ?? DEFAULT_SEO.siteUrl),
      inLanguage: "en-GB",
    };

    return {
      title: config.title,
      description: config.description,
      canonicalUrl: config.canonicalUrl,
      ogType: "website" as const,
      structuredData,
      ogImage: config.image,
    };
  },

  book: (config: {
    title: string;
    description?: string;
    author: string;
    isbn?: string;
    datePublished: string;
    image?: string;
    canonicalUrl?: string;
    publisher?: string;
  }) => {
    const imageAbs = toAbsoluteUrl(config.image);

    const structuredData: StructuredData = {
      "@context": "https://schema.org",
      "@type": "Book",
      name: config.title,
      description: safeTrim(config.description, DEFAULT_SEO.defaultDescription),
      author: { "@type": "Person", name: config.author },
      datePublished: config.datePublished,
      publisher: {
        "@type": "Organization",
        name: safeTrim(config.publisher, DEFAULT_SEO.siteName),
      },
      ...(config.isbn ? { isbn: config.isbn } : {}),
      ...(imageAbs ? { image: imageAbs } : {}),
      inLanguage: "en-GB",
    };

    return {
      title: config.title,
      description: config.description,
      canonicalUrl: config.canonicalUrl,
      ogType: "book" as const,
      structuredData,
      ogImage: config.image,
    };
  },
};