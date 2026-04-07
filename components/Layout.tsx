/* components/Layout.tsx — stable Pages Router frame */

import * as React from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const VaultSearchOverlay = dynamic(
  () => import("@/components/VaultSearchOverlay").then((m) => m.default),
  {
    ssr: false,
    loading: () => null,
  }
);

const BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org"
).replace(/\/+$/, "");

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
  structuredData?: unknown;
  showFooter?: boolean;
  enableVaultSearch?: boolean;
};

function toAbsoluteUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return BASE_URL;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${BASE_URL}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}

export default function Layout({
  children,
  title = "Abraham of London",
  description = "Institutional strategy, governance discipline, and operator doctrine for serious builders.",
  keywords = "",
  ogImage = "/assets/images/social/og-image.jpg",
  canonicalUrl,
  ogType = "website",
  className,
  fullWidth = false,
  headerTransparent = false,
  structuredData,
  showFooter = true,
  enableVaultSearch,
}: LayoutProps) {
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  const canonicalAbs = React.useMemo(() => {
    if (canonicalUrl) return toAbsoluteUrl(canonicalUrl);
    const path = (router.asPath || "/").split("#")[0] || "/";
    return toAbsoluteUrl(path);
  }, [canonicalUrl, router.asPath]);

  const ogImageAbs = React.useMemo(() => toAbsoluteUrl(ogImage), [ogImage]);

  const shouldEnableVaultSearch =
    typeof enableVaultSearch === "boolean"
      ? enableVaultSearch
      : router.pathname.startsWith("/vault") ||
        router.pathname.startsWith("/inner-circle") ||
        router.pathname.startsWith("/resources");

  React.useEffect(() => {
    if (!shouldEnableVaultSearch) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shouldEnableVaultSearch]);

  return (
    <>
      <Head>
        <title>{title}</title>
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

      {/* Explicit stacking context — root layer */}
      <div className="relative isolate min-h-screen bg-[#050505] text-white">
        {/* Header layer — higher z-index to stay above content */}
        <div className="relative z-50">
          <Header transparent={headerTransparent} />
        </div>

        {/* Main content layer — base z-index, content flows naturally */}
        <main
          className={cn(
            "relative z-0 w-full overflow-x-clip bg-[#050505] text-white antialiased",
            headerTransparent ? "pt-0" : "pt-[84px]",
            fullWidth
              ? "min-h-[calc(100vh-84px)]"
              : "mx-auto min-h-[calc(100vh-84px)] max-w-7xl px-6 py-12 lg:px-12 lg:py-20",
            className
          )}
        >
          {children}
        </main>

        {/* Footer layer — below overlay but above main content when needed */}
        {showFooter ? (
          <div className="relative z-10">
            <EnhancedFooter />
          </div>
        ) : null}

        {/* Overlay layer — highest z-index when active */}
        {shouldEnableVaultSearch ? (
          <VaultSearchOverlay
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
          />
        ) : null}
      </div>
    </>
  );
}