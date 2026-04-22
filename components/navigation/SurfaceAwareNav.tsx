// components/navigation/SurfaceAwareNav.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Menu, X, Lock } from "lucide-react";

import type { SurfaceContract, SurfaceId } from "@/lib/design-system/surfaces";
import { getAllSurfaces } from "@/lib/design-system/surfaces";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export interface SurfaceAwareNavProps {
  currentSurface?: SurfaceContract;
  showSearch?: boolean;
}

type NavItem = {
  id: string;
  href: string;
  label: string;
  isRestricted?: boolean;
};

const PRIMARY_ORDER = [
  "canon",
  "editorial",
  "vault-briefs",
  "shorts",
  "vault",
  "resources",
  "inner-circle",
] as const satisfies readonly SurfaceId[];

function buildNavItems(): NavItem[] {
  const surfaces = getAllSurfaces();

  const byId = new Map(surfaces.map((surface) => [surface.id, surface]));
  const ordered = PRIMARY_ORDER.map((id) => byId.get(id)).filter(
    (surface): surface is SurfaceContract => Boolean(surface),
  );

  return ordered.map((surface) => ({
    id: surface.id,
    href: surface.pathPrefix,
    label:
      "label" in surface && typeof surface.label === "string"
        ? surface.label
        : "name" in surface && typeof (surface as { name?: string }).name === "string"
          ? (surface as { name: string }).name
          : surface.id,
    isRestricted: surface.id === "inner-circle" || surface.id === "vault",
  }));
}

function getSurfaceContextLinks(surface?: SurfaceContract): Array<{ href: string; label: string }> {
  if (!surface) return [];

  switch (surface.id) {
    case "canon":
      return [
        { href: "/canon", label: "Overview" },
        { href: "/canon/archive", label: "Archive" },
      ];
    case "vault":
      return [
        { href: "/vault", label: "Overview" },
        { href: "/vault/briefs", label: "Briefs" },
        { href: "/vault/archive", label: "Archive" },
      ];
    case "vault-briefs":
      return [
        { href: "/vault/briefs", label: "Overview" },
        { href: "/vault/archive", label: "Archive" },
      ];
    case "shorts":
      return [
        { href: "/shorts", label: "Overview" },
        { href: "/shorts/archive", label: "Archive" },
      ];
    case "books":
      return [
        { href: "/books", label: "Overview" },
        { href: "/books/archive", label: "Archive" },
      ];
    case "editorial":
    case "essays":
      return [
        { href: "/blog", label: "Overview" },
        { href: "/blog/archive", label: "Archive" },
      ];
    case "inner-circle":
      return [
        { href: "/inner-circle", label: "Overview" },
        { href: "/inner-circle/library", label: "Library" },
      ];
    default:
      return [{ href: surface.pathPrefix, label: "Overview" }];
  }
}

