// components/Header.tsx
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import ThemeToggle from "./ThemeToggle";
import { siteConfig } from "@/lib/siteConfig";

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

  const lightShell = scrolled ? "bg-white/85 border-black/10 shadow-sm" : "bg-white/70 border-black/10";
  const darkShell = scrolled ? "bg-black/60 border-white/10 shadow-sm" : "bg-black/50 border-white/10";
  const shell = variant === "dark" ? `${darkShell} text-cream` : `${lightShell} text-deepCharcoal`;

  const linkBase =
    variant === "dark"
      ? "text-[color:var(--color-on-primary)/0.8] hover:text-cream"
      : "text-[color:var(--color-on-secondary)/0.8] hover:text-deepCharcoal";

  const underlineActive = variant === "dark" ? "bg-cream" : "bg-deepCharcoal";

  const EMAIL = siteConfig?.email || "info@abrahamoflondon.org";
  const PHONE = (siteConfig as any)?.phone || "";

  const brandClass = [
    "font-serif font-bold transition-all duration-200",
    scrolled ? "text-[1.35rem] md:text-[1.75rem]" : "text-2xl md:text-3xl",
    variant === "dark" ? "text-cream" : "text-deepCharcoal",
  ].join(" ");

  // CSS var for header height
  const headerStyle = React.useMemo(
    () =>
      ({ ["--header-h"]: scrolled ? "4rem" : "5rem" } as React.CSSProperties & {
        ["--header-h"]?: string;
      }),
    [scrolled]
  );

  return (
    <motion.header
      className={`fixed inset-x-0 top-0 z-50 border-b backdrop-blur supports-[backdrop-filter]:bg-opacity-60 ${shell}`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      role="navigation"
      aria-label="Primary"
      style={headerStyle}
    >
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-4"
        style={{ height: scrolled ? "3.75rem" : "5rem" }}
      >
        {/* Brand */}
        <Link href="/" aria-label="Home" className={brandClass}>
          Abraham of London
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          <ul className="flex items-center gap-6">
            {NAV.map((item) => (
              <li key={item.href} className="relative">
                <Link
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${linkBase}`}
                  aria-current={isActive(item.href) ? "page" : undefined}
                >
                  {item.label}
                </Link>
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute -bottom-1 left-0 block h-[2px] transition-all ${
                    isActive(item.href) ? `w-full ${underlineActive}` : "w-0"
                  }`}
                />
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="flex items-center gap-3">
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
            {/* Removed slash-opacity ring class to avoid guards */}
            <Link
              href="/contact"
              className="rounded-full bg-softGold px-5 py-2 text-sm font-semibold text-deepCharcoal transition hover:brightness-95 focus:outline-none focus-visible:ring-2"
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
            className={`inline-flex items-center justify-center rounded-md border p-2 ${
              variant === "dark" ? "border-white/20 text-cream" : "border-black/20 text-deepCharcoal"
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
          variant === "dark" ? "bg-black/80" : "bg-white/95"
        } border-t ${variant === "dark" ? "border-white/10" : "border-black/10"} backdrop-blur`}
      >
        <nav className="mx-auto max-w-7xl px-4 py-4" aria-label="Mobile Primary">
          <ul className="grid gap-2">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-md px-3 py-2 text-base font-medium ${
                    isActive(item.href)
                      ? variant === "dark"
                        ? "bg-white/10 text-cream"
                        : "bg-black/5 text-deepCharcoal"
                      : variant === "dark"
                      ? "text-[color:var(--color-on-primary)/0.8] hover:bg-white/10 hover:text-cream"
                      : "text-[color:var(--color-on-secondary)/0.8] hover:bg-black/5 hover:text-deepCharcoal"
                  }`}
                  aria-current={isActive(item.href) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="flex items-center gap-4 px-3 pt-3">
              <a
                href={`mailto:${EMAIL}`}
                onClick={() => setOpen(false)}
                className={`text-base underline-offset-4 hover:underline ${
                  variant === "dark" ? "text-[color:var(--color-on-primary)/0.9]" : "text-[color:var(--color-on-secondary)/0.9]"
                }`}
              >
                Email
              </a>
              {PHONE && (
                <a
                  href={`tel:${PHONE.replace(/\s+/g, "")}`}
                  onClick={() => setOpen(false)}
                  className={`text-base underline-offset-4 hover:underline ${
                    variant === "dark" ? "text-[color:var(--color-on-primary)/0.9]" : "text-[color:var(--color-on-secondary)/0.9]"
                  }`}
                >
                  Call
                </a>
              )}
            </li>
            <li className="pt-2">
              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className="block rounded-full bg-softGold px-5 py-2 text-center text-sm font-semibold text-deepCharcoal transition hover:brightness-95 focus:outline-none focus-visible:ring-2"
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
          padding-top: var(--header-h, 5rem);
        }
        @media (max-width: 767px) {
          :global(header[role="navigation"]) {
            --header-h: ${scrolled ? "3.5rem" : "4rem"};
          }
        }
      `}</style>
    </motion.header>
  );
}
