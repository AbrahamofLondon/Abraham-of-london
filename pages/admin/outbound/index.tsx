/**
 * pages/admin/outbound/index.tsx
 *
 * Outbound publishing command index.
 * Shows provider readiness, queue depth, failure summary, and recent ledger
 * entries for LinkedIn, Facebook, and X — all from server-side data.
 *
 * Navigation:
 *   /admin/outbound/linkedin
 *   /admin/outbound/facebook
 *   /admin/outbound/x
 *   /admin/outbound/scheduler
 *
 * Admin-only. No token values exposed.
 */

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  PauseCircle,
  Settings2,
  XCircle,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import { AdminStatusBadge, type AdminBadgeTone } from "@/components/admin/AdminStatusBadge";
import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { requireAdminPage } from "@/lib/access/server";
import {
  getOutboundPostsByProvider,
} from "@/lib/outbound/outbound-content-loader";
import { getRecentLedgerEntries, getFailureSummary } from "@/lib/outbound/core/outbound-publish-ledger";
import { getOutboundControlState } from "@/lib/outbound/core/outbound-control-state";
import OutboundLedgerTable, { type LedgerEntry } from "@/components/admin/outbound/OutboundLedgerTable";
import { getFacebookConnectionStatus } from "@/lib/outbound/facebook-oauth";
import { getConnectionStatus, getLinkedInOAuthSmokeDiagnostics } from "@/lib/outbound/linkedin-oauth";
import { getXConnectionStatus } from "@/lib/outbound/x-oauth";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProviderCard = {
  provider: "linkedin" | "facebook" | "x";
  label: string;
  href: string;
  total: number;
  draft: number;
  ready: number;
  scheduled: number;
  published: number;
  failed: number;
  pendingReview: number;
  approved: number;
  failureCount24h: number;
  lastFailureAt: string | null;
  lastSuccessAt: string | null;
  lastDryRunAt: string | null;
};

type PageProps = {
  providers: ProviderCard[];
  readinessMatrix: OutboundReadinessRow[];
  schedulerEnabled: boolean;
  schedulerPaused: boolean;
  pausedReason: string | null;
  recentLedger: LedgerEntry[];
};

type OutboundReadinessRow = {
  channel: "LinkedIn" | "Facebook" | "X";
  oauth: string;
  tokenStorage: string;
  permissionCheck: string;
  publishGate: string;
  publishLive: "Yes" | "No";
  state: string;
  blockers: string[];
};

