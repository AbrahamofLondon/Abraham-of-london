/**
 * OutcomeVerification — institutional proof of whether intervention worked.
 *
 * Contradiction-first: unresolved contradictions explain the outcome classification.
 * Before/after is evidence, not the headline.
 * Partial success is visible (condition improved, root cause persists).
 * This must feel like institutional audit, not customer success dashboard.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

export type ContradictionEvidence = {
  label: string;
  summary: string;
  confidence: number;
  severity: string;
  sourceStage: string;
};

export type OutcomeData = {
  classification: "resolved" | "improved" | "stable" | "deteriorated";
  baselineCondition: string;
  currentCondition: string;
  netMovement: string;
  unresolvedContradictions: string[];
  contradictionEvidence?: ContradictionEvidence[];
  interventionEffectiveness: {
    whatImproved: string[];
    whatDidNot: string[];
    whatRemainsUncorrected: string;
  };
  strategyRoomHeld: "held" | "partially_held" | "failed" | "needs_renewal" | null;
  baselineDate?: string;
  currentDate?: string;
};

const OUTCOME_CONFIG: Record<string, { label: string; color: string; message: string }> = {
  resolved: { label: "INTERVENTION HELD", color: "rgba(110,231,183,0.75)", message: "The condition has materially resolved. No persisting contradictions detected." },
  improved: { label: "PARTIAL RESOLUTION", color: `${GOLD}CC`, message: "The condition improved, but structural contradictions remain. The intervention addressed symptoms — not root cause." },
  stable: { label: "INTERVENTION INEFFECTIVE", color: "rgba(255,255,255,0.45)", message: "No material change. The intervention did not alter the underlying structure." },
  deteriorated: { label: "CONDITION WORSENED", color: "rgba(252,165,165,0.75)", message: "The condition has deteriorated since intervention. The root cause was not addressed and has compounded." },
};

function severityColor(severity: string): string {
  if (severity === "critical") return "rgba(252,165,165,0.65)";
  if (severity === "high") return "rgba(253,186,116,0.60)";
  return "rgba(255,255,255,0.35)";
}

export default function OutcomeVerification({ data }: { data: OutcomeData | null }) {
  if (!data) return null;

  const config = OUTCOME_CONFIG[data.classification] ?? OUTCOME_CONFIG.stable!;
  const contradictionEvidence = data.contradictionEvidence ?? [];
  const hasContradictions = contradictionEvidence.length > 0 || data.unresolvedContradictions.length > 0;

  return (
    <div style={{ border: `1px solid ${config.color}25`, backgroundColor: `${config.color}05`, padding: "1.25rem", marginBottom: "1rem" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}70` }}>
          Outcome verification
        </span>
      </div>

      {/* Classification — institutional verdict, not score */}
      <div className="mb-3">
        <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: config.color, fontWeight: 700 }}>
          {config.label}
        </span>
      </div>

      <p style={{ ...serif, fontSize: "0.88rem", lineHeight: 1.55, color: "rgba(255,255,255,0.50)", marginBottom: "0.75rem" }}>
        {config.message}
      </p>

      {/* CONTRADICTION LEADS — why the outcome is what it is */}
      {hasContradictions && (
        <div style={{ border: "1px solid rgba(252,165,165,0.15)", backgroundColor: "rgba(252,165,165,0.03)", padding: "0.75rem", marginBottom: "0.75rem" }}>
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(252,165,165,0.55)" }}>
            {data.classification === "resolved" ? "Contradictions resolved" : "Contradictions persisting after intervention"}
          </span>
          {contradictionEvidence.length > 0
            ? contradictionEvidence.map((c, i) => (
                <div key={i} style={{ marginTop: "0.4rem", paddingTop: i > 0 ? "0.3rem" : 0, borderTop: i > 0 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                  <div className="flex items-center gap-2">
                    <span style={{ ...mono, fontSize: "7px", textTransform: "uppercase", color: severityColor(c.severity) }}>
                      {c.severity}
                    </span>
                    <span style={{ ...mono, fontSize: "6px", color: "rgba(255,255,255,0.15)" }}>
                      {Math.round(c.confidence * 100)}% confidence · {c.sourceStage}
                    </span>
                  </div>
                  <p style={{ ...serif, fontSize: "0.82rem", lineHeight: 1.5, color: "rgba(255,255,255,0.40)", marginTop: "0.1rem" }}>
                    {c.summary}
                  </p>
                </div>
              ))
            : data.unresolvedContradictions.map((c) => (
                <p key={c} style={{ ...serif, fontSize: "0.82rem", color: "rgba(252,165,165,0.40)", marginTop: "0.15rem" }}>{c}</p>
              ))}
        </div>
      )}

      {/* Structurally uncorrected — what root cause persists */}
      {data.interventionEffectiveness.whatRemainsUncorrected && data.classification !== "resolved" && (
        <div style={{ border: "1px solid rgba(253,186,116,0.12)", backgroundColor: "rgba(253,186,116,0.03)", padding: "0.65rem", marginBottom: "0.75rem" }}>
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(253,186,116,0.50)" }}>
            Root cause unaddressed
          </span>
          <p style={{ ...serif, fontSize: "0.82rem", lineHeight: 1.5, color: "rgba(253,186,116,0.45)", marginTop: "0.15rem" }}>
            {data.interventionEffectiveness.whatRemainsUncorrected}
          </p>
        </div>
      )}

      {/* Before / After — supporting evidence, not headline */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "0.5rem", marginBottom: "0.5rem" }}>
        <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
          Evidence of change
        </span>
        <div className="grid gap-3 md:grid-cols-2 mt-2">
          <div>
            <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>
              Baseline {data.baselineDate ? `· ${new Date(data.baselineDate).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}` : ""}
            </span>
            <p style={{ ...serif, fontSize: "0.78rem", lineHeight: 1.5, color: "rgba(255,255,255,0.30)", marginTop: "0.15rem" }}>{data.baselineCondition}</p>
          </div>
          <div>
            <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: config.color }}>
              Current {data.currentDate ? `· ${new Date(data.currentDate).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}` : ""}
            </span>
            <p style={{ ...serif, fontSize: "0.78rem", lineHeight: 1.5, color: "rgba(255,255,255,0.40)", marginTop: "0.15rem" }}>{data.currentCondition}</p>
          </div>
        </div>
      </div>

      {/* What improved / what did not — supporting detail */}
      {(data.interventionEffectiveness.whatImproved.length > 0 || data.interventionEffectiveness.whatDidNot.length > 0) && (
        <div className="grid gap-3 md:grid-cols-2 mb-3">
          {data.interventionEffectiveness.whatImproved.length > 0 && (
            <div>
              <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(110,231,183,0.35)" }}>Responded to intervention</span>
              {data.interventionEffectiveness.whatImproved.map((item) => (
                <p key={item} style={{ ...serif, fontSize: "0.78rem", color: "rgba(110,231,183,0.35)", marginTop: "0.1rem" }}>{item}</p>
              ))}
            </div>
          )}
          {data.interventionEffectiveness.whatDidNot.length > 0 && (
            <div>
              <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(252,165,165,0.35)" }}>Did not respond</span>
              {data.interventionEffectiveness.whatDidNot.map((item) => (
                <p key={item} style={{ ...serif, fontSize: "0.78rem", color: "rgba(252,165,165,0.35)", marginTop: "0.1rem" }}>{item}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Strategy Room enforcement linkage */}
      {data.strategyRoomHeld && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "0.5rem" }}>
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase",
            color: data.strategyRoomHeld === "held" ? "rgba(110,231,183,0.50)"
              : data.strategyRoomHeld === "failed" ? "rgba(252,165,165,0.50)"
              : `${GOLD}60`,
          }}>
            Execution {data.strategyRoomHeld === "held" ? "held" : data.strategyRoomHeld === "partially_held" ? "partially held — structural gaps remain" : data.strategyRoomHeld === "failed" ? "failed — intervention did not produce change" : "requires renewal"}
          </span>
          {(data.strategyRoomHeld === "failed" || data.strategyRoomHeld === "needs_renewal") && (
            <Link href="/strategy-room" className="mt-2 inline-flex items-center gap-2" style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(252,165,165,0.50)" }}>
              Re-enter Strategy Room <ArrowRight style={{ width: 9, height: 9 }} />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
