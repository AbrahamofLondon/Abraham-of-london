/**
 * lib/strategy-room/artifact-service.ts
 *
 * Pre-session and post-session artifact generation for Strategy Room.
 *
 * Pre-session artifact: captures decision context, constraints, prior attempts,
 * ruled-out options, evidence gaps, owner, deadline before the session begins.
 *
 * Post-session artifact: captures what was resolved, what remains open,
 * commitments, owner assignments, checkpoints, blockers, recommendations.
 *
 * Both create ProductArtifact records with inputSnapshotHash, artifactHash,
 * FalsificationPanel, and OutcomeHypothesis.
 */

import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma.server";
import {
  registerArtifact,
  finaliseArtifact,
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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PreSessionArtifactInput {
  sessionId: string;
  userEmail?: string | null;
  userId?: string | null;
  decisionContext: string;
  constraints: string[];
  priorAttempts: string[];
  ruledOutOptions: string[];
  evidenceGaps: string[];
  owner: string;
  deadline: string;
  generatedBy: string;
}

export interface PostSessionArtifactInput {
  sessionId: string;
  userEmail?: string | null;
  userId?: string | null;
  resolvedDecisions: string[];
  openItems: string[];
  commitments: Array<{
    description: string;
    owner: string;
    dueDate: string;
  }>;
  ownerAssignments: Array<{
    decision: string;
    owner: string;
  }>;
  checkpoints: Array<{
    description: string;
    dueDate: string;
  }>;
  blockers: string[];
  recommendation: string;
  generatedBy: string;
}

export interface ArtifactResult {
  artifactId: string;
  artifactHash: string;
  outcomeHypothesisId: string;
  falsificationEntryIds: string[];
}

// ─── Pre-Session Artifact ────────────────────────────────────────────────────

export async function generatePreSessionArtifact(
  input: PreSessionArtifactInput,
): Promise<ArtifactResult> {
  const now = new Date();

  const content = {
    type: "STRATEGY_ROOM_PRE_SESSION",
    sessionId: input.sessionId,
    generatedAt: now.toISOString(),
    decisionContext: input.decisionContext,
    constraints: input.constraints,
    priorAttempts: input.priorAttempts,
    ruledOutOptions: input.ruledOutOptions,
    evidenceGaps: input.evidenceGaps,
    owner: input.owner,
    deadline: input.deadline,
    generatedBy: input.generatedBy,
  };

  const contentJson = JSON.stringify(content);
  const artifactHash = createHash("sha256").update(contentJson).digest("hex");

  const artifact = await registerArtifact({
    productCode: "strategy_room" as ProductCode,
    sourceEntityType: "STRATEGY_SESSION",
    sourceEntityId: input.sessionId,
    userId: input.userId ?? null,
    userEmail: input.userEmail ?? null,
    inputSnapshot: {
      sessionId: input.sessionId,
      decisionContext: input.decisionContext,
      constraints: input.constraints,
    },
    evidenceRefs: [
      {
        sourceId: input.sessionId,
        sourceType: "StrategyRoomSession",
        label: "Strategy Room session",
      },
    ],
    publicSafeSummary: `Pre-session context for Strategy Room ${input.sessionId}. Decision: ${input.decisionContext.substring(0, 100)}.`,
    privateNotes: null,
    generatedBy: input.generatedBy,
  });

  // Falsification panel for the pre-session framing
  const falsificationInputs: CreateFalsificationInput[] = [
    {
      productCode: "strategy_room",
      artifactId: artifact.artifactId,
      sourceEntityType: "STRATEGY_SESSION",
      sourceEntityId: input.sessionId,
      claimOrRecommendation: input.decisionContext,
      confidenceLevel: "MEDIUM",
      whatWouldChangeThisView:
        "The session reveals that the actual decision constraint, blocker, or owner differs from the pre-session framing.",
      observableIndicator:
        "Post-session artifact contradicts pre-session framing on a material dimension.",
      threshold: "Owner, primary blocker, or core decision changes during the session.",
      strongestCounterargument:
        "The pre-session framing is based on the participant's stated understanding, which may be incomplete.",
      responseToCounterargument:
        "The post-session artifact captures the corrected framing and the delta is preserved for governance.",
    },
  ];

  const falsificationEntries = await createFalsificationPanel(falsificationInputs);

  const outcomeHypothesis = await createOutcomeHypothesis({
    productCode: "strategy_room",
    sourceRunId: input.sessionId,
    productArtifactId: artifact.artifactId,
    userEmail: input.userEmail ?? null,
    predictedDecisionMove:
      "Commitments from the session are executed or documented as blocked within the checkpoint window",
    expectedObservableChange:
      "At least one concrete next step from the session is observable in practice",
    observationWindowDays: 45,
    successIndicators: [
      "Session commitments executed or formally escalated",
      "Checkpoint review conducted",
      "Blockers identified in session addressed or flagged",
    ],
    failureIndicators: [
      "No action taken post-session",
      "Session outputs not communicated to decision group",
      "Commitments not reviewed at checkpoint",
    ],
    ownerRole: "Strategy Room Participant",
  });

  await finaliseArtifact({
    artifactId: artifact.artifactId,
    artifactContent: contentJson,
    falsificationRefs: falsificationEntries.map((e) => e.id),
    outcomeHypothesisId: outcomeHypothesis.hypothesisId,
  });

  return {
    artifactId: artifact.artifactId,
    artifactHash,
    outcomeHypothesisId: outcomeHypothesis.hypothesisId,
    falsificationEntryIds: falsificationEntries.map((e) => e.id),
  };
}

// ─── Post-Session Artifact ────────────────────────────────────────────────────

export async function generatePostSessionArtifact(
  input: PostSessionArtifactInput,
): Promise<ArtifactResult> {
  const now = new Date();

  const content = {
    type: "STRATEGY_ROOM_POST_SESSION",
    sessionId: input.sessionId,
    generatedAt: now.toISOString(),
    resolvedDecisions: input.resolvedDecisions,
    openItems: input.openItems,
    commitments: input.commitments,
    ownerAssignments: input.ownerAssignments,
    checkpoints: input.checkpoints,
    blockers: input.blockers,
    recommendation: input.recommendation,
    generatedBy: input.generatedBy,
  };

  const contentJson = JSON.stringify(content);
  const artifactHash = createHash("sha256").update(contentJson).digest("hex");

  const artifact = await registerArtifact({
    productCode: "strategy_room" as ProductCode,
    sourceEntityType: "STRATEGY_SESSION",
    sourceEntityId: input.sessionId,
    userId: input.userId ?? null,
    userEmail: input.userEmail ?? null,
    inputSnapshot: {
      sessionId: input.sessionId,
      resolvedDecisions: input.resolvedDecisions,
    },
    evidenceRefs: [
      {
        sourceId: input.sessionId,
        sourceType: "StrategyRoomSession",
        label: "Strategy Room session",
      },
    ],
    publicSafeSummary: `Post-session summary for Strategy Room ${input.sessionId}. ${input.resolvedDecisions.length} decisions resolved, ${input.commitments.length} commitments made.`,
    privateNotes: null,
    generatedBy: input.generatedBy,
  });

  // Falsification panel for major recommendations
  const falsificationInputs: CreateFalsificationInput[] = [
    {
      productCode: "strategy_room",
      artifactId: artifact.artifactId,
      sourceEntityType: "STRATEGY_SESSION",
      sourceEntityId: input.sessionId,
      claimOrRecommendation: input.recommendation,
      confidenceLevel: "HIGH",
      whatWouldChangeThisView:
        "Checkpoint review or Return Brief shows commitments were not executed or blockers were misidentified.",
      observableIndicator:
        "Checkpoint status is BLOCKED or ABANDONED for more than 50% of commitments.",
      threshold: "More than half of commitments are not completed by the first checkpoint.",
      strongestCounterargument:
        "The recommendation was sound but external conditions changed after the session.",
      responseToCounterargument:
        "The checkpoint system and Return Brief capture whether the recommendation held or external factors intervened.",
    },
  ];

  const falsificationEntries = await createFalsificationPanel(falsificationInputs);

  // Create outcome hypothesis for post-session
  const outcomeHypothesis = await createOutcomeHypothesis({
    productCode: "strategy_room",
    sourceRunId: input.sessionId,
    productArtifactId: artifact.artifactId,
    userEmail: input.userEmail ?? null,
    predictedDecisionMove:
      "Commitments from the session are executed or documented as blocked within the checkpoint window",
    expectedObservableChange:
      "At least one concrete next step from the session is observable in practice",
    observationWindowDays: 45,
    successIndicators: [
      "Session commitments executed or formally escalated",
      "Checkpoint review conducted",
      "Blockers identified in session addressed or flagged",
    ],
    failureIndicators: [
      "No action taken post-session",
      "Session outputs not communicated to decision group",
      "Commitments not reviewed at checkpoint",
    ],
    ownerRole: "Strategy Room Participant",
  });

  await finaliseArtifact({
    artifactId: artifact.artifactId,
    artifactContent: contentJson,
    falsificationRefs: falsificationEntries.map((e) => e.id),
    outcomeHypothesisId: outcomeHypothesis.hypothesisId,
  });

  return {
    artifactId: artifact.artifactId,
    artifactHash,
    outcomeHypothesisId: outcomeHypothesis.hypothesisId,
    falsificationEntryIds: falsificationEntries.map((e) => e.id),
  };
}