// ─── Server-side ──────────────────────────────────────────────────────────────

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const guard = await requireAdminPage(ctx);
  if (!guard.authorized) return guard.redirect as never;

  const [
    liPosts,
    fbPosts,
    xPosts,
    liLedger,
    fbLedger,
    xLedger,
    liFail,
    fbFail,
    xFail,
    controlState,
    liStatus,
    liSmoke,
    fbStatus,
    xStatus,
  ] =
    await Promise.all([
      Promise.resolve(getOutboundPostsByProvider("linkedin")),
      Promise.resolve(getOutboundPostsByProvider("facebook")),
      Promise.resolve(getOutboundPostsByProvider("x")),
      getRecentLedgerEntries("linkedin", 6).catch(() => []),
      getRecentLedgerEntries("facebook", 6).catch(() => []),
      getRecentLedgerEntries("x", 6).catch(() => []),
      getFailureSummary("linkedin", 24).catch(() => null),
      getFailureSummary("facebook", 24).catch(() => null),
      getFailureSummary("x", 24).catch(() => null),
      getOutboundControlState().catch(() => ({ schedulerPaused: false, pausedReason: null, resumedAt: null, pausedAt: null, pausedById: null, pausedByEmail: null, updatedAt: new Date() })),
      getConnectionStatus(),
      getLinkedInOAuthSmokeDiagnostics(),
      getFacebookConnectionStatus(),
      getXConnectionStatus(),
    ]);

  function buildCard(
    provider: ProviderCard["provider"],
    label: string,
    href: string,
    result: ReturnType<typeof getOutboundPostsByProvider>,
    fail: Awaited<ReturnType<typeof getFailureSummary>> | null,
  ): ProviderCard {
    const posts = result.posts;
    return {
      provider,
      label,
      href,
      total: posts.length,
      draft: posts.filter((p) => p.status === "draft").length,
      ready: posts.filter((p) => p.status === "ready").length,
      scheduled: posts.filter((p) => p.status === "scheduled").length,
      published: posts.filter((p) => p.status === "published").length,
      failed: posts.filter((p) => p.status === "rejected").length,
      pendingReview: posts.filter((p) => p.approvalStatus === "needs_review").length,
      approved: posts.filter((p) => p.approvalStatus === "approved").length,
      failureCount24h: fail?.failureCount ?? 0,
      lastFailureAt: fail?.lastFailure ? new Date(fail.lastFailure.createdAt).toISOString() : null,
      lastSuccessAt: fail?.lastSuccess ? new Date(fail.lastSuccess.createdAt).toISOString() : null,
      lastDryRunAt: fail?.lastDryRun ? new Date(fail.lastDryRun.createdAt).toISOString() : null,
    };
  }

  const allLedger = [...liLedger, ...fbLedger, ...xLedger]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 12);

  return {
    props: {
      providers: [
        buildCard("linkedin", "LinkedIn", "/admin/outbound/linkedin", liPosts, liFail),
        buildCard("facebook", "Facebook", "/admin/outbound/facebook", fbPosts, fbFail),
        buildCard("x", "X (Twitter)", "/admin/outbound/x", xPosts, xFail),
      ],
      readinessMatrix: [
        {
          channel: "LinkedIn",
          oauth: liStatus.connected ? "Connected" : liSmoke.configured ? "Ready to connect" : "Configuration required",
          tokenStorage: liSmoke.tokenRecordExists ? (liSmoke.tokenExpired ? "Token expired" : "Token stored") : "Required",
          permissionCheck:
            liStatus.selectedPublishingTarget.status === "ready"
              ? "Passed"
              : liStatus.selectedPublishingTarget.status,
          publishGate: "Required",
          publishLive:
            liStatus.connected &&
            liStatus.selectedPublishingTarget.status === "ready" &&
            liStatus.publishingEnabled
              ? "Yes"
              : "No",
          state: liSmoke.readiness,
          blockers: [
            ...liSmoke.missingEnv,
            ...(liStatus.selectedPublishingTarget.status !== "ready"
              ? [liStatus.selectedPublishingTarget.status]
              : []),
            ...(liStatus.publishingEnabled ? [] : ["LINKEDIN_PUBLISHING_ENABLED is not true"]),
          ],
        },
        {
          channel: "Facebook",
          oauth: fbStatus.oauthConfigured ? (fbStatus.connected ? "Connected" : "Ready to connect") : "Configuration required",
          tokenStorage: fbStatus.connected ? "Token stored or env token present" : "Required",
          permissionCheck:
            fbStatus.missingPermissions.length === 0
              ? "Passed"
              : `Missing: ${fbStatus.missingPermissions.join(", ")}`,
          publishGate: "Required",
          publishLive:
            fbStatus.canPublish && process.env.FACEBOOK_PUBLISHING_ENABLED === "true"
              ? "Yes"
              : "No",
          state: fbStatus.readiness,
          blockers: [
            ...(fbStatus.oauthConfigured ? [] : ["Facebook OAuth configuration required"]),
            ...fbStatus.missingPermissions,
            ...(process.env.FACEBOOK_PUBLISHING_ENABLED === "true"
              ? []
              : ["FACEBOOK_PUBLISHING_ENABLED is not true"]),
          ],
        },
        {
          channel: "X",
          oauth: xStatus.oauthConfigured ? (xStatus.connected ? "Connected" : "Ready to connect") : "Configuration required",
          tokenStorage: xStatus.connected ? "Token stored" : "Required",
          permissionCheck:
            xStatus.missingScopes.length === 0
              ? "Passed"
              : `Missing: ${xStatus.missingScopes.join(", ")}`,
          publishGate: "Required",
          publishLive:
            xStatus.canPublish && process.env.X_PUBLISHING_ENABLED === "true"
              ? "Yes"
              : "No",
          state: xStatus.readiness,
          blockers: [
            ...(xStatus.oauthConfigured ? [] : ["X OAuth configuration required"]),
            ...xStatus.missingScopes,
            ...(process.env.X_PUBLISHING_ENABLED === "true"
              ? []
              : ["X_PUBLISHING_ENABLED is not true"]),
          ],
        },
      ],
      schedulerEnabled: process.env.OUTBOUND_SCHEDULER_ENABLED === "true",
      schedulerPaused: controlState.schedulerPaused || process.env.OUTBOUND_SCHEDULER_PAUSED === "true",
      pausedReason: controlState.pausedReason,
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
    },
  };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function failTone(count: number): AdminBadgeTone {
  if (count === 0) return "success";
  if (count < 3) return "warning";
  return "danger";
}

function liveTone(value: OutboundReadinessRow["publishLive"]): AdminBadgeTone {
  return value === "Yes" ? "success" : "danger";
}

