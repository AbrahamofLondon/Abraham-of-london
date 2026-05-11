"use client";

import * as React from "react";
import type { CohortMatchResult } from "@/lib/sovereign/cohort-intelligence";

const MONO: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

const SERIF: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
};

const MATCH_COLOR: Record<CohortMatchResult["matchStrength"], string> = {
  EXACT: "rgba(110,231,183,0.55)",
  CLOSE: "rgba(201,169,110,0.55)",
  APPROXIMATE: "rgba(255,255,255,0.30)",
};

type Props = {
  result: CohortMatchResult;
};

export default function CohortIntelligencePanel({ result }: Props) {
  const { cohort, matchStrength, narrative } = result;
  const matchColor = MATCH_COLOR[matchStrength];

  return (
    <div>
      {/* ── Label ──────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
        <p style={{ ...MONO, fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#555", margin: 0 }}>
          Cohort intelligence
        </p>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span style={{ ...MONO, fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", color: matchColor }}>
            {matchStrength.toLowerCase()} match
          </span>
          {cohort.memberCount > 0 && (
            <span style={{ ...MONO, fontSize: "8px", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>
              n={cohort.memberCount}
            </span>
          )}
          {cohort.dataSource === "THEORETICAL" && (
            <span style={{ ...MONO, fontSize: "7px", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.15)" }}>
              theoretical
            </span>
          )}
        </div>
      </div>

      {/* ── Cohort description ─────────────────────────────── */}
      <div style={{ padding: "16px 18px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: "20px" }}>
        <p style={{ ...MONO, fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "6px" }}>
          Your cohort
        </p>
        <p style={{ ...SERIF, fontWeight: 500, fontSize: "16px", lineHeight: 1.3, color: "#F5F5F5", marginBottom: "6px" }}>
          {cohort.cohortLabel}
        </p>
        <p style={{ fontSize: "13px", lineHeight: 1.6, color: "rgba(255,255,255,0.40)" }}>
          {cohort.cohortDescription}
        </p>
      </div>

      {/* ── Narrative ──────────────────────────────────────── */}
      <p style={{ fontSize: "14px", lineHeight: 1.8, color: "rgba(255,255,255,0.55)", marginBottom: "20px" }}>
        {narrative}
      </p>

      {/* ── Outcome distribution ───────────────────────────── */}
      {cohort.outcomes.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <p style={{ ...MONO, fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: "12px" }}>
            Outcome distribution in your cohort
          </p>
          <div style={{ display: "grid", gap: "8px" }}>
            {cohort.outcomes.map((outcome, i) => {
              const isFirst = i === 0;
              const color = isFirst
                ? "rgba(110,231,183,0.60)"
                : outcome.percentage >= 30
                  ? "rgba(252,165,165,0.55)"
                  : "rgba(255,255,255,0.35)";

              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "16px",
                    padding: "10px 12px",
                    background: isFirst ? "rgba(110,231,183,0.04)" : "rgba(255,255,255,0.01)",
                    border: `1px solid ${color.replace(/[\d.]+\)$/, "0.12)")}`,
                  }}
                >
                  <div>
                    <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", lineHeight: 1.55 }}>
                      {outcome.label}
                    </span>
                    {outcome.timeframe && (
                      <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.28)" }}>
                        {" "}· {outcome.timeframe}
                      </span>
                    )}
                    {outcome.condition && (
                      <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.28)" }}>
                        {" "}({outcome.condition})
                      </span>
                    )}
                  </div>
                  <span style={{ ...MONO, fontSize: "15px", color, flexShrink: 0, fontWeight: isFirst ? 500 : 400 }}>
                    {outcome.percentage}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Differentiator ─────────────────────────────────── */}
      <div
        style={{
          borderLeft: "2px solid rgba(201,169,110,0.30)",
          padding: "14px 16px",
          background: "rgba(201,169,110,0.03)",
          marginBottom: "16px",
        }}
      >
        <p style={{ ...MONO, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(201,169,110,0.45)", marginBottom: "6px" }}>
          Key differentiator in your cohort
        </p>
        <p style={{ fontSize: "13px", lineHeight: 1.7, color: "rgba(255,255,255,0.55)" }}>
          {cohort.topDifferentiator}
        </p>
      </div>

      {/* ── Primary risk ───────────────────────────────────── */}
      <div
        style={{
          borderLeft: "2px solid rgba(252,165,165,0.20)",
          padding: "12px 14px",
          background: "rgba(252,165,165,0.03)",
          marginBottom: "14px",
        }}
      >
        <p style={{ ...MONO, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(252,165,165,0.40)", marginBottom: "6px" }}>
          Primary structural risk for your cohort
        </p>
        <p style={{ fontSize: "13px", lineHeight: 1.65, color: "rgba(255,255,255,0.45)" }}>
          {cohort.primaryRisk}
        </p>
      </div>

      {/* ── Trajectory distribution ────────────────────────── */}
      {Object.keys(cohort.trajectoryDistribution).length > 0 && (
        <div>
          <p style={{ ...MONO, fontSize: "8px", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)", marginBottom: "8px" }}>
            Current trajectory distribution in cohort
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {Object.entries(cohort.trajectoryDistribution).map(([key, pct]) => (
              <span key={key} style={{ ...MONO, fontSize: "8px", letterSpacing: "0.08em", color: key === "IMPROVING" ? "rgba(110,231,183,0.50)" : key === "DETERIORATING" || key === "COLLAPSING" ? "rgba(252,165,165,0.45)" : "rgba(255,255,255,0.25)" }}>
                {key.toLowerCase()} {pct}%
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
