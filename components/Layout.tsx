// components/Layout.tsx - MASTER ARCHITECTURE VERSION

import * as React from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

// ---------------------------------------------------------------------
// Dynamic Shells (Production Guardrails)
// ---------------------------------------------------------------------
const LuxuryNavbar = dynamic(() => import("@/components/LuxuryNavbar"), {
  ssr: false,
  loading: () => <div className="h-20 border-b border-white/5 bg-black/80 backdrop-blur-md" />,
});

const Footer = dynamic(() => import("@/components/Footer"), {
  ssr: false,
  loading: () => <div className="h-64 bg-zinc-950 border-t border-white/5" />,
});

// ---------------------------------------------------------------------
// Core Logic & SEO Standards
// ---------------------------------------------------------------------
const DEFAULT_SEO = {
  siteName: "Abraham of London",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org",
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
  if (s.startsWith("http")) return s;
  const cleanPath = s.startsWith("/") ? s : `/${s}`;
  return `${DEFAULT_SEO.siteUrl}${cleanPath}`;
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

  // Resolution Logic
  const siteTitle = title ? `${title} | ${DEFAULT_SEO.siteName}` : DEFAULT_SEO.siteName;
  const siteDesc = description || DEFAULT_SEO.defaultDescription;
  const siteOgImage = toAbsoluteUrl(ogImage);
  
  // Canonical Handling: Uses provided prop or derives from current router path
  const currentPath = router?.asPath?.split("?")[0]?.split("#")[0] || "/";
  const finalCanonical = canonicalUrl 
    ? toAbsoluteUrl(canonicalUrl) 
    : toAbsoluteUrl(currentPath);

  return (
    <div className={`min-h-screen flex flex-col bg-black text-cream selection:bg-gold/30 ${className}`}>
      <Head>
        <title>{siteTitle}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="description" content={siteDesc} />
        
        {/* SEO Integrity */}
        <link rel="canonical" href={finalCanonical} />
        {keywords.length > 0 && <meta name="keywords" content={keywords.join(", ")} />}

        {/* Open Graph Architecture */}
        <meta property="og:site_name" content={DEFAULT_SEO.siteName} />
        <meta property="og:title" content={siteTitle} />
        <meta property="og:description" content={siteDesc} />
        <meta property="og:url" content={finalCanonical} />
        <meta property="og:type" content={ogType} />
        <meta property="og:image" content={siteOgImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter/X Command */}
        <meta name="twitter:card" content={twitterCard} />
        <meta name="twitter:site" content={DEFAULT_SEO.twitterHandle} />
        <meta name="twitter:title" content={siteTitle} />
        <meta name="twitter:image" content={siteOgImage} />

        {/* JSON-LD Security: Ensures valid script tags even with empty data */}
        {structuredData && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
        )}
      </Head>

      <LuxuryNavbar transparent={transparentHeader} />

      <main className={`flex-1 ${fullWidth ? "w-full" : "mx-auto max-w-7xl px-6 lg:px-8"}`}>
        {children}
      </main>

      <Footer />

      {/* Global CSS Overrides for Structural Reading */}
      <style jsx global>{`
        html { scroll-behavior: smooth; -webkit-tap-highlight-color: transparent; }
        body { overscroll-behavior-y: none; background: #000; }
        ::selection { background: rgba(212, 175, 55, 0.2); color: #fff; }
        
        /* High-fidelity scrollbar for the Vault */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #050505; }
        ::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #d4af37; }

        @media (max-width: 768px) {
          input, select, textarea { font-size: 16px !important; }
        }
      `}</style>
    </div>
  );
}

