/**
 * pages/admin/outbound/scheduler.tsx
 *
 * Outbound scheduler control surface.
 * Operator view of scheduler state, due queue, failure summary, and actions.
 *
 * Actions available:
 *   - Dry-run (ADMIN)
 *   - Live-run (OWNER only, requires OUTBOUND_SCHEDULER_ENABLED + confirmation)
 *   - Pause / Resume (OWNER only)
 *
 * Hard rules:
 *   - dryRun never publishes
 *   - live-run requires confirmation string: RUN_OUTBOUND_SCHEDULER
 *   - live-run disabled if OUTBOUND_SCHEDULER_ENABLED !== "true"
 *   - Tokens never returned to client
 *   - No automatic publishing
 */

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  Lock,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Settings2,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { requireAdminPage } from "@/lib/access/server";
import { canAccessOwner } from "@/lib/access/checks";
import { getOutboundControlState } from "@/lib/outbound/core/outbound-control-state";
import { getRecentLedgerEntries, getFailureSummary } from "@/lib/outbound/core/outbound-publish-ledger";
import { getOutboundPostsDue } from "@/lib/outbound/outbound-content-loader";
import { prisma } from "@/lib/prisma.server";
import OutboundLedgerTable, { type LedgerEntry } from "@/components/admin/outbound/OutboundLedgerTable";

// ─── Types ────────────────────────────────────────────────────────────────────

type RecentRun = {
  runKey: string;
  source: string;
  dryRun: boolean;
  status: string;
  scanned: number;
  eligible: number;
  published: number;
  skipped: number;
  failed: number;
  startedAt: string;
  completedAt: string | null;
};

type ProviderFailure = {
  provider: string;
  failureCount24h: number;
  lastFailureAt: string | null;
  lastSuccessAt: string | null;
  lastDryRunAt: string | null;
};

type DuePost = {
  id: string;
  provider: string;
  campaign: string | null;
  scheduledFor: string | null;
  approvalStatus: string;
  status: string;
};

type PageProps = {
  isOwner: boolean;
  schedulerEnabled: boolean;
  schedulerPaused: boolean;
  schedulerPausedEnv: boolean;
  schedulerPausedDb: boolean;
  pausedReason: string | null;
  pausedByEmail: string | null;
  pausedAt: string | null;
  resumedAt: string | null;
  cronSecretConfigured: boolean;
  lock: {
    active: boolean;
    expiresAt: string | null;
    holder: string | null;
  };
  recentRuns: RecentRun[];
  providers: ProviderFailure[];
  dueCount: number;
  duePosts: DuePost[];
  recentLedger: LedgerEntry[];
  totalFailed24h: number;
};

