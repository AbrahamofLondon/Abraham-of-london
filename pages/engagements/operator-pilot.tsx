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
import LegalIdentityBlock from "@/components/trust/LegalIdentityBlock";
import PlainEnglishDecisionLayer from "@/components/trust/PlainEnglishDecisionLayer";
import WorkedDecisionExample from "@/components/trust/WorkedDecisionExample";
import { track } from "@/lib/analytics/track";
import { recordJourneyEvent } from "@/lib/demo/record-journey-event";
import { COLORS, FONTS, caption as dsCaption, bodyTextSm as dsBodySm, field as dsField, primaryButton as dsPrimary, hexA } from "@/lib/demo/journey-design";

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
  React.useEffect(() => { recordJourneyEvent("PILOT_VIEWED"); }, []);
  return (
    <Layout
      title="Selective Operator Pilot | Abraham of London"
      description="A controlled proof of decision intelligence under real pressure. Submit one live decision for governed review."
      canonicalUrl="/engagements/operator-pilot"
      fullWidth
      headerTransparent
    >
      <Head><meta name="robots" content="index,follow" /></Head>
      <main className="min-h-screen px-6 pb-24 pt-32 sm:pt-36" style={{ backgroundColor: VOID, color: "white" }}>
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

          <section style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.015)", padding: "1rem" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}BB` }}>
              Trust boundary
            </p>
            <p className="mt-3 text-sm leading-7 text-white/60">
              Pilot use is bounded to one decision or defined review scope. Sensitive or regulated workflows should begin with sanitised or minimally sensitive information until deeper assurance review is completed.
            </p>
          </section>

          <LegalIdentityBlock />

          {/* ── 2. WHO THIS IS FOR ── */}
          <section className="grid gap-6 xl:grid-cols-2">
            <Block title="Who this is for">
              Operators, founders, and executives carrying a real decision under pressure — with authority to act, consequence if wrong, and willingness to let the record govern what happens next. This is not for browsers, researchers, or general curiosity.
            </Block>
            <Block title="Who this is not for">
              Organisations that are not ready to name a specific decision. Teams that need consensus before they can act. Individuals seeking coaching, therapy, or generic advice. The pilot requires a decision, not a conversation.
            </Block>
          </section>

          {/* ── PLAIN-ENGLISH LAYER ── */}
          <PlainEnglishDecisionLayer id="plain-english-pilot" />

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

          {/* ── WORKED EXAMPLE ── */}
          <WorkedDecisionExample id="worked-example-pilot" />

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
                Request governed pilot review
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

          {/* ── STRUCTURED INTAKE (§6/§7) ── */}
          <section id="pilot-intake" style={{ border: `1px solid ${GOLD}24`, background: `${GOLD}03`, padding: "1.5rem" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}BB` }}>Structured pilot intake</p>
            <p className="mt-2 text-sm leading-7 text-white/55">
              This is a qualification, not a checkout. Nothing is accepted automatically — a strong submission reaches a human reviewer, who decides suitability and scope. You will receive a reference to check your status.
            </p>
            <PilotIntakeForm />
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

// ── §6/§7 structured intake form (client) ────────────────────────────────────
type IntakeState = {
  organisation: string; role: string; authorityToEngage: boolean; decisionDomain: string;
  materiality: "LOW" | "MODERATE" | "HIGH" | "CRITICAL"; decisionStage: "EXPLORING" | "FRAMING" | "DECIDING" | "COMMITTED";
  affectedStakeholders: string; existingEvidence: string; knownContradictions: string;
  governanceSensitivity: "NONE" | "SOME" | "HIGH" | "REGULATED"; confidentialityRequired: boolean;
  desiredOutcome: string; willingToParticipateInCheckpoints: boolean; contactEmail: string;
};

const INTAKE_DEFAULT: IntakeState = {
  organisation: "", role: "", authorityToEngage: false, decisionDomain: "", materiality: "HIGH",
  decisionStage: "FRAMING", affectedStakeholders: "", existingEvidence: "", knownContradictions: "",
  governanceSensitivity: "SOME", confidentialityRequired: false, desiredOutcome: "",
  willingToParticipateInCheckpoints: false, contactEmail: "",
};

function PilotIntakeForm() {
  const [f, setF] = React.useState<IntakeState>(INTAKE_DEFAULT);
  const [submitting, setSubmitting] = React.useState(false);
  const startedRef = React.useRef(false);
  const [outcome, setOutcome] = React.useState<{ reference?: string; qualificationStatus: string; reviewStatus?: string; nextStep: string; reasons?: string[] } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const fieldStyle: React.CSSProperties = dsField();
  const lbl: React.CSSProperties = dsCaption(COLORS.muted);

  async function submit() {
    setSubmitting(true); setError(null);
    try {
      const res = await fetch("/api/engagements/operator-pilot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, decisionDeadline: null }) });
      const data = await res.json();
      if (res.status === 422) { setError("Some required fields are missing — please complete them: " + (data?.qualification?.missingFields ?? []).join(", ")); return; }
      if (!res.ok) { setError(data?.error ?? "Submission failed."); return; }
      track("operator_pilot_intake_result_viewed", { qualificationStatus: data?.qualificationStatus });
      recordJourneyEvent(data?.qualificationStatus === "MORE_INFO_REQUIRED" ? "PILOT_MORE_INFO_REQUIRED" : "PILOT_SUBMITTED");
      setOutcome(data);
    } catch { setError("Network error — please try again."); }
    finally { setSubmitting(false); }
  }

  if (outcome) {
    return (
      <div style={{ marginTop: "1rem", border: `1px solid ${EMERALD}30`, background: `${EMERALD}05`, padding: "1rem" }}>
        <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${EMERALD}` }}>Submitted · {outcome.qualificationStatus}</p>
        {outcome.reference && <p className="mt-2 text-sm text-white/70">Your reference: <strong style={{ color: GOLD }}>{outcome.reference}</strong> — keep this to check your status.</p>}
        <p className="mt-2 text-sm leading-7 text-white/60">{outcome.nextStep}</p>
        {outcome.reasons && outcome.reasons.length > 0 && (
          <ul className="mt-2 text-xs text-white/45" style={{ listStyle: "disc", paddingLeft: 18 }}>{outcome.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <div><label style={lbl}>Organisation</label><input style={fieldStyle} value={f.organisation} onChange={(e) => { if (!startedRef.current) { startedRef.current = true; recordJourneyEvent("PILOT_STARTED"); } setF({ ...f, organisation: e.target.value }); }} /></div>
      <div><label style={lbl}>Your role</label><input style={fieldStyle} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} /></div>
      <div><label style={lbl}>Decision domain</label><input style={fieldStyle} value={f.decisionDomain} onChange={(e) => setF({ ...f, decisionDomain: e.target.value })} /></div>
      <div><label style={lbl}>Contact email</label><input style={fieldStyle} value={f.contactEmail} onChange={(e) => setF({ ...f, contactEmail: e.target.value })} /></div>
      <div><label style={lbl}>Materiality</label>
        <select style={fieldStyle} value={f.materiality} onChange={(e) => setF({ ...f, materiality: e.target.value as IntakeState["materiality"] })}>{["LOW","MODERATE","HIGH","CRITICAL"].map((o) => <option key={o} value={o}>{o}</option>)}</select></div>
      <div><label style={lbl}>Decision stage</label>
        <select style={fieldStyle} value={f.decisionStage} onChange={(e) => setF({ ...f, decisionStage: e.target.value as IntakeState["decisionStage"] })}>{["EXPLORING","FRAMING","DECIDING","COMMITTED"].map((o) => <option key={o} value={o}>{o}</option>)}</select></div>
      <div><label style={lbl}>Governance sensitivity</label>
        <select style={fieldStyle} value={f.governanceSensitivity} onChange={(e) => setF({ ...f, governanceSensitivity: e.target.value as IntakeState["governanceSensitivity"] })}>{["NONE","SOME","HIGH","REGULATED"].map((o) => <option key={o} value={o}>{o}</option>)}</select></div>
      <div className="sm:col-span-2"><label style={lbl}>Affected stakeholders</label><input style={fieldStyle} value={f.affectedStakeholders} onChange={(e) => setF({ ...f, affectedStakeholders: e.target.value })} /></div>
      <div className="sm:col-span-2"><label style={lbl}>Existing evidence</label><textarea style={fieldStyle} rows={2} value={f.existingEvidence} onChange={(e) => setF({ ...f, existingEvidence: e.target.value })} /></div>
      <div className="sm:col-span-2"><label style={lbl}>Known contradictions / competing obligations</label><textarea style={fieldStyle} rows={2} value={f.knownContradictions} onChange={(e) => setF({ ...f, knownContradictions: e.target.value })} /></div>
      <div className="sm:col-span-2"><label style={lbl}>Desired outcome</label><textarea style={fieldStyle} rows={2} value={f.desiredOutcome} onChange={(e) => setF({ ...f, desiredOutcome: e.target.value })} /></div>
      <label className="text-xs text-white/55" style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" checked={f.authorityToEngage} onChange={(e) => setF({ ...f, authorityToEngage: e.target.checked })} /> I have authority to engage on this decision.</label>
      <label className="text-xs text-white/55" style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" checked={f.willingToParticipateInCheckpoints} onChange={(e) => setF({ ...f, willingToParticipateInCheckpoints: e.target.checked })} /> I am willing to participate in checkpoints.</label>
      <label className="text-xs text-white/55" style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" checked={f.confidentialityRequired} onChange={(e) => setF({ ...f, confidentialityRequired: e.target.checked })} /> This decision requires confidentiality.</label>
      {error && <p className="sm:col-span-2" style={{ ...mono, fontSize: "9px", color: "#FCA5A5", lineHeight: 1.6 }}>{error}</p>}
      <div className="sm:col-span-2">
        <button onClick={submit} disabled={submitting} style={{ ...dsPrimary(), opacity: submitting ? 0.6 : 1, cursor: submitting ? "wait" : "pointer" }}>
          {submitting ? "Submitting…" : "Submit for governed qualification"}
        </button>
      </div>
    </div>
  );
}

export default OperatorPilotPage;
