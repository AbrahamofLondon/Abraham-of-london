/**
 * pages/playbooks/[slug]/run.tsx
 *
 * The governed execution surface for the three playbooks. This makes the
 * catalog `customerAccessRoute` (/playbooks/<slug>/run) a REAL route rather
 * than a self-asserted one. Execution is server-side and entitlement-gated via
 * /api/playbooks/[slug]/run — this page only collects product-specific intake
 * and renders the product-specific result, with failure/recovery.
 */

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import { PLAYBOOK_SLUGS, resolvePlaybookRun } from "@/lib/playbooks/playbook-run-authority";
import { PLAYBOOK_CLAIM_BOUNDARY } from "@/lib/playbooks/playbook-run-types";

const GOLD = "#C9A96E";

interface IntakeSpec {
  title: string;
  code: string;
  intro: string;
  fields: string;
  example: string;
  nextHref: string;
  nextLabel: string;
}

const INTAKE: Record<string, IntakeSpec> = {
  "execution-integrity-protocol": {
    title: "Execution Integrity Protocol",
    code: "execution_integrity_protocol",
    intro:
      "Supply your live commitments. The protocol assesses owner clarity, dependency risk, escalation thresholds and failure points — and flags commitments marked complete that are still obstructed.",
    fields: "commitments[]: { id, statement, owner, deadline (YYYY-MM-DD), dependencies[], status, blockers[] }",
    example: JSON.stringify(
      {
        asOf: "2026-07-07",
        commitments: [
          { id: "c1", statement: "Stand up secondary supply node", owner: "COO", deadline: "2026-09-30", status: "at_risk", dependencies: [] },
          { id: "c2", statement: "Hedge tariff-linked FX exposure", owner: null, deadline: "2026-07-15", status: "blocked", blockers: ["treasury sign-off"], dependencies: ["c1"] },
        ],
      },
      null,
      2,
    ),
    nextHref: "/decision-instruments/execution-risk-index/run",
    nextLabel: "Quantify with the Execution Risk Index",
  },
  "the-alignment-audit-playbook": {
    title: "The Alignment Audit Playbook",
    code: "alignment_audit_playbook",
    intro:
      "Supply your stated mandate and what actors are actually rewarded for. The audit surfaces mandate–incentive gaps, authority imbalance, and hidden conflict where a misaligned actor holds high authority.",
    fields: "statedMandate, actualIncentives[]{actor,rewardedFor}, authorityDistribution[]{actor,authority}, decisionDisagreements[], executionDivergenceSignals[]",
    example: JSON.stringify(
      {
        statedMandate: "Prioritise durable margin and customer retention over raw volume",
        actualIncentives: [
          { actor: "Sales", rewardedFor: "new logo volume" },
          { actor: "Ops", rewardedFor: "durable margin protection" },
        ],
        authorityDistribution: [
          { actor: "Sales", authority: "high" },
          { actor: "Ops", authority: "low" },
        ],
        decisionDisagreements: [{ decision: "discounting policy", factions: ["Sales", "Finance"] }],
      },
      null,
      2,
    ),
    nextHref: "/decision-instruments/governance-drift-detector/run",
    nextLabel: "Track with the Governance Drift Detector",
  },
  "the-drift-detection-framework": {
    title: "The Drift Detection Framework",
    code: "drift_detection_framework",
    intro:
      "Supply operational signals over time. The framework classifies drift and prioritises deterioration that continued after a warning was issued, and flags signals marked resolved that are still worsening.",
    fields: "signals[]: { id, kind (metric|delay|ownership|cancellation|recurrence|commitment|warning), series[], warned, resolved, note }",
    example: JSON.stringify(
      {
        signals: [
          { id: "s1", kind: "delay", series: [2, 6, 13], warned: true, resolved: false, note: "release slippage" },
          { id: "s2", kind: "metric", series: [95, 95, 94], note: "SLA attainment" },
          { id: "s3", kind: "ownership", resolved: false, note: "no named owner since Q1" },
        ],
      },
      null,
      2,
    ),
    nextHref: "/oversight",
    nextLabel: "Escalate to Oversight Command",
  },
};

