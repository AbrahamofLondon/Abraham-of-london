"use client";

import * as React from "react";
import type { WhatChangedSummary } from "@/lib/analytics/what-changed";

type Props = {
  summary: WhatChangedSummary;
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

function directionColor(direction: WhatChangedSummary["changes"][number]["direction"]): string {
  if (direction === "IMPROVED") return "rgba(110,231,183,0.72)";
  if (direction === "DETERIORATED") return "rgba(252,165,165,0.72)";
  if (direction === "NEW_SIGNAL") return "rgba(251,191,36,0.72)";
  return "rgba(255,255,255,0.34)";
}

export default function WhatChangedPanel({ summary, title = "What changed", className = "" }: Props) {
  const hasComparison = summary.hasPriorState && Boolean(summary.previousObservedAt && summary.currentObservedAt) && summary.changes.length > 0;
  return (
    <div
      className={className}
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        backgroundColor: "rgba(255,255,255,0.02)",
        padding: "16px 18px",
      }}
    >
      <div style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.34)" }}>
        {title}
      </div>
      <p style={{ ...serif, fontSize: "1rem", lineHeight: 1.55, color: "rgba(255,255,255,0.78)", marginTop: "8px" }}>
        {summary.headline}
      </p>
      {hasComparison && (
        <div style={{ display: "grid", gap: "8px", marginTop: "12px" }}>
          {summary.changes.slice(0, 6).map((change) => (
            <div key={`${change.field}:${String(change.current)}`} style={{ borderLeft: `1px solid ${directionColor(change.direction)}`, paddingLeft: "10px" }}>
              <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: directionColor(change.direction) }}>
                {change.direction.replace(/_/g, " ")}
              </div>
              <p style={{ fontSize: "13px", lineHeight: 1.55, color: "rgba(255,255,255,0.52)", marginTop: "3px" }}>
                {change.field}: {String(change.previous ?? "none recorded")} → {String(change.current ?? "none recorded")}
              </p>
            </div>
          ))}
        </div>
      )}
      {!hasComparison && summary.meta.emptyState && (
        <p style={{ fontSize: "12px", lineHeight: 1.55, color: "rgba(255,255,255,0.42)", marginTop: "12px" }}>
          {summary.meta.emptyState.reason}
          {summary.meta.emptyState.nextAction ? ` ${summary.meta.emptyState.nextAction}` : ""}
        </p>
      )}
      <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.24)", marginTop: "12px" }}>
        Scope: {summary.meta.scope.scopeLabel} · Source: {summary.meta.sourceLabel}
      </p>
      {hasComparison && (
        <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.24)", marginTop: "12px" }}>
          Compared: {formatDate(summary.previousObservedAt)} → {formatDate(summary.currentObservedAt)} · Evidence posture: {summary.meta.evidencePosture.replace(/_/g, " ").toLowerCase()}
        </p>
      )}
      {summary.caution && (
        <p style={{ fontSize: "12px", lineHeight: 1.55, color: "rgba(255,255,255,0.34)", marginTop: "12px" }}>
          {summary.caution}
        </p>
      )}
      {summary.meta.limitation && (
        <p style={{ fontSize: "12px", lineHeight: 1.55, color: "rgba(255,255,255,0.30)", marginTop: "6px" }}>
          {summary.meta.limitation}
        </p>
      )}
    </div>
  );
}
