import * as React from "react";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";

import AdminLayout from "@/components/admin/AdminLayout";
import { requireAdminPage } from "@/lib/access/server";
import type { OversightReviewDecision } from "@/lib/product/oversight-review-decision-contract";
import type { OversightCycleAudience } from "@/lib/product/oversight-cycle-ledger-contract";
import type { OversightDeliveryAction } from "@/lib/product/oversight-delivery-contract";

type SafeOutput = {
  brief: any;
  suppressions: Array<{ section: string; reason: string; explanation: string }>;
  warnings: string[];
} | null;

type PreviewResponse = {
  ok: boolean;
  internalBrief: any;
  clientSafeBrief: any;
  audienceOutputs: Record<string, SafeOutput>;
  efficacy: any;
  cycle: any;
  suppressions: Array<{ section: string; reason: string; explanation: string }>;
  ledgerEvents: Array<{ id: string; eventType: string; timestamp: string; reason?: string }>;
  cycleComparison: { available: boolean; deltas: Array<{ dimension: string; direction: string; explanation: string }>; warnings: string[] };
  recommendedDecision: {
    recommendedDecision: OversightReviewDecision;
    reasons: string[];
    deliveryAllowed: boolean;
    operatorNoteRequired: boolean;
    explanation: string;
  };
  nextRequiredOperatorDecision: OversightReviewDecision;
  operatorDecisionRecord?: any;
  deliveryIntent: { state: string; reason: string; nextStep: string; deliveryAllowed: boolean };
  nextCycleIntent?: { cadence: string; nextCycleRecommendedDate: string; reason: string };
  archivedCycle?: any;
  counselWorkflows: Array<any>;
  warnings: string[];
};

function safeArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

const DECISION_OPTIONS: Array<{ value: OversightReviewDecision; label: string }> = [
  { value: "APPROVE_FOR_CLIENT", label: "Approve For Client" },
  { value: "REVISE_BEFORE_DELIVERY", label: "Revise Before Delivery" },
  { value: "WITHHOLD_FROM_CLIENT", label: "Withhold From Client" },
  { value: "ESCALATE_TO_COUNSEL", label: "Escalate To Counsel" },
  { value: "ESCALATE_TO_BOARDROOM", label: "Escalate To Boardroom" },
  { value: "WAIT_FOR_MORE_EVIDENCE", label: "Wait For More Evidence" },
];

const DELIVERY_ACTIONS: Array<{ value: OversightDeliveryAction; label: string }> = [
  { value: "APPROVE_CLIENT_SAFE_BRIEF", label: "Approve Client-Safe Brief" },
  { value: "REQUEST_REVISION", label: "Request Revision" },
  { value: "WITHHOLD_BRIEF", label: "Withhold Brief" },
  { value: "MARK_CLIENT_VIEW_READY", label: "Mark Client View Ready" },
  { value: "MARK_DELIVERED", label: "Mark Delivered" },
  { value: "RECORD_DELIVERY_FAILURE", label: "Record Delivery Failure" },
];

const AUDIENCES: OversightCycleAudience[] = ["CLIENT_SPONSOR", "BOARD_LEVEL", "RESPONDENT_SAFE"];

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-white/10 bg-zinc-950/70 p-5">
      <h2 className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-500/70">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function DataLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/5 py-2 text-sm">
      <span className="text-white/45">{label}</span>
      <span className="text-right text-white">{value}</span>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const guard = await requireAdminPage(ctx);
  if (!guard.authorized) return guard.redirect;
  return { props: {} };
};

