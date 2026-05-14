import * as React from "react";

import { metadataLabelStyle } from "@/lib/design/typography";
import type {
  ClientSafeProvenanceSummary,
  ClientSafeConfidenceBand,
  ClientSafeGapSeverity,
  ClientSafeTimelineEntry,
} from "@/lib/product/client-safe-provenance-contract";

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };
const GOLD = "#C9A96E";

const CAVEAT =
  "This summary records the visible chain of custody for this oversight cycle. Internal review notes and protected suppression details are not exposed in this view.";

const DELIVERY_LABEL: Record<string, string> = {
  DELIVERED: "Delivered",
  APPROVED: "Approved for delivery",
  PENDING: "Pending",
  UNKNOWN: "Not yet recorded",
};

const OUTCOME_LABEL: Record<string, string> = {
  RECORDED: "Recorded",
  PENDING: "Pending",
  UNKNOWN: "Not yet recorded",
};

const CONFIDENCE_LABEL: Record<string, string> = {
  OPERATOR_VERIFIED: "Operator-verified",
  THIRD_PARTY: "Third-party verified",
  SYSTEM_INFERRED: "System-inferred",
  USER_REPORTED: "User-reported",
};

export type ProvenanceSummaryPanelModel = {
  empty: boolean;
  accountabilityStatement: string;
  hashDisplay: string;
  deliveryLabel: string;
  outcomeLabel: string;
  gapCount: number;
  criticalGaps: number;
  warningGaps: number;
  infoGaps: number;
  confidenceBands: Array<{ level: string; label: string; count: number }>;
  timeline: Array<{ milestone: string; label: string; occurredAt: string | null; displayDate: string | null }>;
  caveat: string;
};

function formatDisplayDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return null;
  }
}

function countBySeverity(classes: ClientSafeGapSeverity[], severity: ClientSafeGapSeverity): number {
  return classes.filter((c) => c === severity).length;
}

export function buildProvenanceSummaryPanelModel(
  summary: ClientSafeProvenanceSummary | null,
): ProvenanceSummaryPanelModel {
  if (!summary) {
    return {
      empty: true,
      accountabilityStatement: "Provenance summary is not available for this cycle.",
      hashDisplay: "",
      deliveryLabel: "Not yet recorded",
      outcomeLabel: "Not yet recorded",
      gapCount: 0,
      criticalGaps: 0,
      warningGaps: 0,
      infoGaps: 0,
      confidenceBands: [],
      timeline: [],
      caveat: CAVEAT,
    };
  }

  const hashDisplay =
    summary.provenanceHash.length > 12
      ? `${summary.provenanceHash.slice(0, 12)}…`
      : summary.provenanceHash;

  const confidenceBands = summary.confidenceBands.map((band: ClientSafeConfidenceBand) => ({
    level: band.level,
    label: CONFIDENCE_LABEL[band.level] ?? band.level,
    count: band.count,
  }));

  const timeline = summary.timelineSummary.map((entry: ClientSafeTimelineEntry) => ({
    milestone: entry.milestone,
    label: entry.label,
    occurredAt: entry.occurredAt,
    displayDate: formatDisplayDate(entry.occurredAt),
  }));

  return {
    empty: false,
    accountabilityStatement: summary.accountabilityStatement,
    hashDisplay,
    deliveryLabel: DELIVERY_LABEL[summary.deliveryPosture] ?? summary.deliveryPosture,
    outcomeLabel: OUTCOME_LABEL[summary.outcomePosture] ?? summary.outcomePosture,
    gapCount: summary.gapCount,
    criticalGaps: countBySeverity(summary.gapClasses, "CRITICAL"),
    warningGaps: countBySeverity(summary.gapClasses, "WARNING"),
    infoGaps: countBySeverity(summary.gapClasses, "INFO"),
    confidenceBands,
    timeline,
    caveat: CAVEAT,
  };
}

export default function ProvenanceSummaryPanel({
  provenance,
}: {
  provenance: ClientSafeProvenanceSummary | null;
}) {
  const model = buildProvenanceSummaryPanelModel(provenance);

  if (model.empty) {
    return (
      <p style={{ ...serif, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
        {model.accountabilityStatement}
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <p style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.65 }}>
        {model.accountabilityStatement}
      </p>

      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <p style={{ ...metadataLabelStyle, color: "rgba(255,255,255,0.30)" }}>Delivery</p>
          <p className="mt-1" style={{ ...serif, color: "rgba(255,255,255,0.78)", lineHeight: 1.5 }}>
            {model.deliveryLabel}
          </p>
        </div>
        <div>
          <p style={{ ...metadataLabelStyle, color: "rgba(255,255,255,0.30)" }}>Outcome</p>
          <p className="mt-1" style={{ ...serif, color: "rgba(255,255,255,0.78)", lineHeight: 1.5 }}>
            {model.outcomeLabel}
          </p>
        </div>
        <div>
          <p style={{ ...metadataLabelStyle, color: "rgba(255,255,255,0.30)" }}>Provenance gaps</p>
          <p className="mt-1" style={{ ...serif, color: "rgba(255,255,255,0.78)", lineHeight: 1.5 }}>
            {model.gapCount === 0 ? "None recorded" : (
              [
                model.criticalGaps > 0 && `${model.criticalGaps} critical`,
                model.warningGaps > 0 && `${model.warningGaps} warning`,
                model.infoGaps > 0 && `${model.infoGaps} info`,
              ]
                .filter(Boolean)
                .join(" · ")
            )}
          </p>
        </div>
      </div>

      {model.confidenceBands.length > 0 && (
        <div>
          <p style={{ ...metadataLabelStyle, color: "rgba(255,255,255,0.30)" }}>Evidence confidence</p>
          <div className="mt-2 flex flex-wrap gap-3">
            {model.confidenceBands.map((band) => (
              <div
                key={band.level}
                style={{ border: "1px solid rgba(255,255,255,0.10)", padding: "4px 10px" }}
              >
                <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.14em", color: `${GOLD}88` }}>
                  {band.label}
                </span>
                <span style={{ ...mono, fontSize: "9px", color: "rgba(255,255,255,0.45)", marginLeft: "6px" }}>
                  {band.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {model.timeline.length > 0 && (
        <div>
          <p style={{ ...metadataLabelStyle, color: "rgba(255,255,255,0.30)" }}>Milestone timeline</p>
          <div className="mt-2 space-y-2">
            {model.timeline.map((entry, idx) => (
              <div
                key={`${entry.milestone}-${idx}`}
                style={{ display: "flex", alignItems: "baseline", gap: "10px" }}
              >
                <span
                  style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.25)", minWidth: "72px" }}
                >
                  {entry.displayDate ?? "—"}
                </span>
                <span style={{ ...serif, fontSize: "0.88rem", color: "rgba(255,255,255,0.62)", lineHeight: 1.5 }}>
                  {entry.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "14px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
          <p style={{ ...metadataLabelStyle, color: "rgba(255,255,255,0.28)" }}>Provenance hash</p>
          <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.38)" }}>
            {model.hashDisplay}
          </span>
        </div>
        <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.22)", lineHeight: 1.7 }}>
          {model.caveat}
        </p>
      </div>
    </div>
  );
}
