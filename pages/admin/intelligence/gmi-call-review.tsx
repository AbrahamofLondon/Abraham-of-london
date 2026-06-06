import * as React from "react";
import Head from "next/head";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { ClipboardCheck, ShieldAlert } from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { requireAdminPage } from "@/lib/access/server";
import { GMI_CALL_SCORING_RUBRIC, GMI_METHODOLOGY } from "@/lib/intelligence/gmi-methodology";
import {
  validateGmiEditionInstrument,
  type PublicGmiCallLedgerEntry,
} from "@/lib/intelligence/gmi-instrument";
import { getPersistedPublicGmiCallLedger } from "@/lib/intelligence/gmi-persistent-ledger";
import { getCallsForReport } from "@/lib/intelligence/market-intelligence-call-ledger";

type PageProps = {
  calls: PublicGmiCallLedgerEntry[];
  gate: ReturnType<typeof validateGmiEditionInstrument>;
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const guard = await requireAdminPage<PageProps>(ctx);
  if (!guard.authorized) return guard.redirect as never;

  const q1Calls = getCallsForReport("GMI-Q1-2026");
  const gate = validateGmiEditionInstrument({
    editionId: "GMI-Q2-2026",
    methodologyVersion: GMI_METHODOLOGY.methodologyVersion,
    rubricVersion: GMI_METHODOLOGY.rubricVersion,
    requiredSections: {
      COVER_METADATA: true,
      LEGAL_BOUNDARY: true,
      PRIOR_QUARTER_CALL_REVIEW: false,
      BOARD_SUMMARY: true,
      OPERATOR_DECISION_INTERFACE: true,
      EVIDENCE_POSTURE_INDEX: true,
      CORE_THESIS: true,
      FALSIFICATION_CONDITIONS: true,
      MACRO_SNAPSHOT: true,
      CROSS_MARKET_SIGNALS: true,
      SCENARIO_FRAMEWORK: true,
      SOURCE_APPENDIX: false,
      INSTITUTIONAL_RECORD: true,
    },
    priorCalls: q1Calls,
    sourceAppendixRows: [{ id: "Q2-SOURCE-APPENDIX", status: "PENDING" }],
    hardClaims: [],
    scenarioProbabilities: [],
  });

  return {
    props: {
      calls: await getPersistedPublicGmiCallLedger(),
      gate,
    },
  };
};

