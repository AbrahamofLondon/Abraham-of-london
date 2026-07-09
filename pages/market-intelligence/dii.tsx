import type { GetServerSideProps } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import {
  calculateDecisionIntegrityIndex, type DecisionIntegrityIndex,
} from "@/lib/intelligence/accountability/market-decision-integrity-index";
import { DII_METHODOLOGY } from "@/lib/intelligence/accountability/dii-methodology-authority";
import { PREVIEW_NOTICE } from "@/lib/intelligence/accountability/market-accountability-evidence";
import {
  InstitutionalSurfaceShell, SurfaceCover, StateBadge, EvidenceMeta, SectionLedger,
  MethodologyReceipt, PreviewBanner, EmptyEvidenceState, RelationshipNavigator,
  brass, brassLight, evidenceGrey,
} from "@/components/institutional";

interface Props { dii: DecisionIntegrityIndex; methodology: typeof DII_METHODOLOGY; }

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const dii = calculateDecisionIntegrityIndex();
  return { props: { dii: JSON.parse(JSON.stringify(dii)), methodology: JSON.parse(JSON.stringify(DII_METHODOLOGY)) } };
};

function ScoreBar({ value, max = 100 }: { value: number | null; max?: number }) {
  if (value === null) return null;
  const pct = Math.max(4, Math.min(100, (value / max) * 100));
  return (
    <div className="mt-2 h-2 w-full" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} aria-hidden>
      <div className="h-full" style={{ width: `${pct}%`, backgroundColor: brass }} />
    </div>
  );
}

