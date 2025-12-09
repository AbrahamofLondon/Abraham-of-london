// components/Navbar.tsx - MODERNIZED RESPONSIVE VERSION
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, BookOpen, Home, User, Mail, FileText } from "lucide-react";
import ScrollProgress from "@/components/ScrollProgress";

// Device detection hook
const useDeviceType = () => {
  const [deviceType, setDeviceType] = React.useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  React.useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      if (width < 768) setDeviceType('mobile');
      else if (width < 1024) setDeviceType('tablet');
      else setDeviceType('desktop');
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return deviceType;
};

// Safe area hook for iPhone notches
const useSafeArea = () => {
  const [safeArea, setSafeArea] = React.useState({ top: 0 });

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    
    const updateSafeArea = () => {
      const top = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0');
      setSafeArea({ top });
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
    return () => window.removeEventListener('resize', updateSafeArea);
  }, []);

  return safeArea;
};

type RouteId =
  | "home"
  | "about"
  | "contentIndex"
  | "booksIndex"
  | "canonIndex"
  | "ventures"
  | "downloadsIndex"
  | "contact";

const LOCAL_ROUTES: Record<RouteId, string> = {
  home: "/",
  about: "/about",
  contentIndex: "/content",
  booksIndex: "/books",
  canonIndex: "/canon",
  ventures: "/ventures",
  downloadsIndex: "/downloads",
  contact: "/contact",
};

type NavItem = {
  route: RouteId;
  label: string;
  icon?: React.ReactNode;
};

const getRoutePath = (route: RouteId): string => {
  return LOCAL_ROUTES[route] || "/";
};

// Enhanced navigation items with icons
const NAV_ITEMS: NavItem[] = [
  { route: "home", label: "Home", icon: <Home className="h-4 w-4" /> },
  { route: "booksIndex", label: "Books", icon: <BookOpen className="h-4 w-4" /> },
  { route: "contentIndex", label: "Content", icon: <FileText className="h-4 w-4" /> },
  { route: "about", label: "About", icon: <User className="h-4 w-4" /> },
  { route: "contact", label: "Contact", icon: <Mail className="h-4 w-4" /> },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const pathname = usePathname();
  const deviceType = useDeviceType();
  const safeArea = useSafeArea();

  // Scroll detection for dynamic header
  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  const isActive = (route: RouteId) => {
    const href = getRoutePath(route);
    if (href === "/") return pathname === "/";
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  // Responsive header height
  const headerHeight = scrolled 
    ? (deviceType === 'mobile' ? '3.5rem' : '4rem')
    : (deviceType === 'mobile' ? '4rem' : '5rem');

  return (
    <>
      {/* Progress Bar */}
      <ScrollProgress heightClass="h-1" colorClass="bg-amber-500" />

      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`fixed w-full z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg shadow-sm border-b border-gray-200 dark:border-gray-800' 
            : 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md'
        }`}
        style={{
          height: headerHeight,
          paddingTop: safeArea.top > 0 ? `${safeArea.top}px` : undefined,
        }}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="mx-auto h-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-full items-center justify-between">
            {/* Logo/Brand */}
            <Link
              href={getRoutePath("home")}
              className="group flex items-center gap-2 md:gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 rounded-lg"
              prefetch={true}
              aria-label="Fathering Without Fear - Home"
            >
              <div className={`
                flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full transition-all duration-300
                ${scrolled 
                  ? 'bg-amber-500 text-white' 
                  : 'bg-amber-500 text-white group-hover:bg-amber-600'
                }
                group-active:scale-95
              `}>
                <BookOpen className="h-4 w-4 md:h-5 md:w-5" />
              </div>
              <div className="flex flex-col">
                <span className={`
                  font-serif font-bold leading-tight transition-all duration-300
                  ${scrolled 
                    ? 'text-lg md:text-xl text-gray-900 dark:text-white' 
                    : 'text-xl md:text-2xl text-gray-900 dark:text-white'
                  }
                `}>
                  Fathering Without Fear
                </span>
                <span className="hidden text-xs text-gray-500 dark:text-gray-400 md:block">
                  Faith · Strategy · Fatherhood
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden items-center gap-1 lg:flex lg:gap-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.route}
                  href={getRoutePath(item.route)}
                  className={`
                    group relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200
                    ${isActive(item.route)
                      ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50
                    active:scale-95
                  `}
                  prefetch={true}
                  aria-current={isActive(item.route) ? "page" : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {isActive(item.route) && (
                    <motion.div
                      className="absolute -bottom-1 left-4 right-4 h-0.5 rounded-full bg-amber-500 dark:bg-amber-400"
                      layoutId="active-indicator"
                    />
                  )}
                </Link>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`
                inline-flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200
                lg:hidden
                ${isOpen
                  ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
                focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50
                active:scale-95
              `}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              aria-label={isOpen ? "Close menu" : "Open menu"}
            >
              {isOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                aria-hidden="true"
              />

              {/* Menu Panel */}
              <motion.div
                id="mobile-menu"
                className="fixed right-0 top-0 z-50 h-screen w-[85vw] max-w-sm overflow-y-auto bg-white dark:bg-gray-900 lg:hidden"
                style={{
                  paddingTop: `calc(${headerHeight} + ${safeArea.top}px)`,
                  paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                }}
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                role="dialog"
                aria-modal="true"
                aria-label="Mobile menu"
              >
                <nav className="px-4 py-6" aria-label="Mobile navigation">
                  <ul className="space-y-1">
                    {NAV_ITEMS.map((item) => (
                      <li key={item.route}>
                        <Link
                          href={getRoutePath(item.route)}
                          onClick={() => setIsOpen(false)}
                          className={`
                            flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors duration-200
                            ${isActive(item.route)
                              ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50
                            active:scale-95
                          `}
                          prefetch={true}
                          aria-current={isActive(item.route) ? "page" : undefined}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                          {isActive(item.route) && (
                            <div className="ml-auto h-2 w-2 rounded-full bg-amber-500 dark:bg-amber-400" />
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>

                  {/* Call to Action in Mobile Menu */}
                  <div className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-6">
                    <Link
                      href="/books/the-architecture-of-human-purpose"
                      onClick={() => setIsOpen(false)}
                      className="block w-full rounded-lg bg-amber-500 px-4 py-3 text-center text-sm font-semibold text-white transition-all hover:bg-amber-600 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
                      prefetch={true}
                    >
                      Read Canon Prelude
                    </Link>
                    <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
                      Start with the architectural foundation
                    </p>
                  </div>
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Global styles for header spacing and mobile optimizations */}
      <style jsx global>{`
        :root {
          --header-height: ${headerHeight};
          --sat: env(safe-area-inset-top, 0px);
          --sab: env(safe-area-inset-bottom, 0px);
          --sal: env(safe-area-inset-left, 0px);
          --sar: env(safe-area-inset-right, 0px);
        }

        main {
          padding-top: calc(var(--header-height) + var(--sat, 0px));
        }

        /* Enhanced touch targets */
        @media (max-width: 768px) {
          button, 
          a[role="button"],
          .touch-target {
            min-height: 44px;
            min-width: 44px;
          }
        }

        /* Prevent zoom on iOS inputs */
        @supports (-webkit-touch-callout: none) {
          input, 
          textarea {
            font-size: 16px !important;
          }
        }

        /* Improve scrolling on iOS */
        html {
          -webkit-overflow-scrolling: touch;
        }

        /* Reduced motion preferences */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        /* Enhanced focus styles */
        *:focus-visible {
          outline: 2px solid #f59e0b;
          outline-offset: 2px;
        }
      `}</style>
    </>
  );
}