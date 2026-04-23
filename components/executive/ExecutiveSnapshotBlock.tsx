/**
 * ExecutiveSnapshotBlock — compressed executive visibility.
 *
 * Shows ONLY what requires immediate attention:
 * - Top 3 active contradictions
 * - Top 2 decision dependencies
 * - Top stakeholder divergence
 * - Immediate required actions
 *
 * This is a live compression block, not a report product.
 */

import * as React from "react";
import type { ExecutiveSnapshot } from "@/lib/executive/snapshot";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

const TRAJECTORY_CONFIG: Record<string, { color: string; label: string }> = {
  STABILISING: { color: "rgba(110,231,183,0.60)", label: "STABILISING" },
  DRIFTING: { color: `${GOLD}CC`, label: "DRIFTING" },
  ESCALATING: { color: "rgba(252,165,165,0.70)", label: "ESCALATING" },
};

function severityColor(s: string): string {
  if (s === "critical") return "rgba(252,165,165,0.65)";
  if (s === "high") return "rgba(253,186,116,0.60)";
  return "rgba(255,255,255,0.35)";
}

export default function ExecutiveSnapshotBlock({ data }: { data: ExecutiveSnapshot | null }) {
  if (!data) return null;

  const trajectory = TRAJECTORY_CONFIG[data.riskTrajectory] ?? TRAJECTORY_CONFIG.DRIFTING!;
  const hasContent = data.criticalContradictions.length > 0 || data.requiredActions.length > 0;
  if (!hasContent && data.activeDecisionCount === 0) return null;

  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.015)", padding: "1.25rem" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}70` }}>
          Executive snapshot
        </span>
        <div className="flex items-center gap-2">
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: trajectory.color }} />
          <span style={{ ...mono, fontSize: "7px", color: trajectory.color, fontWeight: 700 }}>
            {trajectory.label}
          </span>
        </div>
      </div>

      {/* Active decisions count */}
      <div className="flex items-center gap-4 mb-4">
        <div>
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>
            Active decisions
          </span>
          <div style={{ ...mono, fontSize: "16px", color: "rgba(255,255,255,0.55)", marginTop: "2px" }}>
            {data.activeDecisionCount}
          </div>
        </div>
      </div>

      {/* Critical contradictions — top 3 */}
      {data.criticalContradictions.length > 0 && (
        <div style={{ border: "1px solid rgba(252,165,165,0.15)", backgroundColor: "rgba(252,165,165,0.03)", padding: "0.75rem", marginBottom: "0.75rem" }}>
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(252,165,165,0.55)" }}>
            Active contradictions
          </span>
          {data.criticalContradictions.map((c, i) => (
            <div key={i} style={{ marginTop: "0.35rem", paddingTop: i > 0 ? "0.3rem" : 0, borderTop: i > 0 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
              <div className="flex items-center gap-2">
                <span style={{ ...mono, fontSize: "7px", textTransform: "uppercase", color: severityColor(c.severity) }}>
                  {c.severity}
                </span>
                <span style={{ ...mono, fontSize: "6px", color: "rgba(255,255,255,0.15)" }}>
                  {Math.round(c.confidence * 100)}% · {c.sourceStage}
                </span>
              </div>
              <p style={{ ...serif, fontSize: "0.82rem", lineHeight: 1.5, color: "rgba(255,255,255,0.40)", marginTop: "0.1rem" }}>
                {c.label}
              </p>
              {c.decisionText && (
                <p style={{ ...mono, fontSize: "6.5px", color: "rgba(255,255,255,0.18)", marginTop: "0.1rem" }}>
                  Decision: {c.decisionText.slice(0, 80)}{c.decisionText.length > 80 ? "..." : ""}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Decision dependencies — top 2 */}
      {data.topDecisionDependencies.length > 0 && (
        <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "0.65rem", marginBottom: "0.75rem" }}>
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
            Decision dependencies
          </span>
          {data.topDecisionDependencies.map((d, i) => (
            <div key={i} style={{ marginTop: "0.3rem" }}>
              <span style={{ ...mono, fontSize: "7px", color: d.relationshipType === "BLOCKS" ? "rgba(252,165,165,0.55)" : `${GOLD}80` }}>
                {d.relationshipType}
              </span>
              <p style={{ ...serif, fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", marginTop: "0.05rem" }}>
                {d.parentDecision.slice(0, 60)}... → {d.childDecision.slice(0, 60)}...
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Stakeholder divergence — top */}
      {data.topStakeholderDivergences.length > 0 && (
        <div style={{ border: `1px solid ${GOLD}15`, padding: "0.65rem", marginBottom: "0.75rem" }}>
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}60` }}>
            Stakeholder divergence
          </span>
          {data.topStakeholderDivergences.map((s, i) => (
            <div key={i} style={{ marginTop: "0.3rem" }}>
              <div className="flex items-center gap-2">
                <span style={{ ...mono, fontSize: "7px", color: s.alignmentState === "BLOCKING" ? "rgba(252,165,165,0.60)" : `${GOLD}AA` }}>
                  {s.alignmentState}
                </span>
                <span style={{ ...serif, fontSize: "0.78rem", color: "rgba(255,255,255,0.40)" }}>
                  {s.stakeholderName} ({s.role})
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Required actions */}
      {data.requiredActions.length > 0 && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "0.5rem" }}>
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(252,165,165,0.45)" }}>
            Required actions
          </span>
          {data.requiredActions.map((a) => (
            <p key={a} style={{ ...serif, fontSize: "0.82rem", lineHeight: 1.5, color: "rgba(255,255,255,0.45)", marginTop: "0.1rem" }}>
              {a}
            </p>
          ))}
        </div>
      )}

      {/* Timestamp */}
      <p style={{ ...mono, fontSize: "6px", color: "rgba(255,255,255,0.10)", marginTop: "0.75rem" }}>
        Generated {new Date(data.generatedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
      </p>
    </div>
  );
}
