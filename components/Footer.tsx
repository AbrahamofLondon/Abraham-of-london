// components/Footer.tsx
import React from "react";
import Link from "next/link";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 py-10">
      <div className="container mx-auto px-4 max-w-7xl text-center">
        <nav
          className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-deepCharcoal"
          aria-label="Footer"
        >
          <Link href="/privacy" className="hover:text-forest transition">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-forest transition">
            Terms of Service
          </Link>
          {/* External actions: use <a> for better semantics */}
          <a
            href="mailto:info@abrahamoflondon.org"
            className="hover:text-forest transition"
            aria-label="Email Abraham of London"
          >
            Email
          </a>
          <Link href="/contact" className="hover:text-forest transition">
            Contact Us
          </Link>
          <a
            href="https://innovatehub.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-forest transition"
            aria-label="InnovateHub (opens in a new tab)"
          >
            InnovateHub
          </a>
        </nav>

        <p className="mt-6 text-sm text-deepCharcoal/60">
          &copy; {new Date().getFullYear()} Abraham of London. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
