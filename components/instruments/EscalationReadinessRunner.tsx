/**
 * EscalationReadinessRunner — live scoring engine UI.
 * 5 escalation dimensions, each 0-10. Determines escalation readiness.
 */

import * as React from "react";
import { scoreEscalationReadiness, type EscalationDimension, type EscalationInput, type EscalationResult } from "@/lib/instruments/escalation-readiness-scorecard/engine";
import { track } from "@/lib/analytics/track";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

const DIMENSIONS: Array<{ key: EscalationDimension; label: string; helper: string }> = [
  { key: "evidenceDepth", label: "Evidence Depth", helper: "How much documented evidence supports the escalation case?" },
  { key: "consequenceSeverity", label: "Consequence Severity", helper: "How severe are the consequences of inaction?" },
  { key: "authorityClarity", label: "Authority Clarity", helper: "Is it clear who has the authority to act?" },
  { key: "executionBlockage", label: "Execution Blockage", helper: "How blocked is the current execution path?" },
  { key: "recurrenceSignal", label: "Recurrence Signal", helper: "Has this issue appeared before without resolution?" },
];

export default function EscalationReadinessRunner({ onComplete }: { onComplete: (result: EscalationResult) => void }) {
  const [scores, setScores] = React.useState<EscalationInput>({ evidenceDepth: 5, consequenceSeverity: 5, authorityClarity: 5, executionBlockage: 5, recurrenceSignal: 5 });

  const result = React.useMemo(() => scoreEscalationReadiness(scores), [scores]);

  function handleChange(dim: EscalationDimension, value: number) {
    setScores((prev) => ({ ...prev, [dim]: value }));
  }

  const bandColor = result.readinessBand === "OVERDUE" ? "rgba(252,165,165,0.70)" : result.readinessBand === "READY" ? "rgba(253,186,116,0.70)" : result.readinessBand === "APPROACHING" ? `${GOLD}CC` : "rgba(110,231,183,0.60)";

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>Escalation Readiness</span>
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "3rem", fontWeight: 300, lineHeight: 1, color: bandColor }}>{result.readinessScore}</div>
        </div>
        <div className="text-right">
          <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: bandColor }}>{result.readinessBand.replace(/_/g, " ")}</span>
          <p style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.30)", marginTop: "4px" }}>{result.recommendedEscalation.replace(/_/g, " ").toLowerCase()}</p>
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

      {result.blockers.length > 0 && (
        <div style={{ border: "1px solid rgba(252,165,165,0.15)", backgroundColor: "rgba(252,165,165,0.04)", padding: "0.75rem" }}>
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(252,165,165,0.50)" }}>Blockers</span>
          {result.blockers.map((b, i) => <p key={i} style={{ fontSize: "0.82rem", lineHeight: 1.6, color: "rgba(255,255,255,0.45)", marginTop: "0.25rem" }}>{b}</p>)}
        </div>
      )}

      <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}04`, padding: "1rem" }}>
        <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}55` }}>Assessment</span>
        <p style={{ fontSize: "0.88rem", lineHeight: 1.7, color: "rgba(255,255,255,0.60)", marginTop: "0.25rem" }}>{result.recommendation}</p>
      </div>

      <button
        type="button"
        onClick={() => { track("instrument_completed", { instrumentSlug: "escalation-readiness-scorecard", decisionState: result.readinessBand }); onComplete(result); }}
        style={{ width: "100%", padding: "14px", border: `1px solid ${GOLD}50`, backgroundColor: `${GOLD}10`, color: `${GOLD}CC`, ...mono, fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer" }}
      >
        Save result
      </button>

      <p style={{ ...mono, fontSize: "6px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.15)", textAlign: "center" }}>
        This is a readiness estimate based on your inputs. It is not independently verified.
      </p>
    </div>
  );
}
