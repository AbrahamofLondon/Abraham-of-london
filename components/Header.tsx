/* components/Header.tsx
   UNIFIED SOVEREIGN HEADER — Pages Router
   Design: Institutional Monumentalism — matches homepage design language
   Typography: JetBrains Mono labels, Cormorant Garamond wordmark
   Gold: #C9A96E softGold (brand) · #F59E0B amber (action only)
   
   Session 5 change: Library → Shorts in desktop nav (slot 4).
   Shorts is the live signal feed — the content most likely to bring
   visitors back. Library is a reference shelf; it remains in the
   mobile menu and is reachable via content pages.
   
   Shorts subtle highlight: a 1px softGold underline at 0.28 opacity.
   Below the threshold of conscious registration on first pass.
   Above the threshold of recognition once the eye settles.
   The mind perceives rhythm breaks before the eye names them.
*/

"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Menu,
  X,
  Crown,
  ChevronRight,
  Fingerprint,
  FileText,
  Activity,
  ScanSearch,
  Compass,
  Archive,
  BookOpen,
  Briefcase,
  ScrollText,
  Layers,
  Zap,
  Lock,
  Key,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES + CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

type HeaderProps = {
  transparent?: boolean;
  minimal?: boolean;
};

type NavItem = {
  href: string;
  label: string;
  sub: string;
  icon: React.ElementType;
  signal?: true; // marks the live signal item for subtle treatment
};

// Desktop nav — product-first. Primary = conversion surfaces, Secondary = content/authority.
const PRIMARY_NAV: readonly NavItem[] = [
  { href: "/diagnostics",                     label: "Diagnostics",       sub: "Free diagnostic system",      icon: ScanSearch },
  { href: "/diagnostics/executive-reporting",  label: "Executive Report",  sub: "Paid interpretation · £95",   icon: ScrollText },
  { href: "/strategy-room",                    label: "Strategy Room",     sub: "Paid intervention · £395",    icon: Crown      },
] as const;

const PRIMARY_NAV_HINTS: Record<string, string> = {
  Diagnostics: "find the problem",
  "Executive Report": "understand the consequence",
  "Strategy Room": "decide what to do",
};

const SECONDARY_NAV: readonly NavItem[] = [
  { href: "/artifacts",  label: "Intelligence", sub: "Essays, Shorts & Dispatches", icon: Zap,     signal: true },
  { href: "/playbooks",  label: "Playbooks",    sub: "Execution Frameworks",        icon: Layers   },
  { href: "/canon",      label: "Canon",         sub: "Doctrine & Method",           icon: Compass  },
] as const;

// Combined for backward compat (mobile menu iteration)
const DESKTOP_NAV: readonly NavItem[] = [...PRIMARY_NAV, ...SECONDARY_NAV] as const;

