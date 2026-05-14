import * as React from "react";

import { metadataLabelStyle, microLabelStyle } from "@/lib/design/typography";
import type { DecisionCentreRetainerMemoryPreview } from "@/lib/product/decision-centre-contract";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

export const retainerMemoryPreviewStyles = {
  metadataLabel: metadataLabelStyle,
  microLabel: microLabelStyle,
} as const;

type RetainerMemoryPreviewModel = {
  empty: boolean;
  statusLabel: string;
  statusCopy: string;
  escalationLabel: string;
  summary: string;
  findings: Array<{
    statusLabel: string;
    severity: string;
    sourceLabel: string;
    signalKey: string;
    explanation: string;
    recommendedAction: string;
  }>;
};

export function getDecisionCentreRetainerMemoryStatusLabel(status: string): string {
  switch (status) {
    case "NEW_SIGNAL":
      return "New signal";
    case "REPEATED_SIGNAL":
      return "Repeated pattern";
    case "DETERIORATED_AFTER_WARNING":
      return "Deteriorated after warning";
    case "DETERIORATED_AFTER_INTERVENTION":
      return "Deteriorated after intervention";
    case "IMPROVED_AFTER_INTERVENTION":
      return "Improved after intervention";
    case "STABLE_UNRESOLVED":
      return "Stable unresolved pattern";
    case "EVIDENCE_UNAVAILABLE":
      return "Evidence unavailable";
    case "INSUFFICIENT_HISTORY":
      return "Insufficient history";
    default:
      return "Retained memory";
  }
}

export function getDecisionCentreRetainerMemoryStatusCopy(status: string): string {
  switch (status) {
    case "NEW_SIGNAL":
      return "This is a first-cycle signal, not recurrence.";
    case "REPEATED_SIGNAL":
      return "Prior cycle evidence indicates this operating pattern repeated.";
    case "DETERIORATED_AFTER_WARNING":
      return "Prior cycle evidence indicates this pattern deteriorated after warning.";
    case "DETERIORATED_AFTER_INTERVENTION":
      return "Prior cycle evidence indicates this pattern deteriorated after intervention.";
    case "IMPROVED_AFTER_INTERVENTION":
      return "Prior cycle evidence indicates this pattern improved after intervention.";
    case "EVIDENCE_UNAVAILABLE":
      return "Retained memory cannot classify this cycle because required evidence was unavailable.";
    case "INSUFFICIENT_HISTORY":
      return "Retained memory is establishing its baseline. This is not yet recurrence.";
    default:
      return "Retained memory indicates this pattern has appeared before.";
  }
}

export function getDecisionCentreRetainerMemoryEscalationLabel(level: string): string {
  switch (level) {
    case "OPERATING_CADENCE_RESET":
      return "Operating cadence reset recommended.";
    case "RETAINED_INTERVENTION":
      return "Retained intervention recommended.";
    case "BOARDROOM_REVIEW":
      return "Boardroom review threshold reached.";
    case "COUNSEL_REVIEW":
      return "Counsel review threshold reached.";
    default:
      return "No escalation required.";
  }
}

