/**
 * lib/retainer/monthly-artifact-service.ts
 *
 * Monthly review artifact generation for Retainer/Oversight.
 *
 * Called when an OversightReviewCycle is completed.
 * Creates a ProductArtifact record with:
 *   - decisions reviewed
 *   - outcomes observed
 *   - drift detected
 *   - interventions recommended
 *   - next review date
 *   - artifactHash
 *
 * The artifact is stored in ProductArtifact and linked to the cycle.
 * Client-safe summary is stored separately from internal notes.
 */

import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma.server";
import {
  registerArtifact,
  finaliseArtifact,
  markArtifactDelivered,
  type ProductCode,
} from "@/lib/artifacts/artifact-authority";
import {
  createOutcomeHypothesis,
  HYPOTHESIS_TEMPLATES,
} from "@/lib/outcomes/outcome-hypothesis";
import {
  createFalsificationPanel,
  type CreateFalsificationInput,
} from "@/lib/falsification/product-falsification";
import type { OversightReviewCycle } from "@prisma/client";

const RETAINER_ARTIFACT_PRODUCT_CODE = "retainer_core" as ProductCode;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MonthlyArtifactInput {
  cycleId: string;
  contractId: string;
  organisationId?: string | null;
  userEmail?: string | null;
  decisionsReviewed: string[];
  outcomesObserved: Array<{
    decision: string;
    outcomeClass: string;
    summary: string;
  }>;
  driftDetected: string[];
  interventionsRecommended: Array<{
    type: string;
    description: string;
    owner: string;
  }>;
  nextReviewDate: Date;
  generatedBy: string;
}

