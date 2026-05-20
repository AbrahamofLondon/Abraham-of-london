import * as React from "react";
import type { GmiSourceCoverageScore } from "@/lib/intelligence/gmi-source-coverage-score";
import type { GmiSourceAppendixRow } from "@/lib/intelligence/gmi-source-appendix-registry";

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type GmiEvidenceRoomProps = {
  reportId: string;
  coverage: GmiSourceCoverageScore;
  mode: "admin" | "buyer-preview";
  /** Source appendix rows — admin mode only. */
  rows?: readonly GmiSourceAppendixRow[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function statusColor(status: GmiSourceAppendixRow["status"]): string {
  switch (status) {
    case "VERIFIED":
    case "CARRIED_FORWARD":    return "rgba(34,197,94,0.65)";
    case "EVIDENCE_COLLECTED": return "rgba(59,130,246,0.65)";
    case "METHOD_NOTE_REQUIRED":
    case "SOURCE_PENDING":     return "rgba(245,158,11,0.65)";
    case "REJECTED":           return "rgba(239,68,68,0.65)";
    default:                   return "rgba(255,255,255,0.22)";
  }
}

function statusLabel(status: GmiSourceAppendixRow["status"]): string {
  switch (status) {
    case "VERIFIED":              return "Verified";
    case "CARRIED_FORWARD":       return "Carried forward";
    case "EVIDENCE_COLLECTED":    return "Evidence collected";
    case "METHOD_NOTE_REQUIRED":  return "Method note required";
    case "SOURCE_PENDING":        return "Source pending";
    case "REJECTED":              return "Rejected";
    default:                      return status;
  }
}

function evidenceClassLabel(cls: GmiSourceAppendixRow["evidenceClass"]): string {
  switch (cls) {
    case "PRIMARY_DATA":          return "Primary data";
    case "INSTITUTIONAL_SOURCE":  return "Institutional source";
    case "MARKET_IMPLIED_SIGNAL": return "Market-implied signal";
    case "MODELLED_ESTIMATE":     return "Modelled estimate";
    case "SCENARIO_ASSUMPTION":   return "Scenario assumption";
    case "OPERATOR_JUDGEMENT":    return "Operator judgement";
    default:                      return cls;
  }
}

function coverageScoreTone(score: number): string {
  if (score >= 90) return "text-emerald-300";
  if (score >= 80) return "text-amber-300";
  return "text-rose-300";
}

// ─────────────────────────────────────────────────────────────────────────────
// Buyer-preview mode — posture summary only, no claim-level detail
// ─────────────────────────────────────────────────────────────────────────────

function BuyerPreviewRoom({
  coverage,
}: {
  coverage: GmiSourceCoverageScore;
}) {
  return (
    <section
      style={{
        border: "1px solid rgba(255,255,255,0.09)",
        background: "rgba(255,255,255,0.015)",
        padding: "1.25rem",
      }}
    >
      <p
        style={{
          ...mono,
          fontSize: "8px",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: `${GOLD}BB`,
        }}
      >
        Source evidence posture
      </p>
      <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>
        Every major claim in the institutional edition maps to a source row with
        an evidence class, observation window, and confidence band.
      </p>

      <div
        className="mt-4 grid gap-px sm:grid-cols-3"
        style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
      >
        {[
          {
            label: "Claims registered",
            value: String(coverage.totalRows),
            note: "In source appendix",
          },
          {
            label: "Verified",
            value: String(coverage.verifiedRows),
            note: "Source-confirmed or carried forward",
          },
          {
            label: "Coverage score",
            value: `${coverage.coverageScore}%`,
            note: "Verified ÷ total claims",
          },
        ].map((item) => (
          <div
            key={item.label}
            style={{ backgroundColor: "rgb(3,3,5)", padding: "0.90rem" }}
          >
            <div
              style={{
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.20em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.28)",
              }}
            >
              {item.label}
            </div>
            <div
              className="mt-1.5 text-sm"
              style={{ color: `${GOLD}CC` }}
            >
              {item.value}
            </div>
            <div
              style={{
                ...mono,
                fontSize: "7px",
                color: "rgba(255,255,255,0.22)",
                marginTop: "3px",
              }}
            >
              {item.note}
            </div>
          </div>
        ))}
      </div>

      <p
        className="mt-3 text-xs leading-5"
        style={{ color: "rgba(255,255,255,0.28)" }}
      >
        The full source appendix is included in the institutional edition.
        Source-pending rows are disclosed in the draft. Active releases must
        clear all release-blocking pending rows before publication.
      </p>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin mode — full breakdown with per-row detail
// ─────────────────────────────────────────────────────────────────────────────

function AdminRoom({
  reportId,
  coverage,
  rows,
}: {
  reportId: string;
  coverage: GmiSourceCoverageScore;
  rows: readonly GmiSourceAppendixRow[];
}) {
  return (
    <div className="space-y-5">
      {/* Coverage metrics */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Total rows", value: coverage.totalRows, tone: "neutral" as const },
          { label: "Verified", value: coverage.verifiedRows, tone: "success" as const },
          { label: "Pending", value: coverage.pendingRows, tone: "warning" as const },
          { label: "Blocker rows", value: coverage.blockerRows, tone: "danger" as const },
          {
            label: "Coverage",
            value: `${coverage.coverageScore}%`,
            tone: coverage.coverageScore >= 80 ? "warning" as const : "danger" as const,
          },
          {
            label: "Release safe",
            value: coverage.releaseSafe ? "Yes" : "No",
            tone: coverage.releaseSafe ? "success" as const : "danger" as const,
          },
        ].map((metric) => (
          <div key={metric.label} className="border border-white/5 bg-black/20 p-3">
            <p className="text-[8px] font-mono uppercase tracking-[0.18em] text-white/30">
              {metric.label}
            </p>
            <p
              className={`mt-2 text-lg font-light ${
                metric.tone === "success" ? "text-emerald-300" :
                metric.tone === "warning" ? "text-amber-300" :
                metric.tone === "danger"  ? "text-rose-300" :
                "text-white"
              }`}
            >
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      {/* Coverage bar */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[8px] font-mono uppercase tracking-[0.18em] text-white/30">
            Source coverage — {reportId}
          </p>
          <p className={`text-[8px] font-mono ${coverageScoreTone(coverage.coverageScore)}`}>
            {coverage.coverageScore}% / Release threshold 80%
          </p>
        </div>
        <div className="h-1 w-full overflow-hidden bg-white/5">
          <div
            className="h-full transition-all"
            style={{
              width: `${Math.min(coverage.coverageScore, 100)}%`,
              backgroundColor:
                coverage.coverageScore >= 80
                  ? "rgba(245,158,11,0.55)"
                  : "rgba(239,68,68,0.55)",
            }}
          />
        </div>
      </div>

      {/* Per-row table */}
      {rows.length > 0 && (
        <div>
          <p className="mb-2 text-[9px] font-mono uppercase tracking-[0.22em] text-white/30">
            Source appendix rows ({rows.length})
          </p>
          <div className="space-y-1.5">
            {rows.map((row) => (
              <div
                key={row.id}
                className="border border-white/[0.04] bg-black/15 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: statusColor(row.status) }}
                    />
                    <span className="text-[8px] font-mono uppercase tracking-[0.14em] text-white/35">
                      {row.id}
                    </span>
                    {row.releaseBlocker && (
                      <span className="text-[7px] font-mono uppercase tracking-[0.12em] text-rose-400/60">
                        blocker
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-[7px] font-mono text-white/25">
                      {evidenceClassLabel(row.evidenceClass)}
                    </span>
                    <span
                      className="text-[7px] font-mono uppercase tracking-[0.12em]"
                      style={{ color: statusColor(row.status) }}
                    >
                      {statusLabel(row.status)}
                    </span>
                  </div>
                </div>
                <p className="mt-1.5 text-xs leading-5 text-white/52">
                  {row.claim}
                </p>
                <p className="mt-1 text-[8px] font-mono text-white/25">
                  {row.reportSection} · {row.observationWindow} ·{" "}
                  {row.confidence}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export function GmiEvidenceRoom({
  reportId,
  coverage,
  mode,
  rows = [],
}: GmiEvidenceRoomProps) {
  if (mode === "buyer-preview") {
    return <BuyerPreviewRoom coverage={coverage} />;
  }

  return (
    <AdminRoom reportId={reportId} coverage={coverage} rows={rows} />
  );
}
