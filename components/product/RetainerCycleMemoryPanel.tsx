import * as React from "react";

import { metadataLabelStyle } from "@/lib/design/typography";
import type {
  RetainerCycleMemoryFinding,
  RetainerCycleMemorySummary,
} from "@/lib/product/retainer-cycle-memory-contract";

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

type RetainerCycleMemoryPanelModel = {
  empty: boolean;
  statusLabel: string;
  escalationLabel: string;
  escalationRequired: boolean;
  summary: string;
  findings: Array<{
    id: string;
    statusLabel: string;
    severity: string;
    signalKey: string;
    sourceLabel: string | null;
    explanation: string;
    recommendedAction: string;
  }>;
};

export function getRetainerCycleMemoryStatusLabel(status: string): string {
  switch (status) {
    case "NEW_SIGNAL":
      return "New operating signal";
    case "REPEATED_SIGNAL":
      return "Repeated operating pattern";
    case "DETERIORATED_AFTER_WARNING":
      return "Deteriorated after prior warning";
    case "DETERIORATED_AFTER_INTERVENTION":
      return "Deteriorated after intervention";
    case "IMPROVED_AFTER_INTERVENTION":
      return "Improved after intervention";
    case "STABLE_UNRESOLVED":
      return "Stable but unresolved";
    case "EVIDENCE_UNAVAILABLE":
      return "Evidence unavailable";
    case "INSUFFICIENT_HISTORY":
      return "Insufficient history";
    default:
      return "Retained cycle memory";
  }
}

export function getRetainerCycleMemoryEscalationLabel(level: string): string {
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

function formatFindingSource(finding: RetainerCycleMemoryFinding): string | null {
  if (!finding.source) {
    return null;
  }

  return finding.source
    .split(/[_\s]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function buildRetainerCycleMemoryPanelModel(
  memory?: RetainerCycleMemorySummary | null,
): RetainerCycleMemoryPanelModel {
  if (!memory || memory.status === "insufficient") {
    return {
      empty: true,
      statusLabel: "Insufficient history",
      escalationLabel: "No escalation required.",
      escalationRequired: false,
      summary: "Retainer Cycle Memory will become available once there is enough archived oversight history to compare retained patterns across cycles.",
      findings: [],
    };
  }

  return {
    empty: false,
    statusLabel: memory.status === "partial" ? "Partial retained record" : "Retained record available",
    escalationLabel: getRetainerCycleMemoryEscalationLabel(memory.escalationLevel),
    escalationRequired: memory.escalationRequired,
    summary: memory.summary,
    findings: memory.findings.slice(0, 5).map((finding) => ({
      id: finding.id,
      statusLabel: getRetainerCycleMemoryStatusLabel(finding.status),
      severity: finding.severity,
      signalKey: finding.signalKey,
      sourceLabel: formatFindingSource(finding),
      explanation: finding.explanation,
      recommendedAction: finding.recommendedAction,
    })),
  };
}

export default function RetainerCycleMemoryPanel(input: {
  retainerCycleMemory?: RetainerCycleMemorySummary | null;
}) {
  const model = buildRetainerCycleMemoryPanelModel(input.retainerCycleMemory);

  if (model.empty) {
    return (
      <p style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
        {model.summary}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <p style={{ ...metadataLabelStyle, color: "rgba(255,255,255,0.30)" }}>
            Record status
          </p>
          <p className="mt-1" style={{ ...serif, color: "rgba(255,255,255,0.78)", lineHeight: 1.5 }}>
            {model.statusLabel}
          </p>
        </div>
        <div>
          <p style={{ ...metadataLabelStyle, color: "rgba(255,255,255,0.30)" }}>
            Escalation
          </p>
          <p className="mt-1" style={{ ...serif, color: "rgba(255,255,255,0.78)", lineHeight: 1.5 }}>
            {model.escalationLabel}
          </p>
        </div>
        <div>
          <p style={{ ...metadataLabelStyle, color: "rgba(255,255,255,0.30)" }}>
            Escalation required
          </p>
          <p className="mt-1" style={{ ...serif, color: "rgba(255,255,255,0.78)", lineHeight: 1.5 }}>
            {model.escalationRequired ? "Yes" : "No"}
          </p>
        </div>
      </div>

      <p style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
        {model.summary}
      </p>

      {model.findings.length > 0 && (
        <div className="space-y-4">
          {model.findings.map((finding) => (
            <div
              key={finding.id}
              style={{ borderLeft: "2px solid rgba(201,169,110,0.28)", paddingLeft: "16px" }}
            >
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(201,169,110,0.62)" }}>
                {finding.statusLabel} · {finding.severity}
              </p>
              <p className="mt-1" style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.56)" }}>
                {finding.sourceLabel ? `${finding.sourceLabel} · ${finding.signalKey}` : finding.signalKey}
              </p>
              <p className="mt-1" style={{ ...serif, color: "rgba(255,255,255,0.74)", lineHeight: 1.6 }}>
                {finding.explanation}
              </p>
              <p className="mt-1" style={{ ...serif, color: "rgba(255,255,255,0.56)", lineHeight: 1.6, fontStyle: "italic" }}>
                Recommended: {finding.recommendedAction}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
