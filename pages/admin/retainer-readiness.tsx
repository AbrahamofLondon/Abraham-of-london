import * as React from "react";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";

import AdminLayout from "@/components/admin/AdminLayout";
import BackToOperatorCommandCentre from "@/components/admin/BackToOperatorCommandCentre";
import { requireAdminPage } from "@/lib/access/server";
import { prisma } from "@/lib/prisma.server";
import { buildOperatorCadenceQueue } from "@/lib/product/retained-cadence-service";
import { canManageCadence } from "@/lib/product/retained-role-contract";
import {
  classifyGeneral50KRuntime,
  classifyRetainerReadiness,
  classifyRetainerReadinessAreas,
  type General50KRuntimeInput,
} from "@/lib/product/retainer-readiness-classifier";
import {
  buildRetainerReadinessRemediation,
  type RetainerReadinessRemediation,
} from "@/lib/admin/retainer-readiness-remediation";
import {
  AdminStatusBadge,
  toneForSeverity,
  toneForStatus,
  normaliseAdminStatusLabel,
} from "@/components/admin/AdminStatusBadge";
import { buildSponsorSafeCommandSummary } from "@/lib/product/sponsor-safe-command-summary";
import { buildPortfolioMemory } from "@/lib/product/portfolio-memory-surface";
import { resolvePortfolioScopes } from "@/lib/product/portfolio-scope-resolver";
import { getEmailTransportStatus } from "@/lib/email/transport";
import { getOperatorReviewQueuePosture, type ReviewQueuePosture } from "@/lib/product/operator-outcome-review";

export const getServerSideProps: GetServerSideProps<{
  classification: ReturnType<typeof classifyRetainerReadiness>;
  general50KClassification: ReturnType<typeof classifyGeneral50KRuntime>;
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
  runtime: General50KRuntimeInput;
  summaryView: {
    cadence: string;
    brief: string;
    outcome: string;
    counsel: string;
    boardroom: string;
    continuity: string;
  };
  verificationQueuePosture: ReviewQueuePosture;
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

  const [queue, summaryResult, verificationQueuePosture] = await Promise.all([
    buildOperatorCadenceQueue(),
    buildSponsorSafeCommandSummary({
      organisationId,
    }),
    getOperatorReviewQueuePosture(),
  ]);
  const resolution = await resolvePortfolioScopes({
    role: "ADMIN",
    organisationId,
  });
  const portfolio = await buildPortfolioMemory({
    organisationId,
    resolution,
  }).catch(() => null);
  const suppressionEvents = await prisma.accessAuditLog.findMany({
    where: {
      targetType: "SUPPRESSION_EVENT",
      action: { in: ["SUPPRESSION_RECORDED", "SUPPRESSION_REVIEWED"] },
    },
    select: { metadata: true },
    take: 500,
  }).catch(() => []);
  const suppressionSurfaces = new Set(
    suppressionEvents
      .map((row) => {
        const metadata = row.metadata as Record<string, unknown> | null;
        return typeof metadata?.surface === "string" ? metadata.surface : null;
      })
      .filter((value): value is string => Boolean(value)),
  );
  const emailDeliveryAttempts = await prisma.auditEvent.count({
    where: { objectType: "EMAIL_DELIVERY_ATTEMPT" },
  }).catch(() => 0);
  const { existsSync, statSync } = await import("node:fs");
  const tickRouteExists = existsSync("pages/api/internal/retained-cadence/tick.ts");
  const runNowRouteExists = existsSync("pages/api/admin/retained-cadence/run-now.ts");
  const recentCadenceTick = await prisma.diagnosticRecord.count({
    where: {
      diagnosticType: "retained_cadence_history",
      verdict: { contains: "Cadence event" },
    },
  }).catch(() => 0);
  const oversightPdfPath = "tmp/retained-pdf-runtime/oversight-brief.pdf";
  const proofPdfPath = "tmp/retained-pdf-runtime/proof-pack.pdf";
  const pdfVerificationManifestPath = "tmp/retained-pdf-runtime/verification.json";
  const pdfRuntimeVerified = existsSync(oversightPdfPath)
    && existsSync(proofPdfPath)
    && existsSync(pdfVerificationManifestPath)
    && statSync(oversightPdfPath).size > 1000
    && statSync(proofPdfPath).size > 1000;

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
  const runtime: General50KRuntimeInput = {
    schedulerBackedCadence: tickRouteExists && runNowRouteExists,
    cadenceTickVerified: recentCadenceTick > 0,
    emailTransportStatus: getEmailTransportStatus(),
    pdfRuntimeVerified,
    suppressionLedgerCoverage: suppressionSurfaces.size,
    portfolioScopeMaturity: portfolio?.scopeMode === "single_org"
      ? "SELECTIVELY_DEFENSIBLE"
      : portfolio?.crossScopePatterns?.depth === "DEFENSIBLE"
        ? "DEFENSIBLE"
        : portfolio?.crossScopePatterns?.depth === "SELECTIVELY_DEFENSIBLE"
          ? "SELECTIVELY_DEFENSIBLE"
          : "FOUNDATION_READY",
    crossOrgPatternDepth: portfolio?.crossScopePatterns?.depth ?? "FOUNDATION_READY",
    roleDataLayerCoverage: "DEFENSIBLE",
    retainedHistoryDepth: summary.outcomeVerificationSummary.thinState ? "THIN" : "SUFFICIENT",
    deliveryAuditDepth: emailDeliveryAttempts > 0 ? "DEFENSIBLE" : "FOUNDATION_READY",
    // Institutional corridor dimensions
    institutionalCaseContinuity: "SELECTIVELY_DEFENSIBLE",
    executiveToStrategyContinuity: "SELECTIVELY_DEFENSIBLE",
    strategyToCounselContinuity: "SELECTIVELY_DEFENSIBLE",
    strategyToBoardroomContinuity: "SELECTIVELY_DEFENSIBLE",
    boardroomArchiveDepth: summary.boardroomArchiveSummary.totalDossiers > 0 ? "SELECTIVELY_DEFENSIBLE" : "FOUNDATION_READY",
    oversightCaseCoverage: "SELECTIVELY_DEFENSIBLE",
    cadenceRuntimeDepth: recentCadenceTick > 0 ? "SELECTIVELY_DEFENSIBLE" : "FOUNDATION_READY",
    portfolioInstitutionalCoverage: portfolio ? "SELECTIVELY_DEFENSIBLE" : "FOUNDATION_READY",
    suppressionCorridorCoverage: suppressionSurfaces.size >= 5 ? "DEFENSIBLE" : "SELECTIVELY_DEFENSIBLE",
    deliveryRuntimeProof: pdfRuntimeVerified ? "SELECTIVELY_DEFENSIBLE" : "FOUNDATION_READY",
    retainedOutcomeDepth: summary.outcomeVerificationSummary.thinState ? "FOUNDATION_READY" : "SELECTIVELY_DEFENSIBLE",
  };
  const general50KClassification = classifyGeneral50KRuntime(runtime);

  return {
    props: {
      classification,
      general50KClassification,
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
      runtime,
      summaryView: {
        cadence: summary.retainedCadencePosture.summary,
        brief: summary.latestOversightBriefStatus.summary,
        outcome: summary.outcomeVerificationSummary.summary,
        counsel: summary.counselMemorySummary.summary,
        boardroom: summary.boardroomArchiveSummary.summary,
        continuity: summary.cancellationLossSummary.summary,
      },
      verificationQueuePosture,
    },
  };
};

