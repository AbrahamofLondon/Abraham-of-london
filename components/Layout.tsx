import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import SocialFollowStrip from "@/components/SocialFollowStrip";
import StickyCTA from "@/components/StickyCTA";
import { LogoFull } from "@/components/icons/BrandLogo";

type LayoutProps = {
  children: React.ReactNode;
  pageTitle?: string;
  hideSocialStrip?: boolean;
  footerVariant?: "light" | "dark"; // ← NEW
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
    "https://twitter.com/AbrahamAda48634",
    "https://www.linkedin.com/in/abraham-adaramola-06630321/",
    "https://www.instagram.com/abraham_of_london",
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

const NAV = [
  { href: "/books", label: "Books" },
  { href: "/blog", label: "Insights" },
  { href: "/ventures", label: "Ventures" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

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
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => router.pathname === href || router.asPath === href;

  // Footer theme tokens
  const isDark = footerVariant === "dark";
  const footerWrap = isDark ? "border-t border-white/10 bg-deepCharcoal" : "border-t border-gray-200 bg-white";
  const footerText = isDark ? "text-cream" : "text-gray-900";
  const footerMuted = isDark ? "text-cream/70" : "text-gray-600";
  const linkBase = isDark ? "text-cream/80 hover:text-cream" : "text-gray-600 hover:text-gray-900";
  const divider = isDark ? "border-white/10" : "border-gray-200";

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

      <header className="sticky top-0 z-40 border-b border-gray-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:h-20">
          <Link href="/" className="group inline-flex items-center gap-3" aria-label="Abraham of London — Home">
            <span className="text-deepCharcoal group-hover:text-gray-900 transition-colors">
              <LogoFull />
            </span>
            <span className="hidden text-[10px] uppercase tracking-[0.25em] text-gray-500 md:inline-block">
              EST. MMXXIV
            </span>
          </Link>

          <nav className="hidden md:block" aria-label="Primary">
            <ul className="flex items-center gap-8">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={[
                      "group relative text-sm font-medium transition-colors",
                      isActive(item.href) ? "text-gray-900" : "text-gray-700 hover:text-gray-900",
                    ].join(" ")}
                  >
                    {item.label}
                    <span
                      className={[
                        "pointer-events-none absolute -bottom-1 left-0 h-[2px] transition-all",
                        isActive(item.href) ? "w-full bg-gray-900" : "w-0 bg-transparent group-hover:w-full",
                      ].join(" ")}
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden md:block">
            <Link
              href="/contact"
              className="rounded-full bg-softGold px-5 py-2 text-sm font-semibold text-deepCharcoal transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-softGold/40"
            >
              Enquire
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 p-2 text-gray-700 md:hidden"
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
          className={`md:hidden ${open ? "block" : "hidden"} border-t border-gray-200 bg-white`}
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
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-800 hover:bg-gray-50",
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
                  className="block rounded-full bg-softGold px-5 py-2 text-center text-sm font-semibold text-deepCharcoal transition hover:brightness-95"
                >
                  Enquire
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {!hideSocialStrip && (
        <div className="border-b border-gray-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-2">
            <SocialFollowStrip />
          </div>
        </div>
      )}

      <main id="main-content" className="min-h-screen bg-white">{children}</main>

      <StickyCTA showAfter={420} />

      {/* Footer (themeable) */}
      <footer className={footerWrap}>
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className={`grid gap-10 md:grid-cols-3 ${footerText}`}>
            <div>
              <div className={`mb-3 ${isDark ? "text-cream" : "text-deepCharcoal"}`}>
                <LogoFull />
              </div>
              <p className={`text-sm leading-relaxed ${footerMuted}`}>
                Principled strategy, writing, and ventures — grounded in legacy and fatherhood.
              </p>
            </div>

            <div>
              <p className={`text-sm font-semibold ${footerText}`}>Navigate</p>
              <ul className="mt-3 grid gap-2 text-sm">
                {NAV.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={`${linkBase} transition`}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className={`text-sm font-semibold ${footerText}`}>Contact & Legal</p>
              <ul className="mt-3 grid gap-2 text-sm">
                <li>
                  <a href="mailto:info@abrahamoflondon.org" className={`${linkBase} transition`}>
                    info@abrahamoflondon.org
                  </a>
                </li>
                <li>
                  <Link href="/privacy" className={`${linkBase} transition`}>
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className={`${linkBase} transition`}>
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className={`mt-10 border-t ${divider} pt-6 text-center text-xs ${isDark ? "text-cream/60" : "text-gray-500"}`}>
            © {new Date().getFullYear()} Abraham of London. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}
