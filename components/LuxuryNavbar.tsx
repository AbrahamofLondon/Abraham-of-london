// components/LuxuryNavbar.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X, Moon, Sun } from "lucide-react";
import { siteConfig, getRoutePath, type RouteId } from "@/lib/siteConfig";

type LuxuryNavbarProps = {
  variant?: "light" | "dark";
  transparent?: boolean;
};

const NAV_ITEMS = [
  { route: "booksIndex" as RouteId, label: "Books" },
  { route: "contentIndex" as RouteId, label: "Insights" },
  { route: "ventures" as RouteId, label: "Ventures" },
  { route: "about" as RouteId, label: "About" },
  { route: "contact" as RouteId, label: "Contact" },
];

const ThemeToggle: React.FC = () => {
  const [mounted, setMounted] = React.useState(false);
  const [isDark, setIsDark] = React.useState(true);

  React.useEffect(() => {
    setMounted(true);
    const isDarkMode = document.documentElement.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  };

  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-md p-2 text-sm transition-colors hover:bg-black/10 dark:hover:bg-white/10"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-gold" />
      ) : (
        <Moon className="h-5 w-5 text-charcoal" />
      )}
    </button>
  );
};

export default function LuxuryNavbar({ 
  variant = "dark", 
  transparent = false 
}: LuxuryNavbarProps): JSX.Element {
  const [isOpen, setIsOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const background = scrolled || !transparent
    ? "bg-black/80 backdrop-blur-md border-b border-gold/20"
    : "bg-transparent";

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${background}`}>
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <Link
              href={getRoutePath("home")}
              className="font-serif text-2xl font-bold text-gold transition-opacity hover:opacity-80"
            >
              Abraham of London
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:items-center lg:space-x-8">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.route}
                  href={getRoutePath(item.route)}
                  className="text-sm font-medium text-cream transition-colors hover:text-gold"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex lg:items-center lg:space-x-4">
              <ThemeToggle />
              <Link
                href={getRoutePath("contact")}
                className="rounded-full bg-gold px-6 py-2 text-sm font-semibold text-charcoal transition-all hover:bg-amber-200"
              >
                Enquire
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex lg:hidden items-center space-x-2">
              <ThemeToggle />
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-cream transition-colors hover:text-gold"
                aria-label="Toggle menu"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isOpen && (
            <div className="lg:hidden border-t border-gold/20 bg-black/95 backdrop-blur-md">
              <div className="px-4 py-6 space-y-4">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.route}
                    href={getRoutePath(item.route)}
                    className="block text-base font-medium text-cream transition-colors hover:text-gold py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="pt-4">
                  <Link
                    href={getRoutePath("contact")}
                    className="inline-block rounded-full bg-gold px-6 py-3 text-sm font-semibold text-charcoal transition-all hover:bg-amber-200 w-full text-center"
                    onClick={() => setIsOpen(false)}
                  >
                    Enquire
                  </Link>
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Add padding for fixed header */}
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