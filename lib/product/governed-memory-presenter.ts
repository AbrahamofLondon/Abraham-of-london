import {
  extractAssessmentEvidenceCapture,
  isUnsafeAssessmentEvidenceText,
  summarizeAssessmentEvidenceText,
  type AssessmentEvidenceCapture,
} from "@/lib/product/evidence-capture-contract";
import {
  deriveConfidenceLabel,
  type GovernanceEvidenceCoverage,
  type GovernedMemoryEvidenceOrigin,
  type GovernedMemoryItem,
  type GovernedMemorySourceSurface,
  type GovernedMemoryStatus,
} from "@/lib/product/governed-memory-contract";

type EvidenceFieldKey = keyof AssessmentEvidenceCapture;
type TrackedEvidenceFieldKey =
  | "priorAttempts"
  | "failureCause"
  | "recurrenceSignal"
  | "verificationCriteria"
  | "stopSignal"
  | "escalationTrigger"
  | "decisionDependency"
  | "consequenceFinancial"
  | "consequenceReputational"
  | "consequenceInstitutional"
  | "consequenceTimeline";

type EvidenceStageInput = {
  stage: string;
  createdAt?: string | Date | null;
  payload: unknown;
};

type BaseMemoryOptions = {
  relatedCaseId?: string | null;
  relatedCycleId?: string | null;
  relatedSessionId?: string | null;
};

const FIELD_CONFIG: Record<TrackedEvidenceFieldKey, { label: string; status: GovernedMemoryStatus }> = {
  priorAttempts: { label: "Reported prior attempts", status: "ACTIVE" },
  failureCause: { label: "Reported failure cause", status: "UNRESOLVED" },
  recurrenceSignal: { label: "Reported recurrence signal", status: "UNRESOLVED" },
  verificationCriteria: { label: "Declared verification standard", status: "ACTIVE" },
  stopSignal: { label: "Reported stop condition", status: "UNRESOLVED" },
  escalationTrigger: { label: "Captured escalation threshold", status: "UNRESOLVED" },
  decisionDependency: { label: "Reported decision dependency", status: "UNRESOLVED" },
  consequenceFinancial: { label: "Reported financial consequence", status: "UNRESOLVED" },
  consequenceReputational: { label: "Reported reputational consequence", status: "UNRESOLVED" },
  consequenceInstitutional: { label: "Reported institutional consequence", status: "UNRESOLVED" },
  consequenceTimeline: { label: "Reported timeline consequence", status: "UNRESOLVED" },
};

