import * as React from "react";
import { GetServerSideProps } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import { getEstateGovernanceSummary, getAllProductGovernanceCards } from "@/lib/governance/trust-centre/governance-trust-centre";
import {
  InstitutionalSurfaceShell, SurfaceCover, StateBadge, EvidenceMeta, SectionLedger,
  AuthorityStamp, MethodologyReceipt, EmptyEvidenceState, RelationshipNavigator,
  brass, brassLight, evidenceGrey, semanticConfirmed, semanticMonitoring, semanticContradicted, semanticUnresolved,
} from "@/components/institutional";

export const getServerSideProps: GetServerSideProps = async () => {
  const summary = getEstateGovernanceSummary();
  const cards = getAllProductGovernanceCards();
  return { props: { summary: JSON.parse(JSON.stringify(summary)), cards: JSON.parse(JSON.stringify(cards)) } };
};

export default function TrustCentrePage({ summary, cards }: { summary: any; cards: any[] }) {
  const filters = ["ALL", "GOVERNANCE_VERIFIED", "CONTROLLED_BY_DESIGN", "EVIDENCE_PENDING", "RELEASE_GATED", "INACTIVE", "RETIRED", "INTERNAL_ONLY"];
  const [activeFilter, setActiveFilter] = React.useState("ALL");
  const filtered = activeFilter === "ALL" ? cards : cards.filter((c: any) => c.displayState === activeFilter);

  return (
    <Layout title="Governance Trust Centre | Abraham of London" description="What can this estate claim, sell, release, automate or withhold — and who has authority to decide?" headerTransparent fullWidth>
      <Head><meta name="robots" content="noindex" /></Head>
      <InstitutionalSurfaceShell>
        <SurfaceCover
          eyebrow="Accountability"
          title="Governance Trust Centre"
          description="What can this estate claim, sell, release, automate or withhold — and who or what has authority to decide?"
        >
          <div className="mt-8 flex flex-wrap gap-6">
            <EvidenceMeta label="Products" value={String(cards.length)} />
            <EvidenceMeta label="Governance model" value={summary.commercialAuthorityModel ? "Published" : "Not published"} />
          </div>
        </SurfaceCover>

        <SectionLedger title="Governance constitution">
          <div className="space-y-4">
            <div className="border p-5" style={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <p className="font-sans text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: brassLight }}>Commercial authority model</p>
              <p className="mt-3 text-sm leading-7" style={{ color: 'rgba(255,255,255,0.6)' }}>{summary.commercialAuthorityModel}</p>
            </div>
            <div className="border p-5" style={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <p className="font-sans text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: brassLight }}>Fail-closed principles</p>
              <ul className="mt-3 space-y-2">
                {summary.failClosedPrinciples.map((p: string, i: number) => (
                  <li key={i} className="flex gap-3 text-sm leading-6" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    <span style={{ color: brassLight }}>{i + 1}.</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </SectionLedger>

        <SectionLedger title="Product governance matrix">
          <div className="mb-4 flex flex-wrap gap-2">
            {filters.map((f) => (
              <button key={f} type="button" onClick={() => setActiveFilter(f)}
                className={`font-sans text-[11px] font-medium uppercase tracking-[0.14em] border px-3 py-1.5 transition ${activeFilter === f ? '' : 'opacity-50 hover:opacity-80'}`}
                style={{ borderColor: activeFilter === f ? brass + '50' : 'rgba(255,255,255,0.1)', backgroundColor: activeFilter === f ? brass + '0D' : 'transparent', color: activeFilter === f ? brassLight : 'rgba(255,255,255,0.5)' }}
              >
                {f.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          {filtered.length > 0 ? (
            <div className="space-y-2">
              {filtered.map((card: any) => (
                <div key={card.productCode} className="grid gap-3 border p-4 md:grid-cols-[1fr_auto]" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="font-serif text-base" style={{ color: 'rgba(255,255,255,0.82)' }}>{card.productName}</p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: evidenceGrey }}>{card.productCode}</p>
                    </div>
                    <EvidenceMeta label="Commerce" value={card.checkoutGovernance || 'Not specified'} />
                    <EvidenceMeta label="Human review" value={card.humanReview || 'Not specified'} />
                    <EvidenceMeta label="Family" value={card.productFamily || '—'} />
                  </div>
                  <div className="flex items-center gap-2">
                    <StateBadge state={card.displayState} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyEvidenceState title="No products match filter" description={`No products in ${activeFilter.replace(/_/g, ' ')} state.`} />
          )}
        </SectionLedger>

        <SectionLedger title="State semantics">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {[
              { state: "GOVERNANCE_VERIFIED", desc: "Product governance is verified and current.", permits: "Public listing, checkout, fulfilment", prohibits: "Unauthorised state changes" },
              { state: "CONTROLLED_BY_DESIGN", desc: "Governance is enforced by design.", permits: "Controlled operation", prohibits: "Unrestricted access" },
              { state: "EVIDENCE_PENDING", desc: "Evidence required for governance is pending.", permits: "Limited preview", prohibits: "Full release" },
              { state: "RELEASE_GATED", desc: "Release is blocked by a governing condition.", permits: "Development access", prohibits: "Production release" },
              { state: "INACTIVE", desc: "Product is inactive.", permits: "Reference access", prohibits: "New acquisition" },
              { state: "RETIRED", desc: "Product has been retired.", permits: "Historical reference", prohibits: "All active use" },
              { state: "INTERNAL_ONLY", desc: "Restricted to internal use.", permits: "Internal operation", prohibits: "External access" },
            ].map((item) => (
              <div key={item.state} className="border p-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <StateBadge state={item.state} />
                <p className="mt-3 text-sm leading-6" style={{ color: 'rgba(255,255,255,0.55)' }}>{item.desc}</p>
                <p className="mt-2 font-sans text-[10px] font-medium uppercase tracking-[0.12em]" style={{ color: semanticConfirmed }}>Permits: {item.permits}</p>
                <p className="mt-1 font-sans text-[10px] font-medium uppercase tracking-[0.12em]" style={{ color: semanticContradicted }}>Prohibits: {item.prohibits}</p>
              </div>
            ))}
          </div>
        </SectionLedger>

        <RelationshipNavigator
          upstream={[{ label: "GMI Editions", href: "/intelligence/gmi" }]}
          current="Governance Trust Centre"
          downstream={[{ label: "Cross-Edition Review", href: "/market-intelligence/cross-edition-review" }]}
        />
      </InstitutionalSurfaceShell>
    </Layout>
  );
}