interface RunPageProps {
  slug: string;
  spec: IntakeSpec;
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: PLAYBOOK_SLUGS.filter((s) => INTAKE[s]).map((slug) => ({ params: { slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<RunPageProps> = async ({ params }) => {
  const slug = String(params?.slug ?? "");
  const spec = INTAKE[slug];
  if (!spec || !resolvePlaybookRun(slug)) return { notFound: true };
  return { props: { slug, spec } };
};

type RunState =
  | { phase: "intake" }
  | { phase: "running" }
  | { phase: "gated"; entitlementSlug: string }
  | { phase: "error"; message: string }
  | { phase: "done"; runId: string; result: any };

const PlaybookRunPage: NextPage<RunPageProps> = ({ slug, spec }) => {
  const [raw, setRaw] = React.useState<string>(spec.example);
  const [state, setState] = React.useState<RunState>({ phase: "intake" });

  async function submit() {
    let input: unknown;
    try {
      input = JSON.parse(raw);
    } catch {
      setState({ phase: "error", message: "Intake is not valid JSON. Correct it and retry." });
      return;
    }
    setState({ phase: "running" });
    try {
      const res = await fetch(`/api/playbooks/${slug}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      const data = await res.json();
      if (res.status === 402) {
        setState({ phase: "gated", entitlementSlug: data.entitlementSlug ?? spec.code });
        return;
      }
      if (!res.ok) {
        setState({ phase: "error", message: data.error ?? `Run failed (${res.status}).` });
        return;
      }
      setState({ phase: "done", runId: data.runId, result: data.result });
    } catch {
      setState({ phase: "error", message: "Network error. Your intake is preserved — retry." });
    }
  }

  const result = state.phase === "done" ? state.result : null;

  return (
    <Layout title={`${spec.title} — Run`} description={spec.intro} fullWidth>
      <Head><meta name="robots" content="noindex" /></Head>
      <div style={{ backgroundColor: "rgb(6 6 9)", minHeight: "100vh", color: "white" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "6rem 1.5rem 4rem" }}>
          <Link href={`/playbooks`} style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>← Playbooks</Link>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontSize: "2.4rem", marginTop: "1rem" }}>{spec.title}</h1>
          <p style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>{spec.intro}</p>

          {(state.phase === "intake" || state.phase === "running" || state.phase === "error") && (
            <div style={{ marginTop: "2rem" }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: `${GOLD}AA`, marginBottom: 8 }}>
                Intake
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>{spec.fields}</p>
              <textarea
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                spellCheck={false}
                rows={16}
                style={{ width: "100%", background: "rgb(10 14 22)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.1)", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, padding: 12 }}
              />
              {state.phase === "error" && (
                <p style={{ color: "rgba(252,165,165,0.9)", fontSize: 13, marginTop: 8 }}>{state.message}</p>
              )}
              <button
                onClick={submit}
                disabled={state.phase === "running"}
                style={{ marginTop: 14, padding: "10px 22px", background: `${GOLD}18`, border: `1px solid ${GOLD}55`, color: `${GOLD}DD`, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer" }}
              >
                {state.phase === "running" ? "Running…" : "Run the playbook"}
              </button>
            </div>
          )}

          {state.phase === "gated" && (
            <div style={{ marginTop: "2rem", border: `1px solid ${GOLD}30`, background: `${GOLD}08`, padding: "1.5rem" }}>
              <div style={{ color: `${GOLD}CC`, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase" }}>Access required</div>
              <p style={{ color: "rgba(255,255,255,0.6)", marginTop: 8 }}>
                This governed playbook requires a verified entitlement (<code>{state.entitlementSlug}</code>). Acquire access, then return to run it.
              </p>
              <Link href={`/playbooks/${slug}`} style={{ color: `${GOLD}DD`, fontSize: 13 }}>Review access →</Link>
            </div>
          )}

          {result && (
            <div style={{ marginTop: "2rem" }}>
              <div style={{ display: "flex", gap: 16, alignItems: "baseline", flexWrap: "wrap" }}>
                <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "2rem", color: result.overallSeverity === "CRITICAL" || result.overallSeverity === "HIGH" ? "rgba(252,165,165,0.85)" : `${GOLD}CC` }}>
                  {result.score === null ? "—" : `${result.score}/100`}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{result.posture} · {result.overallSeverity}</span>
              </div>

              {result.contradictions?.length > 0 && (
                <Section title="Contradictions to resolve first" tone="danger">
                  {result.contradictions.map((c: any, i: number) => <li key={i}><strong>{c.ref}:</strong> {c.detail}</li>)}
                </Section>
              )}
              {result.actions?.length > 0 && (
                <Section title="Governed actions">
                  {result.actions.map((a: any, i: number) => <li key={i}><strong>[{a.severity}]</strong> {a.action} — <em>{a.rationale}</em></li>)}
                </Section>
              )}
              {result.evidenceGaps?.length > 0 && (
                <Section title="Evidence gaps">
                  {result.evidenceGaps.map((g: string, i: number) => <li key={i}>{g}</li>)}
                </Section>
              )}

              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 20, lineHeight: 1.6 }}>{result.claimBoundary ?? PLAYBOOK_CLAIM_BOUNDARY}</p>
              <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.2)" }}>Run recorded · {state.phase === "done" ? state.runId : ""}</p>
              <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
                <Link href={spec.nextHref} style={{ color: `${GOLD}DD`, fontSize: 13 }}>{spec.nextLabel} →</Link>
                <button onClick={() => setState({ phase: "intake" })} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer" }}>Run again</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

function Section({ title, children, tone }: { title: string; children: React.ReactNode; tone?: "danger" }) {
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: tone === "danger" ? "rgba(252,165,165,0.8)" : `${GOLD}AA`, marginBottom: 8 }}>{title}</div>
      <ul style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.7, paddingLeft: 18 }}>{children}</ul>
    </div>
  );
}

export default PlaybookRunPage;
