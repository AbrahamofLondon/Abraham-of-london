import * as React from "react";
import Head from "next/head";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";

import AdminLayout from "@/components/admin/AdminLayout";
import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { requireAdminPage } from "@/lib/access/server";
import { resolveGmiReleaseState } from "@/lib/intelligence/gmi-release-authority";

type MetricRecord = Record<string, string | number | boolean>;

type ControlPlane = {
  publicationReadiness: {
    editionId: string;
    publicationStatus: string;
    callsPendingReviewCount: number;
    releaseBlockingSourcesOpen: number;
    falsificationThresholdsMissing: number;
    finalVerdict: "READY" | "BLOCKED";
    blockerReasons: string[];
  };
  sections: Array<[string, MetricRecord]>;
};

type Props = {
  controlPlane: ControlPlane;
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const guard = await requireAdminPage<Props>(ctx);
  if (!guard.authorized) return guard.redirect as never;

  const state = await resolveGmiReleaseState("GMI-Q2-2026");
  return {
    props: {
      controlPlane: {
        publicationReadiness: {
          editionId: state.editionId,
          publicationStatus: state.releaseStatus,
          callsPendingReviewCount: state.metrics.unscoredCalls,
          releaseBlockingSourcesOpen: state.metrics.releaseBlockingSourcesOpen,
          falsificationThresholdsMissing: state.metrics.falsificationRulesMissing,
          finalVerdict: state.canPublish ? "READY" : "BLOCKED",
          blockerReasons: state.blockers.filter((blocker) => blocker.blocksPublication).map((blocker) => blocker.message),
        },
        sections: [
          ["Call Ledger Integrity", {
            totalCalls: state.metrics.totalCalls,
            scoredCalls: state.metrics.reviewedCalls,
            unscoredCalls: state.metrics.unscoredCalls,
            carriedForwardCalls: state.metrics.carriedForwardCalls,
            disconfirmedCalls: state.metrics.disconfirmedCalls,
            lastLedgerMutationAt: state.metrics.lastLedgerMutationAt ?? "none",
          }],
          ["Source Appendix Integrity", {
            releaseBlockingSourcesOpen: state.metrics.releaseBlockingSourcesOpen,
            sourceMethodNotesMissing: state.metrics.sourceMethodNotesMissing,
            sourceProvenance: state.provenance.sources.sourceType,
            sourceRows: state.provenance.sources.recordCount,
          }],
          ["Falsification Integrity", {
            activeTheses: state.provenance.falsificationRules.recordCount,
            highConvictionTheses: state.metrics.highConvictionTheses,
            falsificationThresholdsMissing: state.metrics.falsificationRulesMissing,
            falsificationProvenance: state.provenance.falsificationRules.sourceType,
          }],
          ["Board Consequence Integrity", {
            boardPulseComplete: state.metrics.boardPulseComplete,
            boardPackPdfAvailable: state.metrics.boardPackPdfAvailable,
            operatorBriefPublic: state.metrics.operatorBriefPublic,
            boardProvenance: state.provenance.boardPulse.sourceType,
          }],
          ["Public Trust Surface", {
            performancePageLive: state.metrics.performancePageLive,
            redTeamIntakeLive: state.metrics.redTeamIntakeLive,
            dataDerived: state.provenance.isDataDerived,
            latestReleaseCheckAt: state.metrics.lastReleaseCheckAt,
          }],
          ["Release Snapshot / Provenance", {
            callLedgerSource: state.provenance.calls.sourceType,
            sourceAppendixSource: state.provenance.sources.sourceType,
            falsificationSource: state.provenance.falsificationRules.sourceType,
            boardPulseSource: state.provenance.boardPulse.sourceType,
            performanceSource: state.provenance.performance.sourceType,
          }],
        ],
      },
    },
  };
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

        {controlPlane.sections.map(([title, record]) => (
          <section key={String(title)} className="border border-white/10 bg-zinc-950/70 p-6">
            <h2 className="font-serif text-xl text-white">{String(title)}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {metricEntries(record).map((item) => (
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
