"use client";

import * as React from "react";
import type { SovereignSignalPublicSummary } from "@/lib/sovereign/sovereign-signal-public-dto";
import IntelligenceSignalCard from "./IntelligenceSignalCard";

const MONO: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

type Props = {
  signals: SovereignSignalPublicSummary[];
  summary?: string;
  /** Expand the first (highest-severity) signal by default. */
  expandFirst?: boolean;
  /** Label shown above the panel. */
  label?: string;
};

export default function IntelligenceSignalPanel({
  signals,
  summary,
  expandFirst = true,
  label = "Intelligence signals",
}: Props) {
  if (signals.length === 0) {
    return (
      <div>
        <p style={{ ...MONO, fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#555", marginBottom: "12px" }}>
          {label}
        </p>
        <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "18px 20px" }}>
          <p style={{ fontSize: "13px", lineHeight: 1.65, color: "rgba(255,255,255,0.30)" }}>
            No active intelligence signals detected. Your diagnostic profile does not currently match any named risk patterns in the dataset.
          </p>
        </div>
      </div>
    );
  }

  const critical = signals.filter((s) => s.severityBand === "CRITICAL").length;
  const alerts = signals.filter((s) => s.severityBand === "ALERT").length;

  return (
    <div>
      {/* ── Label + counts ─────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
        <p style={{ ...MONO, fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#555", margin: 0 }}>
          {label}
        </p>
        <div style={{ display: "flex", gap: "12px" }}>
          {critical > 0 && (
            <span style={{ ...MONO, fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(252,165,165,0.60)" }}>
              {critical} critical
            </span>
          )}
          {alerts > 0 && (
            <span style={{ ...MONO, fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(201,169,110,0.55)" }}>
              {alerts} alert
            </span>
          )}
          <span style={{ ...MONO, fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)" }}>
            {signals.length} total
          </span>
        </div>
      </div>

      {/* ── Summary line ────────────────────────────────────── */}
      {summary && (
        <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.45)", marginBottom: "16px" }}>
          {summary}
        </p>
      )}

      {/* ── Signal cards ────────────────────────────────────── */}
      <div style={{ display: "grid", gap: "10px" }}>
        {signals.map((signal, i) => (
          <IntelligenceSignalCard
            key={signal.signalId}
            signal={signal}
            expanded={expandFirst && i === 0}
          />
        ))}
      </div>
    </div>
  );
}
