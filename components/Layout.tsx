// components/Layout.tsx
"use client";

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { usePathname } from "next/navigation";

import SocialFollowStrip from "@/components/SocialFollowStrip";
import StickyCTA from "@/components/StickyCTA";
import FloatingTeaserCTA from "@/components/FloatingTeaserCTA";
import { NAV } from "@/config/nav";
import { siteConfig, absUrl } from "@/lib/siteConfig";

export type LayoutProps = {
  children: React.ReactNode;
  pageTitle?: string;
  hideSocialStrip?: boolean;
  footerVariant?: "light" | "dark";
  hideCTA?: boolean;
  hero?: React.ReactNode;
};

function toArray<T>(val: unknown): T[] {
  if (Array.isArray(val)) return val;
  if (val && typeof val === "object") {
    return Object.values(val as Record<string, T>).filter(Boolean) as T[];
  }
  return [];
}

export default function Layout({
  children,
  pageTitle,
  hideSocialStrip,
  footerVariant = "light",
  hideCTA = false,
  hero,
}: LayoutProps) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const firstMobileLinkRef = React.useRef<HTMLAnchorElement | null>(null);

  const title = pageTitle ? `${pageTitle} | ${siteConfig.title}` : siteConfig.title;

  const normalize = (href: string) =>
    href.replace(/[?#].*$/, "").replace(/\/+$/, "") || "/";
  const isActive = (href: string) => normalize(pathname) === normalize(href);

  React.useEffect(() => {
    const root = document.documentElement;
    const prev = root.style.overflow || "";
    if (open) {
      root.style.overflow = "hidden";
      firstMobileLinkRef.current?.focus();
    } else {
      root.style.overflow = prev || "";
    }
    return () => {
      root.style.overflow = prev || "";
    };
  }, [open]);

  // Robust: socialLinks may be an array or object; normalise for JSON-LD.
  const socialArr = toArray<{ href?: string; external?: boolean }>(
    (siteConfig as any).socialLinks
  );
  const sameAs = Array.from(
    new Set(
      socialArr
        .filter(
          (s) =>
            s &&
            s.external &&
            typeof s.href === "string" &&
            /^https?:\/\//i.test(s.href)
        )
        .map((s) => s.href as string)
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
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }}
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(NAV_JSONLD) }}
        />
      </Head>

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-[color:var(--color-on-secondary)/0.1] bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:bg-black/50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:h-20">
          <Link href="/" className="group inline-flex items-baseline gap-2" prefetch={false}>
            <span className="font-serif text-xl font-semibold tracking-wide text-deepCharcoal md:text-2xl dark:text-cream">
              {siteConfig.title}
            </span>
            <span
              className="hidden text-[10px] uppercase tracking-[0.25em] text-gray-500 md:inline-block"
              aria-hidden="true"
            >
              EST. MMXXIV
            </span>
          </Link>

          <nav className="hidden md:block" aria-label="Primary">
            <ul className="flex items-center gap-8">
              {NAV.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={[
                        "relative text-sm font-medium transition-colors",
                        active
                          ? "text-deepCharcoal dark:text-cream"
                          : "text-gray-700 hover:text-deepCharcoal dark:text-gray-300 dark:hover:text-cream",
                      ].join(" ")}
                      prefetch={false}
                    >
                      {item.label}
                      <span
                        className={[
                          "pointer-events-none absolute -bottom-1 left-0 h-[2px] transition-all",
                          active ? "w-full bg-softGold" : "w-0 bg-transparent group-hover:w-full",
                        ].join(" ")}
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="hidden md:block">
            <Link
              href="/contact"
              className="rounded-full bg-softGold px-5 py-2 text-sm font-medium text-deepCharcoal transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-softGold/40"
              prefetch={false}
            >
              Enquire
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 p-2 text-gray-700 dark:text-gray-200 md:hidden"
          >
            <span className="sr-only">Toggle navigation</span>
            {!open ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" />
              </svg>
            )}
          </button>
        </div>

        <div
          id="mobile-nav"
          className={`md:hidden ${open ? "block" : "hidden"} border-t border-gray-200 bg-white dark:bg:black`}
        >
          <nav className="mx-auto max-w-7xl px-4 py-4" aria-label="Mobile">
            <ul className="grid gap-2">
              {NAV.map((item, idx) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      ref={idx === 0 ? firstMobileLinkRef : undefined}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={[
                        "block rounded-md px-2 py-2 text-base font-medium",
                        active
                          ? "bg-gray-100 text-deepCharcoal dark:bg-gray-800 dark:text-cream"
                          : "text-gray-800 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700",
                      ].join(" ")}
                      prefetch={false}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
              <li className="pt-2">
                <Link
                  href="/contact"
                  onClick={() => setOpen(false)}
                  className="block rounded-full bg-softGold px-5 py-2 text-center text-sm font-medium text-deepCharcoal transition hover:brightness-95"
                  prefetch={false}
                >
                  Enquire
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {!hideSocialStrip && (
        <div className="border-b border-gray-100 bg-white dark:bg-black/40">
          <div className="mx-auto max-w-7xl px-4 py-2">
            <SocialFollowStrip />
          </div>
        </div>
      )}

      {hero ? <div data-layout-hero>{hero}</div> : null}

      <main
        id="main-content"
        className="min-h-screen bg-white dark:bg-black"
        style={{ paddingBottom: "var(--sticky-cta-h, 0px)" }}
      >
        {children}
      </main>

      {!hideCTA && (
        <div className="hidden 2xl:block">
          <StickyCTA showAfter={420} />
        </div>
      )}

      <FloatingTeaserCTA />

      <footer
        className={`border-t ${
          footerVariant === "dark"
            ? "bg-deepCharcoal text-cream border-white/10"
            : "bg-white text-gray-700 border-gray-200"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <p className="font-serif text-lg font-semibold">{siteConfig.title}</p>
              <p className="mt-2 text-sm leading-relaxed">
                Principled strategy, writing, and ventures — grounded in legacy and fatherhood.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold">Navigate</p>
              <ul className="mt-3 grid gap-2 text-sm">
                {NAV.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="transition hover:text-softGold" prefetch={false}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold">Contact &amp; Legal</p>
              <ul className="mt-3 grid gap-2 text-sm">
                <li>
                  <a href={`mailto:${siteConfig.email}`} className="transition hover:text-softGold">
                    {siteConfig.email}
                  </a>
                </li>
                <li>
                  <Link href="/contact" className="transition hover:text-softGold" prefetch={false}>
                    Work With Me
                  </Link>
                </li>
                <li>
                  <Link href="/newsletter" className="transition hover:text-softGold" prefetch={false}>
                    Subscribe
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="transition hover:text-softGold" prefetch={false}>
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="transition hover:text-softGold" prefetch={false}>
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-gray-200 pt-6 text-center text-xs">
            © {new Date().getFullYear()} {siteConfig.title}. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}