import type { GetServerSideProps } from "next";
import {
  calculateDecisionIntegrityIndex,
  type DecisionIntegrityIndex,
} from "../../lib/intelligence/accountability/market-decision-integrity-index";
import { DII_METHODOLOGY } from "../../lib/intelligence/accountability/dii-methodology-authority";
import { PREVIEW_NOTICE } from "../../lib/intelligence/accountability/market-accountability-evidence";

interface Props {
  dii: DecisionIntegrityIndex;
  methodology: typeof DII_METHODOLOGY;
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  // AUTHORITATIVE evidence (persisted, human-reviewed calls) would be injected here from
  // gmi-data-service.server at deploy time. Until wired + populated, no authoritative
  // calls are passed → the index runs in PREVIEW mode and withholds the headline.
  const dii = calculateDecisionIntegrityIndex();
  return { props: { dii: JSON.parse(JSON.stringify(dii)), methodology: JSON.parse(JSON.stringify(DII_METHODOLOGY)) } };
};

const wrap: React.CSSProperties = { maxWidth: 820, margin: "0 auto", padding: 24, fontFamily: "Georgia, serif", color: "rgba(255,255,255,0.82)", background: "#0a0a0b", minHeight: "100vh" };
const gold = "rgba(201,169,110,0.85)";
const card: React.CSSProperties = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", padding: 24, marginBottom: 20, borderRadius: 4 };
const h2: React.CSSProperties = { fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: gold, marginBottom: 12 };

export default function MarketDiiPage({ dii, methodology }: Props) {
  const isPreview = dii.publicationStatus === "PREVIEW";
  return (
    <div style={wrap}>
      <h1 style={{ fontSize: 28, fontWeight: 300, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 16 }}>
        Market Decision Integrity Index
      </h1>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>
        Methodology v{dii.methodologyVersion} · Generated {new Date(dii.generatedAt).toLocaleDateString()} · Our published record of our own market judgement
      </p>

      {isPreview ? (
        <div style={{ ...card, borderColor: gold }}>
          <h2 style={{ ...h2, color: gold }}>{PREVIEW_NOTICE.heading}</h2>
          <p style={{ fontSize: 15, lineHeight: 1.6, margin: 0 }}>{PREVIEW_NOTICE.body}</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 14, marginBottom: 0 }}>{dii.evidenceModeReason}</p>
        </div>
      ) : (
        <div style={card}>
          <h2 style={h2}>Headline Score</h2>
          <div style={{ fontSize: 48, fontWeight: 300 }}>{dii.headlineScore !== null ? `${dii.headlineScore}/100` : "—"}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>
            Status: {dii.publicationStatus} · {dii.coverage.scoredCalls} scored calls of {dii.coverage.totalCalls} total (minimum {dii.coverage.minRequired} to publish)
          </div>
        </div>
      )}

      <h2 style={{ ...h2, marginTop: 24 }}>{isPreview ? "How the index is computed (illustrative)" : "Component Scores"}</h2>
      {dii.componentScores.map((c) => (
        <div key={c.measure} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: 16, marginBottom: 12, borderRadius: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontWeight: 500, textTransform: "capitalize" }}>{c.measure.replace(/_/g, " ")}</span>
            <span style={{ color: gold }}>{isPreview ? `weight ${c.weight}` : `${c.score}/100 · weight ${c.weight}`}</span>
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>{c.weightRationale}</div>
          {!isPreview && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{c.rationale}</div>}
        </div>
      ))}

      <h2 style={{ ...h2, marginTop: 24 }}>Methodology & publication rules</h2>
      <div style={{ ...card, fontSize: 13, lineHeight: 1.6 }}>
        <p style={{ marginTop: 0 }}><strong>Coverage:</strong> a headline requires at least {methodology.coverage.minScoredForHeadline} independently scored calls; a component requires {methodology.coverage.minScoredForComponent}. Below that, the score is withheld — never estimated.</p>
        <p><strong>Exclusions:</strong> {methodology.unresolvedCallTreatment}</p>
        <p><strong>Falsification:</strong> {methodology.falsificationTreatment}</p>
        <p style={{ marginBottom: 0 }}><strong>Change history:</strong> {methodology.changeHistory.map((h) => `v${h.version} (${h.date})`).join(", ")}.</p>
      </div>

      {dii.editionTrend.length > 0 && (
        <>
          <h2 style={{ ...h2, marginTop: 24 }}>Edition Trend</h2>
          {dii.editionTrend.map((et) => (
            <div key={et.editionId} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: 16, marginBottom: 12, borderRadius: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{et.editionLabel}</span>
                <span style={{ color: et.diiScore !== null ? gold : "rgba(255,255,255,0.4)" }}>
                  {et.diiScore !== null ? `${et.diiScore}/100` : isPreview ? "Preview — not published" : "Insufficient coverage"}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{et.callCount} calls · {et.coverage.status}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
