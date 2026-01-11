"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone, Mail, ChevronRight } from "lucide-react";
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
  highlight?: boolean;
};

// Device detection for optimal styling
const useDeviceType = () => {
  const [deviceType, setDeviceType] = React.useState<"mobile" | "tablet" | "desktop">("desktop");

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
// Optimized for desktop and mobile viewing
const NAV_ITEMS: NavItem[] = [
  { route: "canonIndex", label: "Canon", description: "The 10-volume system" },
  { route: "booksIndex", label: "Books", description: "Curated volumes" },
  { route: "blogIndex", label: "Insights", description: "Strategic wisdom" },
  { route: "shorts", label: "Shorts", description: "Sharp. Brief. Undeniable.", highlight: true },
  { route: "ventures", label: "Ventures", description: "Business pursuits" },
  { route: "strategyLanding", label: "Strategy", description: "Frameworks" },
  { route: "about", label: "About", description: "My journey" },
  { route: "contact", label: "Contact", description: "Get in touch" },
];

// Optional: Additional items that can be toggled based on screen size
const OPTIONAL_ITEMS: NavItem[] = [
  { route: "contentIndex", label: "Content", description: "All writings" },
  { route: "downloadsIndex", label: "Downloads", description: "Resources" },
];

const SCROLL_THRESHOLD = 10;

// Responsive header heights
const HEADER_HEIGHTS = {
  mobile: { normal: "4.5rem", scrolled: "4rem" },
  tablet: { normal: "5rem", scrolled: "4.5rem" },
  desktop: { normal: "5.5rem", scrolled: "5rem" },
} as const;

// Professional color system with proper contrast
const COLOR_SYSTEM = {
  light: {
    shell: {
      normal: "bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm",
      transparent: "bg-transparent backdrop-blur-none border-transparent shadow-none",
    },
    text: {
      primary: "text-gray-900 font-medium",
      secondary: "text-gray-600",
      accent: "text-amber-700 font-bold",
      inverse: "text-white",
    },
    interactive: {
      base: "hover:text-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 transition-colors duration-200",
      active: "text-amber-700 font-semibold",
    },
    background: {
      nav: "bg-white",
      overlay: "bg-white/95",
    },
  },
  dark: {
    shell: {
      normal: "bg-gray-900/95 backdrop-blur-md border-b border-gray-800 shadow-lg",
      transparent: "bg-transparent backdrop-blur-none border-transparent shadow-none",
    },
    text: {
      primary: "text-gray-100 font-medium",
      secondary: "text-gray-400",
      accent: "text-amber-400 font-bold",
      inverse: "text-gray-900",
    },
    interactive: {
      base: "hover:text-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 transition-colors duration-200",
      active: "text-amber-400 font-semibold",
    },
    background: {
      nav: "bg-gray-900",
      overlay: "bg-gray-900/95",
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
        getComputedStyle(document.documentElement).getPropertyValue("--sat") || "0",
      );
      const bottom = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue("--sab") || "0",
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
    if (typeof document === "undefined") return undefined;

    const body = document.body;
    if (isLocked) {
      const scrollY = window.scrollY;
      body.style.position = "fixed";
      body.style.top = `-${scrollY}px`;
      body.style.width = "100%";
      body.style.overflowY = "hidden";
      body.style.paddingRight = "15px"; // Prevent layout shift
      
      return () => {
        body.style.position = "";
        body.style.top = "";
        body.style.width = "";
        body.style.overflowY = "";
        body.style.paddingRight = "";
        window.scrollTo(0, scrollY);
      };
    }
    
    return undefined;
  }, [isLocked]);
};

// --- Nav & Buttons ---------------------------------------------------
interface NavLinkProps {
  item: NavItem;
  isActive: boolean;
  theme: "light" | "dark";
  onClick?: () => void;
  variant?: "desktop" | "mobile" | "compact";
}

