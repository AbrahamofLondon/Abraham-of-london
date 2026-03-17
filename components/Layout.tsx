import * as React from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";

const VaultSearchOverlay = dynamic(
  () =>
    import("@/components/VaultSearchOverlay").catch((err) => {
      console.error("Failed to load VaultSearchOverlay:", err);
      return { default: () => null };
    }),
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
  structuredData?: any;
  showFooter?: boolean;
  enableVaultSearch?: boolean;
};

function toAbsoluteUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return BASE_URL;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const clean = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${BASE_URL}${clean}`;
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
  showFooter = true,
  enableVaultSearch,
}: LayoutProps) {
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  const canonicalAbs = React.useMemo(() => {
    if (canonicalUrl) return toAbsoluteUrl(canonicalUrl);
    return toAbsoluteUrl(router.asPath.split("#")[0] || "/");
  }, [canonicalUrl, router.asPath]);

  const shouldEnableVaultSearch =
    typeof enableVaultSearch === "boolean"
      ? enableVaultSearch
      : router.pathname.startsWith("/vault") ||
        router.pathname.startsWith("/inner-circle") ||
        router.pathname.startsWith("/resources");

  React.useEffect(() => {
    if (!shouldEnableVaultSearch) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shouldEnableVaultSearch]);

  const ogImageAbs = toAbsoluteUrl(ogImage);

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

      <Header transparent={headerTransparent} />

      <main
        className={[
          "w-full max-w-full overflow-x-hidden bg-black text-white",
          // If the header is NOT transparent, we add padding to avoid clipping content.
          // If it IS transparent (like on the Home page), we set pt-0 so the Hero bleeds to the top.
          headerTransparent ? "pt-0" : "pt-[84px]",
          fullWidth ? "" : "mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8",
          className,
        ].join(" ")}
      >
        {children}
      </main>

      {showFooter ? <EnhancedFooter /> : null}

      {shouldEnableVaultSearch ? (
        <VaultSearchOverlay
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />
      ) : null}
    </>
  );
}