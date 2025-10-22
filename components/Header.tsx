// components/Header.tsx
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { motion, type Transition } from "framer-motion";
import { siteConfig } from "@/lib/siteConfig";

// Use a loading skeleton for ThemeToggle to maintain smooth layout during hydration
const ThemeToggle = dynamic(() => import("./ThemeToggle"), {
  ssr: false,
  loading: () => (
    <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
  ),
});

type HeaderProps = { variant?: "light" | "dark" };

const NAV = [
  { href: "/books", label: "Books" },
  { href: "/blog", label: "Insights" },
  { href: "/ventures", label: "Ventures" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Header({ variant = "light" }: HeaderProps) {
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const router = useRouter();

  const isActive = (href: string) => {
    const p = router.asPath || router.pathname || "";
    if (href === "/") return p === "/";
    return p === href || p.startsWith(href + "/");
  };

  React.useEffect(() => {
    const close = () => setOpen(false);
    router.events?.on("routeChangeComplete", close);
    router.events?.on("hashChangeComplete", close);
    return () => {
      router.events?.off("routeChangeComplete", close);
      router.events?.off("hashChangeComplete", close);
    };
  }, [router.events]);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const y = window.scrollY;
    const { style } = document.documentElement;
    style.position = "fixed";
    style.top = `-${y}px`;
    style.left = "0";
    style.right = "0";
    style.width = "100%";
    return () => {
      style.position = "";
      style.top = "";
      style.left = "";
      style.right = "";
      style.width = "";
      window.scrollTo(0, y);
    };
  }, [open]);

  // Shell
  const lightShell = scrolled
    ? "bg-white/95 border-gray-200 shadow-lg"
    : "bg-white/90 border-transparent";
  const darkShell = scrolled
    ? "bg-black/95 border-gray-700 shadow-xl"
    : "bg-black/90 border-transparent";
  const shell =
    variant === "dark" ? `${darkShell} text-cream` : `${lightShell} text-deepCharcoal`;

  // Links
  const linkBase =
    variant === "dark"
      ? "text-[color:var(--color-on-primary)/0.9] hover:text-cream hover:tracking-wider transition-all duration-300"
      : "text-[color:var(--color-on-secondary)/0.9] hover:text-deepCharcoal hover:tracking-wider transition-all duration-300";

  const underlineActive = variant === "dark" ? "bg-softGold" : "bg-deepCharcoal";

  const EMAIL = siteConfig?.email || "info@abrahamoflondon.org";
  const PHONE = (siteConfig as any)?.phone || "";

  // Brand
  const brandClass = [
    "font-serif font-extrabold tracking-wider transition-all duration-300",
    scrolled ? "text-xl md:text-2xl" : "text-2xl md:text-3xl",
    variant === "dark" ? "text-cream hover:text-softGold" : "text-deepCharcoal hover:text-softGold",
  ].join(" ");

  // Header height var
  const headerStyle = React.useMemo(
    () =>
      ({ ["--header-h"]: scrolled ? "4.5rem" : "6rem" } as React.CSSProperties & {
        ["--header-h"]?: string;
      }),
    [scrolled]
  );

  // Framer Motion transition
  const motionTransition: Transition = { type: "spring", stiffness: 100, damping: 24, mass: 0.5 };

  return (
    <motion.header
      className={`supports-[backdrop-filter]:bg-opacity-60 fixed inset-x-0 top-0 z-50 border-b backdrop-blur ${shell}`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={motionTransition as any}
      role="navigation"
      aria-label="Primary"
      style={headerStyle}
    >
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-6 transition-all duration-300"
        style={{ height: scrolled ? "4rem" : "5rem" }}
      >
        {/* Brand */}
        <Link href="/" aria-label="Home" className={brandClass}>
          Abraham of London
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-10 md:flex">
          <ul className="flex items-center gap-8">
            {NAV.map((item) => (
              <li key={item.href} className="relative">
                <Link
                  href={item.href}
                  className={`text-base font-medium transition-colors ${linkBase}`}
                  aria-current={isActive(item.href) ? "page" : undefined}
                >
                  {item.label}
                </Link>
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute -bottom-1 left-0 block h-[2px] transition-all duration-300 ${
                    isActive(item.href) ? `w-full ${underlineActive}` : "w-0"
                  }`}
                />
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="flex items-center gap-4 border-l border-current/20 pl-6">
            <a
              href={`mailto:${EMAIL}`}
              className={`text-sm underline-offset-4 hover:underline ${linkBase}`}
              aria-label="Email Abraham"
            >
              Email
            </a>
            {PHONE && (
              <a
                href={`tel:${PHONE.replace(/\s+/g, "")}`}
                className={`text-sm underline-offset-4 hover:underline ${linkBase}`}
                aria-label="Call Abraham"
              >
                Call
              </a>
            )}
            <Link
              href="/contact"
              className="rounded-full bg-softGold px-6 py-2.5 text-sm font-semibold text-deepCharcoal transition hover:brightness-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-softGold/70"
              aria-label="Go to contact form"
            >
              Enquire
            </Link>
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className={`inline-flex items-center justify-center rounded-md border p-2 transition-colors ${
              variant === "dark"
                ? "border-white/30 text-cream hover:bg-white/10"
                : "border-black/30 text-deepCharcoal hover:bg-black/5"
            }`}
          >
            <span className="sr-only">Toggle navigation</span>
            {!open ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        id="mobile-nav"
        className={`md:hidden ${open ? "block" : "hidden"} ${
          variant === "dark" ? "bg-black/95" : "bg-white/95"
        } border-t ${variant === "dark" ? "border-white/20" : "border-black/20"} backdrop-blur`}
      >
        <nav className="mx-auto max-w-7xl px-6 py-6" aria-label="Mobile Primary">
          <ul className="grid gap-4">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-lg px-4 py-3 text-lg font-medium transition-colors ${
                    isActive(item.href)
                      ? variant === "dark"
                        ? "bg-white/10 text-cream"
                        : "bg-black/10 text-deepCharcoal"
                      : variant === "dark"
                      ? "text-[color:var(--color-on-primary)/0.9] hover:bg-white/5 hover:text-cream"
                      : "text-[color:var(--color-on-secondary)/0.9] hover:bg-black/5 hover:text-deepCharcoal"
                  }`}
                  aria-current={isActive(item.href) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="flex items-center gap-6 px-4 pt-4">
              <a
                href={`mailto:${EMAIL}`}
                onClick={() => setOpen(false)}
                className={`text-base underline-offset-4 hover:underline ${
                  variant === "dark"
                    ? "text-[color:var(--color-on-primary)/0.9]"
                    : "text-[color:var(--color-on-secondary)/0.9]"
                }`}
              >
                Email
              </a>
              {PHONE && (
                <a
                  href={`tel:${PHONE.replace(/\s+/g, "")}`}
                  onClick={() => setOpen(false)}
                  className={`text-base underline-offset-4 hover:underline ${
                    variant === "dark"
                      ? "text-[color:var(--color-on-primary)/0.9]"
                      : "text-[color:var(--color-on-secondary)/0.9]"
                  }`}
                >
                  Call
                </a>
              )}
            </li>
            <li className="pt-4">
              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className="block rounded-full bg-softGold px-5 py-3 text-center text-base font-semibold text-deepCharcoal transition hover:brightness-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-softGold/70"
              >
                Enquire
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Offset main by header height var */}
      <style jsx>{`
        :global(main) {
          padding-top: var(--header-h, 6rem);
        }
        @media (max-width: 767px) {
          :global(header[role="navigation"]) {
            --header-h: ${scrolled ? "4rem" : "5rem"};
          }
        }
      `}</style>
    </motion.header>
  );
}

