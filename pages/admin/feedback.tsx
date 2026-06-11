import type { GetServerSidePropsContext } from "next";
import type { CSSProperties } from "react";
import { requireAdminPage } from "@/lib/access/server";
import {
  getFeedbackAdminRows,
  getFeedbackHealthMetrics,
} from "@/lib/feedback/feedback-service";
import type { FeedbackAdminRow, FeedbackHealthMetrics } from "@/lib/feedback/feedback-types";

type Row = Omit<FeedbackAdminRow, "createdAt"> & { createdAt: string };

type PageProps = {
  metrics: FeedbackHealthMetrics;
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

export default function AdminFeedbackPage({ metrics, rows }: PageProps) {
  const csv = toCsv(rows);

  const reviewRows = rows.filter((row) => row.reviewRequired);
  const falsificationRows = rows.filter((row) => row.linkedFalsificationEntryId);
  const caseStudyRows = rows.filter((row) => row.linkedCaseStudyId);
  const salesRows = rows.filter((row) => row.actionStatus === "linked_to_sales_followup");

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

  const [metrics, rows] = await Promise.all([
    getFeedbackHealthMetrics(),
    getFeedbackAdminRows(100),
  ]);

  return {
    props: {
      ...guard.props,
      metrics,
      rows: rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
    },
  };
}
