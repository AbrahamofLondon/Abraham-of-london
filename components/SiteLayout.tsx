// components/SiteLayout.tsx - FIXED
import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { getPageTitle, absUrl } from '@/lib/imports'; // This now works!
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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

const DEFAULT_CONFIG = {
  viewport: "width=device-width, initial-scale=1.0, viewport-fit=cover",
  charset: "UTF-8",
  lang: "en",
  themeColor: "#ffffff",
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

class LayoutErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
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
            className="flex min-h-screen items-center justify-center bg-gray-50"
            role="alert"
            aria-live="polite"
          >
            <div className="max-w-md p-8 text-center">
              <h1 className="mb-4 text-2xl font-bold text-gray-900">
                Layout Error
              </h1>
              <p className="mb-6 text-gray-600">
                We&apos;re experiencing technical difficulties. Please try
                refreshing the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
    className="sr-only z-50 rounded-lg bg-white px-4 py-2 font-medium text-gray-900 shadow-lg transition-all duration-200 focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:ring-2 focus:ring-blue-500"
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
  const currentPath = router.asPath || "/";

  const fullTitle = React.useMemo(() => getPageTitle(pageTitle), [pageTitle]);

  const fullCanonicalUrl = React.useMemo(
    () => canonicalUrl || absUrl(currentPath),
    [canonicalUrl, currentPath]
  );

  const robotsContent = React.useMemo(() => {
    const directives: string[] = [];
    if (noIndex) directives.push("noindex");
    if (noFollow) directives.push("nofollow");
    if (!directives.length) directives.push("index", "follow");
    return directives.join(", ");
  }, [noIndex, noFollow]);

  const defaultDescription =
    metaDescription ||
    "Abraham of London — strategy, fatherhood, and legacy for a world that has lost its bearings.";

  const defaultOgImageAbs = absUrl(
    ogImage || "/assets/images/social/og-image.jpg"
  );
  const defaultTwitterImageAbs = absUrl(
    ogImage || "/assets/images/social/twitter-image.jpg"
  );

  const defaultMetaTags: MetaTag[] = React.useMemo(
    () => [
      { name: "description", content: defaultDescription },
      { name: "robots", content: robotsContent },
      { name: "theme-color", content: themeColor },
      { property: "og:title", content: fullTitle },
      { property: "og:type", content: ogType },
      { property: "og:url", content: fullCanonicalUrl },
      { property: "og:image", content: defaultOgImageAbs },
      { property: "og:description", content: defaultDescription },
      { property: "og:site_name", content: "Abraham of London" },
      { property: "og:locale", content: "en_GB" },
      { name: "twitter:card", content: twitterCard },
      { name: "twitter:title", content: fullTitle },
      { name: "twitter:description", content: defaultDescription },
      { name: "twitter:image", content: defaultTwitterImageAbs },
    ],
    [
      defaultDescription,
      robotsContent,
      themeColor,
      fullTitle,
      ogType,
      fullCanonicalUrl,
      defaultOgImageAbs,
      defaultTwitterImageAbs,
      twitterCard,
    ]
  );

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

  const allMetaTags = React.useMemo(
    () =>
      [...defaultMetaTags, ...metaTags].filter(
        (tag, index, array) =>
          array.findIndex(
            (t) =>
              (t.name && t.name === tag.name) ||
              (t.property && t.property === tag.property) ||
              (t.key && t.key === tag.key)
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

  const structuredDataScript = structuredData ? (
    <script
      key="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  ) : null;

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

        <link
          rel="preload"
          href="/fonts/Inter-Variable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
          key="font-preload-inter"
        />
        <link
          rel="preload"
          href="/fonts/PlayfairDisplay-Variable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
          key="font-preload-playfair"
        />
      </Head>

      {structuredDataScript}

      <SkipToContent targetId={skipToContentId} />

      <ErrorBoundary>
        <div
          className={`flex min-h-screen flex-col bg-warmWhite text-soft-charcoal antialiased ${className}`}
          data-lang={lang}
        >
          <Header initialTheme="light" />
          <main
            id={skipToContentId}
            className="flex-1 focus:outline-none"
            tabIndex={-1}
          >
            {children}
          </main>
          <Footer />
        </div>
      </ErrorBoundary>
    </>
  );
}

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

export function generateStructuredData(
  type: "Article" | "WebPage" | "Organization",
  data: object
) {
  return {
    "@context": "https://schema.org",
    "@type": type,
    ...data,
  };
}