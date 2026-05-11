"use client";

import * as React from "react";
import Link from "next/link";
import type { ForensicAccount } from "@/lib/sovereign/decision-forensics";

const MONO: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

const SERIF: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
};

type Props = {
  account: ForensicAccount;
  /** Show structural warnings. Default true. */
  showWarnings?: boolean;
};

export default function ForensicAccountPanel({ account, showWarnings = true }: Props) {
  const dataLabel =
    account.dataSource === "COMMONS"
      ? "Empirical — drawn from Intelligence Commons data"
      : account.dataSource === "HYBRID"
        ? "Hybrid — empirical + theoretical grounding"
        : "Theoretical — grounded in content framework";

  return (
    <div>
      {/* ── Label ──────────────────────────────────────────── */}
      <p style={{ ...MONO, fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#555", marginBottom: "16px" }}>
        Decision forensics
      </p>

      {/* ── Pattern name ───────────────────────────────────── */}
      <p
        style={{
          ...SERIF,
          fontWeight: 500,
          fontSize: "20px",
          lineHeight: 1.25,
          color: "#F5F5F5",
          marginBottom: "8px",
        }}
      >
        {account.patternName}
      </p>

      {/* ── Comparator context ─────────────────────────────── */}
      {account.totalComparators > 0 && (
        <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.45)", marginBottom: "20px" }}>
          Of {account.totalComparators} {account.comparatorDescription}:
        </p>
      )}

      {/* ── Outcome distribution ───────────────────────────── */}
      {account.outcomes.length > 0 && (
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
            padding: "16px 18px",
            marginBottom: "20px",
            display: "grid",
            gap: "10px",
          }}
        >
          {account.outcomes.map((outcome, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "16px",
                borderBottom: i < account.outcomes.length - 1 ? "1px solid rgba(255,255,255,0.04)" : undefined,
                paddingBottom: i < account.outcomes.length - 1 ? "10px" : undefined,
              }}
            >
              <div>
                <span style={{ fontSize: "13px", lineHeight: 1.55, color: "rgba(255,255,255,0.55)" }}>
                  {outcome.label}
                </span>
                {outcome.timeframe && (
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.28)" }}>
                    {" "}({outcome.timeframe})
                  </span>
                )}
              </div>
              <span
                style={{
                  ...MONO,
                  fontSize: "14px",
                  letterSpacing: "0.02em",
                  color: outcome.percentage >= 60 ? "rgba(252,165,165,0.65)" : outcome.percentage >= 40 ? "rgba(201,169,110,0.65)" : "rgba(255,255,255,0.40)",
                  flexShrink: 0,
                }}
              >
                {outcome.percentage}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Strongest predictor ────────────────────────────── */}
      <div
        style={{
          borderLeft: "2px solid rgba(201,169,110,0.35)",
          padding: "14px 16px",
          background: "rgba(201,169,110,0.04)",
          marginBottom: "20px",
        }}
      >
        <p
          style={{
            ...MONO,
            fontSize: "8px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(201,169,110,0.50)",
            marginBottom: "6px",
          }}
        >
          Strongest predictor of positive outcome
        </p>
        <p
          style={{
            ...MONO,
            fontSize: "11px",
            letterSpacing: "0.02em",
            color: "#C9A96E",
            marginBottom: "8px",
          }}
        >
          {account.strongestPredictor.predictor}
        </p>
        <p style={{ fontSize: "13px", lineHeight: 1.65, color: "rgba(255,255,255,0.50)" }}>
          {account.strongestPredictor.description}
        </p>
        {account.strongestPredictor.presentInPositiveOutcomes > 0 && (
          <div style={{ display: "flex", gap: "16px", marginTop: "10px", flexWrap: "wrap" }}>
            <span style={{ ...MONO, fontSize: "8px", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(110,231,183,0.45)" }}>
              Present in {account.strongestPredictor.presentInPositiveOutcomes} positive outcomes
            </span>
            <span style={{ ...MONO, fontSize: "8px", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(252,165,165,0.35)" }}>
              {account.strongestPredictor.presentInNegativeOutcomes} negative
            </span>
          </div>
        )}
      </div>

      {/* ── Structural warnings ────────────────────────────── */}
      {showWarnings && account.structuralWarnings.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <p
            style={{
              ...MONO,
              fontSize: "9px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.25)",
              marginBottom: "10px",
            }}
          >
            Structural warnings
          </p>
          <div style={{ display: "grid", gap: "8px" }}>
            {account.structuralWarnings.map((warning, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-start",
                  fontSize: "13px",
                  lineHeight: 1.65,
                  color: "rgba(255,255,255,0.42)",
                }}
              >
                <span style={{ color: "rgba(252,165,165,0.35)", flexShrink: 0, marginTop: "2px" }}>↗</span>
                {warning}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recommendation ─────────────────────────────────── */}
      <div
        style={{
          background: "#111",
          padding: "16px 18px",
          marginBottom: "14px",
        }}
      >
        <p
          style={{
            ...MONO,
            fontSize: "8px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#555",
            marginBottom: "8px",
          }}
        >
          Recommendation
        </p>
        <p style={{ fontSize: "14px", lineHeight: 1.75, color: "rgba(255,255,255,0.65)" }}>
          {account.recommendation}
        </p>
      </div>

      {/* ── Brief link + data source ────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
        {account.briefSlug && (
          <Link
            href={account.briefSlug}
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
        )}
        <span
          style={{
            ...MONO,
            fontSize: "7px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.15)",
          }}
        >
          {dataLabel}
        </span>
      </div>
    </div>
  );
}
