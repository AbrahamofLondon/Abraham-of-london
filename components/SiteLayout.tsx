// components/SiteLayout.tsx — BULLETPROOF (router-free, SSR-safe)
import React from "react";
import Head from "next/head";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

import { getPageTitle, absUrl, siteConfig } from "@/lib/imports";
import { getOgImageUrl, generateOrganizationSchema } from "@/lib/utils/site-utils";

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

  structuredData?: object[];
  noIndex?: boolean;
  noFollow?: boolean;

  themeColor?: string;
  viewport?: string;
  charset?: string;
  lang?: string;

  className?: string;
  skipToContentId?: string;

  errorBoundary?: React.ComponentType<{ children: React.ReactNode }>;
  showOrganizationSchema?: boolean;

  /** Make header transparent (your Header.tsx supports this) */
  headerTransparent?: boolean;

  /**
   * ✅ SINGLE-HEADER CONTROL:
   * If you already render <Header/> elsewhere (e.g. Layout.tsx),
   * set withChrome={false} to prevent a second header/footer.
   */
  withChrome?: boolean;

  /** Optional: current path for canonical URL (if not provided, uses absUrl("/")) */
  currentPath?: string;
}

const DEFAULT_CONFIG = {
  viewport: "width=device-width, initial-scale=1.0, viewport-fit=cover",
  charset: "UTF-8",
  lang: "en",
  themeColor: siteConfig.brand.primaryColor || "#d4af37",
  ogType: "website",
  twitterCard: "summary_large_image" as const,
} as const;

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

class LayoutErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Layout Error:", error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex min-h-screen items-center justify-center bg-black text-white" role="alert" aria-live="polite">
            <div className="max-w-md p-8 text-center">
              <h1 className="mb-4 text-2xl font-semibold">Layout Error</h1>
              <p className="mb-6 text-white/60">
                We&apos;re experiencing technical difficulties. Please try refreshing the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold hover:bg-white/10 transition-colors"
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

