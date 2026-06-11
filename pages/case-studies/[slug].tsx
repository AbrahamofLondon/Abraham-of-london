/**
 * pages/case-studies/[slug].tsx — Governed Case Study Detail
 *
 * Sober, institutional tone. No exaggerated success language.
 * Every claim is labelled with its evidence basis.
 */

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps, NextPage } from "next";
import Layout from "@/components/Layout";
import type { PublicCaseStudy } from "@/lib/evidence/case-study-public";
import { EVIDENCE_STATUS_LABELS, OUTCOME_STATUS_LABELS } from "@/lib/evidence/case-study-public";

const mono: React.CSSProperties = { fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" };

type Props = {
  cs: PublicCaseStudy;
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ ...mono, fontSize: 9, letterSpacing: "0.1em", color: "rgba(255,255,255,0.28)", marginBottom: 12 }}>
      {children}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 28, marginTop: 28 }}>
      <SectionLabel>{label}</SectionLabel>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.62)", lineHeight: 1.85 }}>{children}</div>
    </div>
  );
}

function TrustBadge({ label, active, colour }: { label: string; active: boolean; colour: string }) {
  return (
    <div style={{
      ...mono,
      fontSize: 10,
      letterSpacing: "0.05em",
      padding: "4px 12px",
      borderRadius: 2,
      background: active ? colour : "rgba(100,116,139,0.10)",
      color: active ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.25)",
      opacity: active ? 1 : 0.6,
    }}>
      {label.toUpperCase()}
    </div>
  );
}

