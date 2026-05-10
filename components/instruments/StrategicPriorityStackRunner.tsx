/**
 * StrategicPriorityStackRunner — interactive priority ranking UI.
 * Users add up to 6 competing priorities with dimensions, system ranks them.
 */

import * as React from "react";
import { buildPriorityStack, type PriorityItem, type PriorityStackResult } from "@/lib/instruments/strategic-priority-stack-builder/engine";
import { track } from "@/lib/analytics/track";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

function emptyPriority(): PriorityItem {
  return { label: "", strategicImportance: 5, urgency: 5, resourceDemand: 5, consequenceIfDelayed: 5, authorityClarity: 5 };
}

export default function StrategicPriorityStackRunner({ onComplete }: { onComplete: (result: PriorityStackResult) => void }) {
  const [priorities, setPriorities] = React.useState<PriorityItem[]>([emptyPriority(), emptyPriority()]);
  const validPriorities = priorities.filter((p) => p.label.trim());
  const result = React.useMemo(() => buildPriorityStack(validPriorities), [validPriorities]);

  function addPriority() { if (priorities.length < 6) setPriorities((p) => [...p, emptyPriority()]); }
  function updateLabel(i: number, label: string) { setPriorities((p) => p.map((item, idx) => idx === i ? { ...item, label } : item)); }
  function updateDim(i: number, key: keyof Omit<PriorityItem, "label">, value: number) { setPriorities((p) => p.map((item, idx) => idx === i ? { ...item, [key]: value } : item)); }

  const pressureColor = result.resourcePressureBand === "CRITICAL" ? "rgba(252,165,165,0.70)" : result.resourcePressureBand === "HIGH" ? "rgba(253,186,116,0.70)" : result.resourcePressureBand === "MODERATE" ? `${GOLD}CC` : "rgba(110,231,183,0.60)";

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>Priority Stack</span>
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "2rem", fontWeight: 300, lineHeight: 1, color: "white" }}>{validPriorities.length} priorities</div>
        </div>
        <div className="text-right">
          <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: pressureColor }}>Resource: {result.resourcePressureBand}</span>
          {result.conflicts.length > 0 && <p style={{ ...mono, fontSize: "7px", color: "rgba(252,165,165,0.50)", marginTop: "4px" }}>{result.conflicts.length} conflict{result.conflicts.length !== 1 ? "s" : ""}</p>}
        </div>
      </div>

      {priorities.map((p, i) => (
        <div key={i} style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "0.75rem" }}>
          <input type="text" value={p.label} onChange={(e) => updateLabel(i, e.target.value)} placeholder={`Priority ${i + 1}...`} className="w-full border-0 bg-transparent text-sm text-white/70 placeholder:text-white/20 focus:outline-none" style={{ marginBottom: "0.5rem" }} />
          {p.label.trim() && (
            <div className="grid grid-cols-5 gap-2">
              {([
                ["strategicImportance", "Importance"],
                ["urgency", "Urgency"],
                ["resourceDemand", "Resources"],
                ["consequenceIfDelayed", "Consequence"],
                ["authorityClarity", "Authority"],
              ] as const).map(([key, label]) => (
                <div key={key}>
                  <span style={{ ...mono, fontSize: "6px", color: "rgba(255,255,255,0.25)" }}>{label}</span>
                  <input type="range" min={0} max={10} step={1} value={p[key]} onChange={(e) => updateDim(i, key, parseInt(e.target.value))} className="w-full" style={{ accentColor: GOLD }} />
                  <span style={{ ...mono, fontSize: "9px", color: "rgba(255,255,255,0.40)", display: "block", textAlign: "center" }}>{p[key]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {priorities.length < 6 && (
        <button onClick={addPriority} style={{ width: "100%", padding: "10px", border: "1px dashed rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.25)", ...mono, fontSize: "8px", cursor: "pointer", backgroundColor: "transparent" }}>+ Add priority</button>
      )}

      {result.stack.length >= 2 && (
        <>
          <div style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)", padding: "0.75rem" }}>
            <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>Governed Ranking</span>
            {result.stack.map((item) => (
              <div key={item.rank} className="flex items-baseline gap-3 mt-2">
                <span style={{ ...mono, fontSize: "14px", color: item.rank === 1 ? `${GOLD}CC` : "rgba(255,255,255,0.30)" }}>{item.rank}</span>
                <div>
                  <p className="text-sm text-white/65">{item.label}</p>
                  <p style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.25)" }}>Score: {item.compositeScore} · {item.deferralRisk}</p>
                </div>
              </div>
            ))}
          </div>
          {result.conflicts.length > 0 && (
            <div style={{ border: "1px solid rgba(252,165,165,0.15)", backgroundColor: "rgba(252,165,165,0.04)", padding: "0.75rem" }}>
              <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(252,165,165,0.50)" }}>Conflicts</span>
              {result.conflicts.map((c, i) => <p key={i} style={{ fontSize: "0.78rem", lineHeight: 1.6, color: "rgba(255,255,255,0.45)", marginTop: "0.25rem" }}>{c.explanation}</p>)}
            </div>
          )}
          <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}04`, padding: "1rem" }}>
            <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}55` }}>Assessment</span>
            <p style={{ fontSize: "0.88rem", lineHeight: 1.7, color: "rgba(255,255,255,0.60)", marginTop: "0.25rem" }}>{result.recommendation}</p>
          </div>
          <button type="button" onClick={() => { track("instrument_completed", { instrumentSlug: "strategic-priority-stack-builder", decisionState: result.resourcePressureBand }); onComplete(result); }} style={{ width: "100%", padding: "14px", border: `1px solid ${GOLD}50`, backgroundColor: `${GOLD}10`, color: `${GOLD}CC`, ...mono, fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer" }}>Save result</button>
        </>
      )}
      <p style={{ ...mono, fontSize: "6px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.15)", textAlign: "center" }}>Priority ranking is based on your inputs. It is not independently verified.</p>
    </div>
  );
}
