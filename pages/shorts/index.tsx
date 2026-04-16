/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/shorts/index.tsx
// Design: Private Library Luxury — The Reading Chamber
// Audience: Sovereign fund allocators, managing directors, board-level operators
// Principle: Enter. Read. Leave with something. No friction anywhere.
//
// Removed from previous version:
//   - FeaturedGrid (duplicates hero rail — executives don't need the same
//     content shown twice)
//   - Ghost watermarks and decorative redundancy
//   - "Archive note", "Indexed", platform name in card footers
//   - Rounded corners on filter bar (signals SaaS, not institution)
//   - bg-black class (replaced with design token)
//   - amber-500 accents (replaced with softGold #C9A96E)
//
// Added / upgraded:
//   - Category filter pills — faster than a search box for scanners
//   - List mode with tighter card density — respects the executive's time
//   - Empty state that matches the reading chamber tone
//   - Section rhythm: void hero → whisper strip → chamber → close

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Search, LayoutGrid, List, Sparkles, ChevronRight } from "lucide-react";

import Layout from "@/components/Layout";
import ShortCard from "@/components/ShortCard";
import {
  readImprint,
  writeImprint,
  computeWhisper,
  getOrCreateSeed,
  updateStreak,
  updateVisitCount,
} from "@/lib/shorts/brand";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type RawShortDoc = {
  _id?: string;
  title?: string | null;
  description?: string | null;
  excerpt?: string | null;
  category?: string | null;
  date?: string | null;
  draft?: boolean | null;
  published?: boolean | null;
  slug?: string | null;
  slugSafe?: string | null;
  hrefSafe?: string | null;
  readTime?: string | null;
  readTimeSafe?: string | null;
  coverImage?: string | null;
  image?: string | null;
  views?: number | null;
  likes?: number | null;
  saves?: number | null;
  intensity?: 1 | 2 | 3 | 4 | 5 | null;
  lineage?: string | null;
  _raw?: {
    flattenedPath?: string | null;
    sourceFilePath?: string | null;
  } | null;
};

type ShortIndexItem = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  slug: string;
  href: string;
  coverImage: string | null;
  views: number;
  likes: number;
  saves: number;
  intensity: 1 | 2 | 3 | 4 | 5;
  lineage: string | null;
  date: string | null;
};

type ShortsIndexProps = {
  shorts: ShortIndexItem[];
  totalCount: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// DATA HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function safeString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function safeNumber(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function normalizePath(input: unknown): string {
  return safeString(input)
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\.(md|mdx)$/i, "")
    .replace(/\/{2,}/g, "/");
}

function stripPrefixOnce(source: string, prefix: string): string {
  const p = `${prefix.toLowerCase()}/`;
  return source.toLowerCase().startsWith(p) ? source.slice(p.length) : source;
}

