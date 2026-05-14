/**
 * components/diagnostics/BoardSummaryPreview.tsx
 *
 * Board-ready one-page HTML summary after diagnostic completion.
 * Score/band, consequence exposure, recommended next move,
 * provenance/hash section if available, scenario-only disclaimer.
 *
 * This is a preview surface — PDF export is deferred until the
 * HTML surface is stable.
 */

import * as React from "react";
import { Shield, AlertTriangle, ArrowRight, Hash, Clock, FileText } from "lucide-react";

import type { FastDiagnosticResult } from "@/lib/diagnostics/fast-diagnostic-dto";
import type { ExecutiveReport } from "@/lib/admin/reporting/executive-report-contract";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

export type BoardSummaryData = {
  title: string;
  conditionLabel: string;
  severityBand: string;
  signalStrength: string;
  primaryContradiction: string;
  costOfInaction: {
    thirtyDays: string;
    sixtyDays: string;
    ninetyDays: string;
  };
  requiredMove: string;
  comparisonBand?: string | null;
  provenanceHash?: string | null;
  detectedSignals?: Array<{
    signalName: string;
    severityBand: string;
    narrativeSummary: string;
  }>;
  sourceLabel: string;
  scenarioOnly: boolean;
};

export function buildBoardSummaryFromFastDiagnostic(
  result: FastDiagnosticResult,
  answers?: Record<string, string>,
): BoardSummaryData {
  const an = result.anchorNarrative;
  return {
    title: answers?.decision ?? "Unresolved decision",
    conditionLabel: result.conditionLabel || result.condition,
    severityBand: result.highestSignalSeverity ?? (result.signalStrength === "high" ? "ALERT" : "CONCERN"),
    signalStrength: result.signalStrength,
    primaryContradiction: result.synthesis?.primaryContradiction ?? an?.whyItExists ?? "Decision structure problem identified.",
    costOfInaction: {
      thirtyDays: an?.costOfInaction.thirtyDays ?? result.costOfInaction?.horizon30 ?? "Delay becomes normalised.",
      sixtyDays: an?.costOfInaction.sixtyDays ?? result.costOfInaction?.horizon60 ?? "Resources spent without movement.",
      ninetyDays: an?.costOfInaction.ninetyDays ?? result.costOfInaction?.horizon90 ?? "Cost of reversing exceeds cost of deciding.",
    },
    requiredMove: an?.requiredMove ?? result.synthesis?.concreteMove ?? "Assign one accountable owner.",
    comparisonBand: result.comparisonBand ?? null,
    provenanceHash: null,
    detectedSignals: result.detectedSignals?.map((s) => ({
      signalName: s.signalName,
      severityBand: s.severityBand,
      narrativeSummary: s.narrativeSummary,
    })),
    sourceLabel: "Fast Diagnostic",
    scenarioOnly: true,
  };
}

export function buildBoardSummaryFromExecutiveReport(
  report: ExecutiveReport,
): BoardSummaryData {
  return {
    title: report.headline,
    conditionLabel: report.route,
    severityBand: report.seriousness,
    signalStrength: report.seriousness === "CRITICAL" ? "high" : report.seriousness === "HIGH" ? "high" : "moderate",
    primaryContradiction: report.topPressurePoints[0] ?? "Governance pressure identified.",
    costOfInaction: {
      thirtyDays: report.executionSequence.next7Days[0] ?? "Review required.",
      sixtyDays: report.executionSequence.next30Days[0] ?? "Intervention needed.",
      ninetyDays: report.executionSequence.next90Days[0] ?? "Structural correction required.",
    },
    requiredMove: report.correctionPriorities[0] ?? report.escalationRecommendation,
    comparisonBand: null,
    provenanceHash: null,
    sourceLabel: "Executive Reporting",
    scenarioOnly: true,
  };
}

function SeverityBadge({ band }: { band: string }) {
  const color =
    band === "CRITICAL" ? "rgba(239,68,68,0.75)" :
    band === "ALERT" || band === "HIGH" ? "rgba(249,115,22,0.72)" :
    band === "CONCERN" || band === "MODERATE" ? "rgba(251,191,36,0.70)" :
    "rgba(110,231,183,0.60)";
  const bg =
    band === "CRITICAL" ? "rgba(239,68,68,0.05)" :
    band === "ALERT" || band === "HIGH" ? "rgba(249,115,22,0.04)" :
    band === "CONCERN" || band === "MODERATE" ? "rgba(251,191,36,0.03)" :
    "rgba(110,231,183,0.03)";

  return (
    <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color, backgroundColor: bg, border: `1px solid ${color}30`, padding: "0.25rem 0.6rem" }}>
      {band}
    </span>
  );
}

