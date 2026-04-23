/**
 * PredictiveConsequence — projected trajectory if condition remains unchanged.
 *
 * Shows 30/60/90 day degradation estimates with £ exposure.
 * This is the "what happens if you don't act" surface.
 */

import * as React from "react";
import type { ConsequenceProjection } from "@/lib/diagnostics/predictive-consequence";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

function severityColor(severity: string): string {
  if (severity === "critical") return "rgba(252,165,165,0.65)";
  if (severity === "high") return "rgba(253,186,116,0.60)";
  if (severity === "medium") return `${GOLD}AA`;
  return "rgba(255,255,255,0.35)";
}

const DIRECTION_CONFIG: Record<string, { label: string; color: string }> = {
  accelerating_degradation: { label: "ACCELERATING DEGRADATION", color: "rgba(252,165,165,0.75)" },
  degrading: { label: "PROJECTED DEGRADATION", color: "rgba(253,186,116,0.70)" },
  stable: { label: "PROJECTED STABLE", color: "rgba(255,255,255,0.45)" },
  improving: { label: "PROJECTED IMPROVEMENT", color: "rgba(110,231,183,0.65)" },
};

export default function PredictiveConsequence({ data }: { data: ConsequenceProjection | null }) {
  if (!data) return null;

  const config = DIRECTION_CONFIG[data.direction] ?? DIRECTION_CONFIG.stable!;

  return (
    <div style={{ border: `1px solid ${config.color}25`, backgroundColor: `${config.color}05`, padding: "1.25rem", marginBottom: "1rem" }}>
      <div className="flex items-center gap-3 mb-2">
        <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}70` }}>
          Predictive consequence
        </span>
        <span style={{ ...mono, fontSize: "6.5px", color: "rgba(255,255,255,0.18)" }}>
          {Math.round(data.confidence * 100)}% confidence
        </span>
      </div>

      <div className="mb-3">
        <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: config.color, fontWeight: 700 }}>
          {config.label}
        </span>
      </div>

      {data.estimatedExposure.quarterly > 0 && (
        <div style={{ border: "1px solid rgba(252,165,165,0.28)", backgroundColor: "rgba(252,165,165,0.045)", padding: "0.75rem", marginBottom: "0.75rem" }}>
          <span style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(252,165,165,0.68)" }}>
            Projected Cost of Inaction (90 days)
          </span>
          <div style={{ ...mono, fontSize: "18px", color: "rgba(252,165,165,0.88)", marginTop: "0.25rem", fontWeight: 700 }}>
            £{data.estimatedExposure.quarterly.toLocaleString()}
          </div>
        </div>
      )}

      {/* 30/60/90 trajectory */}
      <div className="grid gap-2 md:grid-cols-3 mb-3">
        {[
          { label: "30 days", data: data.trajectory.days30 },
          { label: "60 days", data: data.trajectory.days60 },
          { label: "90 days", data: data.trajectory.days90 },
        ].map((period) => (
          <div key={period.label} style={{ border: `1px solid ${severityColor(period.data.severity)}25`, padding: "0.65rem" }}>
            <div className="flex items-center justify-between">
              <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
                {period.label}
              </span>
              <span style={{ ...mono, fontSize: "8px", color: severityColor(period.data.severity) }}>
                -{period.data.degradation}pt
              </span>
            </div>
            <p style={{ ...serif, fontSize: "0.75rem", lineHeight: 1.45, color: "rgba(255,255,255,0.35)", marginTop: "0.2rem" }}>
              {period.data.description}
            </p>
          </div>
        ))}
      </div>

      {/* £ exposure */}
      {data.estimatedExposure.monthly > 0 && (
        <div style={{ border: `1px solid ${GOLD}15`, backgroundColor: `${GOLD}05`, padding: "0.65rem", marginBottom: "0.75rem" }}>
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}60` }}>
            Estimated financial exposure
          </span>
          <div className="flex gap-4 mt-1">
            <span style={{ ...mono, fontSize: "10px", color: `${GOLD}CC` }}>
              £{data.estimatedExposure.monthly.toLocaleString()}/month
            </span>
            <span style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.35)" }}>
              £{data.estimatedExposure.quarterly.toLocaleString()}/quarter
            </span>
          </div>
        </div>
      )}

      {/* Risk factors */}
      {data.riskFactors.length > 0 && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "0.5rem" }}>
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
            Risk factors
          </span>
          {data.riskFactors.map((f) => (
            <p key={f} style={{ ...serif, fontSize: "0.78rem", lineHeight: 1.5, color: "rgba(255,255,255,0.30)", marginTop: "0.1rem" }}>
              {f}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
