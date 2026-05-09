"use client";

import * as React from "react";
import type { DecisionVelocitySummary } from "@/lib/analytics/decision-velocity";

type Props = {
  summary: DecisionVelocitySummary;
  title?: string;
  className?: string;
  dark?: boolean;
};

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

function formatDate(value?: string | null): string {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function bandColor(band: DecisionVelocitySummary["decisionVelocityBand"]): string {
  if (band === "FAST") return "rgba(110,231,183,0.70)";
  if (band === "STEADY") return "rgba(201,169,110,0.78)";
  if (band === "SLOWING") return "rgba(251,191,36,0.72)";
  if (band === "STALLED") return "rgba(252,165,165,0.72)";
  return "rgba(255,255,255,0.34)";
}

export default function DecisionVelocityCard({
  summary,
  title = "Decision velocity",
  className = "",
  dark = true,
}: Props) {
  return (
    <div
      className={className}
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        backgroundColor: dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
        padding: "16px 18px",
      }}
    >
      <div style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.34)" }}>
        {title}
      </div>
      <div style={{ ...mono, fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase", color: bandColor(summary.decisionVelocityBand), marginTop: "6px" }}>
        {summary.decisionVelocityBand}
      </div>
      <p style={{ ...serif, fontSize: "1rem", lineHeight: 1.55, color: "rgba(255,255,255,0.78)", marginTop: "8px" }}>
        {summary.summary}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "10px", marginTop: "14px" }}>
        <Metric label="Avg first response" value={summary.averageTimeToFirstResponseDays != null ? `${summary.averageTimeToFirstResponseDays}d` : "Not yet measured"} />
        <Metric label="Open" value={String(summary.openCheckpointCount)} />
        <Metric label="Overdue" value={String(summary.overdueCheckpointCount)} />
        <Metric label="Completed" value={String(summary.completedCheckpointCount)} />
        <Metric label="Blocked" value={String(summary.blockedCheckpointCount)} />
      </div>
      <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.24)", marginTop: "12px" }}>
        Scope: {summary.meta.scope.scopeLabel} · Source: {summary.sourceLabel} · Recorded: {formatDate(summary.meta.capturedAt ?? summary.meta.currentCapturedAt)}
      </p>
      <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.24)", marginTop: "6px" }}>
        Evidence posture: {summary.evidencePosture.replace(/_/g, " ").toLowerCase()} · Data quality: {summary.meta.dataQuality.toLowerCase().replace(/_/g, " ")}
      </p>
      {summary.caution && (
        <p style={{ fontSize: "12px", lineHeight: 1.55, color: "rgba(255,255,255,0.34)", marginTop: "6px" }}>
          {summary.caution}
        </p>
      )}
      {summary.meta.nextAction && (
        <p style={{ fontSize: "12px", lineHeight: 1.55, color: "rgba(255,255,255,0.42)", marginTop: "6px" }}>
          Next action: {summary.meta.nextAction}
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
        {label}
      </div>
      <div style={{ ...serif, fontSize: "0.95rem", lineHeight: 1.45, color: "rgba(255,255,255,0.72)", marginTop: "4px" }}>
        {value}
      </div>
    </div>
  );
}
