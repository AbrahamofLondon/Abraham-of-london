/**
 * pages/admin/outbound/facebook.tsx
 *
 * Facebook Page publishing console.
 * Admin-only. Server-side rendered. Token never surfaced in UI or props.
 *
 * Sections:
 *   1. Connection status + OAuth actions
 *   2. Page identity + cross-post note
 *   3. Permissions panel
 *   4. Asset selector with post preview
 *   5. Final approval gate + publish action
 *   6. Attempt history
 */

import * as React from "react";
import Head from "next/head";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import {
  AlertTriangle,
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
import { getFacebookConnectionStatus } from "@/lib/outbound/facebook-oauth";
import {
  getAllFacebookPublishableAssets,
} from "@/lib/outbound/facebook-content-resolver";
import { canPublishFacebookPost } from "@/lib/outbound/facebook-publish-gate";
import type { FacebookConnectionStatus, FacebookPublishedAsset } from "@/lib/outbound/facebook-types";

// ─── Types ────────────────────────────────────────────────────────────────────

type AssetViewModel = {
  slug: string;
  assetType: string;
  title: string;
  text: string;
  link: string | null;
  imagePath: string | null;
  publishable: boolean;
  blockers: string[];
  warnings: string[];
};

type AttemptSummary = {
  assetSlug: string;
  assetTitle: string;
  status: string;
  facebookPostId: string | null;
  facebookPostUrl: string | null;
  errorCode: string | null;
  errorMessageSafe: string | null;
  dryRun: boolean;
  requestId: string;
  createdAt: string;
  completedAt: string | null;
};

type ConsoleViewModel = {
  connection: FacebookConnectionStatus;
  assets: AssetViewModel[];
  attempts: AttemptSummary[];
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

  const [connection, rawAssets] = await Promise.all([
    getFacebookConnectionStatus(),
    Promise.resolve(getAllFacebookPublishableAssets()),
  ]);

  const assets: AssetViewModel[] = rawAssets.map((asset: FacebookPublishedAsset) => {
    const gate = canPublishFacebookPost(asset, connection);
    return {
      slug: asset.slug,
      assetType: asset.assetType,
      title: asset.title,
      text: asset.text,
      link: asset.link,
      imagePath: asset.imagePath,
      publishable: gate.allowed,
      blockers: gate.blockers,
      warnings: gate.warnings,
    };
  });

  // Sort: publishable first, then blocked
  assets.sort((a, b) => {
    if (a.publishable && !b.publishable) return -1;
    if (!a.publishable && b.publishable) return 1;
    return a.title.localeCompare(b.title);
  });

  let attempts: AttemptSummary[] = [];
  try {
    const rows = await prisma.facebookPublishAttempt.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
    });
    attempts = rows.map((row) => ({
      assetSlug: row.assetSlug,
      assetTitle: row.assetTitle,
      status: row.status,
      facebookPostId: row.facebookPostId,
      facebookPostUrl: row.facebookPostUrl,
      errorCode: row.errorCode,
      errorMessageSafe: row.errorMessageSafe,
      dryRun: row.dryRun,
      requestId: row.requestId,
      createdAt: row.createdAt.toISOString(),
      completedAt: row.completedAt?.toISOString() ?? null,
    }));
  } catch {
    attempts = [];
  }

  return {
    props: {
      consoleState: { connection, assets, attempts },
      flashError,
      flashConnected,
    },
  };
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function readinessTone(readiness: FacebookConnectionStatus["readiness"]): AdminBadgeTone {
  if (readiness === "READY") return "success";
  if (readiness === "MISSING_PERMISSION") return "danger";
  if (readiness === "TOKEN_INVALID") return "danger";
  if (readiness === "CONFIG_MISSING") return "warning";
  return "muted";
}