export default function GmiCallReviewPage({
  calls,
  gate,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [form, setForm] = React.useState({
    callId: calls[0]?.callId ?? "",
    outcomeStatus: "TOO_EARLY_TO_ASSESS",
    score: "2",
    evidenceSummary: "",
    evidenceSources: "",
    carryForwardJustification: "",
    nextReviewDue: "2026-09-30",
  });
  const [submitState, setSubmitState] = React.useState<string | null>(null);

  async function submitReview(event: React.FormEvent) {
    event.preventDefault();
    setSubmitState("Submitting...");
    const res = await fetch("/api/admin/intelligence/gmi/record-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "CALL_REVIEW",
        reportId: "GMI-Q2-2026",
        callId: form.callId,
        outcomeStatus: form.outcomeStatus,
        score: form.score === "" ? null : Number(form.score),
        outcomeEvidence: form.evidenceSummary || undefined,
        evidenceSources: form.evidenceSources
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
        tooEarlyJustification: form.carryForwardJustification || undefined,
        nextReviewDue: form.nextReviewDue || undefined,
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body?.ok === false) {
      setSubmitState(body?.warning || body?.error || "Call review failed.");
      return;
    }
    setSubmitState("Call review recorded. Refresh to see the updated ledger row.");
  }

  return (
    <AdminLayout title="GMI Call Review">
      <Head>
        <title>GMI Call Review | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="space-y-6">
        <section className="border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-400/80" />
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-400/70">
                  Governed call review workflow
                </p>
              </div>
              <h1 className="mt-3 font-serif text-3xl text-white">GMI Call Review</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
                Admin surface for reviewing registered calls against the locked rubric. Use the record-event API for mutation until persistent call-editing controls are promoted.
              </p>
            </div>
            <div className="grid gap-2 text-right">
              <AdminStatusBadge label={GMI_METHODOLOGY.methodologyVersion} tone="info" size="md" />
              <AdminStatusBadge label={GMI_METHODOLOGY.rubricVersion} tone="info" size="md" />
              <AdminStatusBadge label={gate.releaseReady ? "Release clear" : "Release blocked"} tone={gate.releaseReady ? "success" : "danger"} size="md" />
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <AdminMetricCard label="Registered calls" value={calls.length} variant="inner" />
          <AdminMetricCard label="Gate blockers" value={gate.blockers.length} tone={gate.blockers.length ? "danger" : "success"} variant="inner" />
          <AdminMetricCard label="Warnings" value={gate.warnings.length} tone={gate.warnings.length ? "warning" : "success"} variant="inner" />
        </section>

        <section className="border border-white/10 bg-zinc-950/70 p-6">
          <h2 className="font-serif text-xl text-white">Record Call Review</h2>
          <p className="mt-1 max-w-3xl text-sm text-white/45">
            Writes to the persistent call ledger, creates status history, and records the GMI audit event in one transaction.
          </p>
          <form onSubmit={submitReview} className="mt-5 grid gap-4">
            <div className="grid gap-4 md:grid-cols-4">
              <label className="block">
                <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/35">Call</span>
                <select
                  value={form.callId}
                  onChange={(e) => setForm((current) => ({ ...current, callId: e.target.value }))}
                  className="mt-2 w-full border border-white/10 bg-black px-3 py-2 text-sm text-white/75"
                >
                  {calls.map((call) => (
                    <option key={call.callId} value={call.callId}>{call.callId}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/35">Outcome</span>
                <select
                  value={form.outcomeStatus}
                  onChange={(e) => setForm((current) => ({ ...current, outcomeStatus: e.target.value }))}
                  className="mt-2 w-full border border-white/10 bg-black px-3 py-2 text-sm text-white/75"
                >
                  {[
                    "CONFIRMED_STRONGLY",
                    "DIRECTIONALLY_CONFIRMED",
                    "PARTIALLY_CONFIRMED",
                    "TOO_EARLY_TO_ASSESS",
                    "WEAKLY_SUPPORTED",
                    "DISCONFIRMED",
                  ].map((status) => (
                    <option key={status} value={status}>{status.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/35">Score</span>
                <select
                  value={form.score}
                  onChange={(e) => setForm((current) => ({ ...current, score: e.target.value }))}
                  className="mt-2 w-full border border-white/10 bg-black px-3 py-2 text-sm text-white/75"
                >
                  <option value="">No score</option>
                  {[5, 4, 3, 2, 1, 0].map((score) => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/35">Next review due</span>
                <input
                  type="date"
                  value={form.nextReviewDue}
                  onChange={(e) => setForm((current) => ({ ...current, nextReviewDue: e.target.value }))}
                  className="mt-2 w-full border border-white/10 bg-black px-3 py-2 text-sm text-white/75"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/35">Evidence summary</span>
              <textarea
                value={form.evidenceSummary}
                onChange={(e) => setForm((current) => ({ ...current, evidenceSummary: e.target.value }))}
                className="mt-2 w-full border border-white/10 bg-black px-3 py-2 text-sm text-white/75"
                rows={3}
              />
            </label>
            <label className="block">
              <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/35">Evidence source rows, one per line</span>
              <textarea
                value={form.evidenceSources}
                onChange={(e) => setForm((current) => ({ ...current, evidenceSources: e.target.value }))}
                className="mt-2 w-full border border-white/10 bg-black px-3 py-2 text-sm text-white/75"
                rows={3}
              />
            </label>
            <label className="block">
              <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/35">Carry-forward justification</span>
              <textarea
                value={form.carryForwardJustification}
                onChange={(e) => setForm((current) => ({ ...current, carryForwardJustification: e.target.value }))}
                className="mt-2 w-full border border-white/10 bg-black px-3 py-2 text-sm text-white/75"
                rows={2}
              />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" className="border border-amber-500/35 bg-amber-500/10 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-amber-200">
                Record review
              </button>
              {submitState ? <p className="text-xs text-white/45">{submitState}</p> : null}
            </div>
          </form>
        </section>

        <section className="border border-white/10 bg-zinc-950/70 p-6">
          <div className="mb-5 flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-white/35" />
            <h2 className="font-serif text-xl text-white">Locked rubric</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {GMI_CALL_SCORING_RUBRIC.map((item) => (
              <div key={item.score} className="border border-white/8 bg-black/25 p-4">
                <p className="text-2xl font-light text-amber-200/80">{item.score}</p>
                <p className="mt-1 text-sm text-white/70">{item.label}</p>
                <p className="mt-2 text-xs leading-5 text-white/38">{item.definition}</p>
              </div>
            ))}
          </div>
        </section>

        {gate.blockers.length > 0 ? (
          <section className="border border-rose-500/15 bg-rose-500/5 p-6">
            <h2 className="font-serif text-xl text-white">Release blockers</h2>
            <div className="mt-4 space-y-2">
              {gate.blockers.map((blocker) => (
                <p key={blocker} className="border border-rose-500/15 bg-black/20 p-3 text-sm text-rose-100/70">{blocker}</p>
              ))}
            </div>
          </section>
        ) : null}

        <section className="border border-white/10 bg-zinc-950/70 p-6">
          <h2 className="font-serif text-xl text-white">Call ledger review queue</h2>
          <div className="mt-5 space-y-3">
            {calls.map((call) => (
              <article key={call.callId} className="border border-white/8 bg-black/25 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-amber-300/65">{call.callId}</p>
                    <p className="mt-2 max-w-4xl text-sm leading-6 text-white/60">{call.thesis}</p>
                  </div>
                  <AdminStatusBadge
                    label={call.currentScore === null ? call.currentStatus.replace(/_/g, " ") : `${call.currentScore}/5 ${call.scoreLabel}`}
                    tone={call.currentScore === 0 ? "danger" : call.currentScore ? "success" : "warning"}
                  />
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-4">
                  <AdminMetricCard label="Report" value={call.editionId} variant="inner" />
                  <AdminMetricCard label="Confidence" value={call.confidenceBand} variant="inner" />
                  <AdminMetricCard label="Review window" value={call.reviewWindow} variant="inner" />
                  <AdminMetricCard label="Evidence rows" value={call.evidenceSources.length} variant="inner" />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="border border-white/10 bg-black/30 p-4">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">
            Mutation endpoint: POST /api/admin/intelligence/gmi/record-event with action CALL_REVIEW. Scores require outcome evidence or a score-2 carry-forward justification.
          </p>
        </section>
      </div>
    </AdminLayout>
  );
}
