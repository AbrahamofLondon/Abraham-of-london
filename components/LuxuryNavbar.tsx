"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Menu,
  X,
  Mail,
  Phone,
  ArrowRight,
  Lock,
  BookOpen,
  Briefcase,
  Vault,
  Library,
  Compass,
  Users,
} from "lucide-react";

type Props = {
  transparent?: boolean;
};

const CONTACT_INFO = {
  email: "info@abrahamoflondon.org",
  phone: "+44 20 8622 5909",
};

const PRIMARY = [
  { href: "/consulting", label: "Advisory", icon: Briefcase },
  { href: "/canon", label: "Canon", icon: BookOpen },
  { href: "/downloads/vault", label: "Vault", icon: Vault },
];

const SECONDARY = [
  { href: "/resources", label: "Resources", icon: Library },
  { href: "/strategy", label: "Strategy", icon: Compass },
  { href: "/ventures", label: "Ventures", icon: Users },
];

const TERTIARY = [
  { href: "/books", label: "Books" },
  { href: "/shorts", label: "Shorts" },
  { href: "/blog", label: "Insights" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

function cleanTel(phone: string): string {
  return phone.replace(/\s+/g, "");
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function isActivePath(asPath: string, href: string) {
  const path = (asPath || "/").split("?")[0].split("#")[0];
  if (href === "/") return path === "/";
  return path === href || path.startsWith(href + "/") || path.startsWith(href + "#");
}

export default function LuxuryNavbar({ transparent = false }: Props) {
  const router = useRouter();
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close on navigation
  React.useEffect(() => {
    setOpen(false);
  }, [router.asPath]);

  // Lock scroll
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "auto";
    };
  }, [open]);

  // ESC to close
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const baseBg =
    transparent && !scrolled
      ? "bg-transparent"
      : "bg-black/92 backdrop-blur-xl border-b border-white/10";

  const barShadow = scrolled ? "shadow-[0_10px_40px_rgba(0,0,0,0.45)]" : "";

  const asPath = router.asPath || "/";

  return (
    <header className="fixed left-0 right-0 top-0 z-[100]">
      <div className={cx("h-20 transition-all duration-300", baseBg, barShadow)} />

      <div className="absolute inset-0 pointer-events-auto">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <Link href="/" className="group flex flex-col leading-none">
            <span className="font-serif text-xl sm:text-2xl text-amber-100 tracking-tight">
              Abraham <span className="text-amber-300">of London</span>
            </span>
            <span className="mt-2 text-[10px] font-bold uppercase tracking-[0.35em] text-amber-300/60 group-hover:text-amber-300/90 transition-colors">
              Institutional Operating System
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-2">
            {/* Primary */}
            <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-1">
              {PRIMARY.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(asPath, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cx(
                      "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all",
                      active
                        ? "bg-amber-500/15 text-amber-200"
                        : "text-gray-200 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <Icon className="h-4 w-4 text-amber-300" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Secondary */}
            <div className="ml-3 hidden xl:flex items-center gap-1">
              {SECONDARY.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(asPath, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cx(
                      "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.15em] transition-all",
                      active
                        ? "text-amber-200"
                        : "text-gray-300 hover:text-white"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 text-amber-300/80" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Desktop Right Rail */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="hidden xl:flex items-center gap-3 border-r border-white/15 pr-4">
              <a
                href={`mailto:${CONTACT_INFO.email}`}
                className="inline-flex items-center gap-2 text-xs text-gray-300 hover:text-amber-300 transition-colors"
                aria-label="Send email"
              >
                <Mail className="h-3.5 w-3.5" />
                Email
              </a>
              <a
                href={`tel:${cleanTel(CONTACT_INFO.phone)}`}
                className="inline-flex items-center gap-2 text-xs text-gray-300 hover:text-amber-300 transition-colors"
                aria-label="Call"
              >
                <Phone className="h-3.5 w-3.5" />
                Call
              </a>
            </div>

            <Link
              href="/inner-circle"
              className="inline-flex items-center gap-2 rounded-2xl border border-amber-400/25 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-amber-200 hover:border-amber-400/45 hover:bg-white/10 transition-all"
            >
              <Lock className="h-4 w-4 text-amber-300" />
              Inner Circle
            </Link>

            <Link
              href="/consulting#book"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-5 py-2.5 text-sm font-bold text-black shadow-lg shadow-amber-900/20 hover:from-amber-400 hover:via-amber-500 hover:to-amber-600 transition-all active:scale-95"
            >
              Book Session <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Mobile Button */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white hover:border-amber-400/35 hover:text-amber-200 transition-all"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Panel */}
      {open && (
        <div
          className="fixed inset-0 z-[110] lg:hidden"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />

          <div
            className="absolute right-0 top-0 h-full w-[88vw] max-w-sm border-l border-white/10 bg-black/95 backdrop-blur-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-white/10 p-6">
                <Link
                  href="/"
                  className="font-serif text-lg text-amber-100"
                  onClick={() => setOpen(false)}
                >
                  Abraham of London
                </Link>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-white/10 bg-white/5 p-2 text-white hover:bg-white/10"
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-gray-500">
                  Primary
                </p>

                <div className="mt-4 space-y-2">
                  {[...PRIMARY].map((item) => {
                    const Icon = item.icon;
                    const active = isActivePath(asPath, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cx(
                          "flex items-center justify-between rounded-2xl border px-4 py-4 transition-all",
                          active
                            ? "border-amber-400/25 bg-amber-500/10 text-amber-200"
                            : "border-white/10 bg-white/[0.03] text-gray-200 hover:bg-white/10 hover:text-white"
                        )}
                        onClick={() => setOpen(false)}
                      >
                        <span className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                            <Icon className="h-5 w-5 text-amber-300" />
                          </span>
                          <span className="font-semibold">{item.label}</span>
                        </span>
                        <ArrowRight className="h-4 w-4 opacity-70" />
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-8">
                  <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-gray-500">
                    Navigate
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {SECONDARY.map((item) => {
                      const Icon = item.icon;
                      const active = isActivePath(asPath, item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cx(
                            "flex items-center gap-2 rounded-xl border px-3 py-3 text-xs font-semibold uppercase tracking-[0.15em] transition-all",
                            active
                              ? "border-amber-400/25 bg-amber-500/10 text-amber-200"
                              : "border-white/10 bg-white/[0.03] text-gray-300 hover:bg-white/10 hover:text-white"
                          )}
                          onClick={() => setOpen(false)}
                        >
                          <Icon className="h-4 w-4 text-amber-300/80" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-8">
                  <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-gray-500">
                    Other
                  </p>
                  <div className="mt-3 space-y-1">
                    {TERTIARY.map((item) => {
                      const active = isActivePath(asPath, item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cx(
                            "block rounded-xl px-4 py-3 text-sm transition-all",
                            active
                              ? "bg-amber-500/10 text-amber-200"
                              : "text-gray-300 hover:bg-white/5 hover:text-white"
                          )}
                          onClick={() => setOpen(false)}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-8 border-t border-white/10 pt-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-gray-500">
                    Contact
                  </p>
                  <div className="mt-4 space-y-2">
                    <a
                      href={`mailto:${CONTACT_INFO.email}`}
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-gray-200 hover:bg-white/10 hover:text-white"
                      onClick={() => setOpen(false)}
                    >
                      <Mail className="h-4 w-4 text-amber-300" />
                      {CONTACT_INFO.email}
                    </a>
                    <a
                      href={`tel:${cleanTel(CONTACT_INFO.phone)}`}
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-gray-200 hover:bg-white/10 hover:text-white"
                      onClick={() => setOpen(false)}
                    >
                      <Phone className="h-4 w-4 text-amber-300" />
                      {CONTACT_INFO.phone}
                    </a>
                  </div>

                  <div className="mt-5 grid gap-3">
                    <Link
                      href="/inner-circle"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-400/25 bg-white/5 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-amber-200 hover:border-amber-400/45 hover:bg-white/10"
                      onClick={() => setOpen(false)}
                    >
                      <Lock className="h-4 w-4 text-amber-300" />
                      Inner Circle
                    </Link>
                    <Link
                      href="/consulting#book"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 py-4 text-sm font-bold text-black"
                      onClick={() => setOpen(false)}
                    >
                      Book a Strategy Session <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 text-center">
                  Less talk. More deployment.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}