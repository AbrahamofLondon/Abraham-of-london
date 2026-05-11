"use client";

import * as React from "react";
import type { InstitutionalMemoryReport, RecurringPattern, ContradictionCluster } from "@/lib/sovereign/institutional-memory";

const MONO: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

const SERIF: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
};

const ARC_COLOR: Record<string, string> = {
  ASCENDING: "rgba(110,231,183,0.65)",
  FLAT: "rgba(255,255,255,0.40)",
  DESCENDING: "rgba(252,165,165,0.65)",
  VOLATILE: "rgba(201,169,110,0.65)",
};

const STATUS_COLOR: Record<string, string> = {
  PERSISTING: "rgba(201,169,110,0.60)",
  WORSENING: "rgba(252,165,165,0.65)",
  IMPROVING: "rgba(110,231,183,0.55)",
  RESOLVED: "rgba(255,255,255,0.25)",
};

type Props = {
  report: InstitutionalMemoryReport;
};

export default function InstitutionalMemoryPanel({ report }: Props) {
  const [activeTab, setActiveTab] = React.useState<"arc" | "patterns" | "contradictions">("arc");
  const arc = report.trajectoryArc;
  const hasPatterns = report.recurringPatterns.length > 0;
  const hasContradictions = report.contradictionClusters.length > 0;

  const tabStyle = (active: boolean): React.CSSProperties => ({
    ...MONO,
    fontSize: "9px",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: active ? "#C9A96E" : "rgba(255,255,255,0.25)",
    paddingBottom: "6px",
    cursor: "pointer",
    background: "none",
    border: "none",
    borderBottom: active ? "1px solid rgba(201,169,110,0.45)" : "1px solid transparent",
  });

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
        <p style={{ ...MONO, fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#555", margin: 0 }}>
          Institutional memory
        </p>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <span style={{ ...MONO, fontSize: "8px", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)" }}>
            {report.totalSessions} session{report.totalSessions !== 1 ? "s" : ""}
          </span>
          {report.timeSpanDays > 0 && (
            <span style={{ ...MONO, fontSize: "8px", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)" }}>
              {report.timeSpanDays} day{report.timeSpanDays !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* ── Primary narrative ───────────────────────────────── */}
      <div style={{ marginBottom: "24px", padding: "18px 20px", borderLeft: "2px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.015)" }}>
        <p style={{ fontSize: "15px", lineHeight: 1.8, color: "rgba(255,255,255,0.62)" }}>
          {report.primaryNarrative}
        </p>
        {report.improvementSummary && (
          <p style={{ fontSize: "13px", lineHeight: 1.65, color: "rgba(255,255,255,0.35)", marginTop: "10px" }}>
            {report.improvementSummary}
          </p>
        )}
      </div>

      {/* ── Tab navigation ──────────────────────────────────── */}
      {report.totalSessions > 1 && (
        <>
          <div style={{ display: "flex", gap: "20px", marginBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "0" }}>
            <button style={tabStyle(activeTab === "arc")} onClick={() => setActiveTab("arc")}>
              Trajectory arc
            </button>
            {hasPatterns && (
              <button style={tabStyle(activeTab === "patterns")} onClick={() => setActiveTab("patterns")}>
                Recurring patterns {report.recurringPatterns.filter(p => p.status !== "RESOLVED").length > 0 && `(${report.recurringPatterns.filter(p => p.status !== "RESOLVED").length})`}
              </button>
            )}
            {hasContradictions && (
              <button style={tabStyle(activeTab === "contradictions")} onClick={() => setActiveTab("contradictions")}>
                Contradictions ({report.contradictionClusters.length})
              </button>
            )}
          </div>

          {/* ── Arc tab ───────────────────────────────────────── */}
          {activeTab === "arc" && (
            <ArcTab arc={arc} report={report} />
          )}

          {/* ── Patterns tab ──────────────────────────────────── */}
          {activeTab === "patterns" && hasPatterns && (
            <PatternsTab patterns={report.recurringPatterns} unresolvedSignals={report.unresolvedSignals} />
          )}

          {/* ── Contradictions tab ────────────────────────────── */}
          {activeTab === "contradictions" && hasContradictions && (
            <ContradictionsTab clusters={report.contradictionClusters} />
          )}
        </>
      )}
    </div>
  );
}

// ─── Sub-panels ──────────────────────────────────────────────────────────────

function ArcTab({ arc, report }: { arc: InstitutionalMemoryReport["trajectoryArc"]; report: InstitutionalMemoryReport }) {
  const color = ARC_COLOR[arc.direction] ?? "rgba(255,255,255,0.40)";

  return (
    <div style={{ display: "grid", gap: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
        <div>
          <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "4px" }}>
            {arc.startPosture} → {arc.currentPosture}
          </p>
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 500, fontSize: "22px", color, margin: 0 }}>
            {arc.direction}
          </p>
        </div>
        {arc.improvementVelocity !== 0 && (
          <div style={{ textAlign: "right" }}>
            <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)", marginBottom: "2px" }}>
              Velocity per session
            </p>
            <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "14px", color: arc.improvementVelocity > 0 ? "rgba(110,231,183,0.65)" : "rgba(252,165,165,0.65)", margin: 0 }}>
              {arc.improvementVelocity > 0 ? "+" : ""}{arc.improvementVelocity}
            </p>
          </div>
        )}
      </div>

      <p style={{ fontSize: "14px", lineHeight: 1.75, color: "rgba(255,255,255,0.50)" }}>
        {arc.narrative}
      </p>

      {report.unresolvedSignals.length > 0 && (
        <div style={{ padding: "12px 14px", borderLeft: "2px solid rgba(201,169,110,0.30)", background: "rgba(201,169,110,0.04)" }}>
          <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(201,169,110,0.50)", marginBottom: "6px" }}>
            Unresolved across sessions
          </p>
          <p style={{ fontSize: "13px", lineHeight: 1.65, color: "rgba(255,255,255,0.45)" }}>
            {report.unresolvedSignals.length} signal pattern{report.unresolvedSignals.length > 1 ? "s have" : " has"} persisted since first detected and {report.unresolvedSignals.length > 1 ? "have" : "has"} not resolved despite prior sessions.
          </p>
        </div>
      )}
    </div>
  );
}