// Mobile menu — product-first, then content/reference.
const MOBILE_NAV: readonly NavItem[] = [
  // Product surfaces
  { href: "/diagnostics",                     label: "Diagnostics",      sub: "Free diagnostic system",      icon: ScanSearch },
  { href: "/diagnostics/executive-reporting",  label: "Executive Report", sub: "Paid interpretation · £95",   icon: ScrollText },
  { href: "/strategy-room",                    label: "Strategy Room",    sub: "Paid intervention · £395",    icon: Crown      },
  // Content & authority
  { href: "/artifacts",    label: "Intelligence",  sub: "Essays, Shorts & Dispatches",  icon: Zap,       signal: true },
  { href: "/playbooks",    label: "Playbooks",     sub: "Execution Frameworks",         icon: Layers     },
  { href: "/canon",        label: "Canon",          sub: "Doctrine & Method",            icon: Compass    },
  // Reference
  { href: "/library",      label: "Library",        sub: "Knowledge Shelf",              icon: BookOpen   },
  { href: "/vault/briefs", label: "Briefs",         sub: "Operational Intelligence",     icon: FileText   },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function normalizePath(path: string): string {
  const base = path.split(/[?#]/)[0] ?? "";
  const clean = base.replace(/\/+$/, "");
  return clean || "/";
}

function isActive(currentPath: string, href: string): boolean {
  const current = normalizePath(currentPath);
  const target  = normalizePath(href);
  if (target === "/") return current === "/";
  return current === target || current.startsWith(`${target}/`);
}

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const GOLD = "#C9A96E";

// ─────────────────────────────────────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────────────────────────────────────

export default function Header({
  transparent = false,
  minimal = false,
}: HeaderProps) {
  // Router-agnostic path tracking. next/router works only in Pages Router;
  // next/navigation works only in App Router. This Header is imported by
  // both contexts, so we read window.location.pathname directly and update
  // on popstate events. This avoids hook-context coupling and works in
  // every consumer (AppShell, Layout, SiteLayout, PDFDashboard, etc.).
  // useSession reads the nearest SessionProvider context. Pages Router
  // always wraps via _app.tsx. App Router wraps via AppShell's Providers.
  const sessionResult = useSession();
  const session = sessionResult?.data ?? null;

  // Mounted guard avoids hydration mismatch and ensures the SSR / prerender
  // output always renders the unauthenticated state. After hydration we flip
  // to the authenticated state if a session exists.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  const isAuthenticated = mounted && Boolean(session);

  const [currentPath, setCurrentPath] = React.useState<string>("/");

  React.useEffect(() => {
    const update = () => {
      setCurrentPath(normalizePath(window.location.pathname || "/"));
    };
    update();
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);

  const [isOpen,   setIsOpen]   = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  React.useEffect(() => { setIsOpen(false); }, [currentPath]);

  React.useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = original; };
  }, [isOpen]);

  // Gate scrolled behind mounted — server always renders un-scrolled state.
  const elevated = (mounted && scrolled) || isOpen || !transparent;

  return (
    <>
      {/* ── Fixed header bar ─────────────────────────────────────────────── */}
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[100] w-full transition-all duration-500",
          elevated
            ? "border-b border-white/[0.12] bg-[#060609]/95 py-3.5"
            : "border-b border-white/[0.10] bg-[#060609]/90 py-4",
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-12">

          {/* ── Wordmark ───────────────────────────────────────────────────── */}
          <Link
            href="/"
            aria-label="Abraham of London — home"
            className="group inline-flex shrink-0 items-center gap-4"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/[0.14] bg-[#0E0E12] transition-all duration-300 group-hover:border-white/[0.22] group-hover:bg-[#121216]">
              <div className="h-3.5 w-3.5" style={{ backgroundColor: `${GOLD}CC` }} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-['Cormorant_Garamond',Georgia,serif] text-[1.05rem] font-light italic leading-none tracking-[-0.01em] text-white/90 transition-colors group-hover:text-white">
                Abraham of London
              </span>
              <span className="hidden font-['JetBrains_Mono',ui-monospace,monospace] text-[7px] uppercase tracking-[0.32em] text-white/38 md:block">
                Diagnostics · Intelligence · Advisory
              </span>
            </div>
          </Link>

          {/* ── Right cluster ─────────────────────────────────────────────── */}
          <div className="flex items-center gap-5">

            {/* Desktop nav — two-tier: primary product surfaces | secondary content */}
            {!minimal && (
              <nav className="hidden items-center gap-3 md:flex" aria-label="Primary navigation">
                {/* PRIMARY: product surfaces */}
                {PRIMARY_NAV.map((item) => {
                  const active = mounted && isActive(currentPath, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={`${item.label} — ${PRIMARY_NAV_HINTS[item.label] || item.sub}`}
                      aria-label={`${item.label} — ${PRIMARY_NAV_HINTS[item.label] || item.sub}`}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative font-['JetBrains_Mono',ui-monospace,monospace] text-[8.5px] uppercase tracking-[0.26em] transition-colors duration-300",
                        active ? "text-[#C9A96E]" : "text-white/78 hover:text-white/92",
                      )}
                      style={active ? { color: GOLD } : {}}
                    >
                      {item.label}
                    </Link>
                  );
                })}

                {/* Separator */}
                <span className="mx-1 h-3 w-px bg-white/10" aria-hidden="true" />

                {/* SECONDARY: content & authority */}
                {SECONDARY_NAV.map((item) => {
                  const active = mounted && isActive(currentPath, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative font-['JetBrains_Mono',ui-monospace,monospace] text-[8px] uppercase tracking-[0.22em] transition-colors duration-300",
                        active ? "text-[#C9A96E]" : "text-white/50 hover:text-white/72",
                      )}
                      style={active ? { color: GOLD } : {}}
                    >
                      {item.label}
                      {item.signal && !active && (
                        <span
                          aria-hidden="true"
                          className="absolute inset-x-0 -bottom-[5px] block h-px"
                          style={{ backgroundColor: `${GOLD}47` }}
                        />
                      )}
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Member slot — auth-aware.
                Authenticated: Inner Circle → dashboard.
                Unauthenticated: Inner Circle → /inner-circle (registration/unlock). */}
            {!minimal && (
              <Link
                href={isAuthenticated ? "/inner-circle/dashboard" : "/inner-circle"}
                className="hidden items-center gap-2 border px-3 py-2 font-['JetBrains_Mono',ui-monospace,monospace] text-[7.5px] uppercase tracking-[0.28em] transition-all duration-300 md:inline-flex"
                style={{
                  borderColor: `${GOLD}38`,
                  color: `${GOLD}D0`,
                  backgroundColor: "#0E0E12",
                }}
                aria-label={isAuthenticated ? "Inner Circle dashboard" : "Inner Circle — request access"}
              >
                {isAuthenticated ? (
                  <>
                    <Crown className="h-3 w-3" style={{ color: GOLD }} />
                    Inner Circle
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3" style={{ color: `${GOLD}90` }} />
                    Inner Circle
                  </>
                )}
              </Link>
            )}

            {/* Hamburger */}
            <button
              type="button"
              onClick={() => setIsOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center border border-white/[0.14] bg-[#0E0E12] text-white/82 transition-all duration-300 hover:border-white/[0.22] hover:bg-[#121216] hover:text-white"
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
              aria-controls="site-mobile-menu"
            >
              {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Full-screen mobile / overflow menu ───────────────────────────── */}
      <div
        id="site-mobile-menu"
        className={cn(
          "fixed inset-0 z-[110] transition-all duration-500 ease-out",
          "overflow-y-auto",
          isOpen
            ? "pointer-events-auto visible opacity-100"
            : "pointer-events-none invisible opacity-0",
        )}
        style={{ backgroundColor: "rgb(3 3 5 / 0.99)" }}
        aria-hidden={!isOpen}
      >
        {/* Grain */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "160px 160px",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-8 lg:px-12">

          {/* Menu header row */}
          <div className="flex items-center justify-between py-4">
            <span className="font-['JetBrains_Mono',ui-monospace,monospace] text-[7.5px] uppercase tracking-[0.46em] text-white/20">
              Directory
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-10 w-10 items-center justify-center border border-white/[0.07] text-white/50 transition-colors hover:border-white/[0.14] hover:bg-white/[0.04] hover:text-white"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Hairline */}
          <div className="mt-4 mb-10 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

          {/* Nav items */}
          <nav className="space-y-0 divide-y divide-white/[0.04]" aria-label="Mobile navigation">
            {MOBILE_NAV.map((item, idx) => {
              const active = mounted && isActive(currentPath, item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className="group flex items-center justify-between py-5 transition-all duration-200"
                >
                  <div className="flex items-center gap-5">
                    <span className="font-['JetBrains_Mono',ui-monospace,monospace] text-[7px] uppercase tracking-[0.36em] text-white/20 transition-colors group-hover:text-white/28">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <div
                        className={cn(
                          "font-['Cormorant_Garamond',Georgia,serif] text-[1.9rem] font-light leading-none tracking-[-0.02em] transition-colors duration-200 md:text-[2.4rem]",
                          // Shorts in mobile menu: very slightly elevated opacity vs other items
                          active
                            ? ""
                            : item.signal
                              ? "text-white/88 group-hover:text-white"
                              : "text-white/80 group-hover:text-white",
                        )}
                        style={active ? { color: GOLD } : {}}
                      >
                        {item.label}
                      </div>
                      <div className="mt-1 font-['JetBrains_Mono',ui-monospace,monospace] text-[7.5px] uppercase tracking-[0.28em] text-white/22">
                        {item.sub}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "h-4 w-4 transition-colors",
                        active ? "" : item.signal ? "text-white/22 group-hover:text-white/45" : "text-white/20 group-hover:text-white/35",
                      )}
                      style={active ? { color: `${GOLD}CC` } : item.signal ? { color: `${GOLD}60` } : {}}
                    />
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 transition-all duration-200 group-hover:translate-x-0.5",
                        active ? "" : "text-white/10 group-hover:text-white/30",
                      )}
                      style={active ? { color: `${GOLD}88` } : {}}
                    />
                  </div>
                </Link>
              );
            })}

            {/* Separator */}
            <div className="py-4">
              <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            </div>

            {/* Special entries — Strategy Room is public; Member entries are auth-gated. */}
            {[
              {
                href: "/strategy-room",
                label: "Strategy Room",
                sub: "Qualified Access Only",
                tag: "Selective",
                icon: Crown,
              },
              ...(isAuthenticated
                ? [
                    {
                      href: "/inner-circle/dashboard",
                      label: "Inner Circle",
                      sub: "Member Workspace",
                      tag: "Member",
                      icon: Crown,
                    },
                    {
                      href: "/inner-circle/account",
                      label: "Account",
                      sub: "Identity & Access",
                      tag: "Member",
                      icon: Fingerprint,
                    },
                    {
                      href: "/access/redeem",
                      label: "Redeem Key",
                      sub: "Activate Entitlement",
                      tag: "Member",
                      icon: Key,
                    },
                  ]
                : [
                    {
                      href: "/inner-circle",
                      label: "Inner Circle",
                      sub: "Request Access",
                      tag: "Member",
                      icon: Lock,
                    },
                  ]),
            ].map((item) => {
              const Icon = item.icon;
              const active = mounted && isActive(currentPath, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className="group flex items-center justify-between py-5"
                >
                  <div className="flex items-center gap-5">
                    <span
                      className="font-['JetBrains_Mono',ui-monospace,monospace] text-[7px] uppercase tracking-[0.36em]"
                      style={{ color: `${GOLD}60` }}
                    >
                      {item.tag}
                    </span>
                    <div>
                      <div className="font-['Cormorant_Garamond',Georgia,serif] text-[1.9rem] font-light leading-none text-white/70 transition-colors group-hover:text-white md:text-[2.4rem]">
                        {item.label}
                      </div>
                      <div className="mt-1 font-['JetBrains_Mono',ui-monospace,monospace] text-[7.5px] uppercase tracking-[0.28em] text-white/20">
                        {item.sub}
                      </div>
                    </div>
                  </div>
                  <Icon
                    className="h-4 w-4 text-white/12 transition-colors group-hover:text-white/32"
                    style={active ? { color: `${GOLD}CC` } : {}}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Menu footer */}
          <div className="mt-12 flex items-center justify-between border-t border-white/[0.04] pt-8">
            <div className="font-['JetBrains_Mono',ui-monospace,monospace] text-[7px] uppercase tracking-[0.40em] text-white/16">
              Abraham of London
            </div>
            <div className="font-['JetBrains_Mono',ui-monospace,monospace] text-[7px] uppercase tracking-[0.32em] text-white/12">
              Strategy · Canon · Library
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