export const SurfaceAwareNav: React.FC<SurfaceAwareNavProps> = ({
  currentSurface,
}) => {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = React.useMemo(() => buildNavItems(), []);
  const contextLinks = React.useMemo(
    () => getSurfaceContextLinks(currentSurface),
    [currentSurface],
  );

  const currentLabel =
    currentSurface && "label" in currentSurface && typeof currentSurface.label === "string"
      ? currentSurface.label
      : currentSurface && "name" in currentSurface && typeof (currentSurface as { name?: string }).name === "string"
        ? (currentSurface as { name: string }).name
        : currentSurface?.id ?? null;

  return (
    <nav
      className="sticky top-0 z-50 border-b backdrop-blur-md"
      style={{
        backgroundColor: "rgba(3, 3, 5, 0.92)",
        borderColor: "var(--ds-border)",
      }}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="flex h-16 items-center justify-between gap-6">
          <Link href="/" className="shrink-0">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center border"
                style={{
                  borderColor: "var(--ds-border)",
                  backgroundColor: "rgba(255,255,255,0.02)",
                }}
              >
                <div
                  className="h-3.5 w-3.5"
                  style={{ backgroundColor: "var(--ds-accent)" }}
                />
              </div>

              <div className="min-w-0">
                <div
                  className="truncate font-serif text-[1.08rem] italic leading-none"
                  style={{ color: "var(--ds-text)" }}
                >
                  Abraham of London
                </div>
                <div
                  className="mt-1 hidden font-mono text-[7px] uppercase tracking-[0.34em] sm:block"
                  style={{ color: "var(--ds-text-subtle)" }}
                >
                  Strategy · Canon · Library
                </div>
              </div>
            </div>
          </Link>

          <div className="hidden min-w-0 flex-1 items-center justify-center md:flex">
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const active =
                  router.pathname === item.href ||
                  router.pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center gap-2 border px-3 py-2 font-mono text-[8px] uppercase tracking-[0.26em] transition-colors duration-200",
                      active && "pointer-events-none",
                    )}
                    style={{
                      color: active ? "var(--ds-text)" : "var(--ds-text-muted)",
                      borderColor: active ? "var(--ds-border-strong)" : "transparent",
                      backgroundColor: active ? "rgba(255,255,255,0.03)" : "transparent",
                    }}
                  >
                    {item.isRestricted ? <Lock className="h-3 w-3" /> : null}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/consulting/strategy-room"
              className="hidden border px-4 py-2 font-mono text-[8px] uppercase tracking-[0.28em] transition-colors duration-200 lg:inline-flex"
              style={{
                color: "var(--ds-accent)",
                borderColor: "rgba(201,169,110,0.32)",
                backgroundColor: "rgba(201,169,110,0.06)",
              }}
            >
              Strategy Room
            </Link>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              className="inline-flex h-11 w-11 items-center justify-center border md:hidden"
              style={{
                color: "var(--ds-text)",
                borderColor: "var(--ds-border)",
                backgroundColor: "rgba(255,255,255,0.02)",
              }}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {currentSurface ? (
          <div
            className="hidden h-11 items-center gap-4 border-t md:flex"
            style={{ borderColor: "var(--ds-border)" }}
          >
            <span
              className="font-mono text-[7px] uppercase tracking-[0.34em]"
              style={{ color: "var(--ds-text-subtle)" }}
            >
              {currentLabel}
            </span>

            <div
              className="h-4 w-px"
              style={{ backgroundColor: "var(--ds-border)" }}
            />

            <div className="flex items-center gap-4">
              {contextLinks.map((link) => {
                const active =
                  router.pathname === link.href ||
                  router.pathname.startsWith(`${link.href}/`);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="font-mono text-[8px] uppercase tracking-[0.22em] transition-colors duration-200"
                    style={{
                      color: active ? "var(--ds-text)" : "var(--ds-text-muted)",
                    }}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      {isMobileMenuOpen ? (
        <div
          className="border-t md:hidden"
          style={{
            borderColor: "var(--ds-border)",
            backgroundColor: "rgba(3, 3, 5, 0.98)",
          }}
        >
          <div className="mx-auto max-w-7xl px-6 py-4 lg:px-12">
            <div className="space-y-2">
              {navItems.map((item) => {
                const active =
                  router.pathname === item.href ||
                  router.pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between border px-4 py-3 transition-colors duration-200"
                    style={{
                      color: active ? "var(--ds-text)" : "var(--ds-text-muted)",
                      borderColor: active ? "var(--ds-border-strong)" : "var(--ds-border)",
                      backgroundColor: active ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.015)",
                    }}
                  >
                    <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em]">
                      {item.isRestricted ? <Lock className="h-3.5 w-3.5" /> : null}
                      {item.label}
                    </span>
                    <span style={{ color: "var(--ds-text-subtle)" }}>↗</span>
                  </Link>
                );
              })}
            </div>

            {currentSurface ? (
              <div
                className="mt-5 border-t pt-4"
                style={{ borderColor: "var(--ds-border)" }}
              >
                <div
                  className="mb-3 font-mono text-[7px] uppercase tracking-[0.34em]"
                  style={{ color: "var(--ds-text-subtle)" }}
                >
                  {currentLabel}
                </div>

                <div className="space-y-2">
                  {contextLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block font-mono text-[9px] uppercase tracking-[0.22em] transition-colors duration-200"
                      style={{ color: "var(--ds-text-muted)" }}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </nav>
  );
};
