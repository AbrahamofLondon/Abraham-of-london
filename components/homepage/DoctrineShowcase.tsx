// components/homepage/DoctrineShowcase.tsx
// The intellectual spine of the platform — Canon and Book Prelude
// Featured at flagship weight. No decoration. Pure authority.
"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Compass, ChevronRight, ScrollText } from "lucide-react";

const GOLD = "#C9A96E";

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
  const featured = canonEntries.slice(0, 3);

  return (
    <div className="grid gap-5 lg:grid-cols-2">

      {/* ── LEFT: The Book Prelude ─────────────────────────────────────── */}
      <div
        className="relative overflow-hidden border p-8 md:p-10 lg:p-12 flex flex-col justify-between"
        style={{
          borderColor: `${GOLD}20`,
          backgroundColor: `${GOLD}06`,
          minHeight: "480px",
        }}
      >
        {/* Top thread */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background: `linear-gradient(to right, transparent, ${GOLD}30, transparent)`,
          }}
        />

        {/* Grain */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "180px 180px",
          }}
        />

        <div className="relative z-10">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-8">
            <span
              className="h-5 w-px"
              style={{ backgroundColor: `${GOLD}55` }}
            />
            <span
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7.5px",
                letterSpacing: "0.42em",
                textTransform: "uppercase",
                color: `${GOLD}AA`,
              }}
            >
              Doctrine · Prelude
            </span>
          </div>

          {/* Title */}
          <h3
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(2rem, 3.5vw, 2.8rem)",
              fontWeight: 300,
              fontStyle: "italic",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "rgba(255,255,255,0.92)",
              marginBottom: "1.25rem",
            }}
          >
            The Architecture
            <br />
            <span style={{ color: GOLD }}>of Human Purpose</span>
          </h3>

          {/* Gold rule */}
          <div
            className="mb-6"
            style={{
              width: "40px",
              height: "1px",
              backgroundColor: `${GOLD}55`,
            }}
          />

          {/* Description */}
          <p
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "1rem",
              fontWeight: 300,
              fontStyle: "italic",
              lineHeight: 1.85,
              color: "rgba(255,255,255,0.42)",
              maxWidth: "42ch",
              marginBottom: "1rem",
            }}
          >
            The foundational text. A disciplined examination of purpose,
            formation, and the structural conditions under which humans
            build what endures.
          </p>

          <p
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8px",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.22)",
              marginBottom: "2.5rem",
            }}
          >
            Book · Doctrine · Abraham of London
          </p>
        </div>

        {/* CTAs */}
        <div className="relative z-10 flex flex-wrap gap-3">
          <Link
            href="/books/the-architecture-of-human-purpose-landing"
            className="group inline-flex items-center gap-2.5 border px-5 py-3 transition-all duration-300"
            style={{
              borderColor: `${GOLD}44`,
              backgroundColor: `${GOLD}0F`,
              color: GOLD,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8.5px",
              letterSpacing: "0.28em",
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
              el.style.backgroundColor = `${GOLD}0F`;
            }}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Read the prelude
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>

          <Link
            href="/books"
            className="inline-flex items-center gap-2.5 border px-5 py-3 transition-all duration-300"
            style={{
              borderColor: "rgba(255,255,255,0.07)",
              backgroundColor: "rgba(255,255,255,0.018)",
              color: "rgba(255,255,255,0.38)",
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8.5px",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = "rgba(255,255,255,0.14)";
              el.style.color = "rgba(255,255,255,0.62)";
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = "rgba(255,255,255,0.07)";
              el.style.color = "rgba(255,255,255,0.38)";
            }}
          >
            All works
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* ── RIGHT: The Canon ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-px" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>

        {/* Canon header panel */}
        <div
          className="relative overflow-hidden border p-7"
          style={{
            borderColor: "rgba(255,255,255,0.07)",
            backgroundColor: "rgb(6 6 9)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              background: "linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)",
            }}
          />
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="h-5 w-px" style={{ backgroundColor: `${GOLD}55` }} />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7.5px",
                  letterSpacing: "0.42em",
                  textTransform: "uppercase",
                  color: `${GOLD}AA`,
                }}
              >
                Doctrine · Canon
              </span>
            </div>
            <Link
              href="/canon"
              className="group inline-flex items-center gap-2 transition-colors"
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7.5px",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.28)",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.60)"}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.28)"}
            >
              Full archive
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <h3
            className="mt-4"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(1.6rem, 2.5vw, 2rem)",
              fontWeight: 300,
              fontStyle: "italic",
              lineHeight: 1.1,
              color: "rgba(255,255,255,0.88)",
            }}
          >
            The Canon
          </h3>
          <p
            className="mt-2"
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.24)",
            }}
          >
            The intellectual frame from which all structured products derive their authority.
          </p>
        </div>

        {/* Canon entries */}
        {featured.length > 0 ? (
          featured.map((entry, i) => (
            <Link
              key={entry.slug}
              href={entry.href}
              className="group flex items-start justify-between gap-4 p-6 transition-colors duration-200"
              style={{
                backgroundColor: "rgb(6 6 9)",
                borderBottom: i < featured.length - 1 ? "1px solid rgba(255,255,255,0.048)" : "none",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgb(10 14 20)"}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgb(6 6 9)"}
            >
              <div className="flex-1 min-w-0">
                {entry.category && (
                  <div
                    className="mb-1.5"
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px",
                      letterSpacing: "0.30em",
                      textTransform: "uppercase",
                      color: `${GOLD}88`,
                    }}
                  >
                    {entry.category}
                  </div>
                )}
                <h4
                  className="transition-colors duration-200 group-hover:text-white"
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: "1.1rem",
                    fontWeight: 300,
                    fontStyle: "italic",
                    lineHeight: 1.3,
                    color: "rgba(255,255,255,0.75)",
                  }}
                >
                  {entry.title}
                </h4>
                {entry.excerpt && (
                  <p
                    className="mt-1.5 line-clamp-2"
                    style={{
                      fontSize: "11.5px",
                      lineHeight: 1.65,
                      color: "rgba(255,255,255,0.30)",
                    }}
                  >
                    {entry.excerpt}
                  </p>
                )}
              </div>
              <div className="shrink-0 flex flex-col items-end gap-2 pt-0.5">
                {entry.readTime && (
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px",
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.20)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {entry.readTime}
                  </span>
                )}
                <ChevronRight
                  className="h-3.5 w-3.5 transition-all duration-200 group-hover:translate-x-0.5"
                  style={{ color: "rgba(255,255,255,0.18)" }}
                />
              </div>
            </Link>
          ))
        ) : (
          /* Fallback when no entries passed — hardcoded canon highlights */
          [
            {
              title: "A Letter from the Author",
              excerpt: "A formal charge to builders, fathers, mothers, leaders and reformers on why the Canon exists.",
              href: "/canon/canon-introduction-letter",
              category: "Canon · Introduction",
              readTime: "5 min read",
            },
            {
              title: "The Builder's Catechism",
              excerpt: "Forty Articles for Those Who Bear Weight. A disciplined creed for builders and civilisation-carriers.",
              href: "/canon/builders-catechism",
              category: "Sovereign Intelligence",
              readTime: "8 min read",
            },
            {
              title: "The Canon Archive",
              excerpt: "The full intellectual foundation — doctrine, governance, formation, and execution.",
              href: "/canon",
              category: "Canon · Full Archive",
              readTime: null,
            },
          ].map((entry, i) => (
            <Link
              key={entry.href}
              href={entry.href}
              className="group flex items-start justify-between gap-4 p-6 transition-colors duration-200"
              style={{
                backgroundColor: "rgb(6 6 9)",
                borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.048)" : "none",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgb(10 14 20)"}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgb(6 6 9)"}
            >
              <div className="flex-1 min-w-0">
                <div
                  className="mb-1.5"
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7px",
                    letterSpacing: "0.30em",
                    textTransform: "uppercase",
                    color: `${GOLD}88`,
                  }}
                >
                  {entry.category}
                </div>
                <h4
                  className="transition-colors duration-200 group-hover:text-white"
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: "1.1rem",
                    fontWeight: 300,
                    fontStyle: "italic",
                    lineHeight: 1.3,
                    color: "rgba(255,255,255,0.75)",
                  }}
                >
                  {entry.title}
                </h4>
                <p
                  className="mt-1.5 line-clamp-2"
                  style={{
                    fontSize: "11.5px",
                    lineHeight: 1.65,
                    color: "rgba(255,255,255,0.30)",
                  }}
                >
                  {entry.excerpt}
                </p>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-2 pt-0.5">
                {entry.readTime && (
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px",
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.20)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {entry.readTime}
                  </span>
                )}
                <ChevronRight
                  className="h-3.5 w-3.5 transition-all duration-200 group-hover:translate-x-0.5"
                  style={{ color: "rgba(255,255,255,0.18)" }}
                />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}