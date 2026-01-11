// components/Layout.tsx — SINGLE SOURCE OF TRUTH (NO DYNAMIC IMPORTS, NO GHOST UI)
import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";

import LuxuryNavbar from "@/components/LuxuryNavbar";
import Footer from "@/components/Footer";

// Keep aligned with LuxuryNavbar h-20
const NAV_HEIGHT = 80;

const DEFAULT_SEO = {
  siteName: "Abraham of London",
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, ""),
  defaultDescription: "Faith-rooted strategy and leadership for high-capacity builders.",
  defaultOgImage: "/assets/images/social/og-image.jpg",
  twitterHandle: "@abrahamoflondon",
} as const;

/**
 * Unified URL Normalization Engine.
 * Prevents double-slashes and relative-path metadata failures during build.
 */
function toAbsoluteUrl(pathOrUrl: unknown): string {
  const s = typeof pathOrUrl === "string" ? pathOrUrl.trim() : "";
  if (!s) return `${DEFAULT_SEO.siteUrl}${DEFAULT_SEO.defaultOgImage}`;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  const cleanPath = s.startsWith("/") ? s : `/${s}`;
  return `${DEFAULT_SEO.siteUrl}${cleanPath}`;
}

function buildTitle(inputTitle: string | undefined): string {
  const base = DEFAULT_SEO.siteName;

  const t = (inputTitle || "").trim();
  if (!t) return base;

  // Prevent "X | Abraham of London | Abraham of London"
  const normalized = t.replace(/\s+/g, " ");
  const lower = normalized.toLowerCase();
  const baseLower = base.toLowerCase();

  if (lower === baseLower) return base;
  if (lower.endsWith(`| ${baseLower}`)) return normalized; // already has it
  if (lower.includes(baseLower) && lower.includes("|")) return normalized; // likely already composed

  return `${normalized} | ${base}`;
}

export interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  structuredData?: Record<string, any>;
  transparentHeader?: boolean;
  className?: string;
  fullWidth?: boolean;
}

export default function Layout({
  children,
  title,
  description,
  keywords = [],
  canonicalUrl,
  ogImage,
  ogType = "website",
  twitterCard = "summary_large_image",
  structuredData,
  transparentHeader = false,
  className = "",
  fullWidth = false,
}: LayoutProps) {
  const router = useRouter();

  const siteTitle = buildTitle(title);
  const siteDesc = (description || DEFAULT_SEO.defaultDescription).trim();
  const siteOgImage = toAbsoluteUrl(ogImage);

  // Canonical Handling: Uses provided prop or derives from current router path
  const currentPath = (router?.asPath || "/").split("?")[0]?.split("#")[0] || "/";
  const finalCanonical = canonicalUrl ? toAbsoluteUrl(canonicalUrl) : toAbsoluteUrl(currentPath);

  return (
    <div className={`min-h-screen flex flex-col bg-black ${className}`}>
      <Head>
        <title>{siteTitle}</title>

        {/* Viewport */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

        {/* Core SEO */}
        <meta name="description" content={siteDesc} />
        <link rel="canonical" href={finalCanonical} />
        {keywords.length > 0 && <meta name="keywords" content={keywords.join(", ")} />}

        {/* Open Graph */}
        <meta property="og:site_name" content={DEFAULT_SEO.siteName} />
        <meta property="og:title" content={siteTitle} />
        <meta property="og:description" content={siteDesc} />
        <meta property="og:url" content={finalCanonical} />
        <meta property="og:type" content={ogType} />
        <meta property="og:image" content={siteOgImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter/X */}
        <meta name="twitter:card" content={twitterCard} />
        <meta name="twitter:site" content={DEFAULT_SEO.twitterHandle} />
        <meta name="twitter:title" content={siteTitle} />
        <meta name="twitter:description" content={siteDesc} />
        <meta name="twitter:image" content={siteOgImage} />

        {/* JSON-LD */}
        {structuredData && (
          <script
            type="application/ld+json"
            // JSON.stringify is safe here: script tag content, not rendered HTML
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
        )}
      </Head>

      {/* Fixed header */}
      <LuxuryNavbar transparent={transparentHeader} />

      {/* Main content with proper spacing */}
      <main 
        className={`flex-1 ${fullWidth ? "w-full" : "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"}`}
        style={{ 
          paddingTop: NAV_HEIGHT,
          minHeight: `calc(100vh - ${NAV_HEIGHT}px - 400px)` // Ensures footer is pushed down
        }}
      >
        {children}
      </main>

      {/* Footer - will now be properly positioned */}
      <Footer />

      {/* Global CSS (minimal, no overlays, no click-blockers) */}
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
          -webkit-tap-highlight-color: transparent;
        }

        body {
          margin: 0;
          background: #000;
          color: #fff;
          overscroll-behavior-y: none;
          font-feature-settings: "kern" 1, "liga" 1;
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        ::selection {
          background: rgba(212, 175, 55, 0.25);
          color: #fff;
        }

        /* Scrollbar (subtle, not a gimmick) */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #0a0a0a;
        }
        ::-webkit-scrollbar-thumb {
          background: #1a1a1a;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #d4af37;
        }

        /* Mobile: ensure fixed header doesn't create text "underlap" illusions */
        @media (max-width: 768px) {
          html {
            scroll-padding-top: ${NAV_HEIGHT}px;
          }
          body {
            -webkit-text-size-adjust: 100%;
          }
        }

        /* Improve font rendering */
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* Ensure proper contrast */
        .text-gray-300 {
          color: rgba(209, 213, 219, 0.95) !important;
        }

        .text-gray-400 {
          color: rgba(156, 163, 175, 0.95) !important;
        }
      `}</style>
    </div>
  );
}