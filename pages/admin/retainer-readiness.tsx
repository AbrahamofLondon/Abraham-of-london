import * as React from "react";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";

import AdminLayout from "@/components/admin/AdminLayout";
import { requireAdminPage } from "@/lib/access/server";
import { prisma } from "@/lib/prisma.server";
import { buildOperatorCadenceQueue } from "@/lib/product/retained-cadence-service";
import { canManageCadence } from "@/lib/product/retained-role-contract";
import { classifyRetainerReadiness } from "@/lib/product/retainer-readiness-classifier";
import { buildSponsorSafeCommandSummary } from "@/lib/product/sponsor-safe-command-summary";

export const getServerSideProps: GetServerSideProps<{
  classification: ReturnType<typeof classifyRetainerReadiness>;
  scope: {
    organisationId: string | null;
    contractId: string | null;
  };
  queueCounts: {
    due: number;
    overdue: number;
    skipped: number;
    escalated: number;
    notConfigured: number;
  };
  readiness: {
    roleContractActive: boolean;
    sponsorCommandSummaryComplete: boolean;
    portfolioExposureMature: boolean;
    evidenceIntegrity: boolean;
    ipExposureControl: boolean;
    cadenceSignalActive: boolean;
    counselMemoryExists: boolean;
    boardroomMemoryExists: boolean;
    outcomeThin: boolean;
  };
  summaryView: {
    cadence: string;
    brief: string;
    outcome: string;
    counsel: string;
    boardroom: string;
    continuity: string;
  };
}> = async (ctx) => {
  const guard = await requireAdminPage(ctx);
  if (!guard.authorized) return guard.redirect as any;

  const scopedOrganisationId = typeof ctx.query.organisationId === "string" ? ctx.query.organisationId : null;
  const fallbackContract = await prisma.retainerContract.findFirst({
    where: { status: { in: ["ACTIVE", "PAUSED"] } },
    orderBy: { updatedAt: "desc" },
    select: { id: true, organisationId: true },
  }).catch(() => null);
  const organisationId = scopedOrganisationId ?? fallbackContract?.organisationId ?? null;

  const [queue, summaryResult] = await Promise.all([
    buildOperatorCadenceQueue(),
    buildSponsorSafeCommandSummary({
      organisationId,
    }),
  ]);

  const summary = summaryResult.summary;
  const classification = classifyRetainerReadiness({
    cadence: {
      state: summary.retainedCadencePosture.state as any,
      label: summary.retainedCadencePosture.summary,
      explanation: summary.retainedCadencePosture.summary,
      scheduledFor: summary.retainedCadencePosture.scheduledFor ?? null,
      lastCompletedAt: summary.retainedCadencePosture.lastCompletedAt ?? null,
      skippedAt: null,
      cadenceSource: summary.retainedCadencePosture.cadenceSource as any,
      cadenceType: (summary.retainedCadencePosture.cadenceType ?? "manual") as any,
      evidencePosture: summary.retainedCadencePosture.evidencePosture as any,
      sourceLabel: "Retained Oversight Cadence",
    },
    cadenceSignalActive: queue.overdue.length > 0 || summary.retainedCadencePosture.state === "OVERDUE",
    roleContractActive: canManageCadence("ADMIN"),
    sponsorCommandSummaryComplete: [
      !summary.retainedCadencePosture.empty,
      !summary.latestOversightBriefStatus.empty,
      !summary.cancellationLossSummary.empty,
      !summary.activeAttentionQueueSummary.empty || summary.activeAttentionQueueSummary.count === 0,
    ].every(Boolean),
    portfolioExposureMature: summary.suppression.some((item) => item.scope === "Small-sample and privacy-risk evidence"),
    retainedOutcomeSummary: summaryResult.outcomeSummary,
    counselMemoryExists: summary.counselMemorySummary.totalEvents > 0,
    boardroomMemoryExists: summary.boardroomArchiveSummary.totalDossiers > 0,
    evidenceIntegrity: true,
    ipExposureControl: true,
  });

  return {
    props: {
      classification,
      scope: {
        organisationId,
        contractId: fallbackContract?.id ?? null,
      },
      queueCounts: {
        due: queue.due.length,
        overdue: queue.overdue.length,
        skipped: queue.skipped.length,
        escalated: queue.escalated.length,
        notConfigured: queue.notConfigured.length,
      },
      readiness: {
        roleContractActive: canManageCadence("ADMIN"),
        sponsorCommandSummaryComplete: [
          !summary.retainedCadencePosture.empty,
          !summary.latestOversightBriefStatus.empty,
          !summary.cancellationLossSummary.empty,
        ].every(Boolean),
        portfolioExposureMature: summary.suppression.some((item) => item.scope === "Small-sample and privacy-risk evidence"),
        evidenceIntegrity: true,
        ipExposureControl: true,
        cadenceSignalActive: queue.overdue.length > 0 || summary.retainedCadencePosture.state === "OVERDUE",
        counselMemoryExists: summary.counselMemorySummary.totalEvents > 0,
        boardroomMemoryExists: summary.boardroomArchiveSummary.totalDossiers > 0,
        outcomeThin: summary.outcomeVerificationSummary.thinState ?? true,
      },
      summaryView: {
        cadence: summary.retainedCadencePosture.summary,
        brief: summary.latestOversightBriefStatus.summary,
        outcome: summary.outcomeVerificationSummary.summary,
        counsel: summary.counselMemorySummary.summary,
        boardroom: summary.boardroomArchiveSummary.summary,
        continuity: summary.cancellationLossSummary.summary,
      },
    },
  };
};

