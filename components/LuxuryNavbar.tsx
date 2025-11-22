// components/LuxuryNavbar.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import ThemeToggle from "@/components/ThemeToggle";
import { siteConfig, getRoutePath, type RouteId } from "@/lib/siteConfig";

type LuxuryNavbarProps = {
  variant?: "light" | "dark";
  transparent?: boolean;
};

const NAV_ITEMS: { route: RouteId; label: string }[] = [
  { route: "booksIndex", label: "Books" },
  { route: "contentIndex", label: "Insights" },
  { route: "ventures", label: "Ventures" },
  { route: "about", label: "About" },
  { route: "contact", label: "Contact" },
];

interface SiteConfigWithPhone {
  email?: string;
  phone?: string | number;
}

export default function LuxuryNavbar({
  variant = "dark",
  transparent = false,
}: LuxuryNavbarProps): JSX.Element {
  const [isOpen, setIsOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [path, setPath] = React.useState<string>("/");
  const [mounted, setMounted] = React.useState(false);

  // Mark mounted to avoid SSR/CSR mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Scroll behaviour
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Track current path for active states
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const updatePath = () => {
      setPath(window.location.pathname || "/");
    };

    updatePath();

    const onPopState = () => {
      setTimeout(updatePath, 10);
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const link = target?.closest("a[href]");
      if (link && link.getAttribute("href")?.startsWith("/")) {
        setTimeout(updatePath, 50);
      }
    };

    window.addEventListener("popstate", onPopState);
    document.addEventListener("click", onClick, true);

    return () => {
      window.removeEventListener("popstate", onPopState);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  // Lock body scroll when mobile menu is open
  React.useEffect(() => {
    if (typeof document === "undefined") return;

    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const isActive = (route: RouteId) => {
    if (!mounted) return false;
    const href = getRoutePath(route);
    if (href === "/") return path === "/";
    return path === href || path.startsWith(href + "/");
  };

  const isDarkVariant = variant === "dark";

  const headerShell =
    scrolled || !transparent
      ? isDarkVariant
        ? "bg-black/70 border-b border-gold/20 backdrop-blur-md"
        : "bg-white/90 border-b border-black/10 backdrop-blur-md"
      : "bg-transparent";

  const linkBase =
    isDarkVariant
      ? "text-cream/80 hover:text-gold"
      : "text-deepCharcoal/80 hover:text-deepCharcoal";

  const activeUnderline = isDarkVariant ? "bg-gold" : "bg-deepCharcoal";

  const siteConfigWithPhone = siteConfig as SiteConfigWithPhone;
  const EMAIL = siteConfigWithPhone?.email || "info@abrahamoflondon.org";
  const PHONE =
    siteConfigWithPhone?.phone?.toString().trim() || "+442086225909";

  return (
    <>
      <header
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${headerShell}`}
      >
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Brand */}
            <Link
              href={getRoutePath("home")}
              className="font-serif text-2xl font-bold text-gold transition-opacity hover:opacity-80"
              prefetch
            >
              Abraham of London
            </Link>

            {/* Desktop nav */}
            <div className="hidden items-center gap-8 lg:flex">
              <ul className="flex items-center gap-6">
                {NAV_ITEMS.map((item) => (
                  <li key={item.route} className="relative">
                    <Link
                      href={getRoutePath(item.route)}
                      className={`text-sm font-medium transition-colors ${linkBase}`}
                      aria-current={isActive(item.route) ? "page" : undefined}
                      prefetch
                    >
                      {item.label}
                    </Link>
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute -bottom-1 left-0 block h-[2px] transition-all ${
                        isActive(item.route)
                          ? `w-full ${activeUnderline}`
                          : "w-0"
                      }`}
                    />
                  </li>
                ))}
              </ul>
            </div>

            {/* Desktop actions */}
            <div className="hidden items-center gap-4 lg:flex">
              <a
                href={`mailto:${EMAIL}`}
                className={`text-sm underline-offset-4 hover:underline ${linkBase}`}
              >
                Email
              </a>
              {PHONE && (
                <a
                  href={`tel:${PHONE.replace(/\s+/g, "")}`}
                  className={`text-sm underline-offset-4 hover:underline ${linkBase}`}
                >
                  Call
                </a>
              )}
              <Link
                href={getRoutePath("contact")}
                className="rounded-full bg-gold px-6 py-2 text-sm font-semibold text-charcoal transition-all hover:bg-amber-200 focus:outline-none focus-visible:ring-2"
                prefetch
              >
                Enquire
              </Link>
              <ThemeToggle size="sm" />
            </div>

            {/* Mobile controls */}
            <div className="flex items-center gap-2 lg:hidden">
              <ThemeToggle size="sm" />
              <button
                type="button"
                onClick={() => setIsOpen((o) => !o)}
                className={`p-2 ${
                  isDarkVariant ? "text-cream" : "text-deepCharcoal"
                } transition-colors hover:text-gold`}
                aria-label="Toggle menu"
                aria-expanded={isOpen}
                aria-controls="mobile-nav"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {isOpen && (
            <div
              id="mobile-nav"
              className={`lg:hidden border-t backdrop-blur-md ${
                isDarkVariant
                  ? "border-gold/20 bg-black/95"
                  : "border-black/10 bg-white/95"
              }`}
            >
              <div className="space-y-4 px-4 py-6">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.route}
                    href={getRoutePath(item.route)}
                    onClick={() => setIsOpen(false)}
                    className={`block rounded-md px-2 py-2 text-base font-medium transition-colors ${
                      isActive(item.route)
                        ? isDarkVariant
                          ? "bg-white/10 text-cream"
                          : "bg-black/5 text-deepCharcoal"
                        : isDarkVariant
                        ? "text-cream/80 hover:text-gold hover:bg-white/10"
                        : "text-deepCharcoal/80 hover:text-deepCharcoal hover:bg-black/5"
                    }`}
                    aria-current={isActive(item.route) ? "page" : undefined}
                    prefetch
                  >
                    {item.label}
                  </Link>
                ))}

                <div className="pt-3">
                  <Link
                    href={getRoutePath("contact")}
                    onClick={() => setIsOpen(false)}
                    className="block rounded-full bg-gold px-6 py-3 text-center text-sm font-semibold text-charcoal transition-all hover:bg-amber-200 focus:outline-none focus-visible:ring-2"
                    prefetch
                  >
                    Enquire
                  </Link>
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Padding for fixed header */}
      <style jsx global>{`
        main {
          padding-top: 5rem;
        }
        @media (max-width: 1024px) {
          main {
            padding-top: 5rem;
          }
        }
      `}</style>
    </>
  );
}