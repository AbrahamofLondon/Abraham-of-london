export type ReportExperienceDimension =
  | "arrival"
  | "identity"
  | "client_specificity"
  | "executive_framing"
  | "decision_usefulness"
  | "evidence_and_provenance"
  | "forensic_traceability"
  | "visual_authority"
  | "mobile_readability"
  | "pdf_readability"
  | "archive_readiness"
  | "admin_preview_safety"
  | "delivery_state_clarity"
  | "feedback_loop"
  | "reuse_and_forwardability";

export type ReportExperienceScore = 0 | 1 | 2 | 3;

export const REPORT_EXPERIENCE_SCORE_LABELS = {
  0: "missing",
  1: "basic",
  2: "acceptable",
  3: "gold_standard",
} as const;

export type ReportExperienceCommercialTier =
  | "free"
  | "paid_entry"
  | "paid_premium"
  | "retainer"
  | "enterprise"
  | "internal";

export type ReportExperienceOutputFormat =
  | "web"
  | "pdf"
  | "email"
  | "download"
  | "admin_preview"
  | "archive";

export type GoldStandardStatus =
  | "gold_standard"
  | "acceptable"
  | "needs_upgrade"
  | "not_safe_for_paid_delivery"
  | "not_applicable";

export type ReportExperienceGoldStandardScore = {
  arrival: ReportExperienceScore;
  identity: ReportExperienceScore;
  clientSpecificity: ReportExperienceScore;
  executiveFraming: ReportExperienceScore;
  decisionUsefulness: ReportExperienceScore;
  evidenceAndProvenance: ReportExperienceScore;
  forensicTraceability: ReportExperienceScore;
  visualAuthority: ReportExperienceScore;
  mobileReadability: ReportExperienceScore;
  pdfReadability: ReportExperienceScore;
  archiveReadiness: ReportExperienceScore;
  adminPreviewSafety: ReportExperienceScore;
  deliveryStateClarity: ReportExperienceScore;
  feedbackLoop: ReportExperienceScore;
  reuseAndForwardability: ReportExperienceScore;
};

export interface ReportExperienceAuthorityProfile {
  outputCode: string;
  outputName: string;
  commercialTier: ReportExperienceCommercialTier;
  outputFormat: ReportExperienceOutputFormat[];

  arrivalImplemented: boolean;
  identityBlockImplemented: boolean;
  preparedForImplemented: boolean;
  executiveFramingImplemented: boolean;
  clientSpecificityImplemented: boolean;
  evidenceLayerImplemented: boolean;
  provenanceLayerImplemented: boolean;
  forensicTraceabilityImplemented: boolean;
  mobileExperienceReviewed: boolean;
  pdfExperienceReviewed: boolean;
  adminPreviewSafe: boolean;
  archiveSafe: boolean;
  feedbackLoopImplemented: boolean;

  goldStandardScore: ReportExperienceGoldStandardScore;
  goldStandardStatus: GoldStandardStatus;
  upgradeRequiredBeforeScale: boolean;
  notes?: string[];
}

export const GOLD_STANDARD_SCORE_KEYS = [
  "arrival",
  "identity",
  "clientSpecificity",
  "executiveFraming",
  "decisionUsefulness",
  "evidenceAndProvenance",
  "forensicTraceability",
  "visualAuthority",
  "mobileReadability",
  "pdfReadability",
  "archiveReadiness",
  "adminPreviewSafety",
  "deliveryStateClarity",
  "feedbackLoop",
  "reuseAndForwardability",
] as const satisfies readonly (keyof ReportExperienceGoldStandardScore)[];

export const GOLD_STANDARD_BASE_SCORE: ReportExperienceGoldStandardScore = {
  arrival: 3,
  identity: 3,
  clientSpecificity: 2,
  executiveFraming: 3,
  decisionUsefulness: 3,
  evidenceAndProvenance: 2,
  forensicTraceability: 2,
  visualAuthority: 3,
  mobileReadability: 2,
  pdfReadability: 2,
  archiveReadiness: 2,
  adminPreviewSafety: 2,
  deliveryStateClarity: 3,
  feedbackLoop: 2,
  reuseAndForwardability: 2,
};

