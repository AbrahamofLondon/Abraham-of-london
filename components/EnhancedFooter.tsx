/* components/EnhancedFooter.tsx
   INSTITUTIONAL FOOTER
   Design: Institutional Monumentalism
   Typography: Cormorant Garamond wordmark + JetBrains Mono labels
   Gold: #C9A96E softGold (brand) · #F59E0B amber (action CTAs only)

   Changes from previous version:
   - Events added to Registry directory column and as a secondary gateway card
   - Grain overlay removed (unnecessary noise)
   - Tag labels raised from text-white/12 to readable opacity
   - Bottom slide rule animation removed (performed drama)
   - PolicyFooter duplicate removed from bottom (policy links already in bar)
   - Gateway card min-height made consistent
   - Directory link hover contrast improved
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
  Crown,
  Archive,
  ScrollText,
  ScanSearch,
  FileText,
  Calendar,
  ShieldCheck,
} from "lucide-react";

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

// ─────────────────────────────────────────────────────────────────────────────
// GATEWAY CARD
// ─────────────────────────────────────────────────────────────────────────────

function GatewayCard({ href, eyebrow, title, body, icon: Icon, tag, gold = false }: GatewayCard) {
  return (
    <Link
      href={href}
      className="group relative flex min-h-[180px] flex-col justify-between overflow-hidden border p-6 transition-colors duration-300"
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
      {/* Top thread */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
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
            style={{ color: gold ? `${GOLD}CC` : "rgba(255,255,255,0.28)" }}
          />
          <span
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7.5px",
              letterSpacing: "0.38em",
              textTransform: "uppercase",
              color: gold ? `${GOLD}AA` : "rgba(255,255,255,0.38)",
            }}
          >
            {eyebrow}
          </span>
        </div>
        <span
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "6.5px",
            letterSpacing: "0.30em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.28)",
          }}
        >
          {tag}
        </span>
      </div>

      {/* Body */}
      <div className="mt-auto space-y-2">
        <div
          className="transition-colors duration-300 group-hover:text-white"
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "1.2rem",
            fontWeight: 300,
            fontStyle: "italic",
            lineHeight: 1.25,
            color: "rgba(255,255,255,0.78)",
          }}
        >
          {title}
        </div>
        {body && (
          <p
            className="transition-colors duration-300 group-hover:text-white/42"
            style={{
              fontSize: "11px",
              fontWeight: 300,
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.28)",
            }}
          >
            {body}
          </p>
        )}
      </div>

      {/* Enter CTA */}
      <div className="mt-5 flex items-center gap-2">
        <span
          className="transition-colors duration-300 group-hover:text-white/40"
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "7.5px",
            letterSpacing: "0.34em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.28)",
          }}
        >
          Enter
        </span>
        <ArrowRight
          className="h-3 w-3 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-white/35"
          style={{ color: "rgba(255,255,255,0.28)" }}
        />
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DIRECTORY COLUMN
// ─────────────────────────────────────────────────────────────────────────────

function DirectoryColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div className="space-y-5">
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "0.6rem" }}>
        <span
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "7.5px",
            letterSpacing: "0.38em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.38)",
          }}
        >
          {title}
        </span>
      </div>

      <ul className="space-y-3">
        {links.map((link) => (
          <li key={`${title}-${link.href}`}>
            <Link
              href={link.href}
              className="group flex items-center gap-2 transition-colors"
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "9px",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.38)",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.68)"}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.38)"}
            >
              <div
                className="h-px w-0 transition-all duration-300 group-hover:w-3"
                style={{ backgroundColor: `${GOLD}70` }}
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

  const primaryGateways: GatewayCard[] = [
    { href: "/canon",    eyebrow: "Doctrine",   title: "The Canon",   icon: BookOpen,  tag: "DOC·V1" },
    { href: "/books",    eyebrow: "Works",      title: "Volumes",     icon: Bookmark,  tag: "PUB·V2" },
    { href: "/library",  eyebrow: "Archive",    title: "Library",     icon: Library,   tag: "LIB·V3" },
    { href: "/ventures", eyebrow: "Execution",  title: "Ventures",    icon: Building2, tag: "OPS·V4" },
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
      href:    "/events",
      eyebrow: "Gatherings",
      title:   "Salons & Briefings",
      body:    "Live rooms where doctrine meets operators and ideas are tested in real environments.",
      icon:    Calendar,
      tag:     "EVT·V4",
    },
  ];

  const directory: Record<string, FooterLink[]> = {
    Archive: [
      { label: "Canon",       href: "/canon"      },
      { label: "Editorials",  href: "/editorials" },
      { label: "Library",     href: "/library"    },
      { label: "Dispatches",  href: "/shorts"     },
      { label: "Playbooks",   href: "/playbooks"  },
    ],
    Products: [
      { label: "Intelligence Archives", href: "/artifacts"                            },
      { label: "Market Intelligence",  href: "/intelligence/global-market-intelligence-q1-2026" },
      { label: "Executive Reporting",  href: "/diagnostics/executive-reporting"     },
      { label: "Vault Briefs",         href: "/vault/briefs"                        },
      { label: "Vault",                href: "/vault"                               },
    ],
    Engagements: [
      { label: "Consulting",    href: "/consulting"                },
      { label: "Strategy Room", href: "/consulting/strategy-room" },
      { label: "Diagnostics",   href: "/diagnostics"              },
      { label: "Gatherings",    href: "/events"                   },
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
      <div className="relative mx-auto max-w-7xl px-6 pb-10 pt-20 lg:px-12">

        {/* ── Row 1: Primary gateway cards ─────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-px md:grid-cols-4" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
          {primaryGateways.map((card) => (
            <GatewayCard key={card.href} {...card} />
          ))}
        </div>

        {/* ── Row 2: Secondary gateway cards ───────────────────────────────── */}
        <div className="mt-px grid grid-cols-2 gap-px md:grid-cols-4" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
          {secondaryGateways.map((card) => (
            <GatewayCard key={card.href} {...card} />
          ))}
        </div>

        {/* ── Main footer body ─────────────────────────────────────────────── */}
        <div className="mt-20 grid gap-16 pt-16 lg:grid-cols-12" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>

          {/* Left — brand + CTAs */}
          <div className="space-y-9 lg:col-span-5">
            {/* Wordmark */}
            <div>
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: "2.25rem",
                  fontWeight: 300,
                  fontStyle: "italic",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  color: "rgba(255,255,255,0.85)",
                }}
              >
                Abraham of London
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-px w-8" style={{ backgroundColor: `${GOLD}50` }} />
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7.5px",
                    letterSpacing: "0.50em",
                    textTransform: "uppercase",
                    color: `${GOLD}88`,
                  }}
                >
                  Governance · Architecture · Execution
                </span>
              </div>
            </div>

            {/* Descriptor */}
            <p
              style={{
                maxWidth: "36ch",
                borderLeft: "1px solid rgba(255,255,255,0.07)",
                paddingLeft: "1.25rem",
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "13px",
                fontWeight: 300,
                fontStyle: "italic",
                lineHeight: 1.75,
                color: "rgba(255,255,255,0.34)",
              }}
            >
              A platform for disciplined thinking: doctrine, systems, and strategic
              execution arranged for leaders, builders, and institutions that
              intend to endure.
            </p>

            {/* CTAs */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="group inline-flex items-center justify-center gap-3 transition-all duration-300"
                style={{
                  padding: "14px 24px",
                  border: "1px solid rgba(255,255,255,0.10)",
                  backgroundColor: "rgba(255,255,255,0.03)",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "9px",
                  letterSpacing: "0.30em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.50)",
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.18)"; el.style.color = "rgba(255,255,255,0.80)"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.10)"; el.style.color = "rgba(255,255,255,0.50)"; }}
              >
                Secure inquiry
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/consulting/strategy-room"
                className="group inline-flex items-center justify-center gap-3 transition-all duration-300"
                style={{
                  padding: "14px 24px",
                  border: `1px solid ${GOLD}30`,
                  backgroundColor: `${GOLD}08`,
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "9px",
                  letterSpacing: "0.30em",
                  textTransform: "uppercase",
                  color: `${GOLD}BB`,
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}50`; el.style.backgroundColor = `${GOLD}14`; el.style.color = GOLD; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}30`; el.style.backgroundColor = `${GOLD}08`; el.style.color = `${GOLD}BB`; }}
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
        <div className="mt-20 pt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

            {/* Copyright */}
            <div className="flex items-center gap-4">
              <ShieldCheck className="h-3.5 w-3.5" style={{ color: "rgba(255,255,255,0.18)" }} />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7.5px",
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.32)",
                }}
              >
                © {year} Abraham of London · All rights reserved
              </span>
              <div className="hidden h-3 w-px md:block" style={{ backgroundColor: "rgba(255,255,255,0.07)" }} />
              <span
                className="hidden md:block"
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px",
                  letterSpacing: "0.26em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.18)",
                }}
              >
                Institutional registry
              </span>
            </div>

            {/* Policy links */}
            <div className="flex items-center gap-6">
              {policyLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7.5px",
                    letterSpacing: "0.26em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.28)",
                    transition: "color 200ms ease",
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.62)"}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.28)"}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}