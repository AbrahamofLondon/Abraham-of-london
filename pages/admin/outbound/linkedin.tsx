import * as React from "react";
import Head from "next/head";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { Clipboard, ExternalLink, Loader2, Plug, Send, ShieldCheck } from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { AdminStatusBadge, type AdminBadgeTone } from "@/components/admin/AdminStatusBadge";
import { requireAdminPage } from "@/lib/access/server";
import { prisma } from "@/lib/prisma.server";
import { getConnectionStatus, type LinkedInConnectionStatus } from "@/lib/outbound/linkedin-oauth";
import {
  getResolvedLinkedInOutboundAssets,
  type ResolvedLinkedInOutbound,
} from "@/lib/outbound/linkedin-content-resolver";
import { canPublishLinkedInOutbound } from "@/lib/outbound/linkedin-publish-gate";

type ConsolePost = {
  slug: string;
  title: string;
  sequence: number | null;
  status: string;
  claimRisk: string | null;
  linkedReportId: string | null;
  publicationGate: string | null;
  readinessState: "publishable" | "blocked" | "posted" | "draft";
  publishable: boolean;
  blockers: string[];
  warnings: string[];
  body: string;
  charCount: number;
};

type AttemptSummary = {
  outboundSlug: string;
  outboundTitle: string;
  status: string;
  linkedInPostUrn: string | null;
  linkedInUrl: string | null;
  errorCode: string | null;
  errorMessageSafe: string | null;
  requestId: string;
  createdAt: string;
  completedAt: string | null;
};

type ConsoleViewModel = {
  connection: LinkedInConnectionStatus;
  posts: ConsolePost[];
  attempts: AttemptSummary[];
  tokenLeakProbe: string;
};

function readinessState(asset: ResolvedLinkedInOutbound, publishable: boolean): ConsolePost["readinessState"] {
  if (asset.isPosted || asset.item.status === "posted") return "posted";
  if (asset.item.draft === true || asset.item.status === "draft") return "draft";
  return publishable ? "publishable" : "blocked";
}

export function buildLinkedInOutboundAdminViewModel(
  connection: LinkedInConnectionStatus,
  assets: ResolvedLinkedInOutbound[],
  attempts: AttemptSummary[] = [],
): ConsoleViewModel {
  const posts = assets.map((asset) => {
    const gate = canPublishLinkedInOutbound(asset.item, { connection });
    return {
      slug: asset.slug,
      title: asset.title,
      sequence: typeof asset.item.sequence === "number" ? asset.item.sequence : null,
      status: String(asset.item.status || "unknown"),
      claimRisk: asset.item.claimRisk ?? null,
      linkedReportId: asset.item.linkedReportId ?? null,
      publicationGate: asset.item.publicationGate ?? null,
      readinessState: readinessState(asset, gate.allowed),
      publishable: gate.allowed,
      blockers: gate.blockers,
      warnings: gate.warnings,
      body: asset.body,
      charCount: asset.charCount,
    };
  });

  posts.sort((a, b) => {
    const rank = { publishable: 0, blocked: 1, draft: 2, posted: 3 };
    const rankDelta = rank[a.readinessState] - rank[b.readinessState];
    if (rankDelta !== 0) return rankDelta;
    return (a.sequence ?? 999) - (b.sequence ?? 999);
  });

  return {
    connection,
    posts,
    attempts,
    tokenLeakProbe: JSON.stringify({ connection, posts, attempts }),
  };
}