function toIso(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function mapStageToSurface(stage: string): GovernedMemorySourceSurface {
  switch (stage) {
    case "team":
      return "TEAM_ASSESSMENT";
    case "enterprise":
      return "ENTERPRISE_ASSESSMENT";
    case "executive_reporting":
      return "EXECUTIVE_REPORTING";
    case "strategy_room":
      return "STRATEGY_ROOM";
    case "monitoring":
      return "RETURN_BRIEF";
    default:
      return "DECISION_CENTRE";
  }
}

function buildSafeSummary(value: string, max = 220): {
  summary: string;
  audienceSafe: boolean;
  suppressedReason?: string;
} {
  if (isUnsafeAssessmentEvidenceText(value)) {
    return {
      summary: "Evidence captured but withheld from display.",
      audienceSafe: false,
      suppressedReason: "Unsafe or respondent-sensitive text was withheld from display.",
    };
  }

  return {
    summary: summarizeAssessmentEvidenceText(value, max),
    audienceSafe: true,
  };
}

function stageEvidenceEntries(stages: EvidenceStageInput[]): Array<{
  field: TrackedEvidenceFieldKey;
  value: string;
  createdAt: string | null;
  sourceSurface: GovernedMemorySourceSurface;
}> {
  const entries: Array<{
    field: TrackedEvidenceFieldKey;
    value: string;
    createdAt: string | null;
    sourceSurface: GovernedMemorySourceSurface;
  }> = [];

  for (const stage of stages) {
    const evidence = extractAssessmentEvidenceCapture(stage.payload);
    const createdAt = toIso(stage.createdAt);
    const sourceSurface = mapStageToSurface(stage.stage);
    for (const field of Object.keys(FIELD_CONFIG) as TrackedEvidenceFieldKey[]) {
      const value = evidence[field];
      if (!value) continue;
      entries.push({
        field,
        value,
        createdAt,
        sourceSurface,
      });
    }
  }

  return entries;
}

function latestFieldEntries(stages: EvidenceStageInput[]): Map<TrackedEvidenceFieldKey, ReturnType<typeof stageEvidenceEntries>[number]> {
  const latest = new Map<TrackedEvidenceFieldKey, ReturnType<typeof stageEvidenceEntries>[number]>();
  for (const entry of stageEvidenceEntries(stages).reverse()) {
    if (!latest.has(entry.field)) {
      latest.set(entry.field, entry);
    }
  }
  return latest;
}

function markStale(status: GovernedMemoryStatus, capturedAt: string | null): GovernedMemoryStatus {
  if (!capturedAt) return status;
  const ageMs = Date.now() - new Date(capturedAt).getTime();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  return ageMs > ninetyDaysMs && status !== "RESOLVED" ? "STALE" : status;
}

export function buildGovernedMemoryFromEvidenceStages(
  stages: EvidenceStageInput[],
  options: BaseMemoryOptions = {},
): GovernedMemoryItem[] {
  const latest = latestFieldEntries(stages);
  const items: GovernedMemoryItem[] = [];

  for (const [field, entry] of latest.entries()) {
    const safe = buildSafeSummary(entry.value);
    const baseStatus = markStale(FIELD_CONFIG[field].status, entry.createdAt);
    const origin: GovernedMemoryEvidenceOrigin = "SELF_REPORTED";

    items.push({
      id: field,
      label: FIELD_CONFIG[field].label,
      summary: safe.summary,
      sourceSurface: entry.sourceSurface,
      capturedAt: entry.createdAt,
      evidenceOrigin: origin,
      status: safe.audienceSafe ? baseStatus : "SUPPRESSED",
      confidenceLabel: deriveConfidenceLabel(origin),
      audienceSafe: safe.audienceSafe,
      suppressedReason: safe.suppressedReason,
      relatedCaseId: options.relatedCaseId ?? null,
      relatedCycleId: options.relatedCycleId ?? null,
      relatedSessionId: options.relatedSessionId ?? null,
    });
  }

  return items;
}

export function buildGovernedMemoryFromEvidenceCapture(input: {
  evidence: AssessmentEvidenceCapture | null | undefined;
  sourceSurface: GovernedMemorySourceSurface;
  capturedAt?: string | Date | null;
  defaultStatus?: Partial<Record<EvidenceFieldKey, GovernedMemoryStatus>>;
} & BaseMemoryOptions): GovernedMemoryItem[] {
  if (!input.evidence) return [];

  const items: GovernedMemoryItem[] = [];
  for (const field of Object.keys(FIELD_CONFIG) as TrackedEvidenceFieldKey[]) {
    const raw = input.evidence[field];
    if (!raw) continue;
    const safe = buildSafeSummary(raw, field === "verificationCriteria" ? 190 : 170);
    const origin: GovernedMemoryEvidenceOrigin = "SELF_REPORTED";
    const status = markStale(input.defaultStatus?.[field] ?? FIELD_CONFIG[field].status, toIso(input.capturedAt));
    items.push({
      id: field,
      label: FIELD_CONFIG[field].label,
      summary: safe.summary,
      sourceSurface: input.sourceSurface,
      capturedAt: toIso(input.capturedAt),
      evidenceOrigin: origin,
      status: safe.audienceSafe ? status : "SUPPRESSED",
      confidenceLabel: deriveConfidenceLabel(origin),
      audienceSafe: safe.audienceSafe,
      suppressedReason: safe.suppressedReason,
      relatedCaseId: input.relatedCaseId ?? null,
      relatedCycleId: input.relatedCycleId ?? null,
      relatedSessionId: input.relatedSessionId ?? null,
    });
  }

  return items;
}

export function buildPatternRecurrenceMemory(input: {
  caseId?: string | null;
  sourceSurface?: GovernedMemorySourceSurface;
  capturedAt?: string | Date | null;
  status?: "NO_PRIOR_PATTERN" | "POSSIBLE_RECURRENCE" | "VERIFIED_RECURRENCE" | "INSUFFICIENT_HISTORY" | null;
  priorCount?: number;
  explanation?: string | null;
}): GovernedMemoryItem[] {
  if (!input.status || input.status === "NO_PRIOR_PATTERN" || input.status === "INSUFFICIENT_HISTORY") {
    return [];
  }

  return [{
    id: "detected-recurrence",
    label: input.status === "VERIFIED_RECURRENCE" ? "Captured repeated pattern" : "Captured recurrence risk",
    summary: input.explanation
      ? summarizeAssessmentEvidenceText(input.explanation, 220)
      : `${input.priorCount ?? 0} prior case${input.priorCount === 1 ? "" : "s"} resemble this pattern.`,
    sourceSurface: input.sourceSurface ?? "DECISION_CENTRE",
    capturedAt: toIso(input.capturedAt),
    evidenceOrigin: "STRUCTURED_DIAGNOSTIC",
    status: input.status === "VERIFIED_RECURRENCE" ? "UNRESOLVED" : "ACTIVE",
    confidenceLabel: deriveConfidenceLabel("STRUCTURED_DIAGNOSTIC"),
    audienceSafe: true,
    relatedCaseId: input.caseId ?? null,
  }];
}

export function buildVerificationBoundaryMemory(input: {
  caseId?: string | null;
  verificationCriteria?: string | null;
  outcomeStatus?: string | null;
  capturedAt?: string | Date | null;
}): GovernedMemoryItem[] {
  if (!input.verificationCriteria || input.outcomeStatus) return [];

  return [{
    id: "verification-boundary",
    label: "What the system cannot yet verify",
    summary: "The system cannot yet verify whether the declared standard for proof has been met.",
    sourceSurface: "RETURN_BRIEF",
    capturedAt: toIso(input.capturedAt),
    evidenceOrigin: "STRUCTURED_DIAGNOSTIC",
    status: "ACTIVE",
    confidenceLabel: deriveConfidenceLabel("STRUCTURED_DIAGNOSTIC"),
    audienceSafe: true,
    relatedCaseId: input.caseId ?? null,
  }];
}

export function buildGovernanceEvidenceCoverage(input: {
  cases: Array<{
    evidenceCapture?: AssessmentEvidenceCapture | null;
    unresolvedCommitments?: number | null;
  }>;
  aggregationSafe: boolean;
  suppressionReason?: string;
}): GovernanceEvidenceCoverage {
  const totalCases = input.cases.length;
  const safeCases = input.aggregationSafe ? input.cases : [];
  const casesWithPriorAttempts = safeCases.filter((item) => Boolean(item.evidenceCapture?.priorAttempts)).length;
  const casesWithVerificationCriteria = safeCases.filter((item) => Boolean(item.evidenceCapture?.verificationCriteria)).length;
  const casesWithRecurrenceSignal = safeCases.filter((item) => Boolean(item.evidenceCapture?.recurrenceSignal)).length;
  const casesWithUnresolvedCommitments = safeCases.filter((item) => (item.unresolvedCommitments ?? 0) > 0).length;
  const suppressedCount = input.aggregationSafe ? 0 : totalCases;
  const definedSignals = casesWithPriorAttempts + casesWithVerificationCriteria + casesWithRecurrenceSignal;

  const coverageGrade: GovernanceEvidenceCoverage["coverageGrade"] =
    !input.aggregationSafe || totalCases === 0
      ? "LOW"
      : definedSignals >= totalCases * 2
        ? "GOVERNED"
        : definedSignals >= totalCases
          ? "STRONG"
          : definedSignals > 0
            ? "PARTIAL"
            : "LOW";

  const explanation = input.aggregationSafe
    ? "Evidence coverage is shown only where aggregation is safe."
    : input.suppressionReason || "Evidence coverage is shown only where aggregation is safe.";

  return {
    totalCases,
    casesWithPriorAttempts,
    casesWithVerificationCriteria,
    casesWithRecurrenceSignal,
    casesWithUnresolvedCommitments,
    suppressedCount,
    coverageGrade,
    explanation,
    sponsorSafe: true,
  };
}

export function selectStrategySessionMemory(items: GovernedMemoryItem[]): GovernedMemoryItem[] {
  const orderedIds = ["failureCause", "verificationCriteria", "stopSignal", "escalationTrigger"];
  return orderedIds
    .map((id) => items.find((item) => item.id === id && item.status !== "RESOLVED"))
    .filter((item): item is GovernedMemoryItem => Boolean(item))
    .slice(0, 4);
}

export function selectStrategyEntryMemory(items: GovernedMemoryItem[]): GovernedMemoryItem[] {
  const orderedIds = ["failureCause", "priorAttempts", "verificationCriteria", "decisionDependency", "escalationTrigger"];
  return orderedIds
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is GovernedMemoryItem => Boolean(item));
}