export default function OversightReviewPage(
  _props: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  const [accountId, setAccountId] = React.useState("");
  const [organisationId, setOrganisationId] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [persist, setPersist] = React.useState(true);
  const [firstCycleException, setFirstCycleException] = React.useState(false);
  const [operatorDecision, setOperatorDecision] = React.useState<OversightReviewDecision | "">("");
  const [operatorNote, setOperatorNote] = React.useState("");
  const [selectedAudience, setSelectedAudience] = React.useState<OversightCycleAudience>("CLIENT_SPONSOR");
  const [deliveryAction, setDeliveryAction] = React.useState<OversightDeliveryAction | "">("");
  const [counselCaseId, setCounselCaseId] = React.useState("");
  const [counselReason, setCounselReason] = React.useState("");
  const [counselQuestion, setCounselQuestion] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<PreviewResponse | null>(null);

  const refreshPreview = React.useCallback(async (withDecision: boolean) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/internal/oversight/review-cycle-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: accountId || undefined,
          organisationId: organisationId || undefined,
          email: email || undefined,
          persist,
          firstCycleException,
          operatorDecision: withDecision ? operatorDecision || undefined : undefined,
          operatorNote: withDecision ? operatorNote || undefined : undefined,
        }),
      });

      const data = await response.json() as PreviewResponse & { error?: string; reason?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.reason || data.error || "Oversight review preview failed.");
      }
      setPreview(data);
      if (data.internalBrief?.activeCases?.[0]?.caseId && !counselCaseId) {
        setCounselCaseId(data.internalBrief.activeCases[0].caseId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Oversight review preview failed.");
    } finally {
      setLoading(false);
    }
  }, [accountId, counselCaseId, email, firstCycleException, operatorDecision, operatorNote, organisationId, persist]);

  const runDeliveryAction = React.useCallback(async () => {
    if (!preview?.cycle?.cycleId || !deliveryAction) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/internal/oversight/delivery-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycleId: preview.cycle.cycleId,
          action: deliveryAction,
          operatorNote: operatorNote || undefined,
        }),
      });
      const data = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Delivery action failed.");
      }
      await refreshPreview(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delivery action failed.");
    } finally {
      setLoading(false);
    }
  }, [deliveryAction, operatorNote, preview?.cycle?.cycleId, refreshPreview]);

  const createCounselWorkflow = React.useCallback(async () => {
    if (!preview?.cycle?.cycleId || !counselCaseId || !counselReason) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/internal/oversight/counsel-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycleId: preview.cycle.cycleId,
          caseId: counselCaseId,
          triggerReason: counselReason,
          requestedReviewQuestion: counselQuestion || undefined,
        }),
      });
      const data = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Counsel workflow action failed.");
      }
      setCounselReason("");
      setCounselQuestion("");
      await refreshPreview(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Counsel workflow action failed.");
    } finally {
      setLoading(false);
    }
  }, [counselCaseId, counselQuestion, counselReason, preview?.cycle?.cycleId, refreshPreview]);

  const recommendation = preview?.recommendedDecision;
  const override = Boolean(
    operatorDecision
    && recommendation
    && operatorDecision !== recommendation.recommendedDecision,
  );
  const selectedSafeOutput = preview?.audienceOutputs?.[selectedAudience] ?? null;

  return (
    <AdminLayout title="Oversight Review">
      <Head>
        <title>Oversight Review | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="space-y-6">
        <section className="border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-500/60">Oversight Review Bench</p>
          <h1 className="mt-3 font-serif text-3xl text-white">Governed brief review</h1>
          <p className="mt-2 max-w-3xl text-sm text-white/55">
            Review, suppress, archive, compare, hand off to counsel, and prepare controlled client delivery without pretending automation exists where it does not.
          </p>
        </section>

        <Panel title="Review Scope">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block text-sm text-white/70">
              <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Account / Contract</span>
              <input value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full border border-white/10 bg-black/40 px-3 py-2 text-white" placeholder="Retainer account id" />
            </label>
            <label className="block text-sm text-white/70">
              <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Organisation</span>
              <input value={organisationId} onChange={(e) => setOrganisationId(e.target.value)} className="w-full border border-white/10 bg-black/40 px-3 py-2 text-white" placeholder="Organisation id" />
            </label>
            <label className="block text-sm text-white/70">
              <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Subject Email</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-white/10 bg-black/40 px-3 py-2 text-white" placeholder="client@example.com" />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/70">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={persist} onChange={(e) => setPersist(e.target.checked)} />
              Persist cycle archive
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={firstCycleException} onChange={(e) => setFirstCycleException(e.target.checked)} />
              First-cycle exception
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={() => void refreshPreview(false)} disabled={loading} className="border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200 disabled:opacity-50">
              {loading ? "Loading..." : "Generate Review Cycle"}
            </button>
          </div>

          {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
        </Panel>

        {preview && (
          <>
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Panel title="Required Operator Action">
                <DataLine label="Cycle" value={preview.cycle.cycleId} />
                <DataLine label="Period" value={`${new Date(preview.cycle.periodStart).toLocaleDateString("en-GB")} to ${new Date(preview.cycle.periodEnd).toLocaleDateString("en-GB")}`} />
                <DataLine label="Efficacy Grade" value={`${preview.efficacy?.grade ?? "UNKNOWN"} (${preview.efficacy?.totalScore ?? 0})`} />
                <DataLine label="Recommended Decision" value={recommendation?.recommendedDecision ?? "WAIT_FOR_MORE_EVIDENCE"} />
                <DataLine label="Delivery Readiness" value={preview.deliveryIntent.state} />
                <DataLine label="Next Required Decision" value={preview.nextRequiredOperatorDecision} />
                <DataLine label="Cadence Status" value={preview.internalBrief?.cadence?.status ?? "UNAVAILABLE"} />
                <p className="mt-4 text-sm text-white/60">{recommendation?.explanation}</p>

                <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr]">
                  <label className="block text-sm text-white/70">
                    <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Review Decision</span>
                    <select value={operatorDecision} onChange={(e) => setOperatorDecision(e.target.value as OversightReviewDecision | "")} className="w-full border border-white/10 bg-black/40 px-3 py-2 text-white">
                      <option value="">Choose decision</option>
                      {DECISION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm text-white/70">
                    <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Audience Selector</span>
                    <select value={selectedAudience} onChange={(e) => setSelectedAudience(e.target.value as OversightCycleAudience)} className="w-full border border-white/10 bg-black/40 px-3 py-2 text-white">
                      {AUDIENCES.map((audience) => (
                        <option key={audience} value={audience}>{audience}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="mt-4 block text-sm text-white/70">
                  <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Operator Note</span>
                  <textarea value={operatorNote} onChange={(e) => setOperatorNote(e.target.value)} rows={4} className="w-full border border-white/10 bg-black/40 px-3 py-2 text-white" placeholder="Required for overrides, escalation, withhold, and first-cycle exceptions." />
                </label>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button onClick={() => void refreshPreview(true)} disabled={loading || !operatorDecision || (override && !operatorNote.trim())} className="border border-white/15 bg-white/5 px-4 py-2 text-sm text-white disabled:opacity-50">
                    Record Review Decision
                  </button>
                </div>

                {override && !operatorNote.trim() && (
                  <p className="mt-3 text-sm text-amber-300">Operator note is required when overriding the recommended decision.</p>
                )}
              </Panel>

              <Panel title="Delivery State">
                <DataLine label="State" value={preview.deliveryIntent.state} />
                <DataLine label="Allowed" value={preview.deliveryIntent.deliveryAllowed ? "Yes" : "No"} />
                <DataLine label="Client URL" value={preview.archivedCycle?.record?.deliveryUrl ?? `/oversight/brief/${preview.cycle.cycleId}`} />
                <p className="mt-4 text-sm text-white/60">{preview.deliveryIntent.reason}</p>
                <p className="mt-3 text-sm text-white/45">{preview.deliveryIntent.nextStep}</p>

                <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto]">
                  <select value={deliveryAction} onChange={(e) => setDeliveryAction(e.target.value as OversightDeliveryAction | "")} className="w-full border border-white/10 bg-black/40 px-3 py-2 text-white">
                    <option value="">Choose delivery action</option>
                    {DELIVERY_ACTIONS.map((action) => (
                      <option key={action.value} value={action.value}>{action.label}</option>
                    ))}
                  </select>
                  <button onClick={() => void runDeliveryAction()} disabled={loading || !deliveryAction} className="border border-white/15 bg-white/5 px-4 py-2 text-sm text-white disabled:opacity-50">
                    Apply
                  </button>
                </div>

                {preview.nextCycleIntent && (
                  <div className="mt-6 border-t border-white/10 pt-4">
                    <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Next Cycle Intent</p>
                    <p className="mt-2 text-sm text-white">Cadence: {preview.nextCycleIntent.cadence}</p>
                    <p className="mt-1 text-sm text-white/60">Recommended date: {new Date(preview.nextCycleIntent.nextCycleRecommendedDate).toLocaleDateString("en-GB")}</p>
                    <p className="mt-2 text-sm text-white/45">{preview.nextCycleIntent.reason}</p>
                  </div>
                )}
              </Panel>
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <Panel title="Account Context">
                <DataLine label="Account" value={preview.internalBrief?.accountId ?? "unknown"} />
                <DataLine label="Organisation" value={preview.cycle.organisationId ?? "individual"} />
                <DataLine label="Audience" value={selectedAudience} />
                <DataLine label="Cadence Health" value={preview.internalBrief?.cadence?.health ?? "UNAVAILABLE"} />
                <p className="mt-4 text-sm text-white/55">{preview.internalBrief?.cadence?.explanation ?? "Cadence has not yet been derived for this scope."}</p>
              </Panel>

              <Panel title="Counsel History">
                {preview.internalBrief?.counselHistory ? (
                  <>
                    <DataLine label="Events" value={preview.internalBrief.counselHistory.totalEvents} />
                    <DataLine label="Open" value={preview.internalBrief.counselHistory.openCount} />
                    <p className="mt-4 text-sm text-white/60">{preview.internalBrief.counselHistory.summary}</p>
                    <div className="mt-4 space-y-3">
                      {safeArray(preview.internalBrief.counselHistory.entries).slice(0, 4).map((item: any) => (
                        <div key={item.id} className="border border-white/10 bg-black/20 p-3">
                          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/35">{item.status}</p>
                          <p className="mt-2 text-sm text-white/75">{item.triggerReason}</p>
                          {item.resultingAction ? <p className="mt-2 text-sm text-white/45">{item.resultingAction}</p> : null}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-white/45">No governed counsel history is available for this cycle scope.</p>
                )}
              </Panel>

              <Panel title="Boardroom Archive">
                {preview.internalBrief?.boardroomArchive ? (
                  <>
                    <DataLine label="Total Dossiers" value={preview.internalBrief.boardroomArchive.totalDossiers} />
                    <DataLine label="Prior Dossiers" value={preview.internalBrief.boardroomArchive.previousDossierCount} />
                    <DataLine label="Repeated Exposure" value={preview.internalBrief.boardroomArchive.repeatedExposureCount} />
                    <DataLine label="Unresolved" value={preview.internalBrief.boardroomArchive.unresolvedBoardLevelIssues} />
                    <p className="mt-4 text-sm text-white/60">{preview.internalBrief.boardroomArchive.summary}</p>
                  </>
                ) : (
                  <p className="text-sm text-white/45">No boardroom archive memory is available for this scope.</p>
                )}
              </Panel>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Organisation Divergence">
                {preview.internalBrief?.organisationDivergence ? (
                  <>
                    <DataLine label="Summaries" value={preview.internalBrief.organisationDivergence.count} />
                    <DataLine label="Suppressed Detail" value={preview.internalBrief.organisationDivergence.suppressedDetailCount} />
                    <p className="mt-4 text-sm text-white/60">{preview.internalBrief.organisationDivergence.summary}</p>
                    <div className="mt-4 space-y-3">
                      {safeArray(preview.internalBrief.organisationDivergence.items).map((item: any) => (
                        <div key={`${item.type}-${item.affectedDomain}`} className="border border-white/10 bg-black/20 p-3">
                          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/35">{item.type} · {item.confidence}</p>
                          <p className="mt-2 text-sm text-white/75">{item.sponsorSafeSummary}</p>
                          <p className="mt-2 text-sm text-white/45">{item.recommendedNextAction}</p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-white/45">No sponsor-safe organisation divergence summary is currently available.</p>
                )}
              </Panel>

              <Panel title="Indispensability Summary">
                {preview.internalBrief?.indispensability ? (
                  <>
                    <DataLine label="Dependency Level" value={preview.internalBrief.indispensability.currentDependencyLevel} />
                    <p className="mt-4 text-sm text-white/75">{preview.internalBrief.indispensability.headline}</p>
                    <div className="mt-4">
                      <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/35">Preserved Visibility</p>
                      <ul className="mt-2 space-y-2 text-sm text-white/60">
                        {(preview.internalBrief.indispensability.preservedVisibility as string[]).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-4">
                      <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/35">Would Be Lost</p>
                      <ul className="mt-2 space-y-2 text-sm text-white/60">
                        {(preview.internalBrief.indispensability.wouldLose as string[]).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-white/45">Indispensability has not yet been derived for this scope.</p>
                )}
              </Panel>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Suppression Warnings">
                {preview.suppressions.length === 0 ? (
                  <p className="text-sm text-white/45">No suppressions were required for the sponsor-safe output.</p>
                ) : (
                  <div className="space-y-4">
                    {preview.suppressions.map((item) => (
                      <div key={`${item.section}-${item.reason}`} className="border border-white/10 bg-black/30 p-4">
                        <p className="text-sm text-white">{item.section}</p>
                        <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.2em] text-amber-300/70">{item.reason}</p>
                        <p className="mt-2 text-sm text-white/55">{item.explanation}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>

              <Panel title="Audit Trail">
                {preview.ledgerEvents.length === 0 ? (
                  <p className="text-sm text-white/45">No persisted ledger events exist for this cycle yet.</p>
                ) : (
                  <div className="space-y-3">
                    {preview.ledgerEvents.map((event) => (
                      <div key={event.id} className="border-b border-white/5 pb-3">
                        <p className="text-sm text-white">{event.eventType}</p>
                        <p className="mt-1 text-sm text-white/45">{new Date(event.timestamp).toLocaleString("en-GB")}</p>
                        {event.reason && <p className="mt-1 text-sm text-white/55">{event.reason}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Internal Brief Preview">
                <p className="text-sm text-white/70">{preview.internalBrief?.executiveSummary || "No internal brief available."}</p>
                <div className="mt-4">
                  <DataLine label="Required Actions" value={preview.internalBrief?.requiredActions?.length ?? 0} />
                  <DataLine label="Cost Clock" value={preview.internalBrief?.costOfInaction ? `£${preview.internalBrief.costOfInaction.totalEstimated}` : "Unavailable"} />
                  <DataLine label="Recurrence" value={preview.internalBrief?.patternRecurrence?.status ?? "Not present"} />
                  <DataLine label="Boardroom Trigger" value={(preview.internalBrief?.boardroom?.dossiersAvailable ?? 0) > 0 ? "Yes" : "No"} />
                  <DataLine label="Counsel Trigger" value={(preview.internalBrief?.counsel?.requiredNow ?? 0) > 0 ? "Yes" : "No"} />
                </div>
              </Panel>

              <Panel title="Client-Safe Output">
                <p className="text-sm text-white/70">{selectedSafeOutput?.brief?.executiveSummary || "No audience-safe output available."}</p>
                <div className="mt-4">
                  <DataLine label="Audience" value={selectedAudience} />
                  <DataLine label="Cases Visible" value={selectedSafeOutput?.brief?.activeCases?.length ?? 0} />
                  <DataLine label="Structured Actions" value={selectedSafeOutput?.brief?.structuredActions?.length ?? 0} />
                  <DataLine label="Decision Credit" value={selectedSafeOutput?.brief?.decisionCredit?.score ?? "Suppressed"} />
                </div>
              </Panel>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Cycle Comparison">
                {preview.cycleComparison.available ? (
                  <div className="space-y-3">
                    {preview.cycleComparison.deltas.map((delta) => (
                      <div key={`${delta.dimension}-${delta.explanation}`} className="border-b border-white/5 pb-3">
                        <p className="text-sm text-white">{delta.dimension} · {delta.direction}</p>
                        <p className="mt-1 text-sm text-white/55">{delta.explanation}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white/45">No prior cycle is available for continuity comparison.</p>
                )}
              </Panel>

              <Panel title="Warnings">
                {preview.warnings.length === 0 ? (
                  <p className="text-sm text-white/45">No material warnings were emitted for this cycle.</p>
                ) : (
                  <ul className="space-y-3 text-sm text-white/60">
                    {preview.warnings.map((warning) => (
                      <li key={warning} className="border-b border-white/5 pb-3">{warning}</li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Value Protected / Cancellation Loss">
                <div className="space-y-4">
                  {preview.internalBrief?.valueProtected?.summary && (
                    <div>
                      <p className="text-sm text-white">{preview.internalBrief.valueProtected.summary}</p>
                    </div>
                  )}
                  {preview.internalBrief?.cancellationLoss?.summary && (
                    <div>
                      <p className="text-sm text-white/70">{preview.internalBrief.cancellationLoss.summary}</p>
                    </div>
                  )}
                </div>
              </Panel>

              <Panel title="Counsel Handoff">
                <div className="space-y-4">
                  <label className="block text-sm text-white/70">
                    <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Case Id</span>
                    <input value={counselCaseId} onChange={(e) => setCounselCaseId(e.target.value)} className="w-full border border-white/10 bg-black/40 px-3 py-2 text-white" placeholder="Case id" />
                  </label>
                  <label className="block text-sm text-white/70">
                    <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Counsel Reason</span>
                    <input value={counselReason} onChange={(e) => setCounselReason(e.target.value)} className="w-full border border-white/10 bg-black/40 px-3 py-2 text-white" placeholder="Why counsel is required" />
                  </label>
                  <label className="block text-sm text-white/70">
                    <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Review Question</span>
                    <textarea value={counselQuestion} onChange={(e) => setCounselQuestion(e.target.value)} rows={3} className="w-full border border-white/10 bg-black/40 px-3 py-2 text-white" placeholder="What must counsel review?" />
                  </label>
                  <button onClick={() => void createCounselWorkflow()} disabled={loading || !counselCaseId || !counselReason} className="border border-white/15 bg-white/5 px-4 py-2 text-sm text-white disabled:opacity-50">
                    Record Counsel Handoff
                  </button>
                  {preview.counselWorkflows.length > 0 && (
                    <div className="border-t border-white/10 pt-4">
                      {preview.counselWorkflows.map((workflow) => (
                        <div key={workflow.id} className="border-b border-white/5 pb-3">
                          <p className="text-sm text-white">{workflow.status}</p>
                          <p className="mt-1 text-sm text-white/55">{workflow.triggerReason}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Panel>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
