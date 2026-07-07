import { GetServerSideProps } from "next";
import { getCrossEditionReview, getCrossEditionSummary } from "../../lib/intelligence/accountability/cross-edition-call-review";

export const getServerSideProps: GetServerSideProps = async () => {
  const review = getCrossEditionReview();
  const summary = getCrossEditionSummary();
  return { props: { review: JSON.parse(JSON.stringify(review)), summary: JSON.parse(JSON.stringify(summary)) } };
};

export default function CrossEditionReviewPage({ review, summary }: { review: any[]; summary: any }) {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24, fontFamily: "Georgia, serif", color: "rgba(255,255,255,0.82)", background: "#0a0a0b" }}>
      <h1 style={{ fontSize: 28, fontWeight: 300, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 16 }}>Cross-Edition Call Review</h1>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>
        {summary.totalCalls} calls · {summary.originated} originated · {summary.carriedForward} carried forward · {summary.closed} closed · {summary.falsified} falsified
      </p>
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {summary.byEdition.map((e: any) => (
          <div key={e.edition} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", padding: "8px 16px", fontSize: 12 }}>{e.edition}: {e.calls} calls</div>
        ))}
      </div>
      {review.map((entry: any) => (
        <div key={entry.originalCallId} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: 16, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontWeight: 500, fontSize: 14 }}>{entry.originalStatement}</span>
            <span style={{ fontSize: 11, color: "rgba(201,169,110,0.7)" }}>{entry.lineageStatus}</span>
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Edition: {entry.firstEdition} · Confidence movement: {entry.confidenceMovement}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Evidence: {entry.currentEvidence}</div>
          {entry.falsificationConditionTriggered && <div style={{ fontSize: 11, color: "rgba(255,100,100,0.7)" }}>⚠ Falsification condition triggered</div>}
        </div>
      ))}
    </div>
  );
}
