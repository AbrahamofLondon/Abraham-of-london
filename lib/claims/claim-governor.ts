export type ClaimName =
  | "benchmarked"
  | "predictive"
  | "team-wide sentiment"
  | "monitoring"
  | "data-integrated";

export type ClaimEvidence = {
  benchmarkSampleSize?: number;
  longitudinalDepth?: number;
  boundedScenarioMode?: boolean;
  respondentCount?: number;
  teamAssessmentMode?: "leader_estimate" | "multi_respondent" | string;
  completionRate?: number;
  confidence?: number;
  campaignStatus?: "draft" | "live" | "closed" | "archived" | string;
  recurringSnapshotCount?: number;
  importedSignalCount?: number;
};

export type ClaimDecision = {
  allowed: boolean;
  claim: ClaimName;
  reason: string;
  required?: string;
};

export const CLAIM_THRESHOLDS = {
  benchmarkSampleSize: 5,
  predictiveLongitudinalDepth: 2,
  teamWideRespondents: 3,
  teamWideCompletionRate: 0.5,
  teamWideConfidence: 0.6,
  monitoringSnapshots: 2,
  importedSignals: 1,
} as const;

export function decideClaim(
  claim: ClaimName,
  evidence: ClaimEvidence,
): ClaimDecision {
  if (claim === "benchmarked") {
    const n = evidence.benchmarkSampleSize ?? 0;
    return n >= CLAIM_THRESHOLDS.benchmarkSampleSize
      ? { allowed: true, claim, reason: `Cohort sample ${n} meets threshold.` }
      : {
          allowed: false,
          claim,
          reason: `Cohort sample ${n} is below threshold.`,
          required: `cohort sample >= ${CLAIM_THRESHOLDS.benchmarkSampleSize}`,
        };
  }

  if (claim === "predictive") {
    const depth = evidence.longitudinalDepth ?? 0;
    if (depth >= CLAIM_THRESHOLDS.predictiveLongitudinalDepth) {
      return { allowed: true, claim, reason: `Longitudinal depth ${depth} supports trajectory outlook.` };
    }
    if (evidence.boundedScenarioMode) {
      return { allowed: true, claim, reason: "Bounded scenario mode only; no ML prediction claimed." };
    }
    return {
      allowed: false,
      claim,
      reason: "No sufficient longitudinal depth or bounded scenario mode.",
      required: "2 snapshots or bounded scenario mode",
    };
  }

  if (claim === "team-wide sentiment") {
    const n = evidence.respondentCount ?? 0;
    const completionRate = evidence.completionRate ?? 0;
    const confidence = evidence.confidence ?? 0;
    const mode = evidence.teamAssessmentMode;
    const campaignStatus = evidence.campaignStatus;
    if (mode !== "multi_respondent") {
      return {
        allowed: false,
        claim,
        reason: "Team evidence is leader-estimate or not campaign-derived.",
        required: "mode = multi_respondent",
      };
    }
    if (campaignStatus !== "closed" && campaignStatus !== "archived") {
      return {
        allowed: false,
        claim,
        reason: "Team campaign is not finalized.",
        required: "campaign status closed or archived",
      };
    }
    if (n < CLAIM_THRESHOLDS.teamWideRespondents) {
      return {
        allowed: false,
        claim,
        reason: `Respondent count ${n} is below team-wide threshold.`,
        required: `respondents >= ${CLAIM_THRESHOLDS.teamWideRespondents}`,
      };
    }
    if (completionRate < CLAIM_THRESHOLDS.teamWideCompletionRate || confidence < CLAIM_THRESHOLDS.teamWideConfidence) {
      return {
        allowed: false,
        claim,
        reason: `Completion rate ${completionRate} or confidence ${confidence} is below threshold.`,
        required: `completionRate >= ${CLAIM_THRESHOLDS.teamWideCompletionRate}, confidence >= ${CLAIM_THRESHOLDS.teamWideConfidence}`,
      };
    }
    return { allowed: true, claim, reason: `Finalized multi-respondent campaign supports team-wide sentiment.` };
  }

  if (claim === "monitoring") {
    const n = evidence.recurringSnapshotCount ?? 0;
    return n >= CLAIM_THRESHOLDS.monitoringSnapshots
      ? { allowed: true, claim, reason: `Snapshot count ${n} supports monitoring.` }
      : {
          allowed: false,
          claim,
          reason: `Snapshot count ${n} is below monitoring threshold.`,
          required: `snapshots >= ${CLAIM_THRESHOLDS.monitoringSnapshots}`,
        };
  }

  const n = evidence.importedSignalCount ?? 0;
  return n >= CLAIM_THRESHOLDS.importedSignals
    ? { allowed: true, claim, reason: `Imported signal count ${n} supports data-integrated claim.` }
    : {
        allowed: false,
        claim,
        reason: "No imported enterprise signals present.",
        required: "at least one imported signal",
      };
}

export function resolveClaimSet(evidence: ClaimEvidence): Record<ClaimName, ClaimDecision> {
  return {
    benchmarked: decideClaim("benchmarked", evidence),
    predictive: decideClaim("predictive", evidence),
    "team-wide sentiment": decideClaim("team-wide sentiment", evidence),
    monitoring: decideClaim("monitoring", evidence),
    "data-integrated": decideClaim("data-integrated", evidence),
  };
}