function resolveShortSlug(doc: RawShortDoc): string | null {
  const candidates = [
    safeString(doc.slugSafe),
    safeString(doc.slug),
    safeString(doc?._raw?.flattenedPath),
    safeString(doc?._raw?.sourceFilePath),
    safeString(doc.hrefSafe),
    safeString(doc._id),
  ].filter(Boolean);

  for (const candidate of candidates) {
    let s = normalizePath(candidate);
    if (!s) continue;
    if (s.toLowerCase().startsWith("content/")) s = s.slice("content/".length);
    if (s.toLowerCase().startsWith("shorts/"))  s = stripPrefixOnce(s, "shorts");
    else if (s.toLowerCase().startsWith("/shorts/")) s = s.replace(/^\/?shorts\//i, "");
    s = normalizePath(s);
    if (s) return s;
  }
  return null;
}

function isPublishedShort(doc: RawShortDoc): boolean {
  if (!doc) return false;
  if (doc.draft === true) return false;
  if (doc.published === false) return false;
  return true;
}

function toShortIndexItem(doc: RawShortDoc): ShortIndexItem | null {
  const slug = resolveShortSlug(doc);
  if (!slug) return null;
  const intensityRaw = safeNumber(doc.intensity, 3);
  const intensity = clamp(intensityRaw, 1, 5) as 1 | 2 | 3 | 4 | 5;
  return {
    id:        safeString(doc._id) || `short-${slug}`,
    title:     safeString(doc.title).trim() || "Untitled",
    excerpt:   safeString(doc.excerpt).trim() || safeString(doc.description).trim() || "",
    category:  safeString(doc.category).trim() || "Intel",
    readTime:  safeString(doc.readTime).trim() || safeString(doc.readTimeSafe).trim() || "2 min",
    slug,
    href:      `/shorts/${slug}`,
    coverImage: safeString(doc.coverImage).trim() || safeString(doc.image).trim() || null,
    views:     safeNumber(doc.views, 0),
    likes:     safeNumber(doc.likes, 0),
    saves:     safeNumber(doc.saves, 0),
    intensity,
    lineage:   safeString(doc.lineage).trim() || null,
    date:      safeString(doc.date).trim() || null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS (inline)
// ─────────────────────────────────────────────────────────────────────────────

const GOLD  = "#C9A96E";
const VOID  = "rgb(3 3 5)";
const BASE  = "rgb(6 6 9)";

const GRAIN: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundSize: "180px 180px",
};

// ─────────────────────────────────────────────────────────────────────────────
// MOTION PRESETS
// ─────────────────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.80, ease: [0.19, 1, 0.22, 1] as any } },
};

// ─────────────────────────────────────────────────────────────────────────────
// HERO BACKDROP — READING CHAMBER ATMOSPHERE
// ─────────────────────────────────────────────────────────────────────────────

function HeroBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 select-none overflow-hidden">
      {/* Base void */}
      <div className="absolute inset-0" style={{ backgroundColor: "rgb(2 2 3)" }} />

      {/* Warm gold nebula — upper left */}
      <div
        className="absolute"
        style={{
          left: "-8%",
          top: "-10%",
          width: "900px",
          height: "560px",
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(201,169,110,0.09) 0%, rgba(201,169,110,0.04) 28%, rgba(201,169,110,0.012) 50%, transparent 72%)",
          filter: "blur(120px)",
        }}
      />

      {/* Cool white nebula — right */}
      <div
        className="absolute"
        style={{
          right: "-4%",
          top: "6%",
          width: "480px",
          height: "480px",
          borderRadius: "50%",
          background: "radial-gradient(circle at center, rgba(255,255,255,0.038) 0%, rgba(255,255,255,0.012) 30%, transparent 70%)",
          filter: "blur(110px)",
        }}
      />

      {/* Architectural ghost rectangles — upper right */}
      {[
        { w: 400, h: 260, r: "13%", t: "16%", br: "32px", opacity: 0.045 },
        { w: 320, h: 200, r: "15%", t: "20%", br: "26px", opacity: 0.030 },
        { w: 240, h: 145, r: "17%", t: "24%", br: "20px", opacity: 0.022 },
      ].map((rect, i) => (
        <div
          key={i}
          className="absolute hidden xl:block"
          style={{
            right: rect.r,
            top: rect.t,
            width: `${rect.w}px`,
            height: `${rect.h}px`,
            borderRadius: rect.br,
            border: `1px solid rgba(255,255,255,${rect.opacity})`,
          }}
        />
      ))}

      {/* Vertical structural lines */}
      <div
        className="absolute inset-y-0 hidden xl:block"
        style={{ left: "8%", width: "1px", background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.04), transparent)" }}
      />
      <div
        className="absolute inset-y-0 hidden xl:block"
        style={{ right: "8%", width: "1px", background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.03), transparent)" }}
      />

      {/* Horizontal accent line */}
      <div
        className="absolute inset-x-0"
        style={{ top: "30%", height: "1px", background: "linear-gradient(to right, transparent, rgba(255,255,255,0.03), transparent)" }}
      />

      {/* Bottom fade */}
      <div
        className="absolute inset-x-0 bottom-0 h-48"
        style={{ background: "linear-gradient(to top, rgb(3 3 5), transparent)" }}
      />

      {/* Grain */}
      <div className="absolute inset-0 opacity-[0.018]" style={GRAIN} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO SECTION
