import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

import SocialFollowStrip from "@/components/SocialFollowStrip";
import StickyCTA from "@/components/StickyCTA";
import { NAV } from "@/config/nav";
import { siteConfig, absUrl } from "@/lib/siteConfig";

import FloatingTeaserCTA from "@/components/FloatingTeaserCTA";

export default function Layout({
  children,
  pageTitle,
  hideSocialStrip,
  footerVariant = "light",
  hideCTA = false,
}: LayoutProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const firstMobileLinkRef = React.useRef<HTMLAnchorElement | null>(null);

  const title = pageTitle ? `${pageTitle} | ${siteConfig.title}` : siteConfig.title;

  // Normalize current path (strip query/hash and trailing slash)
  const normalize = (href: string) => href.replace(/[?#].*$/, "").replace(/\/+$/, "") || "/";
  const isActive = (href: string) => normalize(router.asPath) === normalize(href);

  // Lock body scroll + focus first item
  React.useEffect(() => {
    const root = document.documentElement;
    const prev = root.style.overflow || "";
    if (open) {
      root.style.overflow = "hidden";
      firstMobileLinkRef.current?.focus();
    } else {
      root.style.overflow = prev || ""; // reset when closed
    }
    return () => { root.style.overflow = prev || ""; }; // reset on unmount
  }, [open]);

  // Close drawer on route change
  React.useEffect(() => {
    const handleRoute = () => setOpen(false);
    router.events.on("routeChangeStart", handleRoute);
    return () => router.events.off("routeChangeStart", handleRoute);
  }, [router.events]);

  // JSON-LD
  const sameAs = Array.from(
    new Set(
      (siteConfig.socialLinks || [])
        .filter((s) => s.external && /^https?:\/\//i.test(s.href))
        .map((s) => s.href)
    )
  );

  const ORG_JSONLD = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.title,
    url: siteConfig.siteUrl,
    logo: absUrl("/assets/images/logo/abraham-of-london-logo.svg"),
    ...(sameAs.length ? { sameAs } : {}),
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "Customer Support",
        email: siteConfig.email,
        areaServed: "GB",
        availableLanguage: ["en"],
      },
    ],
  };

  const NAV_JSONLD = {
    "@context": "https://schema.org",
    "@type": "SiteNavigationElement",
    name: "Primary Navigation",
    hasPart: NAV.map((n) => ({
      "@type": "WebPage",
      name: n.label,
      url: absUrl(n.href),
    })),
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(NAV_JSONLD) }} />
      </Head>

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>

      {/* Header … (unchanged) */}

      {/* Social Strip */}
      {!hideSocialStrip && (
        <div className="border-b border-gray-100 bg-white dark:bg-black/40">
          <div className="mx-auto max-w-7xl px-4 py-2">
            <SocialFollowStrip />
          </div>
        </div>
      )}

      {/* Main */}
      <main
        id="main-content"
        className="min-h-screen bg-white dark:bg-black container mx-auto px-4"
        style={{ paddingBottom: "var(--sticky-cta-h, 0px)" }}
      >
        {children}
      </main>

      {/* Sticky CTA on wide screens only */}
      {!hideCTA && (
        <div className="hidden 2xl:block">
          <StickyCTA showAfter={420} />
        </div>
      )}

      {/* Move FloatingTeaserCTA OUTSIDE footer for clean stacking */}
      <FloatingTeaserCTA />

      {/* Footer … (unchanged aside from removing <FloatingTeaserCTA /> inside it) */}
      <footer
        className={`border-t ${
          footerVariant === "dark"
            ? "bg-deepCharcoal text-cream border-white/10"
            : "bg-white text-gray-700 border-gray-200"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 py-12">
          {/* footer content unchanged */}
          <div className="mt-10 border-t border-gray-200 pt-6 text-center text-xs">
            © {new Date().getFullYear()} {siteConfig.title}. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}