// ─── Server-side ──────────────────────────────────────────────────────────────

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const guard = await requireAdminPage(ctx);
  if (!guard.authorized) return guard.redirect as never;

  const isOwner = canAccessOwner(guard.access);

  const [
    controlState,
    lockRow,
    recentRuns,
    liFail,
    fbFail,
    xFail,
    liLedger,
    fbLedger,
    xLedger,
  ] = await Promise.all([
    getOutboundControlState(),
    prisma.schedulerLock.findUnique({ where: { lockKey: "outbound-scheduler" } }).catch(() => null),
    prisma.schedulerRun.findMany({ orderBy: { startedAt: "desc" }, take: 5 }).catch(() => []),
    getFailureSummary("linkedin", 24).catch(() => null),
    getFailureSummary("facebook", 24).catch(() => null),
    getFailureSummary("x", 24).catch(() => null),
    getRecentLedgerEntries("linkedin", 4).catch(() => []),
    getRecentLedgerEntries("facebook", 4).catch(() => []),
    getRecentLedgerEntries("x", 4).catch(() => []),
  ]);

  const schedulerEnabled = process.env.OUTBOUND_SCHEDULER_ENABLED === "true";
  const schedulerPausedEnv = process.env.OUTBOUND_SCHEDULER_PAUSED === "true";
  const schedulerPausedDb = controlState.schedulerPaused;
  const schedulerPaused = schedulerPausedEnv || schedulerPausedDb;
  const cronSecretConfigured = Boolean(process.env.CRON_SECRET?.trim());

  const lockActive = lockRow ? new Date(lockRow.expiresAt) > new Date() : false;

  // Due posts — aggregate across all three providers
  let duePostsRaw: DuePost[] = [];
  let dueCount = 0;
  try {
    const allDue = [
      ...getOutboundPostsDue("linkedin"),
      ...getOutboundPostsDue("facebook"),
      ...getOutboundPostsDue("x"),
    ];
    dueCount = allDue.length;
    duePostsRaw = allDue.slice(0, 10).map((p) => ({
      id: p.id,
      provider: p.provider ?? "unknown",
      campaign: p.campaign ?? null,
      scheduledFor: p.scheduledFor ? new Date(p.scheduledFor).toISOString() : null,
      approvalStatus: p.approvalStatus,
      status: p.status,
    }));
  } catch {
    dueCount = -1;
  }

  const allLedger = [...liLedger, ...fbLedger, ...xLedger]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const providers: ProviderFailure[] = [
    {
      provider: "linkedin",
      failureCount24h: liFail?.failureCount ?? 0,
      lastFailureAt: liFail?.lastFailure?.createdAt ? new Date(liFail.lastFailure.createdAt).toISOString() : null,
      lastSuccessAt: liFail?.lastSuccess?.createdAt ? new Date(liFail.lastSuccess.createdAt).toISOString() : null,
      lastDryRunAt: liFail?.lastDryRun?.createdAt ? new Date(liFail.lastDryRun.createdAt).toISOString() : null,
    },
    {
      provider: "facebook",
      failureCount24h: fbFail?.failureCount ?? 0,
      lastFailureAt: fbFail?.lastFailure?.createdAt ? new Date(fbFail.lastFailure.createdAt).toISOString() : null,
      lastSuccessAt: fbFail?.lastSuccess?.createdAt ? new Date(fbFail.lastSuccess.createdAt).toISOString() : null,
      lastDryRunAt: fbFail?.lastDryRun?.createdAt ? new Date(fbFail.lastDryRun.createdAt).toISOString() : null,
    },
    {
      provider: "x",
      failureCount24h: xFail?.failureCount ?? 0,
      lastFailureAt: xFail?.lastFailure?.createdAt ? new Date(xFail.lastFailure.createdAt).toISOString() : null,
      lastSuccessAt: xFail?.lastSuccess?.createdAt ? new Date(xFail.lastSuccess.createdAt).toISOString() : null,
      lastDryRunAt: xFail?.lastDryRun?.createdAt ? new Date(xFail.lastDryRun.createdAt).toISOString() : null,
    },
  ];

  const totalFailed24h = providers.reduce((n, p) => n + p.failureCount24h, 0);

  return {
    props: {
      isOwner,
      schedulerEnabled,
      schedulerPaused,
      schedulerPausedEnv,
      schedulerPausedDb,
      pausedReason: controlState.pausedReason,
      pausedByEmail: controlState.pausedByEmail,
      pausedAt: controlState.pausedAt ? new Date(controlState.pausedAt).toISOString() : null,
      resumedAt: controlState.resumedAt ? new Date(controlState.resumedAt).toISOString() : null,
      cronSecretConfigured,
      lock: {
        active: lockActive,
        expiresAt: lockRow?.expiresAt ? new Date(lockRow.expiresAt).toISOString() : null,
        holder: lockRow?.holder ?? null,
      },
      recentRuns: recentRuns.map((r) => ({
        runKey: r.runKey,
        source: r.source,
        dryRun: r.dryRun,
        status: r.status,
        scanned: r.scannedCount,
        eligible: r.eligibleCount,
        published: r.publishedCount,
        skipped: r.skippedCount,
        failed: r.failedCount,
        startedAt: r.startedAt.toISOString(),
        completedAt: r.completedAt ? r.completedAt.toISOString() : null,
      })),
      providers,
      dueCount,
      duePosts: duePostsRaw,
      recentLedger: allLedger.map((e) => ({
        id: e.id,
        provider: e.provider,
        outboundItemId: e.outboundItemId,
        campaign: e.campaign ?? null,
        assetSlug: e.assetSlug,
        status: e.status,
        source: e.source,
        idempotencyKey: e.idempotencyKey,
        actorEmail: e.actorEmail ?? null,
        providerPostUrl: e.providerPostUrl ?? null,
        errorCode: e.errorCode ?? null,
        safeMessage: e.safeMessage ?? null,
        forceRepublish: e.forceRepublish ?? false,
        createdAt: new Date(e.createdAt).toISOString(),
        completedAt: e.completedAt ? new Date(e.completedAt).toISOString() : null,
      })),
      totalFailed24h,
    },
  };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function runStatusTone(status: string) {
  if (status === "COMPLETED") return "success";
  if (status === "FAILED") return "danger";
  if (status === "DRY_RUN" || status === "DRY_RUN_COMPLETED") return "info";
  return "muted";
}

