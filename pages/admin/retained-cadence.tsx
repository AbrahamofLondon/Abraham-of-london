import * as React from "react";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";

import AdminLayout from "@/components/admin/AdminLayout";
import BackToOperatorCommandCentre from "@/components/admin/BackToOperatorCommandCentre";
import { requireAdminPage } from "@/lib/access/server";
import { buildOperatorCadenceQueue } from "@/lib/product/retained-cadence-service";
import {
  buildCadenceTimeline,
  groupCadenceTimeline,
  type RetainedCadenceTimelineItem,
  type RetainedCadenceTimelineGroup,
} from "@/lib/admin/retained-cadence-timeline";
import {
  buildCadenceCalendar,
  type CalendarBand,
} from "@/lib/admin/retained-cadence-calendar";
import { AdminStatusBadge, toneForStatus } from "@/components/admin/AdminStatusBadge";

type QueueResponse = Awaited<ReturnType<typeof buildOperatorCadenceQueue>>;
type Action = "MARK_IN_PROGRESS" | "MARK_COMPLETED" | "SKIP_WITH_REASON" | "ESCALATE";

export const getServerSideProps: GetServerSideProps<{
  initialQueue: QueueResponse;
}> = async (ctx) => {
  const guard = await requireAdminPage(ctx);
  if (!guard.authorized) return guard.redirect as any;
  const initialQueue = await buildOperatorCadenceQueue();
  return { props: { initialQueue } };
};

function Row({
  item,
  onAction,
  busy,
}: {
  item: QueueResponse["all"][number];
  onAction: (cycleId: string, action: Action) => void;
  busy: boolean;
}) {
  const actionable = typeof item.cycleId === "string" && item.cycleId.length > 0;
  const isInProgress = item.cadenceState === "REVIEW_IN_PROGRESS";
  const isDueOrOverdue =
    item.cadenceState === "DUE_SOON" ||
    item.cadenceState === "REVIEW_DUE" ||
    item.cadenceState === "OVERDUE" ||
    item.cadenceState === "CADENCE_BROKEN";

  return (
    <tr className="border-t border-white/5 align-top text-sm text-white/70">
      <td className="py-3 pr-4 text-white">{item.organisationLabel}</td>
      <td className="py-3 pr-4">{item.organisationId ?? item.accountId ?? "Unscoped"}</td>
      <td className="py-3 pr-4">{item.scheduledFor ? new Date(item.scheduledFor).toLocaleDateString("en-GB") : "Not scheduled"}</td>
      <td className="py-3 pr-4">{item.cadenceState}</td>
      <td className="py-3 pr-4">{item.cadenceSource}</td>
      <td className="py-3 pr-4">{item.evidencePosture}</td>
      <td className="py-3">
        {actionable ? (
          <div className="flex flex-wrap gap-2">
            {isDueOrOverdue && !isInProgress && (
              <button onClick={() => onAction(item.cycleId!, "MARK_IN_PROGRESS")} disabled={busy} className="border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-xs text-blue-200 disabled:opacity-50">
                Start review
              </button>
            )}
            {(isInProgress || isDueOrOverdue) && (
              <button onClick={() => onAction(item.cycleId!, "MARK_COMPLETED")} disabled={busy} className="border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200 disabled:opacity-50">
                Complete review
              </button>
            )}
            <button onClick={() => onAction(item.cycleId!, "SKIP_WITH_REASON")} disabled={busy} className="border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs text-amber-100 disabled:opacity-50">
              Skip with reason
            </button>
            <button onClick={() => onAction(item.cycleId!, "ESCALATE")} disabled={busy} className="border border-rose-500/25 bg-rose-500/10 px-3 py-1 text-xs text-rose-200 disabled:opacity-50">
              Escalate cycle
            </button>
          </div>
        ) : (
          <span className="text-white/50">No cycle record yet</span>
        )}
      </td>
    </tr>
  );
}

