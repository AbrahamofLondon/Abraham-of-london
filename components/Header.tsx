// components/Header.tsx
import React from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { motion } from "framer-motion";

const Header: React.FC = () => {
  return (
    <motion.header
      className="site-header fixed top-0 w-full z-50 transition-colors duration-300"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      <nav className="container mx-auto px-4 flex justify-between items-center h-full">
        <Link
          href="/"
          className="text-3xl md:text-4xl font-serif font-bold text-[var(--color-primary)] hover:text-[var(--color-accent)] transition-colors duration-300"
        >
          Abraham of London
        </Link>
        <div className="flex items-center space-x-6">
          <ul className="hidden md:flex space-x-6">
            <li>
              <Link
                href="/about"
                className="hover:text-[var(--color-accent)] text-[var(--color-primary)] transition-colors duration-300"
              >
                About
              </Link>
            </li>
            <li>
              <Link
                href="/blog"
                className="hover:text-[var(--color-accent)] text-[var(--color-primary)] transition-colors duration-300"
              >
                Blog
              </Link>
            </li>
            <li>
              <Link
                href="/books"
                className="hover:text-[var(--color-accent)] text-[var(--color-primary)] transition-colors duration-300"
              >
                Books
              </Link>
            </li>
            <li>
              <Link
                href="/brands"
                className="hover:text-[var(--color-accent)] text-[var(--color-primary)] transition-colors duration-300"
              >
                Brands
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="hover:text-[var(--color-accent)] text-[var(--color-primary)] transition-colors duration-300"
              >
                Contact
              </Link>
            </li>
          </ul>
          <ThemeToggle />
        </div>
      </nav>
    </motion.header>
  );
};

export default Header;




