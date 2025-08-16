// components/Footer.tsx
import React from "react";
import Link from "next/link";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 py-8">
      <div className="container mx-auto px-4 max-w-7xl text-center">
        <nav className="flex flex-wrap justify-center gap-6 text-deepCharcoal">
          <Link href="/privacy" className="hover:text-forest transition">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-forest transition">
            Terms of Service
          </Link>
          <Link href="mailto:info@abrahamoflondon.org" className="hover:text-forest transition">
            Email
          </Link>
          <Link href="/contact" className="hover:text-forest transition">
            Contact Us
          </Link>
          <Link href="https://innovatehub.com" className="hover:text-forest transition">
            InnovateHub
          </Link>
        </nav>
        <p className="mt-4 text-sm text-deepCharcoal/60">
          &copy; {new Date().getFullYear()} Abraham of London. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
