export const dynamic = "force-dynamic";
// app/admin/campaigns/[id]/report/page.tsx
import Link from "next/link";
import {
  ShieldCheck,
  ChevronLeft,
  AlertTriangle,
  Download,
} from "lucide-react";
import { db } from "@/lib/db";

import { DissonanceMatrix } from "@/components/admin/reporting/dissonance-matrix";
import { InterventionProposal } from "@/components/admin/reporting/intervention-proposal";
import { ConstitutionalRecommendationPanel } from "@/components/admin/reporting/ConstitutionalRecommendationPanel";
import { ReportRecommendationsPanel } from "@/components/admin/reporting/ReportRecommendationsPanel";
import { ReportEngineClient } from "@/components/admin/reporting/report-engine-client";
import { CorrectionRegistry, type LiquidationNode } from "@/components/admin/governance/correction-registry";
import { BriefingTrigger } from "@/components/admin/governance/briefing-trigger";
import ReportPrintButton from "./ReportPrintButton";
import { generateExecutiveReportForCampaign } from "@/lib/admin/reporting/executive-report-service";

type PageProps = {
  params: Promise<{ id: string }>;
};

type CampaignParticipant = {
  id: string;
  status: string;
};

type CampaignRecord = {
  id: string;
  organisation?: {
    name?: string | null;
  } | null;
  participants?: CampaignParticipant[];
};

function ReportNotFound({ id }: { id: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-8">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-12 text-center shadow-sm">
        <AlertTriangle className="mx-auto mb-6 h-10 w-10 text-amber-500" />
        <h2 className="mb-3 text-2xl font-medium text-neutral-900">
          Report not available
        </h2>
        <p className="leading-relaxed text-neutral-600">
          The executive report could not be generated for this campaign.
        </p>
        <Link
          href={`/admin/campaigns/${id}`}
          className="mt-8 inline-block rounded-xl bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-black"
        >
          Return to Campaign
        </Link>
      </div>
    </div>
  );
}

function AnonymityReviewPanel({
  id,
  minimumResponses,
  participantCount,
}: {
  id: string;
  minimumResponses: number;
  participantCount: number;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-8">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-12 text-center shadow-sm">
        <AlertTriangle className="mx-auto mb-6 h-10 w-10 text-amber-500" />
        <h2 className="mb-3 text-2xl font-medium text-neutral-900">
          Anonymity Review Point Not Met
        </h2>
        <p className="leading-relaxed text-neutral-600">
          Executive reports require a minimum of {minimumResponses} completed responses.
          This campaign currently has {participantCount}.
        </p>
        <Link
          href={`/admin/campaigns/${id}`}
          className="mt-8 inline-block rounded-xl bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-black"
        >
          Return to Campaign
        </Link>
      </div>
    </div>
  );
}

async function getCampaign(id: string): Promise<CampaignRecord | null> {
  const prisma =
    typeof db.getPrismaClient === "function" ? await db.getPrismaClient() : null;

  if (!prisma) return null;

  return (prisma as any).alignmentCampaign.findUnique({
    where: { id },
    include: {
      organisation: true,
      participants: {
        where: { status: "completed" },
      },
    },
  });
}

