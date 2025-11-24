"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone, Mail } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { siteConfig, getRoutePath, type RouteId } from "@/lib/siteConfig";

// --- Enhanced Types & Constants ---

type HeaderProps = {
  initialTheme?: "light" | "dark";
  transparent?: boolean;
};

type NavItem = {
  route: RouteId;
  label: string;
  description?: string;
};

const NAV_ITEMS: NavItem[] = [
  { route: "booksIndex", label: "Books", description: "Curated volumes" },
  { route: "contentIndex", label: "Insights", description: "Strategic wisdom" },
  { route: "ventures", label: "Ventures", description: "Business pursuits" },
  { route: "about", label: "About", description: "My journey" },
  { route: "contact", label: "Contact", description: "Get in touch" },
];

const SCROLL_THRESHOLD = 8;
const HEADER_HEIGHTS = {
  desktop: { normal: "5rem", scrolled: "4rem" },
  mobile: { normal: "5rem", scrolled: "3.75rem" },
} as const;

// --- Enhanced Color System ---

const COLOR_SYSTEM = {
  light: {
    shell: {
      normal: "bg-white/95 border-black/10 shadow-lg backdrop-blur-xl",
      transparent: "bg-transparent border-transparent",
    },
    text: {
      primary: "text-deepCharcoal",
      secondary: "text-deepCharcoal/70",
      accent: "text-softGold",
    },
    interactive: {
      hover: "hover:text-softGold hover:scale-105",
      active: "text-softGold scale-105",
    },
  },
  dark: {
    shell: {
      normal: "bg-charcoal/95 border-white/10 shadow-lg backdrop-blur-xl",
      transparent: "bg-transparent border-transparent",
    },
    text: {
      primary: "text-white",
      secondary: "text-white/80", // slightly brighter for clarity
      accent: "text-softGold",
    },
    interactive: {
      hover: "hover:text-softGold hover:scale-105",
      active: "text-softGold scale-105",
    },
  },
} as const;

// --- Custom Hooks ---

const useScrollDetection = (threshold: number = SCROLL_THRESHOLD) => {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > threshold;
      setScrolled(isScrolled);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return scrolled;
};

