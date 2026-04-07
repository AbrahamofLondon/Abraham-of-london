/* components/Header.tsx — UNIFIED SOVEREIGN HEADER (corrected) */
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Menu,
  X,
  Command,
  ChevronRight,
  Fingerprint,
  FileText,
  Activity,
} from "lucide-react";

type HeaderProps = {
  transparent?: boolean;
  minimal?: boolean;
};

const NAV_ITEMS = [
  { href: "/canon", label: "Canon", sub: "Doctrine & Method" },
  { href: "/books", label: "Books", sub: "Long-form Works" },
  { href: "/blog", label: "Essays", sub: "Ideas & Commentary" },
  { href: "/library", label: "Library", sub: "Knowledge Shelf" },
  { href: "/shorts", label: "Shorts", sub: "Short-form Signal" },
  { href: "/dashboard", label: "Registry", sub: "Sovereign Dashboard" },
  { href: "/vault/briefs", label: "Briefs", sub: "Operational Intelligence" },
  { href: "/ventures", label: "Ventures", sub: "Execution Arms" },
  { href: "/artifacts", label: "Artifacts", sub: "Premium Editions" },
  { href: "/vault", label: "Vault", sub: "Secure Repository" },
] as const;

function normalizePath(path: string): string {
  if (!path) return "/";
  const base = path.split(/[?#]/)[0] ?? "";
  const clean = base.replace(/\/+$/, "");
  return clean || "/";
}

function isActivePath(currentPath: string, href: string): boolean {
  const current = normalizePath(currentPath);
  const target = normalizePath(href);

  if (target === "/") return current === "/";
  return current === target || current.startsWith(`${target}/`);
}

export default function Header({
  transparent = false,
  minimal = false,
}: HeaderProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  const currentPath = React.useMemo(
    () => normalizePath(router.asPath || router.pathname || "/"),
    [router.asPath, router.pathname],
  );

  React.useEffect(() => {
    const onScroll = () => {
      if (typeof window === "undefined") return;
      setScrolled(window.scrollY > 20);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  React.useEffect(() => {
    setIsOpen(false);
  }, [currentPath]);

  React.useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = isOpen ? "hidden" : original || "";

    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  const shellClass =
    scrolled || isOpen || !transparent
      ? "border-b border-white/8 bg-black/72 py-4 backdrop-blur-xl"
      : "bg-transparent py-5";

  return (
    <>
      <header
        className={`fixed left-0 right-0 top-0 z-[100] w-full transition-all duration-500 ${shellClass}`}
      >
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 lg:px-12">
          <div className="flex min-w-0 items-center">
            <Link
              href="/"
              aria-label="Go to homepage"
              className="group inline-flex shrink-0 items-center gap-4"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-white/12 bg-white/95 shadow-[0_8px_24px_rgba(255,255,255,0.06)]">
                <Command size={21} className="text-black/90" />
              </div>

              <div className="flex min-w-0 flex-col">
                <span className="truncate text-[12px] font-black uppercase tracking-[0.32em] text-white/94">
                  Abraham of London
                </span>
                <span className="hidden text-[9px] font-mono uppercase tracking-[0.24em] text-white/30 md:block">
                  Strategy • Canon • Library
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            {!minimal ? (
              <nav
                className="hidden items-center gap-6 md:flex"
                aria-label="Primary"
              >
                {NAV_ITEMS.slice(0, 8).map((item, idx) => {
                  const active = isActivePath(currentPath, item.href);

                  return (
                    <Link
                      key={`desktop-nav-${idx}-${item.href}`}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={[
                        "text-[10px] font-mono uppercase tracking-[0.22em] transition-colors duration-300",
                        active
                          ? "text-amber-300"
                          : "text-white/48 hover:text-white/78",
                      ].join(" ")}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            ) : null}

            <Link
              href="/dashboard"
              className="hidden items-center gap-2 rounded-full border border-amber-500/18 bg-amber-500/9 px-4 py-2 text-[9px] font-mono uppercase tracking-[0.24em] text-amber-300/85 transition-all duration-300 hover:border-amber-400/30 hover:bg-amber-500/14 hover:text-amber-200 md:inline-flex"
            >
              <Fingerprint size={12} />
              Sovereign Registry
            </Link>

            <button
              type="button"
              onClick={() => setIsOpen((v) => !v)}
              className="inline-flex items-center justify-center border border-white/10 bg-white/[0.03] p-3 text-white/88 transition-all duration-300 hover:bg-white hover:text-black"
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
              aria-controls="site-mobile-menu"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      <div
        id="site-mobile-menu"
        className={[
          "fixed inset-0 z-[110] bg-black/98 transition-all duration-500 ease-out",
          isOpen
            ? "pointer-events-auto visible opacity-100"
            : "pointer-events-none invisible opacity-0",
        ].join(" ")}
        aria-hidden={!isOpen}
      >
        <div className="flex h-full flex-col overflow-y-auto p-8 md:p-10">
          <div className="mb-12 flex items-center justify-between md:mb-16">
            <div className="text-[11px] font-mono uppercase tracking-[0.42em] text-white/40">
              Directory
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center border border-white/10 p-4 text-white transition-colors hover:bg-white hover:text-black"
              aria-label="Close menu"
            >
              <X size={28} />
            </button>
          </div>

          <nav className="flex flex-col gap-5 md:gap-6" aria-label="Mobile">
            {NAV_ITEMS.map((item, idx) => {
              const active = isActivePath(currentPath, item.href);

              return (
                <Link
                  key={`mobile-nav-${idx}-${item.href}`}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className="group flex items-end justify-between border-b border-white/5 pb-5 md:pb-6"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold text-amber-500/60">
                      INDEX_{String(idx + 1).padStart(2, "0")}
                    </span>

                    <h2
                      className={[
                        "font-serif text-3xl uppercase italic transition-colors md:text-4xl",
                        active
                          ? "text-amber-400"
                          : "text-white group-hover:text-amber-500",
                      ].join(" ")}
                    >
                      {item.label}
                    </h2>

                    <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">
                      {item.sub}
                    </p>
                  </div>

                  <ChevronRight
                    size={24}
                    className={[
                      "mb-4 transition-all",
                      active
                        ? "text-amber-400"
                        : "text-white/10 group-hover:text-amber-500",
                    ].join(" ")}
                  />
                </Link>
              );
            })}

            <Link
              href="/dashboard/live"
              onClick={() => setIsOpen(false)}
              className="group mt-4 flex items-end justify-between border-b border-white/5 pb-5 md:pb-6"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold text-amber-500/60">
                  INTELLIGENCE
                </span>
                <h2 className="font-serif text-3xl uppercase italic text-white transition-colors group-hover:text-amber-500">
                  OGR Terminal
                </h2>
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">
                  Live Telemetry & Analysis
                </p>
              </div>
              <Activity
                size={24}
                className="mb-4 text-white/10 transition-all group-hover:text-amber-500"
              />
            </Link>

            <Link
              href="/pdf-dashboard"
              onClick={() => setIsOpen(false)}
              className="group flex items-end justify-between border-b border-white/5 pb-5 md:pb-6"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold text-amber-500/60">
                  ANALYTICS
                </span>
                <h2 className="font-serif text-3xl uppercase italic text-white transition-colors group-hover:text-amber-500">
                  PDF Reports
                </h2>
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">
                  Export & Intelligence Briefs
                </p>
              </div>
              <FileText
                size={24}
                className="mb-4 text-white/10 transition-all group-hover:text-amber-500"
              />
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
}