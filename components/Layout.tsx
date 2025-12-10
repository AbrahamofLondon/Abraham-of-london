// components/Layout.tsx - COMPLETE FIXED VERSION
import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";

// Dynamically import components for better performance
const LuxuryNavbar = dynamic(() => import("@/components/LuxuryNavbar"), {
  ssr: true,
  loading: () => (
    <div className="h-16 bg-gradient-to-b from-gray-900 to-black border-b border-gray-800" />
  ),
});

const Footer = dynamic(() => import("@/components/Footer"), {
  ssr: true,
  loading: () => (
    <div className="h-64 bg-gradient-to-b from-black to-gray-900" />
  ),
});

// Types for structured data (JSON-LD)
export interface StructuredData {
  "@context": string;
  "@type": string;
  [key: string]: any;
}

// Extended Layout props to support all use cases
export type LayoutProps = {
  children: React.ReactNode;
  // Title options
  title?: string;
  pageTitle?: string;
  
  // SEO metadata
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  
  // Open Graph / Twitter metadata
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  
  // Structured data (JSON-LD)
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

// Helper function to get page title
const getPageTitle = (title?: string): string => {
  const baseTitle = "Abraham of London";
  if (!title) return baseTitle;
  if (title.includes(baseTitle)) return title;
  return `${title} | ${baseTitle}`;
};

// Default SEO configuration
const DEFAULT_SEO = {
  siteName: "Abraham of London",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org",
  defaultDescription: "Faith-rooted strategy and leadership for fathers, founders, and board-level leaders who refuse to outsource responsibility.",
  defaultOgImage: "/api/og/default",
  defaultOgType: "website",
  defaultTwitterCard: "summary_large_image",
  twitterHandle: "@abrahamoflondon",
} as const;

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
  const [isClient, setIsClient] = React.useState(false);
  
  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Get the effective title
  const effectiveTitle = getPageTitle(title ?? pageTitle);
  
  // Build full description with fallback
  const fullDescription = description || DEFAULT_SEO.defaultDescription;
  
  // Build canonical URL with default
  const fullCanonicalUrl = canonicalUrl || `${DEFAULT_SEO.siteUrl}${router.asPath}`;
  
  // Build ogImage URL
  const fullOgImage = ogImage 
    ? ogImage.startsWith('http') 
      ? ogImage 
      : `${DEFAULT_SEO.siteUrl}${ogImage}`
    : `${DEFAULT_SEO.siteUrl}${DEFAULT_SEO.defaultOgImage}`;

  // Responsive container classes
  const containerClass = fullWidth 
    ? "w-full"
    : "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

  return (
    <div
      className={`min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white text-gray-900 dark:from-gray-950 dark:to-black dark:text-white ${className} ${
        mobileFriendly ? 'touch-manipulation' : ''
      }`}
    >
      <Head>
        {/* Viewport for responsive design */}
        <meta 
          name="viewport" 
          content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" 
        />
        
        {/* Basic metadata */}
        <title>{effectiveTitle}</title>
        <meta name="description" content={fullDescription} />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        
        {/* Keywords */}
        {keywords.length > 0 && (
          <meta name="keywords" content={keywords.join(', ')} />
        )}
        
        {/* Canonical URL */}
        <link rel="canonical" href={fullCanonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:title" content={effectiveTitle} />
        <meta property="og:description" content={fullDescription} />
        <meta property="og:type" content={ogType} />
        <meta property="og:url" content={fullCanonicalUrl} />
        <meta property="og:image" content={fullOgImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content={DEFAULT_SEO.siteName} />
        <meta property="og:locale" content="en_GB" />
        
        {/* Twitter */}
        <meta name="twitter:card" content={twitterCard} />
        <meta name="twitter:site" content={DEFAULT_SEO.twitterHandle} />
        <meta name="twitter:creator" content={DEFAULT_SEO.twitterHandle} />
        <meta name="twitter:title" content={effectiveTitle} />
        <meta name="twitter:description" content={fullDescription} />
        <meta name="twitter:image" content={fullOgImage} />
        
        {/* Structured data (JSON-LD) */}
        {structuredData && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(structuredData)
            }}
          />
        )}
        
        {/* Additional head elements */}
        {additionalHead}
      </Head>

      {/* Header */}
      <LuxuryNavbar variant="dark" transparent={transparentHeader} />

      {/* Main Content */}
      <main className={`flex-1 ${containerClass} pt-8`}>
        {children}
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile optimizations */}
      {isClient && (
        <style jsx global>{`
          /* Mobile optimizations */
          @media (max-width: 768px) {
            /* Prevent zoom on iOS inputs */
            input, 
            select,
            textarea {
              font-size: 16px !important;
            }
            
            /* Better touch targets */
            button,
            a[role="button"],
            .touch-target {
              min-height: 44px;
              min-width: 44px;
            }
          }
          
          /* Reduce motion for accessibility */
          @media (prefers-reduced-motion: reduce) {
            *,
            *::before,
            *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }
          
          /* Smooth scrolling */
          html {
            scroll-behavior: smooth;
          }
          
          /* Focus styles for accessibility */
          *:focus-visible {
            outline: 2px solid #f59e0b;
            outline-offset: 2px;
          }
          
          /* Improve text rendering */
          * {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
          }
          
          /* Line clamp utilities */
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .line-clamp-3 {
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .line-clamp-4 {
            display: -webkit-box;
            -webkit-line-clamp: 4;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `}</style>
      )}
    </div>
  );
}

