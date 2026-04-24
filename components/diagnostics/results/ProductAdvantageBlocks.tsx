/**
 * ProductAdvantageBlocks — capabilities that must exist in the full product
 * at EQUAL OR GREATER strength than the demo.
 *
 * Renders: cost-of-delay + scenario stress-test + behavioural divergence.
 * Shared across all 4 full assessments.
 */

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { computeCostOfDelay, type CostOfDelayResult } from "@/lib/diagnostics/cost-of-delay-engine";
import { selectScenario } from "@/lib/diagnostics/scenario-selector";
import { evaluateBehaviour } from "@/lib/diagnostics/behaviour-map";
import { buildStructuredConsequence, type StructuredConsequence } from "@/lib/diagnostics/decision-compression";
import type { SignalKey } from "@/lib/diagnostics/signals";
import type { ScenarioDefinition } from "@/lib/diagnostics/scenarios";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

type Props = {
  /** Signal key from the assessment result */
  signalKey: SignalKey;
  /** Scores for cost-of-delay computation */
  scores: {
    urgency: number;
    ownership: number;
    clarity: number;
    accountability: number;
    state: number;
  };
  /** Which layer this is rendering in */
  layer: "full";
};

export default function ProductAdvantageBlocks({ signalKey, scores, layer }: Props) {
  const [scenarioChoice, setScenarioChoice] = React.useState("");
  const [showScenario, setShowScenario] = React.useState(true);

  // Cost of delay
  const delayResult = React.useMemo(() => computeCostOfDelay({
    urgencyScore: scores.urgency,
    ownershipScore: scores.ownership,
    clarityScore: scores.clarity,
    accountabilityScore: scores.accountability,
    stateScore: scores.state,
  }), [scores]);

  // Structured consequence (layer-aware)
  const consequence = React.useMemo(() => buildStructuredConsequence(signalKey, layer), [signalKey, layer]);

  // Scenario
  const scenario: ScenarioDefinition | null = React.useMemo(() => {
    try { return selectScenario(signalKey); } catch { return null; }
  }, [signalKey]);

  return (
    <div className="space-y-3">
      {/* STRUCTURED CONSEQUENCE — time-bound, layer-aware */}
      <div style={{ border: "1px solid rgba(255,255,255,0.08)", padding: "1rem" }}>
        <span style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(252,165,165,0.45)" }}>
          Structured consequence
        </span>
        <div className="mt-2 space-y-2">
          {[
            { label: "Immediate", text: consequence.immediate },
            { label: "30 days", text: consequence.thirtyDays },
            { label: "90 days", text: consequence.ninetyDays },
          ].map((c) => (
            <div key={c.label} className="flex gap-3">
              <span style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.18)", minWidth: "60px" }}>{c.label}</span>
              <span style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.85rem", lineHeight: 1.6, color: "rgba(255,255,255,0.55)" }}>{c.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* COST OF DELAY */}
      <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1rem" }}>
        <div className="flex items-center justify-between">
          <span style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>Delay exposure</span>
          <span style={{ ...mono, fontSize: "8px", color: delayResult.band === "CRITICAL" ? "rgba(252,165,165,0.65)" : delayResult.band === "HIGH" ? "rgba(253,186,116,0.60)" : `${GOLD}BB`, fontWeight: 700 }}>
            {delayResult.band}
          </span>
        </div>
        <div className="mt-2 space-y-1">
          {(["7_DAYS", "30_DAYS", "90_DAYS"] as const).map((h) => (
            <div key={h} className="flex gap-3">
              <span style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.15)", minWidth: "50px" }}>{h.replace("_", " ")}</span>
              <span style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.82rem", lineHeight: 1.6, color: "rgba(255,255,255,0.45)" }}>{delayResult.horizon[h]}</span>
            </div>
          ))}
        </div>
        <p style={{ ...mono, fontSize: "6px", color: "rgba(255,255,255,0.10)", marginTop: "0.5rem" }}>{delayResult.disclosure}</p>
      </div>

      {/* SCENARIO STRESS-TEST */}
      {scenario && showScenario && !scenarioChoice && (
        <div style={{ border: "1px solid rgba(255,255,255,0.10)", padding: "1.25rem" }}>
          <span style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>Under pressure</span>
          <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.95rem", lineHeight: 1.7, color: "rgba(255,255,255,0.65)", marginTop: "0.5rem", maxWidth: "52ch" }}>{scenario.prompt}</p>
          <div className="mt-3 space-y-2">
            {scenario.options.map((opt) => (
              <button key={opt.id} type="button" onClick={() => setScenarioChoice(opt.behaviourTag)} style={{ width: "100%", textAlign: "left", padding: "10px 14px", border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "transparent", color: "rgba(255,255,255,0.50)", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.85rem", lineHeight: 1.5, cursor: "pointer" }}>
                <span style={{ ...mono, fontSize: "8px", color: `${GOLD}80`, marginRight: "0.5rem" }}>{opt.id}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* BEHAVIOURAL DIVERGENCE */}
      {scenarioChoice && (
        <div style={{ border: "1px solid rgba(253,186,116,0.15)", backgroundColor: "rgba(253,186,116,0.03)", padding: "1rem" }}>
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(253,186,116,0.45)" }}>What this reveals</span>
          <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.88rem", lineHeight: 1.7, color: "rgba(255,255,255,0.60)", marginTop: "0.15rem", maxWidth: "52ch" }}>
            {evaluateBehaviour(signalKey, scenarioChoice).message}
          </p>
        </div>
      )}
    </div>
  );
}
