"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone, Mail } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

// --- Self-contained Types & Constants ----------------------------------------

type RouteId =
  | "home"
  | "about"
  | "blogIndex"
  | "contentIndex"
  | "booksIndex"
  | "canonIndex"
  | "ventures"
  | "downloadsIndex"
  | "strategyLanding"
  | "contact";

type HeaderProps = {
  initialTheme?: "light" | "dark";
  transparent?: boolean;
};

type NavItem = {
  route: RouteId;
  label: string;
  description?: string;
};

// Local site configuration to avoid external dependencies
const LOCAL_SITE_CONFIG = {
  email: "info@abrahamoflondon.org",
  phone: "+44 20 8622 5909",
  routes: {
    home: { path: "/" },
    about: { path: "/about" },
    blogIndex: { path: "/blog" },
    contentIndex: { path: "/content" },
    booksIndex: { path: "/books" },
    canonIndex: { path: "/canon" },
    ventures: { path: "/ventures" },
    downloadsIndex: { path: "/downloads" },
    strategyLanding: { path: "/strategy" },
    contact: { path: "/contact" },
  },
} as const;

// Safe route path resolver
const getRoutePath = (route: RouteId): string => {
  const routeConfig = LOCAL_SITE_CONFIG.routes[route];
  return routeConfig?.path || "/";
};

const NAV_ITEMS: NavItem[] = [
  { route: "booksIndex", label: "Books", description: "Curated volumes" },
  { route: "canonIndex", label: "Canon", description: "The 10-volume system" },
  { route: "blogIndex", label: "Insights", description: "Strategic wisdom" },
  { route: "ventures", label: "Ventures", description: "Business pursuits" },
  { route: "about", label: "About", description: "My journey" },
  { route: "contact", label: "Contact", description: "Get in touch" },
];

const SCROLL_THRESHOLD = 8;

// Responsive header heights
const HEADER_HEIGHTS = {
  desktop: { normal: "5rem", scrolled: "4rem" },
  mobile: { normal: "4.25rem", scrolled: "3.5rem" },
} as const;

// --- Color System with enhanced accessibility --------------------------------

const COLOR_SYSTEM = {
  light: {
    shell: {
      normal: "bg-white/95 border-black/10 shadow-lg backdrop-blur-xl",
      transparent: "bg-transparent border-transparent",
    },
    text: {
      primary: "text-gray-900 font-semibold",
      secondary: "text-gray-700 font-medium",
      accent: "text-amber-600 font-bold",
    },
    interactive: {
      hover: "hover:text-amber-600 hover:scale-105 hover:font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/50",
      active: "text-amber-600 scale-105 font-bold",
    },
    glow: {
      normal: "",
      active: "drop-shadow-[0_0_4px_rgba(0,0,0,0.1)]",
    },
  },
  dark: {
    shell: {
      normal: "bg-gray-900/98 border-white/15 shadow-2xl backdrop-blur-xl",
      transparent: "bg-transparent border-transparent",
    },
    text: {
      primary: "text-white font-bold",
      secondary: "text-gray-300 font-semibold",
      accent: "text-amber-400 font-extrabold",
    },
    interactive: {
      hover: "hover:text-amber-400 hover:scale-105 hover:font-extrabold focus:outline-none focus:ring-2 focus:ring-amber-400/50",
      active: "text-amber-400 scale-105 font-extrabold",
    },
    glow: {
      normal: "",
      active: "drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]",
    },
  },
} as const;

// --- Enhanced Hooks -----------------------------------------------------------

const useScrollDetection = (threshold: number = SCROLL_THRESHOLD): boolean => {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = (): void => {
      const isScrolled = window.scrollY > threshold;
      setScrolled(isScrolled);
    };

    let ticking = false;
    const scrollListener = (): void => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Check if window is available (SSR safety)
    if (typeof window !== "undefined") {
      window.addEventListener("scroll", scrollListener, { passive: true });
      handleScroll();

      return () => window.removeEventListener("scroll", scrollListener);
    }
  }, [threshold]);

  return scrolled;
};

const useBodyScrollLock = (isLocked: boolean): void => {
  React.useEffect(() => {
    if (!isLocked || typeof document === "undefined") return;

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
  }, [isLocked]);
};