function CreateCycleForm({ onCreated }: { onCreated: () => void }) {
  const [scopeId, setScopeId] = React.useState("");
  const [intervalDays, setIntervalDays] = React.useState("30");
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!scopeId.trim()) return;
    setBusy(true);
    setResult(null);
    try {
      const response = await fetch("/api/admin/retained-cadence/create-cycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scopeId: scopeId.trim(),
          intervalDays: Number(intervalDays) || 30,
          note: note.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to create cycle.");
      }
      setResult(`Cycle created: ${data.cycle?.cycleId ?? "OK"}`);
      setScopeId("");
      setNote("");
      onCreated();
    } catch (err) {
      setResult(err instanceof Error ? err.message : "Failed to create cycle.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-white/40">Scope ID (account or org)</label>
        <input value={scopeId} onChange={(e) => setScopeId(e.target.value)} className="mt-1 border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" placeholder="acct_... or org_..." />
      </div>
      <div>
        <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-white/40">Interval (days)</label>
        <input value={intervalDays} onChange={(e) => setIntervalDays(e.target.value)} type="number" min="1" className="mt-1 w-20 border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
      </div>
      <div>
        <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-white/40">Note (optional)</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" placeholder="Initial cycle setup" />
      </div>
      <button type="submit" disabled={busy || !scopeId.trim()} className="border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-200 disabled:opacity-50">
        Create cycle
      </button>
      {result && <p className="text-xs text-white/55">{result}</p>}
    </form>
  );
}


const TIMELINE_SEVERITY_DOT: Record<RetainedCadenceTimelineItem["severity"], string> = {
  CRITICAL: "bg-red-500",
  HIGH:     "bg-orange-400",
  MEDIUM:   "bg-amber-400",
  LOW:      "bg-white/20",
};

function formatDaysOffset(offset: number | null | undefined): string | null {
  if (offset == null) return null;
  if (offset < 0) return `${Math.abs(offset)}d overdue`;
  if (offset === 0) return "due today";
  return `in ${offset}d`;
}

