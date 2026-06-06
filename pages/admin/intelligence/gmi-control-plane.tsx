import * as React from "react";
import Head from "next/head";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";

import AdminLayout from "@/components/admin/AdminLayout";
import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { requireAdminPage } from "@/lib/access/server";
import { buildGmiControlPlane } from "@/lib/intelligence/gmi-control-plane";

type ControlPlane = ReturnType<typeof buildGmiControlPlane>;

type Props = {
  controlPlane: ControlPlane;
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const guard = await requireAdminPage<Props>(ctx);
  if (!guard.authorized) return guard.redirect as never;

  return { props: { controlPlane: buildGmiControlPlane("GMI-Q2-2026") } };
};

function metricEntries(record: Record<string, string | number | boolean>) {
  return Object.entries(record).map(([key, value]) => ({
    label: key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()),
    value: typeof value === "boolean" ? (value ? "Yes" : "No") : value,
  }));
}

export default function GmiControlPlanePage({
  controlPlane,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const readiness = controlPlane.publicationReadiness;
  return (
    <AdminLayout title="GMI Control Plane">
      <Head>
        <title>GMI Control Plane | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="space-y-6">
        <section className="border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-400/70">
                Governed intelligence control plane
              </p>
              <h1 className="mt-3 font-serif text-3xl text-white">GMI Publication Gate</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
                One screen for publication safety, source discipline, call ledger integrity, falsification, board consequence, public trust, and commercial routing.
              </p>
            </div>
            <AdminStatusBadge
              label={readiness.finalVerdict}
              tone={readiness.finalVerdict === "READY" ? "success" : "danger"}
              size="md"
            />
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-5">
          <AdminMetricCard label="Edition" value={readiness.editionId} variant="inner" />
          <AdminMetricCard label="Status" value={readiness.publicationStatus} variant="inner" />
          <AdminMetricCard label="Calls pending" value={readiness.callsPendingReviewCount} tone={readiness.callsPendingReviewCount ? "danger" : "success"} variant="inner" />
          <AdminMetricCard label="Source blockers" value={readiness.releaseBlockingSourcesOpen} tone={readiness.releaseBlockingSourcesOpen ? "danger" : "success"} variant="inner" />
          <AdminMetricCard label="Falsification missing" value={readiness.falsificationThresholdsMissing} tone={readiness.falsificationThresholdsMissing ? "danger" : "success"} variant="inner" />
        </section>

        {readiness.blockerReasons.length > 0 ? (
          <section className="border border-rose-500/15 bg-rose-500/5 p-6">
            <h2 className="font-serif text-xl text-white">Publication blockers</h2>
            <div className="mt-4 space-y-2">
              {readiness.blockerReasons.map((reason) => (
                <p key={reason} className="border border-rose-500/15 bg-black/20 p-3 text-sm text-rose-100/75">{reason}</p>
              ))}
            </div>
          </section>
        ) : null}

        {[
          ["Call Ledger Integrity", controlPlane.callLedgerIntegrity],
          ["Source Appendix Integrity", controlPlane.sourceAppendixIntegrity],
          ["Falsification Integrity", controlPlane.falsificationIntegrity],
          ["Board Consequence Integrity", controlPlane.boardConsequenceIntegrity],
          ["Public Trust Surface", controlPlane.publicTrustSurface],
          ["Commercial Routing", controlPlane.commercialRouting],
        ].map(([title, record]) => (
          <section key={String(title)} className="border border-white/10 bg-zinc-950/70 p-6">
            <h2 className="font-serif text-xl text-white">{String(title)}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {metricEntries(record as Record<string, string | number | boolean>).map((item) => (
                <AdminMetricCard key={item.label} label={item.label} value={item.value} variant="inner" />
              ))}
            </div>
          </section>
        ))}

        <section className="border border-white/10 bg-black/30 p-4">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">
            Publication rule: no GMI edition should publish unless this control plane returns READY.
          </p>
        </section>
      </div>
    </AdminLayout>
  );
}
