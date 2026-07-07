import { GetServerSideProps } from "next";
import { getEstateGovernanceSummary, getAllProductGovernanceCards } from "../../lib/governance/trust-centre/governance-trust-centre";

export const getServerSideProps: GetServerSideProps = async () => {
  const summary = getEstateGovernanceSummary();
  const cards = getAllProductGovernanceCards();
  return { props: { summary: JSON.parse(JSON.stringify(summary)), cards: JSON.parse(JSON.stringify(cards)) } };
};

export default function TrustCentrePage({ summary, cards }: { summary: any; cards: any[] }) {
  const stateColors: Record<string, string> = {
    GOVERNANCE_VERIFIED: "rgba(80,200,120,0.8)",
    CONTROLLED_BY_DESIGN: "rgba(201,169,110,0.8)",
    EVIDENCE_PENDING: "rgba(255,180,50,0.8)",
    RELEASE_GATED: "rgba(255,100,100,0.8)",
    INACTIVE: "rgba(255,255,255,0.3)",
    RETIRED: "rgba(255,255,255,0.2)",
    INTERNAL_ONLY: "rgba(150,150,200,0.6)",
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24, fontFamily: "Georgia, serif", color: "rgba(255,255,255,0.82)", background: "#0a0a0b" }}>
      <h1 style={{ fontSize: 28, fontWeight: 300, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 16 }}>
        Governance Trust Centre
      </h1>
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(201,169,110,0.8)", marginBottom: 12 }}>Estate Governance</h2>
        <p style={{ fontSize: 13, marginBottom: 12 }}>{summary.commercialAuthorityModel}</p>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
          <strong>Fail-closed principles:</strong>
          <ul style={{ margin: "4px 0", paddingLeft: 16 }}>
            {summary.failClosedPrinciples.map((p: string, i: number) => <li key={i}>{p}</li>)}
          </ul>
        </div>
      </div>
      <h2 style={{ fontSize: 14, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(201,169,110,0.8)", marginBottom: 12 }}>
        Products ({cards.length})
      </h2>
      {cards.map((card: any) => (
        <div key={card.productCode} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: 16, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 500 }}>{card.productName}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{card.productCode} · {card.checkoutGovernance} · {card.humanReview}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: stateColors[card.displayState] || "rgba(255,255,255,0.3)" }} />
            <span style={{ fontSize: 11, color: stateColors[card.displayState] || "rgba(255,255,255,0.5)" }}>{card.displayState}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
