import React from "react";
import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-lightGrey bg-white text-deepCharcoal dark:bg-deepCharcoal dark:text-cream dark:border-white/10">
      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm">&copy; {year} Abraham of London. All rights reserved.</p>
        <nav className="flex gap-4 text-sm" aria-label="Footer">
          <Link href="/privacy" className="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-deepCharcoal/40 rounded-sm">
            Privacy
          </Link>
          <Link href="/terms" className="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-deepCharcoal/40 rounded-sm">
            Terms
          </Link>
          <Link href="/contact" className="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-deepCharcoal/40 rounded-sm">
            Contact
          </Link>
        </nav>
      </div>
    </footer>
  );
}
