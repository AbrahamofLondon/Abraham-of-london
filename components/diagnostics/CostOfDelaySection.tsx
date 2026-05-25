"use client";

/**
 * components/diagnostics/CostOfDelaySection.tsx
 *
 * Client-facing Cost of Delay display for ER, Boardroom Dossier, Strategy Room.
 *
 * Receives pre-computed WSJF values (or calculates from inputs) and renders
 * the priority tier, financial exposure, and escalation level in plain language.
 *
 * Governance rule: All outputs carry "Scenario estimate only" disclaimer.
 * Financial figures are only shown when a revenue basis is provided.
 */

import * as React from "react";
import { AlertTriangle, TrendingUp, Clock, DollarSign } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type WsjfTier = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type EscalationLevel = "CRITICAL" | "ESCALATE" | "WATCH" | "NONE";

export type CostOfDelayData = {
  wsjfScore?: number | null;
  wsjfTier?: WsjfTier | null;
  /** Plain-language description of the WSJF priority */
  priorityRationale?: string | null;
  /** Financial exposure if provided */
  financialExposure?: {
    totalCostOfDelay: number;
    weeklyBurnRate: number;
    revenueAtRisk: number;
    currencyCode: string;
  } | null;
  escalation?: {
    level: EscalationLevel;
    signal: string;
  } | null;
  /** The governance recommendation */
  recommendation?: string | null;
  /** Weeks of delay (for burn rate context) */
  weeksDelayed?: number | null;
};

export type CostOfDelaySectionProps = {
  data: CostOfDelayData | null | undefined;
  /** Context label for the top eyebrow */
  context?: string;
  /** If false, hide the financial figures even when present */
  showFinancial?: boolean;
};

// ─── Tier config ──────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<WsjfTier, { label: string; color: string; bg: string; border: string }> = {
  CRITICAL: {
    label: "Critical priority",
    color: "rgba(239,68,68,0.85)",
    bg: "rgba(239,68,68,0.05)",
    border: "rgba(239,68,68,0.25)",
  },
  HIGH: {
    label: "High priority",
    color: "rgba(249,115,22,0.85)",
    bg: "rgba(249,115,22,0.05)",
    border: "rgba(249,115,22,0.25)",
  },
  MEDIUM: {
    label: "Medium priority",
    color: "rgba(251,191,36,0.80)",
    bg: "rgba(251,191,36,0.04)",
    border: "rgba(251,191,36,0.20)",
  },
  LOW: {
    label: "Low priority",
    color: "rgba(110,231,183,0.70)",
    bg: "rgba(110,231,183,0.03)",
    border: "rgba(110,231,183,0.15)",
  },
};

const ESCALATION_CONFIG: Record<EscalationLevel, { label: string; color: string } | null> = {
  CRITICAL: { label: "Escalate immediately", color: "rgba(239,68,68,0.80)" },
  ESCALATE: { label: "Escalation required", color: "rgba(249,115,22,0.80)" },
  WATCH: { label: "Monitor closely", color: "rgba(251,191,36,0.75)" },
  NONE: null,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, code: string): string {
  const symbol = code === "GBP" ? "£" : code === "USD" ? "$" : code === "EUR" ? "€" : code;
  if (amount >= 1_000_000) return `${symbol}${(amount / 1_000_000).toFixed(1)}m`;
  if (amount >= 1_000) return `${symbol}${Math.round(amount / 1_000).toLocaleString("en-GB")}k`;
  return `${symbol}${amount.toLocaleString("en-GB")}`;
}

