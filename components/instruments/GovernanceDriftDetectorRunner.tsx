/**
 * GovernanceDriftDetectorRunner — live governance drift scoring UI.
 * 6 governance health dimensions, each 0-10.
 */

import * as React from "react";
import { scoreGovernanceDrift, type DriftDimension, type DriftInput, type DriftResult } from "@/lib/instruments/governance-drift-detector/engine";
import { track } from "@/lib/analytics/track";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

const DIMENSIONS: Array<{ key: DriftDimension; label: string; helper: string }> = [
  { key: "decisionCadence", label: "Decision Cadence", helper: "Are decisions being reviewed at the declared frequency?" },
  { key: "reviewDiscipline", label: "Review Discipline", helper: "Are reviews following the governance standard, or becoming perfunctory?" },
  { key: "escalationBehaviour", label: "Escalation Behaviour", helper: "Are issues being escalated when they should be, or absorbed silently?" },
  { key: "accountabilityClarity", label: "Accountability Clarity", helper: "Is it clear who is accountable for each decision outcome?" },
  { key: "evidenceQuality", label: "Evidence Quality", helper: "Is decision evidence getting stronger or weaker over time?" },
  { key: "followThroughConsistency", label: "Follow-through", helper: "Are commitments being tracked and executed, or forgotten?" },
];

export default function GovernanceDriftDetectorRunner({ onComplete }: { onComplete: (result: DriftResult) => void }) {
  const [scores, setScores] = React.useState<DriftInput>({ decisionCadence: 5, reviewDiscipline: 5, escalationBehaviour: 5, accountabilityClarity: 5, evidenceQuality: 5, followThroughConsistency: 5 });
  const result = React.useMemo(() => scoreGovernanceDrift(scores), [scores]);

  function handleChange(dim: DriftDimension, value: number) { setScores((prev) => ({ ...prev, [dim]: value })); }
  const driftColor = result.driftBand === "CRITICAL" ? "rgba(252,165,165,0.70)" : result.driftBand === "DRIFTING" ? "rgba(253,186,116,0.70)" : result.driftBand === "WATCH" ? `${GOLD}CC` : "rgba(110,231,183,0.60)";

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>Governance Drift</span>
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "3rem", fontWeight: 300, lineHeight: 1, color: driftColor }}>{result.driftScore}</div>
        </div>
        <div className="text-right">
          <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: driftColor }}>{result.driftBand}</span>
          <p style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.30)", marginTop: "4px" }}>{result.driftPattern.replace(/_/g, " ").toLowerCase()}</p>
        </div>
      </div>
      {DIMENSIONS.map((dim) => (
        <div key={dim.key}>
          <div className="flex items-baseline justify-between mb-1">
            <label style={{ ...mono, fontSize: "7px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>{dim.label}</label>
            <span style={{ ...mono, fontSize: "11px", color: "rgba(255,255,255,0.50)" }}>{scores[dim.key]}/10</span>
          </div>
          <input type="range" min={0} max={10} step={1} value={scores[dim.key]} onChange={(e) => handleChange(dim.key, parseInt(e.target.value))} className="w-full" style={{ accentColor: GOLD }} />
          <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.20)", marginTop: "2px" }}>{dim.helper}</p>
        </div>
      ))}
      <div style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)", padding: "0.75rem" }}>
        <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>Cadence Risk</span>
        <p style={{ fontSize: "0.82rem", lineHeight: 1.6, color: "rgba(255,255,255,0.50)", marginTop: "0.25rem" }}>{result.cadenceRisk}</p>
      </div>
      <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}04`, padding: "1rem" }}>
        <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}55` }}>Assessment</span>
        <p style={{ fontSize: "0.88rem", lineHeight: 1.7, color: "rgba(255,255,255,0.60)", marginTop: "0.25rem" }}>{result.recommendation}</p>
        <p style={{ fontSize: "0.78rem", lineHeight: 1.6, color: "rgba(255,255,255,0.35)", marginTop: "0.5rem" }}>{result.nextReviewRecommendation}</p>
      </div>
      <button type="button" onClick={() => { track("instrument_completed", { instrumentSlug: "governance-drift-detector", decisionState: result.driftBand }); onComplete(result); }} style={{ width: "100%", padding: "14px", border: `1px solid ${GOLD}50`, backgroundColor: `${GOLD}10`, color: `${GOLD}CC`, ...mono, fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer" }}>Save result</button>
      <p style={{ ...mono, fontSize: "6px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.15)", textAlign: "center" }}>This is a governance drift estimate based on your inputs. It is not independently verified.</p>
    </div>
  );
}