function ProofDisciplinePanel({ cs }: { cs: PublicCaseStudy }) {
  return (
    <div style={{ border: "1px solid rgba(52,211,153,0.15)", padding: "28px 32px", marginTop: 40 }}>
      <div style={{ ...mono, fontSize: 10, letterSpacing: "0.1em", color: "rgba(52,211,153,0.55)", marginBottom: 20 }}>
        PROOF DISCIPLINE
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <SectionLabel>EVIDENCE BASIS</SectionLabel>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>
            {EVIDENCE_STATUS_LABELS[cs.evidenceStatus as keyof typeof EVIDENCE_STATUS_LABELS]}
            {cs.evidenceTested ? ` — ${cs.evidenceTested}` : ""}
          </div>
        </div>
        {cs.whatRemainsUnproven && (
          <div>
            <SectionLabel>WHAT REMAINS UNPROVEN</SectionLabel>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.50)", lineHeight: 1.75 }}>
              {cs.whatRemainsUnproven}
            </div>
          </div>
        )}
        {cs.whatWouldChangeConclusion && (
          <div>
            <SectionLabel>WHAT WOULD CHANGE THE CONCLUSION</SectionLabel>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.50)", lineHeight: 1.75 }}>
              {cs.whatWouldChangeConclusion}
            </div>
          </div>
        )}
        {cs.falsificationQuestion && (
          <div>
            <SectionLabel>FALSIFICATION QUESTION</SectionLabel>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.50)", lineHeight: 1.75 }}>
              {cs.falsificationQuestion}
            </div>
          </div>
        )}
        <div>
          <SectionLabel>PUBLICATION BASIS</SectionLabel>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            <TrustBadge label="Method demonstration" active={cs.evidenceStatus === "METHOD_DEMONSTRATION"} colour="rgba(251,191,36,0.28)" />
            <TrustBadge label="Founder verified" active={cs.evidenceStatus === "FOUNDER_VERIFIED"} colour="rgba(251,191,36,0.35)" />
            <TrustBadge label="Client consented" active={cs.consentBasis === "NAMED_WITH_CONSENT"} colour="rgba(52,211,153,0.28)" />
            <TrustBadge label="Evidence linked" active={cs.isArtifactLinked} colour="rgba(52,211,153,0.28)" />
            <TrustBadge label="Outcome verified" active={cs.outcomeStatus === "VERIFIED"} colour="rgba(52,211,153,0.45)" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductRoute({ productCode }: { productCode: string | null }) {
  if (!productCode) return null;
  const routes: Record<string, { label: string; ctaLabel: string; href: string }[]> = {
    "boardroom-brief": [
      { label: "Use the same instrument", ctaLabel: "Boardroom Brief", href: "/boardroom-brief" },
      { label: "Start with a pressure signal", ctaLabel: "Decision Pressure Signal", href: "/decision-pressure" },
    ],
  };
  const options = routes[productCode] ?? [
    { label: "Explore the product", ctaLabel: "Products", href: "/products" },
  ];
  return (
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 36, marginTop: 36 }}>
      <SectionLabel>PRODUCT ROUTE</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
        {options.map(opt => (
          <div key={opt.href} style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.38)" }}>{opt.label}</span>
            <Link href={opt.href} style={{ ...mono, fontSize: 11, color: "rgba(52,211,153,0.75)", textDecoration: "none", letterSpacing: "0.04em" }}>
              {opt.ctaLabel} →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

const CaseStudyDetailPage: NextPage<Props> = ({ cs }) => {
  const outcomeLabel = OUTCOME_STATUS_LABELS[cs.outcomeStatus as keyof typeof OUTCOME_STATUS_LABELS] ?? cs.outcomeStatus;

  return (
    <Layout>
      <Head>
        <title>{cs.title} — Abraham of London Case Studies</title>
        <meta name="description" content={cs.pressureCondition ?? `Case study: ${cs.title}`} />
      </Head>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "80px 24px 120px" }}>

        {/* Breadcrumb */}
        <div style={{ marginBottom: 40 }}>
          <Link href="/case-studies" style={{ ...mono, fontSize: 10, color: "rgba(255,255,255,0.3)", textDecoration: "none", letterSpacing: "0.07em" }}>
            ← CASE STUDIES
          </Link>
        </div>

        {/* Status badges */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
          <span style={{ ...mono, fontSize: 10, padding: "3px 10px", background: "rgba(255,255,255,0.06)", borderRadius: 2, color: "rgba(255,255,255,0.45)", letterSpacing: "0.05em" }}>
            {EVIDENCE_STATUS_LABELS[cs.evidenceStatus as keyof typeof EVIDENCE_STATUS_LABELS] ?? cs.evidenceStatus}
          </span>
          <span style={{ ...mono, fontSize: 10, padding: "3px 10px", background: "rgba(255,255,255,0.06)", borderRadius: 2, color: "rgba(255,255,255,0.38)", letterSpacing: "0.05em" }}>
            OUTCOME: {outcomeLabel}
          </span>
          {cs.isAnonymised && (
            <span style={{ ...mono, fontSize: 10, padding: "3px 10px", background: "rgba(255,255,255,0.04)", borderRadius: 2, color: "rgba(255,255,255,0.28)", letterSpacing: "0.05em" }}>
              ANONYMOUS
            </span>
          )}
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 28, fontWeight: 500, color: "rgba(255,255,255,0.90)", lineHeight: 1.35, margin: "0 0 36px" }}>
          {cs.title}
        </h1>

        {/* Context without confidential details */}
        {cs.sector && (
          <div style={{ display: "flex", gap: 24, marginBottom: 28, flexWrap: "wrap" }}>
            {cs.sector && <div><SectionLabel>SECTOR</SectionLabel><span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>{cs.sector}</span></div>}
            {cs.orgType && <div><SectionLabel>ORGANISATION TYPE</SectionLabel><span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>{cs.orgType}</span></div>}
            {cs.decisionType && <div><SectionLabel>DECISION TYPE</SectionLabel><span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>{cs.decisionType}</span></div>}
          </div>
        )}

        {/* Decision pressure */}
        {cs.pressureCondition && (
          <Section label="DECISION PRESSURE">
            {cs.pressureCondition}
          </Section>
        )}

        {/* Intervention */}
        {cs.interventionPerformed && (
          <Section label="INTERVENTION USED">
            {cs.interventionPerformed}
          </Section>
        )}

        {/* Evidence examined */}
        {cs.evidenceTested && (
          <Section label="EVIDENCE EXAMINED">
            {cs.evidenceTested}
          </Section>
        )}

        {/* Outcome hypothesis */}
        {cs.outcomeHypothesisText && (
          <Section label="OUTCOME HYPOTHESIS">
            {cs.outcomeHypothesisText}
          </Section>
        )}

        {/* Current outcome state */}
        <Section label="CURRENT OUTCOME STATE">
          <span style={{ fontWeight: 500 }}>{outcomeLabel}</span>
          {cs.currentOutcomeState ? ` — ${cs.currentOutcomeState}` : ""}
          {cs.outcomeStatus === "PENDING_REVIEW" || cs.outcomeStatus === "HYPOTHESIS_SET" || cs.outcomeStatus === "NOT_MEASURED" ? (
            <div style={{ marginTop: 10, fontSize: 13, color: "rgba(255,255,255,0.35)", fontStyle: "italic" }}>
              Outcome is not yet verified. This case is published on the basis of method and evidence discipline, not confirmed result.
            </div>
          ) : null}
        </Section>

        {/* Proof discipline panel */}
        <ProofDisciplinePanel cs={cs} />

        {/* Product route */}
        <ProductRoute productCode={cs.productCode} />

      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async ({ params }) => {
  const slug = typeof params?.slug === "string" ? params.slug : "";
  if (!slug) return { notFound: true };

  try {
    const { getCaseStudyBySlug } = await import("@/lib/evidence/case-study-service");
    const { toPublicCaseStudy } = await import("@/lib/evidence/case-study-public");

    const record = await getCaseStudyBySlug(slug);
    if (!record || !record.publicationAllowed || record.visibilityStatus === "WITHDRAWN") {
      return { notFound: true };
    }

    return { props: { cs: toPublicCaseStudy(record) } };
  } catch {
    return { notFound: true };
  }
};

export default CaseStudyDetailPage;