export default function BoardSummaryPreview({ data }: { data: BoardSummaryData | null }) {
  if (!data) return null;

  return (
    <div style={{ border: `1px solid ${GOLD}18`, backgroundColor: `${GOLD}03`, padding: "1.25rem" }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-4 w-4" style={{ color: GOLD }} />
        <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}88` }}>
          Board Summary Preview
        </span>
        <SeverityBadge band={data.severityBand} />
      </div>

      {/* Title */}
      <h2 style={{ ...serif, fontSize: "1.3rem", lineHeight: 1.2, color: "rgba(255,255,255,0.90)", marginBottom: "0.75rem" }}>
        {data.title}
      </h2>

      {/* Condition */}
      <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}77`, marginBottom: "1rem" }}>
        {data.conditionLabel} · {data.signalStrength} signal strength
      </p>

      {/* Primary contradiction */}
      <div style={{ borderLeft: `2px solid ${GOLD}30`, padding: "0.5rem 1rem", backgroundColor: `${GOLD}04`, marginBottom: "1rem" }}>
        <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}70`, marginBottom: "0.3rem" }}>
          Primary contradiction
        </p>
        <p style={{ ...serif, fontSize: "0.95rem", lineHeight: 1.5, color: "rgba(255,255,255,0.78)" }}>
          {data.primaryContradiction}
        </p>
      </div>

      {/* Cost of inaction */}
      <div style={{ marginBottom: "1rem" }}>
        <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)", marginBottom: "0.5rem" }}>
          Cost of inaction — if unresolved
        </p>
        <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          {[
            { label: "30 days", text: data.costOfInaction.thirtyDays },
            { label: "60 days", text: data.costOfInaction.sixtyDays },
            { label: "90 days", text: data.costOfInaction.ninetyDays },
          ].map((item) => (
            <div key={item.label} style={{ borderLeft: `1px solid ${GOLD}20`, paddingLeft: "0.6rem" }}>
              <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}70` }}>{item.label}</p>
              <p style={{ ...serif, fontSize: "0.8rem", lineHeight: 1.4, color: "rgba(255,255,255,0.55)", marginTop: "0.2rem" }}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Required move */}
      <div style={{ border: `1px solid ${GOLD}25`, backgroundColor: `${GOLD}06`, padding: "0.75rem 1rem", marginBottom: "1rem" }}>
        <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}90`, marginBottom: "0.3rem" }}>
          Required move
        </p>
        <p style={{ ...serif, fontSize: "0.95rem", lineHeight: 1.5, color: "rgba(255,255,255,0.85)" }}>
          {data.requiredMove}
        </p>
      </div>

      {/* Detected signals */}
      {data.detectedSignals && data.detectedSignals.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)", marginBottom: "0.5rem" }}>
            Detected signals
          </p>
          <div className="space-y-2">
            {data.detectedSignals.slice(0, 3).map((signal) => (
              <div key={signal.signalName} style={{ borderLeft: `1px solid ${GOLD}20`, paddingLeft: "0.6rem" }}>
                <div className="flex items-center gap-2">
                  <SeverityBadge band={signal.severityBand} />
                  <span style={{ ...serif, fontSize: "0.85rem", color: "rgba(255,255,255,0.75)" }}>{signal.signalName}</span>
                </div>
                <p style={{ ...serif, fontSize: "0.75rem", lineHeight: 1.4, color: "rgba(255,255,255,0.45)", marginTop: "0.2rem" }}>
                  {signal.narrativeSummary}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparison band */}
      {data.comparisonBand && (
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
            Comparison band
          </p>
          <p style={{ ...mono, fontSize: "9px", color: "rgba(255,255,255,0.50)" }}>{data.comparisonBand}</p>
        </div>
      )}

      {/* Provenance hash */}
      {data.provenanceHash && (
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
            <Hash className="inline h-3 w-3 mr-1" />
            Provenance hash
          </p>
          <p style={{ ...mono, fontSize: "8px", color: "rgba(255,255,255,0.40)", wordBreak: "break-all" }}>
            {data.provenanceHash}
          </p>
        </div>
      )}

      {/* Source + disclaimer */}
      <div style={{ borderTop: `1px solid ${GOLD}12`, paddingTop: "0.75rem" }}>
        <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.20)" }}>
          Source: {data.sourceLabel}
        </p>
        {data.scenarioOnly && (
          <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.18)", marginTop: "0.3rem" }}>
            Scenario only — not a financial forecast. Based on user-reported inputs and system-inferred analysis.
          </p>
        )}
      </div>
    </div>
  );
}