const useCurrentPath = () => {
  const [currentPath, setCurrentPath] = React.useState("/");

  React.useEffect(() => {
    const updatePath = () => {
      setCurrentPath(window.location.pathname || "/");
    };

    updatePath();

    const handleNavigation = () => setTimeout(updatePath, 10);
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a[href]");
      if (link?.getAttribute("href")?.startsWith("/")) {
        setTimeout(updatePath, 50);
      }
    };

    window.addEventListener("popstate", handleNavigation);
    document.addEventListener("click", handleClick, true);

    return () => {
      window.removeEventListener("popstate", handleNavigation);
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  return currentPath;
};

const useBodyScrollLock = (isLocked: boolean) => {
  React.useEffect(() => {
    if (!isLocked) return;

    const originalStyle = {
      position: window.getComputedStyle(document.body).position,
      top: window.getComputedStyle(document.body).top,
      left: window.getComputedStyle(document.body).left,
      right: window.getComputedStyle(document.body).right,
      overflow: window.getComputedStyle(document.body).overflow,
    };
    const scrollY = window.scrollY;

    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.position = originalStyle.position;
      document.body.style.top = originalStyle.top;
      document.body.style.left = originalStyle.left;
      document.body.style.right = originalStyle.right;
      document.body.style.overflow = originalStyle.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [isLocked]);
};

/**
 * NEW: Resolve the actual theme from the <html> class ("dark" / not),
 * so the header text / shell always match the real mode.
 */
const useResolvedTheme = (initialTheme: "light" | "dark") => {
  const [theme, setTheme] = React.useState<"light" | "dark">(initialTheme);

  React.useEffect(() => {
    const getTheme = (): "light" | "dark" =>
      document.documentElement.classList.contains("dark") ? "dark" : "light";

    // Initial resolve on mount
    setTheme(getTheme());

    // Observe class changes on <html> so we react when ThemeToggle flips
    const observer = new MutationObserver(() => {
      setTheme(getTheme());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [initialTheme]);

  return theme;
};

// --- Enhanced Components ---

interface NavLinkProps {
  item: NavItem;
  isActive: boolean;
  theme: "light" | "dark";
  onClick?: () => void;
  variant?: "desktop" | "mobile";
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

  const baseStyles = `
    transition-all duration-300 ease-out
    ${colors.text.primary}
    ${isActive ? colors.interactive.active : colors.interactive.hover}
    ${isMobile ? "text-lg py-3 px-4 rounded-xl" : "text-base font-medium"}
  `;

  const activeStyles = isActive
    ? isMobile
      ? "bg-white/10 dark:bg-black/20"
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
          <span className="font-semibold">{item.label}</span>
          {isMobile && item.description && (
            <span className="mt-1 text-sm opacity-75">{item.description}</span>
          )}
        </div>
      </Link>
      {!isMobile && (
        <motion.span
          aria-hidden="true"
          className={`absolute -bottom-1 left-0 h-0.5 ${
            isActive ? "bg-softGold" : "bg-transparent"
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

  const baseStyles = `
    flex items-center gap-2 transition-all duration-300
    ${colors.text.secondary}
    ${colors.interactive.hover}
    ${isMobile ? "text-base py-2 px-3" : "text-base"}
  `;

  return (
    <a
      href={href}
      onClick={onClick}
      className={baseStyles}
      aria-label={`${label} Abraham`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </a>
  );
};

// --- Main Header Component ---

export default function Header({
  initialTheme = "light",
  transparent = false,
}: HeaderProps): JSX.Element {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const scrolled = useScrollDetection(SCROLL_THRESHOLD);
  const currentPath = useCurrentPath();

  useBodyScrollLock(isOpen);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // NEW: resolve real theme instead of trusting initialTheme blindly
  const theme = useResolvedTheme(initialTheme);
  const colors = COLOR_SYSTEM[theme];

  // Enhanced active route detection
  const isActive = React.useCallback(
    (route: RouteId): boolean => {
      if (!isMounted) return false;
      const href = getRoutePath(route);
      const path = currentPath || "";
      if (href === "/") return path === "/";
      return path === href || path.startsWith(`${href}/`);
    },
    [currentPath, isMounted],
  );

  // Dynamic styling
  const shellStyle =
    scrolled || !transparent ? colors.shell.normal : colors.shell.transparent;

  const headerHeight = scrolled
    ? HEADER_HEIGHTS.desktop.scrolled
    : HEADER_HEIGHTS.desktop.normal;

  const brandClass = `
    font-serif font-bold transition-all duration-300
    ${scrolled ? "text-[1.35rem] md:text-[1.75rem]" : "text-2xl md:text-3xl"}
    ${colors.text.accent}
  `;

  // Contact info
  const email = siteConfig.email || "info@abrahamoflondon.org";
  const phone = siteConfig.phone?.toString().trim() || "+442086225909";

  const MotionHeader = isMounted ? motion.header : "header";

  return (
    <MotionHeader
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${shellStyle}`}
      {...(isMounted && {
        initial: { y: -20, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: { duration: 0.4, ease: "easeOut" },
      })}
      role="navigation"
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
          Abraham of London
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          <ul className="flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.route}
                item={item}
                isActive={isActive(item.route)}
                theme={theme}
                variant="desktop"
              />
            ))}
          </ul>

          {/* Desktop Actions */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 border-r border-current/20 pr-6">
              <ContactButton type="email" value={email} theme={theme} />
              <ContactButton type="phone" value={phone} theme={theme} />
            </div>

            <Link
              href={getRoutePath("contact")}
              className="rounded-full bg-softGold px-6 py-2.5 text-base font-semibold text-deepCharcoal transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-softGold/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-softGold/50"
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
            className={`inline-flex items-center justify-center rounded-xl p-2.5 transition-all duration-300 ${
              theme === "dark"
                ? "bg-white/10 text-white hover:bg-white/20"
                : "bg-black/5 text-deepCharcoal hover:bg-black/10"
            }`}
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
                  <X className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="h-5 w-5" />
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
                ? "bg-charcoal/95 text-white backdrop-blur-2xl"
                : "bg-white/95 text-deepCharcoal backdrop-blur-2xl"
            }`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <nav className="flex h-full flex-col px-6 py-8" aria-label="Mobile navigation">
              <ul className="space-y-2">
                {NAV_ITEMS.map((item) => (
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

              {/* Mobile Contact Actions */}
              <div className="mt-auto space-y-4 pt-8">
                <div className="flex gap-6">
                  <ContactButton
                    type="email"
                    value={email}
                    theme={theme}
                    onClick={() => setIsOpen(false)}
                    variant="mobile"
                  />
                  <ContactButton
                    type="phone"
                    value={phone}
                    theme={theme}
                    onClick={() => setIsOpen(false)}
                    variant="mobile"
                  />
                </div>

                <Link
                  href={getRoutePath("contact")}
                  onClick={() => setIsOpen(false)}
                  className={`block w-full rounded-xl px-6 py-4 text-center text-base font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-softGold/25 ${
                    theme === "dark"
                      ? "bg-softGold text-deepCharcoal"
                      : "bg-softGold text-deepCharcoal"
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

      {/* Global Styles */}
      <style jsx global>{`
        :root {
          --header-height: ${headerHeight};
        }

        main {
          padding-top: var(--header-height);
        }

        @media (max-width: 767px) {
          :root {
            --header-height: ${
              scrolled ? HEADER_HEIGHTS.mobile.scrolled : HEADER_HEIGHTS.mobile.normal
            };
          }
        }
      `}</style>
    </MotionHeader>
  );
}