// components/Navbar.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Books", href: "/books" },
    { name: "Blog", href: "/blog" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      // Use original Tailwind classes
      className="fixed w-full z-50 bg-neutral-dark/90 backdrop-blur-sm shadow-lg py-4"
    >
      <div className="container-custom flex justify-between items-center">
        {/* Logo/Site Title */}
        <Link
          href="/"
          className="flex items-center space-x-2 text-2xl font-bold font-serif text-deep-gold hover:text-warm-gold transition-colors duration-200"
        >
          <Image
            src="/logo-placeholder.png"
            alt="Fathering Without Fear Logo"
            width={40}
            height={40}
            className="rounded-full"
          />
          <span>Fathering Without Fear</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-8">
          {" "}
          {/* Tailwind's responsiveness */}
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-lg font-sans text-off-white hover:text-warm-gold transition-colors duration-200"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Mobile Menu Button (Hamburger) */}
        <div className="md:hidden">
          {" "}
          {/* Tailwind's responsiveness */}
          <button
            onClick={toggleMenu}
            className="text-off-white hover:text-warm-gold focus:outline-none focus:ring-2 focus:ring-warm-gold transition-colors duration-200 p-2 rounded"
            aria-label="Toggle navigation"
          >
            {isOpen ? (
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            ) : (
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16m-7 6h7"
                ></path>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-neutral-dark pt-4 pb-8 border-t border-deep-navy/50" // Tailwind classes
          >
            <div className="flex flex-col items-center space-y-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={toggleMenu}
                  className="text-xl font-sans text-off-white hover:text-warm-gold transition-colors duration-200 py-2" // Tailwind classes
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}




