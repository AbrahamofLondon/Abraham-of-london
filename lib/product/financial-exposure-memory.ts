import type { FinancialExposureSnapshot } from "@/lib/product/financial-exposure-persistence";
import type { GovernedMemoryItem } from "@/lib/product/governed-memory-contract";
import { normaliseFinancialExposureSnapshot } from "@/lib/product/field-provenance-public";

export function convertFinancialExposureToGovernedMemory(
  exposure: FinancialExposureSnapshot | null,
): GovernedMemoryItem[] {
  if (!exposure) return [];

  const surface = exposure.sourceSurface === "fast_diagnostic"
    ? ("FAST_DIAGNOSTIC" as const)
    : ("EXECUTIVE_REPORTING" as const);

  const items: GovernedMemoryItem[] = [];
  const provenance = normaliseFinancialExposureSnapshot(exposure);
  const base = {
    sourceSurface: surface,
    capturedAt: exposure.computedAt,
    evidenceOrigin: "SELF_REPORTED" as const,
    audienceSafe: true,
  };

  if (exposure.estimatedFinancialExposure != null && exposure.estimatedFinancialExposure > 0) {
    items.push({
      ...base,
      id: "fe_estimated_exposure",
      label: "Estimated exposure",
      summary: `Estimated financial exposure: \u00a3${exposure.estimatedFinancialExposure.toLocaleString()}${exposure.exposureBand ? ` (${exposure.exposureBand})` : ""}. This is an estimate based on diagnostic inputs and has not been independently verified.`,
      status: "ACTIVE",
      confidenceLabel: "REPORTED",
      provenance: provenance.filter((item) => item.fieldKey === "estimatedFinancialExposure" || item.fieldKey === "exposureBand"),
    });
  }

  if (exposure.exposureBand && !items.length) {
    items.push({
      ...base,
      id: "fe_exposure_band",
      label: "Estimated exposure band",
      summary: `Exposure band: ${exposure.exposureBand}. This is estimated from diagnostic inputs and has not been independently verified.`,
      status: "ACTIVE",
      confidenceLabel: "REPORTED",
      provenance: provenance.filter((item) => item.fieldKey === "exposureBand"),
    });
  }

  if (exposure.userCostOfDelayText) {
    items.push({
      ...base,
      id: "fe_cost_of_delay",
      label: "Reported cost of delay",
      summary: exposure.userCostOfDelayText,
      status: "ACTIVE",
      confidenceLabel: "REPORTED",
      provenance: provenance.filter((item) => item.fieldKey === "userCostOfDelayText"),
    });
  }

  return items;
}
