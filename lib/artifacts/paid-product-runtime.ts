import "server-only";

import {
  finaliseArtifact,
  markArtifactDelivered,
  registerArtifact,
  type ArtifactDeliveryStatus,
  type ArtifactSourceEntityType,
  type EvidenceRef,
  type ProductArtifactRecord,
  type ProductCode,
} from "@/lib/artifacts/artifact-authority";
import {
  createFalsificationPanel,
  type CreateFalsificationInput,
  type FalsificationEntry,
} from "@/lib/falsification/product-falsification";
import {
  createOutcomeHypothesis,
  HYPOTHESIS_TEMPLATES,
  type CreateHypothesisInput,
  type OutcomeHypothesisRecord,
} from "@/lib/outcomes/outcome-hypothesis";

export type PaidRuntimeFalsificationInput = Omit<
  CreateFalsificationInput,
  "productCode" | "artifactId" | "sourceEntityType" | "sourceEntityId"
>;

export type PaidRuntimeInput = {
  productCode: ProductCode;
  sourceEntityType: ArtifactSourceEntityType;
  sourceEntityId: string;
  userId?: string | null;
  userEmail?: string | null;
  organisationId?: string | null;
  inputSnapshot?: object | null;
  evidenceRefs?: EvidenceRef[];
  artifactContent: string | Buffer;
  downloadUrl?: string | null;
  manifestId?: string | null;
  publicSafeSummary?: string | null;
  privateNotes?: string | null;
  generatedBy?: string | null;
  falsification: PaidRuntimeFalsificationInput[];
  outcomeHypothesis?: Partial<CreateHypothesisInput> | null;
  markDelivered?: boolean;
};

export type PaidRuntimeResult = {
  artifact: ProductArtifactRecord;
  falsificationEntries: FalsificationEntry[];
  outcomeHypothesis: OutcomeHypothesisRecord;
  deliveryStatus: ArtifactDeliveryStatus;
};

export async function createPaidRuntimeArtifact(
  input: PaidRuntimeInput,
): Promise<PaidRuntimeResult> {
  if (input.falsification.length === 0) {
    throw new Error(
      `PAID_RUNTIME_BLOCKED: ${input.productCode}/${input.sourceEntityId} has no falsification panel.`,
    );
  }

  const registered = await registerArtifact({
    productCode: input.productCode,
    sourceEntityType: input.sourceEntityType,
    sourceEntityId: input.sourceEntityId,
    userId: input.userId ?? null,
    userEmail: input.userEmail ?? null,
    organisationId: input.organisationId ?? null,
    inputSnapshot: input.inputSnapshot ?? null,
    evidenceRefs: input.evidenceRefs ?? [],
    publicSafeSummary: input.publicSafeSummary ?? null,
    privateNotes: input.privateNotes ?? null,
    generatedBy: input.generatedBy ?? "system",
  });

  const hypothesisTemplate = HYPOTHESIS_TEMPLATES[input.productCode] ?? {
    predictedDecisionMove:
      "Decision-maker takes a documented position on the output produced by the paid product",
    expectedObservableChange:
      "A decision, action, or explicit non-action is observable within the review window",
    observationWindowDays: 90,
    successIndicators: ["Decision or action recorded", "Owner named", "Evidence reviewed"],
    failureIndicators: ["No action recorded", "Owner absent", "Evidence ignored"],
    ownerRole: "Decision Owner",
  };

  const outcomeHypothesis = await createOutcomeHypothesis({
    ...hypothesisTemplate,
    ...input.outcomeHypothesis,
    productCode: input.productCode,
    sourceRunId: input.sourceEntityId,
    productArtifactId: registered.artifactId,
    userId: input.userId ?? null,
    userEmail: input.userEmail ?? null,
  });

  const falsificationEntries = await createFalsificationPanel(
    input.falsification.map((entry) => ({
      ...entry,
      productCode: input.productCode,
      artifactId: registered.artifactId,
      sourceEntityType: input.sourceEntityType,
      sourceEntityId: input.sourceEntityId,
    })),
  );

  let artifact = await finaliseArtifact({
    artifactId: registered.artifactId,
    artifactContent: input.artifactContent,
    downloadUrl: input.downloadUrl ?? null,
    manifestId: input.manifestId ?? null,
    falsificationRefs: falsificationEntries.map((entry) => entry.id),
    outcomeHypothesisId: outcomeHypothesis.hypothesisId,
  });

  if (input.markDelivered) {
    artifact = await markArtifactDelivered(artifact.artifactId);
  }

  return {
    artifact,
    falsificationEntries,
    outcomeHypothesis,
    deliveryStatus: artifact.deliveryStatus,
  };
}
