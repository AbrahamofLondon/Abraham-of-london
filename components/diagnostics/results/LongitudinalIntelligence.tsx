/**
 * LongitudinalIntelligence — institutional condition monitoring.
 *
 * Contradiction-first: persisting contradictions headline the surface.
 * Delta metrics are supporting evidence, not the lead.
 * Pattern recurrence: names returning patterns directly.
 * Classification: improving / stable / deteriorating / recurring condition.
 *
 * This must feel like institutional governance, not consumer analytics.
 */

import * as React from "react";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

export type MetricDelta = {
  metric: string;
  previous: number;
  current: number;
  delta: number;
};

export type ContradictionNode = {
  label: string;
  summary: string;
  confidence: number;
  severity: string;
  sourceStage: string;
};

export type LongitudinalData = {
  classification: "recovery" | "stable" | "deterioration" | "insufficient" | "recurring";
  metricChanges: MetricDelta[];
  tensionPersistence: string[];
  escalationMovement: "down" | "flat" | "up" | "unknown";
  interventionEffect?: string;
  baselineDate?: string;
  currentDate?: string;
  contradictions?: ContradictionNode[];
  persistingContradictions?: string[];
};

const CLASS_CONFIG: Record<string, { label: string; color: string; message: string }> = {
  recovery: { label: "CONDITION RESPONDING", color: "rgba(110,231,183,0.75)", message: "The intervention is producing measurable change. Whether it holds depends on what remains structurally unresolved." },
  stable: { label: "CONDITION UNCHANGED", color: "rgba(255,255,255,0.45)", message: "No material shift since baseline. The underlying structure has not been altered." },
  deterioration: { label: "CONDITION WORSENING", color: "rgba(252,165,165,0.75)", message: "The condition has deteriorated since baseline. Prior intervention did not hold. Structural cause persists." },
  recurring: { label: "PATTERN RETURNED", color: "rgba(253,186,116,0.75)", message: "A previously resolved pattern has reappeared. The root cause was not addressed — only the symptom." },
  insufficient: { label: "FIRST ASSESSMENT", color: "rgba(255,255,255,0.30)", message: "No prior baseline available for comparison." },
};

function severityColor(severity: string): string {
  if (severity === "critical") return "rgba(252,165,165,0.65)";
  if (severity === "high") return "rgba(253,186,116,0.60)";
  return "rgba(255,255,255,0.35)";
}

export default function LongitudinalIntelligence({ data }: { data: LongitudinalData | null }) {
  if (!data || data.classification === "insufficient") return null;

  const config = CLASS_CONFIG[data.classification] ?? CLASS_CONFIG.stable!;
  const improved = data.metricChanges.filter((m) => m.delta > 5);
  const worsened = data.metricChanges.filter((m) => m.delta < -5);
  const returned = data.tensionPersistence;
  const contradictions = data.contradictions ?? [];
  const persisting = data.persistingContradictions ?? [];

  return (
    <div style={{ border: `1px solid ${config.color}25`, backgroundColor: `${config.color}05`, padding: "1.25rem", marginBottom: "1rem" }}>
      {/* Classification */}
      <div className="flex items-center gap-3 mb-2">
        <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}70` }}>
          Longitudinal intelligence
        </span>
        {data.baselineDate && (
          <span style={{ ...mono, fontSize: "6.5px", color: "rgba(255,255,255,0.18)" }}>
            vs {new Date(data.baselineDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        )}
      </div>

      <div className="mb-3">
        <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: config.color, fontWeight: 700 }}>
          {config.label}
        </span>
      </div>

      <p style={{ ...serif, fontSize: "0.88rem", lineHeight: 1.55, color: "rgba(255,255,255,0.50)", marginBottom: "0.75rem" }}>
        {config.message}
      </p>

      {/* CONTRADICTION LEADS — persisting contradictions from evidence graph */}
      {contradictions.length > 0 && (
        <div style={{ border: "1px solid rgba(252,165,165,0.15)", backgroundColor: "rgba(252,165,165,0.03)", padding: "0.75rem", marginBottom: "0.75rem" }}>
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(252,165,165,0.55)" }}>
            {persisting.length > 0 ? "Contradictions persisting across assessments" : "Active contradictions"}
          </span>
          {contradictions.map((c, i) => (
            <div key={i} style={{ marginTop: "0.4rem", paddingTop: i > 0 ? "0.3rem" : 0, borderTop: i > 0 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
              <div className="flex items-center gap-2">
                <span style={{ ...mono, fontSize: "7px", textTransform: "uppercase", color: severityColor(c.severity) }}>
                  {c.severity}
                </span>
                <span style={{ ...mono, fontSize: "6px", color: "rgba(255,255,255,0.15)" }}>
                  {Math.round(c.confidence * 100)}% confidence
                </span>
                {persisting.includes(c.label) && (
                  <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.18em", color: "rgba(253,186,116,0.55)" }}>
                    PERSISTING
                  </span>
                )}
              </div>
              <p style={{ ...serif, fontSize: "0.82rem", lineHeight: 1.5, color: "rgba(255,255,255,0.45)", marginTop: "0.1rem" }}>
                {c.summary}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Pattern recurrence — what returned */}
      {returned.length > 0 && (
        <div style={{ border: "1px solid rgba(253,186,116,0.15)", backgroundColor: "rgba(253,186,116,0.03)", padding: "0.65rem", marginBottom: "0.75rem" }}>
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(253,186,116,0.50)" }}>
            Resolved patterns that returned
          </span>
          {returned.map((t) => (
            <p key={t} style={{ ...serif, fontSize: "0.82rem", lineHeight: 1.5, color: "rgba(253,186,116,0.45)", marginTop: "0.15rem" }}>
              {t}
            </p>
          ))}
        </div>
      )}

      {/* Supporting evidence — delta metrics */}
      {(improved.length > 0 || worsened.length > 0) && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "0.5rem", marginBottom: "0.5rem" }}>
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
            Supporting evidence
          </span>
          <div className="grid gap-3 md:grid-cols-2 mt-2">
            {improved.length > 0 && (
              <div>
                {improved.map((m) => (
                  <div key={m.metric} className="flex items-center justify-between py-0.5">
                    <span style={{ ...serif, fontSize: "0.78rem", color: "rgba(255,255,255,0.35)" }}>{m.metric}</span>
                    <span style={{ ...mono, fontSize: "7px", color: "rgba(110,231,183,0.50)" }}>+{m.delta}</span>
                  </div>
                ))}
              </div>
            )}
            {worsened.length > 0 && (
              <div>
                {worsened.map((m) => (
                  <div key={m.metric} className="flex items-center justify-between py-0.5">
                    <span style={{ ...serif, fontSize: "0.78rem", color: "rgba(255,255,255,0.35)" }}>{m.metric}</span>
                    <span style={{ ...mono, fontSize: "7px", color: "rgba(252,165,165,0.50)" }}>{m.delta}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Escalation movement */}
      {data.escalationMovement !== "unknown" && data.escalationMovement !== "flat" && (
        <div style={{ marginTop: "0.35rem" }}>
          <span style={{ ...mono, fontSize: "7px", color: data.escalationMovement === "up" ? "rgba(252,165,165,0.50)" : "rgba(110,231,183,0.50)" }}>
            Escalation level {data.escalationMovement === "up" ? "increased" : "decreased"} since baseline
          </span>
        </div>
      )}
    </div>
  );
}
