// components/homepage/DoctrineShowcase.tsx
// Doctrine showcase — Book Prelude + Canon
// The intellectual spine of the platform. No brochure energy.
// The book arrives first, fully, as a standalone object of weight.
// The Canon follows as evidence of the same thinking, applied.

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";

const GOLD = "#C9A96E";
const VOID = "rgb(3 3 5)";
const BASE = "rgb(6 6 9)";
const LIFT = "rgb(10 14 20)";

type CanonEntry = {
  title: string;
  excerpt: string | null;
  slug: string;
  href: string;
  category: string | null;
  readTime: string | null;
};

type DoctrineShowcaseProps = {
  canonEntries?: CanonEntry[];
};

export default function DoctrineShowcase({ canonEntries = [] }: DoctrineShowcaseProps) {
  const canon = canonEntries.slice(0, 3);

  return (
    <div className="space-y-px" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>

      {/* ── THE BOOK — full width, dominant ───────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          backgroundColor: VOID,
          borderBottom: "1px solid rgba(255,255,255,0.055)",
        }}
      >
        {/* Atmospheric field — warm, not decorative */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 60% 80% at 5% 50%, ${GOLD}09 0%, transparent 55%), radial-gradient(ellipse 40% 60% at 95% 20%, rgba(255,255,255,0.018) 0%, transparent 50%)`,
          }}
        />

        {/* Top thread */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background: `linear-gradient(to right, ${GOLD}28, transparent 60%)`,
          }}
        />

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-16 lg:px-12 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[1fr_auto] lg:items-end">

            {/* Left — book identity */}
            <div>
              {/* Volume marker */}
              <div
                className="mb-7 flex items-center gap-3"
              >
                <div
                  style={{
                    width: 1,
                    height: 20,
                    backgroundColor: `${GOLD}55`,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7.5px",
                    letterSpacing: "0.44em",
                    textTransform: "uppercase",
                    color: `${GOLD}99`,
                  }}
                >
                  Volume 0 · Prelude · Limited Release
                </span>
              </div>

              {/* Title — the book is the headline */}
              <h3
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: "clamp(2.4rem, 5vw, 4rem)",
                  fontWeight: 300,
                  fontStyle: "italic",
                  lineHeight: 1.0,
                  letterSpacing: "-0.025em",
                  color: "rgba(255,255,255,0.93)",
                  marginBottom: "1.5rem",
                }}
              >
                The Architecture
                <br />
                <span style={{ color: GOLD }}>of Human Purpose</span>
              </h3>

              {/* The load-bearing line */}
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: "clamp(1.1rem, 2vw, 1.4rem)",
                  fontWeight: 300,
                  fontStyle: "italic",
                  lineHeight: 1.6,
                  color: "rgba(255,255,255,0.60)",
                  maxWidth: "52ch",
                  marginBottom: "1rem",
                  borderLeft: `2px solid ${GOLD}33`,
                  paddingLeft: "1.25rem",
                }}
              >
                "Human flourishing is not accidental.
                <br />
                It is architectural."
              </p>

              {/* Frame line — no mention of Canon */}
              <p
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8px",
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.28)",
                  maxWidth: "58ch",
                  lineHeight: 1.8,
                  marginBottom: "2.5rem",
                }}
              >
                A frame strong enough to hold decisions, covenants,
                markets, and legacy — without collapsing into abstraction.
              </p>

              {/* Single CTA — the book earns one */}
              <Link
                href="/books/the-architecture-of-human-purpose-landing"
                className="group inline-flex items-center gap-3 border transition-all duration-300"
                style={{
                  padding: "14px 28px",
                  borderColor: `${GOLD}44`,
                  backgroundColor: `${GOLD}0C`,
                  color: GOLD,
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "9px",
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.borderColor = `${GOLD}66`;
                  el.style.backgroundColor = `${GOLD}18`;
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.borderColor = `${GOLD}44`;
                  el.style.backgroundColor = `${GOLD}0C`;
                }}
              >
                Read the prelude
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Right — volume context, understated */}
            <div
              className="hidden lg:block"
              style={{
                borderLeft: "1px solid rgba(255,255,255,0.055)",
                paddingLeft: "3rem",
                minWidth: "220px",
              }}
            >
              {[
                { n: "00", label: "Prelude", status: "Available now" },
                { n: "01", label: "Purpose", status: "In preparation" },
                { n: "02", label: "Governance", status: "In preparation" },
                { n: "03", label: "Formation", status: "In preparation" },
              ].map((v, i) => (
                <div
                  key={v.n}
                  className="flex items-start gap-4 py-3"
                  style={{
                    borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    opacity: i === 0 ? 1 : 0.45,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontSize: "1.4rem",
                      fontWeight: 300,
                      color: i === 0 ? `${GOLD}80` : "rgba(255,255,255,0.20)",
                      lineHeight: 1,
                      minWidth: "2rem",
                    }}
                  >
                    {v.n}
                  </span>
                  <div>
                    <div
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                        fontSize: "0.95rem",
                        fontWeight: 300,
                        fontStyle: "italic",
                        color: i === 0 ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.28)",
                      }}
                    >
                      {v.label}
                    </div>
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "6.5px",
                        letterSpacing: "0.28em",
                        textTransform: "uppercase",
                        color: i === 0 ? `${GOLD}88` : "rgba(255,255,255,0.18)",
                        marginTop: "0.2rem",
                      }}
                    >
                      {v.status}
                    </div>
                  </div>
                </div>
              ))}

              <div
                className="mt-4 pt-4"
                style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
              >
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "6.5px",
                    letterSpacing: "0.30em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.16)",
                  }}
                >
                  10 volumes · in progress
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── THE CANON — below, subordinate, evidential ────────────────── */}
      <div
        style={{
          backgroundColor: BASE,
          borderTop: "1px solid rgba(255,255,255,0.048)",
        }}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-12">

          {/* Canon header row */}
          <div
            className="flex items-center justify-between gap-4 py-5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.048)" }}
          >
            <div className="flex items-center gap-3">
              <span
                style={{
                  width: 1,
                  height: 16,
                  backgroundColor: `${GOLD}44`,
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7.5px",
                  letterSpacing: "0.40em",
                  textTransform: "uppercase",
                  color: `${GOLD}88`,
                }}
              >
                The Canon — applied doctrine
              </span>
            </div>
            <Link
              href="/canon"
              className="group inline-flex items-center gap-1.5 transition-colors duration-200"
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7.5px",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.26)",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.55)"}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.26)"}
            >
              Full archive
              <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Canon entries — row-based, dense, no cards */}
          <div>
            {(canon.length > 0 ? canon : [
              {
                title: "A Letter from the Author",
                excerpt: "A formal charge to builders, fathers, leaders and reformers on why the Canon exists and who it is for.",
                href: "/canon/canon-introduction-letter",
                category: "Introduction",
                readTime: "5 min",
              },
              {
                title: "The Builder's Catechism",
                excerpt: "Forty Articles for Those Who Bear Weight. A disciplined creed for builders and civilisation-carriers.",
                href: "/canon/builders-catechism",
                category: "Sovereign Intelligence",
                readTime: "8 min",
              },
              {
                title: "The Canon Archive",
                excerpt: "The constitutional body of the institution — doctrine, governance, formation, and execution.",
                href: "/canon",
                category: "Full Archive",
                readTime: null,
              },
            ]).map((entry, i, arr) => (
              <Link
                key={entry.href}
                href={entry.href}
                className="group flex items-center gap-6 py-4 transition-colors duration-150"
                style={{
                  borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgba(255,255,255,0.012)"}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent"}
              >
                {/* Category */}
                <div
                  className="hidden sm:block shrink-0"
                  style={{ minWidth: "120px" }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "6.5px",
                      letterSpacing: "0.28em",
                      textTransform: "uppercase",
                      color: `${GOLD}77`,
                    }}
                  >
                    {entry.category}
                  </span>
                </div>

                {/* Title + excerpt */}
                <div className="flex-1 min-w-0">
                  <span
                    className="transition-colors duration-150 group-hover:text-white"
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontSize: "1.05rem",
                      fontWeight: 300,
                      fontStyle: "italic",
                      color: "rgba(255,255,255,0.72)",
                      display: "block",
                      lineHeight: 1.3,
                    }}
                  >
                    {entry.title}
                  </span>
                  {entry.excerpt && (
                    <span
                      className="hidden md:block mt-0.5 truncate"
                      style={{
                        fontSize: "11.5px",
                        color: "rgba(255,255,255,0.26)",
                        lineHeight: 1.5,
                      }}
                    >
                      {entry.excerpt}
                    </span>
                  )}
                </div>

                {/* Read time + arrow */}
                <div className="shrink-0 flex items-center gap-3">
                  {entry.readTime && (
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7px",
                        letterSpacing: "0.22em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.18)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {entry.readTime}
                    </span>
                  )}
                  <ChevronRight
                    className="h-3.5 w-3.5 transition-all duration-150 group-hover:translate-x-0.5"
                    style={{ color: "rgba(255,255,255,0.16)" }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}