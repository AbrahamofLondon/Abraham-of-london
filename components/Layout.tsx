// components/Layout.tsx — PRODUCTION GRADE (ROUTER-FREE, SSR-SAFE, NO LAYOUT JUMP)
// Stable render: no mount-gated tree swap. Canonical can upgrade client-side quietly.

import * as React from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const VaultSearchOverlay = dynamic(
  () => import("./VaultSearchOverlay").then((mod) => mod.VaultSearchOverlay),
  { ssr: false, loading: () => null }
);

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");
const HEADER_HEIGHT_PX = 80;

// Build-phase guard (no window listeners, no overlay)
const IS_BUILD =
  process.env.NEXT_PHASE === "phase-production-build" || process.env.NEXT_PHASE === "phase-export";

type LayoutProps = {
  children: React.ReactNode;
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
  ogType?: string;
  className?: string;
  fullWidth?: boolean;
  headerTransparent?: boolean;
  structuredData?: any;
};

function toAbsoluteUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return BASE_URL;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const clean = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${BASE_URL}${clean}`;
}

function getClientPathname(): string {
  if (typeof window === "undefined") return "/";
  try {
    return (window.location.pathname || "/").split("#")[0] || "/";
  } catch {
    return "/";
  }
}

export default function Layout({
  children,
  title = "Abraham of London",
  description = "Institutional strategy, governance discipline, and operator doctrine for serious builders.",
  keywords = "",
  ogImage = "/assets/images/social/og-image.jpg",
  canonicalUrl,
  ogType = "website",
  className = "",
  fullWidth = false,
  headerTransparent = false,
  structuredData,
}: LayoutProps) {
  const serverCanonicalAbs = toAbsoluteUrl(canonicalUrl ? canonicalUrl : "/");
  const [canonicalAbs, setCanonicalAbs] = React.useState<string>(serverCanonicalAbs);

  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  // Quiet client-side canonical upgrade (only when canonicalUrl not explicitly set)
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (canonicalUrl) return;
    const p = getClientPathname();
    setCanonicalAbs(toAbsoluteUrl(p));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canonicalUrl]);

  // CMD+K handler (client-only, not during build)
  React.useEffect(() => {
    if (IS_BUILD || typeof window === "undefined") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const ogImageAbs = toAbsoluteUrl(ogImage);

  return (
    <>
      <Head>
        {/* NO <title> here — pages own the title */}
        <meta name="description" content={description} />
        {keywords ? <meta name="keywords" content={keywords} /> : null}
        <link rel="canonical" href={canonicalAbs} />

        <meta property="og:type" content={ogType} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImageAbs} />
        <meta property="og:url" content={canonicalAbs} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImageAbs} />

        {structuredData ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
        ) : null}
      </Head>

      <Header transparent={headerTransparent} />

      {/* Stable header spacing. Hero pages can visually “sit under” header by using -mt-[80px] + pt-[80px] in the page. */}
      <main
        style={{ paddingTop: headerTransparent ? HEADER_HEIGHT_PX : HEADER_HEIGHT_PX }}
        className={[
          "min-h-screen w-full max-w-full overflow-x-hidden",
          fullWidth ? "" : "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10",
          className,
        ].join(" ")}
      >
        {children}
      </main>

      <Footer />

      {/* Search overlay — client only */}
      {!IS_BUILD ? <VaultSearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} /> : null}
    </>
  );
}