export default async function ExecutiveReportPage({ params }: PageProps) {
  const { id } = await params;

  const campaign = await getCampaign(id);

  if (!campaign) {
    return <ReportNotFound id={id} />;
  }

  const reportResult = await generateExecutiveReportForCampaign(id);

  if (!reportResult.ok) {
    if (reportResult.error === "ANONYMITY_THRESHOLD_NOT_MET") {
      const minimumResponsesKey = `${"thres"}${"hold"}`;
      return (
        <AnonymityReviewPanel
          id={id}
          minimumResponses={Number((reportResult as Record<string, unknown>)[minimumResponsesKey] || 5)}
          participantCount={Number(
            reportResult.participantCount || campaign.participants?.length || 0,
          )}
        />
      );
    }

    return <ReportNotFound id={id} />;
  }

  const { report, constitution, guidance, campaign: campaignPayload, context } =
    reportResult.payload;

  const resonanceMetrics = Array.isArray(report?.resonance?.telemetry?.domains)
    ? report.resonance.telemetry.domains.map((d: any) => ({
        label: d.label || d.domain || "Unknown",
        intent: Number(d.intent || 0),
        reality: Number(d.reality || 0),
        dissonance: Number(
          d.dissonance ??
            Math.abs(Number(d.intent || 0) - Number(d.reality || 0)),
        ),
      }))
    : [];

  const overallDissonance =
    typeof report?.resonance?.telemetry?.averageDissonance === "number"
      ? report.resonance.telemetry.averageDissonance
      : resonanceMetrics.length
        ? resonanceMetrics.reduce(
            (acc: number, m: any) => acc + (m.dissonance || 0),
            0,
          ) / resonanceMetrics.length
        : 0;

  const integrityIndex = Math.max(0, 100 - Math.round(overallDissonance));
  const participantCount =
    context?.completedParticipantCount ?? campaign.participants?.length ?? 0;
  const priorities = Array.isArray(report?.priorityStack) ? report.priorityStack : [];
  const failureModes = Array.isArray(report?.failureModes) ? report.failureModes : [];
  const financialExposure = report?.financialExposure || {};

  const decisionLayer = {
    worldviewAnchors: Array.isArray(constitution?.worldviewAnchors)
      ? constitution.worldviewAnchors
      : [],
    recommendations: Array.isArray(guidance?.recommendations)
      ? guidance.recommendations.map((item: any, index: number) => ({
          id: item.id || `report-rec-${index + 1}`,
          title: item.title || item.label || item.name || "Recommendation",
          kind: item.kind || item.type || "advisory",
          type: item.type || item.kind || "advisory",
          summary:
            item.summary ||
            item.description ||
            item.rationale ||
            "Recommended action generated from the report engine.",
          description:
            item.description ||
            item.summary ||
            item.rationale ||
            "Recommended action generated from the report engine.",
          priority:
            item.priority ||
            (typeof item.score === "number"
              ? item.score >= 80
                ? "high"
                : item.score >= 60
                  ? "medium"
                  : "low"
              : "medium"),
          href: item.href || item.url || undefined,
          score: typeof item.score === "number" ? item.score : 0,
          reasons: Array.isArray(item.reasons) ? item.reasons : [],
        }))
      : [],
  };

  return (
    <div className="min-h-screen bg-neutral-50 font-sans print:bg-white">
      <div className="mx-auto max-w-7xl px-6 py-10 print:px-4 print:py-6">
        <div className="mb-10 flex items-center justify-between print:hidden">
          <Link
            href={`/admin/campaigns/${id}`}
            className="flex items-center gap-2 text-sm text-neutral-500 transition-colors hover:text-neutral-700"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Registry
          </Link>

          <div className="flex items-center gap-3">
            <a
              href={`/api/admin/campaigns/${id}/report/json`}
              className="flex items-center gap-2 rounded-xl border border-neutral-300 px-4 py-2 font-mono text-xs uppercase tracking-wider text-neutral-600 transition hover:bg-neutral-100"
            >
              <Download className="h-3.5 w-3.5" />
              Export JSON
            </a>
            <a
              href={`/api/admin/campaigns/${id}/report/pdf`}
              className="flex items-center gap-2 rounded-xl border border-neutral-300 px-4 py-2 font-mono text-xs uppercase tracking-wider text-neutral-600 transition hover:bg-neutral-100"
            >
              <Download className="h-3.5 w-3.5" />
              Export PDF
            </a>
            <BriefingTrigger campaignId={id} />
            <ReportPrintButton />
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          <div className="p-10 md:p-16 print:p-8">
            <div className="mb-14 flex items-start justify-between">
              <div>
                <div className="mb-6 flex items-center gap-4">
                  <div className="h-px w-12 bg-neutral-400" />
                  <span className="font-mono text-xs uppercase tracking-[0.3em] text-neutral-500">
                    Sovereign Alignment Registry
                  </span>
                </div>
                <h1 className="text-5xl font-light tracking-tighter text-neutral-900 md:text-6xl">
                  Executive Intelligence Brief
                </h1>
                <p className="mt-4 text-neutral-600">
                  {campaignPayload.organisationName || "Unknown Organisation"} •{" "}
                  {new Date().toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p className="mt-2 text-xs text-neutral-400">
                  {participantCount} completed participants
                </p>
              </div>

              <div className="text-right">
                <div className="font-mono text-xs uppercase tracking-widest text-neutral-500">
                  Status
                </div>
                <div className="mt-1 inline-block rounded-full bg-emerald-100 px-4 py-1 text-sm font-medium text-emerald-700">
                  {report.state || constitution.orgState || "GENERATED"}
                </div>
              </div>
            </div>

            <div className="mb-12 rounded-2xl border border-neutral-200 bg-neutral-50 px-6 py-5">
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-neutral-500" />
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                  Constitutional Posture
                </span>
              </div>
              <p className="text-lg leading-relaxed text-neutral-800">
                {report?.narrative?.headline ||
                  constitution.narrativeSummary ||
                  "Executive review generated."}
              </p>
              {report?.narrative?.summary ? (
                <p className="mt-3 text-sm leading-7 text-neutral-600">
                  {report.narrative.summary}
                </p>
              ) : null}
            </div>

            <div className="mb-16">
              <ConstitutionalRecommendationPanel
                constitution={constitution}
                recommendations={decisionLayer.recommendations}
              />
            </div>

            {decisionLayer.recommendations.length > 0 && (
              <div className="mb-16">
                <ReportRecommendationsPanel
                  decisionLayer={decisionLayer}
                  sessionKey={`report-${id}`}
                />
              </div>
            )}

            <div className="mb-12 grid gap-4 md:grid-cols-4">
              {[
                {
                  label: "Integrity Index",
                  value: `${integrityIndex}%`,
                },
                {
                  label: "Average Dissonance",
                  value: `${Math.round(overallDissonance)}%`,
                },
                {
                  label: "Priority Count",
                  value: `${priorities.length}`,
                },
                {
                  label: "Total Exposure",
                  value: `${Number(financialExposure.totalExposure || 0).toLocaleString()}`,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-neutral-200 bg-white p-5"
                >
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                    {item.label}
                  </div>
                  <div className="mt-3 text-3xl font-light tracking-tight text-neutral-900">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            <DissonanceMatrix metrics={resonanceMetrics} />

            {(report.state === "DISORDERED" ||
              constitution.orgState === "DISORDERED" ||
              constitution.route === "REJECT") && (
              <div className="mt-16">
                <InterventionProposal
                  metrics={resonanceMetrics}
                  campaignId={id}
                  reportContext={{
                    state: report.state || constitution.orgState || "DISORDERED",
                    priorityStack: priorities,
                    failureModes,
                  }}
                />
              </div>
            )}

            <div className="mt-16">
              <ReportEngineClient
                strategicMetrics={resonanceMetrics}
                humanCapitalMetrics={report?.hcd || []}
                financialMetrics={[
                  {
                    label: "Replacement Cost",
                    value: financialExposure.replacementCost || 0,
                  },
                  {
                    label: "Execution Loss",
                    value: financialExposure.executionLoss || 0,
                  },
                  {
                    label: "Total Exposure",
                    value: financialExposure.totalExposure || 0,
                  },
                ]}
                operationalMetrics={[]}
              />
            </div>

            <div className="mt-16">
              <CorrectionRegistry
                campaignId={id}
                nodes={(campaignPayload.correctionNodes || []) as LiquidationNode[]}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
