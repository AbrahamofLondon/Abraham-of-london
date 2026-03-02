/* components/Layout.tsx — PRODUCTION GRADE */
import * as React from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
// 🏛️ Import the component correctly
import EnhancedFooter from "@/components/EnhancedFooter";

// ✅ FIXED: Dynamic import with error handling - removed suspense option
const VaultSearchOverlay = dynamic(
  () => import("./VaultSearchOverlay").catch(err => {
    console.error("Failed to load VaultSearchOverlay:", err);
    return { default: () => null };
  }),
  { 
    ssr: false, 
    loading: () => null
    // ❌ suspense: false removed - not available in Pages Router
  }
);

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");
// 🏛️ FIXED: Header height reduced to match actual header size (h-16/py-3 = ~64-72px)
const HEADER_HEIGHT_PX = 72;

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

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (canonicalUrl) return;
    const p = getClientPathname();
    setCanonicalAbs(toAbsoluteUrl(p));
  }, [canonicalUrl]);

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

      {/* 🏛️ FIXED: Conditional padding based on header transparency */}
      <main
        className={[
          "min-h-screen w-full max-w-full overflow-x-hidden",
          headerTransparent ? "" : "pt-[72px]", // Using exact value to match HEADER_HEIGHT_PX
          fullWidth ? "" : "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10",
          className,
        ].join(" ")}
      >
        {children}
      </main>

      {/* 🏛️ FIXED: Using the imported name EnhancedFooter */}
      <EnhancedFooter />

      {!IS_BUILD && (
        <VaultSearchOverlay 
          isOpen={isSearchOpen} 
          onClose={() => setIsSearchOpen(false)} 
        />
      )}
    </>
  );
}