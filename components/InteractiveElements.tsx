"use client";

import { useState } from "react";

export default function MobileMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  return (
    <div className="relative md:hidden">
      {/* Button */}
      <button
        onClick={toggleMenu}
        aria-expanded={isMenuOpen}
        aria-controls="mobile-nav"
        className="p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          {isMenuOpen ? (
            // X icon
            <path d="M6 18L18 6M6 6l12 12" />
          ) : (
            // Hamburger icon
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Dropdown */}
      <div
        id="mobile-nav"
        className={`absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg ${
          isMenuOpen ? "block" : "hidden"
        }`}
      >
        <a
          href="/"
          className="block py-2 px-4 text-sm text-gray-700 hover:bg-gray-100"
        >
          Home
        </a>
        <a
          href="/about"
          className="block py-2 px-4 text-sm text-gray-700 hover:bg-gray-100"
        >
          About
        </a>
        <a
          href="/services"
          className="block py-2 px-4 text-sm text-gray-700 hover:bg-gray-100"
        >
          Services
        </a>
        <a
          href="/contact"
          className="block py-2 px-4 text-sm text-gray-700 hover:bg-gray-100"
        >
          Contact
        </a>
      </div>
    </div>
  );
}
