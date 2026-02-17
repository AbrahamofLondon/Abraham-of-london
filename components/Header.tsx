/* components/Header.tsx — INSTITUTIONAL NAV (Spacing-safe, overflow-safe) */
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";

import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/lib/ThemeContext";

type RouteId =
  | "home"
  | "canon"
  | "library"
  | "briefs"
  | "shorts"
  | "ventures"
  | "about"
  | "contact"
  | "vault";

type NavItem = {
  route: RouteId;
  label: string;
  description?: string;
  highlight?: boolean;
};

const ROUTES: Record<RouteId, string> = {
  home: "/",
  canon: "/canon",
  library: "/library",
  briefs: "/briefs",
  shorts: "/shorts",
  ventures: "/ventures",
  about: "/about",
  contact: "/contact",
  // ✅ Correct vault destination (your earlier navbar uses /downloads/vault)
  vault: "/downloads/vault",
};

const NAV_ITEMS: NavItem[] = [
  { route: "canon", label: "Canon", description: "Doctrine & method" },
  { route: "briefs", label: "Briefs", description: "Operator notes" },
  { route: "library", label: "Library", description: "Archive & research" },
  { route: "ventures", label: "Ventures", description: "Execution arms" },
  { route: "shorts", label: "Shorts", description: "Short-form signal", highlight: true },
  { route: "about", label: "About", description: "The platform" },
  { route: "vault", label: "Vault", description: "Tools & downloads" },
];

export default function Header({ transparent = false }: { transparent?: boolean }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";

  const currentPath = (router.asPath || "/").split("#")[0] || "/";
  const headerSolid = scrolled || !transparent;

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu on route change
  React.useEffect(() => {
    const close = () => setIsOpen(false);
    router.events?.on("routeChangeStart", close);
    return () => router.events?.off("routeChangeStart", close);
  }, [router.events]);

  // ✅ Body scroll lock when mobile menu open (prevents “bleed” / horizontal scroll artifacts)
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const body = document.body;

    if (isOpen) {
      body.style.overflow = "hidden";
      body.style.touchAction = "none";
    } else {
      body.style.overflow = "";
      body.style.touchAction = "";
    }

    return () => {
      body.style.overflow = "";
      body.style.touchAction = "";
    };
  }, [isOpen]);

  const getRoutePath = (route: RouteId) => ROUTES[route] || "/";

  const isActive = (route: RouteId) => {
    const path = getRoutePath(route);
    return path === "/" ? currentPath === "/" : currentPath.startsWith(path);
  };

  return (
    <>
      <header
        className={[
          "fixed inset-x-0 top-0 z-[70] h-20 flex items-center transition-all duration-300",
          // ✅ don’t rely on overflow-x-clip (not consistent everywhere)
          "overflow-hidden",
          headerSolid
            ? "bg-black/80 backdrop-blur-md border-b border-white/10"
            : "bg-transparent border-b border-transparent",
        ].join(" ")}
      >
        {headerSolid && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"
          />
        )}

        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-12">
          {/* ✅ Make the row resilient: brand can shrink, nav can shrink, no overlap */}
          <div className="flex items-center justify-between gap-4">
            {/* Brand */}
            <Link href="/" className="group inline-flex min-w-0 flex-1 items-baseline gap-3">
              <span className="min-w-0 truncate font-serif text-xl sm:text-2xl lg:text-3xl tracking-tight text-white/95 group-hover:text-amber-100 transition-colors">
                Abraham of London
              </span>
              <span className="hidden md:inline shrink-0 text-[10px] font-mono uppercase tracking-[0.35em] text-amber-200/55">
                Institutional Platform
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex min-w-0 items-center gap-5" aria-label="Primary">
              {/* ✅ Explicit gap inside the UL so items never “touch” */}
              <ul className="flex min-w-0 items-center gap-1 whitespace-nowrap">
                {NAV_ITEMS.map((item) => (
                  <li key={item.route} className="flex">
                    <Link
                      href={getRoutePath(item.route)}
                      className={[
                        "px-3 py-2",
                        "text-[11px] font-mono uppercase tracking-[0.25em] transition-colors rounded-full",
                        isActive(item.route)
                          ? "text-amber-100 bg-amber-500/10"
                          : "text-white/70 hover:text-white hover:bg-white/5",
                        item.highlight ? "text-amber-200/90" : "",
                      ].join(" ")}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Right side controls */}
              <div className="flex shrink-0 items-center gap-4 pl-5 border-l border-white/10">
                <ThemeToggle />
                <Link
                  href="/contact"
                  className={[
                    "inline-flex items-center gap-2 rounded-full px-6 py-2.5",
                    "text-[10px] font-mono uppercase tracking-[0.3em] transition-all",
                    theme === "dark"
                      ? "bg-amber-500 text-black hover:bg-amber-400"
                      : "bg-white text-black hover:bg-white/90",
                  ].join(" ")}
                >
                  Inquiries <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </nav>

            {/* Mobile */}
            <div className="flex shrink-0 items-center gap-3 lg:hidden">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setIsOpen((v) => !v)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/85 hover:text-white hover:bg-white/10 transition-colors"
                aria-label={isOpen ? "Close menu" : "Open menu"}
                aria-expanded={isOpen}
              >
                {isOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ✅ Mobile Drawer MUST be above header, not behind it */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.28 }}
            className="fixed inset-0 z-[90] lg:hidden bg-black"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
          >
            {/* Backdrop (click to close) */}
            <button
              type="button"
              aria-label="Close menu overlay"
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/70"
            />

            <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.06]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(245,158,11,0.6),transparent_55%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_75%,rgba(245,158,11,0.25),transparent_55%)]" />
            </div>

            <div className="relative ml-auto h-full w-[88vw] max-w-sm border-l border-white/10 bg-black/95 backdrop-blur-xl">
              {/* Top bar */}
              <div className="flex items-center justify-between p-6 pt-6 border-b border-white/10">
                <span className="font-serif text-lg text-white/90">Menu</span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/85 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="relative px-6 py-8 overflow-y-auto">
                <ul className="space-y-5">
                  {NAV_ITEMS.map((item) => (
                    <li key={item.route}>
                      <Link
                        href={getRoutePath(item.route)}
                        className="block rounded-2xl border border-white/10 bg-white/5 px-5 py-4 hover:bg-white/10 transition-colors"
                      >
                        <span
                          className={[
                            "block text-xl font-serif",
                            item.highlight ? "text-amber-200" : "text-white/90",
                            isActive(item.route) ? "text-amber-100" : "",
                          ].join(" ")}
                        >
                          {item.label}
                        </span>
                        {item.description && (
                          <p className="mt-1 text-sm text-white/45">{item.description}</p>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 border-t border-white/10 pt-6">
                  <Link
                    href="/contact"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-[10px] font-mono uppercase tracking-[0.3em] text-black hover:bg-amber-400 transition-all"
                  >
                    Inquiries <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}