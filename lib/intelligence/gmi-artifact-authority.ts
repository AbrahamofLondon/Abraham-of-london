/**
 * lib/intelligence/gmi-artifact-authority.ts
 *
 * Wires GMI quarterly intelligence into the universal artifact authority stack.
 *
 * Called when a GMI edition is published or a board-pack artifact is generated.
 * Creates ProductArtifact records with:
 *   - edition snapshot reference
 *   - board-pack artifact hash
 *   - falsification panel for HIGH/MEDIUM claims
 *   - outcome hypothesis where appropriate
 *   - source appendix linkage
 *   - benchmark status
 *   - publication timestamp
 *   - provenance label
 */

import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma.server";
import {
  registerArtifact,
  finaliseArtifact,
  type ProductCode,
} from "@/lib/artifacts/artifact-authority";
import {
  createFalsificationPanel,
  type CreateFalsificationInput,
} from "@/lib/falsification/product-falsification";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GmiEditionArtifactInput {
  editionId: string;
  snapshotId: string;
  boardPackArtifactId?: string;
  boardPackContentHash?: string;
  callCount: number;
  falsificationRuleCount: number;
  sourceAppendixCount: number;
  benchmarkCount: number;
  overallScore: number;
  releaseReady: boolean;
  publishedAt: string;
  publishedBy: string;
}

export interface GmiEditionArtifactResult {
  artifactId: string;
  artifactHash: string;
  falsificationEntryIds: string[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Register a ProductArtifact for a published GMI edition.
 * Called when the edition passes the quality gate and is published.
 */
export async function registerGmiEditionArtifact(
  input: GmiEditionArtifactInput,
): Promise<GmiEditionArtifactResult> {
  const now = new Date();

  const content = {
    type: "GMI_EDITION",
    editionId: input.editionId,
    snapshotId: input.snapshotId,
    boardPackArtifactId: input.boardPackArtifactId,
    boardPackContentHash: input.boardPackContentHash,
    publishedAt: input.publishedAt,
    publishedBy: input.publishedBy,
    metrics: {
      callCount: input.callCount,
      falsificationRuleCount: input.falsificationRuleCount,
      sourceAppendixCount: input.sourceAppendixCount,
      benchmarkCount: input.benchmarkCount,
      overallScore: input.overallScore,
      releaseReady: input.releaseReady,
    },
  };

  const contentJson = JSON.stringify(content);
  const artifactHash = createHash("sha256").update(contentJson).digest("hex");

  const artifact = await registerArtifact({
    productCode: "gmi_quarterly" as ProductCode,
    sourceEntityType: "MANUAL",
    sourceEntityId: input.editionId,
    inputSnapshot: {
      editionId: input.editionId,
      snapshotId: input.snapshotId,
      publishedAt: input.publishedAt,
    },
    evidenceRefs: [
      {
        sourceId: input.snapshotId,
        sourceType: "GmiReleaseSnapshot",
        label: `GMI ${input.editionId} release snapshot`,
      },
      ...(input.boardPackArtifactId
        ? [
            {
              sourceId: input.boardPackArtifactId,
              sourceType: "GmiBoardPackArtifact",
              label: `GMI ${input.editionId} board-pack artifact`,
            },
          ]
        : []),
    ],
    publicSafeSummary: `GMI ${input.editionId} published. ${input.callCount} calls, ${input.falsificationRuleCount} falsification rules, ${input.sourceAppendixCount} source appendix entries, ${input.benchmarkCount} benchmarks. Overall score: ${input.overallScore}/100.`,
    privateNotes: null,
    generatedBy: input.publishedBy,
  });

  // Create falsification entries for HIGH confidence claims in the edition
  const falsificationInputs: CreateFalsificationInput[] = [
    {
      productCode: "gmi_quarterly",
      artifactId: artifact.artifactId,
      sourceEntityType: "GMI_EDITION",
      sourceEntityId: input.editionId,
      claimOrRecommendation: `GMI ${input.editionId} published with overall score ${input.overallScore}/100`,
      confidenceLevel: input.overallScore >= 80 ? "HIGH" : "MEDIUM",
      whatWouldChangeThisView:
        "A call outcome, benchmark revision, or source appendix update materially changes the edition's findings or confidence bands.",
      observableIndicator:
        "Post-publication call review or benchmark update contradicts a published finding.",
      threshold:
        "Published call outcome changes from confirmed to disputed, or benchmark value shifts by more than 20%.",
      strongestCounterargument:
        "The edition was published from a frozen snapshot. Post-publication changes are tracked in the next edition.",
      responseToCounterargument:
        "The falsification register and next-edition call review process capture post-publication corrections.",
    },
  ];

  const falsificationEntries = await createFalsificationPanel(falsificationInputs);

  await finaliseArtifact({
    artifactId: artifact.artifactId,
    artifactContent: contentJson,
    falsificationRefs: falsificationEntries.map((e) => e.id),
  });

  return {
    artifactId: artifact.artifactId,
    artifactHash,
    falsificationEntryIds: falsificationEntries.map((e) => e.id),
  };
}

/**
 * Register a ProductArtifact for a GMI board-pack artifact.
 * Called when a board-pack PDF is generated.
 */
export async function registerGmiBoardPackArtifact(
  editionId: string,
  boardPackArtifactId: string,
  contentHash: string,
  generatedBy: string,
): Promise<GmiEditionArtifactResult> {
  const now = new Date();

  const content = {
    type: "GMI_BOARD_PACK",
    editionId,
    boardPackArtifactId,
    contentHash,
    generatedAt: now.toISOString(),
    generatedBy,
  };

  const contentJson = JSON.stringify(content);
  const artifactHash = createHash("sha256").update(contentJson).digest("hex");

  const artifact = await registerArtifact({
    productCode: "gmi_quarterly" as ProductCode,
    sourceEntityType: "MANUAL",
    sourceEntityId: `${editionId}-board-pack`,
    inputSnapshot: {
      editionId,
      boardPackArtifactId,
    },
    evidenceRefs: [
      {
        sourceId: boardPackArtifactId,
        sourceType: "GmiBoardPackArtifact",
        label: `GMI ${editionId} board-pack artifact`,
      },
    ],
    publicSafeSummary: `GMI ${editionId} board-pack artifact generated. Content hash: ${contentHash.substring(0, 12)}...`,
    privateNotes: null,
    generatedBy,
  });

  await finaliseArtifact({
    artifactId: artifact.artifactId,
    artifactContent: contentJson,
  });

  return {
    artifactId: artifact.artifactId,
    artifactHash,
    falsificationEntryIds: [],
  };
}
