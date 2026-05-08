/**
 * lib/product/control-room-state-loader.ts — Internal Control Room state loader.
 *
 * Returns privacy-safe organisational intelligence only when access is authorised.
 * No public API in v0. Internal/admin use only.
 */

import { prisma } from "@/lib/prisma";
import { evaluateOrganisationAccess } from "@/lib/product/organisation-access";
import type { OrganisationAccessDecision } from "@/lib/product/organisation-access-contract";
import type { ControlRoomState } from "@/lib/product/control-room-contract";
import type { AggregationSafety, MultiUserCampaignSummary } from "@/lib/product/multi-user-contract";
import { evaluateAggregationSafety } from "@/lib/product/multi-user-privacy";
import { loadOrganisationDivergenceSummary } from "@/lib/product/organisation-divergence-summary";
import type { CollisionSummary, CollisionSummaryType } from "@/lib/product/multi-user-collision-summary";
import {
  extractAssessmentEvidenceCapture,
  mergeAssessmentEvidenceCapture,
} from "@/lib/product/evidence-capture-contract";
import { buildGovernanceEvidenceCoverage } from "@/lib/product/governed-memory-presenter";
import {
  loadPurposeAlignmentEvidence,
  buildOversightBriefPaAggregate,
} from "@/lib/alignment/evidence-loader";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type ControlRoomLoadResult = {
  access: OrganisationAccessDecision;
  state?: ControlRoomState;
};

// ─────────────────────────────────────────────────────────────────────────────
// LOADER
// ─────────────────────────────────────────────────────────────────────────────

