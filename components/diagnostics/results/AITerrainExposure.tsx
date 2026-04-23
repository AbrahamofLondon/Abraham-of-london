/**
 * AITerrainExposure — AI-accelerated competitive gap surface.
 *
 * Shows: classification, decision velocity vs baseline, projected gap 30/60/90.
 * This is survival condition intelligence, not AI readiness.
 */

import * as React from "react";
import type { AITerrainAssessment } from "@/lib/diagnostics/ai-terrain";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

const CLASS_CONFIG: Record<string, { label: string; color: string }> = {
  AI_LAG: { label: "AI LAG", color: "rgba(252,165,165,0.75)" },
  AI_MISUSE: { label: "AI MISUSE", color: "rgba(253,186,116,0.70)" },
  AI_FRAGMENTED: { label: "AI FRAGMENTED", color: `${GOLD}CC` },
  AI_DEPENDENT: { label: "AI DEPENDENT", color: "rgba(253,186,116,0.65)" },
  AI_GOVERNED: { label: "AI GOVERNED", color: "rgba(110,231,183,0.65)" },
};

function severityColor(s: string): string {
  if (s === "critical") return "rgba(252,165,165,0.65)";
  if (s === "high") return "rgba(253,186,116,0.60)";
  if (s === "medium") return `${GOLD}AA`;
  return "rgba(255,255,255,0.35)";
}

export default function AITerrainExposure({ data }: { data: AITerrainAssessment | null }) {
  if (!data) return null;

  const config = CLASS_CONFIG[data.classification] ?? CLASS_CONFIG.AI_LAG!;

  return (
    <div style={{ border: `1px solid ${config.color}25`, backgroundColor: `${config.color}05`, padding: "1.25rem", marginBottom: "1rem" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}70` }}>
          AI terrain exposure
        </span>
      </div>

      {/* Classification */}
      <div className="flex items-center gap-3 mb-3">
        <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: config.color, fontWeight: 700 }}>
          {config.label}
        </span>
        <span style={{ ...mono, fontSize: "7px", color: severityColor(data.exposureLevel.toLowerCase()), fontWeight: 600 }}>
          {data.exposureLevel} EXPOSURE
        </span>
      </div>

      {/* Directive */}
      <p style={{ ...serif, fontSize: "0.88rem", lineHeight: 1.55, color: "rgba(255,255,255,0.50)", marginBottom: "0.75rem" }}>
        {data.directive}
      </p>

      {/* Decision velocity */}
      <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "0.65rem", marginBottom: "0.75rem" }}>
        <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
          Decision velocity
        </span>
        <div className="flex gap-4 mt-1">
          <div>
            <span style={{ ...mono, fontSize: "6px", color: "rgba(255,255,255,0.18)" }}>Current</span>
            <div style={{ ...mono, fontSize: "12px", color: data.decisionVelocity.gapPercent > 50 ? "rgba(252,165,165,0.65)" : "rgba(255,255,255,0.50)" }}>
              {data.decisionVelocity.current}d
            </div>
          </div>
          <div>
            <span style={{ ...mono, fontSize: "6px", color: "rgba(255,255,255,0.18)" }}>AI baseline</span>
            <div style={{ ...mono, fontSize: "12px", color: "rgba(110,231,183,0.50)" }}>
              {data.decisionVelocity.baseline}d
            </div>
          </div>
          <div>
            <span style={{ ...mono, fontSize: "6px", color: "rgba(255,255,255,0.18)" }}>Gap</span>
            <div style={{ ...mono, fontSize: "12px", color: "rgba(252,165,165,0.60)" }}>
              +{data.decisionVelocity.gap}d ({data.decisionVelocity.gapPercent}% slower)
            </div>
          </div>
        </div>
      </div>

      {/* Competitive gap projection */}
      <div className="grid gap-2 md:grid-cols-3 mb-3">
        {[
          { label: "30 days", data: data.competitiveGap.days30 },
          { label: "60 days", data: data.competitiveGap.days60 },
          { label: "90 days", data: data.competitiveGap.days90 },
        ].map((period) => (
          <div key={period.label} style={{ border: `1px solid ${severityColor(period.data.severity)}25`, padding: "0.65rem" }}>
            <div className="flex items-center justify-between">
              <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
                {period.label}
              </span>
              <span style={{ ...mono, fontSize: "7px", textTransform: "uppercase", color: severityColor(period.data.severity) }}>
                {period.data.severity}
              </span>
            </div>
            <p style={{ ...serif, fontSize: "0.75rem", lineHeight: 1.45, color: "rgba(255,255,255,0.35)", marginTop: "0.2rem" }}>
              {period.data.description}
            </p>
          </div>
        ))}
      </div>

      {/* Acceleration + compounding */}
      <div className="flex gap-4 mb-3">
        <div style={{ border: `1px solid ${GOLD}15`, padding: "0.5rem 0.65rem" }}>
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>
            Acceleration factor
          </span>
          <div style={{ ...mono, fontSize: "11px", color: `${GOLD}CC`, marginTop: "2px" }}>
            {data.accelerationFactor}x
          </div>
        </div>
        <div style={{ border: `1px solid ${GOLD}15`, padding: "0.5rem 0.65rem" }}>
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>
            Monthly compounding
          </span>
          <div style={{ ...mono, fontSize: "11px", color: "rgba(252,165,165,0.60)", marginTop: "2px" }}>
            +{data.compoundingEffect}%
          </div>
        </div>
      </div>

      {/* Risk factors */}
      {data.riskFactors.length > 0 && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "0.5rem" }}>
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
            AI terrain risk factors
          </span>
          {data.riskFactors.map((f) => (
            <p key={f} style={{ ...serif, fontSize: "0.78rem", lineHeight: 1.5, color: "rgba(255,255,255,0.30)", marginTop: "0.1rem" }}>
              {f}
            </p>
          ))}
        </div>
      )}

      {/* Evaluation context */}
      <p style={{ ...mono, fontSize: "6.5px", color: "rgba(255,255,255,0.15)", marginTop: "0.75rem" }}>
        This decision is being evaluated against an AI-accelerated market baseline.
      </p>
    </div>
  );
}