const SkipToContent: React.FC<{ targetId: string }> = ({ targetId }) => (
  <a
    href={`#${targetId}`}
    className="sr-only z-[9999] rounded-lg bg-white px-4 py-2 font-medium text-black shadow-lg transition-all duration-200
               focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:ring-2 focus:ring-amber-500"
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

  structuredData = [],
  noIndex = false,
  noFollow = false,

  themeColor = DEFAULT_CONFIG.themeColor,
  viewport = DEFAULT_CONFIG.viewport,
  charset = DEFAULT_CONFIG.charset,
  lang = DEFAULT_CONFIG.lang,

  className = "",
  skipToContentId = "main-content",
  errorBoundary: ErrorBoundary = LayoutErrorBoundary,

  showOrganizationSchema = true,
  headerTransparent = false,
  withChrome = true,
  currentPath = "/", // Optional: allow parent to pass path
}: SiteLayoutProps) {
  // ========== NO ROUTER HOOK ==========
  // Using provided currentPath or default "/"
  const path = currentPath;

  // ========== MEMOIZED VALUES (all safe during SSR) ==========
  const fullTitle = React.useMemo(() => getPageTitle(pageTitle), [pageTitle]);

  const fullCanonicalUrl = React.useMemo(
    () => canonicalUrl || absUrl(path),
    [canonicalUrl, path]
  );

  const robotsContent = React.useMemo(() => {
    const directives: string[] = [];
    if (noIndex) directives.push("noindex");
    if (noFollow) directives.push("nofollow");
    if (!directives.length) directives.push("index", "follow");
    return directives.join(", ");
  }, [noIndex, noFollow]);

  const description = React.useMemo(
    () => metaDescription || siteConfig.seo.description,
    [metaDescription]
  );

  const ogImageAbs = React.useMemo(() => getOgImageUrl(ogImage), [ogImage]);

  const defaultMetaTags: MetaTag[] = React.useMemo(
    () => [
      { name: "description", content: description },
      { name: "robots", content: robotsContent },
      { name: "theme-color", content: themeColor },

      { property: "og:title", content: fullTitle },
      { property: "og:type", content: ogType },
      { property: "og:url", content: fullCanonicalUrl },
      { property: "og:image", content: ogImageAbs },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:description", content: description },
      { property: "og:site_name", content: siteConfig.brand.name },
      { property: "og:locale", content: "en_GB" },

      { name: "twitter:card", content: twitterCard },
      { name: "twitter:title", content: fullTitle },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: ogImageAbs },

      ...(siteConfig.seo.twitterHandle
        ? [
            { name: "twitter:site", content: siteConfig.seo.twitterHandle },
            { name: "twitter:creator", content: siteConfig.seo.twitterHandle },
          ]
        : []),
    ],
    [
      description,
      robotsContent,
      themeColor,
      fullTitle,
      ogType,
      fullCanonicalUrl,
      ogImageAbs,
      twitterCard,
    ]
  );

  const defaultLinkTags: LinkTag[] = React.useMemo(
    () => [
      { rel: "canonical", href: fullCanonicalUrl },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", href: "/icon0.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.json" },
      ...(siteConfig.brand.favicon ? [{ rel: "shortcut icon", href: siteConfig.brand.favicon }] : []),
    ],
    [fullCanonicalUrl]
  );

  const allMetaTags = React.useMemo(() => {
    const merged = [...defaultMetaTags, ...metaTags];
    return merged.filter(
      (tag, index, array) =>
        array.findIndex(
          (t) =>
            (t.name && t.name === tag.name) ||
            (t.property && t.property === tag.property) ||
            (t.key && t.key === tag.key)
        ) === index
    );
  }, [defaultMetaTags, metaTags]);

  const allLinkTags = React.useMemo(() => {
    const merged = [...defaultLinkTags, ...linkTags];
    return merged.filter(
      (tag, index, array) =>
        array.findIndex((t) => t.rel === tag.rel && t.href === tag.href) === index
    );
  }, [defaultLinkTags, linkTags]);

  const allStructuredData = React.useMemo(() => {
    const data = [...structuredData];
    if (showOrganizationSchema) data.push(generateOrganizationSchema());
    return data;
  }, [structuredData, showOrganizationSchema]);

  // ========== RENDER (always safe) ==========
  return (
    <>
      <Head>
        <title>{fullTitle}</title>
        <meta charSet={charset} />
        <meta name="viewport" content={viewport} />

        {allMetaTags.map((tag, index) => (
          <meta
            key={tag.key || `meta-${tag.name || tag.property || index}`}
            {...(tag.name ? { name: tag.name } : {})}
            {...(tag.property ? { property: tag.property } : {})}
            content={tag.content}
          />
        ))}

        {allLinkTags.map((tag, index) => (
          <link
            key={tag.key || `link-${tag.rel}-${index}`}
            rel={tag.rel}
            href={tag.href}
            {...(tag.sizes ? { sizes: tag.sizes } : {})}
            {...(tag.type ? { type: tag.type } : {})}
          />
        ))}

        {/* Optional keywords */}
        {siteConfig.seo.keywords?.length ? (
          <meta name="keywords" content={siteConfig.seo.keywords.join(", ")} />
        ) : null}
      </Head>

      {/* Structured data */}
      {allStructuredData.map((data, index) => (
        <script
          key={`structured-data-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}

      <SkipToContent targetId={skipToContentId} />

      <ErrorBoundary>
        <div
          className={[
            "min-h-screen flex flex-col bg-black text-white antialiased",
            className,
          ].join(" ")}
          data-lang={lang}
          style={
            {
              // optional CSS vars for downstream use
              ["--color-primary" as any]: siteConfig.brand.primaryColor,
              ["--color-accent" as any]: siteConfig.brand.accentColor,
            } as React.CSSProperties
          }
        >
          {/* ✅ Only render chrome here if withChrome=true */}
          {withChrome ? <Header transparent={headerTransparent} /> : null}

          {/* ✅ FIXED HEADER OFFSET (h-20 = pt-20) */}
          <main
            id={skipToContentId}
            className={["flex-1 focus:outline-none", withChrome ? "pt-20" : ""].join(" ")}
            tabIndex={-1}
          >
            {children}
          </main>

          {withChrome ? <Footer /> : null}
        </div>
      </ErrorBoundary>
    </>
  );
}

/* ========== BULLETPROOF HOOK (now router-free, accepts path prop) ========== */
export function usePageMetadata(
  title: string,
  description?: string,
  additionalMeta: Partial<SiteLayoutProps> = {},
  currentPath?: string
) {
  // No router! Just use provided path or default
  const path = currentPath || "/";

  return React.useMemo(
    () => ({
      pageTitle: title,
      metaDescription: description,
      canonicalUrl: absUrl(path),
      ...additionalMeta,
    }),
    [title, description, path, additionalMeta]
  );
}

/* ========== BULLETPROOF HOC ========== */
export function withSiteLayout<P extends object>(
  Component: React.ComponentType<P>,
  layoutProps: Omit<SiteLayoutProps, "children">
) {
  function LayoutWrapper(props: P) {
    // If the wrapped component has a getLayout function, respect it
    const ComponentWithLayout = Component as any;
    if (ComponentWithLayout.getLayout) {
      return ComponentWithLayout.getLayout(<Component {...props} />);
    }

    return (
      <SiteLayout {...layoutProps}>
        <Component {...props} />
      </SiteLayout>
    );
  }
  
  LayoutWrapper.displayName = `withSiteLayout(${Component.displayName || Component.name || "Component"})`;
  return LayoutWrapper;
}

/* ========== SAFE UTILITY ========== */
export function generateStructuredData(
  type: "Article" | "WebPage" | "Organization" | "Person" | "Book",
  data: object
) {
  return {
    "@context": "https://schema.org",
    "@type": type,
    ...data,
  };
}