function ConnectionPanel({ connection }: { connection: FacebookConnectionStatus }) {
  return (
    <section className="border border-white/10 bg-zinc-950/70 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/35">
            Connection status
          </p>
          <h2 className="mt-2 font-serif text-2xl text-white">
            Facebook Page publishing
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">
            <AdminStatusBadge
              label={connection.connected ? "Connected" : "Not connected"}
              tone={connection.connected ? "success" : "warning"}
            />
            <AdminStatusBadge
              label={`State: ${connection.state}`}
              tone={connection.state === "oauth" ? "success" : connection.state === "env_token" ? "warning" : "muted"}
            />
            <AdminStatusBadge
              label={`Readiness: ${connection.readiness}`}
              tone={readinessTone(connection.readiness)}
            />
            <AdminStatusBadge
              label={connection.canPublish ? "Can publish" : "Cannot publish"}
              tone={connection.canPublish ? "success" : "danger"}
            />
            {connection.oauthConfigured ? (
              <AdminStatusBadge label="OAuth configured" tone="success" />
            ) : (
              <AdminStatusBadge label="OAuth not configured" tone="warning" />
            )}
          </div>

          {connection.warning && (
            <div className="mt-4 flex items-start gap-2 border border-amber-400/20 bg-amber-400/5 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300/70" />
              <p className="text-sm text-amber-100/75">{connection.warning}</p>
            </div>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AdminMetricCard
              label="Page ID"
              value={connection.pageId ?? "not set"}
              tone={connection.pageId ? "success" : "danger"}
              variant="inner"
            />
            <AdminMetricCard
              label="Page name"
              value={connection.pageName ?? "unknown"}
              variant="inner"
            />
            <AdminMetricCard
              label="Last publish"
              value={connection.lastPublishAt
                ? new Date(connection.lastPublishAt).toLocaleDateString("en-GB")
                : "never"}
              variant="inner"
            />
            <AdminMetricCard
              label="X cross-post"
              value="Via Facebook"
              tone="info"
              variant="inner"
            />
          </div>

          {/* Cross-post note */}
          <div className="mt-4 border border-sky-400/15 bg-sky-400/5 p-3">
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-sky-200/45">
              X / Twitter distribution
            </p>
            <p className="mt-2 text-sm leading-6 text-white/55">
              X distribution is currently handled through the Facebook Page's connected
              X/Twitter account. Native X publishing is reserved as a future provider
              for threads, analytics, and direct platform control.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:w-48">
          {connection.oauthConfigured ? (
            <a
              href="/api/admin/outbound/facebook/oauth/start"
              className="inline-flex items-center justify-center gap-2 border border-sky-400/25 bg-sky-400/10 px-3 py-2 text-xs font-medium text-sky-100 hover:bg-sky-400/15"
            >
              <ShieldCheck className="h-4 w-4" />
              {connection.connected ? "Reconnect OAuth" : "Connect via OAuth"}
            </a>
          ) : (
            <div className="border border-white/10 bg-black/30 p-3">
              <p className="text-xs text-white/40">
                OAuth not configured. Set FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, and
                FACEBOOK_REDIRECT_URI to enable the full OAuth flow.
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
        Token values are encrypted server-side (AES-256-GCM) and are never rendered in
        this console. Diagnostics are connection-status only.
      </p>
    </section>
  );
}

function PermissionsPanel({
  connection,
}: {
  connection: FacebookConnectionStatus;
}) {
  return (
    <section className="border border-white/10 bg-zinc-950/70 p-5">
      <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/35">
        Permissions
      </p>
      <h2 className="mt-2 font-serif text-xl text-white">Required Graph API permissions</h2>
      <div className="mt-4 space-y-2">
        {connection.requiredPermissions.map((perm) => {
          const granted = connection.grantedPermissions.includes(perm);
          return (
            <div
              key={perm}
              className="flex items-center justify-between border border-white/10 bg-black/30 px-3 py-2"
            >
              <span className="font-mono text-xs text-white/70">{perm}</span>
              <div className="flex items-center gap-2">
                {granted ? (
                  <CheckCircle className="h-4 w-4 text-emerald-400/70" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-400/70" />
                )}
                <AdminStatusBadge
                  label={granted ? "granted" : "missing"}
                  tone={granted ? "success" : "danger"}
                />
              </div>
            </div>
          );
        })}
      </div>
      {connection.missingPermissions.length > 0 && (
        <p className="mt-3 text-xs text-rose-200/65">
          Missing permissions: {connection.missingPermissions.join(", ")}. Reconnect via
          OAuth to request the required scopes.
        </p>
      )}
    </section>
  );
}

function AssetCard({
  asset,
  connectionCanPublish,
}: {
  asset: AssetViewModel;
  connectionCanPublish: boolean;
}) {
  const [gateRun, setGateRun] = React.useState(false);
  const [finalApproved, setFinalApproved] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const [dryRunning, setDryRunning] = React.useState(false);
  const [result, setResult] = React.useState<{
    ok: boolean;
    message: string;
    postUrl?: string | null;
  } | null>(null);

  const canPublish = gateRun && finalApproved && asset.publishable && connectionCanPublish;

  async function runDryRun() {
    setDryRunning(true);
    setResult(null);
    const res = await fetch("/api/admin/outbound/facebook/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: asset.slug, dryRun: true }),
    });
    const data = await res.json().catch(() => ({}));
    setDryRunning(false);
    if (res.ok) {
      setGateRun(true);
      setResult({ ok: true, message: "Dry run passed — gate cleared. No post was published." });
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
    const res = await fetch("/api/admin/outbound/facebook/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: asset.slug,
        finalApproval: true,
        dryRun: false,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setPublishing(false);
    setResult({
      ok: res.ok,
      message: res.ok
        ? `Published to Facebook.`
        : `Failed: ${(data.blockers ?? [data.error]).join("; ")}`,
      postUrl: data.postUrl ?? null,
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
            className="inline-flex items-center gap-2 border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Publish to Facebook
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="mt-4 border border-white/10 bg-zinc-950 p-4">
        <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">
          Post preview
        </p>
        <pre className="max-h-64 whitespace-pre-wrap break-words text-sm leading-6 text-white/68">
          {asset.text}
        </pre>
        {asset.link && (
          <p className="mt-2 text-xs text-sky-200/55">Link: {asset.link}</p>
        )}
        {asset.imagePath && (
          <p className="mt-1 text-xs text-white/35">Image: {asset.imagePath}</p>
        )}
      </div>

      {/* Blockers */}
      {asset.blockers.length > 0 && (
        <div className="mt-3 space-y-1">
          {asset.blockers.map((b) => (
            <p key={b} className="text-xs text-rose-200/65">
              — {b}
            </p>
          ))}
        </div>
      )}
      {asset.warnings.length > 0 && (
        <div className="mt-2 space-y-1">
          {asset.warnings.map((w) => (
            <p key={w} className="text-xs text-amber-200/55">
              ⚠ {w}
            </p>
          ))}
        </div>
      )}

      {/* Final approval gate */}
      {gateRun && asset.publishable && (
        <div className="mt-4 border border-emerald-400/15 bg-emerald-400/5 p-3">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={finalApproved}
              onChange={(e) => setFinalApproved(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-zinc-900"
            />
            <span className="text-sm text-white/70">
              I confirm this post is approved for publication to the Abraham of London
              Facebook Page.
            </span>
          </label>
        </div>
      )}

      {result && (
        <p
          className={`mt-4 text-xs ${result.ok ? "text-emerald-200/70" : "text-rose-200/65"}`}
        >
          {result.message}
          {result.postUrl && (
            <>
              {" "}
              <a
                href={result.postUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sky-200/70 underline"
              >
                <ExternalLink className="h-3 w-3" />
                View post
              </a>
            </>
          )}
        </p>
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
          <p className="text-sm text-white/40">No Facebook publish attempts recorded yet.</p>
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
                </p>
                {attempt.errorMessageSafe && (
                  <p className="mt-1 text-xs text-rose-200/60">
                    {attempt.errorMessageSafe}
                  </p>
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
                {attempt.facebookPostUrl && (
                  <a
                    href={attempt.facebookPostUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-sky-200/70"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Facebook
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

export default function FacebookOutboundAdminPage({
  consoleState,
  flashError,
  flashConnected,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { connection, assets, attempts } = consoleState;

  return (
    <AdminLayout title="Facebook Outbound">
      <Head>
        <title>Facebook Outbound | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <section className="border border-blue-400/15 bg-gradient-to-br from-blue-500/10 to-transparent p-6">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-blue-200/55">
            Governed outbound publishing
          </p>
          <h1 className="mt-3 font-serif text-3xl text-white">
            Facebook Publishing Console
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
            Admin-only Facebook Page publishing for approved content assets. Final gate
            confirmation required before any post is submitted. Token values are never
            shown in this console.
          </p>
        </section>

        {/* Flash messages */}
        {flashConnected && (
          <div className="flex items-center gap-2 border border-emerald-400/20 bg-emerald-400/5 p-4">
            <CheckCircle className="h-4 w-4 text-emerald-300/70" />
            <p className="text-sm text-emerald-100/80">
              Facebook Page connected successfully via OAuth.
            </p>
          </div>
        )}
        {flashError && (
          <div className="flex items-center gap-2 border border-rose-400/20 bg-rose-400/5 p-4">
            <XCircle className="h-4 w-4 text-rose-300/70" />
            <p className="text-sm text-rose-100/80">
              OAuth error: {flashError.replace(/_/g, " ")}. Try reconnecting or check
              environment configuration.
            </p>
          </div>
        )}

        {/* Section 1: Connection */}
        <ConnectionPanel connection={connection} />

        {/* Section 2: Permissions */}
        <PermissionsPanel connection={connection} />

        {/* Section 3: Metrics */}
        <section className="grid gap-4 sm:grid-cols-3">
          <AdminMetricCard
            label="Total assets"
            value={assets.length}
            variant="inner"
          />
          <AdminMetricCard
            label="Publishable"
            value={assets.filter((a) => a.publishable).length}
            tone="success"
            variant="inner"
          />
          <AdminMetricCard
            label="Blocked"
            value={assets.filter((a) => !a.publishable).length}
            tone={assets.some((a) => !a.publishable) ? "danger" : "success"}
            variant="inner"
          />
        </section>

        {/* Section 4–5: Assets + gate */}
        <section className="space-y-4">
          <div>
            <h2 className="font-serif text-2xl text-white">Publishable Assets</h2>
            <p className="mt-1 text-sm text-white/45">
              Run the gate check first. Final approval confirmation is required before
              publishing goes live.
            </p>
          </div>
          {assets.length === 0 ? (
            <p className="text-sm text-white/40">No publishable Facebook assets found.</p>
          ) : (
            assets.map((asset) => (
              <AssetCard
                key={asset.slug}
                asset={asset}
                connectionCanPublish={connection.canPublish}
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
