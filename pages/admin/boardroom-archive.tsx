import * as React from "react";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";

import AdminLayout from "@/components/admin/AdminLayout";
import { requireAdminPage } from "@/lib/access/server";
import { loadBoardroomDossierArchiveSummary } from "@/lib/product/boardroom-dossier-archive";
import { summarizeBoardroomHistory } from "@/lib/product/boardroom-history-summary";

export const getServerSideProps: GetServerSideProps<{
  organisationId: string | null;
  summary: Awaited<ReturnType<typeof loadBoardroomDossierArchiveSummary>> | null;
  history: ReturnType<typeof summarizeBoardroomHistory> | null;
}> = async (ctx) => {
  const guard = await requireAdminPage(ctx);
  if (!guard.authorized) return guard.redirect as any;

  const organisationId = typeof ctx.query.organisationId === "string" ? ctx.query.organisationId : null;
  if (!organisationId) {
    return { props: { organisationId: null, summary: null, history: null } };
  }

  const summary = await loadBoardroomDossierArchiveSummary({ organisationId });
  return {
    props: {
      organisationId,
      summary,
      history: summarizeBoardroomHistory(summary),
    },
  };
};

export default function BoardroomArchivePage({
  organisationId,
  summary,
  history,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <AdminLayout title="Boardroom Archive">
      <Head>
        <title>Boardroom Archive | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div className="space-y-6 text-white">
        <section className="border border-white/10 bg-white/5 p-6">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-500/70">Strategic memory</p>
          <h1 className="mt-3 font-serif text-3xl">Boardroom archive</h1>
          <form className="mt-4 flex gap-3" method="get">
            <input name="organisationId" defaultValue={organisationId ?? ""} className="w-full max-w-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" placeholder="Organisation id" />
            <button className="border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">Load</button>
          </form>
        </section>

        {!summary || !history ? (
          <section className="border border-white/10 bg-zinc-950/70 p-5 text-white/60">No organisation selected.</section>
        ) : (
          <>
            <section className="border border-white/10 bg-zinc-950/70 p-5">
              <p className="text-sm text-white/75">{history.headline}</p>
              <p className="mt-2 text-xs font-mono uppercase tracking-[0.18em] text-white/45">{history.trend} · repeated exposure {history.repeatedExposure}</p>
              {history.latestReason ? <p className="mt-3 text-sm text-white/55">Latest reason: {history.latestReason}</p> : null}
            </section>
            <section className="border border-white/10 bg-zinc-950/70 p-5">
              <div className="space-y-4">
                {summary.entries.map((entry) => (
                  <div key={entry.id} className="border-b border-white/10 pb-4">
                    <p className="text-xs font-mono uppercase tracking-[0.18em] text-amber-400/70">{entry.caseId}</p>
                    <p className="mt-2 text-sm text-white/75">{entry.dossierSummary}</p>
                    <p className="mt-2 text-sm text-white/55">{entry.triggerReason}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
