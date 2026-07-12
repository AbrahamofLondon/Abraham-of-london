import { GetServerSideProps } from "next";
import { calculateDecisionIntegrityIndex, type EvidenceAuthority } from "../../lib/intelligence/accountability/market-decision-integrity-index";

export const getServerSideProps: GetServerSideProps = async () => {
  // No verified evidence available — returns truthful empty/withheld state
  const dii = calculateDecisionIntegrityIndex();
  const authority: EvidenceAuthority = "UNAVAILABLE";
  return { props: { dii: JSON.parse(JSON.stringify(dii)), authority } };
};

export default function MarketDiiPage({ dii, authority }: { dii: any; authority: EvidenceAuthority }) {
  const isEmpty = dii.coverage.totalCalls === 0 && dii.headlineScore === null && dii.editionTrend.length === 0;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24, fontFamily: "Georgia, serif", color: "rgba(255,255,255,0.82)", background: "#0a0a0b" }}>
      <h1 style={{ fontSize: 28, fontWeight: 300, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 16 }}>
        Market Decision Integrity Index
      </h1>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>
        Methodology v{dii.methodologyVersion} · Generated {new Date(dii.generatedAt).toLocaleDateString()} · Authority: {authority}
      </p>
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(201,169,110,0.8)", marginBottom: 12 }}>Headline Score</h2>
        {isEmpty ? (
          <>
            <div style={{ fontSize: 48, fontWeight: 300, color: "rgba(255,255,255,0.3)" }}>—</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", marginTop: 12, lineHeight: 1.6 }}>
              No verified evidence is available. The Decision Integrity Index requires a released edition with verified, human-reviewed market calls. Until then, no score is published and no records are displayed.
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 48, fontWeight: 300 }}>{dii.headlineScore !== null ? `${dii.headlineScore}/100` : "—"}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>Status: {dii.publicationStatus} · {dii.coverage.scoredCalls} scored calls of {dii.coverage.totalCalls} total</div>
          </>
        )}
      </div>
      {!isEmpty && (
        <>
          <h2 style={{ fontSize: 14, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(201,169,110,0.8)", marginBottom: 12 }}>Component Scores</h2>
          {dii.componentScores.map((c: any) => (
            <div key={c.measure} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontWeight: 500 }}>{c.measure.replace(/_/g, " ")}</span>
                <span style={{ color: "rgba(201,169,110,0.8)" }}>{c.score}/100 (weight: {c.weight})</span>
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{c.rationale}</div>
            </div>
          ))}
          {dii.editionTrend.length > 0 && (
            <>
              <h2 style={{ fontSize: 14, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(201,169,110,0.8)", margin: "24px 0 12px" }}>Edition Trend</h2>
              {dii.editionTrend.map((et: any) => (
                <div key={et.editionId} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: 16, marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{et.editionLabel}</span>
                    <span style={{ color: et.diiScore !== null ? "rgba(201,169,110,0.8)" : "rgba(255,255,255,0.4)" }}>{et.diiScore !== null ? `${et.diiScore}/100` : "Insufficient coverage"}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{et.callCount} calls · {et.coverage.status}</div>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}