import * as React from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";

import AdminLayout from "@/components/admin/AdminLayout";
import { requireAdminPage } from "@/lib/access/server";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const guard = await requireAdminPage(ctx);
  if (!guard.authorized) return guard.redirect;
  return { props: {} };
};

function Field({ label, help, required, children }: { label: string; help?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-mono uppercase tracking-[0.24em] text-white/50">
        {label}{required && <span className="ml-1 text-amber-500/60">*</span>}
      </label>
      {help && <p className="text-[11px] leading-relaxed text-white/30">{help}</p>}
      {children}
    </div>
  );
}

const inputClass = "w-full border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-amber-500/30 focus:outline-none";
const textareaClass = `${inputClass} min-h-[80px]`;

export default function CounselReviewPage() {
  const [assignment, setAssignment] = React.useState({
    caseId: "",
    cycleId: "",
    triggerReason: "",
    assignedTo: "",
    requestedReviewQuestion: "",
  });
  const [submission, setSubmission] = React.useState({
    workflowId: "",
    caseId: "",
    cycleId: "",
    triggerReason: "",
    evidenceBasis: "",
    recommendation: "",
    contradictionAssessment: "",
    riskIfIgnored: "",
    requiredClientAction: "",
    outcomeFollowUpDate: "",
  });
  const [escalateRetainer, setEscalateRetainer] = React.useState(false);
  const [escalateBoardroom, setEscalateBoardroom] = React.useState(false);
  const [agreesWithSystem, setAgreesWithSystem] = React.useState(true);
  const [response, setResponse] = React.useState<string>("");

  async function post(url: string, body: unknown) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setResponse(JSON.stringify(data, null, 2));
  }

  const canAssign = assignment.caseId.trim() && assignment.triggerReason.trim() && assignment.assignedTo.trim();
  const canSubmit = submission.workflowId.trim() && submission.caseId.trim() && submission.recommendation.trim() && submission.evidenceBasis.trim();

  return (
    <AdminLayout title="Counsel Review">
      <Head>
        <title>Governed Counsel Escalation | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div className="space-y-6 text-white">
        <section className="border border-white/10 bg-white/5 p-6">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-500/70">Governed counsel escalation</p>
          <h1 className="mt-3 font-serif text-3xl">Counsel Review</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/55">
            Counsel is triggered when automated governance is insufficient. This surface captures why counsel was required,
            what evidence was reviewed, what counsel recommends, and what action must follow. It is not an advice inbox.
          </p>
        </section>

        {/* ═══ ASSIGNMENT ═══ */}
        <section className="border border-white/10 bg-zinc-950/70 p-6">
          <h2 className="text-[11px] font-mono uppercase tracking-[0.24em] text-amber-500/50">Step 1 — Assign counsel review</h2>
          <p className="mt-2 text-[12px] text-white/35">Identify the case, state why automated governance is insufficient, and assign counsel.</p>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <Field label="Case ID" required help="The case requiring human review.">
              <input value={assignment.caseId} onChange={(e) => setAssignment((c) => ({ ...c, caseId: e.target.value }))} className={inputClass} placeholder="case_xxxxxxxx" />
            </Field>
            <Field label="Oversight cycle ID" help="If this escalation is part of a retainer oversight cycle.">
              <input value={assignment.cycleId} onChange={(e) => setAssignment((c) => ({ ...c, cycleId: e.target.value }))} className={inputClass} placeholder="Optional — cycle_xxxxxxxx" />
            </Field>
            <Field label="Why is counsel required?" required help="What governance question cannot be resolved by the system alone?">
              <textarea value={assignment.triggerReason} onChange={(e) => setAssignment((c) => ({ ...c, triggerReason: e.target.value }))} className={textareaClass} placeholder="e.g. Contested authority between sponsor and board. System cannot determine whose mandate takes precedence." rows={3} />
            </Field>
            <Field label="Assigned to" required help="Counsel email address.">
              <input value={assignment.assignedTo} onChange={(e) => setAssignment((c) => ({ ...c, assignedTo: e.target.value }))} className={inputClass} placeholder="counsel@firm.com" />
            </Field>
            <Field label="Specific review question" help="What must counsel answer? Be precise.">
              <textarea value={assignment.requestedReviewQuestion} onChange={(e) => setAssignment((c) => ({ ...c, requestedReviewQuestion: e.target.value }))} className={textareaClass} placeholder="e.g. Is the sponsor's authority sufficient to proceed, or does the board need to approve first?" rows={3} />
            </Field>
          </div>
          <button
            onClick={() => void post("/api/internal/oversight/counsel-assignment", assignment)}
            disabled={!canAssign}
            className="mt-5 border border-amber-500/30 bg-amber-500/10 px-5 py-2.5 text-sm text-amber-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Assign counsel review
          </button>
        </section>

        {/* ═══ REVIEW SUBMISSION ═══ */}
        <section className="border border-white/10 bg-zinc-950/70 p-6">
          <h2 className="text-[11px] font-mono uppercase tracking-[0.24em] text-amber-500/50">Step 2 — Submit counsel review</h2>
          <p className="mt-2 text-[12px] text-white/35">Record what counsel found, what they recommend, and what must happen next.</p>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <Field label="Workflow ID" required help="The counsel workflow being completed.">
              <input value={submission.workflowId} onChange={(e) => setSubmission((c) => ({ ...c, workflowId: e.target.value }))} className={inputClass} placeholder="wf_xxxxxxxx" />
            </Field>
            <Field label="Case ID" required>
              <input value={submission.caseId} onChange={(e) => setSubmission((c) => ({ ...c, caseId: e.target.value }))} className={inputClass} placeholder="case_xxxxxxxx" />
            </Field>
          </div>

          <div className="mt-5 space-y-4">
            <Field label="Trigger reason" help="Why was this escalated to counsel?">
              <input value={submission.triggerReason} onChange={(e) => setSubmission((c) => ({ ...c, triggerReason: e.target.value }))} className={inputClass} placeholder="Original escalation reason" />
            </Field>
            <Field label="Evidence reviewed" required help="What evidence did counsel review? One item per line.">
              <textarea value={submission.evidenceBasis} onChange={(e) => setSubmission((c) => ({ ...c, evidenceBasis: e.target.value }))} className={textareaClass} rows={4} placeholder={"e.g.\nConstitutional assessment showing authority fragmentation\nTeam divergence data showing trust collapse in execution layer\nPrior correction attempt that failed to hold"} />
            </Field>
            <Field label="Recommendation" required help="What does counsel recommend? Be specific about the action, not just the opinion.">
              <textarea value={submission.recommendation} onChange={(e) => setSubmission((c) => ({ ...c, recommendation: e.target.value }))} className={textareaClass} rows={4} placeholder="e.g. Board must ratify the sponsor's mandate before intervention proceeds. Without ratification, the execution team will not comply." />
            </Field>
            <Field label="Contradiction assessment" help="Did counsel find contradictions between stated position and evidence?">
              <textarea value={submission.contradictionAssessment} onChange={(e) => setSubmission((c) => ({ ...c, contradictionAssessment: e.target.value }))} className={textareaClass} rows={3} placeholder="e.g. Sponsor claims full authority, but two prior decisions were reversed by the board without consultation." />
            </Field>
            <Field label="Risk if recommendation is ignored" help="What happens if counsel's recommendation is not followed?">
              <textarea value={submission.riskIfIgnored} onChange={(e) => setSubmission((c) => ({ ...c, riskIfIgnored: e.target.value }))} className={textareaClass} rows={3} placeholder="e.g. Intervention will be undermined by the same authority gap that caused the original escalation." />
            </Field>
            <Field label="Required client action" help="What must the client do as a result of this review?">
              <textarea value={submission.requiredClientAction} onChange={(e) => setSubmission((c) => ({ ...c, requiredClientAction: e.target.value }))} className={textareaClass} rows={2} placeholder="e.g. Secure board ratification in writing before next oversight cycle." />
            </Field>
            <Field label="Outcome follow-up date" help="When should the outcome of this recommendation be reviewed?">
              <input type="date" value={submission.outcomeFollowUpDate} onChange={(e) => setSubmission((c) => ({ ...c, outcomeFollowUpDate: e.target.value }))} className={inputClass} />
            </Field>
          </div>

          <div className="mt-5 space-y-3 border-t border-white/5 pt-5">
            <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/40">Escalation and governance flags</p>
            <label className="flex items-center gap-3 text-sm text-white/60 cursor-pointer">
              <input type="checkbox" checked={agreesWithSystem} onChange={(e) => setAgreesWithSystem(e.target.checked)} className="accent-amber-500" />
              Counsel agrees with system governance boundary
            </label>
            <label className="flex items-center gap-3 text-sm text-white/60 cursor-pointer">
              <input type="checkbox" checked={escalateRetainer} onChange={(e) => setEscalateRetainer(e.target.checked)} className="accent-amber-500" />
              Escalate to retainer oversight
            </label>
            <label className="flex items-center gap-3 text-sm text-white/60 cursor-pointer">
              <input type="checkbox" checked={escalateBoardroom} onChange={(e) => setEscalateBoardroom(e.target.checked)} className="accent-amber-500" />
              Escalate to boardroom path
            </label>
          </div>

          <button
            onClick={() => void post("/api/internal/oversight/counsel-submit-review", {
              ...submission,
              status: "COUNSEL_RESPONSE_RECORDED",
              reviewStatus: "OUTCOME_PENDING",
              evidenceBasis: submission.evidenceBasis.split("\n").map((item) => item.trim()).filter(Boolean),
              agreesWithSystemRestriction: agreesWithSystem,
              escalateToRetainerOversight: escalateRetainer,
              escalateToBoardroom: escalateBoardroom,
            })}
            disabled={!canSubmit}
            className="mt-5 border border-amber-500/30 bg-amber-500/10 px-5 py-2.5 text-sm text-amber-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Submit counsel review
          </button>
        </section>

        {/* ═══ RESPONSE ═══ */}
        <section className="border border-white/10 bg-black/30 p-5">
          <h2 className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/40">System response</h2>
          <pre className="mt-4 overflow-auto whitespace-pre-wrap text-xs text-white/75">{response || "No request made yet."}</pre>
        </section>
      </div>
    </AdminLayout>
  );
}
