/**
 * pages/admin/outbound/x.tsx
 *
 * X (Twitter) publishing console.
 * Admin-only. Server-side rendered. Token never surfaced in UI or props.
 *
 * Sections:
 *   1. Connection status + OAuth action
 *   2. Scopes + account identity
 *   3. Asset selector with tweet preview + character count
 *   4. Sync to Facebook option (bidirectional)
 *   5. Final approval gate + publish action
 *   6. Attempt history
 */

import * as React from "react";
import Head from "next/head";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import {
  CheckCircle,
  ExternalLink,
  Loader2,
  Send,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { AdminStatusBadge, type AdminBadgeTone } from "@/components/admin/AdminStatusBadge";
import { requireAdminPage } from "@/lib/access/server";
import { prisma } from "@/lib/prisma.server";
import { getXConnectionStatus } from "@/lib/outbound/x-oauth";
import {
  getAllXPublishableAssets,
} from "@/lib/outbound/x-content-resolver";
import { getOutboundDraftXAssets } from "@/lib/outbound/x-outbound-adapter";
import {
  getBulkPublishStatus,
  type LedgerStatusSnapshot,
} from "@/lib/outbound/core/outbound-publish-ledger";
import { canPublishXPost } from "@/lib/outbound/x-publish-gate";
import { countTweetChars } from "@/lib/outbound/x-publish-gate";
import { getFacebookConnectionStatus } from "@/lib/outbound/facebook-oauth";
import type { XConnectionStatus, XPublishedAsset } from "@/lib/outbound/x-types";
import { X_TWEET_MAX_CHARS } from "@/lib/outbound/x-types";

// ─── Types ────────────────────────────────────────────────────────────────────

type AssetViewModel = {
  slug: string;
  assetType: string;
  title: string;
  text: string;
  link: string | null;
  charCount: number;
  publishable: boolean;
  blockers: string[];
  warnings: string[];
  // Outbound-draft specific fields (only present for outbound-x assets)
  outboundStatus?: string;
  outboundApprovalStatus?: string;
  campaign?: string | null;
  postType?: string;
  scheduledFor?: string | null;
  // Ledger-enriched publish state (from outboundPublishLedger)
  publishLedgerStatus?: LedgerStatusSnapshot["status"] | null;
  providerPostUrl?: string | null;
  lastPublishedAt?: string | null;
};

type OutboundDiscoverySummary = {
  discoveredCount: number;
  acceptedCount: number;
  publishableCount: number;
  blockedCount: number;
  excludedCount: number;
  excludedReasons: Record<string, number>;
};

type AttemptSummary = {
  assetSlug: string;
  assetTitle: string;
  status: string;
  tweetId: string | null;
  tweetUrl: string | null;
  syncedFromFacebook: boolean;
  dryRun: boolean;
  errorCode: string | null;
  errorMessageSafe: string | null;
  requestId: string;
  createdAt: string;
  completedAt: string | null;
};

type ConsoleViewModel = {
  connection: XConnectionStatus;
  assets: AssetViewModel[];                    // blog-series assets
  outboundAssets: AssetViewModel[];            // recursive outbound draft queue
  outboundDiscovery: OutboundDiscoverySummary;
  attempts: AttemptSummary[];
  facebookConnected: boolean;
  publishingEnabled: boolean;
  hasCreditBlocker: boolean;
  /** true when hasCreditBlocker — convenience alias used by child components */
  creditBlocked: boolean;
};

// ─── getServerSideProps ───────────────────────────────────────────────────────

export const getServerSideProps: GetServerSideProps<{
  consoleState: ConsoleViewModel;
  flashError: string | null;
  flashConnected: boolean;
}> = async (ctx) => {
  const guard = await requireAdminPage(ctx);
  if (!guard.authorized) return guard.redirect as never;

  const flashError =
    typeof ctx.query.error === "string" ? ctx.query.error : null;
  const flashConnected = ctx.query.connected === "1";

  const [connection, rawAssets, fbStatus, outboundDraftResult, publishStatusMap] = await Promise.all([
    getXConnectionStatus(),
    Promise.resolve(getAllXPublishableAssets()),
    getFacebookConnectionStatus(),
    Promise.resolve(getOutboundDraftXAssets()),
    getBulkPublishStatus("x").catch(() => new Map<string, LedgerStatusSnapshot>()),
  ]);
  const facebookConnected = fbStatus.canPublish && process.env.FACEBOOK_PUBLISHING_ENABLED === "true";

  const assets: AssetViewModel[] = rawAssets.map((asset: XPublishedAsset) => {
    const gate = canPublishXPost(asset, connection);
    const ledger = publishStatusMap.get(asset.slug) ?? null;
    return {
      slug: asset.slug,
      assetType: asset.assetType,
      title: asset.title,
      text: asset.text,
      link: asset.link,
      charCount: countTweetChars(asset.text),
      publishable: ledger?.status === "PUBLISHED" ? false : gate.allowed,
      blockers: ledger?.status === "PUBLISHED"
        ? ["Already published — duplicate publish blocked."]
        : gate.blockers,
      warnings: gate.warnings,
      publishLedgerStatus: ledger?.status ?? null,
      providerPostUrl: ledger?.providerPostUrl ?? null,
      lastPublishedAt: ledger?.completedAt ?? null,
    };
  });

  assets.sort((a, b) => {
    if (a.publishable && !b.publishable) return -1;
    if (!a.publishable && b.publishable) return 1;
    return a.title.localeCompare(b.title);
  });

  const outboundAssets: AssetViewModel[] = outboundDraftResult.posts.map((post, i) => {
    const asset = outboundDraftResult.assets[i]!;
    const gate = canPublishXPost(asset, connection);
    const ledger = publishStatusMap.get(post.id) ?? null;
    const alreadyPublished = ledger?.status === "PUBLISHED";
    return {
      slug: asset.slug,
      assetType: asset.assetType,
      title: asset.title,
      text: asset.text,
      link: asset.link,
      charCount: countTweetChars(asset.text),
      publishable: alreadyPublished ? false : gate.allowed,
      blockers: alreadyPublished
        ? ["Already published — duplicate publish blocked."]
        : gate.blockers,
      warnings: gate.warnings,
      outboundStatus: post.status,
      outboundApprovalStatus: post.approvalStatus,
      campaign: post.campaign,
      postType: post.postType,
      scheduledFor: post.scheduledFor,
      publishLedgerStatus: ledger?.status ?? null,
      providerPostUrl: ledger?.providerPostUrl ?? null,
      lastPublishedAt: ledger?.completedAt ?? null,
    };
  });

  // Priority sort — operators must see items that need attention first:
  //  0. IN_PROGRESS  — active publish in flight
  //  1. FAILED       — needs retry or investigation
  //  2. DRY_RUN      — gate passed, ready for live publish
  //  3. approved + scheduled/ready — next logical publish candidates
  //  4. approved (any status)
  //  5. ready/scheduled (not yet approved)
  //  6. everything else — alphabetical
  function outboundSortPriority(a: AssetViewModel): number {
    if (a.publishLedgerStatus === "IN_PROGRESS") return 0;
    if (a.publishLedgerStatus === "FAILED") return 1;
    if (a.publishLedgerStatus === "DRY_RUN") return 2;
    if (a.outboundApprovalStatus === "approved" &&
        (a.outboundStatus === "scheduled" || a.outboundStatus === "ready")) return 3;
    if (a.outboundApprovalStatus === "approved") return 4;
    if (a.outboundStatus === "scheduled" || a.outboundStatus === "ready") return 5;
    return 6;
  }

  outboundAssets.sort((a, b) => {
    const pa = outboundSortPriority(a);
    const pb = outboundSortPriority(b);
    if (pa !== pb) return pa - pb;
    // Within same priority group: scheduledFor ascending, unscheduled last
    if (a.scheduledFor && b.scheduledFor) return a.scheduledFor.localeCompare(b.scheduledFor);
    if (a.scheduledFor) return -1;
    if (b.scheduledFor) return 1;
    return a.title.localeCompare(b.title);
  });

  const outboundResult = outboundDraftResult.result;
  const excludedReasons: Record<string, number> = {};
  for (const ex of outboundResult.excluded) {
    excludedReasons[ex.reason] = (excludedReasons[ex.reason] ?? 0) + 1;
  }
  const outboundDiscovery: OutboundDiscoverySummary = {
    discoveredCount: outboundResult.discoveredCount,
    acceptedCount: outboundResult.acceptedCount,
    publishableCount: outboundAssets.filter((a) => a.publishable).length,
    blockedCount: outboundAssets.filter((a) => !a.publishable).length,
    excludedCount: outboundResult.excludedCount,
    excludedReasons,
  };

  let attempts: AttemptSummary[] = [];
  try {
    const rows = await prisma.xPublishAttempt.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
    });
    attempts = rows.map((row) => ({
      assetSlug: row.assetSlug,
      assetTitle: row.assetTitle,
      status: row.status,
      tweetId: row.tweetId,
      tweetUrl: row.tweetUrl,
      syncedFromFacebook: row.syncedFromFacebook,
      dryRun: row.dryRun,
      errorCode: row.errorCode,
      errorMessageSafe: row.errorMessageSafe,
      requestId: row.requestId,
      createdAt: row.createdAt.toISOString(),
      completedAt: row.completedAt?.toISOString() ?? null,
    }));
  } catch {
    attempts = [];
  }

  const hasCreditBlocker = attempts.some((a) => a.errorCode === "X_CREDIT_BLOCKED");

  // Augment connection readiness to CREDIT_BLOCKED when detected.
  // OAuth + tweet.write remain valid — this is a billing issue only.
  const augmentedConnection = hasCreditBlocker
    ? { ...connection, readiness: "CREDIT_BLOCKED" as const }
    : connection;

  return {
    props: {
      consoleState: {
        connection: augmentedConnection,
        assets,
        outboundAssets,
        outboundDiscovery,
        attempts,
        facebookConnected,
        publishingEnabled: process.env.X_PUBLISHING_ENABLED === "true",
        hasCreditBlocker,
        creditBlocked: hasCreditBlocker,
      },
      flashError,
      flashConnected,
    },
  };
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function readinessTone(readiness: XConnectionStatus["readiness"]): AdminBadgeTone {
  if (readiness === "READY") return "success";
  if (readiness === "READY_TO_CONNECT") return "info";
  if (readiness === "CREDIT_BLOCKED") return "warning";
  if (readiness === "MISSING_SCOPE") return "danger";
  if (readiness === "TOKEN_INVALID") return "danger";
  if (readiness === "CONFIG_MISSING") return "warning";
  return "muted";
}

