import * as React from "react";
import type { MarketCallRecord } from "@/lib/intelligence/market-intelligence-call-ledger";
import { getCallScoreLabel } from "@/lib/intelligence/market-intelligence-call-ledger";

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens (consistent with market.tsx)
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type GmiPriorCallScorecardData = {
  reportId: string;
  priorReportId: string;
  reviewWindow: string;
  total: number;
  dueInCurrentQuarter: number;
  carriedForward: number;
  reviewed: number;
  pending: number;
};

export type GmiPriorCallScorecardProps = {
  data: GmiPriorCallScorecardData;
  mode: "public" | "admin";
  /** Per-call records — admin mode only. Never passed in public mode. */
  calls?: readonly MarketCallRecord[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function outcomeLabel(status: MarketCallRecord["outcomeStatus"]): string {
  if (!status) return "Not yet assessable";
  switch (status) {
    case "CONFIRMED_STRONGLY":    return "Confirmed — strongly";
    case "DIRECTIONALLY_CONFIRMED": return "Confirmed — directional";
    case "PARTIALLY_CONFIRMED":   return "Partially confirmed";
    case "TOO_EARLY_TO_ASSESS":   return "Too early to assess";
    case "WEAKLY_SUPPORTED":      return "Weakly supported";
    case "NOT_CONFIRMED":         return "Not confirmed";
    case "DISCONFIRMED":          return "Disconfirmed";
    case "PENDING_REVIEW":        return "Pending review";
    default:                      return "Not yet assessable";
  }
}

function outcomeDotColor(status: MarketCallRecord["outcomeStatus"]): string {
  if (!status || status === "TOO_EARLY_TO_ASSESS" || status === "PENDING_REVIEW") {
    return "rgba(255,255,255,0.22)";
  }
  if (status === "CONFIRMED_STRONGLY" || status === "DIRECTIONALLY_CONFIRMED") {
    return "rgba(34,197,94,0.65)";
  }
  if (status === "PARTIALLY_CONFIRMED" || status === "WEAKLY_SUPPORTED") {
    return "rgba(245,158,11,0.65)";
  }
  return "rgba(239,68,68,0.65)";
}

function callTypeBadge(callType: MarketCallRecord["callType"]): string {
  switch (callType) {
    case "STRUCTURAL_THESIS":     return "Structural thesis";
    case "BOARD_INSTRUCTION":     return "Board instruction";
    case "PREDICTION":            return "Prediction";
    case "SCENARIO_PROBABILITY":  return "Scenario probability";
    case "RISK_WARNING":          return "Risk warning";
    case "OPPORTUNITY_SIGNAL":    return "Opportunity signal";
    case "WATCH_SIGNAL":          return "Watch signal";
    default:                      return "Call";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public mode — aggregate only, no per-call details, no performance claims
// ─────────────────────────────────────────────────────────────────────────────

function PublicScorecard({ data }: { data: GmiPriorCallScorecardData }) {
  const metrics = [
    { label: `${data.priorReportId} material calls recorded`, value: String(data.total) },
    { label: `Due for ${data.reviewWindow} review`, value: String(data.dueInCurrentQuarter) },
    { label: "Carried toward Q3 review", value: String(data.carriedForward) },
    { label: "Reviewed", value: String(data.reviewed) },
    { label: "Pending review", value: String(data.pending) },
  ];

  return (
    <section
      style={{
        border: `1px solid ${GOLD}20`,
        background: `${GOLD}04`,
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
        Prior-call verification record
      </p>
      <p
        className="mt-1 text-xs"
        style={{ color: "rgba(255,255,255,0.38)" }}
      >
        Every quarterly report reviews the material calls from the previous
        quarter before issuing the next one.
      </p>

      <div
        className="mt-4 grid gap-px"
        style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
      >
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="flex items-center justify-between"
            style={{ backgroundColor: "rgb(3,3,5)", padding: "0.75rem" }}
          >
            <span
              style={{
                ...mono,
                fontSize: "8px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.32)",
              }}
            >
              {metric.label}
            </span>
            <span
              style={{
                ...mono,
                fontSize: "12px",
                color: `${GOLD}CC`,
              }}
            >
              {metric.value}
            </span>
          </div>
        ))}
      </div>

      <p
        className="mt-3 text-xs leading-5"
        style={{ color: "rgba(255,255,255,0.28)" }}
      >
        Reviews are completed after quarter close. Calls in a TOO_EARLY_TO_ASSESS
        state are not scored until the evidence window matures. This record is
        updated when calls are reviewed, not as a performance claim.
      </p>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin mode — aggregate + per-call breakdown
// ─────────────────────────────────────────────────────────────────────────────

function AdminScorecard({
  data,
  calls,
}: {
  data: GmiPriorCallScorecardData;
  calls: readonly MarketCallRecord[];
}) {
  const dueThisQuarter = calls.filter(
    (c) => c.expectedReviewWindow === data.reviewWindow,
  );
  const carriedForwardCalls = calls.filter(
    (c) => c.expectedReviewWindow !== data.reviewWindow,
  );

  return (
    <div className="space-y-5">
      {/* Aggregate metrics */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: "Total calls", value: data.total, tone: "neutral" },
          { label: `Due in ${data.reviewWindow}`, value: data.dueInCurrentQuarter, tone: "warning" },
          { label: "Carried forward", value: data.carriedForward, tone: "info" },
          { label: "Reviewed", value: data.reviewed, tone: data.reviewed > 0 ? "success" : "muted" },
          { label: "Pending", value: data.pending, tone: data.pending > 0 ? "danger" : "success" },
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
                metric.tone === "info"    ? "text-blue-300" :
                metric.tone === "muted"   ? "text-white/40" :
                "text-white"
              }`}
            >
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      {/* Per-call table — due this quarter */}
      {dueThisQuarter.length > 0 && (
        <div>
          <p className="mb-2 text-[9px] font-mono uppercase tracking-[0.22em] text-white/30">
            Calls due in {data.reviewWindow}
          </p>
          <div className="space-y-2">
            {dueThisQuarter.map((call) => (
              <div
                key={call.id}
                className="border border-white/5 bg-black/20 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: outcomeDotColor(call.outcomeStatus) }}
                    />
                    <div>
                      <span className="text-[8px] font-mono uppercase tracking-[0.16em] text-white/35">
                        {call.id}
                      </span>
                      <span className="ml-2 text-[8px] font-mono uppercase tracking-[0.12em] text-amber-300/50">
                        {callTypeBadge(call.callType)}
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 text-[8px] font-mono text-white/30">
                    {outcomeLabel(call.outcomeStatus)}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-white/55">
                  {call.statement.length > 160
                    ? `${call.statement.slice(0, 160)}…`
                    : call.statement}
                </p>
                {call.score !== null && call.score !== undefined && (
                  <p className="mt-1 text-[8px] font-mono text-white/30">
                    Score: {call.score}/5 — {getCallScoreLabel(call.score)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Carried forward calls */}
      {carriedForwardCalls.length > 0 && (
        <div>
          <p className="mb-2 text-[9px] font-mono uppercase tracking-[0.22em] text-white/30">
            Carried toward {carriedForwardCalls[0]?.expectedReviewWindow ?? "later window"}
          </p>
          <div className="space-y-1">
            {carriedForwardCalls.map((call) => (
              <div
                key={call.id}
                className="flex items-center justify-between border border-white/5 bg-black/10 px-3 py-2"
              >
                <span className="text-[8px] font-mono uppercase tracking-[0.14em] text-white/30">
                  {call.id} — {callTypeBadge(call.callType)}
                </span>
                <span className="text-[8px] font-mono text-blue-300/50">
                  Review: {call.expectedReviewWindow}
                </span>
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

export function GmiPriorCallScorecard({
  data,
  mode,
  calls = [],
}: GmiPriorCallScorecardProps) {
  if (mode === "public") {
    return <PublicScorecard data={data} />;
  }

  return <AdminScorecard data={data} calls={calls} />;
}
