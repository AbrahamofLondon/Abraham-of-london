// components/Navbar.tsx — SINGLE SOURCE OF TRUTH (Pages Router safe, no overlap)
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Menu, X, ArrowRight, Briefcase } from "lucide-react";

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

const NAV = [
  { href: "/canon", label: "Canon" },
  { href: "/briefs", label: "Briefs" },
  { href: "/library", label: "Library" },
  { href: "/ventures", label: "Ventures" },
  { href: "/shorts", label: "Shorts" },
  { href: "/about", label: "About" },
  { href: "/downloads/vault", label: "Vault" },
];

export default function Navbar(): React.ReactElement {
  const router = useRouter();
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    setOpen(false);
  }, [router.asPath]);

  React.useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [open]);

  const currentPath = (router.asPath || "/").split("#")[0] || "/";
  const isActive = (href: string) => (href === "/" ? currentPath === "/" : currentPath.startsWith(href));

  return (
    <header className="fixed inset-x-0 top-0 z-[100]">
      {/* Backplate */}
      <div
        className={cx(
          "h-20 border-b transition-all duration-300",
          scrolled ? "border-white/10 bg-black/90 backdrop-blur-xl" : "border-transparent bg-transparent"
        )}
      />

      {/* Content */}
      <div className="pointer-events-none absolute inset-0">
        <div className="pointer-events-auto mx-auto flex h-20 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          {/* Brand: fixed footprint so nav never overlays it */}
          <Link href="/" className="shrink-0">
            <span className="block font-serif text-xl font-semibold tracking-tight text-amber-100 sm:text-2xl whitespace-nowrap">
              Abraham<span className="text-amber-300"> of London</span>
            </span>
            <span className="mt-1 block text-[9px] font-extrabold uppercase tracking-[0.45em] text-gray-500">
              Institutional Platform
            </span>
          </Link>

          {/* Desktop Nav: clamps width, prevents wrapping/overlap */}
          <nav className="ml-auto hidden min-w-0 items-center gap-6 lg:flex">
            <div className="min-w-0 max-w-[52vw] xl:max-w-[58vw] overflow-hidden">
              <ul className="flex items-center justify-end gap-6 whitespace-nowrap">
                {NAV.map((x) => (
                  <li key={x.href} className="shrink-0">
                    <Link
                      href={x.href}
                      className={cx(
                        "text-[11px] font-extrabold uppercase tracking-[0.25em] transition-colors",
                        isActive(x.href) ? "text-amber-300" : "text-gray-300 hover:text-white"
                      )}
                    >
                      {x.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA: always visible, never pushes nav into brand */}
            <Link
              href="/consulting"
              className="shrink-0 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-5 py-3 text-[11px] font-extrabold uppercase tracking-[0.2em] text-black shadow-xl shadow-amber-900/25 transition-all hover:scale-[1.02]"
            >
              <Briefcase className="h-4 w-4" />
              Inquiries
              <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="ml-auto lg:hidden inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-amber-200 transition-all hover:border-white/20 hover:bg-white/10"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-[110] lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-[88vw] max-w-sm border-l border-white/10 bg-black/95 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 p-6 pt-7">
              <span className="font-serif text-lg font-semibold text-amber-100">Menu</span>
              <button
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gray-200 hover:border-white/20 hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <div className="grid gap-2">
                <Link
                  href="/"
                  className={cx(
                    "rounded-2xl border px-5 py-4 text-sm font-semibold transition-all",
                    isActive("/") ? "border-amber-400/25 bg-amber-500/10 text-amber-200" : "border-white/10 bg-white/5 text-gray-200 hover:border-white/20 hover:bg-white/10"
                  )}
                >
                  Home
                </Link>

                {NAV.map((x) => (
                  <Link
                    key={x.href}
                    href={x.href}
                    className={cx(
                      "rounded-2xl border px-5 py-4 text-sm font-semibold transition-all",
                      isActive(x.href)
                        ? "border-amber-400/25 bg-amber-500/10 text-amber-200"
                        : "border-white/10 bg-white/5 text-gray-200 hover:border-white/20 hover:bg-white/10"
                    )}
                  >
                    {x.label}
                  </Link>
                ))}
              </div>

              <Link
                href="/consulting"
                className="mt-6 inline-flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-5 py-4 text-sm font-extrabold text-black"
              >
                Inquiries
                <ArrowRight className="h-4 w-4" />
              </Link>

              <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.45em] text-gray-500">
                London • Africa-forward • durable systems
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}