export default function MarketDiiPage({ dii, methodology }: Props) {
  const isPreview = dii.publicationStatus === "PREVIEW";
  const headlineAuthoritative = !isPreview && dii.headlineScore !== null && String(dii.publicationStatus) === "PUBLISHED";
  const coverageStatus = dii.coverage.scoredCalls >= methodology.coverage.minScoredForHeadline ? "PUBLISHABLE" : "INSUFFICIENT_COVERAGE";

  return (
    <Layout title="Decision Integrity Index | Abraham of London" description="Our published record of our own market judgement." headerTransparent fullWidth>
      <Head><meta name="robots" content="noindex" /></Head>
      <InstitutionalSurfaceShell>
        <SurfaceCover
          eyebrow="Accountability"
          title="Decision Integrity Index"
          description="Our published record of our own market judgement. Measures accuracy, falsification discipline, calibration quality and revision rigour."
        >
          <div className="mt-8 flex flex-wrap gap-6">
            <EvidenceMeta label="Methodology" value={`DII v${dii.methodologyVersion}`} />
            <EvidenceMeta label="Generated" value={new Date(dii.generatedAt).toLocaleDateString()} />
            <EvidenceMeta label="Coverage" value={`${dii.coverage.scoredCalls} of ${dii.coverage.totalCalls} calls scored`} />
            <StateBadge state={dii.publicationStatus} />
          </div>
        </SurfaceCover>

        {isPreview && <PreviewBanner />}

        <SectionLedger title={isPreview ? "Headline score — withheld" : "Headline score"}>
          {headlineAuthoritative ? (
            <div className="border p-6" style={{ borderColor: brass + '20', backgroundColor: brass + '06' }}>
              <p className="font-serif text-6xl" style={{ color: 'rgba(255,255,255,0.94)' }}>{dii.headlineScore}<span className="text-3xl" style={{ color: evidenceGrey }}>/100</span></p>
              <ScoreBar value={dii.headlineScore} />
              <div className="mt-4 flex flex-wrap gap-4">
                <StateBadge state="PUBLISHED" />
                <EvidenceMeta label="Coverage" value={`${dii.coverage.scoredCalls} scored of ${dii.coverage.totalCalls} total`} />
              </div>
            </div>
          ) : (
            <div className="border p-6" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <p className="font-serif text-3xl" style={{ color: 'rgba(255,255,255,0.4)' }}>Headline score withheld</p>
              <p className="mt-3 text-sm leading-6" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {isPreview
                  ? "This is a preview. No authoritative score is asserted until sufficient reviewed calls exist."
                  : `Insufficient reviewed-call coverage. Current coverage: ${dii.coverage.scoredCalls} of ${dii.coverage.minRequired} required calls.`}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <StateBadge state={coverageStatus} />
                <EvidenceMeta label="Scored" value={`${dii.coverage.scoredCalls} calls`} />
                <EvidenceMeta label="Required" value={`${dii.coverage.minRequired} minimum`} />
              </div>
            </div>
          )}
        </SectionLedger>

        <SectionLedger title={isPreview ? "How the index is computed (illustrative)" : "Five-dimension scorecard"}>
          <div className="space-y-4">
            {dii.componentScores.map((c) => (
              <div key={c.measure} className="border p-5" style={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.015)' }}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-serif text-xl" style={{ color: 'rgba(255,255,255,0.85)' }}>{c.measure.replace(/_/g, ' ')}</p>
                    <p className="mt-1 text-sm leading-6" style={{ color: 'rgba(255,255,255,0.45)' }}>{c.weightRationale}</p>
                  </div>
                  <div className="text-right">
                    {isPreview ? (
                      <p className="font-mono text-[12px]" style={{ color: evidenceGrey }}>Weight: {Math.round(c.weight * 100)}%</p>
                    ) : (
                      <>
                        <p className="font-serif text-2xl" style={{ color: brassLight }}>{c.score !== null ? `${c.score}/100` : '—'}</p>
                        <p className="font-mono text-[11px]" style={{ color: evidenceGrey }}>Weight: {Math.round(c.weight * 100)}%</p>
                      </>
                    )}
                  </div>
                </div>
                {!isPreview && c.score !== null && <ScoreBar value={c.score} />}
                {!isPreview && c.rationale && (
                  <p className="mt-3 text-sm leading-6" style={{ color: 'rgba(255,255,255,0.45)' }}>{c.rationale}</p>
                )}
              </div>
            ))}
          </div>
        </SectionLedger>

        <SectionLedger title="Edition trend">
          {dii.editionTrend.length > 0 ? (
            <div className="space-y-3">
              {dii.editionTrend.map((et) => (
                <div key={et.editionId} className="flex flex-wrap items-center justify-between gap-3 border p-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div>
                    <p className="font-serif text-lg" style={{ color: 'rgba(255,255,255,0.8)' }}>{et.editionLabel}</p>
                    <p className="font-mono text-[11px]" style={{ color: evidenceGrey }}>{et.callCount} calls</p>
                  </div>
                  <div className="text-right">
                    {et.diiScore !== null ? (
                      <p className="font-serif text-2xl" style={{ color: brassLight }}>{et.diiScore}/100</p>
                    ) : (
                      <StateBadge state={et.coverage.status} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyEvidenceState title="No edition trend data" description="Edition trend data appears when multiple editions have sufficient scored calls." />
          )}
        </SectionLedger>

        <SectionLedger title="Methodology &amp; publication rules">
          <MethodologyReceipt items={[
            { label: "Version", value: `v${methodology.methodologyVersion}` },
            { label: "Effective from", value: methodology.effectiveFrom },
            { label: "Min headline coverage", value: `${methodology.coverage.minScoredForHeadline} scored calls` },
            { label: "Min component coverage", value: `${methodology.coverage.minScoredForComponent} scored calls` },
            { label: "Unresolved call treatment", value: methodology.unresolvedCallTreatment },
            { label: "Falsification treatment", value: methodology.falsificationTreatment },
            { label: "Components", value: methodology.components.map(c => c.measure.replace(/_/g, ' ')).join(', ') },
            { label: "Change history", value: methodology.changeHistory.map(h => `v${h.version} (${h.date})`).join(', ') },
          ]} />
        </SectionLedger>

        <RelationshipNavigator
          upstream={[{ label: "Cross-Edition Review", href: "/market-intelligence/cross-edition-review" }]}
          current="Decision Integrity Index"
          downstream={[{ label: "Learning Log", href: "/market-intelligence/learning-log" }]}
        />
      </InstitutionalSurfaceShell>
    </Layout>
  );
}
