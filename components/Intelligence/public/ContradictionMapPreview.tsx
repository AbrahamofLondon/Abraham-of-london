"use client";

import * as React from "react";
import type { ContradictionMapView } from "@/lib/analytics/contradiction-graph-presenter";

type Props = {
  view: ContradictionMapView;
  title?: string;
  className?: string;
};

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

function formatDate(value?: string | null): string {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function severityColor(severity: string): string {
  if (severity === "CRITICAL") return "rgba(252,165,165,0.80)";
  if (severity === "HIGH") return "rgba(251,191,36,0.78)";
  if (severity === "MEDIUM") return "rgba(201,169,110,0.78)";
  return "rgba(255,255,255,0.36)";
}

export default function ContradictionMapPreview({
  view,
  title = "Contradiction map",
  className = "",
}: Props) {
  if (view.activeContradictions.length === 0) return null;

  return (
    <div
      className={className}
      style={{
        border: "1px solid rgba(252,165,165,0.12)",
        backgroundColor: "rgba(252,165,165,0.03)",
        padding: "16px 18px",
      }}
    >
      <div style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(252,165,165,0.72)" }}>
        {title}
      </div>
      <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.24)", marginTop: "8px" }}>
        Scope: {view.meta.scope.scopeLabel} · Source: {view.meta.sourceLabel} · As of {formatDate(view.asOf)}
      </p>
      <p style={{ ...serif, fontSize: "1rem", lineHeight: 1.55, color: "rgba(255,255,255,0.78)", marginTop: "8px" }}>
        {view.headline}
      </p>
      <div style={{ display: "grid", gap: "10px", marginTop: "12px" }}>
        {view.activeContradictions.filter((item) => item.safeToDisplay).slice(0, 4).map((item) => (
          <div key={item.id} style={{ borderLeft: `2px solid ${severityColor(item.severityBand)}`, paddingLeft: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: severityColor(item.severityBand) }}>
                {item.severityBand} · {item.trend.toLowerCase()}
              </span>
              <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.24)" }}>
                First seen {formatDate(item.capturedAt)} · Last seen {formatDate(item.lastSeenAt)}
              </span>
            </div>
            <p style={{ ...serif, fontSize: "0.98rem", lineHeight: 1.5, color: "rgba(255,255,255,0.76)", marginTop: "4px" }}>
              {item.plainEnglish}
            </p>
            <p style={{ fontSize: "12px", lineHeight: 1.55, color: "rgba(255,255,255,0.38)", marginTop: "5px" }}>
              Related decision signals: {item.relatedSignals.join(", ")}.
            </p>
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.24)", marginTop: "5px" }}>
              Source: {item.sourceLabel} · Evidence posture: {item.evidencePosture.replace(/_/g, " ").toLowerCase()} · Status: {item.currentStatus}
            </p>
            {item.suggestedNextAction && (
              <p style={{ fontSize: "12px", lineHeight: 1.55, color: "rgba(255,255,255,0.40)", marginTop: "5px" }}>
                Next action: {item.suggestedNextAction}
              </p>
            )}
          </div>
        ))}
      </div>
      {view.warning && (
        <p style={{ fontSize: "12px", lineHeight: 1.55, color: "rgba(255,255,255,0.34)", marginTop: "12px" }}>
          {view.warning}
        </p>
      )}
    </div>
  );
}