export async function loadControlRoomState(input: {
  userId?: string | null;
  email?: string | null;
  organisationId: string;
}): Promise<ControlRoomLoadResult> {
  // ── 1. Access check ──
  const access = await evaluateOrganisationAccess({
    userId: input.userId,
    email: input.email,
    organisationId: input.organisationId,
    requestedScope: "CONTROL_ROOM_VIEW",
  });

  if (!access.allowed) {
    return { access };
  }

  // ── 2. Load organisation ──
  let org: { id: string; name: string; slug: string; sector: string | null; sizeBand: string | null } | null = null;
  try {
    org = await prisma.organisation.findUnique({
      where: { id: input.organisationId },
      select: { id: true, name: true, slug: true, sector: true, sizeBand: true },
    });
  } catch {
    return { access };
  }

  if (!org) {
    return { access: { ...access, allowed: false, reason: "Organisation not found." } };
  }

  // ── 3. Load campaigns ──
  let campaigns: Array<{
    id: string;
    title: string;
    status: string;
    stage: string | null;
    diagnosticType: string | null;
    createdAt: Date;
    _count: { participants: number };
  }> = [];

  try {
    campaigns = await prisma.alignmentCampaign.findMany({
      where: { organisationId: org.id },
      select: {
        id: true,
        title: true,
        status: true,
        stage: true,
        diagnosticType: true,
        createdAt: true,
        _count: { select: { participants: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  } catch {
    // Campaign data unavailable — continue with partial state
  }

  // ── 4. Response coverage ──
  let totalParticipants = 0;
  for (const campaign of campaigns) {
    totalParticipants += campaign._count.participants;
  }

  // ── 5. Aggregation safety ──
  const aggregationSafety: AggregationSafety = evaluateAggregationSafety({
    campaignMode: "ANONYMOUS",
    responseCount: totalParticipants,
    minimumSafeResponses: 3,
  });

  // ── 6. Campaign summaries (privacy-safe) ──
  const campaignSummaries: MultiUserCampaignSummary[] = campaigns.map((c) => ({
    campaignId: c.id,
    organisationId: org.id,
    title: c.title,
    scope: "ENTERPRISE",
    status:
      c.status === "draft" || c.status === "DRAFT"
        ? "DRAFT"
        : c.status === "active" || c.status === "ACTIVE"
          ? "ACTIVE"
          : c.status === "closed" || c.status === "COMPLETED"
            ? "CLOSED"
            : c.status === "archived" || c.status === "ARCHIVED"
              ? "ARCHIVED"
              : "ANALYSED",
    mode: "ANONYMOUS",
    participantCount: c._count.participants,
    responseCount: 0,
    aggregationSafety,
    evidenceTier: "insufficient",
    divergenceCount: 0,
  }));

  // ── 7. Evidence tier ──
  const activeCampaigns = campaigns.filter(
    (c) => c.status === "active" || c.status === "completed" || c.status === "ACTIVE" || c.status === "COMPLETED",
  );
  const evidenceTier = activeCampaigns.length >= 3
    ? "multi_source"
    : activeCampaigns.length >= 1
      ? "single_source"
      : "insufficient";

  // ── 8. Admission readiness ──
  const admissions: ControlRoomState["admissions"] = {
    executiveReporting: evidenceTier !== "insufficient" ? "ADMITTED" : "NOT_EVALUATED",
    strategyRoom: evidenceTier === "multi_source" ? "ADMITTED" : "NOT_EVALUATED",
    boardroom: "NOT_EVALUATED",
  };

  // ── 9. Next action ──
  let nextRequiredAction: string | undefined;
  if (activeCampaigns.length === 0) {
    nextRequiredAction = "Launch the first diagnostic campaign to establish organisational evidence.";
  } else if (aggregationSafety !== "SAFE") {
    nextRequiredAction = `Aggregation safety: ${aggregationSafety}. Ensure sufficient responses before generating reports.`;
  }

  const divergenceResult = await loadOrganisationDivergenceSummary({
    organisationId: org.id,
  }).catch(() => ({ summaries: [], warnings: ["Organisation divergence summary could not be loaded."] }));
  const divergence: CollisionSummary[] = divergenceResult.summaries.map((item) => ({
    collisionCount: 1,
    primaryCollision: item.type.replace(/_/g, " "),
    collisionTypes: [item.type === "COST_ESTIMATE_DIVERGENCE"
      ? "COST_DIVERGENCE"
      : item.type === "CONDITION_CLASS_MISMATCH"
        ? "CONDITION_CLASS_MISMATCH"
        : item.type === "AUTHORITY_PERCEPTION_GAP"
          ? "AUTHORITY_PERCEPTION_GAP"
          : "BLOCKER_CONTRADICTION"] as CollisionSummaryType[],
    severity: item.confidence === "HIGH" ? "HIGH" : item.confidence === "MEDIUM" ? "MEDIUM" : "LOW",
    sponsorSafeSummary: item.sponsorSafeSummary,
    operatorNotes: `${item.affectedDomain}. ${item.recommendedNextAction}`,
  }));

  const journeys = await prisma.diagnosticJourney.findMany({
    where: {
      OR: [
        { organisationKey: org.slug },
        { organisation: org.name },
      ],
    },
    select: {
      stages: {
        select: { payload: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  }).catch(() => []);

  const evidenceCases = journeys.map((journey) => mergeAssessmentEvidenceCapture(
    ...journey.stages.map((stage) => extractAssessmentEvidenceCapture(stage.payload)),
  ));
  const canShowEvidenceAggregation = aggregationSafety === "SAFE" && evidenceCases.length >= 3;
  const governanceEvidenceCoverage = buildGovernanceEvidenceCoverage({
    cases: evidenceCases.map((item) => ({
      evidenceCapture: item,
      unresolvedCommitments: 0,
    })),
    aggregationSafe: canShowEvidenceAggregation,
    suppressionReason: aggregationSafety !== "SAFE"
      ? `Aggregation withheld: ${aggregationSafety}.`
      : "Aggregation withheld: insufficient safe case count.",
  });

  // ── PURPOSE ALIGNMENT EVIDENCE AGGREGATE ──
  const paEvidence = await loadPurposeAlignmentEvidence({
    email: input.email ?? undefined,
    subjectId: input.userId ?? undefined,
  });
  const paAggregate = buildOversightBriefPaAggregate(paEvidence);

  // ── 10. Assemble state ──
  const state: ControlRoomState = {
    organisationId: org.id,
    organisationName: org.name,
    scope: "ENTERPRISE",
    currentState: {
      activeCampaigns: activeCampaigns.length,
      responseCoverage: totalParticipants,
      evidenceTier,
      aggregationSafety,
      governanceEvidenceCoverage,
    },
    campaigns: campaignSummaries,
    divergence,
    admissions,
    purposeAlignment: paAggregate,
    nextRequiredAction,
    privacyNotice: "Aggregated data only. Raw respondent answers are not visible. Anonymous campaigns remain anonymous. Small samples are suppressed.",
  };

  return { access, state };
}
