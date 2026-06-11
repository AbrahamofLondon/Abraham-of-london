import type { GetServerSidePropsContext } from "next";
import { useState } from "react";
import type { CSSProperties } from "react";
import { requireAdminPage } from "@/lib/access/server";
import {
  getFeedbackAdoptionAnalytics,
  getFeedbackAdminRows,
  getFeedbackHealthMetrics,
} from "@/lib/feedback/feedback-service";
import type { FeedbackAdoptionAnalytics, FeedbackAdminRow, FeedbackHealthMetrics } from "@/lib/feedback/feedback-types";

type Row = Omit<FeedbackAdminRow, "createdAt"> & { createdAt: string };

type PageProps = {
  metrics: FeedbackHealthMetrics;
  analytics: FeedbackAdoptionAnalytics;
  rows: Row[];
};

const panel: CSSProperties = {
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.025)",
  padding: "16px",
};

const mono: CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  letterSpacing: 0,
  textTransform: "uppercase",
};

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={panel}>
      <p style={{ ...mono, fontSize: 10, color: "rgba(255,255,255,0.42)" }}>{label}</p>
      <p style={{ fontSize: 28, color: "rgba(255,255,255,0.86)", marginTop: 8 }}>{value}</p>
    </div>
  );
}

function pct(value: number | null): string {
  return value === null ? "n/a" : `${value}%`;
}

function toCsv(rows: Row[]): string {
  const headers = [
    "feedbackId",
    "surface",
    "rating",
    "category",
    "confidence",
    "productCode",
    "actionStatus",
    "severity",
    "reviewRequired",
    "createdAt",
  ];
  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((key) => escape(row[key as keyof Row])).join(",")),
  ].join("\n");
}

