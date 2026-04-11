/* eslint-disable @typescript-eslint/no-explicit-any */
// components/playbooks/PlaybookCard.tsx
// Design: Institutional Monumentalism — matches homepage Panel language
// Sharp 2px borders. Cormorant Garamond titles. JetBrains Mono labels.
// Displays real playbook data (type, difficulty, time) — no generic placeholder tags.

"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type PlaybookCardProps = {
  title: string;
  description?: string | null;
  href: string;
  playbookType?: string | null;
  difficulty?: string | null;
  estimatedTime?: string | null;
  tier?: string | null;
  phases?: string[];
};

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS (inline)
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Difficulty → a single colour signal */
function difficultyColor(d?: string | null): string {
  switch ((d ?? "").toLowerCase()) {
    case "executive":     return "rgba(168,85,247,0.75)";  // purple
    case "advanced":      return `${GOLD}CC`;              // gold
    case "intermediate":  return "rgba(99,179,237,0.75)";  // blue
    default:              return "rgba(134,239,172,0.65)"; // green
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD
// ─────────────────────────────────────────────────────────────────────────────

export default function PlaybookCard({
  title,
  description,
  href,
  playbookType,
  difficulty,
  estimatedTime,
  tier,
  phases = [],
}: PlaybookCardProps) {
  const typeLabel = playbookType
    ? playbookType.charAt(0).toUpperCase() + playbookType.slice(1)
    : "Playbook";

  const isArchitect = (tier ?? "").toLowerCase() === "architect";

  return (
    <Link href={href} className="group block outline-none focus-visible:outline-none">
      <article
        className="relative overflow-hidden transition-all duration-400"
        style={{
          backgroundColor: "rgb(5 5 7)",
          border: "1px solid rgba(255,255,255,0.062)",
        }}
        onMouseEnter={e => {
          const el = e.currentTarget;
          el.style.borderColor = `${GOLD}22`;
          el.style.transform = "translateY(-2px)";
          el.style.boxShadow = "0 24px 60px -20px rgba(0,0,0,0.65)";
        }}
        onMouseLeave={e => {
          const el = e.currentTarget;
          el.style.borderColor = "rgba(255,255,255,0.062)";
          el.style.transform = "translateY(0)";
          el.style.boxShadow = "none";
        }}
      >
        {/* Gold thread — appears on hover */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: `linear-gradient(to right, transparent, ${GOLD}35, transparent)` }}
        />

        {/* Atmospheric radial */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: `radial-gradient(ellipse 60% 40% at 20% 10%, ${GOLD}05, transparent)` }}
        />

        <div className="relative z-10 p-8 md:p-9">

          {/* ── META ROW ─────────────────────────────────────────────────── */}
          <div className="flex items-start justify-between gap-4">

            {/* Left: type + difficulty */}
            <div className="flex items-center gap-2.5">
              <span style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "8px",
                letterSpacing: "0.40em",
                textTransform: "uppercase",
                color: `${GOLD}80`,
              }}>
                {typeLabel}
              </span>

              {difficulty && (
                <>
                  <span style={{ color: "rgba(255,255,255,0.10)" }}>·</span>
                  <span style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "8px",
                    letterSpacing: "0.26em",
                    textTransform: "uppercase",
                    color: difficultyColor(difficulty),
                  }}>
                    {difficulty}
                  </span>
                </>
              )}
            </div>

            {/* Right: tier badge — only if architect */}
            {isArchitect && (
              <div style={{
                padding: "3px 10px",
                border: `1px solid ${GOLD}30`,
                backgroundColor: `${GOLD}08`,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7px",
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: `${GOLD}AA`,
                flexShrink: 0,
              }}>
                Architect
              </div>
            )}
          </div>

          {/* ── TITLE ────────────────────────────────────────────────────── */}
          <h3
            style={{
              marginTop: "1.4rem",
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300,
              fontSize: "clamp(1.45rem, 2.0vw, 1.75rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.028em",
              color: "rgba(255,255,255,0.90)",
              transition: "color 350ms ease",
            }}
            className="group-hover:[color:rgba(255,255,255,1)]"
          >
            {title}
          </h3>

          {/* ── DESCRIPTION ──────────────────────────────────────────────── */}
          {description && (
            <p style={{
              marginTop: "0.85rem",
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300,
              fontSize: "clamp(0.90rem, 1.1vw, 0.98rem)",
              lineHeight: 1.68,
              color: "rgba(255,255,255,0.38)",
              maxWidth: "34ch",
              transition: "color 350ms ease",
            }}
            className="group-hover:[color:rgba(255,255,255,0.50)]"
            >
              {description}
            </p>
          )}

          {/* ── PHASE STRIP — top 3 phases at near-invisibility ─────────── */}
          {phases.length > 0 && (
            <div style={{ marginTop: "1.25rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {phases.slice(0, 3).map((phase, i) => (
                <span key={i} style={{
                  padding: "3px 10px",
                  border: "1px solid rgba(255,255,255,0.05)",
                  backgroundColor: "rgba(255,255,255,0.012)",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px",
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.22)",
                }}>
                  {phase}
                </span>
              ))}
            </div>
          )}

          {/* ── FOOTER ───────────────────────────────────────────────────── */}
          <div style={{
            marginTop: "1.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            paddingTop: "1.25rem",
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}>
            {/* Estimated time */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {estimatedTime && (
                <>
                  <Clock style={{ width: "11px", height: "11px", color: "rgba(255,255,255,0.20)" }} />
                  <span style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7.5px",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.22)",
                  }}>
                    {estimatedTime}
                  </span>
                </>
              )}
            </div>

            {/* CTA */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8px",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: `${GOLD}AA`,
              transition: "gap 300ms ease, color 300ms ease",
            }}
            className="group-hover:[gap:0.75rem] group-hover:[color:#C9A96E]"
            >
              Open playbook
              <ArrowRight style={{ width: "11px", height: "11px" }} />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}