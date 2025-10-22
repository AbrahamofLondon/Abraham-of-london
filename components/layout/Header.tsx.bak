// components/layout/Header.tsx
import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import clsx from "clsx";

const ThemeToggle = dynamic(() => import("@/components/ThemeToggle"), { ssr: false });

export default function Header() {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-[60] bg-white/85 dark:bg-[color:var(--color-secondary)]/85 backdrop-blur border-b border-lightGrey">
      <div className="mx-auto max-w-7xl h-14 px-4 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="font-serif text-xl font-semibold text-deepCharcoal dark:text-[var(--color-on-secondary)]" prefetch={false}>
          Abraham of London
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-[color:var(--color-on-secondary)]/80">
          <Link href="/blog" prefetch={false} className="hover:text-deepCharcoal">Blog</Link>
          <Link href="/books" prefetch={false} className="hover:text-deepCharcoal">Books</Link>
          <Link href="/events" prefetch={false} className="hover:text-deepCharcoal">Events</Link>
          <Link href="/downloads" prefetch={false} className="hover:text-deepCharcoal">Downloads</Link>
          <Link href="/about" prefetch={false} className="hover:text-deepCharcoal">About</Link>
          <Link href="/contact" prefetch={false} className="hover:text-deepCharcoal">Contact</Link>
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-lightGrey text-[color:var(--color-on-secondary)]/80"
            aria-label="Open menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className={clsx("i-heroicons-bars-3", open && "hidden")}>☰</span>
            <span className={clsx(!open && "hidden")}>✕</span>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-lightGrey bg-white dark:bg-[color:var(--color-secondary)]">
          <nav className="mx-auto max-w-7xl px-4 py-3 flex flex-col gap-2 text-sm">
            {[
              ["/blog","Blog"],
              ["/books","Books"],
              ["/events","Events"],
              ["/downloads","Downloads"],
              ["/about","About"],
              ["/contact","Contact"],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                prefetch={false}
                className="py-2 text-[color:var(--color-on-secondary)]/85 hover:text-deepCharcoal"
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
