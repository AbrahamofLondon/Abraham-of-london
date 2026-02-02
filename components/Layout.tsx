/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { getPageTitle, absUrl, siteConfig } from '@/lib/imports';
import { getOgImageUrl, generateOrganizationSchema } from '@/lib/utils/site-utils';
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// --- Interfaces ---

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
  structuredData?: any; // High-tolerance type for schema objects
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

// --- Error Boundary ---

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
          <div className="flex min-h-screen items-center justify-center bg-gray-50" role="alert" aria-live="polite">
            <div className="max-w-md p-8 text-center">
              <h1 className="mb-4 text-2xl font-bold text-gray-900">Layout Error</h1>
              <p className="mb-6 text-gray-600">We&apos;re experiencing technical difficulties. Please refresh.</p>
              <button onClick={() => window.location.reload()} className="rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700">
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

// --- Components ---

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

  // --- Memoized Values ---

  const fullTitle = React.useMemo(() => getPageTitle(pageTitle), [pageTitle]);
  const fullCanonicalUrl = React.useMemo(() => canonicalUrl || absUrl(currentPath), [canonicalUrl, currentPath]);
  
  const robotsContent = React.useMemo(() => {
    const directives: string[] = [];
    if (noIndex) directives.push("noindex");
    if (noFollow) directives.push("nofollow");
    if (!directives.length) directives.push("index", "follow");
    return directives.join(", ");
  }, [noIndex, noFollow]);

  const defaultDescription = React.useMemo(() => metaDescription || siteConfig.seo.description, [metaDescription]);
  const siteOgImage = React.useMemo(() => getOgImageUrl(ogImage), [ogImage]);

  const allMetaTags = React.useMemo(() => {
    const defaults: MetaTag[] = [
      { name: "description", content: defaultDescription },
      { name: "robots", content: robotsContent },
      { name: "theme-color", content: themeColor },
      { property: "og:title", content: fullTitle },
      { property: "og:type", content: ogType },
      { property: "og:url", content: fullCanonicalUrl },
      { property: "og:image", content: siteOgImage },
      { property: "og:description", content: defaultDescription },
      { property: "og:site_name", content: siteConfig.brand.name },
      { name: "twitter:card", content: twitterCard },
      { name: "twitter:title", content: fullTitle },
      { name: "twitter:description", content: defaultDescription },
      { name: "twitter:image", content: siteOgImage },
    ];
    
    return [...defaults, ...metaTags].filter(
      (tag, index, array) =>
        array.findIndex((t) => (t.name && t.name === tag.name) || (t.property && t.property === tag.property)) === index
    );
  }, [defaultDescription, robotsContent, themeColor, fullTitle, ogType, fullCanonicalUrl, siteOgImage, twitterCard, metaTags]);

  const allLinkTags = React.useMemo(() => {
    const defaults: LinkTag[] = [
      { rel: "canonical", href: fullCanonicalUrl },
      { rel: "icon", href: "/favicon.ico" },
    ];
    return [...defaults, ...linkTags].filter((tag, index, array) => array.findIndex((t) => t.rel === tag.rel && t.href === tag.href) === index);
  }, [fullCanonicalUrl, linkTags]);

  // --- Hardened Structured Data Rendering ---

  const structuredDataScripts = React.useMemo(() => {
    const dataArray: any[] = [];
    
    // Safety check for structuredData input
    if (Array.isArray(structuredData)) {
      dataArray.push(...structuredData);
    } else if (structuredData && typeof structuredData === 'object') {
      dataArray.push(structuredData);
    }

    if (showOrganizationSchema) {
      dataArray.push(generateOrganizationSchema());
    }

    return dataArray
      .filter(item => item && typeof item === 'object')
      .map((data, index) => {
        try {
          const jsonString = JSON.stringify(data, (_k, v) => {
           if (typeof v === "function") return undefined;
           if (typeof v === "symbol") return undefined;
           if (typeof v === "bigint") return v.toString();
           return v;
        });
        } catch (e) {
          console.error("Failed to stringify schema object", e);
          return null;
        }
      });
  }, [structuredData, showOrganizationSchema]);

  return (
    <>
      <Head>
        <title>{fullTitle}</title>
        <meta charSet={charset} />
        <meta name="viewport" content={viewport} />

        {allMetaTags.map((tag, index) => (
          <meta key={`meta-${index}`} {...(tag.name ? { name: tag.name } : {})} {...(tag.property ? { property: tag.property } : {})} content={tag.content} />
        ))}

        {allLinkTags.map((tag, index) => (
          <link key={`link-${index}`} rel={tag.rel} href={tag.href} {...(tag.sizes ? { sizes: tag.sizes } : {})} {...(tag.type ? { type: tag.type } : {})} />
        ))}

        {/* ✅ INJECTED INTO HEAD AS PRIMITIVES */}
        <React.Fragment>
          {structuredDataScripts}
        </React.Fragment>

        {/* Font Preloading */}
        <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/PlayfairDisplay-Variable.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />

        {siteConfig.seo.keywords?.length > 0 && (
          <meta name="keywords" content={siteConfig.seo.keywords.join(', ')} />
        )}
      </Head>

      <SkipToContent targetId={skipToContentId} />

      <ErrorBoundary>
        <div
          className={`flex min-h-screen flex-col bg-warmWhite text-soft-charcoal antialiased ${className}`}
          style={{
            '--color-primary': siteConfig.brand.primaryColor,
            '--color-accent': siteConfig.brand.accentColor,
          } as React.CSSProperties}
        >
          <Header initialTheme="light" />
          <main id={skipToContentId} className="flex-1 focus:outline-none" tabIndex={-1}>
            {children}
          </main>
          <Footer />
        </div>
      </ErrorBoundary>
    </>
  );
}

// --- Helper Functions ---

export function generateStructuredData(type: string, data: object) {
  return { "@context": "https://schema.org", "@type": type, ...data };
}

export function generateArticleSchema({ headline, description, author = siteConfig.author.name, datePublished, image, url }: any) {
  return generateStructuredData("Article", {
    headline,
    description,
    author: { "@type": "Person", name: author },
    datePublished,
    image: image ? absUrl(image) : getOgImageUrl(),
    url: url ? absUrl(url) : absUrl(),
  });
}