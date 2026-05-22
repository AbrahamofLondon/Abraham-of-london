/**
 * pages/admin/outbound/linkedin/campaigns/[campaign].tsx
 *
 * Admin review console for a specific LinkedIn outbound campaign queue.
 * Data is loaded server-side from the outbound-content-loader via the
 * queue API. Posts are grouped by seriesWeek and sorted by sequence.
 *
 * Security:
 *  - Admin session required (requireAdminPage)
 *  - No token values in any rendered output
 *  - No auto-publish — requiresFinalApproval must be manually satisfied
 *  - Scheduler disabled — OUTBOUND_SCHEDULER_ENABLED must be true explicitly
 *
 * Approve discipline:
 *  - Only Week 1 posts shown with approve action initially
 *  - Week 2+ posts display "awaiting Week 1 review" until Week 1 is approved
 *
 * Dry-run validation calls /api/admin/outbound/linkedin/campaigns/validate
 * which validates gates without making any external post.
 */

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { AlertCircle, CheckCircle2, ChevronRight, Clock, FileText, Loader2 } from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import { AdminStatusBadge, type AdminBadgeTone } from "@/components/admin/AdminStatusBadge";
import { requireAdminPage } from "@/lib/access/server";
import {
  getLinkedInCampaignPosts,
  type OutboundPost,
} from "@/lib/outbound/outbound-content-loader";

// ─── Types ────────────────────────────────────────────────────────────────────

type PostItem = {
  id: string;
  slug: string;
  postType: string;
  seriesWeek: number;
  sequence: number;
  status: string;
  approvalStatus: string;
  scheduledFor: string | null;
  requiresFinalApproval: boolean;
  sourceMaterial: string | null;
  link: string | null;
  imagePath: string | null;
  tone: string | null;
  syncTargets: string[];
  idempotencyKey: string;
  textPreview: string;
};

type WeekGroup = {
  seriesWeek: number;
  items: PostItem[];
};

type PageProps = {
  campaignSlug: string;
  weeks: WeekGroup[];
  count: number;
  weekCount: number;
  errors: { filename: string; message: string }[];
  schedulerEnabled: boolean;
};

// ─── Server-side data loading ─────────────────────────────────────────────────

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const guard = await requireAdminPage(ctx);
  if (!guard.authorized) return guard.redirect as never;

  const { campaign } = ctx.params as { campaign: string };
  const { posts, errors } = getLinkedInCampaignPosts(campaign);

  // Group by week, sort by sequence
  const weekMap = new Map<number, OutboundPost[]>();
  for (const post of posts) {
    const week = post.seriesWeek ?? 0;
    const group = weekMap.get(week) ?? [];
    group.push(post);
    weekMap.set(week, group);
  }

  const weeks: WeekGroup[] = Array.from(weekMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([seriesWeek, items]) => ({
      seriesWeek,
      items: items
        .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
        .map((p) => ({
          id: p.id,
          slug: p.slug,
          postType: p.postType,
          seriesWeek: seriesWeek,
          sequence: p.sequence ?? 0,
          status: p.status,
          approvalStatus: p.approvalStatus,
          scheduledFor: p.scheduledFor,
          requiresFinalApproval: p.requiresFinalApproval,
          sourceMaterial: p.sourceMaterial,
          link: p.link,
          imagePath: p.imagePath,
          tone: p.tone,
          syncTargets: p.syncTargets,
          idempotencyKey: p.idempotencyKey,
          textPreview: p.text.slice(0, 400) + (p.text.length > 400 ? "…" : ""),
        })),
    }));

  return {
    props: {
      campaignSlug: campaign,
      weeks,
      count: posts.length,
      weekCount: weekMap.size,
      errors,
      schedulerEnabled: process.env.OUTBOUND_SCHEDULER_ENABLED === "true",
    },
  };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function approvalTone(status: string): AdminBadgeTone {
  if (status === "approved") return "success";
  if (status === "rejected") return "danger";
  return "warning"; // needs_review
}

function postTypeTone(type: string): AdminBadgeTone {
  if (type === "thesis") return "info";
  if (type === "applied") return "success";
  return "muted"; // reflective
}

