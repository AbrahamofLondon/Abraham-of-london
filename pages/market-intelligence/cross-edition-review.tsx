import { GetServerSideProps } from "next";
import type { EvidenceAuthority } from "../../lib/intelligence/accountability/market-decision-integrity-index";

export const getServerSideProps: GetServerSideProps = async () => {
  // No verified evidence available — truthful empty state
  // The Cross-Edition Review must NOT render MARKET_CALL_LEDGER on public surfaces
  const authority: EvidenceAuthority = "UNAVAILABLE";
  return {
    props: {
      review: [],
      summary: {
        totalCalls: 0,
        originated: 0,
        carriedForward: 0,
        revised: 0,
        superseded: 0,
        closed: 0,
        falsified: 0,
        unresolved: 0,
        byEdition: [],
      },
      authority,
    },
  };
};

export default function CrossEditionReviewPage({ review, summary, authority }: { review: any[]; summary: any; authority: EvidenceAuthority }) {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24, fontFamily: "Georgia, serif", color: "rgba(255,255,255,0.82)", background: "#0a0a0b" }}>
      <h1 style={{ fontSize: 28, fontWeight: 300, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 16 }}>Cross-Edition Call Review</h1>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>
        Authority: {authority} — Evidence not yet released
      </p>
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", padding: 24, marginBottom: 24 }}>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
          No verified evidence is available. The Cross-Edition Call Review requires a released edition with verified, human-reviewed market calls tracked across multiple editions. Until then, no records are displayed.
        </p>
      </div>
    </div>
  );
}