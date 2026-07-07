import { GetServerSideProps } from "next";
import { buildCorridorMap } from "../../lib/intelligence/corridor/customer-corridor-map";

export const getServerSideProps: GetServerSideProps = async () => {
  const emptyTwin = { currentDecisionPressure: "low", dominantContradictions: [], activeEvidenceGaps: [], unresolvedCommitments: [], repeatedPatterns: [], currentInterventionReadiness: "not_ready", completedProductCodes: [] };
  const map = buildCorridorMap("demo-customer", emptyTwin);
  return { props: { map: JSON.parse(JSON.stringify(map)) } };
};

export default function CorridorPage({ map }: { map: any }) {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24, fontFamily: "Georgia, serif", color: "rgba(255,255,255,0.82)", background: "#0a0a0b" }}>
      <h1 style={{ fontSize: 28, fontWeight: 300, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 16 }}>
        Product Corridor
      </h1>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>
        Customer: {map.customerId} · Twin version: {map.twinVersion} · {map.admissibleNextMoves.length} admissible moves
      </p>
      {map.completedMilestones.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(201,169,110,0.8)", marginBottom: 12 }}>Completed</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {map.completedMilestones.map((m: string) => (
              <span key={m} style={{ background: "rgba(80,200,120,0.15)", border: "1px solid rgba(80,200,120,0.3)", padding: "4px 12px", borderRadius: 4, fontSize: 12 }}>{m}</span>
            ))}
          </div>
        </div>
      )}
      <h2 style={{ fontSize: 14, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(201,169,110,0.8)", marginBottom: 12 }}>Admissible Next Moves</h2>
      {map.admissibleNextMoves.map((move: any) => (
        <div key={move.productCode} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: 16, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontWeight: 500 }}>{move.productName}</span>
            <span style={{ fontSize: 11, color: "rgba(201,169,110,0.7)" }}>{move.accessMode}</span>
          </div>
          <div style={{ fontSize: 13, marginBottom: 8 }}>{move.recommendation}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{move.reason}</div>
          {move.evidenceBasis.length > 0 && (
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 8 }}>
              {move.evidenceBasis.map((eb: string, i: number) => <div key={i}>• {eb}</div>)}
            </div>
          )}
        </div>
      ))}
      {map.controlledMoves.length > 0 && (
        <>
          <h2 style={{ fontSize: 14, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(201,169,110,0.8)", margin: "24px 0 12px" }}>Controlled Access</h2>
          {map.controlledMoves.map((move: any) => (
            <div key={move.productCode} style={{ background: "rgba(201,169,110,0.05)", border: "1px solid rgba(201,169,110,0.15)", padding: 16, marginBottom: 8 }}>
              <div style={{ fontWeight: 500 }}>{move.productName}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{move.accessMode} · {move.reason}</div>
            </div>
          ))}
        </>
      )}
      <div style={{ marginTop: 24, padding: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
        <strong>Recommendation rationale:</strong> {map.recommendationRationale}
      </div>
    </div>
  );
}
