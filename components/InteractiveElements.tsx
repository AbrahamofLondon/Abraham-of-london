"use client";

import { useState } from "react";

export default function MobileMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <button className="mobile-menu-button" onClick={toggleMenu}>
        {/* Your menu icon (e.g., a hamburger SVG) */}
        <svg
          className="w-6 h-6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
      </button>

      <div className={`mobile-menu ${isMenuOpen ? "" : "hidden"}`}>
        {/* Your menu items here */}
        <a href="#" className="block py-2 px-4 text-sm hover:bg-gray-200">
          Home
        </a>
        <a href="#" className="block py-2 px-4 text-sm hover:bg-gray-200">
          About
        </a>
      </div>
    </>
  );
}




