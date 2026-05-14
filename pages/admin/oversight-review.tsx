import * as React from "react";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";

import AdminLayout from "@/components/admin/AdminLayout";
import BackToOperatorCommandCentre from "@/components/admin/BackToOperatorCommandCentre";
import { requireAdminPage } from "@/lib/access/server";
import type { OversightReviewDecision } from "@/lib/product/oversight-review-decision-contract";
import type { OversightCycleAudience } from "@/lib/product/oversight-cycle-ledger-contract";
import type { OversightDeliveryAction } from "@/lib/product/oversight-delivery-contract";
import { AdminStatusBadge, toneForStatus } from "@/components/admin/AdminStatusBadge";
import type { OversightBatchItem, OversightBatchAction, OversightBatchResult } from "@/lib/admin/oversight-batch";
import type { DecisionProvenanceRecord } from "@/lib/admin/decision-provenance-record";

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

type PageProps = {
  batchQueue: OversightBatchItem[];
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const guard = await requireAdminPage<PageProps>(ctx);
  if (!guard.authorized) return guard.redirect as never;

  const { buildOversightBatchQueue } = await import("@/lib/admin/oversight-batch");
  const batchQueue = await buildOversightBatchQueue().catch(() => []);

  return { props: { batchQueue } };
};

// ─── Batch panel ──────────────────────────────────────────────────────────────

