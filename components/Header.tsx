"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone, Mail } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { siteConfig, getRoutePath, type RouteId } from "@/lib/siteConfig";

// --- Enhanced Types & Constants ------------------------------------------------

type HeaderProps = {
  initialTheme?: "light" | "dark";
  transparent?: boolean;
};

type NavItem = {
  route: RouteId;
  label: string;
  description?: string;
};

interface OriginalStyle {
  position: string;
  top: string;
  left: string;
  right: string;
  overflow: string;
}

const NAV_ITEMS: NavItem[] = [
  { route: "booksIndex", label: "Books", description: "Curated volumes" },
  { route: "contentIndex", label: "Insights", description: "Strategic wisdom" },
  { route: "ventures", label: "Ventures", description: "Business pursuits" },
  { route: "about", label: "About", description: "My journey" },
  { route: "contact", label: "Contact", description: "Get in touch" },
];

const SCROLL_THRESHOLD = 8;

// slightly tighter heights on mobile so the hero isn't crushed
const HEADER_HEIGHTS = {
  desktop: { normal: "5rem", scrolled: "4rem" },
  mobile: { normal: "4.25rem", scrolled: "3.5rem" },
} as const;

// --- Color System with subtle glow in dark mode --------------------------------

const COLOR_SYSTEM = {
  light: {
    shell: {
      normal: "bg-white/95 border-black/10 shadow-lg backdrop-blur-xl",
      transparent: "bg-transparent border-transparent",
    },
    text: {
      primary: "text-deepCharcoal font-semibold",
      secondary: "text-deepCharcoal/80 font-medium",
      accent: "text-softGold font-bold",
    },
    interactive: {
      hover: "hover:text-softGold hover:scale-105 hover:font-semibold",
      active: "text-softGold scale-105 font-bold",
    },
    glow: {
      normal: "",
      active: "drop-shadow-[0_0_4px_rgba(0,0,0,0.1)]",
    },
  },
  dark: {
    shell: {
      normal: "bg-charcoal/98 border-white/15 shadow-2xl backdrop-blur-xl",
      transparent: "bg-transparent border-transparent",
    },
    text: {
      primary: "text-white font-bold glow-text",
      secondary: "text-white/90 font-semibold glow-text",
      accent: "text-softGold font-extrabold glow-text",
    },
    interactive: {
      hover: "hover:text-softGold hover:scale-105 hover:font-extrabold glow-active",
      active: "text-softGold scale-105 font-extrabold glow-active",
    },
    glow: {
      normal: "glow-text",
      active: "glow-active",
    },
  },
} as const;

// --- Hooks ---------------------------------------------------------------------

const useScrollDetection = (threshold: number = SCROLL_THRESHOLD): boolean => {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = (): void => {
      const isScrolled = window.scrollY > threshold;
      setScrolled(isScrolled);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return scrolled;
};

const useCurrentPath = (): string => {
  const [currentPath, setCurrentPath] = React.useState("/");

  React.useEffect(() => {
    const updatePath = (): void => {
      setCurrentPath(window.location.pathname || "/");
    };

    updatePath();

    const handleNavigation = (): void => {
      setTimeout(updatePath, 10);
    };

    const handleClick = (e: MouseEvent): void => {
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

const useBodyScrollLock = (isLocked: boolean): void => {
  React.useEffect(() => {
    if (!isLocked) return;

    const computed = window.getComputedStyle(document.body);
    const originalStyle: OriginalStyle = {
      position: computed.position,
      top: computed.top,
      left: computed.left,
      right: computed.right,
      overflow: computed.overflow,
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

const useResolvedTheme = (initialTheme: "light" | "dark"): "light" | "dark" => {
  const [theme, setTheme] = React.useState<"light" | "dark">(initialTheme);

  React.useEffect(() => {
    const getTheme = (): "light" | "dark" =>
      document.documentElement.classList.contains("dark") ? "dark" : "light";

    setTheme(getTheme());

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

// detect user movement to "wake up" glow for a short period
const useMovementDetection = (enabled: boolean = true): boolean => {
  const [isMoving, setIsMoving] = React.useState(false);

  React.useEffect(() => {
    if (!enabled) return;

    let movementTimer: ReturnType<typeof setTimeout>;

    const handleMovement = (): void => {
      setIsMoving(true);
      clearTimeout(movementTimer);
      movementTimer = setTimeout(() => setIsMoving(false), 2000);
    };

    const events: (keyof WindowEventMap)[] = ["mousemove", "scroll", "touchstart", "keydown"];

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

// --- Components ----------------------------------------------------------------

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
            <span className={`mt-1 text-sm ${colors.text.secondary}`}>{item.description}</span>
          )}
        </div>
      </Link>
      {!isMobile && (
        <motion.span
          aria-hidden="true"
          className={`pointer-events-none absolute -bottom-1 left-0 h-0.5 ${
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

  const href = type === "email" ? `mailto:${value}` : `tel:${value.replace(/\s+/g, "")}`;
  const label = type === "email" ? "Email" : "Call";
  const Icon = type === "email" ? Mail : Phone;

  const baseStyles = `
    flex items-center gap-2 transition-all duration-300
    ${colors.text.secondary}
    ${colors.interactive.hover}
    ${isMobile ? "text-base py-2 px-3 font-semibold" : "text-sm lg:text-base font-medium"}
    ${theme === "dark" && isMovementDetected ? colors.glow.active : colors.glow.normal}
  `;

  return (
    <a href={href} onClick={onClick} className={baseStyles} aria-label={`${label} Abraham`}>
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </a>
  );
};

// --- Main Header --------------------------------------------------------------

export default function Header({
  initialTheme = "light",
  transparent = false,
}: HeaderProps): JSX.Element {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);

  const scrolled = useScrollDetection(SCROLL_THRESHOLD);
  const currentPath = useCurrentPath();
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
    [currentPath, isMounted],
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
    tracking-tight leading-tight
  `;

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

            <Link
              href={getRoutePath("contact")}
              className={`hidden rounded-full bg-softGold px-5 py-2.5 text-sm font-bold text-deepCharcoal transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-softGold/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-softGold/50 md:inline-block lg:px-6 ${
                theme === "dark" && isMovementDetected ? "shadow-lg shadow-softGold/30" : ""
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
                : "bg-black/10 text-deepCharcoal hover:bg-black/20"
            } ${theme === "dark" && isMovementDetected ? "glow-active" : ""}`}
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
                ? "bg-charcoal/98 text-white backdrop-blur-2xl"
                : "bg-white/98 text-deepCharcoal backdrop-blur-2xl"
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
                    isMovementDetected={isMovementDetected}
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
                  className={`block w-full rounded-xl px-6 py-4 text-center text-sm font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-softGold/25 ${
                    theme === "dark"
                      ? "bg-softGold text-deepCharcoal"
                      : "bg-softGold text-deepCharcoal"
                  } ${theme === "dark" && isMovementDetected ? "shadow-lg shadow-softGold/30" : ""}`}
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

        /* Glow effects for dark mode readability */
        .glow-text {
          transition: text-shadow 0.3s ease, filter 0.3s ease;
        }

        .glow-active {
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.3),
            0 0 20px rgba(255, 255, 255, 0.2),
            0 0 30px rgba(255, 255, 255, 0.1);
          filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.4));
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