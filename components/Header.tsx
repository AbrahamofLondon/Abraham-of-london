import React from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { motion } from "framer-motion";

const Header: React.FC = () => {
  return (
    <motion.header
      className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-black/40 dark:border-white/10"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      role="navigation"
      aria-label="Primary"
    >
      <nav className="container mx-auto px-4 flex justify-between items-center h-16">
        <Link
          href="/"
          className="text-2xl md:text-3xl font-serif font-bold text-deepCharcoal dark:text-cream"
        >
          Abraham of London
        </Link>

        <div className="flex items-center gap-6">
          <ul className="hidden md:flex items-center gap-6">
            {[
              ["About", "/about"],
              ["Blog", "/blog"],
              ["Books", "/books"],
              ["Brands", "/brands"],
              ["Contact", "/contact"],
            ].map(([label, href]) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-deepCharcoal/80 hover:text-deepCharcoal dark:text-cream/80 dark:hover:text-cream transition"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <ThemeToggle />
        </div>
      </nav>
    </motion.header>
  );
};

export default Header;
