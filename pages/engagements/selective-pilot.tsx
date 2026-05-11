/**
 * pages/engagements/selective-pilot.tsx
 *
 * SELECTIVE PILOT TERMS — the eligibility and terms layer for the
 * Selective Operator Pilot. This is not a second sales page.
 * It is the terms, eligibility criteria, and exclusions document
 * for the controlled evaluation pathway.
 *
 * Distinct from /engagements/operator-pilot which describes what
 * the pilot is and what the operator receives.
 */

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { NextPage } from "next";
import { ArrowRight, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

import Layout from "@/components/Layout";

const GOLD = "#C9A96E";
const AMBER = "#F59E0B";
const EMERALD = "#6EE7B7";
const VOID = "rgb(3 3 5)";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.015)", padding: "1.25rem" }}>
      <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}BB`, marginBottom: "0.75rem" }}>{title}</p>
      {children}
    </section>
  );
}

function EligibilityItem({ icon, text, allowed }: { icon: React.ReactNode; text: string; allowed: boolean }) {
  return (
    <div className="flex items-start gap-3" style={{ marginBottom: "0.5rem" }}>
      <div style={{ marginTop: 2, flexShrink: 0 }}>{icon}</div>
      <p style={{ fontSize: "13px", lineHeight: 1.6, color: allowed ? "rgba(255,255,255,0.60)" : "rgba(255,255,255,0.45)" }}>{text}</p>
    </div>
  );
}

const SelectivePilotPage: NextPage = () => {
  return (
    <Layout
      title="Selective Pilot Terms | Abraham of London"
      description="Terms, eligibility, and exclusions for the Selective Operator Pilot — a controlled evaluation pathway for serious operators carrying real decision pressure."
      canonicalUrl="/engagements/selective-pilot"
      fullWidth
      headerTransparent
    >
      <Head><meta name="robots" content="index,follow" /></Head>
      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: VOID, color: "white" }}>
        <div className="mx-auto max-w-4xl space-y-6">

          {/* ── 1. HEADER ── */}
          <header style={{ border: `1px solid ${GOLD}24`, background: `${GOLD}04`, padding: "1.5rem" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}BB` }}>
              Selective pilot terms
            </p>
            <h1 className="mt-3" style={{ ...serif, fontSize: "clamp(1.8rem,4vw,2.6rem)", color: "rgba(255,255,255,0.92)", fontStyle: "italic" }}>
              Eligibility, terms, and exclusions for the Selective Operator Pilot.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/55">
              This is a controlled evaluation pathway for serious operators carrying real decision pressure.
              It is not an open demo, coaching call, or beta programme. Read the terms below before submitting.
            </p>
          </header>

          {/* ── 2. POSITIONING ── */}
          <Section title="Positioning">
            <p className="text-sm leading-7 text-white/55">
              The Selective Operator Pilot is a governed, controlled evaluation of one live decision under real pressure.
              It exists to prove that decision intelligence produces a clearer finding than intuition alone —
              and to determine whether the case justifies further investment in the paid corridor.
              It is not a sales funnel. It is not a free trial of the platform. It is a structured assessment
              with a defined scope, clear outputs, and an earned progression path.
            </p>
          </Section>

          {/* ── 3. ELIGIBILITY ── */}
          <Section title="Who is eligible">
            <p className="text-sm leading-7 text-white/50 mb-3">
              To submit a decision for pilot review, you must meet all of the following criteria:
            </p>
            <EligibilityItem icon={<CheckCircle style={{ width: 14, height: 14, color: EMERALD }} />} text="You are carrying a real decision under measurable pressure — not a hypothetical or preference" allowed={true} />
            <EligibilityItem icon={<CheckCircle style={{ width: 14, height: 14, color: EMERALD }} />} text="You hold authority or direct responsibility connected to the decision outcome" allowed={true} />
            <EligibilityItem icon={<CheckCircle style={{ width: 14, height: 14, color: EMERALD }} />} text="You are willing to submit enough context for the system to produce a meaningful reading" allowed={true} />
            <EligibilityItem icon={<CheckCircle style={{ width: 14, height: 14, color: EMERALD }} />} text="You do not require validation, reassurance, or motivational advice" allowed={true} />
            <EligibilityItem icon={<CheckCircle style={{ width: 14, height: 14, color: EMERALD }} />} text="You accept that outcomes are not guaranteed and that escalation is earned, not automatic" allowed={true} />
          </Section>

          {/* ── 4. SUITABLE DECISIONS ── */}
          <Section title="What kind of decision qualifies">
            <p className="text-sm leading-7 text-white/50 mb-3">
              The following decision types are suitable for pilot review:
            </p>
            <EligibilityItem icon={<CheckCircle style={{ width: 14, height: 14, color: EMERALD }} />} text="Unresolved strategic choice with no clear path forward" allowed={true} />
            <EligibilityItem icon={<CheckCircle style={{ width: 14, height: 14, color: EMERALD }} />} text="Authority conflict — who owns the decision and who can execute it is unclear" allowed={true} />
            <EligibilityItem icon={<CheckCircle style={{ width: 14, height: 14, color: EMERALD }} />} text="Execution drift — stated direction and operating reality have diverged" allowed={true} />
            <EligibilityItem icon={<CheckCircle style={{ width: 14, height: 14, color: EMERALD }} />} text="Institutional consequence — the decision affects people, structure, or reputation beyond the individual" allowed={true} />
            <EligibilityItem icon={<CheckCircle style={{ width: 14, height: 14, color: EMERALD }} />} text="Board or operator tension — disagreement about direction, priority, or risk tolerance" allowed={true} />
            <EligibilityItem icon={<CheckCircle style={{ width: 14, height: 14, color: EMERALD }} />} text="Recurring decision failure — the same pattern keeps producing the same unsatisfactory outcome" allowed={true} />
          </Section>

          {/* ── 5. NOT SUITABLE ── */}
          <Section title="What does not qualify">
            <p className="text-sm leading-7 text-white/50 mb-3">
              The following will not be accepted for pilot review:
            </p>
            <EligibilityItem icon={<XCircle style={{ width: 14, height: 14, color: "#FC8181" }} />} text="Curiosity only — no real decision pressure or consequence" allowed={false} />
            <EligibilityItem icon={<XCircle style={{ width: 14, height: 14, color: "#FC8181" }} />} text="Therapeutic or counselling need — this is decision infrastructure, not personal development" allowed={false} />
            <EligibilityItem icon={<XCircle style={{ width: 14, height: 14, color: "#FC8181" }} />} text="Legal, financial, or medical advice requests — we do not provide licensed advice" allowed={false} />
            <EligibilityItem icon={<XCircle style={{ width: 14, height: 14, color: "#FC8181" }} />} text="Generic business coaching — the pilot tests one decision, not general strategy" allowed={false} />
            <EligibilityItem icon={<XCircle style={{ width: 14, height: 14, color: "#FC8181" }} />} text="Speculative AI or prompt testing — the system is not a chatbot" allowed={false} />
            <EligibilityItem icon={<XCircle style={{ width: 14, height: 14, color: "#FC8181" }} />} text="Prestige access without decision stakes — the pilot requires a real decision, not a title" allowed={false} />
          </Section>

          {/* ── 6. WHAT THE PILOT INCLUDES ── */}
          <Section title="What the pilot includes">
            <div className="space-y-2">
              <EligibilityItem icon={<CheckCircle style={{ width: 14, height: 14, color: EMERALD }} />} text="Initial decision signal — pressure band, named signal, consequence warning" allowed={true} />
              <EligibilityItem icon={<CheckCircle style={{ width: 14, height: 14, color: EMERALD }} />} text="Evidence review — the system tests your submission against evidence, authority, and consequence standards" allowed={true} />
              <EligibilityItem icon={<CheckCircle style={{ width: 14, height: 14, color: EMERALD }} />} text="Contradiction or pressure reading where the evidence supports it" allowed={true} />
              <EligibilityItem icon={<CheckCircle style={{ width: 14, height: 14, color: EMERALD }} />} text="Admissible next move — the single action that changes the condition" allowed={true} />
              <EligibilityItem icon={<CheckCircle style={{ width: 14, height: 14, color: EMERALD }} />} text="Possible route into paid instrument, Executive Reporting, Strategy Room, or retained oversight — only where the evidence justifies it" allowed={true} />
            </div>
          </Section>

          {/* ── 7. WHAT IT EXCLUDES ── */}
          <Section title="What the pilot excludes">
            <div className="space-y-2">
              <EligibilityItem icon={<XCircle style={{ width: 14, height: 14, color: "#FC8181" }} />} text="Not guaranteed outcomes — the pilot tests, it does not promise" allowed={false} />
              <EligibilityItem icon={<XCircle style={{ width: 14, height: 14, color: "#FC8181" }} />} text="Legal, financial, or medical advice — no licensed advice of any kind" allowed={false} />
              <EligibilityItem icon={<XCircle style={{ width: 14, height: 14, color: "#FC8181" }} />} text="Full retained oversight — the pilot is a single engagement, not a retainer" allowed={false} />
              <EligibilityItem icon={<XCircle style={{ width: 14, height: 14, color: "#FC8181" }} />} text="Unrestricted system access — the pilot is a controlled evaluation, not a subscription" allowed={false} />
              <EligibilityItem icon={<XCircle style={{ width: 14, height: 14, color: "#FC8181" }} />} text="Automatic Strategy Room or Boardroom access — escalation is earned, not included" allowed={false} />
            </div>
          </Section>

          {/* ── 8. AFTER SUBMISSION ── */}
          <Section title="What happens after submission">
            <div className="space-y-4">
              <div style={{ borderLeft: `2px solid ${EMERALD}40`, paddingLeft: "12px" }}>
                <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: `${EMERALD}99` }}>Accepted for review</p>
                <p className="text-sm leading-7 text-white/50 mt-1">If your submission meets the eligibility criteria, it enters the governed review pipeline. You will receive a finding, a required move, and a checkpoint.</p>
              </div>
              <div style={{ borderLeft: `2px solid ${GOLD}40`, paddingLeft: "12px" }}>
                <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: `${GOLD}99` }}>Redirected to a better entry point</p>
                <p className="text-sm leading-7 text-white/50 mt-1">If your decision is better served by a specific instrument (Fast Diagnostic, Decision Exposure, Purpose Alignment), you will be redirected rather than processed through the pilot.</p>
              </div>
              <div style={{ borderLeft: `2px solid "#FC8181"40`, paddingLeft: "12px" }}>
                <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#FC8181" }}>Declined — evidence insufficient</p>
                <p className="text-sm leading-7 text-white/50 mt-1">If the submission lacks sufficient context, authority, or consequence, it will be declined with an explanation of what would be required to qualify.</p>
              </div>
              <div style={{ borderLeft: `2px solid ${AMBER}40`, paddingLeft: "12px" }}>
                <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: `${AMBER}99` }}>Escalated — consequence justifies it</p>
                <p className="text-sm leading-7 text-white/50 mt-1">If the evidence reveals institutional consequence, the case may be escalated directly to Executive Reporting or Strategy Room without requiring a separate purchase.</p>
              </div>
            </div>
          </Section>

          {/* ── 9. PAID CORRIDOR CONTINUATION ── */}
          <Section title="What may qualify for paid corridor continuation">
            <p className="text-sm leading-7 text-white/50 mb-3">
              Completion of the pilot does not guarantee paid corridor access. The following criteria are evaluated:
            </p>
            <EligibilityItem icon={<AlertTriangle style={{ width: 14, height: 14, color: AMBER }} />} text="Institutional consequence present — the decision affects people, structure, or reputation beyond the individual" allowed={true} />
            <EligibilityItem icon={<AlertTriangle style={{ width: 14, height: 14, color: AMBER }} />} text="Evidence quality sufficient — the submission meets the evidence threshold for deeper analysis" allowed={true} />
            <EligibilityItem icon={<AlertTriangle style={{ width: 14, height: 14, color: AMBER }} />} text="Required move completed — the checkpoint shows action, not just awareness" allowed={true} />
            <EligibilityItem icon={<AlertTriangle style={{ width: 14, height: 14, color: AMBER }} />} text="Pattern recurrence risk — the condition is likely to repeat without structural intervention" allowed={true} />
            <p className="text-sm leading-7 text-white/45 mt-3">
              If these criteria are met, the case may qualify for Executive Reporting (£295), Strategy Room (£750),
              or retained oversight (contracted monthly). If not, the pilot finding stands as the final output
              and the operator is advised to monitor rather than escalate.
            </p>
          </Section>

          {/* ── 10. WHAT ABRAHAM OF LONDON DOES NOT CLAIM ── */}
          <Section title="What Abraham of London does not claim">
            <div className="space-y-2">
              <EligibilityItem icon={<XCircle style={{ width: 14, height: 14, color: "#FC8181" }} />} text="That every submission will produce a clear finding — some decisions are genuinely ambiguous" allowed={false} />
              <EligibilityItem icon={<XCircle style={{ width: 14, height: 14, color: "#FC8181" }} />} text="That the pilot replaces professional advice — it is decision infrastructure, not a licensed service" allowed={false} />
              <EligibilityItem icon={<XCircle style={{ width: 14, height: 14, color: "#FC8181" }} />} text="That the system is infallible — the reading is based on submitted evidence, not omniscience" allowed={false} />
              <EligibilityItem icon={<XCircle style={{ width: 14, height: 14, color: "#FC8181" }} />} text="That escalation is always justified — most cases will not qualify for the paid corridor" allowed={false} />
              <EligibilityItem icon={<XCircle style={{ width: 14, height: 14, color: "#FC8181" }} />} text="That the pilot is a therapeutic, coaching, or mentoring relationship — it is a governed assessment" allowed={false} />
            </div>
          </Section>

          {/* ── CTA ── */}
          <section style={{ border: `1px solid ${GOLD}30`, background: `${GOLD}06`, padding: "1.5rem", textAlign: "center" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}BB` }}>
              Ready to submit
            </p>
            <p className="mt-3 max-w-2xl mx-auto text-sm leading-7 text-white/55">
              If your decision meets the eligibility criteria above, submit it for pilot review.
              If you are unsure whether your decision qualifies, start with the Fast Diagnostic instead.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Link
                href="/diagnostics/fast"
                style={{
                  padding: "14px 24px",
                  border: `1px solid ${GOLD}50`,
                  backgroundColor: `${GOLD}18`,
                  color: GOLD,
                  ...mono, fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase",
                  textDecoration: "none",
                  display: "inline-flex", alignItems: "center", gap: "8px",
                }}
              >
                Submit for review
                <ArrowRight style={{ width: 11, height: 11 }} />
              </Link>
              <Link
                href="/engagements/operator-pilot"
                style={{
                  padding: "14px 24px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "rgba(255,255,255,0.50)",
                  ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase",
                  textDecoration: "none",
                }}
              >
                Read about the pilot
              </Link>
            </div>
          </section>

        </div>
      </main>
    </Layout>
  );
};

export default SelectivePilotPage;