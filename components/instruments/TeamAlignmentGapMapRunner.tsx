/**
 * TeamAlignmentGapMapRunner — live alignment gap scoring UI.
 * 6 alignment domains, each scored for leader perception and team reality.
 */

import * as React from "react";
import { scoreTeamAlignment, type AlignmentDomain, type AlignmentInput, type AlignmentResult } from "@/lib/instruments/team-alignment-gap-map/engine";
import { track } from "@/lib/analytics/track";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

const DOMAINS: Array<{ key: AlignmentDomain; label: string }> = [
  { key: "strategicDirection", label: "Strategic Direction" },
  { key: "priorityAgreement", label: "Priority Agreement" },
  { key: "roleClarity", label: "Role Clarity" },
  { key: "communicationEffectiveness", label: "Communication" },
  { key: "decisionOwnership", label: "Decision Ownership" },
  { key: "executionCommitment", label: "Execution Commitment" },
];

const defaultInput: AlignmentInput = {
  leaderPerception: { strategicDirection: 7, priorityAgreement: 7, roleClarity: 7, communicationEffectiveness: 7, decisionOwnership: 7, executionCommitment: 7 },
  teamEstimate: { strategicDirection: 5, priorityAgreement: 5, roleClarity: 5, communicationEffectiveness: 5, decisionOwnership: 5, executionCommitment: 5 },
};

export default function TeamAlignmentGapMapRunner({ onComplete }: { onComplete: (result: AlignmentResult) => void }) {
  const [input, setInput] = React.useState<AlignmentInput>(defaultInput);

  const result = React.useMemo(() => scoreTeamAlignment(input), [input]);

  function handleLeader(domain: AlignmentDomain, value: number) {
    setInput((prev) => ({ ...prev, leaderPerception: { ...prev.leaderPerception, [domain]: value } }));
  }

  function handleTeam(domain: AlignmentDomain, value: number) {
    setInput((prev) => ({ ...prev, teamEstimate: { ...prev.teamEstimate, [domain]: value } }));
  }

  const bandColor = result.alignmentBand === "CRITICAL" ? "rgba(252,165,165,0.70)" : result.alignmentBand === "WEAK" ? "rgba(253,186,116,0.70)" : result.alignmentBand === "ADEQUATE" ? `${GOLD}CC` : "rgba(110,231,183,0.60)";

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>Team Alignment</span>
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "3rem", fontWeight: 300, lineHeight: 1, color: bandColor }}>{result.overallAlignmentScore}</div>
        </div>
        <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: bandColor }}>{result.alignmentBand}</span>
      </div>

      <p style={{ ...mono, fontSize: "6px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)" }}>
        For each domain, score the leader&apos;s perception and the estimated team reality
      </p>

      {DOMAINS.map((d) => {
        const gap = result.gaps.find((g) => g.domain === d.key);
        const gapColor = gap && gap.gap >= 3 ? "rgba(252,165,165,0.40)" : "rgba(255,255,255,0.08)";
        return (
          <div key={d.key} style={{ border: `1px solid ${gapColor}`, padding: "0.75rem", backgroundColor: "rgba(255,255,255,0.015)" }}>
            <div className="flex items-baseline justify-between mb-2">
              <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.40)" }}>{d.label}</span>
              {gap && gap.gap >= 2 && <span style={{ ...mono, fontSize: "7px", color: "rgba(252,165,165,0.50)" }}>gap: {gap.gap}</span>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <span style={{ ...mono, fontSize: "6px", color: "rgba(255,255,255,0.25)" }}>Leader</span>
                  <span style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.50)" }}>{input.leaderPerception[d.key]}</span>
                </div>
                <input type="range" min={0} max={10} step={1} value={input.leaderPerception[d.key]} onChange={(e) => handleLeader(d.key, parseInt(e.target.value))} className="w-full" style={{ accentColor: GOLD }} />
              </div>
              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <span style={{ ...mono, fontSize: "6px", color: "rgba(255,255,255,0.25)" }}>Team</span>
                  <span style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.50)" }}>{input.teamEstimate[d.key]}</span>
                </div>
                <input type="range" min={0} max={10} step={1} value={input.teamEstimate[d.key]} onChange={(e) => handleTeam(d.key, parseInt(e.target.value))} className="w-full" style={{ accentColor: "rgba(255,255,255,0.35)" }} />
              </div>
            </div>
          </div>
        );
      })}

      {result.misalignmentZones.length > 0 && (
        <div style={{ border: "1px solid rgba(252,165,165,0.12)", backgroundColor: "rgba(252,165,165,0.03)", padding: "0.75rem" }}>
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(252,165,165,0.50)" }}>Misalignment Zones</span>
          {result.misalignmentZones.map((z, i) => <p key={i} style={{ fontSize: "0.78rem", lineHeight: 1.6, color: "rgba(255,255,255,0.45)", marginTop: "0.25rem" }}>{z}</p>)}
        </div>
      )}

      <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}04`, padding: "1rem" }}>
        <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}55` }}>Assessment</span>
        <p style={{ fontSize: "0.88rem", lineHeight: 1.7, color: "rgba(255,255,255,0.60)", marginTop: "0.25rem" }}>{result.recommendation}</p>
        <p style={{ fontSize: "0.78rem", lineHeight: 1.6, color: "rgba(255,255,255,0.35)", marginTop: "0.5rem" }}>{result.divergenceSignal}</p>
      </div>

      <button
        type="button"
        onClick={() => { track("instrument_completed", { instrumentSlug: "team-alignment-gap-map", decisionState: result.alignmentBand }); onComplete(result); }}
        style={{ width: "100%", padding: "14px", border: `1px solid ${GOLD}50`, backgroundColor: `${GOLD}10`, color: `${GOLD}CC`, ...mono, fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer" }}
      >
        Save result
      </button>

      <p style={{ ...mono, fontSize: "6px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.15)", textAlign: "center" }}>
        This alignment estimate is based on stated perceptions, not independently measured team data.
      </p>
    </div>
  );
}
