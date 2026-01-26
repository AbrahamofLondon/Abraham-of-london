"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Menu, X, Phone, Mail, ChevronRight } from "lucide-react";

type Props = {
  transparent?: boolean;
};

// All your existing routes from your pages directory
const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/consulting", label: "Consulting" },
  { href: "/canon", label: "Canon" },
  { href: "/strategy", label: "Strategy" },
  { href: "/ventures", label: "Ventures" },
  { href: "/books", label: "Books" },
  { href: "/shorts", label: "Shorts" },
  { href: "/blog", label: "Insights" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/downloads", label: "Downloads" },
  { href: "/content", label: "Content" },
  { href: "/resources", label: "Resources" },
];

// Sort by priority - keep most important ones visible
const PRIORITY_ITEMS = [
  { href: "/consulting", label: "Consulting" },
  { href: "/canon", label: "Canon" },
  { href: "/strategy", label: "Strategy" },
  { href: "/ventures", label: "Ventures" },
  { href: "/books", label: "Books" },
  { href: "/shorts", label: "Shorts" },
];

// Contact info
const CONTACT_INFO = {
  email: "info@abrahamoflondon.org",
  phone: "+44 20 8622 5909",
};

export default function LuxuryNavbar({ transparent = false }: Props) {
  const router = useRouter();
  const [scrolled, setScrolled] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = React.useState(false);

  // Handle scroll effect
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [router.asPath]);

  // Lock body scroll when mobile menu is open
  React.useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isMobileMenuOpen]);

  const baseBg =
    transparent && !scrolled
      ? "bg-transparent"
      : "bg-black/95 backdrop-blur-xl";

  const isActive = (href: string) => {
    if (href === "/") return router.asPath === "/";
    return router.asPath.startsWith(href);
  };

  // Desktop navigation items
  const desktopNavItems = [
    { href: "/consulting", label: "Consulting" },
    { href: "/canon", label: "Canon" },
    { href: "/strategy", label: "Strategy" },
    { href: "/ventures", label: "Ventures" },
    { href: "/books", label: "Books" },
    { href: "/shorts", label: "Shorts" },
  ];

  // Additional items for "More" dropdown
  const moreItems = NAV_ITEMS.filter(
    item => !desktopNavItems.some(navItem => navItem.href === item.href) && item.href !== "/"
  );

  return (
    <header className="fixed left-0 right-0 top-0 z-50">
      {/* Background layer */}
      <div 
        className={`h-20 border-b border-white/10 transition-all duration-300 ${baseBg} pointer-events-none`} 
      />

      {/* Actual clickable nav */}
      <div className="absolute inset-0 pointer-events-auto">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link 
            href="/" 
            className="group font-serif text-xl sm:text-2xl text-amber-100 hover:text-amber-50 transition-colors"
          >
            <span className="block font-bold">Abraham</span>
            <span className="block text-sm font-normal tracking-widest text-amber-400/80 group-hover:text-amber-300/90 transition-colors">
              of London
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {desktopNavItems.map((item) => (
              <NavLink 
                key={item.href}
                href={item.href} 
                active={isActive(item.href)}
              >
                {item.label}
              </NavLink>
            ))}
            
            {/* More dropdown */}
            {moreItems.length > 0 && (
              <div className="relative group">
                <button
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  className="text-sm font-semibold tracking-wide px-4 py-2 text-gray-200 hover:text-amber-200 transition-colors"
                >
                  More
                  <ChevronRight className="inline-block ml-1 h-3 w-3 rotate-90 group-hover:rotate-180 transition-transform" />
                </button>
                
                {/* Dropdown menu */}
                <div className={`absolute right-0 top-full mt-2 w-48 bg-black/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl py-2 z-50 ${
                  isMoreMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                } transition-all duration-200`}>
                  {moreItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block px-4 py-2 text-sm hover:bg-white/5 transition-colors ${
                        isActive(item.href) 
                          ? 'text-amber-200 font-semibold' 
                          : 'text-gray-200 hover:text-white'
                      }`}
                      onClick={() => setIsMoreMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </nav>

          {/* Desktop CTA and Contact */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Contact info */}
            <div className="flex items-center gap-3 border-r border-white/20 pr-4">
              <a
                href={`mailto:${CONTACT_INFO.email}`}
                className="flex items-center gap-2 text-xs text-gray-300 hover:text-amber-300 transition-colors"
                aria-label="Send email"
              >
                <Mail className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Email</span>
              </a>
              <a
                href={`tel:${CONTACT_INFO.phone.replace(/\s+/g, "")}`}
                className="flex items-center gap-2 text-xs text-gray-300 hover:text-amber-300 transition-colors"
                aria-label="Call us"
              >
                <Phone className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Call</span>
              </a>
            </div>

            {/* CTA Button */}
            <Link
              href="/consulting#book"
              className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-semibold text-black hover:from-amber-400 hover:to-amber-500 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/20"
            >
              Book Session
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 text-white hover:border-amber-400/40 hover:text-amber-300 transition-all"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          {/* Mobile Menu Panel */}
          <div 
            className="absolute right-0 top-0 h-full w-[85vw] max-w-sm bg-black/95 backdrop-blur-xl border-l border-white/10 shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              {/* Mobile Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <Link 
                  href="/" 
                  className="font-serif text-xl text-amber-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Abraham of London
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-lg p-2 text-white hover:bg-white/10"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 p-6">
                <ul className="space-y-1">
                  {NAV_ITEMS.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`block py-3 px-4 rounded-lg text-base font-medium transition-colors ${
                          isActive(item.href)
                            ? 'bg-amber-500/10 text-amber-200 border-l-2 border-amber-500'
                            : 'text-gray-200 hover:bg-white/5 hover:text-white'
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>

                {/* Contact Section */}
                <div className="mt-8 pt-6 border-t border-white/10">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
                    Get in Touch
                  </h3>
                  <div className="space-y-3">
                    <a
                      href={`mailto:${CONTACT_INFO.email}`}
                      className="flex items-center gap-3 py-3 px-4 rounded-lg bg-white/5 text-gray-200 hover:text-amber-300 transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Mail className="h-4 w-4" />
                      <span>{CONTACT_INFO.email}</span>
                    </a>
                    <a
                      href={`tel:${CONTACT_INFO.phone.replace(/\s+/g, "")}`}
                      className="flex items-center gap-3 py-3 px-4 rounded-lg bg-white/5 text-gray-200 hover:text-amber-300 transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Phone className="h-4 w-4" />
                      <span>{CONTACT_INFO.phone}</span>
                    </a>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="mt-8">
                  <Link
                    href="/consulting#book"
                    className="block w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-4 text-center text-sm font-semibold text-black hover:from-amber-400 hover:to-amber-500 transition-all"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Book a Strategy Session
                  </Link>
                </div>
              </nav>

              {/* Mobile Footer */}
              <div className="p-6 border-t border-white/10">
                <p className="text-xs text-gray-400 text-center">
                  Institutional Strategy & Governance
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// NavLink Component
function NavLink({
  href,
  children,
  active,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`
        relative px-4 py-2 text-sm font-semibold tracking-wide transition-all duration-200
        ${active 
          ? 'text-amber-200' 
          : 'text-gray-200 hover:text-amber-200'
        }
        group
      `}
    >
      {children}
      
      {/* Active indicator */}
      {active && (
        <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-amber-500 rounded-full" />
      )}
      
      {/* Hover indicator */}
      <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-amber-300 rounded-full group-hover:w-1/2 transition-all duration-200" />
    </Link>
  );
}