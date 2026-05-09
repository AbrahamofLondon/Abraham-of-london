/**
 * DecisionTracePanel — enterprise credibility layer.
 *
 * Shows: inputs used, signals triggered, routing outcome,
 * why alternatives were rejected.
 *
 * Makes the system auditable by external observers.
 * INTERNAL_ONLY: do not import into public or authenticated user-facing routes.
 */

import * as React from "react";
import { FileText } from "lucide-react";
import type { IntelligenceSpine } from "@/lib/decision/intelligence-spine";
import { getGovernedOutput } from "@/lib/decision/spine-accessors";

export type DecisionTracePanelProps = {
  spine: IntelligenceSpine;
  expanded?: boolean;
};

export default function DecisionTracePanel({ spine, expanded = false }: DecisionTracePanelProps) {
  const [open, setOpen] = React.useState(expanded);
  const governed = getGovernedOutput(spine);
  const condition = governed.conditionClass;

  const inputsUsed = [
    spine.case.decision ? "Decision text" : null,
    spine.case.priorAttempt ? "Prior attempts" : null,
    spine.case.costOfDelay ? "Cost of delay" : null,
    spine.case.claimedOwner ? "Claimed owner" : null,
    spine.case.blocker ? "Blocker" : null,
    spine.case.forcedAction ? "Forced action" : null,
  ].filter(Boolean);

  const signalsTriggered = [
    governed.contradictionSet.length > 0 ? `${governed.contradictionSet.length} contradiction(s) detected` : null,
    spine.flags?.avoidanceSuspected ? "Avoidance pattern suspected" : null,
    spine.flags?.falseAuthority ? "False authority detected" : null,
    spine.flags?.economicSanitySuspicious ? "Economic estimate flagged" : null,
    spine.memory && spine.memory.recurrenceSignals.length > 0 ? `${spine.memory.recurrenceSignals.length} recurrence signal(s)` : null,
  ].filter(Boolean);

  const routingOutcome = condition === "authority" ? "AUTHORITY — who decides is unclear"
    : condition === "definition" ? "DEFINITION — what is being decided is unclear"
    : condition === "execution" ? "EXECUTION — decision known but avoided"
    : "INSTABILITY — untested under pressure";

  const alternativesRejected = [
    condition !== "authority" ? "Authority: insufficient authority-related language in inputs" : null,
    condition !== "definition" ? "Definition: insufficient definition-related language in inputs" : null,
    condition !== "execution" ? "Execution: insufficient execution-related language in inputs" : null,
    condition !== "instability" ? "Instability: other condition classes scored higher" : null,
  ].filter(Boolean);

  const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;

  return (
    <div className="border border-white/[0.06] bg-white/[0.02]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <FileText className="h-3 w-3" style={{ color: "rgba(255,255,255,0.25)" }} />
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
            Decision Trace
          </span>
        </div>
        <span style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.15)" }}>
          {open ? "collapse" : "expand"}
        </span>
      </button>

      {open && (
        <div className="border-t border-white/[0.04] px-4 py-3 space-y-3">
          {/* Inputs used */}
          <div>
            <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>
              Inputs used ({inputsUsed.length}/6)
            </span>
            <div className="mt-1 flex flex-wrap gap-1">
              {inputsUsed.map((input) => (
                <span key={input} style={{ ...mono, fontSize: "6.5px", padding: "2px 6px", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.30)" }}>
                  {input}
                </span>
              ))}
            </div>
          </div>

          {/* Signals triggered */}
          <div>
            <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>
              Signals triggered
            </span>
            {signalsTriggered.length > 0 ? (
              <div className="mt-1 space-y-1">
                {signalsTriggered.map((sig) => (
                  <div key={sig} style={{ ...mono, fontSize: "6.5px", color: "rgba(252,165,165,0.45)" }}>
                    {sig}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ ...mono, fontSize: "6.5px", color: "rgba(255,255,255,0.15)", marginTop: "2px" }}>
                No additional signals beyond primary classification
              </div>
            )}
          </div>

          {/* Routing outcome */}
          <div>
            <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>
              Routing outcome
            </span>
            <div style={{ ...mono, fontSize: "7px", color: "rgba(201,169,110,0.60)", marginTop: "2px" }}>
              {routingOutcome}
            </div>
          </div>

          {/* Alternatives rejected */}
          <div>
            <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>
              Alternatives rejected
            </span>
            <div className="mt-1 space-y-1">
              {alternativesRejected.map((alt) => (
                <div key={alt} style={{ ...mono, fontSize: "6px", color: "rgba(255,255,255,0.12)" }}>
                  {alt}
                </div>
              ))}
            </div>
          </div>

          {/* Journey depth */}
          <div style={{ ...mono, fontSize: "6px", color: "rgba(255,255,255,0.10)", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "6px" }}>
            Stages completed: {spine.history.map((h) => h.stage).join(" → ")}
          </div>
        </div>
      )}
    </div>
  );
}