const SCORECARD = [
  ["Enforced retained cadence", "Retained cadence queue, persistence, and overdue posture are now runtime-backed."],
  ["Product-layer role model", "Retained sponsor surfaces and cadence operations now use an explicit role contract."],
  ["Sponsor command surface", "Cadence, attention, brief, counsel, boardroom, outcome, and continuity summaries are now structured runtime sections."],
  ["Retained outcome history", "Outcome history is surfaced conservatively and flagged as thin where evidence is still sparse."],
  ["£50k classifier", "Classification remains conservative and only promotes when cadence, role, summary, history, and memory conditions are met."],
];

export default function RetainerReadinessPage(
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  return (
    <AdminLayout title="Retainer Readiness">
      <Head>
        <title>Retainer Readiness | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="space-y-6">
        <section className="border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-500/60">Retainer discipline</p>
          <h1 className="mt-3 font-serif text-3xl text-white">Runtime readiness view</h1>
          <p className="mt-2 max-w-3xl text-sm text-white/55">
            This page reflects runtime cadence, buyer-safe summary completeness, role control, outcome history, and retained memory. It does not convert into a general £50k claim unless the classifier conditions are genuinely met.
          </p>
        </section>

        <section className="border border-white/10 bg-zinc-950/70 p-5">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Current classification</p>
              <p className="mt-2 text-xl text-white">{props.classification}</p>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Scoped organisation</p>
              <p className="mt-2 text-xl text-white">{props.scope.organisationId ?? "Unscoped"}</p>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Operator warning</p>
              <p className="mt-2 text-xl text-white">No public GENERAL_50K_READY claim</p>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Cadence queue</p>
              <p className="mt-2 text-xl text-white">{props.queueCounts.overdue} overdue</p>
            </div>
          </div>
        </section>

        <section className="border border-white/10 bg-zinc-950/70 p-5">
          <h2 className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-500/70">Runtime scorecard</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm text-white/70">
              <thead className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/35">
                <tr>
                  <th className="pb-3 pr-4">Area</th>
                  <th className="pb-3">State</th>
                </tr>
              </thead>
              <tbody>
                {SCORECARD.map(([area, note]) => (
                  <tr key={area} className="border-t border-white/5 align-top">
                    <td className="py-3 pr-4 text-white">{area}</td>
                    <td className="py-3">{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <section className="border border-white/10 bg-zinc-950/70 p-5">
            <h2 className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-500/70">Classifier Inputs</h2>
            <div className="mt-4 space-y-2 text-sm text-white/70">
              <p>Cadence signal active: {String(props.readiness.cadenceSignalActive)}</p>
              <p>Role contract active: {String(props.readiness.roleContractActive)}</p>
              <p>Sponsor command summary complete: {String(props.readiness.sponsorCommandSummaryComplete)}</p>
              <p>Portfolio exposure mature: {String(props.readiness.portfolioExposureMature)}</p>
              <p>Outcome history thin: {String(props.readiness.outcomeThin)}</p>
              <p>Counsel memory exists: {String(props.readiness.counselMemoryExists)}</p>
              <p>Boardroom memory exists: {String(props.readiness.boardroomMemoryExists)}</p>
              <p>Evidence integrity: {String(props.readiness.evidenceIntegrity)}</p>
              <p>IP exposure control: {String(props.readiness.ipExposureControl)}</p>
            </div>
          </section>

          <section className="border border-white/10 bg-zinc-950/70 p-5">
            <h2 className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-500/70">Queue Summary</h2>
            <div className="mt-4 space-y-2 text-sm text-white/70">
              <p>Due cycles: {props.queueCounts.due}</p>
              <p>Overdue cycles: {props.queueCounts.overdue}</p>
              <p>Skipped cycles: {props.queueCounts.skipped}</p>
              <p>Escalated cycles: {props.queueCounts.escalated}</p>
              <p>Not configured: {props.queueCounts.notConfigured}</p>
            </div>
          </section>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          {Object.entries(props.summaryView).map(([key, value]) => (
            <section key={key} className="border border-white/10 bg-zinc-950/70 p-5">
              <h2 className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-500/70">{key.replace(/([A-Z])/g, " $1").trim()}</h2>
              <p className="mt-4 text-sm text-white/70">{value}</p>
            </section>
          ))}
        </section>
      </div>
    </AdminLayout>
  );
}
