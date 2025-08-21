// components/NavConfig.ts
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import SocialFollowStrip from "@/components/SocialFollowStrip";
import StickyCTA from "@/components/StickyCTA";
import { NAV } from "@/components/NavConfig";

type LayoutProps = {
  children: React.ReactNode;
  pageTitle?: string;
  hideSocialStrip?: boolean;
  footerVariant?: "light" | "dark";
};

const ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.URL ??
  process.env.DEPLOY_PRIME_URL ??
  "https://abrahamoflondon.org";

const SITE_URL = ORIGIN.replace(/\/$/, "");

const ORG_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Abraham of London",
  url: SITE_URL,
  logo: `${SITE_URL}/assets/images/logo/abraham-of-london-logo.svg`,
  sameAs: [
    "https://twitter.com/abrahamoflondon",
    "https://www.linkedin.com/in/abrahamoflondon",
    "https://www.instagram.com/abrahamoflondon",
    "https://www.facebook.com/share/p/156tQWm2mZ/",
  ],
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "Customer Support",
      email: "info@abrahamoflondon.org",
      telephone: "+44 20 7946 0958",
      areaServed: "GB",
      availableLanguage: ["en"],
    },
  ],
};

export default function Layout({
  children,
  pageTitle,
  hideSocialStrip,
  footerVariant = "light",
}: LayoutProps) {
  const router = useRouter();
  const title = pageTitle ? `${pageTitle} | Abraham of London` : "Abraham of London";
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (open) document.documentElement.style.overflow = "hidden";
    else document.documentElement.style.overflow = "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) =>
    router.pathname === href || router.asPath === href;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }}
        />
      </Head>

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-deepCharcoal/10 bg-white/85 backdrop-blur dark:bg-black/50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:h-20">
          {/* Brand */}
          <Link href="/" className="group inline-flex items-baseline gap-2">
            <span className="font-serif text-xl font-semibold tracking-wide text-deepCharcoal md:text-2xl dark:text-cream">
              Abraham of London
            </span>
            <span className="hidden text-[10px] uppercase tracking-[0.25em] text-gray-500 md:inline-block">
              EST. MMXXIV
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:block" aria-label="Primary">
            <ul className="flex items-center gap-8">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={[
                      "relative text-sm font-medium transition-colors",
                      isActive(item.href)
                        ? "text-deepCharcoal dark:text-cream"
                        : "text-gray-700 hover:text-deepCharcoal dark:text-gray-300 dark:hover:text-cream",
                    ].join(" ")}
                  >
                    {item.label}
                    <span
                      className={[
                        "pointer-events-none absolute -bottom-1 left-0 h-[2px] transition-all",
                        isActive(item.href)
                          ? "w-full bg-softGold"
                          : "w-0 bg-transparent group-hover:w-full",
                      ].join(" ")}
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:block">
            <Link
              href="/contact"
              className="rounded-full bg-softGold px-5 py-2 text-sm font-medium text-deepCharcoal transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-softGold/40"
            >
              Enquire
            </Link>
          </div>

          {/* Mobile menu button */}
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

        {/* Mobile Drawer */}
        <div
          id="mobile-nav"
          className={`md:hidden ${open ? "block" : "hidden"} border-t border-gray-200 bg-white dark:bg-black`}
        >
          <nav className="mx-auto max-w-7xl px-4 py-4" aria-label="Mobile">
            <ul className="grid gap-2">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={[
                      "block rounded-md px-2 py-2 text-base font-medium",
                      isActive(item.href)
                        ? "bg-gray-100 text-deepCharcoal dark:bg-gray-800 dark:text-cream"
                        : "text-gray-800 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="pt-2">
                <Link
                  href="/contact"
                  onClick={() => setOpen(false)}
                  className="block rounded-full bg-softGold px-5 py-2 text-center text-sm font-medium text-deepCharcoal transition hover:brightness-95"
                >
                  Enquire
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Social strip */}
      {!hideSocialStrip && (
        <div className="border-b border-gray-100 bg-white dark:bg-black/40">
          <div className="mx-auto max-w-7xl px-4 py-2">
            <SocialFollowStrip variant={footerVariant} />
          </div>
        </div>
      )}

      {/* Main */}
      <main id="main-content" className="min-h-screen bg-white dark:bg-black">{children}</main>

      {/* Sticky CTA */}
      <StickyCTA showAfter={420} />

      {/* Footer */}
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
              <p className="font-serif text-lg font-semibold">Abraham of London</p>
              <p className="mt-2 text-sm leading-relaxed">
                Principled strategy, writing, and ventures — grounded in legacy and fatherhood.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold">Navigate</p>
              <ul className="mt-3 grid gap-2 text-sm">
                {NAV.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="transition hover:text-softGold">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold">Contact & Legal</p>
              <ul className="mt-3 grid gap-2 text-sm">
                <li>
                  <a href="mailto:info@abrahamoflondon.org" className="transition hover:text-softGold">
                    info@abrahamoflondon.org
                  </a>
                </li>
                <li>
                  <Link href="/privacy" className="transition hover:text-softGold">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="transition hover:text-softGold">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-gray-200 pt-6 text-center text-xs">
            © {new Date().getFullYear()} Abraham of London. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}
