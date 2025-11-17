// components/Navbar.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import ScrollProgress from "./ScrollProgress";
import { getRoutePath, RouteId } from "@/lib/siteConfig";

type NavItem = {
  name: string;
  route: RouteId;
};

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks: NavItem[] = [
    { name: "Home", route: "home" },
    { name: "About", route: "about" },
    { name: "Books", route: "booksIndex" },
    // ✅ Point “Blog” to the real index for now
    { name: "Blog", route: "contentIndex" },
    { name: "Contact", route: "contact" },
  ];

  return (
    <>
      {/* Progress Bar sits above navbar */}
      <ScrollProgress heightClass="h-1" colorClass="bg-warm-gold" />

      <motion.nav
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed w-full z-50 bg-neutral-dark/90 backdrop-blur-sm shadow-lg py-4"
      >
        <div className="container-custom flex justify-between items-center">
          {/* Logo */}
          <Link
            href={getRoutePath("home")}
            className="flex items-center space-x-2 text-2xl font-bold font-serif text-deep-gold hover:text-warm-gold transition-colors duration-200"
          >
            <Image
              src="/logo-placeholder.png"
              alt="Fathering Without Fear Logo"
              width={40}
              height={40}
              className="rounded-full"
              priority
            />
            <span>Fathering Without Fear</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={getRoutePath(link.route)}
                className="text-lg font-sans text-off-white hover:text-warm-gold transition-colors duration-200"
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
            className="md:hidden text-off-white hover:text-warm-gold focus:outline-none focus:ring-2 focus:ring-warm-gold transition-colors duration-200 p-2 rounded"
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
              className="md:hidden bg-neutral-dark pt-4 pb-8 border-t border-deep-navy/50"
            >
              <div className="flex flex-col items-center space-y-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={getRoutePath(link.route)}
                    onClick={() => setIsOpen(false)}
                    className="text-xl font-sans text-off-white hover:text-warm-gold transition-colors duration-200 py-2"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}