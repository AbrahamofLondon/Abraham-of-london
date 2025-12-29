"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone, Mail } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

// --- Types & Constants -------------------------------------------------------
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

type HeaderProps = {
  initialTheme?: "light" | "dark";
  transparent?: boolean;
};

type NavItem = {
  route: RouteId;
  label: string;
  description?: string;
};

// Device detection for optimal styling
const useDeviceType = () => {
  const [deviceType, setDeviceType] =
    React.useState<"mobile" | "tablet" | "desktop">("desktop");

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const checkDevice = () => {
      const width = window.innerWidth;
      if (width < 768) setDeviceType("mobile");
      else if (width < 1024) setDeviceType("tablet");
      else setDeviceType("desktop");
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  return deviceType;
};

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
    shorts: { path: "/shorts" },
    ventures: { path: "/ventures" },
    downloadsIndex: { path: "/downloads" },
    strategyLanding: { path: "/strategy" },
    contact: { path: "/contact" },
  },
} as const;

const getRoutePath = (route: RouteId): string =>
  LOCAL_SITE_CONFIG.routes[route]?.path || "/";

// *** CENTRAL, ORDERED NAV ITEMS ***
// Shorts is in the middle and will always render.
const NAV_ITEMS: NavItem[] = [
  { route: "booksIndex", label: "Books", description: "Curated volumes" },
  { route: "canonIndex", label: "Canon", description: "The 10-volume system" },
  { route: "blogIndex", label: "Insights", description: "Strategic wisdom" },
  { route: "shorts", label: "Shorts", description: "Sharp. Brief. Undeniable." },
  { route: "ventures", label: "Ventures", description: "Business pursuits" },
  { route: "about", label: "About", description: "My journey" },
  { route: "contact", label: "Contact", description: "Get in touch" },
];

const SCROLL_THRESHOLD = 5;

// Optimized header heights for all devices
const HEADER_HEIGHTS = {
  mobile: { normal: "4rem", scrolled: "3.5rem" },
  tablet: { normal: "4.5rem", scrolled: "4rem" },
  desktop: { normal: "5rem", scrolled: "4.5rem" },
} as const;

// Enhanced color system with better contrast for accessibility
const COLOR_SYSTEM = {
  light: {
    shell: {
      normal:
        "bg-white/98 border-b border-gray-100 shadow-sm backdrop-blur-md",
      transparent: "bg-transparent border-transparent",
    },
    text: {
      primary: "text-gray-900 font-semibold",
      secondary: "text-gray-600",
      accent: "text-amber-700 font-bold",
    },
    interactive: {
      base: "hover:text-amber-700 active:text-amber-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50",
      active: "text-amber-700 scale-105",
    },
  },
  dark: {
    shell: {
      normal:
        "bg-gray-900/98 border-b border-gray-800 shadow-sm backdrop-blur-md",
      transparent: "bg-transparent border-transparent",
    },
    text: {
      primary: "text-white font-semibold",
      secondary: "text-gray-300",
      accent: "text-amber-400 font-bold",
    },
    interactive: {
      base: "hover:text-amber-400 active:text-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50",
      active: "text-amber-400 scale-105",
    },
  },
} as const;

// --- Hooks ---------------------------------------------------------
const useScrollDetection = (threshold: number = SCROLL_THRESHOLD) => {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > threshold);

    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", throttledScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", throttledScroll);
  }, [threshold]);

  return scrolled;
};

const useSafeArea = () => {
  const [safeArea, setSafeArea] = React.useState({ top: 0, bottom: 0 });

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const updateSafeArea = () => {
      const top = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue("--sat") ||
          "0",
      );
      const bottom = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue("--sab") ||
          "0",
      );
      setSafeArea({ top, bottom });
    };

    updateSafeArea();
    window.addEventListener("resize", updateSafeArea);
    return () => window.removeEventListener("resize", updateSafeArea);
  }, []);

  return safeArea;
};

