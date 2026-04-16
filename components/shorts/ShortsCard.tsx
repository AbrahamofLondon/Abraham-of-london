// components/shorts/ShortsCard.tsx
// Thin composition: Shorts card.
// Text-forward, fast, scan-friendly. No image. Minimal kinetic.
// Uses CardShell (flush variant). All ds-* tokens. No raw colors.
// CSS hover only — no JS onMouseEnter/onMouseLeave.

"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CardShell } from "@/components/primitives/CardShell";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ShortCardModel = {
  slug: string;
  title: string;
  excerpt: string;
  category?: string | null;
  readTime?: string | null;
  intensity?: 1 | 2 | 3 | 4 | 5;
};

export type ShortsCardProps = {
  short: ShortCardModel;
  onClick?: () => void;
  listMode?: boolean;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function normalizeCardSlug(slug: unknown): string {
  return safeString(slug)
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/^shorts\//i, "");
}

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

function executiveScan(text: string): string {
  if (!text) return "";
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [];
  return sentences.slice(0, 2).join(" ").trim() || text.slice(0, 130);
}

// ---------------------------------------------------------------------------
// ShortsCard
// ---------------------------------------------------------------------------

export default function ShortsCard({
  short,
  onClick,
  listMode = false,
}: ShortsCardProps) {
  const routeSlug = normalizeCardSlug(short.slug);
  const href = `/shorts/${routeSlug}`;
  const title = safeString(short.title) || "Untitled";
  const excerpt = executiveScan(safeString(short.excerpt));
  const category = safeString(short.category).trim().toUpperCase() || "INTEL";
  const readTime = safeString(short.readTime).trim();
  const weight = intensityDescriptor(short.intensity);

  return (
    <Link href={href} onClick={onClick} className="group block outline-none focus-visible:outline-none">
      <CardShell
        as="div"
        variant="flush"
        density={listMode ? "compact" : "airy"}
        className="shorts-card"
        style={{ backgroundColor: "var(--ds-background)" }}
      >
        {/* Top-edge accent thread — visible on hover only */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity group-hover:opacity-100"
          style={{
            background: "linear-gradient(to right, transparent, var(--ds-accent-soft), transparent)",
            transitionDuration: "var(--ds-duration-slow)",
          }}
        />

        {/* Meta row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span
              className="font-mono text-[8px] uppercase tracking-[0.40em]"
              style={{ color: "var(--ds-accent)" }}
            >
              {category}
            </span>

            {readTime && (
              <>
                <span className="text-[10px]" style={{ color: "var(--ds-text-subtle)" }}>·</span>
                <span
                  className="font-mono text-[8px] uppercase tracking-[0.26em]"
                  style={{ color: "var(--ds-text-subtle)" }}
                >
                  {readTime}
                </span>
              </>
            )}
          </div>

          {/* Directional arrow */}
          <div
            className="flex h-[26px] w-[26px] shrink-0 items-center justify-center border transition-colors"
            style={{
              borderColor: "var(--ds-border)",
              transitionDuration: "var(--ds-duration-base)",
            }}
          >
            <ArrowUpRight
              className="h-3 w-3 transition-colors"
              style={{
                color: "var(--ds-text-subtle)",
                transitionDuration: "var(--ds-duration-base)",
              }}
            />
          </div>
        </div>

        {/* Title — serif, the product */}
        <h3
          className="font-serif transition-colors"
          style={{
            marginTop: listMode ? "0.95rem" : "1.45rem",
            fontWeight: 300,
            fontSize: listMode
              ? "clamp(1.25rem, 1.7vw, 1.50rem)"
              : "clamp(1.45rem, 1.9vw, 1.80rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.030em",
            color: "var(--ds-text)",
            transitionDuration: "var(--ds-duration-base)",
          }}
        >
          {title}
        </h3>

        {/* Excerpt — supporting context, 2 sentences max */}
        {excerpt && (
          <p
            className="font-serif transition-colors"
            style={{
              marginTop: "0.95rem",
              fontWeight: 300,
              fontSize: "clamp(0.90rem, 1.05vw, 0.98rem)",
              lineHeight: 1.70,
              color: "var(--ds-text-muted)",
              maxWidth: "32ch",
              transitionDuration: "var(--ds-duration-base)",
            }}
          >
            {excerpt}
          </p>
        )}

        {/* Footer — editorial weight descriptor */}
        <div
          className="flex items-center gap-3"
          style={{ marginTop: listMode ? "1.25rem" : "1.85rem" }}
        >
          <div
            className="h-px w-[18px] transition-all group-hover:w-[30px]"
            style={{
              background: "linear-gradient(to right, var(--ds-accent), transparent)",
              transitionDuration: "var(--ds-duration-slow)",
            }}
          />
          <span
            className="font-mono text-[7px] uppercase tracking-[0.36em]"
            style={{ color: "var(--ds-text-subtle)" }}
          >
            {weight}
          </span>
        </div>
      </CardShell>
    </Link>
  );
}
