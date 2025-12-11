// components/LuxuryNavbar.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

// Self-contained types and configuration
type RouteId =
  | "home"
  | "about"
  | "blogIndex"
  | "contentIndex"
  | "booksIndex"
  | "canonIndex"
  | "shorts"
  | "ventures"
  | "downloadsIndex"
  | "strategyLanding"
  | "contact";

type LuxuryNavbarProps = {
  variant?: "light" | "dark";
  transparent?: boolean;
};

// Local route configuration
const LOCAL_ROUTES: Record<RouteId, string> = {
  home: "/",
  about: "/about",
  blogIndex: "/blog",
  contentIndex: "/content",
  booksIndex: "/books",
  canonIndex: "/canon",
  shorts: "/shorts",
  ventures: "/ventures",
  downloadsIndex: "/downloads",
  strategyLanding: "/strategy",
  contact: "/contact",
};

// Local site configuration
const LOCAL_CONFIG = {
  email: "info@abrahamoflondon.org",
  phone: "+442086225909",
  title: "Abraham of London",
};

// Safe route path resolver
const getRoutePath = (route: RouteId): string => {
  return LOCAL_ROUTES[route] || "/";
};

// *** Central navigation items ***
// Shorts is explicitly present and will be highlighted.
const NAV_ITEMS: { route: RouteId; label: string }[] = [
  { route: "booksIndex", label: "Books" },
  { route: "canonIndex", label: "Canon" },
  { route: "shorts", label: "Shorts" },
  { route: "blogIndex", label: "Insights" },
  { route: "ventures", label: "Ventures" },
  { route: "about", label: "About" },
  { route: "contact", label: "Contact" },
];