export const getServerSideProps: GetServerSideProps<{
  consoleState: ConsoleViewModel;
}> = async (ctx) => {
  const guard = await requireAdminPage(ctx);
  if (!guard.authorized) return guard.redirect as never;

  const [connection, assets] = await Promise.all([
    getConnectionStatus(),
    Promise.resolve(getResolvedLinkedInOutboundAssets(true)),
  ]);

  let attempts: AttemptSummary[] = [];
  try {
    const rows = await prisma.linkedInPublishAttempt.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
    });
    attempts = rows.map((row) => ({
      outboundSlug: row.outboundSlug,
      outboundTitle: row.outboundTitle,
      status: row.status,
      linkedInPostUrn: row.linkedInPostUrn,
      linkedInUrl: row.linkedInUrl,
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
      consoleState: buildLinkedInOutboundAdminViewModel(connection, assets, attempts),
    },
  };
};

function toneForReadiness(state: ConsolePost["readinessState"]): AdminBadgeTone {
  if (state === "publishable") return "success";
  if (state === "blocked") return "danger";
  if (state === "draft") return "warning";
  return "info";
}

function ConnectionPanel({ connection }: { connection: LinkedInConnectionStatus }) {
  const [revoking, setRevoking] = React.useState(false);

  async function revoke() {
    setRevoking(true);
    await fetch("/api/admin/outbound/linkedin/oauth/revoke", { method: "POST" }).catch(() => null);
    window.location.reload();
  }

  return (
    <section className="border border-white/10 bg-zinc-950/70 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Plug className="h-4 w-4 text-sky-300/80" />
            <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/35">Connection status</p>
          </div>
          <h2 className="mt-2 font-serif text-2xl text-white">LinkedIn member publishing</h2>
          <p className="mt-2 max-w-3xl text-sm text-white/55">{connection.message}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <AdminStatusBadge label={connection.connected ? "Connected" : "Not connected"} tone={connection.connected ? "success" : "warning"} />
            <AdminStatusBadge label={connection.publishingEnabled ? "Publishing enabled" : "Publishing disabled"} tone={connection.publishingEnabled ? "success" : "warning"} />
            <AdminStatusBadge label={`Status: ${connection.status}`} tone={connection.status === "active" ? "success" : "muted"} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/api/admin/outbound/linkedin/oauth/start"
            className="inline-flex items-center gap-2 border border-sky-400/25 bg-sky-400/10 px-3 py-2 text-xs font-medium text-sky-100 hover:bg-sky-400/15"
          >
            <ShieldCheck className="h-4 w-4" />
            {connection.connected ? "Reconnect" : "Connect LinkedIn"}
          </a>
          <button
            type="button"
            onClick={revoke}
            disabled={!connection.connected || revoking}
            className="inline-flex items-center gap-2 border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/55 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {revoking ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Revoke
          </button>
        </div>
      </div>
      <p className="mt-4 text-xs text-white/35">
        Token values are encrypted server-side and are never rendered in this console.
      </p>
    </section>
  );
}

