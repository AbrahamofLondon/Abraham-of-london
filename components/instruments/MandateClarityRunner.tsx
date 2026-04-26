/**
 * MandateClarityRunner — 17-input authority classification engine UI.
 */

import * as React from "react";
import { scoreMandateClarity, type MandateInput, type MandateResult, type MandateBlock } from "@/lib/instruments/mandate-clarity/engine";
import { track } from "@/lib/analytics/track";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

const FIELDS: Array<{ key: keyof MandateInput; label: string; block: MandateBlock }> = [
  { key: "ownerNamed", label: "A specific person is named as decision owner", block: "ownership" },
  { key: "ownerKnowsTheyOwn", label: "That person knows they own this decision", block: "ownership" },
  { key: "ownerHasAuthority", label: "They have the authority to decide without escalation", block: "ownership" },
  { key: "ownerActsWithoutEscalation", label: "They can act without needing approval from above", block: "ownership" },
  { key: "decisionDefined", label: "The decision itself is clearly defined", block: "scope" },
  { key: "outcomeMeasurable", label: "The outcome can be measured or verified", block: "scope" },
  { key: "stakeholdersAligned", label: "Key stakeholders agree on what success looks like", block: "scope" },
  { key: "boundariesClear", label: "The boundaries of this decision are clear", block: "scope" },
  { key: "timelineDefined", label: "There is a defined timeline for resolution", block: "scope" },
  { key: "consequencesDefined", label: "Consequences of failure are explicitly defined", block: "accountability" },
  { key: "failureOwned", label: "Someone is accountable if this fails", block: "accountability" },
  { key: "reportingClear", label: "Reporting structure for this decision is clear", block: "accountability" },
  { key: "escalationPathExists", label: "There is a defined escalation path if blocked", block: "accountability" },
  { key: "delegationExplicit", label: "Delegation of authority is explicit, not assumed", block: "delegation" },
  { key: "delegateHasCapability", label: "The delegate has the capability to execute", block: "delegation" },
  { key: "overrideProtocol", label: "There is a protocol for overriding the decision", block: "delegation" },
  { key: "informationFlowClear", label: "Information flows clearly to all who need it", block: "delegation" },
];

const BLOCK_LABELS: Record<MandateBlock, string> = { ownership: "Ownership", scope: "Scope", accountability: "Accountability", delegation: "Delegation" };

export default function MandateClarityRunner({ onComplete }: { onComplete: (result: MandateResult) => void }) {
  const [input, setInput] = React.useState<MandateInput>(() => Object.fromEntries(FIELDS.map((f) => [f.key, false])) as unknown as MandateInput);

  const result = React.useMemo(() => scoreMandateClarity(input), [input]);
  const authColor = result.authorityType === "DIRECT" ? "rgba(110,231,183,0.60)" : result.authorityType === "PROXY" ? `${GOLD}CC` : "rgba(252,165,165,0.60)";

  let currentBlock: MandateBlock | null = null;

  return (
    <div className="space-y-4">
      {/* Live score */}
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>Clarity Score</span>
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "3rem", fontWeight: 300, lineHeight: 1, color: authColor }}>{result.clarityScore}</div>
        </div>
        <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: authColor }}>{result.authorityType}</span>
      </div>

      {/* Inputs by block */}
      {FIELDS.map((field) => {
        const showHeader = field.block !== currentBlock;
        currentBlock = field.block;
        return (
          <React.Fragment key={field.key}>
            {showHeader && (
              <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}60`, marginTop: "1rem", marginBottom: "0.25rem" }}>
                {BLOCK_LABELS[field.block]}
              </div>
            )}
            <label className="flex items-start gap-3 cursor-pointer" style={{ padding: "6px 0" }}>
              <input type="checkbox" checked={input[field.key]} onChange={(e) => setInput((prev) => ({ ...prev, [field.key]: e.target.checked }))} className="mt-0.5" style={{ accentColor: GOLD }} />
              <span style={{ fontSize: "0.85rem", color: input[field.key] ? "rgba(255,255,255,0.60)" : "rgba(255,255,255,0.30)" }}>{field.label}</span>
            </label>
          </React.Fragment>
        );
      })}

      {/* Flags */}
      {result.misalignmentFlags.length > 0 && (
        <div style={{ border: "1px solid rgba(252,165,165,0.15)", padding: "0.75rem", marginTop: "0.5rem" }}>
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(252,165,165,0.40)" }}>Misalignment flags</span>
          {result.misalignmentFlags.map((f, i) => <p key={i} style={{ fontSize: "0.78rem", color: "rgba(252,165,165,0.50)", marginTop: "2px" }}>{f}</p>)}
        </div>
      )}

      <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}04`, padding: "1rem" }}>
        <p style={{ fontSize: "0.85rem", lineHeight: 1.7, color: "rgba(255,255,255,0.55)" }}>{result.recommendation}</p>
      </div>

      <button type="button" onClick={() => { track("instrument_completed", { instrumentSlug: "mandate-clarity-framework", scoreBand: result.decisionRiskLevel }); onComplete(result); }}
        style={{ width: "100%", padding: "14px", border: `1px solid ${GOLD}50`, backgroundColor: `${GOLD}10`, color: `${GOLD}CC`, ...mono, fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer" }}>
        Save result
      </button>
    </div>
  );
}