// Helper functions for common Layout configurations
export const LayoutHelpers = {
  /**
   * Creates Article layout configuration
   */
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
    const structuredData: StructuredData = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": config.title,
      "description": config.description || DEFAULT_SEO.defaultDescription,
      "datePublished": config.datePublished,
      "dateModified": config.dateModified || config.datePublished,
      "author": {
        "@type": "Person",
        "name": config.authorName || DEFAULT_SEO.siteName,
        ...(config.authorUrl ? { "url": config.authorUrl } : {})
      },
      "publisher": {
        "@type": "Organization",
        "name": DEFAULT_SEO.siteName,
        "logo": {
          "@type": "ImageObject",
          "url": `${DEFAULT_SEO.siteUrl}/images/logo.png`,
          "width": 512,
          "height": 512
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": config.canonicalUrl || `${DEFAULT_SEO.siteUrl}`
      },
      ...(config.image ? { 
        "image": config.image.startsWith('http') 
          ? config.image 
          : `${DEFAULT_SEO.siteUrl}${config.image}`
      } : {}),
      ...(config.tags ? { "keywords": config.tags.join(', ') } : {})
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

  /**
   * Creates Website layout configuration
   */
  website: (config: {
    title: string;
    description?: string;
    canonicalUrl?: string;
    image?: string;
  }) => {
    const structuredData: StructuredData = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": config.title,
      "description": config.description || DEFAULT_SEO.defaultDescription,
      "url": config.canonicalUrl || DEFAULT_SEO.siteUrl,
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${DEFAULT_SEO.siteUrl}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    };

    return {
      title: config.title,
      description: config.description,
      canonicalUrl: config.canonicalUrl,
      ogType: "website" as const,
      structuredData,
      ogImage: config.image
    };
  },

  /**
   * Creates Book layout configuration
   */
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
    const structuredData: StructuredData = {
      "@context": "https://schema.org",
      "@type": "Book",
      "name": config.title,
      "description": config.description || DEFAULT_SEO.defaultDescription,
      "author": {
        "@type": "Person",
        "name": config.author
      },
      "datePublished": config.datePublished,
      "publisher": {
        "@type": "Organization",
        "name": config.publisher || DEFAULT_SEO.siteName
      },
      ...(config.isbn ? { "isbn": config.isbn } : {}),
      ...(config.image ? { 
        "image": config.image.startsWith('http') 
          ? config.image 
          : `${DEFAULT_SEO.siteUrl}${config.image}`
      } : {}),
      "inLanguage": "en-GB"
    };

    return {
      title: config.title,
      description: config.description,
      canonicalUrl: config.canonicalUrl,
      ogType: "book" as const,
      structuredData,
      ogImage: config.image
    };
  },

  /**
   * Creates Event layout configuration
   */
  event: (config: {
    title: string;
    description?: string;
    startDate: string;
    endDate?: string;
    location: string;
    image?: string;
    canonicalUrl?: string;
    organizer?: string;
  }) => {
    const structuredData: StructuredData = {
      "@context": "https://schema.org",
      "@type": "Event",
      "name": config.title,
      "description": config.description || DEFAULT_SEO.defaultDescription,
      "startDate": config.startDate,
      ...(config.endDate ? { "endDate": config.endDate } : {}),
      "location": {
        "@type": "Place",
        "name": config.location,
        "address": config.location
      },
      "organizer": {
        "@type": "Organization",
        "name": config.organizer || DEFAULT_SEO.siteName,
        "url": DEFAULT_SEO.siteUrl
      },
      ...(config.image ? { 
        "image": config.image.startsWith('http') 
          ? config.image 
          : `${DEFAULT_SEO.siteUrl}${config.image}`
      } : {})
    };

    return {
      title: config.title,
      description: config.description,
      canonicalUrl: config.canonicalUrl,
      ogType: "event" as const,
      structuredData,
      ogImage: config.image
    };
  }
};

// Export helper for page titles
export { getPageTitle };