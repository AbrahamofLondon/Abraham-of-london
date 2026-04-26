/**
 * InterventionPathRunner — routing enforcement engine UI.
 */

import * as React from "react";
import { selectInterventionPath, type InterventionInput, type InterventionResult } from "@/lib/instruments/intervention-path/engine";
import { track } from "@/lib/analytics/track";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

const DIMS: Array<{ key: keyof InterventionInput; label: string; helper: string }> = [
  { key: "severity", label: "Severity", helper: "How serious is the current condition?" },
  { key: "urgency", label: "Urgency", helper: "How soon must this be resolved?" },
  { key: "authorityClarity", label: "Authority Clarity", helper: "How clear is decision ownership?" },
  { key: "failureHistory", label: "Failure History", helper: "How many prior correction attempts failed?" },
  { key: "costExposure", label: "Cost Exposure", helper: "How materially costly is inaction?" },
  { key: "stakeholderAlignment", label: "Stakeholder Alignment", helper: "How aligned are key stakeholders?" },
];

export default function InterventionPathRunner({ onComplete }: { onComplete: (result: InterventionResult) => void }) {
  const [input, setInput] = React.useState<InterventionInput>({ severity: 5, urgency: 5, authorityClarity: 5, failureHistory: 3, costExposure: 5, stakeholderAlignment: 5 });

  const result = React.useMemo(() => selectInterventionPath(input), [input]);

  const pathColor: Record<string, string> = {
    ESCALATE: "rgba(252,165,165,0.70)", RESTRUCTURE: "rgba(253,186,116,0.70)",
    STABILISE: `${GOLD}CC`, MONITOR: "rgba(110,231,183,0.60)", REJECT: "rgba(252,165,165,0.80)",
  };

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between mb-2">
        <div>
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>Recommended Path</span>
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "2rem", fontWeight: 300, lineHeight: 1.2, color: pathColor[result.recommendedPath] ?? GOLD }}>
            {result.recommendedPath}
          </div>
        </div>
        <span style={{ ...mono, fontSize: "8px", color: "rgba(255,255,255,0.25)" }}>composite: {result.composite}</span>
      </div>

      {result.executionBlocked && (
        <div style={{ border: "1px solid rgba(252,165,165,0.30)", backgroundColor: "rgba(252,165,165,0.05)", padding: "0.75rem" }}>
          <p style={{ fontSize: "0.88rem", color: "rgba(252,165,165,0.70)", fontWeight: 500 }}>{result.blockReason}</p>
        </div>
      )}

      {DIMS.map((dim) => (
        <div key={dim.key}>
          <div className="flex items-baseline justify-between mb-1">
            <label style={{ ...mono, fontSize: "7px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>{dim.label}</label>
            <span style={{ ...mono, fontSize: "11px", color: "rgba(255,255,255,0.50)" }}>{input[dim.key]}/10</span>
          </div>
          <input type="range" min={0} max={10} step={1} value={input[dim.key]} onChange={(e) => setInput((prev) => ({ ...prev, [dim.key]: parseInt(e.target.value) }))} className="w-full" style={{ accentColor: GOLD }} />
          <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.20)", marginTop: "2px" }}>{dim.helper}</p>
        </div>
      ))}

      {/* Rationale */}
      <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}04`, padding: "1rem" }}>
        {result.rationale.map((r, i) => <p key={i} style={{ fontSize: "0.85rem", lineHeight: 1.7, color: "rgba(255,255,255,0.55)" }}>{r}</p>)}
      </div>

      {/* Rejected paths */}
      {result.rejectedPaths.length > 0 && (
        <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "0.75rem" }}>
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>Rejected alternatives</span>
          {result.rejectedPaths.map((rp, i) => (
            <p key={i} style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.25)", marginTop: "2px" }}>
              <span style={{ color: "rgba(255,255,255,0.40)" }}>{rp.path}:</span> {rp.reason}
            </p>
          ))}
        </div>
      )}

      <button type="button" onClick={() => { track("instrument_completed", { instrumentSlug: "intervention-path-selector", path: result.recommendedPath }); onComplete(result); }}
        style={{ width: "100%", padding: "14px", border: `1px solid ${GOLD}50`, backgroundColor: `${GOLD}10`, color: `${GOLD}CC`, ...mono, fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer" }}>
        Save result
      </button>
    </div>
  );
}
