"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Menu, X, ArrowRight, Vault, Shield, Compass, Briefcase } from "lucide-react";

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

const NAV = [
  { href: "/", label: "Home" },
  { href: "/canon", label: "Canon" },
  { href: "/resources/strategic-frameworks", label: "Frameworks" },
  { href: "/downloads/vault", label: "Vault" },
  { href: "/strategy", label: "Strategy" },
  { href: "/ventures", label: "Ventures" },
  { href: "/shorts", label: "Shorts" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
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
    document.body.style.overflow = open ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  const isActive = (href: string) => {
    if (href === "/") return router.asPath === "/";
    return router.asPath.startsWith(href);
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-[100]">
      {/* Backplate */}
      <div
        className={cx(
          "h-20 border-b transition-all duration-300",
          scrolled
            ? "border-white/10 bg-black/90 backdrop-blur-xl"
            : "border-transparent bg-black/0"
        )}
      />

      {/* Content */}
      <div className="absolute inset-0">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <Link href="/" className="group flex flex-col">
            <span className="font-serif text-xl font-semibold tracking-tight text-amber-100 sm:text-2xl">
              Abraham<span className="text-amber-300"> of London</span>
            </span>
            <span className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.45em] text-gray-500 group-hover:text-gray-300 transition-colors">
              Strategy • Canon • Vault
            </span>
          </Link>

          {/* Desktop */}
          <nav className="hidden items-center gap-6 lg:flex">
            {NAV.slice(0, 6).map((x) => (
              <Link
                key={x.href}
                href={x.href}
                className={cx(
                  "text-[11px] font-extrabold uppercase tracking-[0.25em] transition-colors",
                  isActive(x.href) ? "text-amber-300" : "text-gray-300 hover:text-white"
                )}
              >
                {x.label}
              </Link>
            ))}

            {/* CTA */}
            <Link
              href="/consulting"
              className="ml-2 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-6 py-3 text-[11px] font-extrabold uppercase tracking-[0.2em] text-black shadow-xl shadow-amber-900/25 transition-all hover:scale-[1.02]"
            >
              <Briefcase className="h-4 w-4" />
              Engage
              <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-amber-200 transition-all hover:border-white/20 hover:bg-white/10"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-[110] lg:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-[88vw] max-w-sm border-l border-white/10 bg-black/95 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 p-6">
              <span className="font-serif text-lg font-semibold text-amber-100">
                Menu
              </span>
              <button
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gray-200 hover:border-white/20 hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <div className="grid gap-2">
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

              <div className="mt-6 grid gap-2">
                <Link
                  href="/resources/strategic-frameworks"
                  className="inline-flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-gray-200 hover:border-white/20 hover:bg-white/10"
                >
                  <span className="inline-flex items-center gap-2">
                    <Compass className="h-4 w-4 text-amber-300" />
                    Frameworks
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/downloads/vault"
                  className="inline-flex items-center justify-between rounded-2xl border border-amber-400/20 bg-amber-500/10 px-5 py-4 text-sm font-semibold text-amber-200 hover:border-amber-400/35"
                >
                  <span className="inline-flex items-center gap-2">
                    <Vault className="h-4 w-4 text-amber-300" />
                    Vault
                  </span>
                  <Shield className="h-4 w-4 text-amber-300" />
                </Link>

                <Link
                  href="/consulting"
                  className="inline-flex items-center justify-between rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-5 py-4 text-sm font-extrabold text-black"
                >
                  Engage
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.45em] text-gray-500">
                Designed in London • built to deploy
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}