function TimelineItem({ item }: { item: RetainedCadenceTimelineItem }) {
  const dotStyle = TIMELINE_SEVERITY_DOT[item.severity];
  const offsetLabel = formatDaysOffset(item.daysOffset);

  return (
    <div className="flex items-center gap-3 border border-white/5 bg-black/25 px-4 py-3">
      <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${dotStyle}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{item.label}</p>
        {(item.accountId || item.organisationId) && (
          <p className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-white/45">
            {item.accountId ?? item.organisationId}
          </p>
        )}
      </div>
      <div className="shrink-0 text-right">
        {item.dueAt ? (
          <p className="text-sm text-white/55">
            {new Date(item.dueAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        ) : (
          <p className="text-sm text-white/50">Unscheduled</p>
        )}
        {offsetLabel && (
          <p className={`mt-0.5 font-mono text-[9px] uppercase tracking-wider ${item.daysOffset != null && item.daysOffset < 0 ? "text-red-400" : "text-white/45"}`}>
            {offsetLabel}
          </p>
        )}
      </div>
      <AdminStatusBadge label={item.status} tone={toneForStatus(item.status)} size="md" />
    </div>
  );
}

function TimelineGroupSection({ group }: { group: RetainedCadenceTimelineGroup }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-3">
        <span className="text-[9px] font-mono uppercase tracking-[0.22em] text-white/45">{group.band}</span>
        <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[9px] text-white/40">{group.items.length}</span>
      </div>
      <div className="space-y-1">
        {group.items.map((item) => (
          <TimelineItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

// ─── Calendar severity dot ────────────────────────────────────────────────────

const CALENDAR_SEVERITY_DOT: Record<RetainedCadenceTimelineItem["severity"], string> = {
  CRITICAL: "bg-red-500",
  HIGH:     "bg-orange-400",
  MEDIUM:   "bg-amber-400",
  LOW:      "bg-white/20",
};

const CALENDAR_LANE_ACCENT: Record<string, string> = {
  OVERDUE:          "border-l-rose-500/50",
  THIS_WEEK:        "border-l-amber-500/40",
  NEXT_WEEK:        "border-l-blue-500/30",
  LATER:            "border-l-white/10",
  UNSCHEDULED:      "border-l-white/10",
  COMPLETED_RECENT: "border-l-emerald-500/30",
};

function CalendarItem({ item }: { item: RetainedCadenceTimelineItem }) {
  const dot = CALENDAR_SEVERITY_DOT[item.severity];
  return (
    <div className="flex items-center gap-3 border border-white/5 bg-black/20 px-3 py-2.5">
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-white/80">{item.label}</p>
        {(item.accountId || item.organisationId) && (
          <p className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-white/35">
            {item.accountId ?? item.organisationId}
          </p>
        )}
      </div>
      {item.dueAt ? (
        <p className="shrink-0 font-mono text-[10px] text-white/40">
          {new Date(item.dueAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
        </p>
      ) : null}
      <AdminStatusBadge label={item.status} tone={toneForStatus(item.status)} size="md" />
    </div>
  );
}

function CalendarBandSection({ band }: { band: CalendarBand }) {
  const accent = CALENDAR_LANE_ACCENT[band.lane] ?? "border-l-white/10";
  return (
    <div className={`border-l-2 pl-4 ${accent}`}>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[9px] font-mono uppercase tracking-[0.22em] text-white/45">
          {band.label}
        </span>
        <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[9px] text-white/40">
          {band.items.length}
        </span>
      </div>
      <div className="space-y-1">
        {band.items.map((item) => (
          <CalendarItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

export default function RetainedCadencePage({
  initialQueue,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [queue, setQueue] = React.useState(initialQueue);
  const [busyCycleId, setBusyCycleId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [tickResult, setTickResult] = React.useState<string | null>(null);

  async function refreshQueue() {
    const response = await fetch("/api/admin/retained-cadence/list");
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Failed to reload retained cadence queue.");
    }
    setQueue(data.queue);
  }

  async function handleAction(cycleId: string, action: Action) {
    setBusyCycleId(cycleId);
    setError(null);
    try {
      // Actions that use the new /action endpoint
      if (action === "MARK_IN_PROGRESS") {
        const response = await fetch("/api/admin/retained-cadence/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cycleId, action }),
        });
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.error || "Failed to start review.");
        }
        await refreshQueue();
        return;
      }

      if (action === "MARK_COMPLETED") {
        const response = await fetch("/api/admin/retained-cadence/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cycleId, action: "COMPLETE" }),
        });
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.error || "Failed to complete cycle.");
        }
        await refreshQueue();
        return;
      }

      // Legacy actions via update endpoint
      const reason = window.prompt(
        action === "SKIP_WITH_REASON" ? "Enter skip reason" : "Enter escalation reason",
        ""
      ) || "";
      if (!reason.trim()) {
        throw new Error(action === "SKIP_WITH_REASON" ? "Skip reason is required." : "Escalation reason is required.");
      }
      const response = await fetch("/api/admin/retained-cadence/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycleId, action, reason }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Cadence update failed.");
      }
      await refreshQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cadence update failed.");
    } finally {
      setBusyCycleId(null);
    }
  }

  async function handleRunNow() {
    setTickResult("Running scheduler...");
    setError(null);
    try {
      const response = await fetch("/api/admin/retained-cadence/run-now", {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to run cadence scheduler.");
      }
      await refreshQueue();
      const result = data.result;
      setTickResult(
        `Tick complete: ${result.createdCycleIds.length} created, ${result.markedOverdue.length} overdue, ${result.escalated.length} escalated.`,
      );
    } catch (err) {
      setTickResult(null);
      setError(err instanceof Error ? err.message : "Failed to run cadence scheduler.");
    }
  }

  const timelineItems = buildCadenceTimeline(queue.all);
  const timelineGroups = groupCadenceTimeline(timelineItems);
  const calendarBands = buildCadenceCalendar(timelineItems);

  const sections: Array<[string, QueueResponse["all"]]> = [
    ["Overdue cycles", queue.overdue],
    ["In progress", queue.inProgress],
    ["Due cycles", queue.due],
    ["Cadence broken", queue.cadenceBroken],
    ["Skipped cycles", queue.skipped],
    ["Escalated cycles", queue.escalated],
    ["Not configured", queue.notConfigured],
  ];

  return (
    <AdminLayout title="Retained Cadence">
      <Head>
        <title>Retained Cadence | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="space-y-6">
        <BackToOperatorCommandCentre />

        <section className="border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-500/60">Retained oversight cadence</p>
          <h1 className="mt-3 font-serif text-3xl text-white">Operator cadence queue</h1>
          <p className="mt-2 max-w-3xl text-sm text-white/55">
            This queue shows due, in-progress, overdue, skipped, escalated, broken, and unconfigured retained review cycles. Actions are operator-only and do not publish internal notes to buyer-facing surfaces.
          </p>
          <p className="mt-2 max-w-3xl text-sm text-white/60">
            Use this page when retained oversight cadence is overdue, unscheduled, or ready to move into review.
          </p>
        </section>

        <section className="border border-white/10 bg-zinc-950/70 p-5">
          <h2 className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-500/70">Create new review cycle</h2>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <CreateCycleForm onCreated={refreshQueue} />
            <div className="space-y-2">
              <button
                onClick={handleRunNow}
                className="border border-blue-500/25 bg-blue-500/10 px-4 py-2 text-xs text-blue-200"
              >
                Run cadence now
              </button>
              {tickResult ? <p className="max-w-sm text-xs text-white/55">{tickResult}</p> : null}
            </div>
          </div>
        </section>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        {/* ── Cadence Timeline ───────────────────────────────────────────── */}
        <section className="border border-white/10 bg-zinc-950/70 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-500/70">Cadence Timeline</h2>
              <p className="mt-1 text-xs text-white/40">
                Operational pressure view — overdue, active, upcoming, and completed cycles at a glance.
              </p>
            </div>
            <div className="flex shrink-0 gap-4 text-right">
              <div>
                <p className="text-[9px] font-mono uppercase tracking-wider text-white/45">Overdue</p>
                <p className="mt-1 font-mono text-lg text-red-400">{queue.overdue.length}</p>
              </div>
              <div>
                <p className="text-[9px] font-mono uppercase tracking-wider text-white/45">Due now</p>
                <p className="mt-1 font-mono text-lg text-orange-400">{queue.due.length}</p>
              </div>
              <div>
                <p className="text-[9px] font-mono uppercase tracking-wider text-white/45">Total</p>
                <p className="mt-1 font-mono text-lg text-white/60">{queue.all.length}</p>
              </div>
            </div>
          </div>

          {timelineGroups.length === 0 ? (
            <div className="mt-4 border border-dashed border-white/10 bg-black/25 px-4 py-5 text-sm text-white/50">
              No retained cadence records found. Create a review cycle above when a retained account is ready for scheduled oversight.
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              {timelineGroups.map((group) => (
                <TimelineGroupSection key={group.band} group={group} />
              ))}
            </div>
          )}
        </section>

        {/* ── Cadence Calendar ───────────────────────────────────────────── */}
        <section className="border border-white/10 bg-zinc-950/70 p-5">
          <div className="mb-4">
            <h2 className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-500/70">Cadence Calendar</h2>
            <p className="mt-1 text-xs text-white/40">
              Week-banded review pressure — overdue, this week, next week, later, and unscheduled.
            </p>
          </div>

          {calendarBands.length === 0 ? (
            <div className="border border-dashed border-white/10 bg-black/25 px-4 py-5 text-sm text-white/50">
              No upcoming cadence cycles. Create a review cycle above when a retained account is ready.
            </div>
          ) : (
            <div className="space-y-5">
              {calendarBands.map((band) => (
                <CalendarBandSection key={band.lane} band={band} />
              ))}
            </div>
          )}
        </section>

        {sections.map(([title, items]) => (
          <section key={title} className="border border-white/10 bg-zinc-950/70 p-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-500/70">{title}</h2>
              <span className="text-sm text-white/45">{items.length}</span>
            </div>

            {items.length === 0 ? (
              <p className="mt-4 text-sm text-white/50">No records in this state. Check the timeline above for the next due or overdue cycle.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left">
                  <thead className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/45">
                    <tr>
                      <th className="pb-3 pr-4">Account / Organisation</th>
                      <th className="pb-3 pr-4">Reference</th>
                      <th className="pb-3 pr-4">Scheduled date</th>
                      <th className="pb-3 pr-4">State</th>
                      <th className="pb-3 pr-4">Source</th>
                      <th className="pb-3 pr-4">Evidence posture</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <Row
                        key={`${title}-${item.accountId}-${item.organisationId}-${item.cycleId ?? "unconfigured"}`}
                        item={item}
                        onAction={handleAction}
                        busy={busyCycleId === item.cycleId}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}
      </div>
    </AdminLayout>
  );
}
