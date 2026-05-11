"use client";

import * as React from "react";
import Link from "next/link";
import type { IntelligenceSignal } from "@/lib/sovereign/intelligence-signals";

const SEVERITY_PALETTE = {
  CRITICAL: {
    border: "rgba(252,165,165,0.35)",
    label: "rgba(252,165,165,0.70)",
    tag: "rgba(252,165,165,0.50)",
    dot: "#FC9999",
  },
  ALERT: {
    border: "rgba(201,169,110,0.42)",
    label: "#C9A96E",
    tag: "rgba(201,169,110,0.60)",
    dot: "#C9A96E",
  },
  CONCERN: {
    border: "rgba(255,255,255,0.12)",
    label: "rgba(255,255,255,0.55)",
    tag: "rgba(255,255,255,0.35)",
    dot: "rgba(255,255,255,0.40)",
  },
  WATCH: {
    border: "rgba(110,231,183,0.20)",
    label: "rgba(110,231,183,0.60)",
    tag: "rgba(110,231,183,0.40)",
    dot: "rgba(110,231,183,0.50)",
  },
} as const;

const MONO: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

const SERIF: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
};

type Props = {
  signal: IntelligenceSignal;
  /** Show the full narrative. Default true. */
  expanded?: boolean;
  /** Show the outcomes table. Default true when expanded. */
  showOutcomes?: boolean;
};

export default function IntelligenceSignalCard({
  signal,
  expanded = true,
  showOutcomes = true,
}: Props) {
  const [open, setOpen] = React.useState(expanded);
  const palette = SEVERITY_PALETTE[signal.severity];

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.015)",
        border: `1px solid ${palette.border}`,
        borderLeft: `2px solid ${palette.border}`,
        padding: "20px 22px",
      }}
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", cursor: "pointer" }}
        onClick={() => setOpen((v) => !v)}
        role="button"
        aria-expanded={open}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
            <span
              style={{
                ...MONO,
                fontSize: "8px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: palette.label,
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: palette.dot,
                  flexShrink: 0,
                }}
              />
              {signal.severity}
            </span>
            <span
              style={{
                ...MONO,
                fontSize: "8px",
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.18)",
              }}
            >
              · {signal.prevalencePercent}% prevalence
            </span>
          </div>

          <p
            style={{
              ...SERIF,
              fontWeight: 500,
              fontSize: "18px",
              lineHeight: 1.25,
              color: "#F5F5F5",
              margin: 0,
            }}
          >
            {signal.name}
          </p>

          <p
            style={{
              fontSize: "13px",
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.40)",
              marginTop: "4px",
            }}
          >
            {signal.tag}
          </p>
        </div>

        <span
          style={{
            ...MONO,
            fontSize: "10px",
            color: "rgba(255,255,255,0.20)",
            flexShrink: 0,
            marginTop: "2px",
          }}
        >
          {open ? "▲" : "▼"}
        </span>
      </div>

      {/* ── Body ────────────────────────────────────────────── */}
      {open && (
        <div style={{ marginTop: "18px" }}>
          {/* Narrative */}
          <p
            style={{
              fontSize: "14px",
              lineHeight: 1.8,
              color: "rgba(255,255,255,0.62)",
            }}
          >
            {signal.narrative}
          </p>

          {/* Outcomes table */}
          {showOutcomes && signal.outcomes.length > 0 && (
            <div style={{ marginTop: "18px", display: "grid", gap: "6px" }}>
              {signal.outcomes.map((outcome, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "12px",
                    borderBottom: i < signal.outcomes.length - 1 ? "1px solid rgba(255,255,255,0.04)" : undefined,
                    paddingBottom: i < signal.outcomes.length - 1 ? "6px" : undefined,
                  }}
                >
                  <span style={{ fontSize: "13px", lineHeight: 1.55, color: "rgba(255,255,255,0.40)" }}>
                    {outcome.label}
                    {outcome.condition && (
                      <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "12px" }}>
                        {" "}({outcome.condition})
                      </span>
                    )}
                  </span>
                  <span
                    style={{
                      ...MONO,
                      fontSize: "11px",
                      letterSpacing: "0.04em",
                      color: palette.tag,
                      flexShrink: 0,
                    }}
                  >
                    {outcome.displayValue ?? `${outcome.percentage}%`}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Differentiator */}
          <div
            style={{
              marginTop: "16px",
              padding: "12px 14px",
              background: "rgba(255,255,255,0.03)",
              borderLeft: `1px solid ${palette.border}`,
            }}
          >
            <p
              style={{
                ...MONO,
                fontSize: "8px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.25)",
                marginBottom: "6px",
              }}
            >
              Key differentiator
            </p>
            <p style={{ fontSize: "13px", lineHeight: 1.65, color: "rgba(255,255,255,0.50)" }}>
              {signal.differentiator}
            </p>
          </div>

          {/* Brief link */}
          {signal.briefSlug && (
            <div style={{ marginTop: "14px" }}>
              <Link
                href={signal.briefSlug}
                style={{
                  ...MONO,
                  fontSize: "9px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(201,169,110,0.55)",
                  textDecoration: "none",
                }}
              >
                Read brief →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