const useBodyScrollLock = (isLocked: boolean) => {
  React.useEffect(() => {
    if (typeof document === "undefined") return;

    const body = document.body;
    if (isLocked) {
      const scrollY = window.scrollY;
      body.style.position = "fixed";
      body.style.top = `-${scrollY}px`;
      body.style.width = "100%";
      body.style.overflowY = "hidden";
      return () => {
        body.style.position = "";
        body.style.top = "";
        body.style.width = "";
        body.style.overflowY = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [isLocked]);
};

// --- Nav & Buttons ---------------------------------------------------
interface NavLinkProps {
  item: NavItem;
  isActive: boolean;
  isHighlight?: boolean;
  theme: "light" | "dark";
  onClick?: () => void;
  variant?: "desktop" | "mobile";
}

const NavLink: React.FC<NavLinkProps> = ({
  item,
  isActive,
  isHighlight = false,
  theme,
  onClick,
  variant = "desktop",
}) => {
  const colors = COLOR_SYSTEM[theme];
  const isMobile = variant === "mobile";

  const highlightClasses =
    !isMobile && isHighlight
      ? "rounded-full px-3 py-1 border border-amber-500/40 bg-amber-500/10 text-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.35)]"
      : "";

  const baseClasses = `
    transition-all duration-200 ease-out
    ${isMobile ? "text-lg py-3 px-4 rounded-xl active:scale-95" : "text-sm lg:text-base py-1"}
    ${colors.text.primary}
    ${isActive ? colors.interactive.active : colors.interactive.base}
    focus:outline-none focus-visible:ring-2 focus-visible:ring-current/50
    ${isMobile ? "touch-manipulation" : ""}
    ${highlightClasses}
  `;

  const activeBg =
    isMobile && isActive
      ? theme === "dark"
        ? "bg-white/10"
        : "bg-gray-100"
      : "";

  return (
    <li className={isMobile ? "w-full" : ""}>
      <Link
        href={getRoutePath(item.route)}
        onClick={onClick}
        className={`${baseClasses} ${isMobile ? activeBg : ""} block`}
        aria-current={isActive ? "page" : undefined}
        prefetch={true}
      >
        <div className={`flex ${isMobile ? "flex-col" : "items-center gap-1"}`}>
          <span className={isMobile ? "font-semibold" : ""}>{item.label}</span>
          {isMobile && item.description && (
            <span className={`mt-0.5 text-sm ${colors.text.secondary}`}>
              {item.description}
            </span>
          )}
        </div>
      </Link>
      {!isMobile && !isHighlight && (
        <motion.div
          className={`h-0.5 ${isActive ? "bg-amber-500" : "bg-transparent"}`}
          initial={{ width: 0 }}
          animate={{ width: isActive ? "100%" : 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </li>
  );
};

interface ContactButtonProps {
  type: "email" | "phone";
  value: string;
  theme: "light" | "dark";
  onClick?: () => void;
  variant?: "desktop" | "mobile";
}

const ContactButton: React.FC<ContactButtonProps> = ({
  type,
  value,
  theme,
  onClick,
  variant = "desktop",
}) => {
  const colors = COLOR_SYSTEM[theme];
  const isMobile = variant === "mobile";

  const href =
    type === "email" ? `mailto:${value}` : `tel:${value.replace(/\s+/g, "")}`;
  const label = type === "email" ? "Email" : "Call";
  const Icon = type === "email" ? Mail : Phone;

  return (
    <a
      href={href}
      onClick={onClick}
      className={`
        flex items-center gap-2 transition-all duration-200
        ${isMobile ? "text-base py-2 px-3" : "text-sm"}
        ${colors.text.secondary}
        ${colors.interactive.base}
        focus:outline-none focus-visible:ring-2 focus-visible:ring-current/50
        rounded-lg touch-manipulation
      `}
      aria-label={`${label} Abraham`}
    >
      <Icon
        className={`${isMobile ? "h-4 w-4" : "h-3.5 w-3.5"} flex-shrink-0`}
      />
      <span className="font-medium">{label}</span>
    </a>
  );
};

// --- Main Header Component ---------------------------------------------------
export default function Header({
  initialTheme = "light",
  transparent = false,
}: HeaderProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const scrolled = useScrollDetection(SCROLL_THRESHOLD);
  const currentPath = usePathname();
  const deviceType = useDeviceType();
  const safeArea = useSafeArea();

  // Theme detection
  const [theme, setTheme] = React.useState<"light" | "dark">(initialTheme);

  React.useEffect(() => {
    if (typeof document !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    }
  }, []);

  useBodyScrollLock(isOpen);

  // FIX: Properly type and handle null values for usePathname
  const isActive = React.useCallback(
    (route: RouteId): boolean => {
      // If path is missing, it cannot match
      if (!currentPath) return false;

      const href = getRoutePath(route);
      if (href === "/") return currentPath === "/";
      
      // Strict boolean return
      return currentPath === href || currentPath.startsWith(`${href}/`);
    },
    [currentPath],
  );

  const colors = COLOR_SYSTEM[theme];

  const headerHeight = scrolled
    ? HEADER_HEIGHTS[deviceType].scrolled
    : HEADER_HEIGHTS[deviceType].normal;

  const shellStyle =
    scrolled || !transparent ? colors.shell.normal : colors.shell.transparent;

  const brandSize = {
    mobile: scrolled ? "text-xl" : "text-2xl",
    tablet: scrolled ? "text-2xl" : "text-3xl",
    desktop: scrolled ? "text-2xl lg:text-3xl" : "text-3xl lg:text-4xl",
  }[deviceType];

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${shellStyle}`}
        style={{
          height: headerHeight,
          paddingTop: safeArea.top > 0 ? `${safeArea.top}px` : undefined,
        }}
        role="banner"
        aria-label="Primary navigation"
      >
        <div className="mx-auto h-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex h-full items-center justify-between">
            {/* Brand Logo */}
            <Link
              href={getRoutePath("home")}
              className={`
                font-serif font-bold tracking-tight
                ${brandSize}
                ${colors.text.accent}
                transition-all duration-300
                focus:outline-none focus-visible:ring-2 focus-visible:ring-current/50
                rounded-lg touch-manipulation
              `}
              aria-label="Abraham of London - Home"
              prefetch={true}
            >
              Abraham of London
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden items-center gap-6 lg:flex lg:gap-8">
              <ul className="flex items-center gap-6 lg:gap-8">
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.route}
                    item={item}
                    isActive={isActive(item.route)}
                    isHighlight={item.route === "shorts"}
                    theme={theme}
                    variant="desktop"
                  />
                ))}
              </ul>

              {/* Desktop Actions */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-4 border-r border-current/20 pr-4">
                  <ContactButton
                    type="email"
                    value={LOCAL_SITE_CONFIG.email}
                    theme={theme}
                    variant="desktop"
                  />
                  <ContactButton
                    type="phone"
                    value={LOCAL_SITE_CONFIG.phone}
                    theme={theme}
                    variant="desktop"
                  />
                </div>

                <Link
                  href="/books/the-architecture-of-human-purpose-landing"
                  className={`
                    hidden rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wider
                    transition-all duration-200 hover:scale-105 active:scale-95
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-current/50
                    xl:inline-block touch-manipulation
                    ${
                      theme === "dark"
                        ? "border-amber-400/50 text-amber-400 hover:bg-amber-400/10"
                        : "border-amber-600/50 text-amber-600 hover:bg-amber-600/10"
                    }
                  `}
                  aria-label="The Canon Prelude - Architecture of Human Purpose"
                  prefetch={true}
                >
                  Canon Prelude
                </Link>

                <Link
                  href={getRoutePath("contact")}
                  className={`
                    rounded-full px-5 py-2.5 text-sm font-semibold
                    transition-all duration-200 hover:scale-105 active:scale-95
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-current/50
                    touch-manipulation
                    ${
                      theme === "dark"
                        ? "bg-amber-400 text-gray-900 hover:bg-amber-300"
                        : "bg-amber-600 text-white hover:bg-amber-700"
                    }
                  `}
                  aria-label="Go to contact form"
                  prefetch={true}
                >
                  Enquire
                </Link>

                <ThemeToggle />
              </div>
            </div>

            {/* Mobile Controls */}
            <div className="flex items-center gap-2 lg:hidden">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                  inline-flex h-10 w-10 items-center justify-center rounded-lg p-2
                  transition-all duration-200 active:scale-95
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-current/50
                  touch-manipulation
                  ${
                    theme === "dark"
                      ? "bg-white/10 hover:bg-white/20"
                      : "bg-black/5 hover:bg-black/10"
                  }
                `}
                aria-expanded={isOpen}
                aria-controls="mobile-nav"
                aria-label={isOpen ? "Close menu" : "Open menu"}
              >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-nav"
            className="fixed inset-0 top-0 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
          >
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              className={`absolute right-0 top-0 h-full w-[85vw] max-w-sm overflow-y-auto overscroll-contain ${
                theme === "dark" ? "bg-gray-900" : "bg-white"
              }`}
              style={{
                paddingTop: `calc(${headerHeight} + ${safeArea.top}px)`,
                paddingBottom: `${safeArea.bottom}px`,
              }}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <nav className="h-full px-5 py-6">
                <ul className="space-y-1">
                  {NAV_ITEMS.map((item) => (
                    <NavLink
                      key={item.route}
                      item={item}
                      isActive={isActive(item.route)}
                      isHighlight={item.route === "shorts"}
                      theme={theme}
                      onClick={() => setIsOpen(false)}
                      variant="mobile"
                    />
                  ))}
                </ul>

                <div className="mt-8 space-y-6">
                  <div className="space-y-4">
                    <h3
                      className={`text-sm font-semibold uppercase tracking-wider ${colors.text.secondary}`}
                    >
                      Get in Touch
                    </h3>
                    <div className="flex gap-4">
                      <ContactButton
                        type="email"
                        value={LOCAL_SITE_CONFIG.email}
                        theme={theme}
                        onClick={() => setIsOpen(false)}
                        variant="mobile"
                      />
                      <ContactButton
                        type="phone"
                        value={LOCAL_SITE_CONFIG.phone}
                        theme={theme}
                        onClick={() => setIsOpen(false)}
                        variant="mobile"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Link
                      href="/books/the-architecture-of-human-purpose-landing"
                      onClick={() => setIsOpen(false)}
                      className={`
                        block rounded-xl border px-5 py-3 text-center text-sm font-semibold
                        transition-all duration-200 active:scale-95
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-current/50
                        touch-manipulation
                        ${
                          theme === "dark"
                            ? "border-amber-400/50 text-amber-400 active:bg-amber-400/10"
                            : "border-amber-600/50 text-amber-600 active:bg-amber-600/10"
                        }
                      `}
                      prefetch={true}
                    >
                      Canon Prelude
                    </Link>

                    <Link
                      href={getRoutePath("contact")}
                      onClick={() => setIsOpen(false)}
                      className={`
                        block rounded-xl px-5 py-3 text-center text-sm font-semibold
                        transition-all duration-200 active:scale-95
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-current/50
                        touch-manipulation
                        ${
                          theme === "dark"
                            ? "bg-amber-400 text-gray-900 active:bg-amber-300"
                            : "bg-amber-600 text-white active:bg-amber-700"
                        }
                      `}
                      prefetch={true}
                    >
                      Enquire Now
                    </Link>
                  </div>
                </div>
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global spacing for header */}
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
      `}</style>
    </>
  );
}