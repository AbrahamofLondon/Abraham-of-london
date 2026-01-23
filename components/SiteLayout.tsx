// components/SiteLayout.tsx - ENHANCED VERSION
import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { getPageTitle, absUrl, siteConfig } from '@/lib/imports';
import { getOgImageUrl, generateOrganizationSchema } from '@/lib/utils/site-utils';
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

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Layout Error:", error, errorInfo);
  }

  override render() {
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

  const defaultDescription = React.useMemo(
    () => metaDescription || siteConfig.seo.description,
    [metaDescription]
  );

  const defaultOgImageAbs = React.useMemo(
    () => getOgImageUrl(ogImage),
    [ogImage]
  );

  const defaultTwitterImageAbs = React.useMemo(
    () => getOgImageUrl(ogImage),
    [ogImage]
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
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:description", content: defaultDescription },
      { property: "og:site_name", content: siteConfig.brand.name },
      { property: "og:locale", content: "en_GB" },
      { name: "twitter:card", content: twitterCard },
      { name: "twitter:title", content: fullTitle },
      { name: "twitter:description", content: defaultDescription },
      { name: "twitter:image", content: defaultTwitterImageAbs },
      ...(siteConfig.seo.twitterHandle ? [
        { name: "twitter:site", content: siteConfig.seo.twitterHandle },
        { name: "twitter:creator", content: siteConfig.seo.twitterHandle },
      ] : []),
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
      ...(siteConfig.brand.favicon ? [
        { rel: "shortcut icon", href: siteConfig.brand.favicon },
      ] : []),
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

  // Add organization schema by default
  const allStructuredData = React.useMemo(() => {
    const data = [...structuredData];
    if (showOrganizationSchema) {
      data.push(generateOrganizationSchema());
    }
    return data;
  }, [structuredData, showOrganizationSchema]);

  const structuredDataScripts = allStructuredData.map((data, index) => (
    <script
      key={`structured-data-${index}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  ));

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

        {/* Font preloading */}
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

        {/* Keywords meta tag */}
        {siteConfig.seo.keywords && siteConfig.seo.keywords.length > 0 && (
          <meta name="keywords" content={siteConfig.seo.keywords.join(', ')} />
        )}
      </Head>

      {structuredDataScripts}

      <SkipToContent targetId={skipToContentId} />

      <ErrorBoundary>
        <div
          className={`flex min-h-screen flex-col bg-warmWhite text-soft-charcoal antialiased ${className}`}
          data-lang={lang}
          style={{
            '--color-primary': siteConfig.brand.primaryColor,
            '--color-accent': siteConfig.brand.accentColor,
          } as React.CSSProperties}
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
  const router = useRouter();
  const currentPath = router.asPath || "/";

  return React.useMemo(
    () => ({
      pageTitle: title,
      metaDescription: description,
      canonicalUrl: absUrl(currentPath),
      ...additionalMeta,
    }),
    [title, description, currentPath, additionalMeta]
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
  type: "Article" | "WebPage" | "Organization" | "Person" | "Book",
  data: object
) {
  return {
    "@context": "https://schema.org",
    "@type": type,
    ...data,
  };
}

// Helper to generate article schema
export function generateArticleSchema({
  headline,
  description,
  author = siteConfig.author.name,
  publisher = siteConfig.brand.name,
  datePublished,
  dateModified,
  image,
  url,
}: {
  headline: string;
  description: string;
  author?: string;
  publisher?: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  url?: string;
}) {
  return generateStructuredData("Article", {
    headline,
    description,
    author: {
      "@type": "Person",
      name: author,
    },
    publisher: {
      "@type": "Organization",
      name: publisher,
      logo: {
        "@type": "ImageObject",
        url: absUrl(siteConfig.brand.logo || '/assets/images/abraham-logo.jpg'),
      },
    },
    datePublished,
    dateModified: dateModified || datePublished,
    image: image ? absUrl(image) : getOgImageUrl(),
    url: url ? absUrl(url) : absUrl(),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url ? absUrl(url) : absUrl(),
    },
  });
}

// Helper to generate person schema
export function generatePersonSchema() {
  return generateStructuredData("Person", {
    name: siteConfig.author.name,
    description: siteConfig.author.bio || siteConfig.seo.description,
    image: absUrl(siteConfig.author.image || '/assets/images/profile-portrait.webp'),
    email: siteConfig.author.email,
    jobTitle: siteConfig.author.title,
    worksFor: {
      "@type": "Organization",
      name: siteConfig.brand.name,
    },
    sameAs: siteConfig.socials
      .filter(s => ['x', 'linkedin', 'instagram', 'youtube', 'facebook'].includes(s.kind))
      .map(s => s.href),
  });
}