const GOLD = "#C9A96E";
const mono = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" } as const;
const serif = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 } as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function CostOfDelaySection({
  data,
  context = "Decision",
  showFinancial = true,
}: CostOfDelaySectionProps) {
  if (!data) return null;

  const tier = data.wsjfTier ?? "LOW";
  const tierCfg = TIER_CONFIG[tier];
  const escalation = data.escalation;
  const escCfg = escalation ? ESCALATION_CONFIG[escalation.level] : null;

  return (
    <div
      style={{
        border: `1px solid ${tierCfg.border}`,
        backgroundColor: tierCfg.bg,
        padding: "0",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "0.75rem 1.25rem",
          borderBottom: `1px solid ${tierCfg.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
          flexWrap: "wrap" as const,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <TrendingUp size={12} style={{ color: tierCfg.color }} />
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.35)" }}>
            Cost of delay — {context}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {data.wsjfScore != null && (
            <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", color: "rgba(255,255,255,0.25)" }}>
              WSJF {data.wsjfScore.toFixed(1)}
            </span>
          )}
          <span
            style={{
              ...mono,
              fontSize: "7px",
              letterSpacing: "0.18em",
              textTransform: "uppercase" as const,
              color: tierCfg.color,
              backgroundColor: `${tierCfg.color}18`,
              padding: "0.2rem 0.6rem",
              border: `1px solid ${tierCfg.border}`,
            }}
          >
            {tierCfg.label}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "1.25rem" }}>

        {/* Escalation signal */}
        {escCfg && escalation && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
              marginBottom: "1rem",
              padding: "0.75rem 1rem",
              border: `1px solid ${escCfg.color}30`,
              backgroundColor: `${escCfg.color}06`,
            }}
          >
            <AlertTriangle size={13} style={{ color: escCfg.color, flexShrink: 0, marginTop: "2px" }} />
            <div>
              <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.20em", textTransform: "uppercase" as const, color: escCfg.color, marginBottom: "0.25rem" }}>
                {escCfg.label}
              </p>
              <p style={{ fontSize: "0.84rem", lineHeight: 1.6, color: "rgba(255,255,255,0.65)" }}>
                {escalation.signal}
              </p>
            </div>
          </div>
        )}

        {/* Priority rationale */}
        {data.priorityRationale && (
          <p style={{ ...serif, fontSize: "0.95rem", lineHeight: 1.7, color: "rgba(255,255,255,0.72)", marginBottom: "1rem" }}>
            {data.priorityRationale}
          </p>
        )}

        {/* Recommendation */}
        {data.recommendation && (
          <div style={{ borderLeft: `2px solid ${tierCfg.border}`, paddingLeft: "1rem", marginBottom: "1rem" }}>
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.20em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.28)", marginBottom: "0.35rem" }}>
              Recommended action
            </p>
            <p style={{ fontSize: "0.88rem", lineHeight: 1.65, color: "rgba(255,255,255,0.72)" }}>
              {data.recommendation}
            </p>
          </div>
        )}

        {/* Financial exposure */}
        {showFinancial && data.financialExposure && (
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.06)",
              backgroundColor: "rgba(255,255,255,0.015)",
              padding: "1rem 1.25rem",
              marginTop: "0.5rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.85rem" }}>
              <DollarSign size={11} style={{ color: `${GOLD}70` }} />
              <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.30)" }}>
                Financial exposure estimate
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
              <div>
                <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.25)", marginBottom: "0.25rem" }}>
                  Total cost of delay
                </p>
                <p style={{ ...serif, fontSize: "1.3rem", color: tier === "CRITICAL" ? "rgba(252,165,165,0.85)" : "rgba(255,255,255,0.82)" }}>
                  {formatCurrency(data.financialExposure.totalCostOfDelay, data.financialExposure.currencyCode)}
                </p>
              </div>
              <div>
                <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.25)", marginBottom: "0.25rem" }}>
                  Weekly burn rate
                </p>
                <p style={{ ...serif, fontSize: "1.3rem", color: "rgba(255,255,255,0.75)" }}>
                  {formatCurrency(data.financialExposure.weeklyBurnRate, data.financialExposure.currencyCode)}/wk
                </p>
              </div>
              {data.weeksDelayed != null && data.weeksDelayed > 0 && (
                <div>
                  <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.25)", marginBottom: "0.25rem" }}>
                    Delay modelled
                  </p>
                  <p style={{ ...serif, fontSize: "1.3rem", color: "rgba(255,255,255,0.60)" }}>
                    {data.weeksDelayed} {data.weeksDelayed === 1 ? "week" : "weeks"}
                  </p>
                </div>
              )}
            </div>
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.18)", marginTop: "0.85rem", lineHeight: 1.6 }}>
              Scenario estimate only — not financial advice. Based on declared inputs. Actual figures may vary.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