// ─────────────────────────────────────────────────────────────────────────────

function HeroSection({
  totalCount,
  streak,
  visits,
  whisper,
  isRareWhisper,
  featuredShorts,
}: {
  totalCount: number;
  streak: number;
  visits: number;
  whisper: string;
  isRareWhisper: boolean;
  featuredShorts: ShortIndexItem[];
}) {
  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: "rgb(2 2 3)" }}>
      <HeroBackdrop />

      {/* Top precision rule */}
      <div
        className="absolute inset-x-0 top-0 z-10"
        style={{ height: "1px", background: `linear-gradient(to right, transparent, ${GOLD}28, transparent)` }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        {/* Spacer for fixed header */}
        <div className="pt-36 md:pt-40 lg:pt-44" />

        {/* ── Stats badge ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.05, ease: [0.19, 1, 0.22, 1] }}
        >
          <div
            className="inline-flex items-center gap-2.5 px-4 py-2 backdrop-blur-md"
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              backgroundColor: "rgba(255,255,255,0.02)",
            }}
          >
            <span
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7.5px",
                letterSpacing: "0.34em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.30)",
              }}
            >
              {totalCount} notes
            </span>
            <span style={{ color: "rgba(255,255,255,0.10)" }}>·</span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7.5px",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.22)",
              }}
            >
              {streak} day streak
            </span>
            <span style={{ color: "rgba(255,255,255,0.10)" }}>·</span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7.5px",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.18)",
              }}
            >
              {visits} visits
            </span>
          </div>
        </motion.div>

        {/* ── Headline ──────────────────────────────────────────────────── */}
        <div className="mt-10 max-w-4xl">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.70, delay: 0.08, ease: [0.19, 1, 0.22, 1] }}
            className="flex items-center gap-3"
          >
            <div className="h-px w-10" style={{ background: `linear-gradient(to right, ${GOLD}55, transparent)` }} />
            <span
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "8.5px",
                letterSpacing: "0.40em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.28)",
              }}
            >
              Brief signals · Lasting weight
            </span>
          </motion.div>

          {/* Display title */}
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.95, delay: 0.12, ease: [0.19, 1, 0.22, 1] }}
            style={{
              marginTop: "1.25rem",
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300,
              fontSize: "clamp(4.5rem, 9vw, 9rem)",
              lineHeight: 0.88,
              letterSpacing: "-0.055em",
              color: "rgba(255,255,255,0.92)",
            }}
          >
            Shorts
          </motion.h1>

          {/* Descriptor */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.85, delay: 0.22 }}
            style={{
              marginTop: "1.5rem",
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300,
              fontSize: "clamp(1rem, 1.3vw, 1.20rem)",
              lineHeight: 1.72,
              color: "rgba(255,255,255,0.45)",
              maxWidth: "44ch",
            }}
          >
            Thought distilled to its sharpest edge. Written for people who need
            clarity without noise — and who already know whether they're in the
            right room.
          </motion.p>

          {/* Whisper */}
          {whisper && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.30, ease: [0.19, 1, 0.22, 1] }}
              className="mt-7"
            >
              <div
                className="inline-flex items-center gap-2.5 px-4 py-2"
                style={{
                  border: `1px solid ${isRareWhisper ? "rgba(201,169,110,0.18)" : "rgba(255,255,255,0.07)"}`,
                  backgroundColor: isRareWhisper ? "rgba(201,169,110,0.04)" : "rgba(255,255,255,0.02)",
                }}
              >
                <Sparkles
                  style={{
                    width: "11px",
                    height: "11px",
                    color: isRareWhisper ? "rgba(201,169,110,0.60)" : "rgba(255,255,255,0.20)",
                    strokeWidth: 1.5,
                  }}
                />
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "9px",
                    letterSpacing: "0.20em",
                    color: isRareWhisper ? `${GOLD}CC` : "rgba(255,255,255,0.38)",
                  }}
                >
                  {whisper}
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* ── Featured rail — top 3 shorts ─────────────────────────────── */}
        {featuredShorts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.90, delay: 0.28, ease: [0.19, 1, 0.22, 1] }}
            className="relative mt-14 overflow-hidden"
            style={{
              border: "1px solid rgba(255,255,255,0.07)",
              backgroundColor: "rgba(255,255,255,0.015)",
            }}
          >
            {/* Rail top thread */}
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{ background: `linear-gradient(to right, transparent, ${GOLD}28, transparent)` }}
            />

            {/* Inner atmospheric radial */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: `radial-gradient(ellipse 50% 60% at 0% 50%, ${GOLD}07, transparent)` }}
            />

            <div className="relative grid grid-cols-1 divide-y md:grid-cols-3 md:divide-x md:divide-y-0"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
              {featuredShorts.slice(0, 3).map((item, idx) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group block px-6 py-6 transition-colors duration-400 hover:bg-white/[0.02]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      {/* Meta */}
                      <div className="mb-3 flex items-center gap-2">
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            fontSize: "7.5px",
                            letterSpacing: "0.36em",
                            textTransform: "uppercase",
                            color: `${GOLD}BB`,
                          }}
                        >
                          {item.category.toUpperCase()}
                        </span>
                        {item.readTime && (
                          <>
                            <span style={{ color: "rgba(255,255,255,0.10)" }}>·</span>
                            <span
                              style={{
                                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                                fontSize: "7.5px",
                                letterSpacing: "0.22em",
                                textTransform: "uppercase",
                                color: "rgba(255,255,255,0.24)",
                              }}
                            >
                              {item.readTime}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Title */}
                      <h3
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300,
                          fontSize: "clamp(1.1rem, 1.4vw, 1.30rem)",
                          lineHeight: 1.08,
                          letterSpacing: "-0.022em",
                          color: "rgba(255,255,255,0.82)",
                          transition: "color 350ms ease",
                        }}
                        className="group-hover:[color:rgba(255,255,255,1.0)]"
                      >
                        {item.title}
                      </h3>

                      {/* Excerpt — 1 sentence in the rail */}
                      {item.excerpt && (
                        <p
                          style={{
                            marginTop: "0.55rem",
                            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                            fontWeight: 300,
                            fontSize: "0.875rem",
                            lineHeight: 1.60,
                            color: "rgba(255,255,255,0.32)",
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical" as any,
                          }}
                        >
                          {item.excerpt.split(/(?<=[.!?])\s+/)[0]}
                        </p>
                      )}
                    </div>

                    {/* Arrow */}
                    <div
                      style={{
                        flexShrink: 0,
                        width: "24px",
                        height: "24px",
                        border: "1px solid rgba(255,255,255,0.07)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "border-color 350ms ease",
                      }}
                      className="group-hover:[border-color:rgba(201,169,110,0.25)]"
                    >
                      <ChevronRight
                        style={{
                          width: "11px",
                          height: "11px",
                          color: "rgba(255,255,255,0.20)",
                          transition: "color 350ms ease",
                        }}
                        className="group-hover:[color:rgba(201,169,110,0.75)]"
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        <div className="pb-16 md:pb-20" />
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IMPRINT — last read, fading memory
// ─────────────────────────────────────────────────────────────────────────────