function PostCard({ post }: { post: ConsolePost }) {
  const [gateRun, setGateRun] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);

  async function copyBody() {
    await navigator.clipboard?.writeText(post.body).catch(() => null);
  }

  async function publish() {
    setPublishing(true);
    setResult(null);
    const response = await fetch("/api/admin/outbound/linkedin/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: post.slug, confirm: true }),
    });
    const data = await response.json().catch(() => ({}));
    setPublishing(false);
    setResult(response.ok ? `Published. Manual metadata: ${JSON.stringify(data.manualMetadata)}` : `Blocked: ${(data.blockers || [data.error]).join("; ")}`);
  }

  const publishEnabled = gateRun && post.publishable;

  return (
    <article className="border border-white/10 bg-black/30 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">{post.slug}</p>
          <h3 className="mt-2 font-serif text-xl text-white">{post.title}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <AdminStatusBadge label={post.readinessState} tone={toneForReadiness(post.readinessState)} />
            <AdminStatusBadge label={`status: ${post.status}`} tone="muted" />
            {post.claimRisk ? <AdminStatusBadge label={`claim risk: ${post.claimRisk}`} tone={post.claimRisk === "LOW" ? "success" : "warning"} /> : null}
            {post.linkedReportId ? <AdminStatusBadge label={post.linkedReportId} tone="info" /> : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={copyBody} className="inline-flex items-center gap-2 border border-white/10 px-3 py-2 text-xs text-white/55 hover:text-white">
            <Clipboard className="h-4 w-4" />
            Copy
          </button>
          <button type="button" onClick={() => setGateRun(true)} className="inline-flex items-center gap-2 border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
            Run final gate
          </button>
          <button
            type="button"
            onClick={publish}
            disabled={!publishEnabled || publishing}
            className="inline-flex items-center gap-2 border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Publish to LinkedIn
          </button>
        </div>
      </div>

      {post.publicationGate ? <p className="mt-3 text-xs text-amber-100/55">{post.publicationGate}</p> : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <AdminMetricCard label="Sequence" value={post.sequence ?? "n/a"} variant="inner" />
        <AdminMetricCard label="Characters" value={post.charCount} variant="inner" />
        <AdminMetricCard label="Publishable" value={post.publishable ? "yes" : "no"} tone={post.publishable ? "success" : "danger"} variant="inner" />
      </div>

      <div className="mt-4 border border-white/10 bg-zinc-950 p-4">
        <p className="mb-3 text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Post preview</p>
        <pre className="max-h-72 whitespace-pre-wrap break-words text-sm leading-6 text-white/68">{post.body}</pre>
      </div>

      {post.blockers.length > 0 ? (
        <div className="mt-4 space-y-1">
          {post.blockers.map((blocker) => (
            <p key={blocker} className="text-xs text-rose-200/70">- {blocker}</p>
          ))}
        </div>
      ) : null}
      {result ? <p className="mt-4 text-xs text-white/55">{result}</p> : null}
    </article>
  );
}

export default function LinkedInOutboundAdminPage({
  consoleState,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <AdminLayout title="LinkedIn Outbound">
      <Head>
        <title>LinkedIn Outbound | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div className="space-y-6">
        <section className="border border-sky-400/15 bg-gradient-to-br from-sky-400/10 to-transparent p-6">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-sky-200/55">Governed outbound publishing</p>
          <h1 className="mt-3 font-serif text-3xl text-white">LinkedIn Publishing Console</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
            Admin-only text publishing for approved LinkedIn outbound assets. Drafts, report-gated content, and unsafe claims remain blocked by the final gate.
          </p>
        </section>

        <ConnectionPanel connection={consoleState.connection} />

        <section className="space-y-4">
          <div>
            <h2 className="font-serif text-2xl text-white">Publishable And Blocked Posts</h2>
            <p className="mt-1 text-sm text-white/45">The final gate must be run before the publish action enables.</p>
          </div>
          {consoleState.posts.map((post) => <PostCard key={post.slug} post={post} />)}
        </section>

        <section className="border border-white/10 bg-zinc-950/70 p-5">
          <h2 className="font-serif text-2xl text-white">Attempts History</h2>
          <div className="mt-4 space-y-2">
            {consoleState.attempts.length === 0 ? (
              <p className="text-sm text-white/45">No LinkedIn publish attempts recorded yet.</p>
            ) : consoleState.attempts.map((attempt) => (
              <div key={`${attempt.requestId}-${attempt.createdAt}`} className="flex flex-col gap-2 border border-white/10 bg-black/30 p-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm text-white/70">{attempt.outboundTitle}</p>
                  <p className="text-xs text-white/35">{attempt.outboundSlug} - {attempt.createdAt}</p>
                  {attempt.errorMessageSafe ? <p className="mt-1 text-xs text-rose-200/65">{attempt.errorMessageSafe}</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  <AdminStatusBadge label={attempt.status} tone={attempt.status === "succeeded" ? "success" : attempt.status === "blocked" ? "danger" : "warning"} />
                  {attempt.linkedInUrl ? (
                    <a href={attempt.linkedInUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-sky-200/70">
                      <ExternalLink className="h-3 w-3" />
                      LinkedIn
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