export default function AdminFeedbackPage({ metrics, analytics, rows }: PageProps) {
  const csv = toCsv(rows);
  const suggestedCluster = rows
    .filter((row) =>
      row.surface === "decision_centre_case" ||
      row.surface === "retainer_review_cycle" ||
      row.reviewRequired ||
      row.confidence >= 4,
    )
    .slice(0, 5)
    .map((row) => row.feedbackId)
    .join(",");
  const [clusterIds, setClusterIds] = useState(suggestedCluster);
  const [readinessResult, setReadinessResult] = useState<string | null>(null);
  const [readinessError, setReadinessError] = useState<string | null>(null);

  const reviewRows = rows.filter((row) => row.reviewRequired);
  const falsificationRows = rows.filter((row) => row.linkedFalsificationEntryId);
  const caseStudyRows = rows.filter((row) => row.linkedCaseStudyId);
  const salesRows = rows.filter((row) => row.actionStatus === "linked_to_sales_followup");

  async function createRetainerReadiness() {
    setReadinessResult(null);
    setReadinessError(null);
    try {
      const res = await fetch("/api/admin/feedback/retainer-readiness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackIds: clusterIds }),
      });
      const data = await res.json().catch(() => null) as { ok?: boolean; evaluationId?: string; readinessClass?: string; error?: string } | null;
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? "Action failed");
      setReadinessResult(`Created ${data.readinessClass} evaluation ${data.evaluationId}.`);
    } catch (error) {
      setReadinessError(error instanceof Error ? error.message : "Action failed");
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#070707", color: "white", padding: "32px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <p style={{ ...mono, fontSize: 11, color: "rgba(201,169,110,0.78)" }}>Product judgement intelligence</p>
          <h1 style={{ fontSize: 34, marginTop: 8 }}>Feedback Command Centre</h1>
        </div>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <MetricCard label="Total feedback" value={metrics.totalFeedback} />
          <MetricCard label="Positive rate" value={pct(metrics.positiveRate)} />
          <MetricCard label="Negative rate" value={pct(metrics.negativeRate)} />
          <MetricCard label="Weighted positive" value={pct(metrics.confidenceWeightedPositiveRate)} />
          <MetricCard label="Weighted negative" value={pct(metrics.confidenceWeightedNegativeRate)} />
          <MetricCard label="Review required" value={metrics.reviewRequiredCount} />
          <MetricCard label="Paid negative" value={metrics.paidProductNegativeCount} />
          <MetricCard label="Boardroom positive" value={pct(metrics.boardroomBriefDeliveredPositiveRate)} />
          <MetricCard label="Open patterns" value={metrics.unresolvedPatternCount} />
          <MetricCard label="High-conf positive" value={pct(metrics.positiveHighConfidenceRate)} />
          <MetricCard label="High-conf negative" value={pct(metrics.negativeHighConfidenceRate)} />
          <MetricCard label="Follow-up requests" value={metrics.followupRequestedCount} />
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginTop: 18 }}>
          <div style={panel}>
            <p style={{ ...mono, fontSize: 10, color: "rgba(255,255,255,0.42)" }}>Review queue</p>
            <p style={{ marginTop: 10, fontSize: 22 }}>{reviewRows.length}</p>
          </div>
          <div style={panel}>
            <p style={{ ...mono, fontSize: 10, color: "rgba(255,255,255,0.42)" }}>Falsification-linked</p>
            <p style={{ marginTop: 10, fontSize: 22 }}>{falsificationRows.length}</p>
          </div>
          <div style={panel}>
            <p style={{ ...mono, fontSize: 10, color: "rgba(255,255,255,0.42)" }}>Case-study candidates</p>
            <p style={{ marginTop: 10, fontSize: 22 }}>{caseStudyRows.length}</p>
          </div>
          <div style={panel}>
            <p style={{ ...mono, fontSize: 10, color: "rgba(255,255,255,0.42)" }}>Sales follow-up candidates</p>
            <p style={{ marginTop: 10, fontSize: 22 }}>{salesRows.length}</p>
          </div>
        </section>

        <section style={{ marginTop: 18, ...panel }}>
          <h2 style={{ fontSize: 20 }}>Adoption Analytics</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12, marginTop: 14 }}>
            {analytics.bySurface.slice(0, 8).map((surface) => (
              <div key={surface.surface} style={{ border: "1px solid rgba(255,255,255,0.06)", padding: 12 }}>
                <p style={{ ...mono, fontSize: 9, color: "rgba(201,169,110,0.78)" }}>{surface.surface}</p>
                <p style={{ marginTop: 8, color: "rgba(255,255,255,0.72)", fontSize: 13 }}>
                  positive {pct(surface.positiveRate)} · high-conf + {pct(surface.positiveHighConfidenceRate)} · high-conf - {pct(surface.negativeHighConfidenceRate)}
                </p>
                <p style={{ marginTop: 6, color: "rgba(255,255,255,0.42)", fontSize: 12 }}>
                  follow-up requests {surface.followupRequestedCount}
                </p>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 14 }}>
            <MetricCard label="Feedback → checkout" value={analytics.conversionSignals.freeFeedbackToCheckout14d} />
            <MetricCard label="Feedback → saved case" value={analytics.conversionSignals.feedbackToSaveCase14d} />
            <MetricCard label="Feedback → return visit" value={analytics.conversionSignals.feedbackToReturnVisit14d} />
            <MetricCard label="Feedback → consent" value={analytics.conversionSignals.feedbackToCaseStudyConsent30d} />
            <MetricCard label="Feedback → retainer eval" value={analytics.conversionSignals.feedbackToRetainerEvaluation30d} />
          </div>
          <p style={{ marginTop: 10, color: "rgba(255,255,255,0.36)", fontSize: 12 }}>
            These counts are associated follow-on events, not attribution claims.
          </p>
        </section>

        <section style={{ marginTop: 18, ...panel }}>
          <h2 style={{ fontSize: 20 }}>Retainer readiness action</h2>
          <p style={{ marginTop: 8, color: "rgba(255,255,255,0.48)", fontSize: 13 }}>
            Create a governed readiness evaluation from a selected feedback cluster. This does not create a contract or send an offer.
          </p>
          <textarea
            value={clusterIds}
            onChange={(event) => setClusterIds(event.target.value)}
            rows={2}
            style={{
              width: "100%",
              marginTop: 12,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.72)",
              padding: 10,
              boxSizing: "border-box",
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: 12,
            }}
          />
          <button
            type="button"
            onClick={() => void createRetainerReadiness()}
            style={{
              ...mono,
              marginTop: 10,
              border: "1px solid rgba(201,169,110,0.45)",
              background: "rgba(201,169,110,0.08)",
              color: "rgba(201,169,110,0.92)",
              padding: "8px 12px",
              cursor: "pointer",
              fontSize: 10,
            }}
          >
            Create retainer readiness evaluation from feedback cluster
          </button>
          {readinessResult && <p style={{ marginTop: 10, color: "rgba(125,211,152,0.8)", fontSize: 12 }}>{readinessResult}</p>}
          {readinessError && <p style={{ marginTop: 10, color: "rgba(252,165,165,0.8)", fontSize: 12 }}>{readinessError}</p>}
        </section>

        <section style={{ marginTop: 18, ...panel }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <h2 style={{ fontSize: 20 }}>Drill-down</h2>
            <a
              download="feedback-command-centre.csv"
              href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}
              style={{ ...mono, color: "rgba(201,169,110,0.9)", fontSize: 10 }}
            >
              Export safe CSV
            </a>
          </div>
          <div style={{ overflowX: "auto", marginTop: 14 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ color: "rgba(255,255,255,0.42)", textAlign: "left" }}>
                  <th style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Surface</th>
                  <th style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Rating</th>
                  <th style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Category</th>
                  <th style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Confidence</th>
                  <th style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Product</th>
                  <th style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Status</th>
                  <th style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.feedbackId}>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{row.surface}</td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{row.rating}</td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{row.category}</td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{row.confidence}</td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{row.productCode ?? "n/a"}</td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{row.actionStatus}</td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{new Date(row.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: "18px 8px", color: "rgba(255,255,255,0.42)" }}>
                      No feedback events recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const guard = await requireAdminPage<PageProps>(ctx);
  if ("redirect" in guard || "notFound" in guard) return guard;

  const [metrics, analytics, rows] = await Promise.all([
    getFeedbackHealthMetrics(),
    getFeedbackAdoptionAnalytics(),
    getFeedbackAdminRows(100),
  ]);

  return {
    props: {
      ...guard.props,
      metrics,
      analytics,
      rows: rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
    },
  };
}