function formatFindingSource(source?: string | null): string {
  if (!source) return "Source unavailable";
  return source
    .split(/[_\s]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function buildRetainerMemoryPreviewModel(
  preview?: DecisionCentreRetainerMemoryPreview | null,
): RetainerMemoryPreviewModel {
  if (!preview) {
    return {
      empty: true,
      statusLabel: "Memory unavailable",
      statusCopy: "Retainer Cycle Memory will become available once there is enough archived oversight history to compare retained patterns across cycles.",
      escalationLabel: "No escalation required.",
      summary: "Retainer Cycle Memory will become available once there is enough archived oversight history to compare retained patterns across cycles.",
      findings: [],
    };
  }

  if (preview.status === "insufficient" || preview.status === "unavailable") {
    const statusCopy = preview.status === "unavailable"
      ? "Retained memory cannot classify this cycle because required evidence was unavailable."
      : "Retained memory is establishing its baseline. This is not yet recurrence.";
    return {
      empty: true,
      statusLabel: preview.status === "unavailable" ? "Evidence unavailable" : "Insufficient history",
      statusCopy,
      escalationLabel: getDecisionCentreRetainerMemoryEscalationLabel(preview.escalationLevel),
      summary: statusCopy,
      findings: [],
    };
  }

  const primaryStatus = preview.findings[0]?.status ?? "REPEATED_SIGNAL";
  return {
    empty: false,
    statusLabel: getDecisionCentreRetainerMemoryStatusLabel(primaryStatus),
    statusCopy: getDecisionCentreRetainerMemoryStatusCopy(primaryStatus),
    escalationLabel: getDecisionCentreRetainerMemoryEscalationLabel(preview.escalationLevel),
    summary: preview.summary,
    findings: preview.findings.slice(0, 3).map((finding) => ({
      statusLabel: getDecisionCentreRetainerMemoryStatusLabel(finding.status),
      severity: finding.severity,
      sourceLabel: finding.sourceLabel ?? formatFindingSource(finding.source),
      signalKey: finding.signalKey,
      explanation: finding.explanation,
      recommendedAction: finding.recommendedAction,
    })),
  };
}

export default function RetainerMemoryPreview({
  preview,
}: {
  preview?: DecisionCentreRetainerMemoryPreview | null;
}) {
  const model = buildRetainerMemoryPreviewModel(preview);

  return (
    <section style={{ border: "1px solid rgba(201,169,110,0.14)", backgroundColor: "rgba(201,169,110,0.025)", padding: "16px 20px", marginBottom: "16px" }}>
      <p style={{ ...metadataLabelStyle, letterSpacing: "0.22em", color: `${GOLD}88`, marginBottom: "8px" }}>
        Retainer memory
      </p>
      <div style={{ display: "grid", gap: "12px" }}>
        <div>
          <p style={{ ...serif, fontSize: "1rem", lineHeight: 1.45, color: "rgba(255,255,255,0.82)" }}>
            {model.statusLabel}
          </p>
          <p style={{ fontSize: "12px", lineHeight: 1.6, color: "rgba(255,255,255,0.46)", marginTop: "4px" }}>
            {model.empty ? model.summary : model.statusCopy}
          </p>
        </div>

        {!model.empty && (
          <p style={{ fontSize: "13px", lineHeight: 1.65, color: "rgba(255,255,255,0.56)" }}>
            {model.summary}
          </p>
        )}

        <div>
          <p style={{ ...metadataLabelStyle, color: "rgba(255,255,255,0.30)", marginBottom: "4px" }}>
            Escalation
          </p>
          <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.10em", color: preview?.escalationRequired ? "rgba(252,165,165,0.58)" : "rgba(255,255,255,0.42)" }}>
            {model.escalationLabel}
          </p>
        </div>

        {model.findings.length > 0 && (
          <div style={{ display: "grid", gap: "10px" }}>
            {model.findings.map((finding) => (
              <div key={`${finding.sourceLabel}-${finding.signalKey}-${finding.statusLabel}`} style={{ borderLeft: "1px solid rgba(201,169,110,0.30)", paddingLeft: "12px" }}>
                <p style={{ ...microLabelStyle, color: "rgba(201,169,110,0.72)" }}>
                  {finding.statusLabel} · {finding.severity}
                </p>
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.08em", color: "rgba(255,255,255,0.30)", marginTop: "3px" }}>
                  {finding.sourceLabel} · {finding.signalKey}
                </p>
                <p style={{ fontSize: "12px", lineHeight: 1.55, color: "rgba(255,255,255,0.54)", marginTop: "4px" }}>
                  {finding.explanation}
                </p>
                <p style={{ ...serif, fontSize: "0.86rem", lineHeight: 1.5, color: "rgba(255,255,255,0.42)", fontStyle: "italic", marginTop: "3px" }}>
                  Recommended: {finding.recommendedAction}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