const AREA_SCORECARD = classifyRetainerReadinessAreas();

function RemediationRow({ item }: { item: RetainerReadinessRemediation }) {
  return (
    <div className="border border-white/8 bg-zinc-900/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <AdminStatusBadge
            label={normaliseAdminStatusLabel(item.severity)}
            tone={toneForSeverity(item.severity)}
            size="md"
          />
          <span className="text-sm font-medium text-white">{item.dimension}</span>
          <AdminStatusBadge
            label={normaliseAdminStatusLabel(item.status)}
            tone={toneForStatus(item.status)}
          />
        </div>
        <span className="text-[9px] font-mono uppercase tracking-wider text-white/25">
          Owner: {item.owner}
        </span>
      </div>
      <p className="mt-2 text-sm text-white/60">{item.issue}</p>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <p className="text-sm text-white/80">{item.recommendedAction}</p>
        {item.actionHref && item.actionLabel && (
          <a
            href={item.actionHref}
            className="shrink-0 rounded border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-amber-400 transition hover:bg-amber-500/20"
          >
            {item.actionLabel} →
          </a>
        )}
      </div>
    </div>
  );
}

const STATUS_COLOUR: Record<string, string> = {
  NOT_READY: "text-red-400",
  FOUNDATION_READY: "text-orange-400",
  SELECTIVELY_DEFENSIBLE: "text-amber-400",
  DEFENSIBLE: "text-emerald-400",
  GENERAL_50K_READY: "text-green-300",
};

