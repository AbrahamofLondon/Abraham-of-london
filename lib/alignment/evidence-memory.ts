import type { PurposeAlignmentEvidenceCarryForward } from "@/lib/alignment/evidence-loader";
import type { GovernedMemoryItem } from "@/lib/product/governed-memory-contract";
import { normalisePurposeAlignmentEvidence } from "@/lib/product/field-provenance-public";

export function convertPurposeAlignmentToGovernedMemory(
  evidence: PurposeAlignmentEvidenceCarryForward,
): GovernedMemoryItem[] {
  if (!evidence.available) return [];

  const items: GovernedMemoryItem[] = [];
  const provenance = normalisePurposeAlignmentEvidence(evidence);
  const base = {
    sourceSurface: "PURPOSE_ALIGNMENT" as const,
    capturedAt: evidence.assessedAt,
    evidenceOrigin: "STRUCTURED_DIAGNOSTIC" as const,
    audienceSafe: true,
  };

  if (evidence.profile) {
    items.push({
      ...base,
      id: "pa_profile",
      label: "Earlier Purpose Alignment signal",
      summary: `Coherence band: ${evidence.profile}${evidence.compositeScore != null ? ` (${evidence.compositeScore}%)` : ""}`,
      status: "ACTIVE",
      confidenceLabel: "CAPTURED",
      provenance: provenance.filter((item) => item.fieldKey === "profile" || item.fieldKey === "compositeScore"),
    });
  }

  if (evidence.competingObligation) {
    items.push({
      ...base,
      id: "pa_competing_obligation",
      label: "Previously reported competing obligation",
      summary: evidence.competingObligation,
      status: "ACTIVE",
      confidenceLabel: "REPORTED",
      provenance: provenance.filter((item) => item.fieldKey === "competingObligation"),
    });
  }

  if (evidence.consequence) {
    items.push({
      ...base,
      id: "pa_consequence",
      label: "Previously reported consequence",
      summary: evidence.consequence,
      status: "UNRESOLVED",
      confidenceLabel: "REPORTED",
      provenance: provenance.filter((item) => item.fieldKey === "consequence"),
    });
  }

  if (evidence.primaryPattern) {
    items.push({
      ...base,
      id: "pa_primary_pattern",
      label: "Earlier alignment signal",
      summary: `${evidence.primaryPattern}${evidence.patternConsequence ? `: ${evidence.patternConsequence}` : ""}`,
      status: "ACTIVE",
      confidenceLabel: "CAPTURED",
      provenance: provenance.filter((item) => item.fieldKey === "primaryPattern" || item.fieldKey === "patternConsequence"),
    });
  }

  if (evidence.weakestDomain) {
    items.push({
      ...base,
      id: "pa_weakest_domain",
      label: "Weakest alignment domain",
      summary: `The weakest domain was ${evidence.weakestDomain}.`,
      status: "UNRESOLVED",
      confidenceLabel: "CAPTURED",
      provenance: provenance.filter((item) => item.fieldKey === "weakestDomain"),
    });
  }

  if (evidence.strongestDomain) {
    items.push({
      ...base,
      id: "pa_strongest_domain",
      label: "Strongest alignment domain",
      summary: `The strongest domain was ${evidence.strongestDomain}.`,
      status: "ACTIVE",
      confidenceLabel: "CAPTURED",
      provenance: provenance.filter((item) => item.fieldKey === "strongestDomain"),
    });
  }

  for (const [index, contradiction] of evidence.contradictions.slice(0, 3).entries()) {
    items.push({
      ...base,
      id: `pa_contradiction_${contradiction.type}`,
      label: "Detected contradiction",
      summary: contradiction.evidence,
      status: "UNRESOLVED",
      confidenceLabel: "CAPTURED",
      provenance: provenance.filter((item) => item.fieldKey === `contradictions.${index}`),
    });
  }

  if (evidence.firstAction) {
    items.push({
      ...base,
      id: "pa_first_action",
      label: "Carried-forward directive",
      summary: evidence.firstAction,
      status: "ACTIVE",
      confidenceLabel: "CAPTURED",
      provenance: provenance.filter((item) => item.fieldKey === "firstAction"),
    });
  }

  return items;
}