function ImprintStrip({
  title,
  hoursRemaining,
  fadePercent,
}: {
  title?: string;
  hoursRemaining?: number;
  fadePercent?: number;
}) {
  if (!title) return null;

  const opacity = clamp(1 - (fadePercent ?? 0) / 115, 0.18, 0.78);

  return (
    <div
      className="border-y"
      style={{
        borderColor: "rgba(255,255,255,0.05)",
        backgroundColor: "rgba(0,0,0,0.30)",
        backdropFilter: "blur(16px)",
      }}
    >
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-12">
        <div className="flex items-center justify-between gap-6">
          {/* Left: label */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="h-px w-6" style={{ background: `linear-gradient(to right, ${GOLD}40, transparent)` }} />
            <span
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7.5px",
                letterSpacing: "0.36em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.20)",
              }}
            >
              Last read
            </span>
          </div>

          {/* Centre: the fading title */}
          <p
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300,
              fontSize: "clamp(0.95rem, 1.3vw, 1.15rem)",
              fontStyle: "italic",
              lineHeight: 1.4,
              color: "rgba(255,255,255,0.55)",
              opacity,
              textAlign: "center",
              flex: 1,
            }}
          >
            "{title}"
          </p>

          {/* Right: time since */}
          <span
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7.5px",
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.16)",
              flexShrink: 0,
            }}
          >
            {hoursRemaining && hoursRemaining > 0 ? `${hoursRemaining}h ago` : "fading"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTER BAR — search + category pills + view toggle
// ─────────────────────────────────────────────────────────────────────────────

function FilterBar({
  searchQuery,
  setSearchQuery,
  activeCategory,
  setActiveCategory,
  categories,
  viewMode,
  setViewMode,
  visibleCount,
  totalCount,
}: {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  activeCategory: string;
  setActiveCategory: (v: string) => void;
  categories: string[];
  viewMode: "grid" | "list";
  setViewMode: (v: "grid" | "list") => void;
  visibleCount: number;
  totalCount: number;
}) {
  return (
    <div
      className="sticky top-0 z-40 border-b"
      style={{
        borderColor: "rgba(255,255,255,0.055)",
        backgroundColor: "rgba(5,5,7,0.92)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-12">

        {/* Row 1 — search + view toggle */}
        <div className="flex items-center gap-5 py-4">

          {/* Search — borderless, inline */}
          <div className="relative flex-1 max-w-sm">
            <Search
              style={{
                position: "absolute",
                left: 0,
                top: "50%",
                transform: "translateY(-50%)",
                width: "14px",
                height: "14px",
                color: "rgba(255,255,255,0.22)",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              placeholder="Filter…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                paddingLeft: "1.5rem",
                paddingRight: "0.5rem",
                paddingTop: "0.35rem",
                paddingBottom: "0.35rem",
                background: "transparent",
                border: "none",
                outline: "none",
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "11px",
                letterSpacing: "0.10em",
                color: "rgba(255,255,255,0.70)",
              }}
              className="placeholder:[color:rgba(255,255,255,0.22)]"
            />
          </div>

          {/* Count — minimal */}
          <span
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7.5px",
              letterSpacing: "0.30em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.18)",
              flexShrink: 0,
            }}
          >
            {visibleCount} / {totalCount}
          </span>

          {/* View toggle — sharp, no rounded corners */}
          <div
            className="flex items-center"
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              flexShrink: 0,
            }}
          >
            {(["grid", "list"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                aria-label={`${mode} view`}
                style={{
                  padding: "7px 10px",
                  background: viewMode === mode ? "rgba(255,255,255,0.07)" : "transparent",
                  color: viewMode === mode ? "rgba(255,255,255,0.80)" : "rgba(255,255,255,0.28)",
                  transition: "background 250ms ease, color 250ms ease",
                  cursor: "pointer",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {mode === "grid"
                  ? <LayoutGrid style={{ width: "14px", height: "14px" }} />
                  : <List       style={{ width: "14px", height: "14px" }} />
                }
              </button>
            ))}
          </div>
        </div>

        {/* Row 2 — category pills (only if categories exist) */}
        {categories.length > 1 && (
          <div className="flex items-center gap-2 pb-3 overflow-x-auto hide-scrollbar">
            {["All", ...categories].map((cat) => {
              const isActive = cat === "All" ? activeCategory === "" : activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat === "All" ? "" : cat)}
                  style={{
                    flexShrink: 0,
                    padding: "4px 12px",
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7.5px",
                    letterSpacing: "0.32em",
                    textTransform: "uppercase",
                    border: `1px solid ${isActive ? `${GOLD}35` : "rgba(255,255,255,0.07)"}`,
                    backgroundColor: isActive ? `${GOLD}0D` : "transparent",
                    color: isActive ? `${GOLD}CC` : "rgba(255,255,255,0.28)",
                    cursor: "pointer",
                    transition: "all 250ms ease",
                    whiteSpace: "nowrap",
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-28">
      <div
        className="mb-6 h-px w-10"
        style={{ background: `linear-gradient(to right, transparent, ${GOLD}40, transparent)` }}
      />
      <p
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontSize: "1.5rem",
          fontWeight: 300,
          color: "rgba(255,255,255,0.60)",
          fontStyle: "italic",
        }}
      >
        Nothing found for "{query}"
      </p>
      <p
        style={{
          marginTop: "0.75rem",
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "8.5px",
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.22)",
        }}
      >
        Try a broader term
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

function formatShortDate(date: string | null): string {
  const raw = safeString(date);
  if (!raw) return "";

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

function firstSentence(input: string): string {
  const text = safeString(input).trim().replace(/\s+/g, " ");
  if (!text) return "";
  const match = text.match(/^.*?[.!?](?:\s|$)/);
  return (match?.[0] || text).trim();
}

function MemoFilterStrip({
  categories,
  activeCategory,
  setActiveCategory,
}: {
  categories: string[];
  activeCategory: string;
  setActiveCategory: (value: string) => void;
}) {
  return (
    <div className="px-6 py-6 lg:px-10">
      <div className="mx-auto max-w-5xl overflow-x-auto">
        <div className="inline-flex min-w-full gap-8">
          {["All", ...categories].map((category) => {
            const isActive =
              category === "All" ? activeCategory === "" : activeCategory === category;

            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category === "All" ? "" : category)}
                style={{
                  paddingBottom: "0.25rem",
                  border: "none",
                  borderBottom: `1px solid ${isActive ? GOLD : "transparent"}`,
                  background: "transparent",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8px",
                  letterSpacing: "0.30em",
                  textTransform: "uppercase",
                  color: isActive ? GOLD : "rgba(255,255,255,0.32)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const ShortsIndexPage: NextPage<ShortsIndexProps> = ({ shorts }) => {
  const [activeCategory, setActiveCategory] = React.useState("");

  const categories = React.useMemo(() => {
    const set = new Set(shorts.map((short) => short.category).filter(Boolean));
    return Array.from(set).sort();
  }, [shorts]);

  const filtered = React.useMemo(() => {
    if (!activeCategory) return shorts;
    return shorts.filter((short) => short.category === activeCategory);
  }, [activeCategory, shorts]);

  return (
    <Layout
      title="Shorts — Abraham of London"
      description="Compressed thinking for people who read fast."
      className="min-h-screen text-white"
      fullWidth
      headerTransparent={false}
      canonicalUrl="/shorts"
      showFooter={false}
      enableVaultSearch={false}
    >
      <Head>
        <title>Shorts — Abraham of London</title>
        <meta name="description" content="Compressed thinking for people who read fast." />
      </Head>

      <main className="min-h-screen" style={{ backgroundColor: VOID }}>
        <header
          className="border-b px-6 pb-12 pt-16 lg:px-10 lg:pb-12 lg:pt-28"
          style={{ borderColor: "rgba(255,255,255,0.10)" }}
        >
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center">
              <span
                style={{
                  width: 1,
                  height: 20,
                  backgroundColor: "rgba(201,169,110,0.45)",
                  display: "inline-block",
                  marginRight: "0.75rem",
                  verticalAlign: "middle",
                }}
              />
              <div
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7.5px",
                  letterSpacing: "0.40em",
                  textTransform: "uppercase",
                  color: "rgba(201,169,110,0.80)",
                }}
              >
                SHORTS · ABRAHAM OF LONDON
              </div>
            </div>
            <h1
              style={{
                marginTop: "1rem",
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontStyle: "italic",
                fontSize: "clamp(2.8rem, 5.5vw, 5rem)",
                lineHeight: 1.02,
                color: "rgba(255,255,255,0.90)",
              }}
            >
              Compressed thinking for people who read fast.
            </h1>
            <div
              style={{
                width: 40,
                height: 1,
                backgroundColor: "rgba(201,169,110,0.55)",
                margin: "1.5rem 0 2rem",
              }}
            />
            <div
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "8px",
                letterSpacing: "0.42em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.28)",
              }}
            >
              Signal. Pattern. Decision.
            </div>
          </div>
        </header>

        <MemoFilterStrip
          categories={categories}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />

        <section>
          {filtered.map((short) => {
            const excerpt = firstSentence(short.excerpt);

            return (
              <Link
                key={short.id}
                href={short.href}
                className="block border-b px-6 py-6 transition-colors hover:bg-white/[0.02] lg:px-10"
                style={{ borderColor: "rgba(255,255,255,0.05)" }}
              >
                <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-[80px_minmax(0,1fr)_80px] md:items-start">
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "8px",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.28)",
                    }}
                  >
                    {short.readTime}
                  </div>

                  <div className="min-w-0">
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7.5px",
                        letterSpacing: "0.32em",
                        textTransform: "uppercase",
                        color: GOLD,
                      }}
                    >
                      {short.category}
                    </div>
                    <h2
                      style={{
                        marginTop: "0.45rem",
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontStyle: "italic",
                        fontSize: "clamp(1.25rem, 2vw, 1.5rem)",
                        lineHeight: 1.08,
                        color: "rgba(255,255,255,0.88)",
                      }}
                      className="transition-colors hover:text-white"
                    >
                      {short.title}
                    </h2>
                    {excerpt ? (
                      <p
                        className="truncate"
                        style={{
                          marginTop: "0.5rem",
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300,
                          fontSize: "0.875rem",
                          lineHeight: 1.45,
                          color: "rgba(255,255,255,0.40)",
                        }}
                      >
                        {excerpt}
                      </p>
                    ) : null}
                  </div>

                  <div
                    className="md:text-right"
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7.5px",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.22)",
                    }}
                  >
                    {formatShortDate(short.date)}
                  </div>
                </div>
              </Link>
            );
          })}
        </section>

        <footer className="px-6 py-10 lg:px-10">
          <div className="mx-auto max-w-5xl border-t pt-6" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            <div
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7.5px",
                letterSpacing: "0.40em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.22)",
              }}
            >
              Abraham of London
            </div>
          </div>
        </footer>
      </main>
    </Layout>
  );
};

export default ShortsIndexPage;

// ─────────────────────────────────────────────────────────────────────────────
// DATA — unchanged from working version
// ─────────────────────────────────────────────────────────────────────────────

export const getStaticProps: GetStaticProps<ShortsIndexProps> = async () => {
  const { getAllShorts, sanitizeData } = await import(
    "@/lib/content/server"
  );
  const fromShorts = (getAllShorts() || []) as RawShortDoc[];

  const shorts = fromShorts
    .filter(isPublishedShort)
    .map(toShortIndexItem)
    .filter(Boolean) as ShortIndexItem[];

  shorts.sort((a, b) => {
    const aT = a.date ? new Date(a.date).getTime() : 0;
    const bT = b.date ? new Date(b.date).getTime() : 0;
    return bT - aT;
  });

  return {
    props: {
      shorts:     sanitizeData(shorts),
      totalCount: shorts.length,
    },
    revalidate: 3600,
  };


};
