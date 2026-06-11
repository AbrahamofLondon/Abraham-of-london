/**
 * pages/case-studies/index.tsx — Governed Case Study Registry
 *
 * Public proof registry. Not a testimonial wall.
 * Every case shows evidence state, outcome state, and consent basis.
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
  cases: PublicCaseStudy[];
};

// ─── Evidence badge ───────────────────────────────────────────────────────────

function EvidenceBadge({ status }: { status: string }) {
  const colours: Record<string, string> = {
    METHOD_DEMONSTRATION: "rgba(251,191,36,0.18)",
    FOUNDER_VERIFIED:     "rgba(251,191,36,0.30)",
    CLIENT_CONFIRMED:     "rgba(52,211,153,0.20)",
    EVIDENCE_LINKED:      "rgba(52,211,153,0.30)",
    OUTCOME_PENDING:      "rgba(148,163,184,0.18)",
    OUTCOME_VERIFIED:     "rgba(52,211,153,0.50)",
    PARTIAL_OUTCOME:      "rgba(251,191,36,0.22)",
    DISPUTED:             "rgba(239,68,68,0.20)",
    WITHDRAWN:            "rgba(100,116,139,0.18)",
  };
  const bg = colours[status] ?? "rgba(148,163,184,0.12)";
  const label = EVIDENCE_STATUS_LABELS[status as keyof typeof EVIDENCE_STATUS_LABELS] ?? status;
  return (
    <span style={{ ...mono, fontSize: 10, padding: "2px 8px", background: bg, borderRadius: 2, color: "var(--ds-text-subtle, rgba(255,255,255,0.55))", letterSpacing: "0.05em" }}>
      {label.toUpperCase()}
    </span>
  );
}

function OutcomeBadge({ status }: { status: string }) {
  const colours: Record<string, string> = {
    NOT_MEASURED:   "rgba(100,116,139,0.18)",
    HYPOTHESIS_SET: "rgba(148,163,184,0.22)",
    PENDING_REVIEW: "rgba(251,191,36,0.18)",
    VERIFIED:       "rgba(52,211,153,0.45)",
    PARTIAL:        "rgba(251,191,36,0.30)",
    FAILED:         "rgba(239,68,68,0.22)",
    DISPUTED:       "rgba(239,68,68,0.20)",
  };
  const bg = colours[status] ?? "rgba(148,163,184,0.12)";
  const label = OUTCOME_STATUS_LABELS[status as keyof typeof OUTCOME_STATUS_LABELS] ?? status;
  return (
    <span style={{ ...mono, fontSize: 10, padding: "2px 8px", background: bg, borderRadius: 2, color: "var(--ds-text-subtle, rgba(255,255,255,0.55))", letterSpacing: "0.05em" }}>
      OUTCOME: {label.toUpperCase()}
    </span>
  );
}

// ─── Case card ────────────────────────────────────────────────────────────────

function CaseCard({ cs }: { cs: PublicCaseStudy }) {
  const href = cs.slug ? `/case-studies/${cs.slug}` : null;

  const inner = (
    <div style={{
      border: "1px solid rgba(255,255,255,0.07)",
      background: "rgba(255,255,255,0.025)",
      padding: "28px 32px",
      display: "flex",
      flexDirection: "column",
      gap: 16,
      cursor: href ? "pointer" : "default",
      transition: "border-color 0.15s",
    }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <EvidenceBadge status={cs.evidenceStatus} />
        <OutcomeBadge status={cs.outcomeStatus} />
        {cs.isAnonymised && (
          <span style={{ ...mono, fontSize: 10, padding: "2px 8px", background: "rgba(148,163,184,0.12)", borderRadius: 2, color: "rgba(255,255,255,0.38)", letterSpacing: "0.05em" }}>
            ANONYMOUS
          </span>
        )}
        {cs.isFalsificationLinked && (
          <span style={{ ...mono, fontSize: 10, padding: "2px 8px", background: "rgba(52,211,153,0.12)", borderRadius: 2, color: "rgba(52,211,153,0.7)", letterSpacing: "0.05em" }}>
            FALSIFICATION LINKED
          </span>
        )}
      </div>

      <div>
        <div style={{ fontSize: 17, fontWeight: 500, color: "rgba(255,255,255,0.88)", lineHeight: 1.4, marginBottom: 8 }}>
          {cs.title}
        </div>
        {cs.pressureCondition && (
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.52)", lineHeight: 1.7 }}>
            {cs.pressureCondition}
          </div>
        )}
      </div>

      {cs.whatRemainsUnproven && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14 }}>
          <div style={{ ...mono, fontSize: 9, letterSpacing: "0.08em", color: "rgba(255,255,255,0.3)", marginBottom: 5 }}>
            WHAT REMAINS UNPROVEN
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
            {cs.whatRemainsUnproven}
          </div>
        </div>
      )}

      {cs.productCode && (
        <div style={{ ...mono, fontSize: 10, color: "rgba(255,255,255,0.28)", letterSpacing: "0.04em" }}>
          {cs.productCode.replace(/-/g, " ").toUpperCase()}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none", display: "block" }}>
        {inner}
      </Link>
    );
  }
  return inner;
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.07)", padding: "64px 48px", textAlign: "center" }}>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.9, maxWidth: 600, margin: "0 auto" }}>
        No public case studies have been released yet.
      </div>
      <div style={{ marginTop: 16, fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.85, maxWidth: 540, margin: "16px auto 0" }}>
        The infrastructure is active. Cases will appear only when evidence, consent, and outcome status are suitable for publication.
      </div>
      <div style={{ marginTop: 28, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 28 }}>
        <div style={{ ...mono, fontSize: 10, letterSpacing: "0.08em", color: "rgba(255,255,255,0.25)", marginBottom: 16 }}>
          PROOF DISCIPLINE
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 480, margin: "0 auto", textAlign: "left" }}>
          {[
            "Every case records what was tested, not just what was concluded.",
            "Every case records what remains unproven.",
            "Every case requires consent before named publication.",
            "Every outcome claim requires a falsification question.",
          ].map((line, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ color: "rgba(52,211,153,0.6)", marginTop: 1, flexShrink: 0 }}>—</span>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.42)", lineHeight: 1.65 }}>{line}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const CaseStudiesIndexPage: NextPage<Props> = ({ cases }) => {
  return (
    <Layout>
      <Head>
        <title>Case Studies — Abraham of London</title>
        <meta name="description" content="Governed case studies. Evidence state, consent state, and outcome state published with every case." />
      </Head>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "80px 24px 120px" }}>

        {/* Hero */}
        <div style={{ marginBottom: 64 }}>
          <div style={{ ...mono, fontSize: 10, letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", marginBottom: 20 }}>
            PROOF REGISTRY
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 500, color: "rgba(255,255,255,0.92)", lineHeight: 1.3, marginBottom: 20, margin: "0 0 20px" }}>
            Case Studies
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.55)", lineHeight: 1.85, maxWidth: 660, margin: 0 }}>
            Published only with evidence state, consent state, and outcome state.
          </p>
        </div>

        {/* Trust principle */}
        <div style={{ borderLeft: "2px solid rgba(52,211,153,0.35)", paddingLeft: 24, marginBottom: 64 }}>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.48)", lineHeight: 1.9, margin: 0 }}>
            We do not publish success stories as decoration. Each case records what was tested, what remains unproven, and what would change the judgement.
          </p>
        </div>

        {/* Cases */}
        {cases.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {cases.map(cs => (
              <CaseCard key={cs.id} cs={cs} />
            ))}
          </div>
        )}

        {/* Method note */}
        <div style={{ marginTop: 80, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 40 }}>
          <div style={{ ...mono, fontSize: 10, letterSpacing: "0.08em", color: "rgba(255,255,255,0.22)", marginBottom: 20 }}>
            ABOUT THIS REGISTRY
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
            {[
              { label: "Evidence state", desc: "Method demonstration, founder-verified, client-confirmed, or evidence-linked." },
              { label: "Outcome state", desc: "Hypothesis set, pending review, partial, verified, or not yet measured." },
              { label: "Consent basis", desc: "Anonymous or named with explicit client consent." },
              { label: "Falsification", desc: "What would change the conclusion — stated for every case." },
            ].map(({ label, desc }) => (
              <div key={label}>
                <div style={{ ...mono, fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em", marginBottom: 8 }}>
                  {label.toUpperCase()}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", lineHeight: 1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const { listCaseStudies } = await import("@/lib/evidence/case-study-service");
    const { toPublicCaseStudy } = await import("@/lib/evidence/case-study-public");
    const records = await listCaseStudies({ publicOnly: true });
    const cases = records.map(toPublicCaseStudy);
    return { props: { cases } };
  } catch {
    return { props: { cases: [] } };
  }
};

export default CaseStudiesIndexPage;