export default function LuxuryNavbar({
  variant = "dark",
  transparent = false,
}: LuxuryNavbarProps): JSX.Element {
  const [isOpen, setIsOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  const currentPath = usePathname();

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

    let ticking = false;
    const scrollListener = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", scrollListener, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", scrollListener);
  }, []);

  // Lock body scroll when mobile menu is open
  React.useEffect(() => {
    if (typeof document === "undefined") return;

    if (!isOpen) return;

    const scrollY = window.scrollY;
    const body = document.body;

    // Store original styles
    const originalStyles = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      overflow: body.style.overflow,
    };

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.overflow = "hidden";

    return () => {
      body.style.position = originalStyles.position;
      body.style.top = originalStyles.top;
      body.style.left = originalStyles.left;
      body.style.right = originalStyles.right;
      body.style.overflow = originalStyles.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  const isActive = (route: RouteId) => {
    if (!mounted) return false;
    const href = getRoutePath(route);
    if (href === "/") return currentPath === "/";
    return currentPath === href || currentPath?.startsWith(href + "/");
  };

  const isDarkVariant = variant === "dark";

  const headerShell =
    scrolled || !transparent
      ? isDarkVariant
        ? "bg-black/95 border-b border-amber-500/20 backdrop-blur-xl shadow-2xl"
        : "bg-white/95 border-b border-gray-200/80 backdrop-blur-xl shadow-lg"
      : "bg-transparent border-transparent";

  const linkBase = isDarkVariant
    ? "text-gray-100 hover:text-amber-400 transition-colors duration-300"
    : "text-gray-700 hover:text-gray-900 transition-colors duration-300";

  const activeUnderline = isDarkVariant ? "bg-amber-500" : "bg-gray-900";

  const mobileNavBackground = isDarkVariant
    ? "bg-gray-900/98 border-amber-500/20 backdrop-blur-2xl"
    : "bg-white/98 border-gray-200/80 backdrop-blur-2xl";

  const EMAIL = LOCAL_CONFIG.email;
  const PHONE = LOCAL_CONFIG.phone;

  return (
    <>
      <header
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-500 ease-out ${headerShell}`}
      >
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Brand */}
            <Link
              href={getRoutePath("home")}
              className="font-serif text-2xl font-bold text-amber-500 transition-all duration-300 hover:scale-105 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-amber-500/50 rounded-lg"
              prefetch={true}
            >
              Abraham of London
            </Link>

            {/* Desktop nav */}
            <div className="hidden items-center gap-8 lg:flex">
              <ul className="flex items-center gap-8">
                {NAV_ITEMS.map((item) => {
                  const active = isActive(item.route);
                  const isShorts = item.route === "shorts";

                  const baseClasses = `text-sm font-semibold tracking-wide px-2 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${linkBase}`;

                  const shortsClasses = isShorts
                    ? isDarkVariant
                      ? "rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300 shadow-[0_0_18px_rgba(251,191,36,0.45)] px-4 py-1"
                      : "rounded-full border border-amber-500/40 bg-amber-100 text-amber-800 px-4 py-1"
                    : "";

                  return (
                    <li key={item.route} className="relative">
                      <Link
                        href={getRoutePath(item.route)}
                        className={`${baseClasses} ${shortsClasses}`}
                        aria-current={active ? "page" : undefined}
                        prefetch={true}
                      >
                        {item.label}
                      </Link>
                      {!isShorts && (
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none absolute -bottom-1 left-0 block h-0.5 transition-all duration-300 ${
                            active
                              ? `w-full ${activeUnderline}`
                              : "w-0 opacity-0"
                          }`}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Desktop actions */}
            <div className="hidden items-center gap-6 lg:flex">
              <a
                href={`mailto:${EMAIL}`}
                className={`text-sm font-medium underline-offset-4 hover:underline ${linkBase} transition-all duration-300`}
              >
                Email
              </a>
              {PHONE && (
                <a
                  href={`tel:${PHONE.replace(/\s+/g, "")}`}
                  className={`text-sm font-medium underline-offset-4 hover:underline ${linkBase} transition-all duration-300`}
                >
                  Call
                </a>
              )}
              <Link
                href={getRoutePath("contact")}
                className="rounded-full bg-amber-500 px-6 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:scale-105 hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/25 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:ring-offset-2 focus:ring-offset-black"
                prefetch={true}
              >
                Enquire
              </Link>
              <ThemeToggle size="sm" />
            </div>

            {/* Mobile controls */}
            <div className="flex items-center gap-3 lg:hidden">
              <ThemeToggle size="sm" />
              <button
                type="button"
                onClick={() => setIsOpen((o) => !o)}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  isDarkVariant
                    ? "text-gray-100 hover:bg-white/10 hover:text-amber-400"
                    : "text-gray-700 hover:bg-black/5 hover:text-gray-900"
                } focus:outline-none focus:ring-2 focus:ring-amber-500/50`}
                aria-label="Toggle menu"
                aria-expanded={isOpen}
                aria-controls="mobile-nav"
              >
                {isOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {isOpen && (
            <div
              id="mobile-nav"
              className={`lg:hidden border-t backdrop-blur-xl transition-all duration-300 ${mobileNavBackground}`}
            >
              <div className="space-y-1 px-4 py-6">
                {NAV_ITEMS.map((item) => {
                  const active = isActive(item.route);
                  const isShorts = item.route === "shorts";

                  return (
                    <Link
                      key={item.route}
                      href={getRoutePath(item.route)}
                      onClick={() => setIsOpen(false)}
                      className={`block rounded-lg px-4 py-3 text-base font-semibold transition-all duration-300 ${
                        active
                          ? isDarkVariant
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-amber-500/10 text-gray-900 border border-amber-500/20"
                          : isDarkVariant
                            ? "text-gray-100 hover:text-amber-400 hover:bg-white/10 border border-transparent"
                            : "text-gray-700 hover:text-gray-900 hover:bg-black/5 border border-transparent"
                      } ${isShorts ? "border-amber-500/40" : ""}`}
                      aria-current={active ? "page" : undefined}
                      prefetch={true}
                    >
                      {item.label}
                    </Link>
                  );
                })}

                <div className="pt-4 space-y-3">
                  <a
                    href={`mailto:${EMAIL}`}
                    onClick={() => setIsOpen(false)}
                    className={`block rounded-lg px-4 py-3 text-base font-semibold text-center transition-all duration-300 ${
                      isDarkVariant
                        ? "bg-gray-800 text-gray-100 hover:bg-gray-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    } focus:outline-none focus:ring-2 focus:ring-amber-500/50`}
                  >
                    Email Us
                  </a>
                  {PHONE && (
                    <a
                      href={`tel:${PHONE.replace(/\s+/g, "")}`}
                      onClick={() => setIsOpen(false)}
                      className={`block rounded-lg px-4 py-3 text-base font-semibold text-center transition-all duration-300 ${
                        isDarkVariant
                          ? "bg-gray-800 text-gray-100 hover:bg-gray-700"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      } focus:outline-none focus:ring-2 focus:ring-amber-500/50`}
                    >
                      Call Us
                    </a>
                  )}
                  <Link
                    href={getRoutePath("contact")}
                    onClick={() => setIsOpen(false)}
                    className="block rounded-full bg-amber-500 px-6 py-4 text-center text-base font-bold text-white transition-all duration-300 hover:scale-105 hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/25 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:ring-offset-2"
                    prefetch={true}
                  >
                    Enquire Now
                  </Link>
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Enhanced global styles */}
      <style jsx global>{`
        main {
          padding-top: 5rem;
        }
        @media (max-width: 1024px) {
          main {
            padding-top: 5rem;
          }
        }

        html {
          scroll-behavior: smooth;
        }

        *:focus-visible {
          outline: 2px solid #f59e0b;
          outline-offset: 2px;
        }
      `}</style>
    </>
  );
}