export const PREMIUM_GOLD_STANDARD_SCORE: ReportExperienceGoldStandardScore = {
  arrival: 3,
  identity: 3,
  clientSpecificity: 3,
  executiveFraming: 3,
  decisionUsefulness: 3,
  evidenceAndProvenance: 3,
  forensicTraceability: 3,
  visualAuthority: 3,
  mobileReadability: 3,
  pdfReadability: 3,
  archiveReadiness: 3,
  adminPreviewSafety: 3,
  deliveryStateClarity: 3,
  feedbackLoop: 3,
  reuseAndForwardability: 3,
};

export const FREE_SIGNAL_SCORE: ReportExperienceGoldStandardScore = {
  arrival: 2,
  identity: 2,
  clientSpecificity: 1,
  executiveFraming: 2,
  decisionUsefulness: 3,
  evidenceAndProvenance: 2,
  forensicTraceability: 1,
  visualAuthority: 2,
  mobileReadability: 2,
  pdfReadability: 0,
  archiveReadiness: 1,
  adminPreviewSafety: 1,
  deliveryStateClarity: 2,
  feedbackLoop: 2,
  reuseAndForwardability: 2,
};

export function mergeGoldStandardScore(
  base: ReportExperienceGoldStandardScore,
  overrides: Partial<ReportExperienceGoldStandardScore> = {},
): ReportExperienceGoldStandardScore {
  return { ...base, ...overrides };
}

export function isPremiumCommercialTier(tier: ReportExperienceCommercialTier): boolean {
  return tier === "paid_premium" || tier === "retainer" || tier === "enterprise";
}

export function evaluateGoldStandardStatus(params: {
  commercialTier: ReportExperienceCommercialTier;
  outputFormat: ReportExperienceOutputFormat[];
  score: ReportExperienceGoldStandardScore;
  arrivalImplemented: boolean;
  preparedForImplemented: boolean;
  executiveFramingImplemented: boolean;
  deliveryStateClarityImplemented: boolean;
  feedbackLoopImplemented: boolean;
  adminPreviewSafe: boolean;
}): GoldStandardStatus {
  if (params.commercialTier === "internal") return "not_applicable";

  const paid = params.commercialTier !== "free";
  const premium = isPremiumCommercialTier(params.commercialTier);
  const hasPdf = params.outputFormat.includes("pdf");

  // SAFETY GATE: only truly absent (score=0) critical dimensions trigger not_safe_for_paid_delivery.
  // Quality gaps (score 1–2) belong in needs_upgrade, not safety classification.
  if (paid) {
    const arrivalAbsent = !params.arrivalImplemented && params.score.arrival === 0;
    const deliveryAbsent = params.score.deliveryStateClarity === 0;
    const framingAbsent = params.score.executiveFraming === 0;
    if (arrivalAbsent || deliveryAbsent || framingAbsent) {
      return "not_safe_for_paid_delivery";
    }
  }

  // UPGRADE GATE: paid output below acceptable threshold on any critical dimension
  if (
    paid &&
    (params.score.arrival < 2 ||
      params.score.identity < 2 ||
      params.score.executiveFraming < 2 ||
      params.score.decisionUsefulness < 2 ||
      params.score.visualAuthority < 2 ||
      params.score.deliveryStateClarity < 2 ||
      params.score.clientSpecificity < 1 ||
      params.score.evidenceAndProvenance < 1 ||
      (hasPdf && params.score.pdfReadability < 2))
  ) {
    return "needs_upgrade";
  }

  // PREMIUM THRESHOLD: premium output below gold-standard on premium-specific dimensions
  if (
    premium &&
    (params.score.arrival < 3 ||
      params.score.identity < 3 ||
      params.score.executiveFraming < 3 ||
      params.score.decisionUsefulness < 3 ||
      params.score.visualAuthority < 3 ||
      params.score.deliveryStateClarity < 3 ||
      params.score.clientSpecificity < 2 ||
      params.score.evidenceAndProvenance < 2 ||
      params.score.forensicTraceability < 2 ||
      params.score.mobileReadability < 2 ||
      (hasPdf && params.score.pdfReadability < 3) ||
      !params.feedbackLoopImplemented)
  ) {
    return "needs_upgrade";
  }

  const allGold = GOLD_STANDARD_SCORE_KEYS.every((key) => params.score[key] === 3);
  if (allGold) return "gold_standard";

  if (paid) return "acceptable";
  return params.score.decisionUsefulness >= 2 ? "acceptable" : "needs_upgrade";
}