export function groupDecisionCentreMemory(items: GovernedMemoryItem[]): Array<{
  key: string;
  title: string;
  items: GovernedMemoryItem[];
}> {
  const groups = [
    { key: "declared", title: "What was declared", ids: ["priorAttempts"] },
    { key: "repeated", title: "What repeated", ids: ["recurrenceSignal", "detected-recurrence"] },
    { key: "unresolved", title: "What remains unresolved", ids: ["failureCause", "decisionDependency", "stopSignal", "escalationTrigger"] },
    { key: "proof", title: "What standard was set for proof", ids: ["verificationCriteria"] },
    { key: "cannot-verify", title: "What the system cannot yet verify", ids: ["verification-boundary"] },
  ];

  return groups
    .map((group) => ({
      key: group.key,
      title: group.title,
      items: group.ids
        .map((id) => items.find((item) => item.id === id))
        .filter((item): item is GovernedMemoryItem => Boolean(item)),
    }))
    .filter((group) => group.items.length > 0);
}

export function describeOversightContinuity(signalType: string): {
  confidenceLabel: ReturnType<typeof deriveConfidenceLabel>;
  sourceLabel: string;
} {
  switch (signalType) {
    case "COMMITMENT_UNVERIFIED":
    case "OUTCOME_IMPROVED":
    case "OUTCOME_DETERIORATED":
      return {
        confidenceLabel: deriveConfidenceLabel("VERIFIED_OUTCOME"),
        sourceLabel: "Checked in outcome or commitment verification",
      };
    case "PATTERN_RECURRED":
    case "DIVERGENCE_DETECTED":
    case "BOARDROOM_THRESHOLD_MET":
      return {
        confidenceLabel: deriveConfidenceLabel("STRUCTURED_DIAGNOSTIC"),
        sourceLabel: "Captured in cross-case governance analysis",
      };
    default:
      return {
        confidenceLabel: deriveConfidenceLabel("SELF_REPORTED"),
        sourceLabel: "Reported in prior governance evidence",
      };
  }
}
