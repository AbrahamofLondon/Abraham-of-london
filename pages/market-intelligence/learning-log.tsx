import { GetServerSideProps } from "next";
import type { EvidenceAuthority } from "../../lib/intelligence/accountability/market-decision-integrity-index";

export const getServerSideProps: GetServerSideProps = async () => {
  // No verified evidence available — truthful empty state
  // The Learning Log must NOT render MARKET_CALL_LEDGER on public surfaces
  const authority: EvidenceAuthority = "UNAVAILABLE";
  return {
    props: {
      entries: [],
      summary: {
        totalEntries: 0,
        confirmed: 0,
        partiallyConfirmed: 0,
        notConfirmed: 0,
        pendingReview: 0,
        byEdition: [],
        specifiedConditions: 0,
        referenceOnlyConditions: 0,
        notSpecified: 0,
      },
      authority,
    },
  };
};

export default function LearningLogPage({ entries, summary, authority }: { entries: any[]; summary: any; authority: EvidenceAuthority }) {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24, fontFamily: "Georgia, serif", color: "rgba(255,255,255,0.82)", background: "#0a0a0b" }}>
      <h1 style={{ fontSize: 28, fontWeight: 300, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 16 }}>
        Decision Learning Log
      </h1>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>
        Authority: {authority} — Evidence not yet released
      </p>
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", padding: 24, marginBottom: 24 }}>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
          No verified evidence is available. The Decision Learning Log requires a released edition with verified, human-reviewed market calls and their falsification conditions. Until then, no records are displayed.
        </p>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 300, color: "rgba(255,255,255,0.3)" }}>0</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Confirmed</div>
        </div>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 300, color: "rgba(255,255,255,0.3)" }}>0</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Not Confirmed</div>
        </div>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 300, color: "rgba(255,255,255,0.3)" }}>0</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Pending Review</div>
        </div>
      </div>
    </div>
  );
}