function BatchPanel({ items }: { items: OversightBatchItem[] }) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [pendingAction, setPendingAction] = React.useState<OversightBatchAction | null>(null);
  const [skipReason, setSkipReason] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<(OversightBatchResult & { ok: boolean }) | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const selectedItems = items.filter((item) => selectedIds.has(item.cycleId));
  const selectedCount = selectedItems.length;

  const eligibleForAction = (action: OversightBatchAction) =>
    selectedItems.filter((item) => item.eligibleActions.includes(action));

  function toggleAll() {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.cycleId)));
    }
  }

  function toggleId(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function runBatch(action: OversightBatchAction) {
    const eligible = eligibleForAction(action);
    if (eligible.length === 0) return;

    if (action === "SKIP_WITH_REASON" && !skipReason.trim()) {
      setError("A reason is required to skip cycles.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/admin/oversight-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          cycleIds: eligible.map((i) => i.cycleId),
          reason: action === "SKIP_WITH_REASON" ? skipReason.trim() : undefined,
        }),
      });
      const data = await res.json() as OversightBatchResult & { ok: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Batch action failed");
      setResult(data);
      setSelectedIds(new Set());
      setPendingAction(null);
      setSkipReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Batch action failed");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <section className="border border-white/10 bg-zinc-950/70 p-5">
        <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-500/70">
          Batch Queue
        </p>
        <p className="mt-3 text-sm text-white/40">
          No active cadence cycles available for batch operations.
        </p>
      </section>
    );
  }

  return (
    <section className="border border-white/10 bg-zinc-950/70 p-5">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-500/70">
            Batch Queue
          </p>
          <p className="mt-1 text-xs text-white/40">
            {items.length} active cycle{items.length !== 1 ? "s" : ""} — select to run safe bulk actions.
            Eligibility is verified server-side before execution.
          </p>
        </div>
        {selectedCount > 0 && (
          <span className="shrink-0 rounded border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-amber-300">
            {selectedCount} selected
          </span>
        )}
      </div>

      {/* Error / result feedback */}
      {error && (
        <div className="mb-4 flex items-start gap-2 border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          <span>{error}</span>
        </div>
      )}
      {result && (
        <div className="mb-4 border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
          <p className="text-sm text-emerald-300">
            {result.successCount} succeeded, {result.failCount} failed.
          </p>
          {result.failCount > 0 && (
            <ul className="mt-2 space-y-1">
              {result.results
                .filter((r) => !r.success)
                .map((r) => (
                  <li key={r.cycleId} className="font-mono text-[10px] text-rose-300">
                    {r.cycleId}: {r.error}
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}

      {/* Cycle table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="pb-2 pr-4">
                <input
                  type="checkbox"
                  checked={selectedIds.size === items.length && items.length > 0}
                  onChange={toggleAll}
                  className="rounded border-white/20 bg-black/30 accent-amber-500"
                  title="Select all"
                />
              </th>
              <th className="pb-2 pr-4 text-[9px] font-mono uppercase tracking-[0.18em] text-white/35">Organisation</th>
              <th className="pb-2 pr-4 text-[9px] font-mono uppercase tracking-[0.18em] text-white/35">State</th>
              <th className="pb-2 pr-4 text-[9px] font-mono uppercase tracking-[0.18em] text-white/35">Scheduled</th>
              <th className="pb-2 text-[9px] font-mono uppercase tracking-[0.18em] text-white/35">Eligible actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const checked = selectedIds.has(item.cycleId);
              const hasActions = item.eligibleActions.length > 0;
              return (
                <tr
                  key={item.cycleId}
                  className={`border-t border-white/5 align-top transition-colors ${checked ? "bg-amber-500/[0.03]" : ""} ${!hasActions ? "opacity-40" : ""}`}
                >
                  <td className="py-3 pr-4">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!hasActions}
                      onChange={() => toggleId(item.cycleId)}
                      className="rounded border-white/20 bg-black/30 accent-amber-500 disabled:cursor-not-allowed"
                    />
                  </td>
                  <td className="py-3 pr-4 text-white/80">{item.organisationLabel}</td>
                  <td className="py-3 pr-4">
                    <AdminStatusBadge
                      label={item.cadenceState}
                      tone={toneForStatus(item.cadenceState)}
                      size="md"
                    />
                  </td>
                  <td className="py-3 pr-4 font-mono text-[10px] text-white/40">
                    {item.scheduledFor
                      ? new Date(item.scheduledFor).toLocaleDateString("en-GB")
                      : "—"}
                  </td>
                  <td className="py-3">
                    {item.eligibleActions.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {item.eligibleActions.map((a) => (
                          <span
                            key={a}
                            className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-white/40"
                          >
                            {a.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="font-mono text-[9px] text-white/25">
                        {item.ineligibleReasons[0] ?? "No actions"}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Batch action bar */}
      {selectedCount > 0 && (
        <div className="mt-5 space-y-3 border-t border-white/10 pt-5">
          <p className="text-[10px] font-mono uppercase tracking-wider text-white/35">
            Batch actions — {selectedCount} cycle{selectedCount !== 1 ? "s" : ""} selected
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              disabled={loading || eligibleForAction("MARK_IN_PROGRESS").length === 0}
              onClick={() => setPendingAction("MARK_IN_PROGRESS")}
              className="border border-blue-500/25 bg-blue-500/10 px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-blue-300 transition-colors hover:bg-blue-500/15 disabled:cursor-not-allowed disabled:opacity-35"
            >
              Start review ({eligibleForAction("MARK_IN_PROGRESS").length})
            </button>

            <button
              disabled={loading || eligibleForAction("MARK_COMPLETED").length === 0}
              onClick={() => setPendingAction("MARK_COMPLETED")}
              className="border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-emerald-300 transition-colors hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-35"
            >
              Complete review ({eligibleForAction("MARK_COMPLETED").length})
            </button>

            <button
              disabled={loading || eligibleForAction("SKIP_WITH_REASON").length === 0}
              onClick={() => setPendingAction("SKIP_WITH_REASON")}
              className="border border-amber-500/25 bg-amber-500/10 px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-amber-300 transition-colors hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-35"
            >
              Skip with reason ({eligibleForAction("SKIP_WITH_REASON").length})
            </button>
          </div>

          {/* Confirmation zone */}
          {pendingAction && (
            <div className="border border-white/10 bg-black/30 p-4">
              <p className="mb-3 text-sm text-white/70">
                Confirm:{" "}
                <span className="font-mono text-amber-300">{pendingAction}</span> for{" "}
                <span className="font-mono text-white">{eligibleForAction(pendingAction).length}</span>{" "}
                eligible cycle{eligibleForAction(pendingAction).length !== 1 ? "s" : ""}.
                Ineligible selections will be skipped automatically.
              </p>

              {pendingAction === "SKIP_WITH_REASON" && (
                <div className="mb-3">
                  <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-white/40 mb-1">
                    Skip reason (required)
                  </label>
                  <input
                    value={skipReason}
                    onChange={(e) => setSkipReason(e.target.value)}
                    placeholder="e.g. Client requested deferral, rescheduled to next quarter"
                    className="w-full border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-amber-500/30 focus:outline-none"
                  />
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  disabled={loading || (pendingAction === "SKIP_WITH_REASON" && !skipReason.trim())}
                  onClick={() => void runBatch(pendingAction)}
                  className="border border-amber-500/30 bg-amber-500/15 px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-amber-300 transition-colors hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  {loading ? "Running…" : "Confirm & run"}
                </button>
                <button
                  disabled={loading}
                  onClick={() => { setPendingAction(null); setSkipReason(""); }}
                  className="text-[10px] font-mono uppercase tracking-widest text-white/35 hover:text-white/60 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ─── Provenance panel ─────────────────────────────────────────────────────────

const POSTURE_TONE: Record<string, string> = {
  COMPLETE:    "text-emerald-400",
  DELIVERED:   "text-emerald-300",
  IN_REVIEW:   "text-blue-300",
  UNVERIFIED:  "text-amber-300",
  BLOCKED:     "text-rose-400",
  ESCALATED:   "text-rose-300",
  UNKNOWN:     "text-white/35",
};

const EVENT_TYPE_LABEL: Record<string, string> = {
  SIGNAL_DETECTED:     "Signal",
  OPERATOR_REVIEWED:   "Reviewed",
  SUPPRESSION_APPLIED: "Suppressed",
  COUNSEL_ESCALATED:   "Counsel",
  BOARDROOM_ESCALATED: "Boardroom",
  DELIVERY_APPROVED:   "Approved",
  DELIVERY_SENT:       "Delivered",
  OUTCOME_RECORDED:    "Outcome",
  MEMORY_UPDATED:      "Memory",
};

const SEVERITY_DOT: Record<string, string> = {
  CRITICAL: "bg-red-500",
  HIGH:     "bg-rose-400",
  MEDIUM:   "bg-amber-400",
  LOW:      "bg-white/20",
};

function ProvenancePanel({ cycleId }: { cycleId: string }) {
  const [record, setRecord] = React.useState<DecisionProvenanceRecord | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setRecord(null);

    fetch(`/api/admin/oversight-provenance?cycleId=${encodeURIComponent(cycleId)}`)
      .then((r) => r.json() as Promise<{ ok: boolean; record?: DecisionProvenanceRecord; error?: string }>)
      .then((data) => {
        if (cancelled) return;
        if (data.ok && data.record) setRecord(data.record);
        else setError(data.error ?? "Failed to load provenance");
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load provenance");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [cycleId]);

  return (
    <Panel title="Decision Provenance">
      {loading && (
        <p className="text-sm text-white/40">Loading provenance chain…</p>
      )}

      {error && (
        <p className="text-sm text-rose-300">{error}</p>
      )}

      {record && (
        <div className="space-y-4">
          {/* Posture */}
          <div className="border border-white/5 bg-black/25 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${POSTURE_TONE[record.currentPosture.status] ?? "text-white/40"}`}>
                {record.currentPosture.status.replace(/_/g, " ")}
              </span>
              {record.unavailableSources.length > 0 && (
                <AdminStatusBadge
                  label={`${record.unavailableSources.length} source${record.unavailableSources.length !== 1 ? "s" : ""} unavailable`}
                  tone="warning"
                  size="md"
                />
              )}
            </div>
            <p className="mt-1 text-[11px] text-white/45">{record.currentPosture.summary}</p>
          </div>

          {/* Accountability statement */}
          <div className="border-l-2 border-amber-500/25 pl-4">
            <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/35">Accountability statement</p>
            <p className="mt-1 text-[11px] text-white/60">{record.accountabilityStatement}</p>
          </div>

          {/* Governance events */}
          {record.governanceEvents.length > 0 && (
            <div>
              <p className="mb-2 text-[9px] font-mono uppercase tracking-[0.2em] text-white/35">
                Governance events ({record.governanceEvents.length})
              </p>
              <div className="space-y-1">
                {record.governanceEvents.map((event, i) => (
                  <div key={i} className="flex items-start gap-3 border border-white/5 bg-black/20 px-3 py-2 text-sm">
                    <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${SEVERITY_DOT[event.severity ?? "LOW"]}`} />
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-white/35 mr-2">
                        {EVENT_TYPE_LABEL[event.type] ?? event.type}
                      </span>
                      <span className="text-[11px] text-white/65">{event.label}</span>
                      {event.actor && (
                        <span className="ml-2 font-mono text-[9px] text-white/30">{event.actor}</span>
                      )}
                    </div>
                    {event.occurredAt && (
                      <span className="shrink-0 font-mono text-[9px] text-white/25">
                        {new Date(event.occurredAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {record.governanceEvents.length === 0 && (
            <p className="text-[11px] text-white/30">No governance events recorded for this cycle.</p>
          )}
        </div>
      )}
    </Panel>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OversightReviewPage({
  batchQueue,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
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
        <BackToOperatorCommandCentre />

        <BatchPanel items={batchQueue} />

        <section className="border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-500/60">Oversight Review Bench</p>
          <h1 className="mt-3 font-serif text-3xl text-white">Governed brief review</h1>
          <p className="mt-2 max-w-3xl text-sm text-white/55">
            Review, suppress, archive, compare, hand off to counsel, and prepare controlled client delivery without pretending automation exists where it does not.
          </p>
          <p className="mt-2 max-w-3xl text-sm text-white/60">
            Use this page when a retained cycle needs an operator decision before client-safe delivery, counsel handoff, or boardroom escalation.
          </p>
        </section>

        <Panel title="Review Scope">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block text-sm text-white/70">
              <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.22em] text-white/45">Account / Contract</span>
              <input value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full border border-white/10 bg-black/40 px-3 py-2 text-white" placeholder="Retainer account id" />
            </label>
            <label className="block text-sm text-white/70">
              <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.22em] text-white/45">Organisation</span>
              <input value={organisationId} onChange={(e) => setOrganisationId(e.target.value)} className="w-full border border-white/10 bg-black/40 px-3 py-2 text-white" placeholder="Organisation id" />
            </label>
            <label className="block text-sm text-white/70">
              <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.22em] text-white/45">Subject Email</span>
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
              {loading ? "Loading..." : "Generate review cycle preview"}
            </button>
          </div>

          {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
        </Panel>

        {preview && preview.cycle?.cycleId && (
          <ProvenancePanel cycleId={preview.cycle.cycleId} />
        )}

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
                    <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.22em] text-white/45">Review Decision</span>
                    <select value={operatorDecision} onChange={(e) => setOperatorDecision(e.target.value as OversightReviewDecision | "")} className="w-full border border-white/10 bg-black/40 px-3 py-2 text-white">
                      <option value="">Choose decision</option>
                      {DECISION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm text-white/70">
                    <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.22em] text-white/45">Audience Selector</span>
                    <select value={selectedAudience} onChange={(e) => setSelectedAudience(e.target.value as OversightCycleAudience)} className="w-full border border-white/10 bg-black/40 px-3 py-2 text-white">
                      {AUDIENCES.map((audience) => (
                        <option key={audience} value={audience}>{audience}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="mt-4 block text-sm text-white/70">
                  <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.22em] text-white/45">Operator Note</span>
                  <textarea value={operatorNote} onChange={(e) => setOperatorNote(e.target.value)} rows={4} className="w-full border border-white/10 bg-black/40 px-3 py-2 text-white" placeholder="Required for overrides, escalation, withhold, and first-cycle exceptions." />
                </label>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button onClick={() => void refreshPreview(true)} disabled={loading || !operatorDecision || (override && !operatorNote.trim())} className="border border-amber-500/25 bg-amber-500/10 px-4 py-2 text-sm text-amber-100 disabled:opacity-50">
                    Record operator review
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
                  <button onClick={() => void runDeliveryAction()} disabled={loading || !deliveryAction} className="border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100 disabled:opacity-50">
                    Run delivery action
                  </button>
                </div>

                {preview.nextCycleIntent && (
                  <div className="mt-6 border-t border-white/10 pt-4">
                    <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/45">Next Cycle Intent</p>
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
                          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/45">{item.status}</p>
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
                          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/45">{item.type} · {item.confidence}</p>
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
                      <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/45">Preserved Visibility</p>
                      <ul className="mt-2 space-y-2 text-sm text-white/60">
                        {(preview.internalBrief.indispensability.preservedVisibility as string[]).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-4">
                      <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/45">Would Be Lost</p>
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

              <Panel title="Retainer Intake Context">
                {preview?.internalBrief?.retainerIntake ? (
                  <div className="space-y-3">
                    <p className="text-[9px] font-mono uppercase tracking-[0.22em] text-amber-500/50">Source: Retainer Intake &middot; Evidence posture: client-reported</p>
                    {preview.internalBrief.retainerIntake.mandate && (
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-[0.20em] text-white/45 mb-1">Mandate</p>
                        <p className="text-sm text-white/70">{preview.internalBrief.retainerIntake.mandate}</p>
                      </div>
                    )}
                    {preview.internalBrief.retainerIntake.refusalBoundary && (
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-[0.20em] text-white/45 mb-1">Refusal boundary</p>
                        <p className="text-sm text-white/70">{preview.internalBrief.retainerIntake.refusalBoundary}</p>
                      </div>
                    )}
                    {preview.internalBrief.retainerIntake.clientSafeSummary && preview.internalBrief.retainerIntake.clientSafeSummary.length > 0 && (
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-[0.20em] text-white/45 mb-1">Client-safe summary</p>
                        {preview.internalBrief.retainerIntake.clientSafeSummary.map((item: string, i: number) => (
                          <p key={i} className="text-sm text-white/60">{item}</p>
                        ))}
                      </div>
                    )}
                    {preview.internalBrief.retainerIntake.suppressionReasons && preview.internalBrief.retainerIntake.suppressionReasons.length > 0 && (
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-[0.20em] text-amber-400/50 mb-1">Suppression</p>
                        {preview.internalBrief.retainerIntake.suppressionReasons.map((item: string, i: number) => (
                          <p key={i} className="text-xs text-amber-200/40">{item}</p>
                        ))}
                      </div>
                    )}
                    {preview.internalBrief.retainerIntake.capturedAt && (
                      <p className="text-[8px] font-mono text-white/45">Captured: {new Date(preview.internalBrief.retainerIntake.capturedAt).toLocaleDateString("en-GB")}</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-amber-200/50">No retainer intake found.</p>
                    <p className="text-xs text-white/55 mt-1">Operator should not approve first retained oversight cycle until intake is captured or absence is justified.</p>
                  </div>
                )}
              </Panel>

              <Panel title="Counsel Handoff">
                <div className="space-y-4">
                  <label className="block text-sm text-white/70">
                    <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.22em] text-white/45">Case Id</span>
                    <input value={counselCaseId} onChange={(e) => setCounselCaseId(e.target.value)} className="w-full border border-white/10 bg-black/40 px-3 py-2 text-white" placeholder="Case id" />
                  </label>
                  <label className="block text-sm text-white/70">
                    <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.22em] text-white/45">Counsel Reason</span>
                    <input value={counselReason} onChange={(e) => setCounselReason(e.target.value)} className="w-full border border-white/10 bg-black/40 px-3 py-2 text-white" placeholder="Why counsel is required" />
                  </label>
                  <label className="block text-sm text-white/70">
                    <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.22em] text-white/45">Review Question</span>
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
