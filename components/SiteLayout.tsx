// components/SiteLayout.tsx
import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { absUrl, getPageTitle, siteConfig } from "@/lib/siteConfig";

// Types for enhanced type safety
interface MetaTag {
  name?: string;
  property?: string;
  content: string;
  key?: string;
}

interface LinkTag {
  rel: string;
  href: string;
  sizes?: string;
  type?: string;
  key?: string;
}

interface SiteLayoutProps {
  pageTitle: string;
  children: React.ReactNode;
  metaDescription?: string;
  metaTags?: MetaTag[];
  linkTags?: LinkTag[];
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: "website" | "article" | "profile" | "book" | string;
  twitterCard?: "summary" | "summary_large_image" | "app" | "player";
  structuredData?: object;
  noIndex?: boolean;
  noFollow?: boolean;
  themeColor?: string;
  viewport?: string;
  charset?: string;
  lang?: string;
  className?: string;
  skipToContentId?: string;
  errorBoundary?: React.ComponentType<{ children: React.ReactNode }>;
}

// Default configuration
const DEFAULT_CONFIG = {
  viewport: "width=device-width, initial-scale=1.0, viewport-fit=cover",
  charset: "UTF-8",
  lang: "en",
  themeColor: "#ffffff",
  ogType: "website",
  twitterCard: "summary_large_image" as const,
} as const;

// Error Boundary Component
class LayoutErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    fallback?: React.ReactNode;
  },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Layout Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div
            className="min-h-screen flex items-center justify-center bg-gray-50"
            role="alert"
            aria-live="polite"
          >
            <div className="text-center p-8 max-w-md">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Layout Error
              </h1>
              <p className="text-gray-600 mb-6">
                We&apos;re experiencing technical difficulties. Please try
                refreshing the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Skip to content component for accessibility
const SkipToContent: React.FC<{ targetId: string }> = ({ targetId }) => (
  <a
    href={`#${targetId}`}
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-white text-gray-900 px-4 py-2 rounded-lg shadow-lg font-medium transition-all duration-200 focus:ring-2 focus:ring-blue-500"
  >
    Skip to main content
  </a>
);

