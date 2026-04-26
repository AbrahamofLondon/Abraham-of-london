/**
 * DecisionExposureRunner — live scoring engine UI.
 * 5 dimensions, each 0-10. Composite auto-calculates.
 */

import * as React from "react";
import { scoreExposure, type ExposureDimension, type ExposureInput, type ExposureResult } from "@/lib/instruments/decision-exposure/engine";
import { track } from "@/lib/analytics/track";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

const DIMENSIONS: Array<{ key: ExposureDimension; label: string; helper: string }> = [
  { key: "financial", label: "Financial Exposure", helper: "How much is this costing in revenue, margin, or capital?" },
  { key: "operational", label: "Operational Disruption", helper: "How much is daily execution affected?" },
  { key: "reputational", label: "Reputational Risk", helper: "Is trust, brand, or external perception at stake?" },
  { key: "strategic", label: "Strategic Misalignment", helper: "Does this decision affect long-term direction?" },
  { key: "temporal", label: "Time Pressure", helper: "How urgently must this be resolved?" },
];

export default function DecisionExposureRunner({ costAnchor, onComplete }: { costAnchor?: number; onComplete: (result: ExposureResult) => void }) {
  const [scores, setScores] = React.useState<ExposureInput>({ financial: 5, operational: 5, reputational: 5, strategic: 5, temporal: 5 });

  const result = React.useMemo(() => scoreExposure(scores, costAnchor), [scores, costAnchor]);

  function handleChange(dim: ExposureDimension, value: number) {
    setScores((prev) => ({ ...prev, [dim]: value }));
  }

  const bandColor = result.exposureBand === "CRITICAL" ? "rgba(252,165,165,0.70)" : result.exposureBand === "HIGH" ? "rgba(253,186,116,0.70)" : result.exposureBand === "MODERATE" ? `${GOLD}CC` : "rgba(110,231,183,0.60)";

  return (
    <div className="space-y-6">
      {/* Live score */}
      <div className="flex items-baseline justify-between">
        <div>
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>Exposure Score</span>
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "3rem", fontWeight: 300, lineHeight: 1, color: bandColor }}>{result.exposureScore}</div>
        </div>
        <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: bandColor }}>{result.exposureBand}</span>
      </div>

      {/* Dimension inputs */}
      {DIMENSIONS.map((dim) => (
        <div key={dim.key}>
          <div className="flex items-baseline justify-between mb-1">
            <label style={{ ...mono, fontSize: "7px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>{dim.label}</label>
            <span style={{ ...mono, fontSize: "11px", color: "rgba(255,255,255,0.50)" }}>{scores[dim.key]}/10</span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={scores[dim.key]}
            onChange={(e) => handleChange(dim.key, parseInt(e.target.value))}
            className="w-full"
            style={{ accentColor: GOLD }}
          />
          <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.20)", marginTop: "2px" }}>{dim.helper}</p>
        </div>
      ))}

      {/* Result */}
      <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}04`, padding: "1rem" }}>
        <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}55` }}>Assessment</span>
        <p style={{ fontSize: "0.88rem", lineHeight: 1.7, color: "rgba(255,255,255,0.60)", marginTop: "0.25rem" }}>{result.recommendation}</p>
        {result.projectedMonthlyCost !== null && (
          <p style={{ ...mono, fontSize: "8px", color: "rgba(255,255,255,0.30)", marginTop: "0.5rem" }}>
            Projected monthly exposure: £{result.projectedMonthlyCost.toLocaleString()}
          </p>
        )}
      </div>

      {/* Complete */}
      <button
        type="button"
        onClick={() => { track("instrument_completed", { instrumentSlug: "decision-exposure-instrument", scoreBand: result.exposureBand }); onComplete(result); }}
        style={{ width: "100%", padding: "14px", border: `1px solid ${GOLD}50`, backgroundColor: `${GOLD}10`, color: `${GOLD}CC`, ...mono, fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer" }}
      >
        Save result
      </button>

      <p style={{ ...mono, fontSize: "6px", color: "rgba(255,255,255,0.10)", textAlign: "center" }}>
        Deterministic · Same input → same output · v{result.version}
      </p>
    </div>
  );
}
