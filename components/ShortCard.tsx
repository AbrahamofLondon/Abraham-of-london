/* eslint-disable @typescript-eslint/no-explicit-any */
// components/ShortCard.tsx
// Design: Private Library Luxury
// Audience: Sovereign fund allocators, MDs, board-level operators with 90 seconds
// Principle: The title IS the product. Everything else is infrastructure.
// Removed: watermark, "Archive note", "Indexed", platform name, metrics display
// Kept: category, read time, excerpt (2 sentences max), intensity descriptor

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type ShortCardModel = {
  slug: string;
  title: string;
  excerpt: string;
  category?: string | null;
  readTime?: string | null;
  views?: number;
  intensity?: 1 | 2 | 3 | 4 | 5;
  lineage?: string | null;
  coverImage?: string | null;
  metrics?: { likes?: number; saves?: number; views?: number };
  state?: { liked?: boolean; saved?: boolean };
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function safeString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function normalizeCardSlug(slug: unknown): string {
  return safeString(slug)
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/^shorts\//i, "");
}

/** One editorial word — adds depth, never competes with the title */
function intensityDescriptor(n?: number | null): string {
  switch (n) {
    case 1: return "Foundational";
    case 2: return "Considered";
    case 3: return "Substantive";
    case 4: return "Consequential";
    case 5: return "Critical";
    default: return "Substantive";
  }
}

/** Exactly 2 sentences. Executives scan. They do not read full paragraphs in card views. */
function executiveScan(text: string): string {
  if (!text) return "";
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [];
  return sentences.slice(0, 2).join(" ").trim() || text.slice(0, 130);
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD
// ─────────────────────────────────────────────────────────────────────────────

export default function ShortCard({
  short,
  onClick,
  listMode = false,
}: {
  short: ShortCardModel;
  onClick?: () => void;
  listMode?: boolean;
}) {
  const routeSlug = normalizeCardSlug(short.slug);
  const href      = `/shorts/${routeSlug}`;
  const title     = safeString(short.title) || "Untitled";
  const excerpt   = executiveScan(safeString(short.excerpt));
  const category  = safeString(short.category).trim().toUpperCase() || "INTEL";
  const readTime  = safeString(short.readTime).trim();
  const weight    = intensityDescriptor(short.intensity);

  // Padding scale — tighter in list mode, more generous in grid
  const pad = listMode
    ? "px-7 py-6 md:px-8 md:py-7"
    : "px-8 py-8 md:px-10 md:py-10";

  return (
    <Link href={href} onClick={onClick} className="group block outline-none focus-visible:outline-none">
      <article
        className="relative overflow-hidden"
        style={{
          backgroundColor: "rgb(5 5 7)",
          border: "1px solid rgba(255,255,255,0.062)",
          transition: "border-color 400ms ease, transform 350ms ease, box-shadow 400ms ease",
        }}
        onMouseEnter={e => {
          const el = e.currentTarget;
          el.style.borderColor = "rgba(201,169,110,0.22)";
          el.style.transform   = "translateY(-2px)";
          el.style.boxShadow   = "0 28px 70px -22px rgba(0,0,0,0.65)";
        }}
        onMouseLeave={e => {
          const el = e.currentTarget;
          el.style.borderColor = "rgba(255,255,255,0.062)";
          el.style.transform   = "translateY(0)";
          el.style.boxShadow   = "none";
        }}
      >

        {/* ── TOP-EDGE GOLD THREAD ─────────────────────────────────────────
            Invisible at rest. Appears on hover.
            The single moment of warmth — communicates value silently.
        ─────────────────────────────────────────────────────────────────── */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: "linear-gradient(to right, transparent, rgba(201,169,110,0.35), transparent)" }}
        />

        {/* ── VERY SUBTLE ATMOSPHERIC RADIAL ──────────────────────────────
            Not visible as a shape — just adds imperceptible depth.
            Opacity: 0 at rest, barely there on hover.
        ─────────────────────────────────────────────────────────────────── */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: "radial-gradient(ellipse 55% 35% at 18% 12%, rgba(201,169,110,0.04), transparent)" }}
        />

        <div className={`relative z-10 ${pad}`}>

          {/* ── META ROW ─────────────────────────────────────────────────── */}
          {/*
            Category (gold-muted) · Read time (near-invisible)
            Arrow in a precision square — directional, not decorative.
            All three elements in one line. Scan in 0.5 seconds.
          */}
          <div className="flex items-start justify-between gap-4">

            {/* Left: category + read time */}
            <div className="flex items-center gap-2.5">
              <span
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8px",
                  letterSpacing: "0.40em",
                  textTransform: "uppercase" as const,
                  color: "rgba(201,169,110,0.75)",
                }}
              >
                {category}
              </span>

              {readTime && (
                <>
                  <span style={{ color: "rgba(255,255,255,0.10)", fontSize: "10px" }}>·</span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "8px",
                      letterSpacing: "0.26em",
                      textTransform: "uppercase" as const,
                      color: "rgba(255,255,255,0.24)",
                    }}
                  >
                    {readTime}
                  </span>
                </>
              )}
            </div>

            {/* Right: directional arrow in a sharp square */}
            <div
              style={{
                flexShrink: 0,
                width: "26px",
                height: "26px",
                border: "1px solid rgba(255,255,255,0.07)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "border-color 400ms ease",
              }}
              className="group-hover:[border-color:rgba(201,169,110,0.25)]"
            >
              <ArrowUpRight
                style={{
                  width: "12px",
                  height: "12px",
                  color: "rgba(255,255,255,0.20)",
                  transition: "color 400ms ease",
                }}
                className="group-hover:[color:rgba(201,169,110,0.75)]"
              />
            </div>
          </div>

          {/* ── TITLE ────────────────────────────────────────────────────── */}
          {/*
            Cormorant Garamond. This IS the product. White — not gold.
            Titles are primary content, not accents.

            Font weight 300 — editorial authority without heaviness.
            Leading 1.04 — tight like a broadsheet headline.
            Tracking -0.03em — gives the letters mass and presence.

            Size is fluid. At 1440px it reads like a magazine cover line.
            At 375px it remains legible and commanding.

            On hover: pure white. The only thing that changes on this card
            is the border, the shadow, the thread, and the title colour.
            That restraint IS the luxury signal.
          */}
          <h3
            style={{
              marginTop: listMode ? "0.95rem" : "1.45rem",
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300,
              fontSize: listMode
                ? "clamp(1.25rem, 1.7vw, 1.50rem)"
                : "clamp(1.45rem, 1.9vw, 1.80rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.030em",
              color: "rgba(255,255,255,0.88)",
              transition: "color 350ms ease",
            }}
            className="group-hover:[color:rgba(255,255,255,1.0)]"
          >
            {title}
          </h3>

          {/* ── EXCERPT ──────────────────────────────────────────────────── */}
          {/*
            Same Cormorant typeface — same reading register as the title.
            Low opacity (0.38) — supporting context, never competing.
            Max 32ch — matches the reading column of a physical card.
            2 sentences max — the executive already knows whether to click.
          */}
          {excerpt && (
            <p
              style={{
                marginTop: "0.95rem",
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "clamp(0.90rem, 1.05vw, 0.98rem)",
                lineHeight: 1.70,
                color: "rgba(255,255,255,0.38)",
                maxWidth: "32ch",
                transition: "color 350ms ease",
              }}
              className="group-hover:[color:rgba(255,255,255,0.50)]"
            >
              {excerpt}
            </p>
          )}

          {/* ── EDITORIAL FOOTER ─────────────────────────────────────────── */}
          {/*
            The weight descriptor in JetBrains Mono at 7px.
            Near-invisible at rest — adds dimension without clutter.
            The extending gold rule is the one kinetic gesture below the title.
            Nothing else. No platform name. No metrics. No "indexed".
          */}
          <div
            style={{
              marginTop: listMode ? "1.25rem" : "1.85rem",
              display: "flex",
              alignItems: "center",
              gap: "0.70rem",
            }}
          >
            {/* Extending gold rule */}
            <div
              style={{
                height: "1px",
                width: "18px",
                background: "linear-gradient(to right, rgba(201,169,110,0.32), transparent)",
                transition: "width 450ms ease",
              }}
              className="group-hover:[width:30px]"
            />

            {/* Editorial weight — one word, near invisible, deeply intentional */}
            <span
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7px",
                letterSpacing: "0.36em",
                textTransform: "uppercase" as const,
                color: "rgba(255,255,255,0.15)",
              }}
            >
              {weight}
            </span>
          </div>

        </div>
      </article>
    </Link>
  );
}