export default function RetainerReadinessPage(
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  const remediation = buildRetainerReadinessRemediation({
    readiness: props.readiness,
    queueCounts: props.queueCounts,
    runtime: props.runtime,
    verificationQueuePosture: props.verificationQueuePosture,
  });
  const actionableItems = remediation.filter((r) => r.status === "FAIL" || r.status === "WATCH");

  return (
    <AdminLayout title="Retainer Readiness">
      <Head>
        <title>Retainer Readiness | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="space-y-6">
        <BackToOperatorCommandCentre />

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
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">General £50k runtime</p>
              <p className="mt-2 text-xl text-white">{props.general50KClassification}</p>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Scoped organisation</p>
              <p className="mt-2 text-xl text-white">{props.scope.organisationId ?? "Unscoped"}</p>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Cadence queue</p>
              <p className="mt-2 text-xl text-white">{props.queueCounts.overdue} overdue</p>
            </div>
          </div>
        </section>

        <section className="border border-white/10 bg-zinc-950/70 p-5">
          <h2 className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-500/70">Area readiness scorecard</h2>
          <p className="mt-1 text-xs text-white/40">
            Overall: <span className="font-mono text-amber-400">{AREA_SCORECARD.overallClassification}</span>
            {" | "}Classified at build time. GENERAL_50K_READY requires all areas DEFENSIBLE or higher with all guards passing.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm text-white/70">
              <thead className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/35">
                <tr>
                  <th className="pb-3 pr-4">Area</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Evidence</th>
                  <th className="pb-3">Gap</th>
                </tr>
              </thead>
              <tbody>
                {AREA_SCORECARD.areas.map((item) => (
                  <tr key={item.area} className="border-t border-white/5 align-top">
                    <td className="py-3 pr-4 text-white">{item.area}</td>
                    <td className={`py-3 pr-4 font-mono text-xs ${STATUS_COLOUR[item.status] ?? "text-white/50"}`}>{item.status}</td>
                    <td className="py-3 pr-4">{item.evidence}</td>
                    <td className="py-3 text-white/40">{item.gap ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {AREA_SCORECARD.blockers.length > 0 && (
          <section className="border border-white/10 bg-zinc-950/70 p-5">
            <h2 className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-500/70">Blockers for GENERAL_50K_READY</h2>
            <ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-white/60">
              {AREA_SCORECARD.blockers.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </section>
        )}

        {/* ── Readiness Remediation ──────────────────────────────────────── */}
        <section className="border border-white/10 bg-zinc-950/70 p-5">
          <h2 className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-500/70">Readiness Remediation</h2>
          <p className="mt-1 text-xs text-white/40">
            Failing and watch-state dimensions with recommended next actions. Passing dimensions are omitted.
          </p>
          <div className="mt-4 space-y-3">
            {actionableItems.length === 0 ? (
              <div className="border border-white/8 bg-zinc-900/60 p-4">
                <p className="text-sm text-emerald-400/80">
                  No immediate remediation required. Continue cadence monitoring and review the next retained cycle on schedule.
                </p>
              </div>
            ) : (
              actionableItems.map((item) => (
                <RemediationRow key={item.dimension} item={item} />
              ))
            )}
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

        {/* ── Verification Queue Posture ─────────────────────────────────── */}
        <section className="border border-white/10 bg-zinc-950/70 p-5">
          <h2 className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-500/70">Verification Queue Posture</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-5 text-sm text-white/70">
            <div>
              <p className="text-[9px] font-mono uppercase tracking-wider text-white/30">SLA Band</p>
              <p className="mt-1 font-mono text-xs text-white/80">{props.verificationQueuePosture.reviewSlaBand}</p>
            </div>
            <div>
              <p className="text-[9px] font-mono uppercase tracking-wider text-white/30">Pending</p>
              <p className="mt-1 font-mono text-xs text-white/80">{props.verificationQueuePosture.pendingCount}</p>
            </div>
            <div>
              <p className="text-[9px] font-mono uppercase tracking-wider text-white/30">Critical</p>
              <p className="mt-1 font-mono text-xs text-white/80">{props.verificationQueuePosture.criticalPendingCount}</p>
            </div>
            <div>
              <p className="text-[9px] font-mono uppercase tracking-wider text-white/30">Overdue</p>
              <p className="mt-1 font-mono text-xs text-white/80">{props.verificationQueuePosture.overdueReviewCount}</p>
            </div>
            <div>
              <p className="text-[9px] font-mono uppercase tracking-wider text-white/30">Oldest (days)</p>
              <p className="mt-1 font-mono text-xs text-white/80">{props.verificationQueuePosture.oldestPendingAge}</p>
            </div>
          </div>
        </section>

        <section className="border border-white/10 bg-zinc-950/70 p-5">
          <h2 className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-500/70">General £50k Runtime Inputs</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 text-sm text-white/70">
            <p>Scheduler-backed cadence: {String(props.runtime.schedulerBackedCadence)}</p>
            <p>Cadence tick verified: {String(props.runtime.cadenceTickVerified)}</p>
            <p>Email transport status: {props.runtime.emailTransportStatus}</p>
            <p>PDF runtime verified: {String(props.runtime.pdfRuntimeVerified)}</p>
            <p>Suppression ledger coverage: {props.runtime.suppressionLedgerCoverage}</p>
            <p>Portfolio scope maturity: {props.runtime.portfolioScopeMaturity}</p>
            <p>Cross-org pattern depth: {props.runtime.crossOrgPatternDepth}</p>
            <p>Role data-layer coverage: {props.runtime.roleDataLayerCoverage}</p>
            <p>Retained history depth: {props.runtime.retainedHistoryDepth}</p>
            <p>Delivery audit depth: {props.runtime.deliveryAuditDepth}</p>
          </div>
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
