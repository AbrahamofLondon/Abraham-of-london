import { GetServerSideProps } from "next";
import { getPublicCrossEditionReview } from "../../lib/intelligence/accountability/cross-edition-call-review";

export const getServerSideProps: GetServerSideProps = async () => {
  const r = getPublicCrossEditionReview();
  return { props: { review: JSON.parse(JSON.stringify(r.review)), summary: JSON.parse(JSON.stringify(r.summary)), preview: r.preview } };
};

export default function CrossEditionReviewPage({ review, summary, preview }: { review: any[]; summary: any; preview: boolean }) {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24, fontFamily: "Georgia, serif", color: "rgba(255,255,255,0.82)", background: "#0a0a0b" }}>
      <h1 style={{ fontSize: 28, fontWeight: 300, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 16 }}>Cross-Edition Call Review</h1>
      {preview && (
        <div style={{ background: "rgba(201,169,110,0.08)", border: "1px solid rgba(201,169,110,0.4)", padding: 16, borderRadius: 4, margin: "16px 0" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(201,169,110,0.9)", marginBottom: 6 }}>Illustrative preview — not a published record</div>
          <div style={{ fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,0.6)" }}>
            This shows how each quarter's calls are carried forward, re-evidenced and either confirmed, revised or falsified against the prior edition — using seed examples. The live lineage activates once real reviewed editions are recorded.
          </div>
        </div>
      )}
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
