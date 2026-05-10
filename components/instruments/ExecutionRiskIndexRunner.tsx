/**
 * ExecutionRiskIndexRunner — live execution risk scoring UI.
 * 8 execution factors, each 0-10.
 */

import * as React from "react";
import { scoreExecutionRisk, type ExecutionFactor, type ExecutionRiskInput, type ExecutionRiskResult } from "@/lib/instruments/execution-risk-index/engine";
import { track } from "@/lib/analytics/track";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

const FACTORS: Array<{ key: ExecutionFactor; label: string; helper: string }> = [
  { key: "ownerClarity", label: "Owner Clarity", helper: "Is the decision owner clearly identified and empowered?" },
  { key: "resourceAvailability", label: "Resource Availability", helper: "Are the resources required for execution actually available?" },
  { key: "timelineRealism", label: "Timeline Realism", helper: "Is the execution timeline realistic given constraints?" },
  { key: "dependencyRisk", label: "Dependency Management", helper: "Are critical dependencies identified and managed?" },
  { key: "stakeholderBuyIn", label: "Stakeholder Buy-in", helper: "Do key stakeholders genuinely support execution?" },
  { key: "priorFailureHistory", label: "Prior Success Record", helper: "Has this type of execution succeeded before in this context?" },
  { key: "consequenceVisibility", label: "Consequence Visibility", helper: "Are the consequences of failure clearly understood?" },
  { key: "escalationReadiness", label: "Escalation Readiness", helper: "Is the escalation path clear if execution fails?" },
];

export default function ExecutionRiskIndexRunner({ onComplete }: { onComplete: (result: ExecutionRiskResult) => void }) {
  const [scores, setScores] = React.useState<ExecutionRiskInput>({ ownerClarity: 5, resourceAvailability: 5, timelineRealism: 5, dependencyRisk: 5, stakeholderBuyIn: 5, priorFailureHistory: 5, consequenceVisibility: 5, escalationReadiness: 5 });

  const result = React.useMemo(() => scoreExecutionRisk(scores), [scores]);

  function handleChange(factor: ExecutionFactor, value: number) {
    setScores((prev) => ({ ...prev, [factor]: value }));
  }

  const riskColor = result.riskBand === "CRITICAL" ? "rgba(252,165,165,0.70)" : result.riskBand === "HIGH" ? "rgba(253,186,116,0.70)" : result.riskBand === "MODERATE" ? `${GOLD}CC` : "rgba(110,231,183,0.60)";

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>Execution Risk Index</span>
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "3rem", fontWeight: 300, lineHeight: 1, color: riskColor }}>{result.riskIndex}</div>
        </div>
        <div className="text-right">
          <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: riskColor }}>{result.riskBand}</span>
          {result.authorityGap && <p style={{ ...mono, fontSize: "7px", color: "rgba(252,165,165,0.50)", marginTop: "4px" }}>Authority gap detected</p>}
        </div>
      </div>

      {FACTORS.map((f) => (
        <div key={f.key}>
          <div className="flex items-baseline justify-between mb-1">
            <label style={{ ...mono, fontSize: "7px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>{f.label}</label>
            <span style={{ ...mono, fontSize: "11px", color: "rgba(255,255,255,0.50)" }}>{scores[f.key]}/10</span>
          </div>
          <input type="range" min={0} max={10} step={1} value={scores[f.key]} onChange={(e) => handleChange(f.key, parseInt(e.target.value))} className="w-full" style={{ accentColor: GOLD }} />
          <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.20)", marginTop: "2px" }}>{f.helper}</p>
        </div>
      ))}

      <div style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)", padding: "0.75rem" }}>
        <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>Decay Projection</span>
        <p style={{ fontSize: "0.82rem", lineHeight: 1.6, color: "rgba(255,255,255,0.50)", marginTop: "0.25rem" }}>{result.decayProjection}</p>
      </div>

      <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}04`, padding: "1rem" }}>
        <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}55` }}>Assessment</span>
        <p style={{ fontSize: "0.88rem", lineHeight: 1.7, color: "rgba(255,255,255,0.60)", marginTop: "0.25rem" }}>{result.recommendation}</p>
        <p style={{ fontSize: "0.78rem", lineHeight: 1.6, color: "rgba(255,255,255,0.35)", marginTop: "0.5rem" }}>{result.executionVulnerability}</p>
      </div>

      <button
        type="button"
        onClick={() => { track("instrument_completed", { instrumentSlug: "execution-risk-index", decisionState: result.riskBand }); onComplete(result); }}
        style={{ width: "100%", padding: "14px", border: `1px solid ${GOLD}50`, backgroundColor: `${GOLD}10`, color: `${GOLD}CC`, ...mono, fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer" }}
      >
        Save result
      </button>

      <p style={{ ...mono, fontSize: "6px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.15)", textAlign: "center" }}>
        This is an execution risk estimate based on your inputs. It is not independently verified.
      </p>
    </div>
  );
}
