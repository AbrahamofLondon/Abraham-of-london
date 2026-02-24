/* components/Header.tsx — INSTITUTIONAL NAV (Transparent, never invisible, links correct) */
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";

import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/lib/ThemeContext";

// ✅ HEADER HEIGHT CONSTANT - matches scroll-mt-20 in your content
const HEADER_HEIGHT = 80; // 5rem = 80px (h-20)

type RouteId =
  | "home"
  | "canon"
  | "books"
  | "library"
  | "essays"
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
  books: "/books",
  library: "/library",
  essays: "/blog",
  shorts: "/shorts",
  ventures: "/ventures",
  about: "/about",
  contact: "/contact",
  vault: "/vault",
};

const NAV_ITEMS: NavItem[] = [
  { route: "canon", label: "Canon", description: "Doctrine & method" },
  { route: "books", label: "Books", description: "Volumes & works" },
  { route: "essays", label: "Essays", description: "Literary intelligence" },
  { route: "library", label: "Library", description: "Archive & research" },
  { route: "ventures", label: "Ventures", description: "Execution arms" },
  { route: "shorts", label: "Shorts", description: "Short-form signal", highlight: true },
  { route: "about", label: "About", description: "The platform" },
  { route: "vault", label: "Vault", description: "Tools & downloads" },
];

function safePathname(v: unknown) {
  return typeof v === "string" ? v.split("#")[0] || "/" : "/";
}

export default function Header({ transparent = false }: { transparent?: boolean }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";

  const currentPath = safePathname(router.asPath || "/");
  const headerSolid = scrolled || !transparent;

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    const close = () => setIsOpen(false);
    router.events?.on("routeChangeStart", close);
    return () => router.events?.off("routeChangeStart", close);
  }, [router.events]);

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
          "fixed inset-x-0 top-0 z-[100] flex items-center",
          "transition-all duration-300",
          headerSolid
            ? "bg-black/78 backdrop-blur-xl border-b border-white/10"
            : "bg-transparent border-b border-transparent",
        ].join(" ")}
        style={{ height: HEADER_HEIGHT }} // Explicit height for perfect scroll offset matching
      >
        {!headerSolid ? (
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/22 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        ) : (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"
          />
        )}

        <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="group inline-flex min-w-0 flex-1 items-center gap-3">
              <span className="min-w-0 truncate font-serif text-xl sm:text-2xl lg:text-3xl tracking-tight text-white/95 group-hover:text-amber-100 transition-colors">
                Abraham of London
              </span>

              {/* REMOVED: "Institutional Platform" text */}

              <span className="md:hidden shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">
                Platform
              </span>
            </Link>

            {/* Desktop */}
            <nav className="hidden lg:flex min-w-0 items-center gap-5" aria-label="Primary">
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

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[200] lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
          >
            <button
              type="button"
              aria-label="Close menu overlay"
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/70"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.28 }}
              className="absolute right-0 top-0 h-full w-[88vw] max-w-sm border-l border-white/10 bg-black/94 backdrop-blur-2xl"
              style={{ WebkitBackdropFilter: "blur(24px)" }}
            >
              <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.08]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(245,158,11,0.55),transparent_55%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_75%,rgba(245,158,11,0.22),transparent_55%)]" />
              </div>

              <div className="relative flex items-center justify-between p-6 border-b border-white/10">
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
                        className={[
                          "block rounded-2xl border border-white/10 bg-white/5 px-5 py-4 hover:bg-white/10 transition-colors",
                          isActive(item.route) ? "ring-1 ring-amber-500/25 bg-amber-500/10" : "",
                        ].join(" ")}
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
                        {item.description ? <p className="mt-1 text-sm text-white/45">{item.description}</p> : null}
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}