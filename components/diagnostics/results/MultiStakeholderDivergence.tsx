/**
 * MultiStakeholderDivergence — structural contradiction across authority.
 *
 * Contradiction-first: structural disputes headline the surface.
 * Divergence detail supports the contradiction, not the other way around.
 * This is governance intelligence, not a survey report.
 */

import * as React from "react";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

export type StakeholderDivergencePoint = {
  domain: string;
  respondentA: { label: string; score: number };
  respondentB: { label: string; score: number };
  gap: number;
  costImplication: string;
};

export type StructuralContradiction = {
  domain: string;
  severity: "critical" | "high";
  summary: string;
  gap: number;
};

export type MultiStakeholderData = {
  respondentCount: number;
  sharedAgreement: string[];
  criticalDivergences: StakeholderDivergencePoint[];
  highestCostDisagreement: StakeholderDivergencePoint | null;
  structuralContradictions?: StructuralContradiction[];
  organisationalCondition: string;
  divergenceWorsensCondition: string;
};

function severityStyle(severity: string): { border: string; text: string } {
  if (severity === "critical") return { border: "rgba(252,165,165,0.20)", text: "rgba(252,165,165,0.65)" };
  return { border: "rgba(253,186,116,0.18)", text: "rgba(253,186,116,0.60)" };
}

export default function MultiStakeholderDivergence({ data }: { data: MultiStakeholderData | null }) {
  if (!data || data.respondentCount < 2) return null;

  const contradictions = data.structuralContradictions ?? [];

  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)", padding: "1.25rem", marginBottom: "1rem" }}>
      <div className="flex items-center gap-3 mb-2">
        <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}70` }}>
          Cross-authority intelligence
        </span>
        <span style={{ ...mono, fontSize: "6.5px", color: "rgba(255,255,255,0.18)" }}>
          {data.respondentCount} respondents
        </span>
      </div>

      {/* Organisational condition — institutional framing, not analytics */}
      <p style={{ ...serif, fontSize: "0.88rem", lineHeight: 1.55, color: "rgba(255,255,255,0.50)", marginBottom: "0.75rem" }}>
        {data.organisationalCondition}
      </p>

      {/* CONTRADICTION LEADS — structural disputes across authority */}
      {contradictions.length > 0 && (
        <div style={{ border: "1px solid rgba(252,165,165,0.15)", backgroundColor: "rgba(252,165,165,0.03)", padding: "0.75rem", marginBottom: "0.75rem" }}>
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(252,165,165,0.55)" }}>
            Authority does not share reality
          </span>
          {contradictions.map((c, i) => {
            const s = severityStyle(c.severity);
            return (
              <div key={i} style={{ marginTop: "0.4rem", paddingTop: i > 0 ? "0.3rem" : 0, borderTop: i > 0 ? `1px solid rgba(255,255,255,0.03)` : "none" }}>
                <div className="flex items-center gap-2">
                  <span style={{ ...mono, fontSize: "7px", textTransform: "uppercase", color: s.text }}>
                    {c.severity} · {c.domain}
                  </span>
                  <span style={{ ...mono, fontSize: "7px", color: "rgba(252,165,165,0.45)" }}>
                    {c.gap}-point structural gap
                  </span>
                </div>
                <p style={{ ...serif, fontSize: "0.82rem", lineHeight: 1.5, color: "rgba(255,255,255,0.40)", marginTop: "0.1rem" }}>
                  {c.summary}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Highest-cost disagreement — the decision that will fail first */}
      {data.highestCostDisagreement && (
        <div style={{ border: `1px solid ${GOLD}18`, backgroundColor: `${GOLD}04`, padding: "0.65rem", marginBottom: "0.75rem" }}>
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}60` }}>
            Highest-cost disagreement
          </span>
          <p style={{ ...serif, fontSize: "0.85rem", lineHeight: 1.5, color: "rgba(255,255,255,0.50)", marginTop: "0.2rem" }}>
            {data.highestCostDisagreement.costImplication}
          </p>
          <div className="flex gap-3 mt-1">
            <span style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.25)" }}>
              {data.highestCostDisagreement.respondentA.label}: {data.highestCostDisagreement.respondentA.score}%
            </span>
            <span style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.25)" }}>
              {data.highestCostDisagreement.respondentB.label}: {data.highestCostDisagreement.respondentB.score}%
            </span>
          </div>
        </div>
      )}

      {/* Supporting evidence: remaining divergences (non-contradiction) */}
      {data.criticalDivergences.filter((d) => d.gap < 35).length > 0 && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "0.5rem", marginBottom: "0.5rem" }}>
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
            Divergence under pressure
          </span>
          {data.criticalDivergences.filter((d) => d.gap < 35).map((d, i) => (
            <div key={i} className="flex items-center justify-between py-0.5 mt-1">
              <span style={{ ...serif, fontSize: "0.78rem", color: "rgba(255,255,255,0.35)" }}>{d.domain}</span>
              <span style={{ ...mono, fontSize: "7px", color: "rgba(253,186,116,0.45)" }}>{d.gap}-point gap</span>
            </div>
          ))}
        </div>
      )}

      {/* Shared agreement — secondary */}
      {data.sharedAgreement.length > 0 && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "0.5rem", marginBottom: "0.5rem" }}>
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(110,231,183,0.35)" }}>
            Shared reading
          </span>
          {data.sharedAgreement.map((a) => (
            <p key={a} style={{ ...serif, fontSize: "0.78rem", lineHeight: 1.5, color: "rgba(255,255,255,0.30)", marginTop: "0.1rem" }}>{a}</p>
          ))}
        </div>
      )}

      {/* What divergence costs */}
      <p style={{ ...serif, marginTop: "0.5rem", fontSize: "0.82rem", lineHeight: 1.5, color: "rgba(255,255,255,0.30)", fontStyle: "italic" }}>
        {data.divergenceWorsensCondition}
      </p>
    </div>
  );
}
