/* eslint-disable @typescript-eslint/no-explicit-any */
// components/playbooks/PlaybookCard.tsx
// Institutional Monumentalism — corrected and hardened
// Improvements:
// - safer keyboard/focus behaviour without relying on JS-only hover
// - cleaner metadata hierarchy
// - better empty-state handling for estimated time / phases
// - no fragile group-hover arbitrary inline color hacks
// - sharper visual rhythm aligned to the playbooks index and detail pages
// - reduced-motion friendly transitions

"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Clock, Lock } from "lucide-react";

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
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const BASE = "rgb(5 5 7)";
const BORDER = "rgba(255,255,255,0.062)";
const BORDER_HOVER = "rgba(201,169,110,0.22)";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function safeText(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeLabel(value?: string | null, fallback = "Playbook"): string {
  const raw = safeText(value, fallback);
  if (!raw) return fallback;
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function uniqueStrings(values?: string[]): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((v) => safeText(v)).filter(Boolean))];
}

function difficultyColor(d?: string | null): string {
  switch ((d ?? "").toLowerCase()) {
    case "executive":
      return "rgba(168,85,247,0.75)";
    case "advanced":
      return `${GOLD}CC`;
    case "intermediate":
      return "rgba(99,179,237,0.75)";
    default:
      return "rgba(134,239,172,0.65)";
  }
}

function typeColor(t?: string | null): string {
  switch ((t ?? "").toLowerCase()) {
    case "diagnostic":
      return `${GOLD}BB`;
    case "execution":
      return "rgba(134,239,172,0.70)";
    case "correction":
      return "rgba(252,165,165,0.70)";
    case "leadership":
      return "rgba(147,197,253,0.70)";
    default:
      return `${GOLD}80`;
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
  const typeLabel = normalizeLabel(playbookType, "Playbook");
  const difficultyLabel = safeText(difficulty);
  const timeLabel = safeText(estimatedTime);
  const phaseList = uniqueStrings(phases).slice(0, 3);
  const isArchitect = safeText(tier).toLowerCase() === "architect";

  return (
    <Link
      href={href}
      className="group block outline-none focus-visible:outline-none"
      aria-label={`Open playbook: ${title}`}
    >
      <article
        className="relative overflow-hidden transition-all duration-300 motion-reduce:transform-none motion-reduce:transition-none focus-within:outline-none"
        style={{
          backgroundColor: BASE,
          border: `1px solid ${BORDER}`,
        }}
      >
        {/* top thread */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
          style={{
            background: `linear-gradient(to right, transparent, ${GOLD}35, transparent)`,
          }}
        />

        {/* hover atmosphere */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
          style={{
            background: `radial-gradient(ellipse 60% 40% at 20% 10%, ${GOLD}06, transparent)`,
          }}
        />

        {/* interaction shell */}
        <div
          className="absolute inset-0 transition-all duration-300 group-hover:shadow-[0_24px_60px_-20px_rgba(0,0,0,0.65)] group-focus-visible:shadow-[0_24px_60px_-20px_rgba(0,0,0,0.65)]"
          style={{ pointerEvents: "none" }}
        />

        <div
          className="relative z-10 p-8 md:p-9 transition-transform duration-300 motion-reduce:transform-none group-hover:-translate-y-[2px] group-focus-visible:-translate-y-[2px]"
          style={{
            borderColor: BORDER,
          }}
          onMouseEnter={(e) => {
            const host = e.currentTarget.parentElement;
            if (host) host.style.borderColor = BORDER_HOVER;
          }}
          onMouseLeave={(e) => {
            const host = e.currentTarget.parentElement;
            if (host) host.style.borderColor = BORDER;
          }}
        >
          {/* ── META ROW ───────────────────────────────────────────────── */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "8px",
                    letterSpacing: "0.40em",
                    textTransform: "uppercase",
                    color: typeColor(playbookType),
                  }}
                >
                  {typeLabel}
                </span>

                {difficultyLabel && (
                  <>
                    <span style={{ color: "rgba(255,255,255,0.10)" }}>·</span>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "8px",
                        letterSpacing: "0.26em",
                        textTransform: "uppercase",
                        color: difficultyColor(difficultyLabel),
                      }}
                    >
                      {difficultyLabel}
                    </span>
                  </>
                )}
              </div>
            </div>

            {isArchitect && (
              <div
                className="inline-flex shrink-0 items-center gap-1.5"
                style={{
                  padding: "3px 10px",
                  border: `1px solid ${GOLD}30`,
                  backgroundColor: `${GOLD}08`,
                  color: `${GOLD}AA`,
                }}
              >
                <Lock style={{ width: "10px", height: "10px" }} />
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7px",
                    letterSpacing: "0.32em",
                    textTransform: "uppercase",
                  }}
                >
                  Architect
                </span>
              </div>
            )}
          </div>

          {/* ── TITLE ──────────────────────────────────────────────────── */}
          <h3
            style={{
              marginTop: "1.4rem",
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300,
              fontSize: "clamp(1.45rem, 2vw, 1.75rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.028em",
              color: "rgba(255,255,255,0.90)",
              transition: "color 300ms ease",
            }}
            className="group-hover:text-white group-focus-visible:text-white"
          >
            {title}
          </h3>

          {/* ── DESCRIPTION ────────────────────────────────────────────── */}
          {safeText(description) && (
            <p
              style={{
                marginTop: "0.85rem",
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "clamp(0.92rem, 1.08vw, 0.98rem)",
                lineHeight: 1.68,
                color: "rgba(255,255,255,0.38)",
                maxWidth: "36ch",
                transition: "color 300ms ease",
              }}
              className="group-hover:text-white/50 group-focus-visible:text-white/50"
            >
              {description}
            </p>
          )}

          {/* ── PHASE STRIP ────────────────────────────────────────────── */}
          {phaseList.length > 0 && (
            <div
              style={{
                marginTop: "1.25rem",
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              {phaseList.map((phase, i) => (
                <span
                  key={`${phase}-${i}`}
                  style={{
                    padding: "3px 10px",
                    border: "1px solid rgba(255,255,255,0.05)",
                    backgroundColor: "rgba(255,255,255,0.012)",
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7px",
                    letterSpacing: "0.24em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.22)",
                  }}
                >
                  {phase}
                </span>
              ))}
            </div>
          )}

          {/* ── FOOTER ─────────────────────────────────────────────────── */}
          <div
            style={{
              marginTop: "1.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              paddingTop: "1.25rem",
              borderTop: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minHeight: "11px" }}>
              {timeLabel ? (
                <>
                  <Clock
                    style={{
                      width: "11px",
                      height: "11px",
                      color: "rgba(255,255,255,0.20)",
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7.5px",
                      letterSpacing: "0.28em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.22)",
                    }}
                  >
                    {timeLabel}
                  </span>
                </>
              ) : (
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7.5px",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.14)",
                  }}
                >
                  Structured reading
                </span>
              )}
            </div>

            <div
              className="flex items-center gap-2 transition-all duration-300 group-hover:gap-3 group-focus-visible:gap-3"
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "8px",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: `${GOLD}AA`,
              }}
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