function PatternsTab({ patterns, unresolvedSignals }: { patterns: RecurringPattern[]; unresolvedSignals: string[] }) {
  return (
    <div style={{ display: "grid", gap: "12px" }}>
      {patterns.map((pattern) => {
        const color = STATUS_COLOR[pattern.status] ?? "rgba(255,255,255,0.35)";
        const isUnresolved = unresolvedSignals.includes(pattern.signalId);

        return (
          <div
            key={pattern.signalId}
            style={{
              padding: "16px 18px",
              border: "1px solid rgba(255,255,255,0.06)",
              background: pattern.status === "PERSISTING" ? "rgba(201,169,110,0.03)" : "rgba(255,255,255,0.01)",
              borderLeft: `2px solid ${color.replace(/[\d.]+\)$/, "0.35)")}`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "8px" }}>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 500, fontSize: "16px", color: "#F5F5F5", margin: 0, lineHeight: 1.3 }}>
                {pattern.signalName}
              </p>
              <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", color, flexShrink: 0 }}>
                {pattern.status}
              </span>
            </div>
            <p style={{ fontSize: "13px", lineHeight: 1.65, color: "rgba(255,255,255,0.45)", marginBottom: "8px" }}>
              {pattern.narrative}
            </p>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)" }}>
                {pattern.occurrences} occurrence{pattern.occurrences !== 1 ? "s" : ""}
              </span>
              {pattern.consecutiveSessions && (
                <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(201,169,110,0.40)" }}>
                  Consecutive sessions
                </span>
              )}
              {isUnresolved && (
                <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(252,165,165,0.40)" }}>
                  Still active
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ContradictionsTab({ clusters }: { clusters: ContradictionCluster[] }) {
  return (
    <div style={{ display: "grid", gap: "16px" }}>
      {clusters.map((cluster) => (
        <div
          key={cluster.id}
          style={{
            padding: "18px 20px",
            border: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(255,255,255,0.015)",
          }}
        >
          <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "8px" }}>
            {cluster.sessionsPresent} session{cluster.sessionsPresent !== 1 ? "s" : ""} · First detected {new Date(cluster.firstDetected).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
          </p>

          {/* Two-score comparison */}
          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px", flexWrap: "wrap" }}>
            <div style={{ padding: "6px 10px", background: "rgba(110,231,183,0.06)", border: "1px solid rgba(110,231,183,0.15)" }}>
              <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "9px", color: "rgba(110,231,183,0.60)" }}>
                {cluster.scoreA.label} {cluster.scoreA.trend === "UP" ? "↑" : cluster.scoreA.trend === "DOWN" ? "↓" : "→"}
              </span>
            </div>
            <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", color: "rgba(255,255,255,0.20)" }}>vs</span>
            <div style={{ padding: "6px 10px", background: "rgba(252,165,165,0.06)", border: "1px solid rgba(252,165,165,0.15)" }}>
              <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "9px", color: "rgba(252,165,165,0.60)" }}>
                {cluster.scoreB.label} {cluster.scoreB.trend === "UP" ? "↑" : cluster.scoreB.trend === "DOWN" ? "↓" : "→"}
              </span>
            </div>
          </div>

          <p style={{ fontSize: "13px", lineHeight: 1.7, color: "rgba(255,255,255,0.50)" }}>
            {cluster.interpretive}
          </p>
        </div>
      ))}
    </div>
  );
}
