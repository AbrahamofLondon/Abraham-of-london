/**
 * StructuralFailureCanvasRunner — live structural health scoring UI.
 * 6 structural dimensions, each 0-10.
 */

import * as React from "react";
import { scoreStructuralFailure, type FailureDimension, type FailureInput, type FailureResult } from "@/lib/instruments/structural-failure-diagnostic-canvas/engine";
import { track } from "@/lib/analytics/track";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

const DIMENSIONS: Array<{ key: FailureDimension; label: string; helper: string }> = [
  { key: "strategyClarity", label: "Strategy Clarity", helper: "How clearly is the strategic direction defined and communicated?" },
  { key: "operationalExecution", label: "Operational Execution", helper: "How effectively is daily execution aligned with strategic intent?" },
  { key: "authorityStructure", label: "Authority Structure", helper: "Is decision authority clear, delegated, and respected?" },
  { key: "resourceAllocation", label: "Resource Allocation", helper: "Are resources allocated to match stated priorities?" },
  { key: "governanceIntegrity", label: "Governance Integrity", helper: "Do governance processes enforce accountability and standards?" },
  { key: "stakeholderAlignment", label: "Stakeholder Alignment", helper: "Are key stakeholders aligned on direction and trade-offs?" },
];

export default function StructuralFailureCanvasRunner({ onComplete }: { onComplete: (result: FailureResult) => void }) {
  const [scores, setScores] = React.useState<FailureInput>({ strategyClarity: 5, operationalExecution: 5, authorityStructure: 5, resourceAllocation: 5, governanceIntegrity: 5, stakeholderAlignment: 5 });

  const result = React.useMemo(() => scoreStructuralFailure(scores), [scores]);

  function handleChange(dim: FailureDimension, value: number) {
    setScores((prev) => ({ ...prev, [dim]: value }));
  }

  const healthColor = result.healthScore >= 70 ? "rgba(110,231,183,0.60)" : result.healthScore >= 45 ? `${GOLD}CC` : result.healthScore >= 25 ? "rgba(253,186,116,0.70)" : "rgba(252,165,165,0.70)";

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>Structural Health</span>
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "3rem", fontWeight: 300, lineHeight: 1, color: healthColor }}>{result.healthScore}</div>
        </div>
        <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: healthColor }}>{result.failurePattern.replace(/_/g, " ")}</span>
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
        <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>Root Cause</span>
        <p style={{ fontSize: "0.82rem", lineHeight: 1.6, color: "rgba(255,255,255,0.50)", marginTop: "0.25rem" }}>{result.rootCause}</p>
      </div>

      <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}04`, padding: "1rem" }}>
        <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}55` }}>Assessment</span>
        <p style={{ fontSize: "0.88rem", lineHeight: 1.7, color: "rgba(255,255,255,0.60)", marginTop: "0.25rem" }}>{result.recommendation}</p>
        <p style={{ fontSize: "0.78rem", lineHeight: 1.6, color: "rgba(255,255,255,0.35)", marginTop: "0.5rem" }}>{result.repairPath}</p>
      </div>

      <button
        type="button"
        onClick={() => { track("instrument_completed", { instrumentSlug: "structural-failure-diagnostic-canvas", decisionState: result.failurePattern }); onComplete(result); }}
        style={{ width: "100%", padding: "14px", border: `1px solid ${GOLD}50`, backgroundColor: `${GOLD}10`, color: `${GOLD}CC`, ...mono, fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer" }}
      >
        Save result
      </button>

      <p style={{ ...mono, fontSize: "6px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.15)", textAlign: "center" }}>
        This is a structural health estimate based on your inputs. It is not independently verified.
      </p>
    </div>
  );
}