function formatDate(iso: string | null): string {
  if (!iso) return "unscheduled";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({ post, weekIsApproved }: { post: PostItem; weekIsApproved: boolean }) {
  const [validating, setValidating] = React.useState(false);
  const [validation, setValidation] = React.useState<{
    valid: boolean;
    issues: string[];
    textPreview: string;
  } | null>(null);

  async function runDryRun() {
    setValidating(true);
    setValidation(null);
    try {
      const r = await fetch("/api/admin/outbound/linkedin/campaigns/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });
      const data = await r.json().catch(() => ({ valid: false, issues: ["Unexpected server error."], textPreview: "" }));
      setValidation({ valid: data.valid ?? false, issues: data.issues ?? [], textPreview: data.textPreview ?? "" });
    } catch {
      setValidation({ valid: false, issues: ["Network error — could not reach validate endpoint."], textPreview: "" });
    } finally {
      setValidating(false);
    }
  }

  const isApproved = post.approvalStatus === "approved";
  // Publish blocked: scheduler disabled, or not approved, or requiresFinalApproval
  const publishBlocked = true; // OUTBOUND_SCHEDULER_ENABLED=false — always blocked in UI

  return (
    <article className="border border-white/10 bg-black/25 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <AdminStatusBadge label={post.postType} tone={postTypeTone(post.postType)} />
            <AdminStatusBadge label={`seq ${post.sequence}`} tone="muted" />
            <AdminStatusBadge label={post.approvalStatus.replace("_", " ")} tone={approvalTone(post.approvalStatus)} />
            <AdminStatusBadge label={post.status} tone={post.status === "ready" ? "success" : "muted"} />
          </div>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">{post.slug}</p>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-white/45">
            <span><Clock className="mr-1 inline h-3 w-3" />{formatDate(post.scheduledFor)}</span>
            {post.sourceMaterial && (
              <span><FileText className="mr-1 inline h-3 w-3" />{post.sourceMaterial}</span>
            )}
            {post.tone && <span>Tone: {post.tone}</span>}
          </div>
          {post.link && (
            <p className="mt-1 text-xs text-sky-300/60 break-all">{post.link}</p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={runDryRun}
            disabled={validating}
            className="inline-flex items-center gap-2 border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {validating ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Dry-run validate
          </button>
          <button
            type="button"
            disabled={publishBlocked}
            title={
              !isApproved
                ? "Set approvalStatus: approved in frontmatter first."
                : "Scheduler disabled. Enable OUTBOUND_SCHEDULER_ENABLED and manually publish."
            }
            className="inline-flex items-center gap-2 border border-white/10 px-3 py-2 text-xs text-white/30 cursor-not-allowed"
          >
            Publish
          </button>
        </div>
      </div>

      {/* Text preview */}
      <div className="mt-4 border border-white/10 bg-zinc-950 p-3">
        <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.2em] text-white/30">Post preview</p>
        <p className="whitespace-pre-wrap text-sm leading-6 text-white/65">{post.textPreview}</p>
      </div>

      {/* Validation result */}
      {validation !== null && (
        <div className={`mt-3 border p-3 ${validation.valid ? "border-emerald-400/20 bg-emerald-400/5" : "border-rose-400/20 bg-rose-400/5"}`}>
          <div className="flex items-center gap-2">
            {validation.valid
              ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              : <AlertCircle className="h-4 w-4 text-rose-400" />}
            <p className="text-sm font-medium text-white/80">
              {validation.valid ? "Dry-run passed — no gate issues found." : `${validation.issues.length} gate issue${validation.issues.length === 1 ? "" : "s"} found.`}
            </p>
          </div>
          {validation.issues.length > 0 && (
            <ul className="mt-2 space-y-1">
              {validation.issues.map((issue, i) => (
                <li key={i} className="text-xs text-rose-200/75">— {issue}</li>
              ))}
            </ul>
          )}
          {!validation.valid && post.approvalStatus !== "approved" && (
            <p className="mt-2 text-xs text-amber-200/65">
              To approve: open the file at{" "}
              <code className="font-mono text-amber-100/80">content/outbound/linkedin/the-burden-changes-hands/{post.slug}.md</code>{" "}
              and change <code className="font-mono text-amber-100/80">approvalStatus: needs_review</code> to{" "}
              <code className="font-mono text-amber-100/80">approvalStatus: approved</code>.
            </p>
          )}
        </div>
      )}

      {/* Approval gate notice */}
      {!weekIsApproved && (
        <p className="mt-3 text-xs text-white/30">
          Week 1 posts must be manually reviewed and approved before this week is activated.
        </p>
      )}
    </article>
  );
}

// ─── Week Section ─────────────────────────────────────────────────────────────

function WeekSection({ week, isFirstWeek }: { week: WeekGroup; isFirstWeek: boolean }) {
  const allApproved = week.items.every((p) => p.approvalStatus === "approved");
  const anyApproved = week.items.some((p) => p.approvalStatus === "approved");
  const firstScheduled = week.items[0]?.scheduledFor ?? null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-4 border-b border-white/10 pb-3">
        <div>
          <h2 className="font-serif text-2xl text-white">
            Week {week.seriesWeek}
            {isFirstWeek && (
              <span className="ml-3 text-xs font-sans font-normal text-amber-200/60 uppercase tracking-wider">
                First approval wave
              </span>
            )}
          </h2>
          <p className="mt-1 text-xs text-white/35">
            {week.items.length} post{week.items.length !== 1 ? "s" : ""}
            {firstScheduled ? ` · starts ${formatDate(firstScheduled)}` : ""}
            {" · "}
            {allApproved
              ? "All approved"
              : anyApproved
                ? `${week.items.filter((p) => p.approvalStatus === "approved").length} of ${week.items.length} approved`
                : "Needs review"}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          {week.items.map((p) => (
            <AdminStatusBadge
              key={p.id}
              label={p.postType[0]?.toUpperCase() ?? "?"}
              tone={approvalTone(p.approvalStatus)}
            />
          ))}
        </div>
      </div>

      {week.items.map((post) => (
        <PostCard key={post.id} post={post} weekIsApproved={isFirstWeek || allApproved} />
      ))}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CampaignAdminPage({
  campaignSlug,
  weeks,
  count,
  weekCount,
  errors,
  schedulerEnabled,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const week1AllApproved = weeks[0]?.items.every((p) => p.approvalStatus === "approved") ?? false;

  return (
    <AdminLayout title="LinkedIn Campaign Queue">
      <Head>
        <title>Campaign Queue — {campaignSlug} | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div className="space-y-8">

        {/* Header */}
        <section className="border border-sky-400/15 bg-gradient-to-br from-sky-400/8 to-transparent p-6">
          <nav className="mb-4 flex items-center gap-2 text-xs text-white/35">
            <Link href="/admin/outbound/linkedin" className="hover:text-white/70">LinkedIn Outbound</Link>
            <ChevronRight className="h-3 w-3" />
            <span>Campaigns</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white/60">{campaignSlug}</span>
          </nav>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-sky-200/50">Campaign queue</p>
          <h1 className="mt-2 font-serif text-3xl text-white">{campaignSlug.replace(/-/g, " ")}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/50">
            {count} posts across {weekCount} weeks. All posts require manual final approval before publish.
            Scheduler is currently <strong className={schedulerEnabled ? "text-amber-200" : "text-white/70"}>{schedulerEnabled ? "enabled" : "disabled"}</strong>.
          </p>

          {/* Governance notice */}
          <div className="mt-4 border border-amber-400/20 bg-amber-400/5 p-3">
            <p className="text-xs leading-5 text-amber-100/70">
              <strong>Approval discipline:</strong> Approve Week 1 posts only. Review performance manually before approving Week 2.
              No post will publish without <code className="font-mono text-amber-100/80">approvalStatus: approved</code> in its frontmatter.
              Auto-publish is disabled (<code className="font-mono text-amber-100/80">OUTBOUND_SCHEDULER_ENABLED=false</code>).
            </p>
          </div>
        </section>

        {/* Loader errors */}
        {errors.length > 0 && (
          <section className="border border-rose-400/20 bg-rose-400/5 p-4">
            <p className="text-sm font-medium text-rose-200">Loader errors ({errors.length})</p>
            <ul className="mt-2 space-y-1">
              {errors.map((e) => (
                <li key={e.filename} className="text-xs text-rose-200/70">
                  {e.filename}: {e.message}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Week 1 approval status banner */}
        {!week1AllApproved && (
          <div className="border border-sky-400/15 bg-sky-400/5 p-4">
            <p className="text-sm text-sky-200/70">
              Week 1 is not yet approved. Run dry-run validation on Week 1 posts, then update their frontmatter to{" "}
              <code className="font-mono text-sky-100/80">approvalStatus: approved</code> before proceeding to Week 2.
            </p>
          </div>
        )}

        {/* Week groups */}
        {weeks.map((week, i) => (
          <WeekSection
            key={week.seriesWeek}
            week={week}
            isFirstWeek={i === 0}
          />
        ))}

        {weeks.length === 0 && (
          <p className="text-sm text-white/45">No posts found for campaign: {campaignSlug}.</p>
        )}

        {/* Scheduler state */}
        <section className="border border-white/10 bg-zinc-950/50 p-4">
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/30">Scheduler state</p>
          <p className="mt-2 text-sm text-white/50">
            Auto-publish is <strong className={schedulerEnabled ? "text-amber-200" : "text-emerald-300/80"}>{schedulerEnabled ? "ENABLED" : "DISABLED"}</strong>.
            {!schedulerEnabled && " Posts will not auto-publish. Enable OUTBOUND_SCHEDULER_ENABLED after manual dry-run and one controlled publish passes audit."}
          </p>
        </section>
      </div>
    </AdminLayout>
  );
}
