// components/Layout.tsx — PRODUCTION GRADE (ROUTER-FREE, SSR-SAFE, BUILD-GUARDED)

import * as React from "react";
import Head from "next/head";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");
const HEADER_HEIGHT_PX = 80;

type LayoutProps = {
  children: React.ReactNode;
  title?: string;           // ✅ Still needed for og:title and meta tags
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
  // 🛡️ Mount guard to prevent hydration mismatches
  const [mounted, setMounted] = React.useState(false);
  
  // Server-safe canonical baseline
  const serverCanonicalAbs = toAbsoluteUrl(canonicalUrl ? canonicalUrl : "/");

  // Only “upgrade” canonical on client when canonicalUrl is not explicitly set
  const [clientCanonical, setClientCanonical] = React.useState<string>(serverCanonicalAbs);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    if (canonicalUrl) return;
    const p = getClientPathname();
    setClientCanonical(toAbsoluteUrl(p));
  }, [mounted, canonicalUrl]);

  const canonicalAbs = canonicalUrl ? serverCanonicalAbs : clientCanonical;
  const ogImageAbs = toAbsoluteUrl(ogImage);

  // During SSR/build, render with server-safe values
  if (!mounted) {
    return (
      <>
        <Head>
          {/* ✅ NO <title> here — titles belong in pages */}
          <meta name="description" content={description} />
          {keywords ? <meta name="keywords" content={keywords} /> : null}
          <link rel="canonical" href={serverCanonicalAbs} />

          <meta property="og:type" content={ogType} />
          <meta property="og:title" content={title} />
          <meta property="og:description" content={description} />
          <meta property="og:image" content={ogImageAbs} />
          <meta property="og:url" content={serverCanonicalAbs} />

          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={title} />
          <meta name="twitter:description" content={description} />
          <meta name="twitter:image" content={ogImageAbs} />

          {structuredData ? (
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
          ) : null}
        </Head>

        <Header transparent={headerTransparent} />

        <main
          style={{ paddingTop: headerTransparent ? 0 : HEADER_HEIGHT_PX }}
          className={[
            "min-h-screen w-full max-w-full overflow-x-hidden",
            fullWidth ? "" : "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10",
            className,
          ].join(" ")}
        >
          {children}
        </main>

        <Footer />
      </>
    );
  }

  return (
    <>
      <Head>
        {/* ✅ NO <title> here — titles belong in pages */}
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
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        ) : null}
      </Head>

      <Header transparent={headerTransparent} />

      <main
        style={{ paddingTop: headerTransparent ? 0 : HEADER_HEIGHT_PX }}
        className={[
          "min-h-screen w-full max-w-full overflow-x-hidden",
          fullWidth ? "" : "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10",
          className,
        ].join(" ")}
      >
        {children}
      </main>

      <Footer />
    </>
  );
} 