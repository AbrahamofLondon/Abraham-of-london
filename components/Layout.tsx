// components/Layout.tsx — INSTITUTIONAL BASELINE (grown-up, premium, quiet authority)
import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";

import LuxuryNavbar from "@/components/LuxuryNavbar";
import Footer from "@/components/Footer";

const NAV_HEIGHT = 80;

const DEFAULT_SEO = {
  siteName: "Abraham of London",
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, ""),
  defaultDescription: "Faith-rooted strategy and leadership for high-capacity builders.",
  defaultOgImage: "/assets/images/social/og-image.jpg",
  twitterHandle: "@abrahamoflondon",
} as const;

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

  const normalized = t.replace(/\s+/g, " ");
  const lower = normalized.toLowerCase();
  const baseLower = base.toLowerCase();

  if (lower === baseLower) return base;
  if (lower.endsWith(`| ${baseLower}`)) return normalized;
  if (lower.includes(baseLower) && lower.includes("|")) return normalized;

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

  const currentPath = (router?.asPath || "/").split("?")[0]?.split("#")[0] || "/";
  const finalCanonical = canonicalUrl ? toAbsoluteUrl(canonicalUrl) : toAbsoluteUrl(currentPath);

  return (
    <div className={`min-h-screen flex flex-col bg-black text-white ${className}`}>
      <Head>
        <title>{siteTitle}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="description" content={siteDesc} />
        <link rel="canonical" href={finalCanonical} />
        {keywords.length > 0 && <meta name="keywords" content={keywords.join(", ")} />}

        <meta property="og:site_name" content={DEFAULT_SEO.siteName} />
        <meta property="og:title" content={siteTitle} />
        <meta property="og:description" content={siteDesc} />
        <meta property="og:url" content={finalCanonical} />
        <meta property="og:type" content={ogType} />
        <meta property="og:image" content={siteOgImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        <meta name="twitter:card" content={twitterCard} />
        <meta name="twitter:site" content={DEFAULT_SEO.twitterHandle} />
        <meta name="twitter:title" content={siteTitle} />
        <meta name="twitter:description" content={siteDesc} />
        <meta name="twitter:image" content={siteOgImage} />

        {structuredData && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
        )}
      </Head>

      {/* Ambient backdrop: vignette + grain + subtle grid */}
      <div className="pointer-events-none fixed inset-0 z-[-1]">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_30%_20%,rgba(245,158,11,0.10),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(59,130,246,0.06),transparent_60%)]" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:84px_84px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,transparent_30%,rgba(0,0,0,0.85)_75%)]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Cfilter id=%22n%22 x=%220%22 y=%220%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%222%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22200%22 height=%22200%22 filter=%22url(%23n)%22 opacity=%220.35%22/%3E%3C/svg%3E')]" />
      </div>

      <LuxuryNavbar transparent={transparentHeader} />

      <main
        className={`flex-1 ${fullWidth ? "w-full" : "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"}`}
        style={{
          paddingTop: NAV_HEIGHT,
          minHeight: `calc(100vh - ${NAV_HEIGHT}px - 360px)`,
        }}
      >
        {children}
      </main>

      <Footer />

      <style jsx global>{`
        html {
          scroll-behavior: smooth;
          -webkit-tap-highlight-color: transparent;
        }

        body {
          margin: 0;
          background: #000;
          color: #fff;
          font-feature-settings: "kern" 1, "liga" 1;
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        ::selection {
          background: rgba(245, 158, 11, 0.28);
          color: #fff;
        }

        a {
          text-decoration: none;
        }

        /* Tight but premium scrollbar */
        ::-webkit-scrollbar {
          width: 10px;
        }
        ::-webkit-scrollbar-track {
          background: #060606;
        }
        ::-webkit-scrollbar-thumb {
          background: #161616;
          border-radius: 10px;
          border: 2px solid #060606;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(245, 158, 11, 0.45);
        }

        @media (max-width: 768px) {
          html {
            scroll-padding-top: ${NAV_HEIGHT}px;
          }
          body {
            -webkit-text-size-adjust: 100%;
          }
        }
      `}</style>
    </div>
  );
}