// ─── Action panel ─────────────────────────────────────────────────────────────

type RunResult = {
  ok: boolean;
  dryRun?: boolean;
  scanned?: number;
  eligible?: number;
  published?: number;
  skipped?: number;
  failed?: number;
  error?: string;
  requestId?: string;
};

function SchedulerActionPanel({
  isOwner,
  schedulerEnabled,
  schedulerPaused,
  lockActive,
}: {
  isOwner: boolean;
  schedulerEnabled: boolean;
  schedulerPaused: boolean;
  lockActive: boolean;
}) {
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<RunResult | null>(null);
  const [showLiveConfirm, setShowLiveConfirm] = React.useState(false);
  const [confirmInput, setConfirmInput] = React.useState("");

  async function runScheduler(dryRun: boolean) {
    setBusy(true);
    setResult(null);
    try {
      const body: Record<string, unknown> = { dryRun };
      if (!dryRun) {
        body.confirm = "RUN_OUTBOUND_SCHEDULER";
      }
      const res = await fetch("/api/admin/outbound/scheduler/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ ok: false, error: "Network error — check console." });
    } finally {
      setBusy(false);
      setShowLiveConfirm(false);
      setConfirmInput("");
    }
  }

  const liveRunBlocked = !schedulerEnabled || schedulerPaused || lockActive;

  return (
    <div className="space-y-4">
      {/* Dry-run */}
      <div className="border border-white/10 bg-zinc-950/50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Dry-run</p>
            <p className="mt-0.5 text-xs text-white/40">
              Validates eligibility gates for all due posts without publishing. Safe for any admin.
            </p>
          </div>
          <button
            onClick={() => runScheduler(true)}
            disabled={busy}
            className="inline-flex items-center gap-2 border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-xs text-sky-100 transition-colors hover:border-sky-400/50 hover:bg-sky-400/15 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Run dry-run
          </button>
        </div>
      </div>

      {/* Live-run (OWNER only) */}
      {isOwner && (
        <div className="border border-amber-500/20 bg-amber-500/[0.04] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-amber-100">Live run</p>
                <AdminStatusBadge label="owner only" tone="warning" />
              </div>
              <p className="mt-0.5 text-xs text-amber-200/50">
                Publishes eligible approved posts to providers. Requires scheduler enabled, not paused, and explicit confirmation.
              </p>
              {liveRunBlocked && (
                <ul className="mt-2 space-y-0.5 text-[10px] text-rose-300/70">
                  {!schedulerEnabled && <li>· OUTBOUND_SCHEDULER_ENABLED is not true</li>}
                  {schedulerPaused && <li>· Scheduler is paused</li>}
                  {lockActive && <li>· Scheduler lock is held</li>}
                </ul>
              )}
            </div>
            {!showLiveConfirm ? (
              <button
                onClick={() => setShowLiveConfirm(true)}
                disabled={busy || liveRunBlocked}
                className="shrink-0 inline-flex items-center gap-2 border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-100 transition-colors hover:border-amber-500/50 hover:bg-amber-500/15 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <PlayCircle className="h-3 w-3" />
                Live run…
              </button>
            ) : (
              <button
                onClick={() => { setShowLiveConfirm(false); setConfirmInput(""); }}
                className="shrink-0 text-xs text-white/30 hover:text-white/60"
              >
                Cancel
              </button>
            )}
          </div>

          {showLiveConfirm && (
            <div className="mt-4 border border-amber-500/20 bg-black/30 p-4 space-y-3">
              <p className="text-xs text-amber-200/70">
                Type <code className="font-mono text-amber-300">RUN_OUTBOUND_SCHEDULER</code> to confirm live execution.
              </p>
              <p className="text-[10px] text-amber-200/40">
                This will publish all eligible approved posts. Posts already published are protected by idempotency keys.
              </p>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="RUN_OUTBOUND_SCHEDULER"
                className="w-full border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-white placeholder-white/20 focus:border-amber-500/40 focus:outline-none"
              />
              <button
                onClick={() => runScheduler(false)}
                disabled={busy || confirmInput !== "RUN_OUTBOUND_SCHEDULER"}
                className="inline-flex items-center gap-2 border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-xs text-amber-100 transition-colors hover:border-amber-500/60 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <PlayCircle className="h-3 w-3" />}
                Confirm live run
              </button>
            </div>
          )}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`border p-4 text-xs ${result.ok ? "border-emerald-500/25 bg-emerald-500/5" : "border-rose-500/25 bg-rose-500/5"}`}>
          {result.ok ? (
            <div className="space-y-1">
              <p className={`font-medium ${result.ok ? "text-emerald-300" : "text-rose-300"}`}>
                {result.dryRun ? "Dry-run complete" : "Live run complete"}
              </p>
              <p className="text-white/50">
                Scanned: {result.scanned ?? 0} · Eligible: {result.eligible ?? 0} · Published: {result.published ?? 0} · Skipped: {result.skipped ?? 0} · Failed: {result.failed ?? 0}
              </p>
              {result.requestId && <p className="font-mono text-white/25">{result.requestId}</p>}
            </div>
          ) : (
            <p className="text-rose-300">{result.error ?? "Unknown error"}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Pause panel ──────────────────────────────────────────────────────────────

function PausePanel({
  schedulerPaused,
  pausedReason,
}: {
  schedulerPaused: boolean;
  pausedReason: string | null;
}) {
  const [busy, setBusy] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [result, setResult] = React.useState<{ ok: boolean; error?: string; paused?: boolean } | null>(null);

  async function toggle() {
    if (!schedulerPaused && !reason.trim()) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/outbound/scheduler/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paused: !schedulerPaused,
          reason: schedulerPaused ? undefined : reason.trim(),
        }),
      });
      const data = await res.json();
      setResult(data);
      if (data.ok) {
        // Trigger page refresh to show new state
        setTimeout(() => window.location.reload(), 800);
      }
    } catch {
      setResult({ ok: false, error: "Network error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border border-white/10 bg-zinc-950/50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-white">{schedulerPaused ? "Resume scheduler" : "Pause scheduler"}</p>
        <AdminStatusBadge label="owner only" tone="warning" />
      </div>

      {schedulerPaused ? (
        <div>
          {pausedReason && (
            <p className="mb-3 text-xs text-amber-200/60">
              <PauseCircle className="inline h-3 w-3 mr-1" />
              Paused: {pausedReason}
            </p>
          )}
          <button
            onClick={toggle}
            disabled={busy}
            className="inline-flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-100 transition-colors hover:border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <PlayCircle className="h-3 w-3" />}
            Resume scheduler
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-white/40">Pausing prevents all automatic scheduling. Manual dry-runs still work. Reason required.</p>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Pause reason (required)"
            className="w-full border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-white/20 focus:border-rose-500/40 focus:outline-none"
          />
          <button
            onClick={toggle}
            disabled={busy || !reason.trim()}
            className="inline-flex items-center gap-2 border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs text-rose-100 transition-colors hover:border-rose-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <PauseCircle className="h-3 w-3" />}
            Pause scheduler
          </button>
        </div>
      )}

      {result && (
        <p className={`text-[10px] ${result.ok ? "text-emerald-400" : "text-rose-400"}`}>
          {result.ok ? (result.paused ? "Scheduler paused." : "Scheduler resumed.") : (result.error ?? "Error")}
        </p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OutboundSchedulerPage({
  isOwner,
  schedulerEnabled,
  schedulerPaused,
  schedulerPausedEnv,
  schedulerPausedDb,
  pausedReason,
  pausedByEmail,
  pausedAt,
  resumedAt,
  cronSecretConfigured,
  lock,
  recentRuns,
  providers,
  dueCount,
  duePosts,
  recentLedger,
  totalFailed24h,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {

  return (
    <AdminLayout title="Scheduler Control">
      <Head>
        <title>Scheduler Control | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="space-y-8">

        {/* Header */}
        <section className="border border-sky-400/15 bg-gradient-to-br from-sky-400/8 to-transparent p-6">
          <nav className="mb-3 flex items-center gap-2 text-xs text-white/35">
            <Link href="/admin" className="hover:text-white/70">Admin</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/admin/outbound" className="hover:text-white/70">Outbound Publishing</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white/60">Scheduler</span>
          </nav>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-serif text-3xl text-white">Scheduler Control</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
                Governed publish scheduler. All posts require <code className="mx-1 font-mono text-white/70">approvalStatus: approved</code> before any publish action enables. The scheduler never auto-approves.
              </p>
            </div>
            <Link
              href="/admin/outbound"
              className="shrink-0 inline-flex items-center gap-1 text-xs text-sky-300/60 hover:text-sky-200"
            >
              <Settings2 className="h-3 w-3" />
              Outbound index
            </Link>
          </div>
        </section>

        {/* State summary */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <AdminMetricCard
            label="Scheduler"
            value={schedulerEnabled ? "Enabled" : "Disabled"}
            tone={schedulerEnabled ? "warning" : "success"}
            detail={schedulerEnabled ? "Live publish possible" : "No auto-publish"}
          />
          <AdminMetricCard
            label="Pause state"
            value={schedulerPaused ? "Paused" : "Running"}
            tone={schedulerPaused ? "danger" : "success"}
            detail={schedulerPaused ? (schedulerPausedEnv ? "Env flag" : "DB override") : undefined}
          />
          <AdminMetricCard
            label="Due posts"
            value={dueCount < 0 ? "?" : dueCount}
            tone={dueCount > 0 ? "warning" : "muted"}
            detail="Scheduled items past scheduledFor"
          />
          <AdminMetricCard
            label="Failures (24h)"
            value={totalFailed24h}
            tone={totalFailed24h > 0 ? "danger" : "success"}
          />
        </div>

        {/* Scheduler state detail */}
        <section className="border border-white/10 bg-zinc-950/50 p-5 space-y-4">
          <h2 className="font-serif text-xl text-white">Scheduler state</h2>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="border border-white/5 bg-black/20 p-3">
              <p className="text-[8px] font-mono uppercase tracking-[0.18em] text-white/30">Scheduler enabled</p>
              <div className="mt-2">
                <AdminStatusBadge
                  label={schedulerEnabled ? "enabled" : "disabled"}
                  tone={schedulerEnabled ? "warning" : "success"}
                />
              </div>
              <p className="mt-1 text-[9px] text-white/25">OUTBOUND_SCHEDULER_ENABLED</p>
            </div>

            <div className="border border-white/5 bg-black/20 p-3">
              <p className="text-[8px] font-mono uppercase tracking-[0.18em] text-white/30">Env pause</p>
              <div className="mt-2">
                <AdminStatusBadge
                  label={schedulerPausedEnv ? "paused" : "not paused"}
                  tone={schedulerPausedEnv ? "danger" : "muted"}
                />
              </div>
              <p className="mt-1 text-[9px] text-white/25">OUTBOUND_SCHEDULER_PAUSED</p>
            </div>

            <div className="border border-white/5 bg-black/20 p-3">
              <p className="text-[8px] font-mono uppercase tracking-[0.18em] text-white/30">DB pause</p>
              <div className="mt-2">
                <AdminStatusBadge
                  label={schedulerPausedDb ? "paused" : "not paused"}
                  tone={schedulerPausedDb ? "danger" : "muted"}
                />
              </div>
              <p className="mt-1 text-[9px] text-white/25">outbound_control_state</p>
            </div>

            <div className="border border-white/5 bg-black/20 p-3">
              <p className="text-[8px] font-mono uppercase tracking-[0.18em] text-white/30">CRON secret</p>
              <div className="mt-2">
                <AdminStatusBadge
                  label={cronSecretConfigured ? "configured" : "missing"}
                  tone={cronSecretConfigured ? "success" : "danger"}
                />
              </div>
              <p className="mt-1 text-[9px] text-white/25">CRON_SECRET (value hidden)</p>
            </div>

            <div className="border border-white/5 bg-black/20 p-3">
              <p className="text-[8px] font-mono uppercase tracking-[0.18em] text-white/30">Scheduler lock</p>
              <div className="mt-2">
                <AdminStatusBadge
                  label={lock.active ? "held" : "free"}
                  tone={lock.active ? "warning" : "muted"}
                />
              </div>
              {lock.active && (
                <p className="mt-1 text-[9px] text-amber-300/60">
                  <Lock className="inline h-2.5 w-2.5 mr-0.5" />
                  Expires {fmt(lock.expiresAt)}
                  {lock.holder && ` · ${lock.holder}`}
                </p>
              )}
            </div>

            <div className="border border-white/5 bg-black/20 p-3">
              <p className="text-[8px] font-mono uppercase tracking-[0.18em] text-white/30">Access level</p>
              <div className="mt-2">
                <AdminStatusBadge
                  label={isOwner ? "owner" : "admin"}
                  tone={isOwner ? "warning" : "muted"}
                />
              </div>
              <p className="mt-1 text-[9px] text-white/25">Live-run requires OWNER</p>
            </div>
          </div>

          {schedulerPaused && (
            <div className="border border-amber-500/15 bg-amber-500/5 p-3">
              <p className="text-xs text-amber-200/70">
                <PauseCircle className="inline h-3 w-3 mr-1" />
                {pausedReason ? `Pause reason: ${pausedReason}` : "No pause reason recorded."}
              </p>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[10px] text-white/30">
                {pausedByEmail && <span>By: {pausedByEmail}</span>}
                {pausedAt && <span>At: {fmt(pausedAt)}</span>}
                {resumedAt && <span>Last resumed: {fmt(resumedAt)}</span>}
              </div>
            </div>
          )}
        </section>

        {/* Provider failure summary */}
        <section className="border border-white/10 bg-zinc-950/50 p-5 space-y-4">
          <h2 className="font-serif text-xl text-white">Failure summary (24h)</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {providers.map((p) => (
              <div key={p.provider} className="border border-white/5 bg-black/20 p-3 space-y-2">
                <p className="font-mono text-xs text-white/60 uppercase">{p.provider}</p>
                <AdminStatusBadge
                  label={`${p.failureCount24h} failures`}
                  tone={p.failureCount24h === 0 ? "success" : p.failureCount24h < 3 ? "warning" : "danger"}
                />
                <div className="text-[9px] text-white/30 space-y-0.5">
                  <p><Clock className="inline h-2.5 w-2.5 mr-0.5" />Last success: {fmt(p.lastSuccessAt)}</p>
                  {p.failureCount24h > 0 && (
                    <p className="text-rose-300/60"><AlertCircle className="inline h-2.5 w-2.5 mr-0.5" />Last failure: {fmt(p.lastFailureAt)}</p>
                  )}
                  {p.lastDryRunAt && <p>Last dry-run: {fmt(p.lastDryRunAt)}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Due queue */}
        {dueCount > 0 && (
          <section className="border border-amber-500/15 bg-amber-500/[0.03] p-5 space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="font-serif text-xl text-white">Due queue</h2>
              <AdminStatusBadge label={`${dueCount} due`} tone="warning" />
            </div>
            <p className="text-xs text-white/40">
              Posts past their <code className="font-mono">scheduledFor</code> timestamp. These are candidates for the next scheduler run.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10">
                    {["Provider", "Campaign", "Status", "Approval", "Scheduled for"].map((h) => (
                      <th key={h} className="py-2 pr-4 text-left font-mono text-[9px] uppercase tracking-wider text-white/30">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {duePosts.map((p) => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-2 pr-4 font-mono text-white/60">{p.provider}</td>
                      <td className="py-2 pr-4 text-white/40">{p.campaign ?? "—"}</td>
                      <td className="py-2 pr-4">
                        <AdminStatusBadge label={p.status} tone={p.status === "scheduled" ? "info" : "muted"} />
                      </td>
                      <td className="py-2 pr-4">
                        <AdminStatusBadge
                          label={p.approvalStatus}
                          tone={p.approvalStatus === "approved" ? "success" : p.approvalStatus === "needs_review" ? "warning" : "danger"}
                        />
                      </td>
                      <td className="py-2 pr-4 whitespace-nowrap text-white/40">{fmt(p.scheduledFor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {dueCount > duePosts.length && (
                <p className="mt-2 text-[10px] text-white/25">…and {dueCount - duePosts.length} more</p>
              )}
            </div>
          </section>
        )}

        {/* Actions */}
        <section className="border border-white/10 bg-zinc-950/50 p-5 space-y-4">
          <h2 className="font-serif text-xl text-white">Actions</h2>
          <SchedulerActionPanel
            isOwner={isOwner}
            schedulerEnabled={schedulerEnabled}
            schedulerPaused={schedulerPaused}
            lockActive={lock.active}
          />
        </section>

        {/* Pause control (OWNER only) */}
        {isOwner && (
          <section className="border border-white/10 bg-zinc-950/50 p-5 space-y-4">
            <h2 className="font-serif text-xl text-white">Pause control</h2>
            <PausePanel schedulerPaused={schedulerPaused} pausedReason={pausedReason} />
          </section>
        )}

        {/* Recent runs */}
        {recentRuns.length > 0 && (
          <section className="border border-white/10 bg-zinc-950/50 p-5 space-y-4">
            <h2 className="font-serif text-xl text-white">Recent runs</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10">
                    {["Mode", "Source", "Status", "Scanned", "Eligible", "Published", "Skipped", "Failed", "Started"].map((h) => (
                      <th key={h} className="py-2 pr-4 text-left font-mono text-[9px] uppercase tracking-wider text-white/30">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentRuns.map((run) => (
                    <tr key={run.runKey} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-2 pr-4">
                        <AdminStatusBadge
                          label={run.dryRun ? "dry-run" : "live"}
                          tone={run.dryRun ? "info" : "warning"}
                        />
                      </td>
                      <td className="py-2 pr-4 text-white/40">{run.source}</td>
                      <td className="py-2 pr-4">
                        <AdminStatusBadge label={run.status} tone={runStatusTone(run.status)} />
                      </td>
                      <td className="py-2 pr-4 text-white/40">{run.scanned}</td>
                      <td className="py-2 pr-4 text-white/40">{run.eligible}</td>
                      <td className="py-2 pr-4 text-emerald-400/70">{run.published}</td>
                      <td className="py-2 pr-4 text-white/30">{run.skipped}</td>
                      <td className="py-2 pr-4 text-rose-400/70">{run.failed}</td>
                      <td className="py-2 pr-4 whitespace-nowrap text-white/40">{fmt(run.startedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Recent publish ledger */}
        <section className="border border-white/10 bg-zinc-950/50 p-5">
          <OutboundLedgerTable
            entries={recentLedger}
            title="Recent Publish Activity"
            emptyMessage="No publish ledger entries yet."
            maxRows={10}
          />
        </section>

        {/* Safety notice */}
        <section className="border border-white/5 bg-zinc-950/30 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-4 w-4 text-white/20 mt-0.5 shrink-0" />
            <div className="space-y-1 text-[10px] text-white/30">
              <p>Scheduler never auto-approves. All posts must have <code className="font-mono">approvalStatus: approved</code> before any publish gate passes.</p>
              <p>Ready items are not scheduled items. Ready means content-complete and approval-eligible — not queued for automatic publish.</p>
              <p>Disabled scheduler means no automatic publishing occurs, regardless of post status or approval state.</p>
              <p>Live run is OWNER-only. Dry-run is safe for all admins and produces no public posts.</p>
              {!schedulerEnabled && (
                <p className="flex items-center gap-1 text-emerald-400/60">
                  <CheckCircle2 className="h-3 w-3" />
                  OUTBOUND_SCHEDULER_ENABLED is false — no automatic publishing is active.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
