import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import { getPublicCrossEditionReview } from "@/lib/intelligence/accountability/cross-edition-call-review";
import {
  InstitutionalSurfaceShell, SurfaceCover, StateBadge, EvidenceMeta, SectionLedger,
  MetricStatement, MethodologyReceipt, PreviewBanner,
  EmptyEvidenceState, RelationshipNavigator, brass, brassLight, evidenceGrey,
} from "@/components/institutional";

export const getServerSideProps: GetServerSideProps = async () => {
  const r = getPublicCrossEditionReview();
  return { props: { review: JSON.parse(JSON.stringify(r.review)), summary: JSON.parse(JSON.stringify(r.summary)), preview: r.preview } };
};

function EditionLineage({ editions }: { editions: Array<{ edition: string; calls: number }> }) {
  return (
    <div className="flex flex-wrap gap-3">
      {editions.map((e, i) => (
        <div key={e.edition} className="flex items-center gap-3">
          <div className="border p-3" style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
            <p className="font-serif text-lg" style={{ color: 'rgba(255,255,255,0.82)' }}>{e.edition}</p>
            <p className="font-mono text-[11px]" style={{ color: evidenceGrey }}>{e.calls} calls</p>
          </div>
          {i < editions.length - 1 && <span className="text-2xl" style={{ color: 'rgba(255,255,255,0.15)' }}>→</span>}
        </div>
      ))}
    </div>
  );
}

export default function CrossEditionReviewPage({ review, summary, preview }: { review: any[]; summary: any; preview: boolean }) {
  const hasRecords = review.length > 0;
  return (
    <Layout title="Cross-Edition Review | Abraham of London" description="What did we believe, what changed, and did the evidence justify the revision?" headerTransparent fullWidth>
      <Head><meta name="robots" content="noindex" /></Head>
      <InstitutionalSurfaceShell>
        <SurfaceCover
          eyebrow="Accountability"
          title="Cross-Edition Review"
          description="What did we believe, what changed, and did the evidence justify the revision?"
        >
          <div className="mt-8 flex flex-wrap gap-6">
            <EvidenceMeta label="Review range" value={`${summary.byEdition.length} edition${summary.byEdition.length !== 1 ? 's' : ''}`} />
            <EvidenceMeta label="Total calls" value={String(summary.totalCalls)} />
            <EvidenceMeta label="Methodology" value="Call lineage v1.0" />
          </div>
        </SurfaceCover>

        {preview && <PreviewBanner />}

        <SectionLedger title="Accountability summary">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <MetricStatement value={summary.originated} label="Originated" />
            <MetricStatement value={summary.carriedForward} label="Carried forward" />
            <MetricStatement value={summary.revised} label="Revised" />
            <MetricStatement value={summary.closed} label="Closed" />
            <MetricStatement value={summary.falsified} label="Falsified" />
            <MetricStatement value={summary.unresolved} label="Unresolved" />
          </div>
        </SectionLedger>

        <SectionLedger title="Edition lineage">
          <EditionLineage editions={summary.byEdition} />
        </SectionLedger>

        <SectionLedger title="Call movement ledger">
          {hasRecords ? (
            <div className="space-y-4">
              {review.map((entry: any) => (
                <div key={entry.originalCallId} className="border p-5" style={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.015)' }}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="font-serif text-xl" style={{ color: 'rgba(255,255,255,0.85)' }}>{entry.originalStatement}</p>
                    <StateBadge state={entry.lineageStatus} />
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <EvidenceMeta label="First edition" value={entry.firstEdition} />
                      <EvidenceMeta label="Current edition" value={entry.currentEdition} />
                      <EvidenceMeta label="Confidence movement" value={entry.confidenceMovement.replace(/_/g, ' ')} />
                    </div>
                    <div>
                      <EvidenceMeta label="Last reviewed" value={entry.lastReviewedAt ? new Date(entry.lastReviewedAt).toLocaleDateString() : 'Not reviewed'} />
                      <EvidenceMeta label="Next review" value={entry.nextReviewDue ? new Date(entry.nextReviewDue).toLocaleDateString() : 'Not scheduled'} />
                      {entry.falsificationConditionTriggered && <StateBadge state="FALSIFIED" />}
                    </div>
                  </div>
                  <div className="mt-4 border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <p className="font-sans text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: evidenceGrey }}>Evidence</p>
                    <p className="mt-1 text-sm leading-6" style={{ color: 'rgba(255,255,255,0.55)' }}>{entry.currentEvidence}</p>
                    <p className="mt-3 font-sans text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: evidenceGrey }}>Revision rationale</p>
                    <p className="mt-1 text-sm leading-6" style={{ color: 'rgba(255,255,255,0.45)' }}>{entry.revisionRationale}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyEvidenceState title="No call lineage records" description="Call lineage records appear when calls have been reviewed across multiple editions." />
          )}
        </SectionLedger>

        <SectionLedger title="Review methodology">
          <MethodologyReceipt items={[
            { label: "Method", value: "Call lineage tracking" },
            { label: "Lineage sources", value: "Market call ledger" },
            { label: "Status derivation", value: "Automated from edition history" },
            { label: "Falsification detection", value: "Outcome status based" },
          ]} />
        </SectionLedger>

        <RelationshipNavigator
          upstream={[{ label: "GMI Editions", href: "/intelligence/gmi" }]}
          current="Cross-Edition Review"
          downstream={[{ label: "DII", href: "/market-intelligence/dii" }, { label: "Learning Log", href: "/market-intelligence/learning-log" }]}
        />
      </InstitutionalSurfaceShell>
    </Layout>
  );
}
