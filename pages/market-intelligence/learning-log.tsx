import { GetServerSideProps } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import { getLearningLog } from "@/lib/intelligence/accountability/public-decision-learning-log";
import {
  InstitutionalSurfaceShell, SurfaceCover, StateBadge, EvidenceMeta, SectionLedger,
  MetricStatement, PreviewBanner, EmptyEvidenceState, RelationshipNavigator,
  brass, brassLight, evidenceGrey,
} from "@/components/institutional";

export const getServerSideProps: GetServerSideProps = async () => {
  const log = { entries: getLearningLog(), summary: { totalEntries: 0, confirmed: 0, notConfirmed: 0, pendingReview: 0, specifiedConditions: 0, referenceOnlyConditions: 0, notSpecified: 0 }, preview: false };
  return { props: { entries: JSON.parse(JSON.stringify(log.entries)), summary: JSON.parse(JSON.stringify(log.summary)), preview: log.preview } };
};

export default function LearningLogPage({ entries, summary, preview }: { entries: any[]; summary: any; preview: boolean }) {
  const hasEntries = entries.length > 0;
  return (
    <Layout title="Decision Learning Log | Abraham of London" description="What was believed, what happened, what was learned." headerTransparent fullWidth>
      <Head><meta name="robots" content="noindex" /></Head>
      <InstitutionalSurfaceShell>
        <SurfaceCover
          eyebrow="Accountability"
          title="Decision Learning Log"
          description="What was believed, what happened, what was learned — and what changed because of the learning."
        >
          <div className="mt-8 flex flex-wrap gap-6">
            <EvidenceMeta label="Record status" value={preview ? "Preview" : "Published"} />
            <EvidenceMeta label="Total entries" value={String(summary.totalEntries)} />
            <EvidenceMeta label="Methodology" value="Append-only learning record v1.0" />
          </div>
        </SurfaceCover>

        {preview && <PreviewBanner />}

        <SectionLedger title="Outcome distribution">
          <div className="grid grid-cols-3 gap-3 md:grid-cols-3">
            <MetricStatement value={summary.confirmed} label="Confirmed" />
            <MetricStatement value={summary.notConfirmed} label="Not confirmed" />
            <MetricStatement value={summary.pendingReview} label="Pending review" />
          </div>
          <div className="mt-4 flex flex-wrap gap-4">
            <EvidenceMeta label="Specified conditions" value={String(summary.specifiedConditions)} />
            <EvidenceMeta label="Reference only" value={String(summary.referenceOnlyConditions)} />
            <EvidenceMeta label="Not specified" value={String(summary.notSpecified)} />
          </div>
        </SectionLedger>

        <SectionLedger title="Append-only learning record">
          {hasEntries ? (
            <div className="space-y-6">
              {entries.map((entry: any) => (
                <div key={entry.originalCallId} className="border p-5" style={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.015)' }}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="font-serif text-xl" style={{ color: 'rgba(255,255,255,0.85)' }}>{entry.originalCall}</p>
                    <StateBadge state={entry.outcomeStatus} />
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <EvidenceMeta label="Edition" value={entry.edition} />
                      <EvidenceMeta label="Original confidence" value={entry.originalConfidence} />
                      <EvidenceMeta label="Falsification condition" value={entry.falsificationCondition.status === "SPECIFIED" ? entry.falsificationCondition.description : entry.falsificationCondition.status} />
                    </div>
                    <div>
                      <EvidenceMeta label="Outcome" value={entry.outcomeStatus.replace(/_/g, ' ')} />
                      <EvidenceMeta label="What changed" value={entry.whatChanged || 'No change recorded'} />
                      {entry.learning && <EvidenceMeta label="What we learned" value={entry.learning} />}
                    </div>
                  </div>
                  
                </div>
              ))}
            </div>
          ) : (
            <EmptyEvidenceState title="No learning records" description="Learning records appear when calls have been reviewed and outcomes recorded." />
          )}
        </SectionLedger>

        <RelationshipNavigator
          upstream={[{ label: "Cross-Edition Review", href: "/market-intelligence/cross-edition-review" }, { label: "DII", href: "/market-intelligence/dii" }]}
          current="Decision Learning Log"
        />
      </InstitutionalSurfaceShell>
    </Layout>
  );
}