export interface MonthlyArtifactResult {
  artifactId: string;
  artifactHash: string;
  outcomeHypothesisId: string;
  falsificationEntryIds: string[];
  cycleId: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Generate a monthly review artifact for a completed oversight cycle.
 * Must be called after completeOversightCycle() succeeds.
 */
export async function generateMonthlyArtifact(
  input: MonthlyArtifactInput,
): Promise<MonthlyArtifactResult> {
  const now = new Date();

  // Build the artifact content
  const artifactContent = {
    type: "MONTHLY_REVIEW",
    cycleId: input.cycleId,
    contractId: input.contractId,
    generatedAt: now.toISOString(),
    decisionsReviewed: input.decisionsReviewed,
    outcomesObserved: input.outcomesObserved,
    driftDetected: input.driftDetected,
    interventionsRecommended: input.interventionsRecommended,
    nextReviewDate: input.nextReviewDate.toISOString(),
    generatedBy: input.generatedBy,
  };

  const artifactContentJson = JSON.stringify(artifactContent);
  const artifactHash = createHash("sha256")
    .update(artifactContentJson)
    .digest("hex");

  // Register the artifact
  const artifact = await registerArtifact({
    productCode: RETAINER_ARTIFACT_PRODUCT_CODE,
    sourceEntityType: "RETAINER_CYCLE",
    sourceEntityId: input.cycleId,
    userId: null,
    userEmail: input.userEmail ?? null,
    organisationId: input.organisationId ?? null,
    inputSnapshot: {
      cycleId: input.cycleId,
      contractId: input.contractId,
      decisionsReviewed: input.decisionsReviewed,
    },
    evidenceRefs: [
      {
        sourceId: input.cycleId,
        sourceType: "OversightReviewCycle",
        label: "Completed oversight review cycle",
      },
    ],
    publicSafeSummary: `Monthly oversight review for cycle ${input.cycleId}. ${input.decisionsReviewed.length} decisions reviewed, ${input.outcomesObserved.length} outcomes observed.`,
    privateNotes: null,
    generatedBy: input.generatedBy,
  });

  // Create falsification panel for major recommendations
  const falsificationInputs: CreateFalsificationInput[] = [];
  for (const intervention of input.interventionsRecommended) {
    falsificationInputs.push({
      productCode: RETAINER_ARTIFACT_PRODUCT_CODE,
      artifactId: artifact.artifactId,
      sourceEntityType: "RETAINER_CYCLE",
      sourceEntityId: input.cycleId,
      claimOrRecommendation: intervention.description,
      confidenceLevel: "MEDIUM",
      whatWouldChangeThisView:
        "The next review cycle shows the intervention did not address the root drift or the client context changed materially.",
      observableIndicator:
        "Drift score increases or client health status deteriorates in the next cycle despite the intervention.",
      threshold: "Drift score increases by more than 10 points or client health drops to CRITICAL.",
      strongestCounterargument:
        "The intervention may be correct but the observation window is too short to detect improvement.",
      responseToCounterargument:
        "The outcome hypothesis and Return Brief provide the structured review at the next cycle.",
    });
  }

  const falsificationEntries = falsificationInputs.length > 0
    ? await createFalsificationPanel(falsificationInputs)
    : [];

  // Create outcome hypothesis
  const outcomeHypothesis = await createOutcomeHypothesis({
    productCode: RETAINER_ARTIFACT_PRODUCT_CODE,
    sourceRunId: input.cycleId,
    productArtifactId: artifact.artifactId,
    userEmail: input.userEmail ?? null,
    predictedDecisionMove:
      "Monthly oversight cycle produces documented intervention or confirmation of governance health",
    expectedObservableChange:
      "OversightReviewCycle completed with drift assessment and client health status updated",
    observationWindowDays: 35,
    successIndicators: [
      "Monthly cycle completed on schedule",
      "Drift score assessed and documented",
      "Client health status updated",
    ],
    failureIndicators: [
      "Cycle overdue by more than 7 days",
      "Drift detected but not documented",
      "Client health status not updated",
    ],
    ownerRole: "Retainer Operator",
  });

  // Finalise the artifact
  await finaliseArtifact({
    artifactId: artifact.artifactId,
    artifactContent: artifactContentJson,
    downloadUrl: null,
    falsificationRefs: falsificationEntries.map((e) => e.id),
    outcomeHypothesisId: outcomeHypothesis.hypothesisId,
  });

  return {
    artifactId: artifact.artifactId,
    artifactHash,
    outcomeHypothesisId: outcomeHypothesis.hypothesisId,
    falsificationEntryIds: falsificationEntries.map((e) => e.id),
    cycleId: input.cycleId,
  };
}

/**
 * Build a client-safe status summary from the latest completed cycle.
 */
export async function getClientStatusSummary(contractId: string): Promise<{
  latestCycleId: string | null;
  currentHealth: string;
  openInterventions: number;
  nextReviewDate: string | null;
  latestArtifactId: string | null;
}> {
  const latestCycle = await prisma.oversightReviewCycle.findFirst({
    where: { contractId, status: "COMPLETED" },
    orderBy: { cycleNumber: "desc" },
    select: {
      id: true,
      clientHealthStatus: true,
      interventionCount: true,
      nextCycleDate: true,
    },
  });

  if (!latestCycle) {
    return {
      latestCycleId: null,
      currentHealth: "UNKNOWN",
      openInterventions: 0,
      nextReviewDate: null,
      latestArtifactId: null,
    };
  }

  // Find the latest artifact for this cycle
  const latestArtifact = await prisma.productArtifact.findFirst({
    where: {
      sourceEntityType: "RETAINER_CYCLE",
      sourceEntityId: latestCycle.id,
      status: "READY",
    },
    orderBy: { createdAt: "desc" },
    select: { artifactId: true },
  });

  return {
    latestCycleId: latestCycle.id,
    currentHealth: latestCycle.clientHealthStatus,
    openInterventions: latestCycle.interventionCount,
    nextReviewDate: latestCycle.nextCycleDate?.toISOString() ?? null,
    latestArtifactId: latestArtifact?.artifactId ?? null,
  };
}
