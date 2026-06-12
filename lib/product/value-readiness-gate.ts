import {
  type ArtefactContentInspectionInput,
  type ArtefactContentInspectionResult,
  inspectArtefactContent,
} from "@/lib/product/artefact-content-inspector";

export interface ValueReadinessGateResult extends ArtefactContentInspectionResult {
  gate: "approval" | "delivery" | "customer_access" | "generation";
  allowed: boolean;
}

export function evaluateValueReadinessGate(
  gate: ValueReadinessGateResult["gate"],
  input: ArtefactContentInspectionInput,
): ValueReadinessGateResult {
  const inspection = inspectArtefactContent(input);
  const allowed = gate === "delivery" || gate === "customer_access"
    ? inspection.deliveryAllowed
    : gate === "approval"
      ? inspection.approvalAllowed
      : inspection.approvalAllowed;

  return {
    ...inspection,
    gate,
    allowed,
  };
}

export function assertValueReadinessGate(
  gate: ValueReadinessGateResult["gate"],
  input: ArtefactContentInspectionInput,
): ValueReadinessGateResult {
  const result = evaluateValueReadinessGate(gate, input);
  if (!result.allowed) {
    throw new Error(
      `VALUE_READINESS_BLOCKED: ${input.productCode} cannot pass ${gate}. ` +
      `Reasons: ${result.blockingReasons.join("; ")}.`,
    );
  }
  return result;
}

export const VALUE_READINESS_MARKER_PREFIX = "VALUE_READINESS_INSPECTION:";

export function serializeValueReadinessInspection(
  result: ArtefactContentInspectionResult,
): string {
  return `${VALUE_READINESS_MARKER_PREFIX}${JSON.stringify({
    valueScore: result.valueScore,
    approvalAllowed: result.approvalAllowed,
    deliveryAllowed: result.deliveryAllowed,
    blockingReasons: result.blockingReasons,
    missingCriticalSections: result.missingCriticalSections,
    inspectedContentSource: result.inspectedContentSource,
  })}`;
}

export function parseValueReadinessInspection(notes: string | null | undefined): Pick<
  ArtefactContentInspectionResult,
  "valueScore" | "approvalAllowed" | "deliveryAllowed" | "blockingReasons" | "missingCriticalSections" | "inspectedContentSource"
> | null {
  if (!notes) return null;
  const markerIndex = notes.lastIndexOf(VALUE_READINESS_MARKER_PREFIX);
  if (markerIndex === -1) return null;
  const marker = notes.slice(markerIndex + VALUE_READINESS_MARKER_PREFIX.length).trim();
  const firstLine = marker.split(/\r?\n/)[0] ?? "";
  try {
    return JSON.parse(firstLine);
  } catch {
    return null;
  }
}