export default function SiteLayout({
  pageTitle,
  children,
  metaDescription,
  metaTags = [],
  linkTags = [],
  canonicalUrl,
  ogImage,
  ogType = DEFAULT_CONFIG.ogType,
  twitterCard = DEFAULT_CONFIG.twitterCard,
  structuredData,
  noIndex = false,
  noFollow = false,
  themeColor = DEFAULT_CONFIG.themeColor,
  viewport = DEFAULT_CONFIG.viewport,
  charset = DEFAULT_CONFIG.charset,
  lang = DEFAULT_CONFIG.lang,
  className = "",
  skipToContentId = "main-content",
  errorBoundary: ErrorBoundary = LayoutErrorBoundary,
}: SiteLayoutProps) {
  const router = useRouter();
  const currentPath = router.asPath;

  // Build full page title using siteConfig helper
  const fullTitle = React.useMemo(
    () => getPageTitle(pageTitle),
    [pageTitle]
  );

  // Build canonical URL
  const fullCanonicalUrl = React.useMemo(() => {
    if (canonicalUrl) return canonicalUrl;
    return absUrl(currentPath || "/");
  }, [canonicalUrl, currentPath]);

  // Build meta robots content
  const robotsContent = React.useMemo(() => {
    const directives: string[] = [];
    if (noIndex) directives.push("noindex");
    if (noFollow) directives.push("nofollow");
    if (directives.length === 0) directives.push("index", "follow");
    return directives.join(", ");
  }, [noIndex, noFollow]);

  // Default meta tags
  const defaultMetaTags: MetaTag[] = React.useMemo(
    () => [
      {
        name: "description",
        content:
          metaDescription ||
          "Abraham of London — strategy, fatherhood, and legacy for a world that has lost its bearings.",
      },
      { name: "robots", content: robotsContent },
      { name: "theme-color", content: themeColor },

      // Open Graph
      { property: "og:title", content: fullTitle },
      { property: "og:type", content: ogType },
      { property: "og:url", content: fullCanonicalUrl },
      {
        property: "og:image",
        content: ogImage || "/assets/images/social/og-image.jpg",
      },
      {
        property: "og:description",
        content:
          metaDescription ||
          "Abraham of London — strategy, fatherhood, and legacy for a world that has lost its bearings.",
      },
      { property: "og:site_name", content: siteConfig.title },
      { property: "og:locale", content: "en_GB" },

      // Twitter Card
      { name: "twitter:card", content: twitterCard },
      { name: "twitter:title", content: fullTitle },
      {
        name: "twitter:description",
        content:
          metaDescription ||
          "Abraham of London — strategy, fatherhood, and legacy for a world that has lost its bearings.",
      },
      {
        name: "twitter:image",
        content: ogImage || "/assets/images/social/twitter-image.jpg",
      },

      // Additional useful meta tags
      { name: "viewport", content: viewport },
      { name: "charset", content: charset },
    ],
    [
      metaDescription,
      robotsContent,
      themeColor,
      fullTitle,
      ogType,
      fullCanonicalUrl,
      ogImage,
      twitterCard,
      viewport,
      charset,
    ]
  );

  // Default link tags
  const defaultLinkTags: LinkTag[] = React.useMemo(
    () => [
      { rel: "canonical", href: fullCanonicalUrl },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", href: "/icon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.json" },
    ],
    [fullCanonicalUrl]
  );

  // Combine default and custom tags
  const allMetaTags = React.useMemo(
    () =>
      [...defaultMetaTags, ...metaTags].filter(
        (tag, index, array) =>
          array.findIndex(
            (t) =>
              (t.name === tag.name && t.property === tag.property) ||
              t.key === tag.key
          ) === index
      ),
    [defaultMetaTags, metaTags]
  );

  const allLinkTags = React.useMemo(
    () =>
      [...defaultLinkTags, ...linkTags].filter(
        (tag, index, array) =>
          array.findIndex((t) => t.rel === tag.rel && t.href === tag.href) ===
          index
      ),
    [defaultLinkTags, linkTags]
  );

  // Structured data for SEO
  const structuredDataScript = structuredData ? (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      key="structured-data"
    />
  ) : null;

  return (
    <>
      <Head>
        {/* Primary Meta Tags */}
        <title>{fullTitle}</title>
        <meta charSet={charset} />
        <meta name="viewport" content={viewport} />

        {/* Meta Tags */}
        {allMetaTags.map((tag, index) => (
          <meta
            key={tag.key || `meta-${tag.name || tag.property}-${index}`}
            {...(tag.name && { name: tag.name })}
            {...(tag.property && { property: tag.property })}
            content={tag.content}
          />
        ))}

        {/* Link Tags */}
        {allLinkTags.map((tag, index) => (
          <link
            key={tag.key || `link-${tag.rel}-${index}`}
            rel={tag.rel}
            href={tag.href}
            {...(tag.sizes && { sizes: tag.sizes })}
            {...(tag.type && { type: tag.type })}
          />
        ))}

        {/* Preload critical resources */}
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
          key="font-preload"
        />

        {/* Performance hints */}
        <link rel="dns-prefetch" href="//cdn.abrahamoflondon.org" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </Head>

      {/* Structured Data */}
      {structuredDataScript}

      {/* Accessibility: Skip to content */}
      <SkipToContent targetId={skipToContentId} />

      {/* Main Layout */}
      <ErrorBoundary>
        <div
          className={`min-h-screen flex flex-col bg-white text-gray-900 antialiased ${className}`}
          lang={lang}
        >
          <main
            id={skipToContentId}
            className="flex-1 focus:outline-none"
            tabIndex={-1}
          >
            {children}
          </main>
        </div>
      </ErrorBoundary>

      {/* Analytics Script - Load after content */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
          `,
        }}
      />
    </>
  );
}

// Hook for page metadata management
export function usePageMetadata(
  title: string,
  description?: string,
  additionalMeta: Partial<SiteLayoutProps> = {}
) {
  return React.useMemo(
    () => ({
      pageTitle: title,
      metaDescription: description,
      ...additionalMeta,
    }),
    [title, description, additionalMeta]
  );
}

// Higher Order Component for page-level layouts
export function withSiteLayout<P extends object>(
  Component: React.ComponentType<P>,
  layoutProps: Omit<SiteLayoutProps, "children">
) {
  return function LayoutWrapper(props: P) {
    return (
      <SiteLayout {...layoutProps}>
        <Component {...props} />
      </SiteLayout>
    );
  };
}

// Utility function for generating structured data
export function generateStructuredData(
  type: "Article" | "WebPage" | "Organization",
  data: object
) {
  const baseStructure = {
    "@context": "https://schema.org",
    "@type": type,
  };

  return { ...baseStructure, ...data };
}