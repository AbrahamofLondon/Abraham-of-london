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
  assets: AssetViewModel[];
  attempts: AttemptSummary[];
  facebookConnected: boolean;
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

  const [connection, rawAssets, fbStatus] = await Promise.all([
    getXConnectionStatus(),
    Promise.resolve(getAllXPublishableAssets()),
    getFacebookConnectionStatus(),
  ]);
  const facebookConnected = fbStatus.canPublish;

  const assets: AssetViewModel[] = rawAssets.map((asset: XPublishedAsset) => {
    const gate = canPublishXPost(asset, connection);
    return {
      slug: asset.slug,
      assetType: asset.assetType,
      title: asset.title,
      text: asset.text,
      link: asset.link,
      charCount: countTweetChars(asset.text),
      publishable: gate.allowed,
      blockers: gate.blockers,
      warnings: gate.warnings,
    };
  });

  assets.sort((a, b) => {
    if (a.publishable && !b.publishable) return -1;
    if (!a.publishable && b.publishable) return 1;
    return a.title.localeCompare(b.title);
  });

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

  return {
    props: {
      consoleState: { connection, assets, attempts, facebookConnected },
      flashError,
      flashConnected,
    },
  };
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function readinessTone(readiness: XConnectionStatus["readiness"]): AdminBadgeTone {
  if (readiness === "READY") return "success";
  if (readiness === "MISSING_SCOPE") return "danger";
  if (readiness === "TOKEN_INVALID") return "danger";
  if (readiness === "CONFIG_MISSING") return "warning";
  return "muted";
}

function ConnectionPanel({ connection }: { connection: XConnectionStatus }) {
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
              label={connection.canPublish ? "Can tweet" : "Cannot tweet"}
              tone={connection.canPublish ? "success" : "danger"}
            />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                X OAuth not configured. Set X_CLIENT_ID and X_REDIRECT_URI to enable.
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
}: {
  asset: AssetViewModel;
  connectionCanPublish: boolean;
  facebookConnected: boolean;
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

  const canPublish = gateRun && finalApproved && asset.publishable && connectionCanPublish;

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
            <AdminStatusBadge
              label={asset.publishable ? "publishable" : "blocked"}
              tone={asset.publishable ? "success" : "danger"}
            />
          </div>
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
            className="inline-flex items-center gap-2 border border-sky-400/25 bg-sky-400/10 px-3 py-2 text-xs text-sky-100 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Post to X
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
    </article>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function XOutboundAdminPage({
  consoleState,
  flashError,
  flashConnected,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { connection, assets, attempts, facebookConnected } = consoleState;

  return (
    <AdminLayout title="X Outbound">
      <Head>
        <title>X Publishing | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="space-y-6">
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

        {/* Section 1: Connection */}
        <ConnectionPanel connection={connection} />

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

        {/* Section 3–5: Assets + gate */}
        <section className="space-y-4">
          <div>
            <h2 className="font-serif text-2xl text-white">Tweet Queue</h2>
            <p className="mt-1 text-sm text-white/45">
              Run the gate check first. Final approval required before posting.
              {facebookConnected ? " Facebook sync available after gate passes." : ""}
            </p>
          </div>
          {assets.length === 0 ? (
            <p className="text-sm text-white/40">No publishable X assets found.</p>
          ) : (
            assets.map((asset) => (
              <AssetCard
                key={asset.slug}
                asset={asset}
                connectionCanPublish={connection.canPublish}
                facebookConnected={facebookConnected}
              />
            ))
          )}
        </section>

        {/* Section 6: Attempt history */}
        <AttemptHistory attempts={attempts} />
      </div>
    </AdminLayout>
  );
}