const useResolvedTheme = (initialTheme: "light" | "dark"): "light" | "dark" => {
  const [theme, setTheme] = React.useState<"light" | "dark">(initialTheme);

  React.useEffect(() => {
    const getTheme = (): "light" | "dark" => {
      if (typeof document === "undefined") return initialTheme;
      return document.documentElement.classList.contains("dark") ? "dark" : "light";
    };

    setTheme(getTheme());

    const observer = new MutationObserver(() => {
      setTheme(getTheme());
    });

    if (typeof document !== "undefined") {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
    }

    return () => observer.disconnect();
  }, [initialTheme]);

  return theme;
};

const useMovementDetection = (enabled: boolean = true): boolean => {
  const [isMoving, setIsMoving] = React.useState(false);

  React.useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return; // Fixed: return nothing instead of false
    }

    let movementTimer: NodeJS.Timeout;

    const handleMovement = (): void => {
      setIsMoving(true);
      clearTimeout(movementTimer);
      movementTimer = setTimeout(() => setIsMoving(false), 2000);
    };

    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "scroll",
      "touchstart",
      "keydown",
    ];

    events.forEach((event) => {
      window.addEventListener(event, handleMovement, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleMovement);
      });
      clearTimeout(movementTimer);
    };
  }, [enabled]);

  return isMoving;
};

// --- Enhanced Components -----------------------------------------------------

interface NavLinkProps {
  item: NavItem;
  isActive: boolean;
  theme: "light" | "dark";
  isMovementDetected: boolean;
  onClick?: () => void;
  variant?: "desktop" | "mobile";
}