function ConnectionPanel({
  connection,
  publishingEnabled,
}: {
  connection: XConnectionStatus;
  publishingEnabled: boolean;
}) {
  return (
    <section className="border border-white/10 bg-zinc-950/70 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/35">
            Connection status
          </p>
          <h2 className="mt-2 font-serif text-2xl text-white">
            X (Twitter) publishing
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">
            <AdminStatusBadge
              label={connection.connected ? "Connected" : "Not connected"}
              tone={connection.connected ? "success" : "warning"}
            />
            <AdminStatusBadge
              label={`State: ${connection.state}`}
              tone={connection.state === "oauth" ? "success" : "muted"}
            />
            <AdminStatusBadge
              label={`Readiness: ${connection.readiness}`}
              tone={readinessTone(connection.readiness)}
            />
            <AdminStatusBadge
              label={
                connection.readiness === "CREDIT_BLOCKED"
                  ? "Credits exhausted"
                  : publishingEnabled && connection.canPublish
                  ? "Can tweet"
                  : "Publishing blocked"
              }
              tone={
                connection.readiness === "CREDIT_BLOCKED"
                  ? "warning"
                  : publishingEnabled && connection.canPublish
                  ? "success"
                  : "danger"
              }
            />
          </div>

          {!publishingEnabled && (
            <div className="mt-4 border border-rose-400/20 bg-rose-400/5 p-3">
              <p className="text-sm text-rose-100/75">
                This channel is not ready for publishing. Complete configuration before connection or publishing is available.
                Live posting is blocked until <span className="font-mono">X_PUBLISHING_ENABLED=true</span> is set after OAuth, token storage, scopes, diagnostics, and publish gating are verified.
              </p>
            </div>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <AdminMetricCard
              label="OAuth config"
              value={connection.oauthConfigured ? "configured" : "missing"}
              tone={connection.oauthConfigured ? "success" : "warning"}
              variant="inner"
            />
            <AdminMetricCard
              label="X account"
              value={connection.username ? `@${connection.username}` : "not connected"}
              tone={connection.username ? "success" : "muted"}
              variant="inner"
            />
            <AdminMetricCard
              label="User ID"
              value={connection.userId ?? "—"}
              variant="inner"
            />
            <AdminMetricCard
              label="Last tweet"
              value={connection.lastPublishAt
                ? new Date(connection.lastPublishAt).toLocaleDateString("en-GB")
                : "never"}
              variant="inner"
            />
          </div>

          {/* Scopes */}
          {connection.connected && (
            <div className="mt-4 space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">
                Granted scopes
              </p>
              <div className="flex flex-wrap gap-2">
                {connection.scopes.map((scope) => (
                  <span
                    key={scope}
                    className="border border-emerald-400/20 bg-emerald-400/5 px-2 py-0.5 font-mono text-xs text-emerald-100/70"
                  >
                    {scope}
                  </span>
                ))}
                {connection.missingScopes.map((scope) => (
                  <span
                    key={scope}
                    className="border border-rose-400/20 bg-rose-400/5 px-2 py-0.5 font-mono text-xs text-rose-100/70"
                  >
                    {scope} (missing)
                  </span>
                ))}
              </div>
            </div>
          )}

          {!connection.oauthConfigured && connection.missingEnv.length > 0 && (
            <div className="mt-4 border border-amber-400/20 bg-amber-400/5 p-3">
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-amber-200/55">
                Missing X configuration
              </p>
              <p className="mt-2 text-sm leading-6 text-amber-100/70">
                {connection.missingEnv.join(", ")}
              </p>
            </div>
          )}

          {/* API note */}
          <div className="mt-4 border border-white/10 bg-black/30 p-3">
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">
              Twitter API v2 — rate limits
            </p>
            <p className="mt-2 text-sm leading-6 text-white/55">
              Free-tier X apps are limited to 17 posts per 24 hours via the API.
              Basic-tier apps allow 100 posts/day. The publish gate enforces a 10/hr
              admin-side limit. Plan publication windows accordingly.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:w-52">
          {connection.oauthConfigured ? (
            <a
              href="/api/admin/outbound/x/oauth/start"
              className="inline-flex items-center justify-center gap-2 border border-sky-400/25 bg-sky-400/10 px-3 py-2 text-xs font-medium text-sky-100 hover:bg-sky-400/15"
            >
              <ShieldCheck className="h-4 w-4" />
              {connection.connected ? "Reconnect X OAuth" : "Connect X via OAuth"}
            </a>
          ) : (
            <div className="border border-white/10 bg-black/30 p-3">
              <p className="text-xs text-white/40">
                X OAuth not configured. Set X_CLIENT_ID, X_CLIENT_SECRET, X_REDIRECT_URI,
                X_OAUTH_SCOPES, X_PUBLISHING_ENABLED, and X_TOKEN_ENCRYPTION_KEY to enable connection.
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/55"
          >
            Refresh status
          </button>
        </div>
      </div>

      <p className="mt-4 text-xs text-white/30">
        X access and refresh tokens are encrypted server-side (AES-256-GCM) and are
        never rendered in this console. Refresh tokens are stored for offline.access
        token renewal.
      </p>
    </section>
  );
}

function CharBar({ count }: { count: number }) {
  const pct = Math.min((count / X_TWEET_MAX_CHARS) * 100, 100);
  const tone =
    count > X_TWEET_MAX_CHARS
      ? "bg-rose-500"
      : count > 240
      ? "bg-amber-400"
      : "bg-emerald-500";
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-xs text-white/40">
        <span>{count} / {X_TWEET_MAX_CHARS} weighted chars</span>
        {count > X_TWEET_MAX_CHARS && (
          <span className="text-rose-300/70">exceeds limit by {count - X_TWEET_MAX_CHARS}</span>
        )}
      </div>
      <div className="mt-1 h-1 w-full bg-white/10">
        <div className={`h-1 ${tone} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function AssetCard({
  asset,
  connectionCanPublish,
  facebookConnected,
  publishingEnabled,
  creditBlocked = false,
}: {
  asset: AssetViewModel;
  connectionCanPublish: boolean;
  facebookConnected: boolean;
  publishingEnabled: boolean;
  creditBlocked?: boolean;
}) {
  const [gateRun, setGateRun] = React.useState(false);
  const [finalApproved, setFinalApproved] = React.useState(false);
  const [syncToFacebook, setSyncToFacebook] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const [dryRunning, setDryRunning] = React.useState(false);
  const [result, setResult] = React.useState<{
    ok: boolean;
    message: string;
    tweetUrl?: string | null;
    facebookSync?: { ok: boolean; postUrl?: string | null } | null;
  } | null>(null);

  // creditBlocked disables LIVE publish only — dry-run and manual reconciliation remain available
  const canPublish = gateRun && finalApproved && asset.publishable && connectionCanPublish && publishingEnabled && !creditBlocked;

  async function runDryRun() {
    setDryRunning(true);
    setResult(null);
    const res = await fetch("/api/admin/outbound/x/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: asset.slug, dryRun: true }),
    });
    const data = await res.json().catch(() => ({}));
    setDryRunning(false);
    if (res.ok) {
      setGateRun(true);
      setResult({ ok: true, message: "Dry run passed — gate cleared. No tweet was posted." });
    } else {
      setGateRun(false);
      setResult({
        ok: false,
        message: `Gate blocked: ${(data.blockers ?? [data.error]).join("; ")}`,
      });
    }
  }

  async function publish() {
    if (!canPublish) return;
    setPublishing(true);
    setResult(null);
    const res = await fetch("/api/admin/outbound/x/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: asset.slug,
        finalApproval: true,
        dryRun: false,
        syncToFacebook,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setPublishing(false);
    setResult({
      ok: res.ok,
      message: res.ok
        ? `Tweet posted to X${syncToFacebook ? " + synced to Facebook" : ""}.`
        : `Failed: ${(data.blockers ?? [data.error]).join("; ")}`,
      tweetUrl: data.tweetUrl ?? null,
      facebookSync: data.facebookSync ?? null,
    });
  }

  return (
    <article className="border border-white/10 bg-black/30 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">
            {asset.assetType} · {asset.slug}
          </p>
          <h3 className="mt-2 font-serif text-xl text-white">{asset.title}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {asset.publishLedgerStatus === "PUBLISHED" ? (
              <AdminStatusBadge label="published" tone="success" />
            ) : asset.publishLedgerStatus === "DRY_RUN" ? (
              <AdminStatusBadge label="dry run passed" tone="info" />
            ) : asset.publishLedgerStatus === "FAILED" ? (
              <AdminStatusBadge label="failed" tone="danger" />
            ) : asset.publishLedgerStatus === "IN_PROGRESS" ? (
              <AdminStatusBadge label="in progress" tone="warning" />
            ) : (
              <AdminStatusBadge
                label={asset.publishable ? "publishable" : "blocked"}
                tone={asset.publishable ? "success" : "danger"}
              />
            )}
            {asset.outboundStatus && (
              <AdminStatusBadge label={`status: ${asset.outboundStatus}`} tone="muted" />
            )}
            {asset.outboundApprovalStatus && (
              <AdminStatusBadge
                label={asset.outboundApprovalStatus}
                tone={asset.outboundApprovalStatus === "approved" ? "success" : asset.outboundApprovalStatus === "rejected" ? "danger" : "warning"}
              />
            )}
            {asset.campaign && (
              <AdminStatusBadge label={asset.campaign} tone="info" />
            )}
          </div>
          {asset.publishLedgerStatus === "PUBLISHED" && asset.providerPostUrl && (
            <p className="mt-2 text-xs text-emerald-300/70">
              ✓ Published ·{" "}
              <a href={asset.providerPostUrl} target="_blank" rel="noreferrer" className="underline hover:text-emerald-200">
                View on X
              </a>
              {asset.lastPublishedAt && (
                <span className="ml-2 text-white/30">
                  {new Date(asset.lastPublishedAt).toLocaleString("en-GB")}
                </span>
              )}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={runDryRun}
            disabled={dryRunning}
            className="inline-flex items-center gap-2 border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-100 disabled:opacity-40"
          >
            {dryRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Run gate check
          </button>
          <button
            type="button"
            onClick={publish}
            disabled={!canPublish || publishing}
            title={creditBlocked ? "Live publish blocked — X API credits exhausted. Add credits or use manual reconciliation." : undefined}
            className="inline-flex items-center gap-2 border border-sky-400/25 bg-sky-400/10 px-3 py-2 text-xs text-sky-100 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {creditBlocked ? "Credits exhausted" : "Post to X"}
          </button>
        </div>
      </div>

      {/* Tweet preview */}
      <div className="mt-4 border border-white/10 bg-zinc-950 p-4">
        <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">
          Tweet preview
        </p>
        <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-white/68">
          {asset.text}
        </pre>
        <CharBar count={asset.charCount} />
      </div>

      {/* Blockers & warnings */}
      {creditBlocked && (
        <div className="mt-3 border border-amber-400/20 bg-amber-950/15 p-3">
          <p className="text-xs font-medium text-amber-200/80">Live publish blocked — X API credits exhausted</p>
          <p className="mt-1 text-xs text-amber-100/55">
            The X developer account has no remaining API credits (HTTP 402). This is a billing issue — content and token are fine.
            Add credits at <span className="font-mono">developer.x.com</span>, or use <strong>Mark as manually posted</strong> below if you have already posted this via the X web interface.
          </p>
          <p className="mt-1 text-[10px] text-amber-100/40">Dry-run and manual reconciliation remain available.</p>
        </div>
      )}
      {!publishingEnabled && (
        <p className="mt-3 text-xs text-rose-200/65">
          - Live X publishing is blocked by configuration. Dry-run gate checks remain available.
        </p>
      )}
      {asset.blockers.length > 0 && (
        <div className="mt-3 space-y-1">
          {asset.blockers.map((b) => (
            <p key={b} className="text-xs text-rose-200/65">— {b}</p>
          ))}
        </div>
      )}
      {asset.warnings.length > 0 && (
        <div className="mt-2 space-y-1">
          {asset.warnings.map((w) => (
            <p key={w} className="text-xs text-amber-200/55">⚠ {w}</p>
          ))}
        </div>
      )}

      {/* Final approval + sync */}
      {gateRun && asset.publishable && (
        <div className="mt-4 space-y-3">
          <div className="border border-sky-400/15 bg-sky-400/5 p-3">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={finalApproved}
                onChange={(e) => setFinalApproved(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-zinc-900"
              />
              <span className="text-sm text-white/70">
                I confirm this tweet is approved for publication to the Abraham of London
                X account.
              </span>
            </label>
          </div>
          {facebookConnected && (
            <div className="border border-blue-400/15 bg-blue-400/5 p-3">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={syncToFacebook}
                  onChange={(e) => setSyncToFacebook(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-zinc-900"
                />
                <span className="text-sm text-blue-100/70">
                  Also post to Facebook — adapted version of this tweet.
                </span>
              </label>
            </div>
          )}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-4 space-y-2">
          <p className={`text-xs ${result.ok ? "text-sky-200/70" : "text-rose-200/65"}`}>
            {result.message}
            {result.tweetUrl && (
              <>
                {" "}
                <a
                  href={result.tweetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  View tweet
                </a>
              </>
            )}
          </p>
          {result.facebookSync && (
            <p className={`text-xs ${result.facebookSync.ok ? "text-blue-200/65" : "text-amber-200/55"}`}>
              Facebook sync: {result.facebookSync.ok ? "posted" : "failed (check Facebook console)"}
              {result.facebookSync.postUrl && (
                <>
                  {" "}
                  <a
                    href={result.facebookSync.postUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View post
                  </a>
                </>
              )}
            </p>
          )}
        </div>
      )}

      {/* Manual reconciliation — for posts published outside the system */}
      {asset.assetType === "outbound" && asset.publishLedgerStatus !== "PUBLISHED" && (
        <ManualReconcilePanel asset={asset} />
      )}
    </article>
  );
}

function ManualReconcilePanel({ asset }: { asset: AssetViewModel }) {
  const [open, setOpen] = React.useState(false);
  const [tweetUrl, setTweetUrl] = React.useState("");
  const [note, setNote] = React.useState("");
  const [confirm, setConfirm] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<{ ok: boolean; message?: string } | null>(null);

  // Extract outboundItemId from "outbound-x/{id}"
  const outboundItemId = asset.slug.startsWith("outbound-x/")
    ? asset.slug.slice("outbound-x/".length)
    : null;

  if (!outboundItemId) return null;

  async function submit() {
    if (!confirm || !tweetUrl.trim()) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/outbound/x/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outboundItemId,
          assetSlug: asset.slug,
          tweetUrl: tweetUrl.trim(),
          scheduledFor: asset.scheduledFor ?? null,
          note: note.trim() || undefined,
          finalConfirmation: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      setResult({ ok: res.ok, message: res.ok ? `Marked as manually published. Ledger ID: ${data.ledgerId}` : data.error ?? "Request failed" });
    } catch {
      setResult({ ok: false, message: "Network error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 border border-white/8 bg-black/20">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-[11px] font-mono uppercase tracking-wider text-white/30 hover:text-white/55 transition-colors"
      >
        <span>Mark as manually posted</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="border-t border-white/8 px-4 py-4 space-y-3">
          <p className="text-[11px] text-white/40 leading-4">
            Use this only if this post was published outside the system. It locks the item against future system publish.
          </p>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-white/35 mb-1">Tweet URL (required)</label>
            <input
              type="url"
              value={tweetUrl}
              onChange={(e) => setTweetUrl(e.target.value)}
              placeholder="https://x.com/username/status/1234567890"
              className="w-full border border-white/15 bg-black/40 px-3 py-2 text-xs text-white placeholder-white/20 focus:border-sky-400/30 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-white/35 mb-1">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Posted manually during X downtime"
              className="w-full border border-white/15 bg-black/40 px-3 py-2 text-xs text-white placeholder-white/20 focus:border-white/25 focus:outline-none"
            />
          </div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={confirm}
              onChange={(e) => setConfirm(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5"
            />
            <span className="text-[11px] text-white/55">
              I confirm this post was published manually and the system should not publish it again.
            </span>
          </label>
          <button
            type="button"
            onClick={submit}
            disabled={busy || !confirm || !tweetUrl.trim()}
            className="inline-flex items-center gap-2 border border-white/20 px-4 py-2 text-xs text-white/65 hover:text-white disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Record as manually posted
          </button>
          {result && (
            <p className={`text-[11px] ${result.ok ? "text-emerald-300/70" : "text-rose-300/65"}`}>
              {result.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function AttemptHistory({ attempts }: { attempts: AttemptSummary[] }) {
  return (
    <section className="border border-white/10 bg-zinc-950/70 p-5">
      <h2 className="font-serif text-2xl text-white">Publish Attempt History</h2>
      <div className="mt-4 space-y-2">
        {attempts.length === 0 ? (
          <p className="text-sm text-white/40">No X publish attempts recorded yet.</p>
        ) : (
          attempts.map((attempt) => (
            <div
              key={`${attempt.requestId}-${attempt.createdAt}`}
              className="flex flex-col gap-2 border border-white/10 bg-black/30 p-3 lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <p className="text-sm text-white/70">{attempt.assetTitle}</p>
                <p className="text-xs text-white/35">
                  {attempt.assetSlug} ·{" "}
                  {new Date(attempt.createdAt).toLocaleString("en-GB")}
                  {attempt.dryRun ? " (dry run)" : ""}
                  {attempt.syncedFromFacebook ? " (synced from Facebook)" : ""}
                </p>
                {attempt.errorMessageSafe && (
                  <p className="mt-1 text-xs text-rose-200/60">{attempt.errorMessageSafe}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <AdminStatusBadge
                  label={attempt.status}
                  tone={
                    attempt.status === "succeeded"
                      ? "success"
                      : attempt.status === "blocked"
                      ? "danger"
                      : attempt.status === "dry_run"
                      ? "info"
                      : "warning"
                  }
                />
                {attempt.tweetUrl && (
                  <a
                    href={attempt.tweetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-sky-200/70"
                  >
                    <ExternalLink className="h-3 w-3" />
                    X
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

// ─── Filter types ─────────────────────────────────────────────────────────────

// ─── Filter system ────────────────────────────────────────────────────────────
//
// Filter definitions — every asset has a home in exactly one non-"all" bucket:
//
//   ready      — outboundStatus is "ready" or "scheduled" (action-ready content)
//   approved   — approvalStatus is "approved" (regardless of ledger state)
//   published  — ledger PUBLISHED
//   attention  — has ledger activity requiring review: DRY_RUN, IN_PROGRESS, FAILED
//   blocked    — gate blockers present (not already published)
//
// "all" always shows everything — no item can disappear.
//
// NOTE: an item can appear in multiple buckets (e.g. approved + attention).

type QueueFilter = "all" | "ready" | "approved" | "published" | "attention" | "blocked";

function isAttentionItem(a: AssetViewModel): boolean {
  return (
    a.publishLedgerStatus === "DRY_RUN" ||
    a.publishLedgerStatus === "IN_PROGRESS" ||
    a.publishLedgerStatus === "FAILED"
  );
}

function filterAssets(assets: AssetViewModel[], filter: QueueFilter): AssetViewModel[] {
  switch (filter) {
    case "all":
      return assets;
    case "ready":
      // Include "scheduled" alongside "ready" — both signal the content is
      // action-ready. Before this fix, scheduled items like dt-algorithm-01
      // (status: scheduled) were invisible in the ready bucket.
      return assets.filter(
        (a) => a.outboundStatus === "ready" || a.outboundStatus === "scheduled",
      );
    case "approved":
      return assets.filter((a) => a.outboundApprovalStatus === "approved");
    case "published":
      return assets.filter((a) => a.publishLedgerStatus === "PUBLISHED");
    case "attention":
      // Items with ledger activity (DRY_RUN, IN_PROGRESS, FAILED) — these need
      // operator review. Previously had no dedicated bucket → items disappeared.
      return assets.filter(isAttentionItem);
    case "blocked":
      return assets.filter(
        (a) => !a.publishable && a.publishLedgerStatus !== "PUBLISHED",
      );
  }
}

function searchAssets(assets: AssetViewModel[], query: string): AssetViewModel[] {
  if (!query.trim()) return assets;
  const q = query.toLowerCase();
  return assets.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.slug.toLowerCase().includes(q) ||
      (a.campaign ?? "").toLowerCase().includes(q) ||
      (a.outboundStatus ?? "").includes(q),
  );
}

const QUEUE_FILTER_LABELS: Record<QueueFilter, string> = {
  all: "All",
  ready: "Ready / Scheduled",
  approved: "Approved",
  published: "Published",
  attention: "Needs Attention",
  blocked: "Blocked",
};

function FilterTabs({
  assets,
  active,
  onChange,
}: {
  assets: AssetViewModel[];
  active: QueueFilter;
  onChange: (f: QueueFilter) => void;
}) {
  const counts: Record<QueueFilter, number> = {
    all: assets.length,
    ready: assets.filter((a) => a.outboundStatus === "ready" || a.outboundStatus === "scheduled").length,
    approved: assets.filter((a) => a.outboundApprovalStatus === "approved").length,
    published: assets.filter((a) => a.publishLedgerStatus === "PUBLISHED").length,
    attention: assets.filter(isAttentionItem).length,
    blocked: assets.filter((a) => !a.publishable && a.publishLedgerStatus !== "PUBLISHED").length,
  };
  const tabs: QueueFilter[] = ["all", "ready", "approved", "published", "attention", "blocked"];
  return (
    <div className="flex flex-wrap gap-1">
      {tabs.map((tab) => {
        const hasItems = counts[tab] > 0;
        const isAttentionTab = tab === "attention" && hasItems;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            className={`px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider border transition-colors ${
              active === tab
                ? "border-sky-400/40 bg-sky-400/10 text-sky-200"
                : isAttentionTab
                ? "border-amber-400/30 text-amber-200/70 hover:text-amber-100"
                : "border-white/10 text-white/35 hover:text-white/60"
            }`}
          >
            {QUEUE_FILTER_LABELS[tab]}
            <span className="ml-1.5 opacity-60">({counts[tab]})</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Compact queue row ────────────────────────────────────────────────────────

function ledgerBadge(status: AssetViewModel["publishLedgerStatus"]): {
  label: string;
  cls: string;
} | null {
  if (!status) return null;
  const map: Record<string, { label: string; cls: string }> = {
    PUBLISHED: { label: "Published", cls: "border-emerald-400/30 text-emerald-300/80" },
    DRY_RUN: { label: "Dry run", cls: "border-sky-400/30 text-sky-300/70" },
    IN_PROGRESS: { label: "In progress", cls: "border-amber-400/30 text-amber-200/70" },
    FAILED: { label: "Failed", cls: "border-rose-400/30 text-rose-300/70" },
    BLOCKED: { label: "Blocked", cls: "border-white/20 text-white/40" },
  };
  return map[status] ?? null;
}

function OutboundQueueRow({
  asset,
  expanded,
  onToggle,
  connectionCanPublish,
  facebookConnected,
  publishingEnabled,
  creditBlocked = false,
}: {
  asset: AssetViewModel;
  expanded: boolean;
  onToggle: () => void;
  connectionCanPublish: boolean;
  facebookConnected: boolean;
  publishingEnabled: boolean;
  creditBlocked?: boolean;
}) {
  const lBadge = ledgerBadge(asset.publishLedgerStatus);
  const isPublished = asset.publishLedgerStatus === "PUBLISHED";
  const needsAttention = isAttentionItem(asset);

  return (
    <div
      className={`border transition-colors ${
        isPublished
          ? "border-emerald-400/20 bg-emerald-950/20"
          : needsAttention
          ? "border-amber-400/15 bg-amber-950/10"
          : expanded
          ? "border-sky-400/20 bg-sky-950/15"
          : "border-white/10 bg-black/20 hover:border-white/20"
      }`}
    >
      {/* ── Compact header row ── */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-3 flex items-start gap-3"
      >
        {/* Campaign pill */}
        {asset.campaign && (
          <span className="mt-0.5 shrink-0 rounded-sm border border-sky-400/25 bg-sky-400/8 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-sky-200/60 whitespace-nowrap">
            {asset.campaign.replace(/-/g, " ").slice(0, 20)}
          </span>
        )}

        {/* Title + slug */}
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium text-white/80">{asset.title}</p>
          <p className="mt-0.5 font-mono text-[10px] text-white/30 truncate">{asset.slug}</p>
        </div>

        {/* Status badges */}
        <div className="shrink-0 flex flex-wrap items-center justify-end gap-1.5">
          {lBadge && (
            <span className={`border px-1.5 py-0.5 text-[9px] font-mono uppercase ${lBadge.cls}`}>
              {lBadge.label}
            </span>
          )}
          {!lBadge && (
            <span className={`border px-1.5 py-0.5 text-[9px] font-mono uppercase ${
              asset.publishable
                ? "border-emerald-400/25 text-emerald-300/60"
                : "border-rose-400/20 text-rose-300/50"
            }`}>
              {asset.publishable ? "gate ok" : "gate blocked"}
            </span>
          )}
          {asset.outboundApprovalStatus === "approved" && (
            <span className="border border-emerald-400/20 px-1.5 py-0.5 text-[9px] font-mono uppercase text-emerald-200/50">
              approved
            </span>
          )}
          {asset.scheduledFor && (
            <span className="hidden sm:inline text-[10px] text-white/25 font-mono whitespace-nowrap">
              {new Date(asset.scheduledFor).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </span>
          )}
          <span className="text-[10px] text-white/30 w-12 text-right">
            {asset.charCount}c
          </span>
          <span className={`text-white/30 transition-transform text-xs ${expanded ? "rotate-90" : ""}`}>▶</span>
        </div>
      </button>

      {/* ── Published URL line (always visible when published) ── */}
      {isPublished && asset.providerPostUrl && (
        <div className="px-3 pb-2 flex items-center gap-2">
          <span className="text-[10px] text-emerald-300/60">✓ Posted</span>
          <a
            href={asset.providerPostUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[10px] text-sky-300/60 underline hover:text-sky-200 truncate"
            onClick={(e) => e.stopPropagation()}
          >
            {asset.providerPostUrl}
          </a>
          {asset.lastPublishedAt && (
            <span className="text-[10px] text-white/25 shrink-0">
              {new Date(asset.lastPublishedAt).toLocaleDateString("en-GB")}
            </span>
          )}
        </div>
      )}

      {/* ── Failed / attention note (always visible) ── */}
      {asset.publishLedgerStatus === "FAILED" && (
        <p className="px-3 pb-2 text-[10px] text-rose-300/60">
          Last publish attempt failed — expand to retry.
        </p>
      )}
      {asset.publishLedgerStatus === "IN_PROGRESS" && (
        <p className="px-3 pb-2 text-[10px] text-amber-200/60">
          Publish in progress — refresh to check status.
        </p>
      )}

      {/* ── Expanded full card ── */}
      {expanded && (
        <div className="border-t border-white/10 p-1">
          <AssetCard
            asset={asset}
            connectionCanPublish={connectionCanPublish}
            facebookConnected={facebookConnected}
            publishingEnabled={publishingEnabled}
            creditBlocked={creditBlocked}
          />
        </div>
      )}
    </div>
  );
}

// ─── Outbound queue ───────────────────────────────────────────────────────────

function OutboundDiscoveryBar({ discovery }: { discovery: OutboundDiscoverySummary }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      <AdminMetricCard label="Discovered" value={discovery.discoveredCount} variant="inner" />
      <AdminMetricCard label="Accepted" value={discovery.acceptedCount} variant="inner" tone="success" />
      <AdminMetricCard label="Publishable" value={discovery.publishableCount} variant="inner" tone={discovery.publishableCount > 0 ? "success" : "muted"} />
      <AdminMetricCard label="Blocked" value={discovery.blockedCount} variant="inner" tone={discovery.blockedCount > 0 ? "warning" : "muted"} />
      <AdminMetricCard label="Excluded" value={discovery.excludedCount} variant="inner" tone={discovery.excludedCount > 0 ? "info" : "muted"} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function XOutboundAdminPage({
  consoleState,
  flashError,
  flashConnected,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { connection, assets, outboundAssets, outboundDiscovery, attempts, facebookConnected, hasCreditBlocker } = consoleState;
  const [queueFilter, setQueueFilter] = React.useState<QueueFilter>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [expandedSlug, setExpandedSlug] = React.useState<string | null>(null);

  const filteredOutboundAssets = searchAssets(
    filterAssets(outboundAssets, queueFilter),
    searchQuery,
  );

  function toggleExpand(slug: string) {
    setExpandedSlug((prev) => (prev === slug ? null : slug));
  }

  return (
    <AdminLayout title="X Outbound">
      <Head>
        <title>X Publishing | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="space-y-6 pb-20">
        {/* Header */}
        <section className="border border-sky-400/15 bg-gradient-to-br from-sky-500/10 to-transparent p-6">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-sky-200/55">
            Governed outbound publishing
          </p>
          <h1 className="mt-3 font-serif text-3xl text-white">
            X (Twitter) Publishing Console
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
            Standalone X publishing via Twitter API v2. Final gate confirmation required.
            Bidirectional sync with Facebook — publish to both platforms in a single action.
            Token values are never shown in this console.
          </p>
        </section>

        {/* Flash messages */}
        {flashConnected && (
          <div className="flex items-center gap-2 border border-emerald-400/20 bg-emerald-400/5 p-4">
            <CheckCircle className="h-4 w-4 text-emerald-300/70" />
            <p className="text-sm text-emerald-100/80">
              X account connected successfully via OAuth.
            </p>
          </div>
        )}
        {flashError && (
          <div className="flex items-center gap-2 border border-rose-400/20 bg-rose-400/5 p-4">
            <XCircle className="h-4 w-4 text-rose-300/70" />
            <p className="text-sm text-rose-100/80">
              OAuth error: {flashError.replace(/_/g, " ")}. Try reconnecting or check
              X_CLIENT_ID / X_REDIRECT_URI configuration.
            </p>
          </div>
        )}

        {/* Credit-blocked notice */}
        {hasCreditBlocker && (
          <div className="border border-amber-400/25 bg-amber-950/20 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-200/90">X API credits exhausted (HTTP 402)</p>
                <p className="mt-1 text-xs leading-5 text-amber-100/60">
                  A recent publish was rejected by X because the account has no remaining API credits.
                  This is a billing issue — content and OAuth token are fine.
                  Upgrade the X Developer plan, or use <strong>Mark as manually posted</strong> on any
                  item you have already posted via the X web interface.
                </p>
              </div>
              <AdminStatusBadge label="CREDIT BLOCKED" tone="warning" />
            </div>
          </div>
        )}

        {/* Section 1: Connection */}
        <ConnectionPanel
          connection={connection}
          publishingEnabled={consoleState.publishingEnabled}
        />

        {/* Section 2: Metrics */}
        <section className="grid gap-4 sm:grid-cols-3">
          <AdminMetricCard label="Total assets" value={assets.length} variant="inner" />
          <AdminMetricCard
            label="Publishable"
            value={assets.filter((a) => a.publishable).length}
            tone="success"
            variant="inner"
          />
          <AdminMetricCard
            label="Facebook sync"
            value={facebookConnected ? "available" : "not connected"}
            tone={facebookConnected ? "success" : "muted"}
            variant="inner"
          />
        </section>

        {/* Section 3: Outbound Draft Queue */}
        <section className="space-y-4">
          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl text-white">Outbound Draft Queue</h2>
              <p className="mt-1 text-sm text-white/40">
                <code className="font-mono text-white/55">content/outbound/x/</code> · recursive · {outboundDiscovery.acceptedCount} posts
                {facebookConnected && <span className="ml-2 text-blue-300/50">Facebook sync available</span>}
              </p>
            </div>
          </div>

          {/* Discovery stats */}
          <OutboundDiscoveryBar discovery={outboundDiscovery} />

          {/* Filters + search */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <FilterTabs assets={outboundAssets} active={queueFilter} onChange={setQueueFilter} />
            <div className="sm:ml-auto">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title / slug / campaign…"
                className="w-full sm:w-64 border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-white placeholder-white/25 focus:border-sky-400/30 focus:outline-none"
              />
            </div>
          </div>

          {/* Results summary */}
          {(searchQuery || queueFilter !== "all") && (
            <p className="text-[11px] text-white/30">
              Showing {filteredOutboundAssets.length} of {outboundAssets.length} assets
              {searchQuery && ` matching "${searchQuery}"`}
              {queueFilter !== "all" && ` · filter: ${QUEUE_FILTER_LABELS[queueFilter]}`}
            </p>
          )}

          {/* Needs Attention callout — only on "all" filter when attention items exist */}
          {queueFilter === "all" && !searchQuery && (
            (() => {
              const attentionItems = outboundAssets.filter(isAttentionItem);
              if (attentionItems.length === 0) return null;
              return (
                <div className="border border-amber-400/20 bg-amber-950/15 p-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-amber-200/80">
                      {attentionItems.length} item{attentionItems.length !== 1 ? "s" : ""} need attention
                    </p>
                    <p className="mt-0.5 text-[11px] text-amber-100/50">
                      {attentionItems.map((a) => a.slug.split("/").pop()).slice(0, 3).join(", ")}
                      {attentionItems.length > 3 && ` +${attentionItems.length - 3} more`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQueueFilter("attention")}
                    className="shrink-0 border border-amber-400/25 px-3 py-1.5 text-[11px] text-amber-200/70 hover:text-amber-100 transition-colors"
                  >
                    View attention items
                  </button>
                </div>
              );
            })()
          )}

          {/* Queue rows */}
          {filteredOutboundAssets.length === 0 ? (
            <div className="border border-white/10 bg-black/20 p-6 text-center">
              <p className="text-sm text-white/40">
                {searchQuery
                  ? `No assets match "${searchQuery}" in the ${QUEUE_FILTER_LABELS[queueFilter]} filter.`
                  : queueFilter === "attention"
                  ? "No items need attention — no active DRY_RUN, IN_PROGRESS, or FAILED ledger entries."
                  : queueFilter === "published"
                  ? "No published assets yet."
                  : queueFilter === "blocked"
                  ? "No assets are currently blocked by gate checks."
                  : `No assets match the "${QUEUE_FILTER_LABELS[queueFilter]}" filter.`}
              </p>
              {queueFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => setQueueFilter("all")}
                  className="mt-3 text-xs text-sky-300/60 underline hover:text-sky-200"
                >
                  Show all {outboundAssets.length} assets
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredOutboundAssets.map((asset) => (
                <OutboundQueueRow
                  key={asset.slug}
                  asset={asset}
                  expanded={expandedSlug === asset.slug}
                  onToggle={() => toggleExpand(asset.slug)}
                  connectionCanPublish={connection.canPublish}
                  facebookConnected={facebookConnected}
                  publishingEnabled={consoleState.publishingEnabled}
                  creditBlocked={consoleState.creditBlocked}
                />
              ))}
            </div>
          )}
        </section>

        {/* Section 4: Blog-series assets (legacy resolver) */}
        {assets.length > 0 && (
          <section className="space-y-4">
            <div>
              <h2 className="font-serif text-2xl text-white">Blog Series Assets</h2>
              <p className="mt-1 text-sm text-white/45">
                Published blog-series parts resolved from the blog catalogue.
              </p>
            </div>
            {assets.map((asset) => (
              <AssetCard
                key={asset.slug}
                asset={asset}
                connectionCanPublish={connection.canPublish}
                facebookConnected={facebookConnected}
                publishingEnabled={consoleState.publishingEnabled}
              />
            ))}
          </section>
        )}

        {/* Section 6: Attempt history */}
        <AttemptHistory attempts={attempts} />
      </div>
    </AdminLayout>
  );
}