const NavLink: React.FC<NavLinkProps> = ({
  item,
  isActive,
  theme,
  onClick,
  variant = "desktop",
}) => {
  const colors = COLOR_SYSTEM[theme];
  const isMobile = variant === "mobile";
  const isCompact = variant === "compact";

  const baseClasses = `
    relative transition-all duration-200 ease-out
    ${isMobile ? "text-base py-3 px-4 rounded-lg" : "text-sm lg:text-base"}
    ${isCompact ? "text-xs px-2 py-1" : ""}
    ${colors.text.primary}
    ${isActive ? colors.interactive.active : colors.interactive.base}
    ${!isMobile && !isCompact ? "hover:scale-105 active:scale-95" : ""}
    focus:outline-none focus-visible:ring-2 focus-visible:ring-current/50
    touch-manipulation select-none
  `;

  const highlightClasses = item.highlight ? `
    ${theme === "dark" 
      ? "bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-2 border-amber-400/50" 
      : "bg-gradient-to-r from-amber-100/50 via-amber-50/30 to-transparent border-l-2 border-amber-500/50"}
    rounded-r-md pl-3
  ` : "";

  return (
    <li className={isMobile ? "w-full" : ""}>
      <Link
        href={getRoutePath(item.route)}
        onClick={onClick}
        className={`${baseClasses} ${highlightClasses} ${isMobile ? "block" : ""}`}
        aria-current={isActive ? "page" : undefined}
        prefetch={true}
      >
        <div className={`flex ${isMobile ? "flex-col" : "items-center gap-2"}`}>
          <span className={`${isMobile ? "font-medium" : ""} ${isCompact ? "truncate max-w-[80px]" : ""}`}>
            {item.label}
          </span>
          {isMobile && item.description && (
            <span className={`mt-1 text-sm ${colors.text.secondary}`}>
              {item.description}
            </span>
          )}
          {isMobile && (
            <ChevronRight className={`absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 ${colors.text.secondary}`} />
          )}
        </div>
        {(!isMobile && !isCompact && !item.highlight) && (
          <motion.div
            className={`absolute bottom-0 left-0 h-0.5 ${isActive ? "bg-amber-500" : "bg-transparent"}`}
            initial={{ width: 0 }}
            animate={{ width: isActive ? "100%" : 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </Link>
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

  const href = type === "email" ? `mailto:${value}` : `tel:${value.replace(/\s+/g, "")}`;
  const label = type === "email" ? "Email" : "Call";
  const Icon = type === "email" ? Mail : Phone;

  return (
    <a
      href={href}
      onClick={onClick}
      className={`
        flex items-center gap-2 transition-all duration-200
        ${isMobile ? "text-base py-2 px-3 rounded-lg" : "text-sm px-3 py-1.5 rounded-md"}
        ${colors.text.secondary}
        ${colors.interactive.base}
        hover:bg-white/5 active:scale-95
        focus:outline-none focus-visible:ring-2 focus-visible:ring-current/50
        touch-manipulation
      `}
      aria-label={`${label} Abraham`}
    >
      <Icon className={`${isMobile ? "h-4 w-4" : "h-3.5 w-3.5"} flex-shrink-0`} />
      <span className="font-medium whitespace-nowrap">{label}</span>
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

  // Active route detection
  const isActive = React.useCallback(
    (route: RouteId): boolean => {
      if (!currentPath) return false;

      const href = getRoutePath(route);
      if (href === "/") return currentPath === "/";
      
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

  // Determine visible items based on screen width
  const [visibleItems, setVisibleItems] = React.useState(NAV_ITEMS);
  const [showMoreMenu, setShowMoreMenu] = React.useState(false);

  React.useEffect(() => {
    const updateVisibleItems = () => {
      const width = window.innerWidth;
      if (width >= 1280) {
        // XL screens: Show all items
        setVisibleItems([...NAV_ITEMS, ...OPTIONAL_ITEMS]);
        setShowMoreMenu(false);
      } else if (width >= 1024) {
        // LG screens: Show main items
        setVisibleItems(NAV_ITEMS);
        setShowMoreMenu(false);
      } else if (width >= 768) {
        // MD screens: Show 6 items + "More"
        setVisibleItems(NAV_ITEMS.slice(0, 6));
        setShowMoreMenu(true);
      } else {
        setVisibleItems(NAV_ITEMS.slice(0, 6));
        setShowMoreMenu(true);
      }
    };

    updateVisibleItems();
    window.addEventListener("resize", updateVisibleItems);
    return () => window.removeEventListener("resize", updateVisibleItems);
  }, []);

  // Get items for "More" dropdown
  const moreItems = showMoreMenu 
    ? [...NAV_ITEMS.slice(6), ...OPTIONAL_ITEMS]
    : [];

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${shellStyle}`}
        style={{
          height: headerHeight,
          paddingTop: safeArea.top > 0 ? `${safeArea.top}px` : undefined,
        }}
        role="banner"
        aria-label="Primary navigation"
      >
        <div className="mx-auto h-full max-w-8xl px-4 sm:px-6 lg:px-8">
          <nav className="flex h-full items-center justify-between">
            {/* Brand Logo */}
            <Link
              href={getRoutePath("home")}
              className={`
                font-serif font-bold tracking-tight
                ${brandSize}
                ${colors.text.accent}
                transition-all duration-300 hover:opacity-80
                focus:outline-none focus-visible:ring-2 focus-visible:ring-current/50
                rounded-lg touch-manipulation shrink-0
              `}
              aria-label="Abraham of London - Home"
              prefetch={true}
            >
              Abraham of London
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-4 xl:gap-6">
              <ul className="flex items-center gap-3 xl:gap-4">
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.route}
                    item={item}
                    isActive={isActive(item.route)}
                    theme={theme}
                    variant={deviceType === "tablet" ? "compact" : "desktop"}
                  />
                ))}
                
                {/* "More" dropdown for medium screens */}
                {showMoreMenu && moreItems.length > 0 && (
                  <li className="relative group">
                    <button
                      className={`
                        text-sm lg:text-base px-3 py-1 rounded-md
                        ${colors.text.primary}
                        ${colors.interactive.base}
                        hover:bg-white/5 active:scale-95
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-current/50
                        transition-all duration-200
                      `}
                    >
                      More
                    </button>
                    <div className="absolute right-0 top-full mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <div className={`py-2 rounded-lg shadow-xl ${colors.background.overlay} backdrop-blur-md border ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
                        {moreItems.map((item) => (
                          <Link
                            key={item.route}
                            href={getRoutePath(item.route)}
                            className={`
                              block px-4 py-2 text-sm
                              ${colors.text.primary}
                              ${colors.interactive.base}
                              hover:bg-white/5
                              ${isActive(item.route) ? colors.interactive.active : ''}
                            `}
                            prefetch={true}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </li>
                )}
              </ul>

              {/* Desktop Actions */}
              <div className="flex items-center gap-3 pl-3 border-l border-current/20">
                <div className="flex items-center gap-2">
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
                  href="/canon/volume-i-foundations-of-purpose"
                  className={`
                    rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap
                    transition-all duration-200 hover:scale-105 active:scale-95
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-current/50
                    touch-manipulation
                    ${
                      theme === "dark"
                        ? "border-amber-400/40 text-amber-400 hover:bg-amber-400/10"
                        : "border-amber-600/40 text-amber-600 hover:bg-amber-600/10"
                    }
                  `}
                  aria-label="Canon Volume I - Foundations of Purpose"
                  prefetch={true}
                >
                  Canon Vol. I
                </Link>

                <Link
                  href={getRoutePath("contact")}
                  className={`
                    rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap
                    transition-all duration-200 hover:scale-105 active:scale-95
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-current/50
                    touch-manipulation shadow-sm
                    ${
                      theme === "dark"
                        ? "bg-amber-400 text-gray-900 hover:bg-amber-300 shadow-amber-400/20"
                        : "bg-amber-600 text-white hover:bg-amber-700 shadow-amber-600/20"
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
            <div className="flex items-center gap-3 lg:hidden">
              <Link
                href={getRoutePath("contact")}
                className={`
                  rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap
                  transition-all duration-200 active:scale-95
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-current/50
                  touch-manipulation
                  ${
                    theme === "dark"
                      ? "bg-amber-400 text-gray-900"
                      : "bg-amber-600 text-white"
                  }
                `}
                aria-label="Contact"
                prefetch={true}
              >
                Contact
              </Link>
              
              <ThemeToggle />
              
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                  inline-flex h-10 w-10 items-center justify-center rounded-lg
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
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            
            <motion.div
              className={`absolute right-0 top-0 h-full w-[85vw] max-w-md ${colors.background.nav} shadow-2xl`}
              style={{
                paddingTop: `calc(${headerHeight} + ${safeArea.top}px)`,
                paddingBottom: `${safeArea.bottom}px`,
              }}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <nav className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto px-4 py-6">
                  <ul className="space-y-1">
                    {[...NAV_ITEMS, ...OPTIONAL_ITEMS].map((item) => (
                      <NavLink
                        key={item.route}
                        item={item}
                        isActive={isActive(item.route)}
                        theme={theme}
                        onClick={() => setIsOpen(false)}
                        variant="mobile"
                      />
                    ))}
                  </ul>

                  <div className="mt-8 pt-6 border-t border-current/10">
                    <div className="space-y-4">
                      <h3 className={`text-sm font-semibold uppercase tracking-wider ${colors.text.secondary} px-4`}>
                        Get in Touch
                      </h3>
                      <div className="flex flex-col gap-2">
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

                    <div className="mt-6 space-y-3">
                      <Link
                        href="/canon/volume-i-foundations-of-purpose"
                        onClick={() => setIsOpen(false)}
                        className={`
                          block rounded-xl border px-4 py-3 text-center text-sm font-semibold
                          transition-all duration-200 active:scale-95
                          focus:outline-none focus-visible:ring-2 focus-visible:ring-current/50
                          touch-manipulation
                          ${
                            theme === "dark"
                              ? "border-amber-400/30 text-amber-400 active:bg-amber-400/10"
                              : "border-amber-600/30 text-amber-600 active:bg-amber-600/10"
                          }
                        `}
                        prefetch={true}
                      >
                        Canon Volume I
                      </Link>

                      <Link
                        href={getRoutePath("contact")}
                        onClick={() => setIsOpen(false)}
                        className={`
                          block rounded-xl px-4 py-3 text-center text-sm font-semibold
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
                </div>

                {/* Mobile footer in drawer */}
                <div className={`border-t border-current/10 px-4 py-4 ${colors.background.nav}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-xs ${colors.text.secondary}`}>
                        Abraham of London
                      </p>
                      <p className={`text-xs ${colors.text.secondary} mt-1`}>
                        Institutional Strategy & Governance
                      </p>
                    </div>
                    <button
                      onClick={() => setIsOpen(false)}
                      className={`
                        rounded-lg px-3 py-1.5 text-sm font-medium
                        transition-all duration-200 active:scale-95
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-current/50
                        touch-manipulation
                        ${theme === "dark" ? "bg-white/10" : "bg-black/5"}
                      `}
                    >
                      Close
                    </button>
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

        /* Smooth transitions */
        * {
          transition: background-color 0.2s ease, border-color 0.2s ease;
        }

        /* Better touch targets */
        @media (max-width: 768px) {
          button, a[role="button"] {
            min-height: 44px;
            min-width: 44px;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </>
  );
}