/**
 * pages/engagements/operator-pilot.tsx
 *
 * SELECTIVE OPERATOR PILOT — a controlled proof of decision intelligence
 * under real pressure. Not a demo. Not a trial of the platform.
 * A governed engagement around one live decision.
 */

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { NextPage } from "next";
import { ArrowRight, ShieldCheck, AlertTriangle, FileText, Clock, CheckCircle } from "lucide-react";

import Layout from "@/components/Layout";

const GOLD = "#C9A96E";
const AMBER = "#F59E0B";
const EMERALD = "#6EE7B7";
const VOID = "rgb(3 3 5)";

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1.25rem" }}>
      <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}BB` }}>{title}</p>
      <div className="mt-3 text-sm leading-7 text-white/60">{children}</div>
    </section>
  );
}

const OperatorPilotPage: NextPage = () => {
  return (
    <Layout
      title="Selective Operator Pilot | Abraham of London"
      description="A controlled proof of decision intelligence under real pressure. Submit one live decision for governed review."
      canonicalUrl="/engagements/operator-pilot"
      fullWidth
      headerTransparent
    >
      <Head><meta name="robots" content="index,follow" /></Head>
      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: VOID, color: "white" }}>
        <div className="mx-auto max-w-4xl space-y-8">

          {/* ── 1. WHAT THIS IS ── */}
          <header style={{ border: `1px solid ${GOLD}24`, background: `${GOLD}04`, padding: "1.5rem" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}BB` }}>
              Selective engagement · Operator pilot
            </p>
            <h1 className="mt-3" style={{ ...serif, fontSize: "clamp(2rem,4vw,3rem)", color: "rgba(255,255,255,0.92)", fontStyle: "italic" }}>
              A governed trial around one real decision.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60">
              This is not a demo. It is not a trial of the platform. It is a controlled proof of decision intelligence under real pressure. You bring one live decision with real stakes. The system tests it under evidence, authority, consequence, and execution reality — then returns a governed finding, a required move, and a checkpoint.
            </p>
          </header>

          {/* ── 2. WHO THIS IS FOR ── */}
          <section className="grid gap-6 xl:grid-cols-2">
            <Block title="Who this is for">
              Operators, founders, and executives carrying a real decision under pressure — with authority to act, consequence if wrong, and willingness to let the record govern what happens next. This is not for browsers, researchers, or general curiosity.
            </Block>
            <Block title="Who this is not for">
              Organisations that are not ready to name a specific decision. Teams that need consensus before they can act. Individuals seeking coaching, therapy, or generic advice. The pilot requires a decision, not a conversation.
            </Block>
          </section>

          {/* ── 3. WHAT KIND OF DECISION QUALIFIES ── */}
          <section className="grid gap-6 xl:grid-cols-2">
            <Block title="What kind of decision qualifies">
              One live decision with: a real constraint environment, a measurable cost to delay, at least one identifiable contradiction or competing obligation, and an owner who can act on the finding. Strategic, operational, structural, or governance decisions all qualify. Generic ideation does not.
            </Block>
            <Block title="What does not qualify">
              Hypothetical scenarios. Decisions where the outcome does not matter. Situations where the real constraint is unknown. Cases where the submitter lacks authority to implement the finding. The pilot tests real pressure, not imagined pressure.
            </Block>
          </section>

          {/* ── 4. WHAT THE PILOT TESTS ── */}
          <section className="grid gap-6 xl:grid-cols-2">
            <Block title="What the pilot tests">
              <ul className="space-y-2">
                <li className="flex items-start gap-2"><span style={{ color: GOLD }}>→</span> Evidence quality — is the case supported or asserted?</li>
                <li className="flex items-start gap-2"><span style={{ color: GOLD }}>→</span> Authority clarity — who owns the decision and can they execute?</li>
                <li className="flex items-start gap-2"><span style={{ color: GOLD }}>→</span> Consequence reality — what is actually at stake and for whom?</li>
                <li className="flex items-start gap-2"><span style={{ color: GOLD }}>→</span> Execution readiness — can the required move be implemented?</li>
                <li className="flex items-start gap-2"><span style={{ color: GOLD }}>→</span> Contradiction detection — where do stated intent and operating reality diverge?</li>
                <li className="flex items-start gap-2"><span style={{ color: GOLD }}>→</span> Escalation discipline — is escalation earned or assumed?</li>
              </ul>
            </Block>
            <Block title="What the pilot does not test">
              Personality traits. Team dynamics (use Team Assessment for that). Market conditions (use GMI for that). Long-term strategy (use Strategy Room for that). The pilot tests one decision under one set of conditions.
            </Block>
          </section>

          {/* ── 5. WHAT THE OPERATOR RECEIVES ── */}
          <section style={{ border: `1px solid ${GOLD}20`, background: `${GOLD}04`, padding: "1.25rem" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}BB` }}>
              What the operator receives
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                { icon: <ShieldCheck style={{ width: 14, height: 14, color: EMERALD }} />, text: "Governed finding — the contradiction or exposure holding the case in place" },
                { icon: <AlertTriangle style={{ width: 14, height: 14, color: AMBER }} />, text: "Required move — the single action that changes the condition" },
                { icon: <Clock style={{ width: 14, height: 14, color: GOLD }} />, text: "Checkpoint — scheduled accountability with evidence-based follow-up" },
                { icon: <FileText style={{ width: 14, height: 14, color: "rgba(255,255,255,0.50)" }} />, text: "Decision record — written to Decision Centre for continuity" },
                { icon: <ArrowRight style={{ width: 14, height: 14, color: GOLD }} />, text: "Next-step architecture — earned escalation path if the evidence justifies it" },
                { icon: <CheckCircle style={{ width: 14, height: 14, color: EMERALD }} />, text: "Return Brief — outcome review after the required move window" },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-3">
                  <div style={{ marginTop: 2, flexShrink: 0 }}>{item.icon}</div>
                  <p style={{ fontSize: "13px", lineHeight: 1.6, color: "rgba(255,255,255,0.55)" }}>{item.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── 6. WHAT THE SYSTEM WILL NOT CLAIM ── */}
          <Block title="What the system will not claim">
            <ul className="space-y-2">
              <li className="flex items-start gap-2"><span style={{ color: `${AMBER}AA` }}>✗</span> Instant transformation — the pilot tests one decision, not a life overhaul</li>
              <li className="flex items-start gap-2"><span style={{ color: `${AMBER}AA` }}>✗</span> Guaranteed escalation — not every case clears the threshold</li>
              <li className="flex items-start gap-2"><span style={{ color: `${AMBER}AA` }}>✗</span> Verified improvement without verification — outcomes are reviewed, not assumed</li>
              <li className="flex items-start gap-2"><span style={{ color: `${AMBER}AA` }}>✗</span> Full system access — the pilot is a controlled engagement, not a subscription</li>
              <li className="flex items-start gap-2"><span style={{ color: `${AMBER}AA` }}>✗</span> Therapeutic or coaching benefit — this is decision infrastructure, not personal development</li>
              <li className="flex items-start gap-2"><span style={{ color: `${AMBER}AA` }}>✗</span> Confidentiality beyond the standard terms — the decision record is governed, not private</li>
            </ul>
          </Block>

          {/* ── 7. WHAT HAPPENS AFTER THE PILOT ── */}
          <section className="grid gap-6 xl:grid-cols-2">
            <Block title="What happens after the pilot">
              The decision record remains in the Decision Centre. If the required move is completed, the system evaluates whether escalation is earned. Earned paths include: Executive Reporting (if institutional consequence is present), Strategy Room (if execution intervention is justified), Return Brief (if the condition remains unresolved), and Oversight (if the pattern recurs).
            </Block>
            <Block title="What the pilot feeds into">
              <div className="space-y-2">
                <p><span style={{ color: GOLD }}>→</span> <Link href="/diagnostics/fast" style={{ color: "rgba(255,255,255,0.70)", textDecoration: "underline", textUnderlineOffset: 3 }}>Fast Diagnostic</Link> — immediate fracture identification</p>
                <p><span style={{ color: GOLD }}>→</span> <Link href="/diagnostics/purpose-alignment" style={{ color: "rgba(255,255,255,0.70)", textDecoration: "underline", textUnderlineOffset: 3 }}>Purpose Alignment / Personal Decision Audit</Link> — mandate and obligation clarity</p>
                <p><span style={{ color: GOLD }}>→</span> <Link href="/decision-instruments" style={{ color: "rgba(255,255,255,0.70)", textDecoration: "underline", textUnderlineOffset: 3 }}>Decision Instruments</Link> — exposure, mandate, escalation, execution risk</p>
                <p><span style={{ color: GOLD }}>→</span> <Link href="/diagnostics/executive-reporting" style={{ color: "rgba(255,255,255,0.70)", textDecoration: "underline", textUnderlineOffset: 3 }}>Executive Reporting</Link> — structural escalation where justified</p>
                <p><span style={{ color: GOLD }}>→</span> <Link href="/strategy-room" style={{ color: "rgba(255,255,255,0.70)", textDecoration: "underline", textUnderlineOffset: 3 }}>Strategy Room</Link> — execution governance where evidence supports it</p>
                <p><span style={{ color: GOLD }}>→</span> <Link href="/decision-centre" style={{ color: "rgba(255,255,255,0.70)", textDecoration: "underline", textUnderlineOffset: 3 }}>Decision Centre</Link> — governed case memory and checkpoint tracking</p>
                <p><span style={{ color: GOLD }}>→</span> <Link href="/engagements/retained-oversight" style={{ color: "rgba(255,255,255,0.70)", textDecoration: "underline", textUnderlineOffset: 3 }}>Boardroom / Oversight</Link> — only where the record justifies it</p>
              </div>
            </Block>
          </section>

          {/* ── 8. SUBMIT DECISION FOR PILOT REVIEW ── */}
          <section style={{ border: `1px solid ${GOLD}30`, background: `${GOLD}06`, padding: "1.5rem", textAlign: "center" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}BB` }}>
              Ready to proceed
            </p>
            <p className="mt-3 max-w-2xl mx-auto text-sm leading-7 text-white/60">
              Submit one live decision for pilot review. The system will test it, identify the contradiction, issue a required move, schedule accountability, and show what changes. This is a governed engagement, not a demo.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Link
                href="/diagnostics/fast?source=operator-pilot"
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
                Submit a decision for pilot review
                <ArrowRight style={{ width: 11, height: 11 }} />
              </Link>
              <Link
                href="/engagements/selective-pilot"
                style={{
                  padding: "14px 24px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "rgba(255,255,255,0.50)",
                  ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase",
                  textDecoration: "none",
                }}
              >
                Review pilot terms
              </Link>
            </div>
          </section>

          {/* ── VALUE RECEIPT ── */}
          <section style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)", padding: "1rem" }}>
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)" }}>
              Value receipt
            </p>
            <div className="mt-3 grid gap-2 text-xs text-white/40 sm:grid-cols-2">
              <span>Price: Controlled engagement (not a priced product)</span>
              <span>Delivery format: Governed finding + checkpoint + decision record</span>
              <span>Writes to memory: Yes — Decision Centre record created</span>
              <span>Creates dossier: No — the pilot produces a finding, not a PDF report</span>
              <span>Progression: Earned — escalation requires evidence, not payment</span>
              <span>Excludes: Full system access, PDF dossier, ER/Strategy Room without justification</span>
            </div>
          </section>

        </div>
      </main>
    </Layout>
  );
};

export default OperatorPilotPage;