const NavLink: React.FC<NavLinkProps> = ({
  item,
  isActive,
  theme,
  isMovementDetected,
  onClick,
  variant = "desktop",
}) => {
  const colors = COLOR_SYSTEM[theme];
  const isMobile = variant === "mobile";

  const baseStyles = `
    transition-all duration-300 ease-out
    ${colors.text.primary}
    ${isActive ? colors.interactive.active : colors.interactive.hover}
    ${isMobile ? "text-lg py-3 px-4 rounded-xl" : "text-sm lg:text-base"}
    ${theme === "dark" && isMovementDetected ? colors.glow.active : colors.glow.normal}
    focus:outline-none focus:ring-2 focus:ring-current/50 rounded-lg
  `;

  const activeStyles = isActive
    ? isMobile
      ? "bg-white/15 dark:bg-black/25"
      : ""
    : "";

  return (
    <li className={isMobile ? "w-full" : "relative"}>
      <Link
        href={getRoutePath(item.route)}
        onClick={onClick}
        className={`block ${baseStyles} ${activeStyles}`}
        aria-current={isActive ? "page" : undefined}
        prefetch={true}
      >
        <div className="flex flex-col">
          <span className={isMobile ? "font-bold" : ""}>{item.label}</span>
          {isMobile && item.description && (
            <span className={`mt-1 text-sm ${colors.text.secondary}`}>
              {item.description}
            </span>
          )}
        </div>
      </Link>
      {!isMobile && (
        <motion.span
          aria-hidden="true"
          className={`pointer-events-none absolute -bottom-1 left-0 h-0.5 ${
            isActive ? "bg-amber-500" : "bg-transparent"
          }`}
          initial={{ width: 0 }}
          animate={{ width: isActive ? "100%" : 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      )}
    </li>
  );
};

interface ContactButtonProps {
  type: "email" | "phone";
  value: string;
  theme: "light" | "dark";
  isMovementDetected: boolean;
  onClick?: () => void;
  variant?: "desktop" | "mobile";
}

const ContactButton: React.FC<ContactButtonProps> = ({
  type,
  value,
  theme,
  isMovementDetected,
  onClick,
  variant = "desktop",
}) => {
  const colors = COLOR_SYSTEM[theme];
  const isMobile = variant === "mobile";

  const href =
    type === "email" ? `mailto:${value}` : `tel:${value.replace(/\s+/g, "")}`;
  const label = type === "email" ? "Email" : "Call";
  const Icon = type === "email" ? Mail : Phone;

  const baseStyles = `
    flex items-center gap-2 transition-all duration-300
    ${colors.text.secondary}
    ${colors.interactive.hover}
    ${isMobile ? "text-base py-2 px-3 font-semibold" : "text-sm lg:text-base font-medium"}
    ${theme === "dark" && isMovementDetected ? colors.glow.active : colors.glow.normal}
    focus:outline-none focus:ring-2 focus:ring-current/50 rounded-lg
  `;

  return (
    <a
      href={href}
      onClick={onClick}
      className={baseStyles}
      aria-label={`${label} Abraham`}
    >
      <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </a>
  );
};

// --- Main Header Component ---------------------------------------------------

export default function Header({
  initialTheme = "light",
  transparent = false,
}: HeaderProps): JSX.Element {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);

  const scrolled = useScrollDetection(SCROLL_THRESHOLD);
  const currentPath = usePathname();
  const isMovementDetected = useMovementDetection();
  const theme = useResolvedTheme(initialTheme);
  const colors = COLOR_SYSTEM[theme];

  useBodyScrollLock(isOpen);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const isActive = React.useCallback(
    (route: RouteId): boolean => {
      if (!isMounted) return false;
      const href = getRoutePath(route);
      const path = currentPath || "";
      if (href === "/") return path === "/";
      return path === href || path.startsWith(`${href}/`);
    },
    [currentPath, isMounted]
  );

  const shellStyle =
    scrolled || !transparent ? colors.shell.normal : colors.shell.transparent;

  const headerHeight = scrolled
    ? HEADER_HEIGHTS.desktop.scrolled
    : HEADER_HEIGHTS.desktop.normal;

  const brandClass = `
    font-serif transition-all duration-300
    ${scrolled ? "text-[1.35rem] md:text-[1.85rem]" : "text-[1.6rem] md:text-[2.15rem]"}
    ${colors.text.accent}
    ${theme === "dark" && isMovementDetected ? colors.glow.active : colors.glow.normal}
    tracking-tight leading-tight focus:outline-none focus:ring-2 focus:ring-current/50 rounded-lg
  `;

  const { email, phone } = LOCAL_SITE_CONFIG;

  const MotionHeader = isMounted ? motion.header : "header";

  return (
    <MotionHeader
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${shellStyle}`}
      {...(isMounted && {
        initial: { y: -20, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: { duration: 0.4, ease: "easeOut" },
      })}
      role="banner"
      aria-label="Primary navigation"
      style={{ height: headerHeight }}
    >
      <nav className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 md:px-6">
        {/* Brand Logo */}
        <Link
          href={getRoutePath("home")}
          aria-label="Abraham of London - Home"
          className={brandClass}
          prefetch={true}
        >
          <span className="font-extrabold">Abraham</span>{" "}
          <span className="font-bold">of London</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 lg:gap-8 md:flex">
          <ul className="flex items-center gap-6 lg:gap-8">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.route}
                item={item}
                isActive={isActive(item.route)}
                theme={theme}
                isMovementDetected={isMovementDetected}
                variant="desktop"
              />
            ))}
          </ul>

          {/* Desktop Actions */}
          <div className="flex items-center gap-4 lg:gap-6">
            <div className="hidden items-center gap-4 border-r border-current/20 pr-4 lg:flex lg:pr-6">
              <ContactButton
                type="email"
                value={email}
                theme={theme}
                isMovementDetected={isMovementDetected}
              />
              <ContactButton
                type="phone"
                value={phone}
                theme={theme}
                isMovementDetected={isMovementDetected}
              />
            </div>

            {/* Canon Prelude CTA */}
            <Link
              href="/books/the-architecture-of-human-purpose-landing"
              className={`hidden rounded-full border border-amber-500/70 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-amber-600 dark:text-amber-400 transition-all duration-300 hover:scale-105 hover:bg-amber-500/10 hover:shadow-lg hover:shadow-amber-500/25 focus:outline-none focus:ring-2 focus:ring-amber-500/50 md:inline-block ${
                theme === "dark" && isMovementDetected ? "shadow-lg shadow-amber-400/30" : ""
              }`}
              aria-label="The Canon Prelude – Architecture of Human Purpose"
              prefetch={true}
            >
              Canon Prelude
            </Link>

            <Link
              href={getRoutePath("contact")}
              className={`hidden rounded-full bg-amber-500 px-5 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/25 focus:outline-none focus:ring-2 focus:ring-amber-500/50 md:inline-block lg:px-6 ${
                theme === "dark" && isMovementDetected ? "shadow-lg shadow-amber-400/30" : ""
              }`}
              aria-label="Go to contact form"
              prefetch={true}
            >
              Enquire
            </Link>

            <ThemeToggle />
          </div>
        </div>

        {/* Mobile Controls */}
        <div className="flex items-center gap-3 md:hidden">
          <ThemeToggle />
          <motion.button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            aria-expanded={isOpen}
            aria-controls="mobile-nav"
            aria-label="Toggle navigation menu"
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl p-2.5 transition-all duration-300 ${
              theme === "dark"
                ? "bg-white/15 text-white hover:bg-white/25"
                : "bg-black/10 text-gray-900 hover:bg-black/20"
            } ${theme === "dark" && isMovementDetected ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" : ""} focus:outline-none focus:ring-2 focus:ring-current/50`}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-nav"
            className={`fixed inset-0 top-[var(--header-height)] md:hidden ${
              theme === "dark"
                ? "bg-gray-900/98 text-white backdrop-blur-2xl"
                : "bg-white/98 text-gray-900 backdrop-blur-2xl"
            }`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
          >
            <nav
              className="flex h-full flex-col px-6 py-8"
              aria-label="Mobile navigation"
            >
              <ul className="space-y-2">
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.route}
                    item={item}
                    isActive={isActive(item.route)}
                    theme={theme}
                    isMovementDetected={isMovementDetected}
                    onClick={() => setIsOpen(false)}
                    variant="mobile"
                  />
                ))}
              </ul>

              {/* Mobile Canon Prelude CTA */}
              <div className="mt-6">
                <Link
                  href="/books/the-architecture-of-human-purpose-landing"
                  onClick={() => setIsOpen(false)}
                  className={`block w-full rounded-xl border border-amber-500/70 bg-black/5 dark:bg-white/5 px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.22em] text-amber-600 dark:text-amber-400 transition-all duration-300 hover:scale-105 hover:bg-amber-500/10 hover:shadow-lg hover:shadow-amber-500/25 focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                    theme === "dark" && isMovementDetected ? "shadow-lg shadow-amber-400/30" : ""
                  }`}
                  prefetch={true}
                >
                  Canon Prelude
                </Link>
              </div>

              {/* Mobile Contact Actions */}
              <div className="mt-auto space-y-4 pt-8">
                <div className="flex gap-6">
                  <ContactButton
                    type="email"
                    value={email}
                    theme={theme}
                    isMovementDetected={isMovementDetected}
                    onClick={() => setIsOpen(false)}
                    variant="mobile"
                  />
                  <ContactButton
                    type="phone"
                    value={phone}
                    theme={theme}
                    isMovementDetected={isMovementDetected}
                    onClick={() => setIsOpen(false)}
                    variant="mobile"
                  />
                </div>

                <Link
                  href={getRoutePath("contact")}
                  onClick={() => setIsOpen(false)}
                  className={`block w-full rounded-xl px-6 py-4 text-center text-sm font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/25 focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                    theme === "dark" ? "bg-amber-400 text-gray-900" : "bg-amber-500 text-white"
                  } ${
                    theme === "dark" && isMovementDetected ? "shadow-lg shadow-amber-400/30" : ""
                  }`}
                  prefetch={true}
                >
                  Enquire Now
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global header styles */}
      <style jsx global>{`
        :root {
          --header-height: ${headerHeight};
        }

        main {
          padding-top: var(--header-height);
        }

        /* Enhanced focus styles for accessibility */
        .focus-outline {
          outline: 2px solid currentColor;
          outline-offset: 2px;
        }

        @media (max-width: 767px) {
          :root {
            --header-height: ${
              scrolled
                ? HEADER_HEIGHTS.mobile.scrolled
                : HEADER_HEIGHTS.mobile.normal
            };
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </MotionHeader>
  );
}