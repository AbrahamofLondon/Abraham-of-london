"use client";

/**
 * components/diagnostics/ERPreview.tsx
 *
 * Redacted Executive Report preview shown on the Fast Diagnostic result page.
 * Shows likely report sections, severity profile, top decision risks,
 * cost-of-delay teaser, and redacted recommendation blocks.
 * Does NOT reveal the full value before payment.
 */

import * as React from "react";
import { Lock, AlertTriangle, TrendingUp, Eye } from "lucide-react";

const GOLD = "#C9A96E";

type ERPreviewProps = {
  condition: string;
  conditionLabel: string;
  signalStrength: "low" | "moderate" | "high";
  topRisks: string[];
  costOfDelayTeaser?: string;
  onUnlock: () => void;
};

const ER_SECTIONS = [
  "Decision Authority Classification",
  "Governance Gap Analysis",
  "Institutional Signal Report",
  "Authority Posture Assessment",
  "Cost-of-Delay Calculation",
  "Decision Structure Mapping",
  "Recommended Intervention Path",
  "Board-Ready Summary",
];

function severityColor(level: string): string {
  switch (level) {
    case "high": return "rgba(239,68,68,0.85)";
    case "moderate": return "rgba(249,115,22,0.85)";
    default: return "rgba(110,231,183,0.70)";
  }
}

export default function ERPreview({
  condition,
  conditionLabel,
  signalStrength,
  topRisks,
  costOfDelayTeaser,
  onUnlock,
}: ERPreviewProps) {
  const isHigh = signalStrength === "high";
  const isModerate = signalStrength === "moderate";

  return (
    <div style={{
      border: `1px solid ${GOLD}25`,
      background: `${GOLD}04`,
      padding: "32px",
      maxWidth: "640px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <div style={{
          width: "32px", height: "32px", borderRadius: "50%",
          background: `${GOLD}12`, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Eye size={14} color={GOLD} />
        </div>
        <div>
          <p style={{ fontFamily: "'Courier New',monospace", fontSize: "9px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}80`, margin: 0 }}>
            Executive Report Preview
          </p>
          <p style={{ fontFamily: "'Courier New',monospace", fontSize: "8px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.30)", margin: "4px 0 0" }}>
            Redacted — full report available after purchase
          </p>
        </div>
      </div>

      {/* Severity profile */}
      <div style={{
        border: `1px solid ${severityColor(signalStrength)}30`,
        background: `${severityColor(signalStrength)}08`,
        padding: "16px", marginBottom: "24px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <AlertTriangle size={14} color={severityColor(signalStrength)} />
          <p style={{ fontFamily: "'Courier New',monospace", fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: severityColor(signalStrength), margin: 0 }}>
            {isHigh ? "High severity" : isModerate ? "Moderate severity" : "Low severity"} — {conditionLabel}
          </p>
        </div>
        <p style={{ fontFamily: "Georgia,serif", fontSize: "14px", lineHeight: 1.6, color: "rgba(255,255,255,0.55)", margin: 0 }}>
          {isHigh
            ? `Your ${conditionLabel} assessment returned a high signal. The decision structure shows evidence of active governance gaps that require a formal authority audit.`
            : isModerate
              ? `Your ${conditionLabel} assessment returned a moderate signal. The decision structure shows early indicators of governance drift.`
              : `Your ${conditionLabel} assessment returned a low signal. The decision structure appears stable.`}
        </p>
      </div>

      {/* Top decision risks */}
      <div style={{ marginBottom: "24px" }}>
        <p style={{ fontFamily: "'Courier New',monospace", fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: "12px" }}>
          Top Decision Risks
        </p>
        {topRisks.slice(0, 3).map((risk, i) => (
          <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "8px" }}>
            <span style={{ color: `${GOLD}55`, fontSize: "11px", marginTop: "1px" }}>◈</span>
            <p style={{ fontFamily: "Georgia,serif", fontSize: "13px", lineHeight: 1.5, color: "rgba(255,255,255,0.50)", margin: 0 }}>
              {risk}
            </p>
          </div>
        ))}
      </div>

      {/* Cost of delay teaser */}
      {costOfDelayTeaser && (
        <div style={{
          border: `1px solid rgba(249,115,22,0.20)`,
          background: "rgba(249,115,22,0.04)",
          padding: "14px 16px", marginBottom: "24px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <TrendingUp size={13} color="rgba(249,115,22,0.70)" />
            <p style={{ fontFamily: "'Courier New',monospace", fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(249,115,22,0.70)", margin: 0 }}>
              Cost of Delay
            </p>
          </div>
          <p style={{ fontFamily: "Georgia,serif", fontSize: "14px", lineHeight: 1.5, color: "rgba(255,255,255,0.55)", margin: 0 }}>
            {costOfDelayTeaser}
            <span style={{ fontFamily: "'Courier New',monospace", fontSize: "8px", color: "rgba(255,255,255,0.20)", marginLeft: "6px" }}>
              — scenario projection
            </span>
          </p>
        </div>
      )}

      {/* Report sections (redacted) */}
      <div style={{ marginBottom: "24px" }}>
        <p style={{ fontFamily: "'Courier New',monospace", fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: "12px" }}>
          Report Sections
        </p>
        {ER_SECTIONS.map((section, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", opacity: 0.5 }}>
            <Lock size={10} color="rgba(255,255,255,0.25)" />
            <p style={{ fontFamily: "'Courier New',monospace", fontSize: "10px", color: "rgba(255,255,255,0.40)", margin: 0 }}>
              {section}
            </p>
          </div>
        ))}
      </div>

      {/* Redacted recommendation block */}
      <div style={{
        border: `1px solid rgba(255,255,255,0.08)`,
        background: "rgba(255,255,255,0.015)",
        padding: "20px", marginBottom: "24px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <Lock size={12} color="rgba(255,255,255,0.25)" />
          <p style={{ fontFamily: "'Courier New',monospace", fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", margin: 0 }}>
            Recommendation (redacted)
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {[80, 60, 90, 45, 70].map((width, i) => (
            <div key={i} style={{
              height: "10px", width: `${width}%`,
              background: "rgba(255,255,255,0.06)", borderRadius: "2px",
            }} />
          ))}
        </div>
      </div>

      {/* Unlock CTA */}
      <button
        onClick={onUnlock}
        style={{
          width: "100%", padding: "16px", border: `1px solid ${GOLD}40`,
          background: `${GOLD}10`, color: `${GOLD}CC`,
          fontFamily: "'Courier New',monospace", fontSize: "10px",
          letterSpacing: "0.22em", textTransform: "uppercase",
          cursor: "pointer", transition: "all 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = `${GOLD}18`; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = `${GOLD}10`; }}
      >
        Unlock Full Executive Report — £295
      </button>
      <p style={{ fontFamily: "'Courier New',monospace", fontSize: "8px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.20)", textAlign: "center", margin: "10px 0 0" }}>
        One-time payment · No subscription · Immediate delivery
      </p>
    </div>
  );
}
