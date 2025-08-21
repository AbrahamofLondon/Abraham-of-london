import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import ThemeToggle from "./ThemeToggle";

type HeaderProps = {
  /** Keep visual in sync with pages that run a darker shell */
  variant?: "light" | "dark";
};

const NAV = [
  { href: "/books", label: "Books" },
  { href: "/blog", label: "Insights" },
  { href: "/ventures", label: "Ventures" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Header({ variant = "light" }: HeaderProps) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    // lock scroll when mobile menu is open
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => { document.documentElement.style.overflow = ""; };
  }, [open]);

  const isActive = (href: string) =>
    router.pathname === href || router.asPath === href;

  const shell =
    variant === "dark"
      ? "bg-black/50 border-white/10 text-cream"
      : "bg-white/70 border-black/10 text-deepCharcoal";

  const linkBase =
    variant === "dark"
      ? "text-cream/80 hover:text-cream"
      : "text-deepCharcoal/80 hover:text-deepCharcoal";

  const underlineActive =
    variant === "dark" ? "bg-cream" : "bg-deepCharcoal";

  return (
    <motion.header
      className={`fixed inset-x-0 top-0 z-50 border-b backdrop-blur supports-[backdrop-filter]:bg-opacity-60 ${shell}`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      role="navigation"
      aria-label="Primary"
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:h-20">
        {/* Brand */}
        <Link
          href="/"
          className={`text-2xl md:text-3xl font-serif font-bold ${
            variant === "dark" ? "text-cream" : "text-deepCharcoal"
          }`}
        >
          Abraham of London
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          <ul className="flex items-center gap-6">
            {NAV.map((item) => (
              <li key={item.href} className="relative">
                <Link
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${linkBase}`}
                >
                  {item.label}
                </Link>
                {/* understated active underline */}
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute -bottom-1 left-0 h-[2px] transition-all ${
                    isActive(item.href) ? `w-full ${underlineActive}` : "w-0"
                  }`}
                />
              </li>
            ))}
          </ul>

          {/* CTA + Theme */}
          <div className="flex items-center gap-3">
            <Link
              href="/contact"
              className="rounded-full bg-softGold px-5 py-2 text-sm font-semibold text-deepCharcoal transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-softGold/40"
            >
              Enquire
            </Link>
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile: theme + burger */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className={`inline-flex items-center justify-center rounded-md border p-2 ${
              variant === "dark"
                ? "border-white/20 text-cream"
                : "border-black/20 text-deepCharcoal"
            }`}
          >
            <span className="sr-only">Toggle navigation</span>
            {!open ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        id="mobile-nav"
        className={`md:hidden ${open ? "block" : "hidden"} ${
          variant === "dark" ? "bg-black/80" : "bg-white/95"
        } border-t ${variant === "dark" ? "border-white/10" : "border-black/10"} backdrop-blur`}
      >
        <nav className="mx-auto max-w-7xl px-4 py-4" aria-label="Mobile Primary">
          <ul className="grid gap-2">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-md px-3 py-2 text-base font-medium ${
                    isActive(item.href)
                      ? variant === "dark"
                        ? "bg-white/10 text-cream"
                        : "bg-black/5 text-deepCharcoal"
                      : variant === "dark"
                        ? "text-cream/80 hover:bg-white/10 hover:text-cream"
                        : "text-deepCharcoal/80 hover:bg-black/5 hover:text-deepCharcoal"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className="block rounded-full bg-softGold px-5 py-2 text-center text-sm font-semibold text-deepCharcoal transition hover:brightness-95"
              >
                Enquire
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </motion.header>
  );
}
