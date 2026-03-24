import {
  generateDossierSignature,
  getWatermarkPayload,
  type WatermarkPayload,
} from "@/lib/intelligence/watermark-delegate";
import type { StoredPurposeAlignmentAssessment } from "./types";

export function buildAlignmentReportWatermark(
  assessment: StoredPurposeAlignmentAssessment
): WatermarkPayload {
  const signature = generateDossierSignature(
    assessment.sessionKey || assessment.userId || "ANONYMOUS_ALIGNMENT_USER",
    assessment.id,
    {
      brand: "Abraham of London",
    }
  );

  return getWatermarkPayload({
    signature,
    classification: "public",
    context: {
      briefTitle: "Purpose Alignment Report",
      route: `/api/purpose-alignment/report/${assessment.id}`,
    },
  });
}