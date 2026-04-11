/* components/EnhancedFooter.tsx
   INSTITUTIONAL FOOTER
   Design: Institutional Monumentalism — matches homepage and header
   Typography: Cormorant Garamond wordmark + JetBrains Mono labels
   Gold: #C9A96E softGold (brand) · #F59E0B amber (action CTAs only)
*/
"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Library,
  Building2,
  Bookmark,
  Layers,
  Shield,
  ShieldCheck,
  Crown,
  Archive,
  ScrollText,
  ScanSearch,
  Briefcase,
  FileText,
} from "lucide-react";

import PolicyFooter from "@/components/PolicyFooter";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type FooterLink = { label: string; href: string };

type GatewayCard = {
  href: string;
  eyebrow: string;
  title: string;
  body?: string;
  icon: React.ElementType;
  tag: string;
  gold?: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// ─────────────────────────────────────────────────────────────────────────────
// GATEWAY CARD
// The footer CTA surface — sharp panels, institutional language
// ─────────────────────────────────────────────────────────────────────────────

function GatewayCard({ href, eyebrow, title, body, icon: Icon, tag, gold = false }: GatewayCard) {
  return (
    <Link
      href={href}
      className="group relative flex min-h-[188px] flex-col justify-between overflow-hidden border p-6 transition-all duration-400"
      style={{
        borderColor: gold ? `${GOLD}22` : "rgba(255,255,255,0.06)",
        backgroundColor: gold ? `${GOLD}08` : "rgba(0,0,0,0.30)",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.borderColor = gold ? `${GOLD}40` : "rgba(255,255,255,0.11)";
        el.style.backgroundColor = gold ? `${GOLD}12` : "rgba(255,255,255,0.025)";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.borderColor = gold ? `${GOLD}22` : "rgba(255,255,255,0.06)";
        el.style.backgroundColor = gold ? `${GOLD}08` : "rgba(0,0,0,0.30)";
      }}
    >
      {/* Top shimmer */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px transition-opacity duration-400"
        style={{
          background: gold
            ? `linear-gradient(to right, transparent, ${GOLD}35, transparent)`
            : "linear-gradient(to right, transparent, rgba(255,255,255,0.07), transparent)",
        }}
      />

      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Icon
            className="h-4 w-4 transition-colors duration-300"
            style={{ color: gold ? `${GOLD}CC` : "rgba(255,255,255,0.25)" }}
          />
          <span
            className="font-['JetBrains_Mono',ui-monospace,monospace] text-[7.5px] uppercase tracking-[0.38em]"
            style={{ color: gold ? `${GOLD}AA` : "rgba(255,255,255,0.28)" }}
          >
            {eyebrow}
          </span>
        </div>
        <span className="font-['JetBrains_Mono',ui-monospace,monospace] text-[6.5px] uppercase tracking-[0.30em] text-white/12">
          {tag}
        </span>
      </div>

      {/* Body */}
      <div className="mt-auto space-y-2">
        <div
          className="font-['Cormorant_Garamond',Georgia,serif] text-xl font-light italic leading-snug text-white/80 transition-colors duration-300 group-hover:text-white"
        >
          {title}
        </div>
        {body && (
          <p className="text-[11px] font-light leading-relaxed text-white/25 transition-colors duration-300 group-hover:text-white/40">
            {body}
          </p>
        )}
      </div>

      {/* Enter CTA */}
      <div className="mt-5 flex items-center gap-2">
        <span
          className="font-['JetBrains_Mono',ui-monospace,monospace] text-[7.5px] uppercase tracking-[0.34em] text-white/16 transition-colors duration-300 group-hover:text-white/36"
        >
          Enter
        </span>
        <ArrowRight
          className="h-3 w-3 text-white/12 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-white/32"
        />
      </div>

      {/* Bottom slide rule */}
      <div
        className="absolute inset-x-0 bottom-0 h-px w-0 transition-all duration-600 group-hover:w-full"
        style={{ background: gold ? `${GOLD}40` : "rgba(255,255,255,0.08)" }}
      />
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DIRECTORY COLUMN
// ─────────────────────────────────────────────────────────────────────────────

function DirectoryColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div className="space-y-5">
      <div className="border-b border-white/[0.04] pb-2.5">
        <span className="font-['JetBrains_Mono',ui-monospace,monospace] text-[7.5px] uppercase tracking-[0.38em] text-white/18">
          {title}
        </span>
      </div>

      <ul className="space-y-3">
        {links.map((link) => (
          <li key={`${title}-${link.href}`}>
            <Link
              href={link.href}
              className="group flex items-center gap-2 font-['JetBrains_Mono',ui-monospace,monospace] text-[9px] uppercase tracking-[0.22em] text-white/28 transition-colors hover:text-white/62"
            >
              <div
                className="h-px w-0 bg-[#C9A96E]/50 transition-all duration-300 group-hover:w-3"
                style={{ backgroundColor: `${GOLD}80` }}
              />
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────────────────────

export default function EnhancedFooter(): React.ReactElement {
  const year = new Date().getFullYear();

  // ── Gateway cards — top two rows ─────────────────────────────────────────
  const primaryGateways: GatewayCard[] = [
    { href: "/canon",    eyebrow: "Doctrine",   title: "The Canon",   icon: BookOpen,   tag: "DOC·V1" },
    { href: "/books",    eyebrow: "Works",      title: "Volumes",     icon: Bookmark,   tag: "PUB·V2" },
    { href: "/library",  eyebrow: "Archive",    title: "Library",     icon: Library,    tag: "LIB·V3" },
    { href: "/ventures", eyebrow: "Execution",  title: "Ventures",    icon: Building2,  tag: "OPS·V4" },
  ];

  const secondaryGateways: GatewayCard[] = [
    {
      href:    "/consulting/strategy-room",
      eyebrow: "Qualified access",
      title:   "Strategy Room",
      body:    "Controlled entry for qualified operators. Score-based routing. Institutional gatekeeping.",
      icon:    Crown,
      tag:     "STRAT·V1",
      gold:    true,
    },
    {
      href:    "/diagnostics/executive-reporting",
      eyebrow: "Flagship product",
      title:   "Executive Reporting",
      body:    "Board-grade interpretation. Diagnostic signal converted into decision-grade output.",
      icon:    FileText,
      tag:     "EXEC·V2",
    },
    {
      href:    "/diagnostics",
      eyebrow: "Gateway layer",
      title:   "Diagnostics",
      body:    "Establish signal, pressure, and fit before forcing a solution.",
      icon:    ScanSearch,
      tag:     "DIAG·V3",
    },
    {
      href:    "/vault",
      eyebrow: "Intelligence",
      title:   "The Vault",
      body:    "Controlled assets, premium resources, and execution-grade material.",
      icon:    Archive,
      tag:     "SEC·V4",
    },
  ];

  // ── Directory links ───────────────────────────────────────────────────────
  const directory: Record<string, FooterLink[]> = {
    Registry: [
      { label: "Canon",      href: "/canon"      },
      { label: "Books",      href: "/books"      },
      { label: "Library",    href: "/library"    },
      { label: "Editorials", href: "/editorials" },
      { label: "Shorts",     href: "/shorts"     },
      { label: "Playbooks",  href: "/playbooks"  },
    ],
    Products: [
      { label: "Artifacts",          href: "/artifacts"                           },
      { label: "Market Intelligence", href: "/intelligence/global-market-intelligence-q1-2026" },
      { label: "Executive Reporting", href: "/diagnostics/executive-reporting"    },
      { label: "Vault Briefs",        href: "/vault/briefs"                       },
    ],
    Engagements: [
      { label: "Consulting",    href: "/consulting"                },
      { label: "Strategy Room", href: "/consulting/strategy-room" },
      { label: "Diagnostics",   href: "/diagnostics"              },
      { label: "Contact",       href: "/contact"                  },
    ],
    Governance: [
      { label: "About",    href: "/about"    },
      { label: "Security", href: "/security" },
      { label: "Privacy",  href: "/privacy"  },
      { label: "Terms",    href: "/terms"    },
    ],
  };

  const policyLinks = [
    { label: "Privacy",  href: "/privacy"  },
    { label: "Terms",    href: "/terms"    },
    { label: "Security", href: "/security" },
    { label: "Cookies",  href: "/cookies"  },
  ] as const;

  return (
    <footer
      className="relative overflow-hidden border-t border-white/[0.055]"
      style={{ backgroundColor: "rgb(3 3 5)" }}
    >
      {/* Grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.028]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "160px 160px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 pb-10 pt-20 lg:px-12">

        {/* ── Row 1: Primary gateway cards ─────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-px bg-white/[0.04] md:grid-cols-4">
          {primaryGateways.map((card) => (
            <GatewayCard key={card.href} {...card} />
          ))}
        </div>

        {/* ── Row 2: Secondary gateway cards ───────────────────────────────── */}
        <div className="mt-px grid grid-cols-2 gap-px bg-white/[0.04] md:grid-cols-4">
          {secondaryGateways.map((card) => (
            <GatewayCard key={card.href} {...card} />
          ))}
        </div>

        {/* ── Main footer body ─────────────────────────────────────────────── */}
        <div className="mt-20 grid gap-16 border-t border-white/[0.04] pt-16 lg:grid-cols-12">

          {/* Left — brand + CTAs */}
          <div className="space-y-9 lg:col-span-5">
            {/* Wordmark */}
            <div>
              <div
                className="font-['Cormorant_Garamond',Georgia,serif] text-4xl font-light italic leading-none tracking-[-0.02em] text-white/85"
              >
                Abraham of London
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-px w-8" style={{ backgroundColor: `${GOLD}50` }} />
                <span
                  className="font-['JetBrains_Mono',ui-monospace,monospace] text-[7.5px] uppercase tracking-[0.50em]"
                  style={{ color: `${GOLD}88` }}
                >
                  Governance · Architecture · Execution
                </span>
              </div>
            </div>

            {/* Descriptor */}
            <p
              className="max-w-sm border-l border-white/[0.06] pl-5 font-['Cormorant_Garamond',Georgia,serif] text-[13px] font-light italic leading-relaxed text-white/28"
            >
              A platform for disciplined thinking: doctrine, systems, and strategic
              execution arranged for leaders, builders, and institutions that
              intend to endure.
            </p>

            {/* CTAs */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="group inline-flex items-center justify-center gap-3 border border-white/[0.10] bg-white/[0.03] px-6 py-3.5 font-['JetBrains_Mono',ui-monospace,monospace] text-[9px] uppercase tracking-[0.30em] text-white/55 transition-all duration-300 hover:border-white/[0.18] hover:bg-white/[0.06] hover:text-white/85"
              >
                Secure inquiry
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/consulting/strategy-room"
                className="group inline-flex items-center justify-center gap-3 border px-6 py-3.5 font-['JetBrains_Mono',ui-monospace,monospace] text-[9px] uppercase tracking-[0.30em] transition-all duration-300"
                style={{
                  borderColor: `${GOLD}30`,
                  color: `${GOLD}BB`,
                  backgroundColor: `${GOLD}08`,
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.borderColor = `${GOLD}50`;
                  el.style.backgroundColor = `${GOLD}14`;
                  el.style.color = GOLD;
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.borderColor = `${GOLD}30`;
                  el.style.backgroundColor = `${GOLD}08`;
                  el.style.color = `${GOLD}BB`;
                }}
              >
                <Crown className="h-3.5 w-3.5" />
                Enter Strategy Room
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* Right — directory */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4 lg:col-span-7">
            {Object.entries(directory).map(([title, links]) => (
              <DirectoryColumn key={title} title={title} links={links} />
            ))}
          </div>
        </div>

        {/* ── Bottom bar ───────────────────────────────────────────────────── */}
        <div className="mt-20 border-t border-white/[0.04] pt-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

            {/* Copyright */}
            <div className="flex items-center gap-4">
              <ShieldCheck className="h-3.5 w-3.5 text-white/16" />
              <span className="font-['JetBrains_Mono',ui-monospace,monospace] text-[7.5px] uppercase tracking-[0.32em] text-white/22">
                © {year} Abraham of London · All rights reserved
              </span>
              <div className="hidden h-3 w-px bg-white/[0.07] md:block" />
              <span className="hidden font-['JetBrains_Mono',ui-monospace,monospace] text-[7px] uppercase tracking-[0.26em] text-white/14 md:block">
                Institutional registry
              </span>
            </div>

            {/* Policy links */}
            <div className="flex items-center gap-6">
              {policyLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="font-['JetBrains_Mono',ui-monospace,monospace] text-[7.5px] uppercase tracking-[0.26em] text-white/20 transition-colors hover:text-white/48"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Policy footer component */}
        <div className="mt-10">
          <PolicyFooter isDark />
        </div>

      </div>
    </footer>
  );
}