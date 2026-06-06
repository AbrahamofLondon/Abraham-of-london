import * as React from "react";
import Head from "next/head";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";

import AdminLayout from "@/components/admin/AdminLayout";
import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { requireAdminPage } from "@/lib/access/server";
import { buildGmiControlPlane, buildGmiFalsificationRegister } from "@/lib/intelligence/gmi-control-plane";

type Props = {
  rules: ReturnType<typeof buildGmiFalsificationRegister>;
  integrity: ReturnType<typeof buildGmiControlPlane>["falsificationIntegrity"];
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const guard = await requireAdminPage<Props>(ctx);
  if (!guard.authorized) return guard.redirect as never;
  const controlPlane = buildGmiControlPlane("GMI-Q2-2026");
  return {
    props: {
      rules: buildGmiFalsificationRegister("GMI-Q2-2026"),
      integrity: controlPlane.falsificationIntegrity,
    },
  };
};

export default function GmiFalsificationAdminPage({
  rules,
  integrity,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <AdminLayout title="GMI Falsification">
      <Head>
        <title>GMI Falsification | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div className="space-y-6">
        <section className="border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-6">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-400/70">
            Falsification governance
          </p>
          <h1 className="mt-3 font-serif text-3xl text-white">GMI Falsification Register</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
            Major theses must state observable triggers, thresholds, evidence rows, review dates, and public explanation before high conviction publication.
          </p>
        </section>

        <section className="grid gap-3 md:grid-cols-5">
          <AdminMetricCard label="Active theses" value={integrity.activeTheses} variant="inner" />
          <AdminMetricCard label="With thresholds" value={integrity.thesesWithFalsificationThresholds} variant="inner" />
          <AdminMetricCard label="Missing trigger" value={integrity.thesesMissingObservableTrigger} tone={integrity.thesesMissingObservableTrigger ? "danger" : "success"} variant="inner" />
          <AdminMetricCard label="Due for review" value={integrity.thresholdsDueForReview} tone={integrity.thresholdsDueForReview ? "warning" : "success"} variant="inner" />
          <AdminMetricCard label="Admin action" value={integrity.adminActionRequired ? "Required" : "Clear"} tone={integrity.adminActionRequired ? "danger" : "success"} variant="inner" />
        </section>

        <section className="space-y-4">
          {rules.map((rule) => (
            <article key={rule.id} className="border border-white/10 bg-zinc-950/70 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-amber-300/65">{rule.thesisId}</p>
                  <h2 className="mt-2 font-serif text-xl text-white">{rule.thesisStatement}</h2>
                </div>
                <AdminStatusBadge
                  label={rule.currentStatus}
                  tone={rule.currentStatus === "breached" ? "danger" : "info"}
                />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <AdminMetricCard label="Threshold type" value={rule.thresholdType} variant="inner" />
                <AdminMetricCard label="Next review" value={rule.nextReviewDue} variant="inner" />
                <AdminMetricCard label="Evidence rows" value={rule.evidenceSourceRows.length} variant="inner" />
                <AdminMetricCard label="Last reviewed" value={rule.lastReviewedAt ?? "Not reviewed"} variant="inner" />
              </div>
              <p className="mt-4 text-sm leading-6 text-white/55">{rule.falsificationCondition}</p>
            </article>
          ))}
        </section>
      </div>
    </AdminLayout>
  );
}