function stateTone(state: string): AdminBadgeTone {
  if (state === "READY" || state === "CONNECTED") return "success";
  if (state === "READY_TO_CONNECT") return "info";
  if (state === "CONFIG_MISSING" || state === "ORG_URN_MISSING") return "warning";
  return "danger";
}

function OutboundReadinessMatrix({ rows }: { rows: OutboundReadinessRow[] }) {
  return (
    <section className="border border-white/10 bg-zinc-950/50 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-serif text-xl text-white">Outbound Readiness Matrix</h2>
          <p className="mt-1 max-w-3xl text-sm text-white/45">
            Code existence is not readiness. A channel is live only when OAuth, token storage,
            permission checks, publish gating, and explicit publishing enablement all pass.
          </p>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-xs">
          <thead className="border-b border-white/10 text-white/35">
            <tr>
              <th className="py-3 pr-4 font-medium">Channel</th>
              <th className="py-3 pr-4 font-medium">OAuth</th>
              <th className="py-3 pr-4 font-medium">Token storage</th>
              <th className="py-3 pr-4 font-medium">Permission check</th>
              <th className="py-3 pr-4 font-medium">Publish gate</th>
              <th className="py-3 pr-4 font-medium">Publish live</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((row) => (
              <tr key={row.channel} className="align-top">
                <td className="py-3 pr-4">
                  <div className="font-medium text-white">{row.channel}</div>
                  <div className="mt-1">
                    <AdminStatusBadge label={row.state} tone={stateTone(row.state)} />
                  </div>
                </td>
                <td className="py-3 pr-4 text-white/65">{row.oauth}</td>
                <td className="py-3 pr-4 text-white/65">{row.tokenStorage}</td>
                <td className="py-3 pr-4 text-white/65">{row.permissionCheck}</td>
                <td className="py-3 pr-4 text-white/65">{row.publishGate}</td>
                <td className="py-3 pr-4">
                  <AdminStatusBadge label={row.publishLive} tone={liveTone(row.publishLive)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {rows.map((row) => (
          <div key={`${row.channel}-blockers`} className="border border-white/10 bg-black/20 p-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium text-white">{row.channel}</h3>
              <AdminStatusBadge label={row.publishLive === "Yes" ? "Live" : "Blocked"} tone={liveTone(row.publishLive)} />
            </div>
            {row.publishLive === "No" && row.channel !== "LinkedIn" && (
              <p className="mt-2 text-xs leading-5 text-amber-100/65">
                This channel is not ready for publishing. Complete configuration before connection or publishing is available.
              </p>
            )}
            {row.blockers.length > 0 ? (
              <ul className="mt-2 space-y-1 text-[11px] leading-5 text-white/40">
                {row.blockers.slice(0, 5).map((blocker) => (
                  <li key={blocker}>{blocker}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-emerald-200/55">No current blockers reported.</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Provider card ────────────────────────────────────────────────────────────

function ProviderCard({ card }: { card: ProviderCard }) {
  const hasFailures = card.failureCount24h > 0;

  return (
    <div className="border border-white/10 bg-black/25 p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-serif text-2xl text-white">{card.label}</h2>
          <p className="mt-1 text-xs text-white/35">{card.total} total posts in queue</p>
        </div>
        <Link
          href={card.href}
          className="inline-flex items-center gap-1 border border-white/10 px-3 py-1.5 text-xs text-white/55 hover:text-white transition-colors"
        >
          Console <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        <AdminMetricCard label="Ready" value={card.ready} variant="inner" tone={card.ready > 0 ? "success" : "muted"} />
        <AdminMetricCard label="Scheduled" value={card.scheduled} variant="inner" tone={card.scheduled > 0 ? "info" : "muted"} />
        <AdminMetricCard label="Pending review" value={card.pendingReview} variant="inner" tone={card.pendingReview > 0 ? "warning" : "muted"} />
        <AdminMetricCard label="Approved" value={card.approved} variant="inner" tone={card.approved > 0 ? "success" : "muted"} />
        <AdminMetricCard label="Published" value={card.published} variant="inner" />
        <AdminMetricCard label="24h failures" value={card.failureCount24h} variant="inner" tone={failTone(card.failureCount24h)} />
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-[10px] text-white/35">
        <span><Clock className="inline h-3 w-3 mr-1" />Last success: {fmt(card.lastSuccessAt)}</span>
        {hasFailures && (
          <span className="text-rose-300/60"><AlertCircle className="inline h-3 w-3 mr-1" />Last failure: {fmt(card.lastFailureAt)}</span>
        )}
        {card.lastDryRunAt && (
          <span>Last dry-run: {fmt(card.lastDryRunAt)}</span>
        )}
      </div>

      {card.provider === "linkedin" && (
        <div className="border-t border-white/5 pt-3">
          <Link
            href="/admin/outbound/linkedin/campaigns/the-burden-changes-hands"
            className="inline-flex items-center gap-2 text-xs text-sky-300/60 hover:text-sky-200 transition-colors"
          >
            <ChevronRight className="h-3 w-3" />
            Campaign: The Burden Changes Hands ({card.pendingReview} pending review)
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OutboundIndexPage({
  providers,
  readinessMatrix,
  schedulerEnabled,
  schedulerPaused,
  pausedReason,
  recentLedger,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const totalFailed24h = providers.reduce((n, p) => n + p.failureCount24h, 0);
  const totalPendingReview = providers.reduce((n, p) => n + p.pendingReview, 0);
  const totalScheduled = providers.reduce((n, p) => n + p.scheduled, 0);

  return (
    <AdminLayout title="Outbound Publishing">
      <Head>
        <title>Outbound Publishing | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div className="space-y-8">

        {/* Header */}
        <section className="border border-sky-400/15 bg-gradient-to-br from-sky-400/8 to-transparent p-6">
          <nav className="mb-3 flex items-center gap-2 text-xs text-white/35">
            <Link href="/admin" className="hover:text-white/70">Admin</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white/60">Outbound Publishing</span>
          </nav>
          <h1 className="font-serif text-3xl text-white">Outbound Publishing</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/50">
            LinkedIn, Facebook, and X governed publish queues. All posts require
            <code className="mx-1 font-mono text-white/70">approvalStatus: approved</code>
            before any publish action enables.
          </p>

          {/* Scheduler state strip */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <AdminStatusBadge
              label={schedulerEnabled ? "Scheduler enabled" : "Scheduler disabled"}
              tone={schedulerEnabled ? "warning" : "success"}
            />
            {schedulerPaused && (
              <AdminStatusBadge label="Paused" tone="danger" />
            )}
            <Link
              href="/admin/outbound/scheduler"
              className="inline-flex items-center gap-1 text-xs text-sky-300/60 hover:text-sky-200"
            >
              <Settings2 className="h-3 w-3" />
              Scheduler control
            </Link>
          </div>

          {schedulerPaused && pausedReason && (
            <p className="mt-3 text-xs text-amber-200/60">
              <PauseCircle className="mr-1 inline h-3 w-3" />
              Pause reason: {pausedReason}
            </p>
          )}
        </section>

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-3">
          <AdminMetricCard
            label="Pending review"
            value={totalPendingReview}
            tone={totalPendingReview > 0 ? "warning" : "success"}
          />
          <AdminMetricCard
            label="Scheduled items"
            value={totalScheduled}
            tone={totalScheduled > 0 ? "info" : "muted"}
          />
          <AdminMetricCard
            label="Failures (24h)"
            value={totalFailed24h}
            tone={totalFailed24h > 0 ? "danger" : "success"}
          />
        </div>

        <OutboundReadinessMatrix rows={readinessMatrix} />

        {/* Provider cards */}
        <div className="space-y-4">
          {providers.map((card) => (
            <ProviderCard key={card.provider} card={card} />
          ))}
        </div>

        {/* Scheduler link */}
        <section className="border border-white/10 bg-zinc-950/50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl text-white">Scheduler</h2>
              <p className="mt-1 text-sm text-white/40">
                {schedulerEnabled
                  ? "Scheduler enabled — no auto-publish until items are approved."
                  : "Scheduler disabled — no posts will auto-publish."}
                {" "}
                {schedulerPaused && "Scheduler is currently paused."}
              </p>
            </div>
            <Link
              href="/admin/outbound/scheduler"
              className="inline-flex items-center gap-2 border border-sky-400/20 bg-sky-400/5 px-4 py-2 text-xs text-sky-100 hover:border-sky-400/40"
            >
              Open scheduler <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-xs">
            {schedulerEnabled
              ? <span className="flex items-center gap-1 text-amber-200/60"><AlertCircle className="h-3 w-3" />Scheduler enabled but no auto-publish until OWNER approves and enables</span>
              : <span className="flex items-center gap-1 text-emerald-300/60"><CheckCircle2 className="h-3 w-3" />Scheduler disabled — safe</span>}
            {schedulerPaused
              ? <span className="flex items-center gap-1 text-rose-300/60"><XCircle className="h-3 w-3" />Paused</span>
              : null}
          </div>
        </section>

        {/* Recent ledger */}
        <section className="border border-white/10 bg-zinc-950/50 p-5">
          <OutboundLedgerTable
            entries={recentLedger}
            title="Recent Publish Activity"
            emptyMessage="No publish ledger entries yet."
            maxRows={12}
          />
        </section>
      </div>
    </AdminLayout>
  );
}
