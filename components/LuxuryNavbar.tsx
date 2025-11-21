// components/LuxuryNavbar.tsx
"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  BookOpen,
  Download,
  Calendar,
  Building2,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  description?: string;
}

const navigation: NavItem[] = [
  {
    label: "Home",
    href: "/",
    description: "Start here",
  },
  {
    label: "Content",
    href: "/content",
    icon: <BookOpen className="h-4 w-4" />,
    description: "Articles & Insights",
  },
  {
    label: "Downloads",
    href: "/downloads",
    icon: <Download className="h-4 w-4" />,
    description: "Tools & Resources",
  },
  {
    label: "Events",
    href: "/events",
    icon: <Calendar className="h-4 w-4" />,
    description: "Workshops & Gatherings",
  },
  {
    label: "Ventures",
    href: "/ventures",
    icon: <Building2 className="h-4 w-4" />,
    description: "Strategic Projects",
  },
];

export default function LuxuryNavbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Main Navbar */}
      <motion.nav
        className={`fixed top-0 z-50 w-full transition-all duration-500 ${
          scrolled
            ? "bg-charcoal/95 backdrop-blur-xl border-b border-gold/20 shadow-2xl"
            : "bg-transparent"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Logo (no crown icon, pure wordmark) */}
            <motion.div
              className="flex items-center"
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Link
                href="/"
                className="group flex items-center gap-3 text-2xl font-serif font-bold text-cream"
              >
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-amber-200 shadow-lg">
                    <span className="text-base font-black tracking-[0.2em] text-charcoal">
                      A
                    </span>
                  </div>
                  <motion.div
                    className="pointer-events-none absolute -inset-1 rounded-2xl bg-gold/15 opacity-0 group-hover:opacity-100"
                    initial={false}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <span className="flex flex-col leading-tight">
                  <span className="bg-gradient-to-r from-gold to-amber-200 bg-clip-text text-lg text-transparent">
                    Abraham of London
                  </span>
                  <span className="text-xs font-sans font-normal tracking-[0.3em] text-gold/70">
                    FAITH · STRATEGY · FATHERHOOD
                  </span>
                </span>
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:items-center lg:gap-8">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group relative py-2"
                  >
                    <motion.div
                      className="flex items-center gap-2 text-sm font-semibold text-cream transition-colors hover:text-gold"
                      whileHover={{ y: -2 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      {item.icon}
                      {item.label}
                    </motion.div>

                    {isActive && (
                      <motion.div
                        className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-gold to-amber-200"
                        layoutId="activeIndicator"
                        transition={{ type: "spring", stiffness: 500 }}
                      />
                    )}

                    <motion.div
                      className="pointer-events-none absolute inset-0 rounded-lg bg-gold/10 opacity-0 group-hover:opacity-100"
                      initial={false}
                      transition={{ duration: 0.2 }}
                    />
                  </Link>
                );
              })}
            </div>

            {/* Desktop Right Section */}
            <div className="hidden lg:flex lg:items-center lg:gap-6">
              <ThemeToggle size="md" />

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/contact"
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-gold to-amber-200 px-6 py-3 text-sm font-bold text-charcoal shadow-lg transition-all hover:shadow-xl"
                >
                  <span className="relative z-10">Get in Touch</span>
                  <motion.div
                    className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  />
                </Link>
              </motion.div>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-4 lg:hidden">
              <ThemeToggle size="sm" />

              <motion.button
                className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/30 bg-charcoal/80 backdrop-blur-sm"
                onClick={toggleMenu}
                whileHover={{
                  scale: 1.05,
                  borderColor: "rgba(212, 175, 55, 0.6)",
                }}
                whileTap={{ scale: 0.95 }}
                aria-label="Toggle menu"
              >
                <AnimatePresence mode="wait">
                  {isOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="h-6 w-6 text-gold" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="h-6 w-6 text-gold" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {!isOpen && (
                  <motion.div
                    className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-gradient-to-r from-gold to-amber-200"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              className="fixed inset-0 z-40 bg-charcoal/95 backdrop-blur-xl lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMenu}
            />

            {/* Mobile Menu Drawer */}
            <motion.div
              className="fixed right-0 top-0 z-50 h-full w-80 bg-gradient-to-b from-charcoal to-charcoal/95 backdrop-blur-2xl lg:hidden"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gold/20 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-amber-200">
                    <span className="text-xs font-black tracking-[0.2em] text-charcoal">
                      A
                    </span>
                  </div>
                  <span className="font-serif text-lg font-bold text-cream">
                    Abraham of London
                  </span>
                </div>

                <motion.button
                  onClick={closeMenu}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/30 text-gold transition-colors hover:bg-gold/10"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>

              {/* Navigation Items */}
              <nav className="p-6">
                <ul className="space-y-4">
                  {navigation.map((item, index) => {
                    const isActive = pathname === item.href;
                    return (
                      <motion.li
                        key={item.href}
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Link
                          href={item.href}
                          onClick={closeMenu}
                          className={`group flex items-center gap-4 rounded-2xl p-4 transition-all ${
                            isActive
                              ? "bg-gradient-to-r from-gold/20 to-gold/10 border border-gold/30"
                              : "hover:bg-gold/5 border border-transparent"
                          }`}
                        >
                          <div
                            className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                              isActive
                                ? "bg-gradient-to-br from-gold to-amber-200 text-charcoal"
                                : "bg-gold/10 text-gold"
                            }`}
                          >
                            {item.icon ?? (
                              <span className="text-xs font-semibold tracking-[0.2em]">
                                {item.label[0]}
                              </span>
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-semibold ${
                                  isActive ? "text-gold" : "text-cream"
                                }`}
                              >
                                {item.label}
                              </span>
                              {isActive && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="h-2 w-2 rounded-full bg-gold"
                                />
                              )}
                            </div>
                            {item.description && (
                              <p className="text-sm text-gold/70">
                                {item.description}
                              </p>
                            )}
                          </div>

                          <ChevronRight
                            className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${
                              isActive ? "text-charcoal" : "text-gold/50"
                            }`}
                          />
                        </Link>
                      </motion.li>
                    );
                  })}
                </ul>

                {/* Mobile CTA */}
                <motion.div
                  className="mt-8 border-t border-gold/20 pt-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <Link
                    href="/contact"
                    onClick={closeMenu}
                    className="group flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-gold to-amber-200 px-6 py-4 font-bold text-charcoal shadow-lg transition-all hover:shadow-xl"
                  >
                    <Sparkles className="h-5 w-5" />
                    Get in Touch
                  </Link>
                </motion.div>
              </nav>

              {/* Footer */}
              <div className="absolute bottom-0 left-0 right-0 border-t border-gold/20 p-6">
                <div className="text-center text-sm text-gold/50">
                  Faith · Strategy · Fatherhood
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}