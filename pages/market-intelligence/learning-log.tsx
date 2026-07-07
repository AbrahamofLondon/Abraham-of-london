import { GetServerSideProps } from "next";
import { getLearningLog, getLearningLogSummary } from "../../lib/intelligence/accountability/public-decision-learning-log";

export const getServerSideProps: GetServerSideProps = async () => {
  const entries = getLearningLog();
  const summary = getLearningLogSummary();
  return { props: { entries: JSON.parse(JSON.stringify(entries)), summary: JSON.parse(JSON.stringify(summary)) } };
};

export default function LearningLogPage({ entries, summary }: { entries: any[]; summary: any }) {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24, fontFamily: "Georgia, serif", color: "rgba(255,255,255,0.82)", background: "#0a0a0b" }}>
      <h1 style={{ fontSize: 28, fontWeight: 300, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 16 }}>
        Decision Learning Log
      </h1>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>
        {summary.totalEntries} entries · {summary.confirmed} confirmed · {summary.notConfirmed} not confirmed · {summary.pendingReview} pending review
      </p>
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 300 }}>{summary.confirmed}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Confirmed</div>
        </div>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 300 }}>{summary.notConfirmed}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Not Confirmed</div>
        </div>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 300 }}>{summary.pendingReview}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Pending Review</div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>
        Specified conditions: {summary.specifiedConditions} · Reference only: {summary.referenceOnlyConditions} · Not specified: {summary.notSpecified}
      </div>
      {entries.map((entry: any) => (
        <div key={entry.originalCallId} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: 16, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontWeight: 500, fontSize: 14 }}>{entry.originalCall}</span>
            <span style={{ fontSize: 11, color: "rgba(201,169,110,0.7)" }}>{entry.outcomeStatus}</span>
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Edition: {entry.edition} · Confidence: {entry.originalConfidence}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Falsification condition: {entry.falsificationCondition.status === "SPECIFIED" ? entry.falsificationCondition.description : entry.falsificationCondition.status}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>What changed: {entry.whatChanged}</div>
        </div>
      ))}
    </div>
  );
}
