// components/Navbar.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import ScrollProgress from "./ScrollProgress";

// Self-contained route configuration
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

type NavItem = {
  name: string;
  route: RouteId;
};

// Local route configuration
const LOCAL_ROUTES: Record<RouteId, string> = {
  home: "/",
  about: "/about",
  blogIndex: "/blog",
  contentIndex: "/content",
  booksIndex: "/books",
  canonIndex: "/canon",
  ventures: "/ventures",
  downloadsIndex: "/downloads",
  strategyLanding: "/strategy",
  contact: "/contact",
};

// Safe route path resolver
const getRoutePath = (route: RouteId): string => {
  return LOCAL_ROUTES[route] || "/";
};

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks: NavItem[] = [
    { name: "Home", route: "home" },
    { name: "About", route: "about" },
    { name: "Books", route: "booksIndex" },
    { name: "Blog", route: "contentIndex" },
    { name: "Contact", route: "contact" },
  ];

  return (
    <>
      {/* Progress Bar sits above navbar */}
      <ScrollProgress heightClass="h-1" colorClass="bg-amber-500" />

      <motion.nav
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed w-full z-50 bg-gray-900/90 backdrop-blur-sm shadow-lg py-4"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          {/* Logo */}
          <Link
            href={getRoutePath("home")}
            className="flex items-center space-x-3 text-2xl font-bold font-serif text-amber-500 hover:text-amber-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 rounded-lg"
            prefetch={true}
          >
            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              FWF
            </div>
            <span>Fathering Without Fear</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={getRoutePath(link.route)}
                className="text-lg font-sans text-gray-100 hover:text-amber-400 transition-colors duration-200 py-2 px-3 rounded-lg hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                prefetch={true}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Mobile Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            className="md:hidden text-gray-100 hover:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-colors duration-200 p-2 rounded-lg hover:bg-white/5"
            aria-label="Toggle navigation"
          >
            {isOpen ? (
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Overlay */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              id="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden bg-gray-800/95 backdrop-blur-lg pt-4 pb-8 border-t border-amber-500/20"
            >
              <div className="flex flex-col items-center space-y-4 px-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={getRoutePath(link.route)}
                    onClick={() => setIsOpen(false)}
                    className="text-xl font-sans text-gray-100 hover:text-amber-400 transition-colors duration-200 py-3 px-6 rounded-lg w-full text-center hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    prefetch={true}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Add padding to main content to account for fixed navbar */}
      <style jsx global>{`
        main {
          padding-top: 6rem;
        }
        
        /* Enhanced focus styles */
        *:focus-visible {
          outline: 2px solid #f59e0b;
          outline-offset: 2px;
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
    </>
  );
}