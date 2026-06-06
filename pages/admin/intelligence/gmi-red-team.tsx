import * as React from "react";
import Head from "next/head";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { ShieldAlert } from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { AdminStatusBadge, type AdminBadgeTone } from "@/components/admin/AdminStatusBadge";
import { requireAdminPage } from "@/lib/access/server";
import {
  listGmiRedTeamSubmissions,
  type GmiRedTeamSubmissionView,
} from "@/lib/intelligence/gmi-red-team-store";

type PageProps = {
  submissions: GmiRedTeamSubmissionView[];
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const guard = await requireAdminPage<PageProps>(ctx);
  if (!guard.authorized) return guard.redirect as never;

  return {
    props: {
      submissions: await listGmiRedTeamSubmissions(),
    },
  };
};

function toneForStatus(status: string): AdminBadgeTone {
  if (status === "acknowledged" || status === "incorporated") return "success";
  if (status === "disconfirmed_call") return "critical";
  if (status === "rejected" || status === "closed") return "muted";
  return "warning";
}

export default function GmiRedTeamAdminPage({
  submissions,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState("acknowledged");
  const [adminNotes, setAdminNotes] = React.useState("");
  const [publicResponse, setPublicResponse] = React.useState("");
  const [message, setMessage] = React.useState<string | null>(null);

  async function submitReview(event: React.FormEvent) {
    event.preventDefault();
    if (!activeId) return;
    setMessage("Saving...");
    const res = await fetch("/api/admin/intelligence/gmi/red-team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: activeId, status, adminNotes, publicResponse }),
    });
    const body = await res.json().catch(() => ({}));
    setMessage(res.ok && body?.ok !== false ? "Review saved. Refresh to reload queue." : body?.warning || body?.error || "Review failed.");
  }

  return (
    <AdminLayout title="GMI Red Team">
      <Head>
        <title>GMI Red Team | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="space-y-6">
        <section className="border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-6">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-1 h-4 w-4 text-amber-400/80" />
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-400/70">
                Red Team Governance Queue
              </p>
              <h1 className="mt-3 font-serif text-3xl text-white">GMI Red Team Review</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
                Review sourced challenges, decide whether they are acknowledged, rejected, incorporated, or material enough to disconfirm a call. Private submitter email remains admin-only.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-4">
          <AdminMetricCard label="Total submissions" value={submissions.length} variant="inner" />
          <AdminMetricCard label="Pending" value={submissions.filter((s) => s.status === "pending").length} tone="warning" variant="inner" />
          <AdminMetricCard label="Acknowledged" value={submissions.filter((s) => s.status === "acknowledged").length} tone="success" variant="inner" />
          <AdminMetricCard label="Incorporated" value={submissions.filter((s) => s.status === "incorporated").length} tone="success" variant="inner" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-3">
            {submissions.map((submission) => (
              <article key={submission.id} className="border border-white/10 bg-zinc-950/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-amber-300/65">
                      {submission.id} · {submission.callId ?? "No call"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/65">{submission.counterArgument}</p>
                  </div>
                  <AdminStatusBadge label={submission.status} tone={toneForStatus(submission.status)} />
                </div>
                <p className="mt-3 text-xs leading-6 text-white/45">{submission.evidence}</p>
                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  <AdminMetricCard label="Submitter" value={submission.submitterName} variant="inner" />
                  <AdminMetricCard label="Email" value={submission.submitterEmail ?? "hidden"} variant="inner" />
                  <AdminMetricCard label="Created" value={submission.createdAt.slice(0, 10)} variant="inner" />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveId(submission.id);
                    setStatus(submission.status === "pending" ? "acknowledged" : submission.status);
                    setAdminNotes(submission.adminNotes ?? "");
                    setPublicResponse(submission.publicResponse ?? "");
                  }}
                  className="mt-3 border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[9px] font-mono uppercase tracking-[0.16em] text-white/55"
                >
                  Review
                </button>
              </article>
            ))}
          </div>

          <form onSubmit={submitReview} className="h-fit border border-white/10 bg-zinc-950/70 p-4">
            <h2 className="font-serif text-xl text-white">Review Action</h2>
            <p className="mt-1 text-xs text-white/38">{activeId ?? "Select a submission"}</p>
            <label className="mt-4 block">
              <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/35">Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-2 w-full border border-white/10 bg-black px-3 py-2 text-sm text-white/75">
                {["acknowledged", "rejected", "incorporated", "disconfirmed_call", "closed"].map((item) => (
                  <option key={item} value={item}>{item.replace(/_/g, " ")}</option>
                ))}
              </select>
            </label>
            <label className="mt-4 block">
              <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/35">Admin notes</span>
              <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={4} className="mt-2 w-full border border-white/10 bg-black px-3 py-2 text-sm text-white/75" />
            </label>
            <label className="mt-4 block">
              <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/35">Public response</span>
              <textarea value={publicResponse} onChange={(e) => setPublicResponse(e.target.value)} rows={4} className="mt-2 w-full border border-white/10 bg-black px-3 py-2 text-sm text-white/75" />
            </label>
            <button disabled={!activeId} className="mt-4 border border-amber-500/35 bg-amber-500/10 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-amber-200 disabled:opacity-40">
              Save review
            </button>
            {message ? <p className="mt-3 text-xs text-white/45">{message}</p> : null}
          </form>
        </section>
      </div>
    </AdminLayout>
  );
}

