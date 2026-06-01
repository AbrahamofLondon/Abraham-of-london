import type { AITerrainAssessment } from "@/lib/diagnostics/ai-terrain";
import { assessAITerrain } from "@/lib/diagnostics/ai-terrain";
import type { AdvantagePath } from "@/lib/diagnostics/advantage-terrain";
import { assessAdvantageTerrain } from "@/lib/diagnostics/advantage-terrain";
import type { ConsequenceProjection } from "@/lib/diagnostics/predictive-consequence";
import { projectConsequence } from "@/lib/diagnostics/predictive-consequence";
import type { GovernedMemoryItem } from "@/lib/product/governed-memory-contract";
import type { SovereignSignalAssessment } from "@/lib/sovereign/sovereign-signal-public-dto";
import type { FieldProvenance } from "@/lib/product/field-provenance-contract";
import {
  createFieldProvenance,
  formatFieldProvenanceLine,
} from "@/lib/product/field-provenance-contract";
import type {
  IntelligenceDataQuality,
  IntelligenceEmptyState,
  IntelligenceEvidencePosture,
  IntelligenceScope,
} from "@/lib/product/intelligence-contract";
import {
  normaliseAssessmentEvidenceCapture,
  normaliseGovernedMemoryItem,
} from "@/lib/product/field-provenance-normaliser";
import { computeIrreversibilityIndex } from "@/lib/product/irreversibility-index";
import {
  buildGovernedMemoryFromEvidenceCapture,
} from "@/lib/product/governed-memory-presenter";
import {
  convertPurposeAlignmentToGovernedMemory,
} from "@/lib/alignment/evidence-memory";
import type { PurposeAlignmentEvidenceCarryForward } from "@/lib/alignment/evidence-loader";
import {
  extractAssessmentEvidenceCapture,
  mergeAssessmentEvidenceCapture,
  type AssessmentEvidenceCapture,
} from "@/lib/product/evidence-capture-contract";
import {
  buildExecutiveCaseEvidenceCarryForward,
  type ExecutiveEvidenceCarryForwardItem,
} from "@/lib/product/evidence-carry-forward-presenter";
import type { DiagnosticJourneyRecord } from "@/lib/product/diagnostic-journey-record";
import type { RecommendationOutcomeLedgerEntry } from "@/lib/product/recommendation-outcome-ledger";

type AnyRecord = Record<string, unknown>;

export type ExecutiveReportingPublicResult = {
  caseId: string | null;
  executiveRunId: string | null;
  route: "STRATEGY" | "DIAGNOSTIC" | "REJECT";
  checkpointId: string | null;
  meta: {
    generatedAt: string;
    dataQuality: IntelligenceDataQuality;
    evidencePosture: IntelligenceEvidencePosture;
    provenance: FieldProvenance[];
    provenanceLine: string;
    emptyState?: IntelligenceEmptyState;
  };
  intelligenceScope: IntelligenceScope;
  header: {
    reportId: string;
    organisationName: string;
    title: string;
    subtitle: string;
    generatedAt: string;
    classification: string;
    route: string;
    authorityType: string;
    readinessTier: string;
    confidence: number;
  };
  summary: {
    state: string;
    headline: string;
    summary: string;
    mandate: string;
    failureModes: string[];
    priorityStack: string[];
    requiredInterventions: string[];
    dominantDomains: string[];
    rationale: string[];
    boardroomReadinessLabel: string;
    nextAdmittedStep: string;
  };
  constitution: {
    route: string;
    priority: string;
    temperature: string;
    orgState: string;
    posture?: string;
    readinessTier: string;
    authorityType: string;
    revenueBand: string;
    marketRiskBand: string;
    clarityScore: number;
    authorityScore: number;
    governanceScore: number;
    escalationLevel?: number;
    revenueScore: number;
    dominantDomains: string[];
    failureModes: string[];
    requiredInterventions: string[];
    sponsorTypes: string[];
    worldviewAnchors: string[];
    narrativeSummary: string;
    rationale: string[];
  };
  financialExposure: {
    replacementCostFormatted: string | null;
    executionLossFormatted: string | null;
    totalExposureFormatted: string | null;
    projectedCostOfDelay90: string | null;
    provenance: FieldProvenance[];
    provenanceLine: string;
    caveat: string;
    irreversibilitySummary: string | null;
    irreversibilityProvenanceLine: string | null;
  } | null;
  observedOutcomes: {
    title: string;
    processedDecisionCases: number;
    comparableCaseCount: number;
    improvedPercent: number;
    averageTimeToImprovementDays: number | null;
    failureRateWhenIgnored: number;
    medianResolutionWindowDays: number | null;
    confidence: "insufficient" | "directional" | "governed";
    statements: string[];
  } | null;
  decision: {
    text: string;
    constraintText: string;
    costOfDelayText: string;
    topPriority: string;
  };
  boardActions: string[];
  nextAction: string;
  boardSnapshot: {
    primaryContradiction: string;
    costOfInaction90Days: string;
    decisionVelocityRisk: string;
    competitivePosition: string;
    requiredAction: string;
  } | null;
  governanceEvidenceCarryForward: {
    title: string;
    intro: string;
    impact: string;
    items: GovernedMemoryItem[];
  } | null;
  executiveJudgement: {
    title: string;
    evidenceCarriedForward: ExecutiveEvidenceCarryForwardItem[];
    evidenceGaps: string[];
    decisionOptions: Array<{
      label: string;
      judgement: string;
      riskBenefit: string;
      recommended: boolean;
    }>;
    recommendation: {
      available: boolean;
      statement: string;
      rationale: string[];
    };
    riskBenefit: string[];
    consequenceOfDelay: string;
    governanceConditions: string[];
    ownerSponsorImplications: string[];
    boardroomDossierStatus: string;
  };
  aiTerrain: AITerrainAssessment | null;
  consequenceProjection: ConsequenceProjection | null;
  advantagePath: AdvantagePath | null;
  aiConsequenceSummary: {
    exposureLevel: string;
    classification: string;
    decisionVelocityLabel: string;
    accelerationRiskLabel: string;
    narrative: string[];
    caveat: string;
  } | null;
  /**
   * Public-safe sovereign signal assessment surfaced at the ER level.
   * Null when evidence is insufficient or the signal layer was not invoked.
   * Raw IntelligenceSignal data is never present — only the mapped DTO.
   */
  sovereignSignals: SovereignSignalAssessment | null;

  boardroom: {
    qualified: boolean;
    reason: string | null;
    dossier: {
      title: string | null;
      classification: string | null;
      generatedAt: string | null;
      sections: Array<{
        id: string;
        label: string;
        content: string;
        tone: string;
      }>;
      objectionHandling: Array<{
        objection: string;
        response: string;
      }>;
      decisionPath: Array<{
        option: string;
        consequence: string;
        recommended: boolean;
      }>;
    } | null;
  };
};

export type ExecutiveReportingPublicInput = {
  runKey: string;
  caseId: string | null;
  executiveRunId: string | null;
  checkpointId: string | null;
  route: "STRATEGY" | "DIAGNOSTIC" | "REJECT";
  generatedAt: string;
  dataQuality: IntelligenceDataQuality;
  evidencePosture: IntelligenceEvidencePosture;
  provenance: FieldProvenance[];
  emptyState?: IntelligenceEmptyState;
  scope: IntelligenceScope;
  viewModel: AnyRecord;
  canonical: AnyRecord;
  intake?: AnyRecord | null;
  purposeAlignmentEvidence?: PurposeAlignmentEvidenceCarryForward | null;
  boardroom?: {
    qualified: boolean;
    reason?: string | null;
    dossier?: AnyRecord | null;
  } | null;
  journey?: DiagnosticJourneyRecord | null;
  recommendationLedger?: RecommendationOutcomeLedgerEntry[] | null;
  /** Pre-computed public-safe sovereign signal assessment. Pass null when not available. */
  sovereignSignals?: SovereignSignalAssessment | null;
};

function s(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function n(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function arr(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => s(item)).filter(Boolean) : [];
}

function getObject(value: unknown): AnyRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as AnyRecord
    : {};
}

function formatCurrency(value: unknown): string | null {
  const amount = n(value, Number.NaN);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return `£${Math.round(amount).toLocaleString()}`;
}

function labelDecisionVelocity(score: number): string {
  if (score >= 75) return "acute";
  if (score >= 45) return "elevated";
  return "contained";
}

function labelAccelerationRisk(score: number): string {
  if (score >= 80) return "critical";
  if (score >= 55) return "high";
  if (score >= 30) return "moderate";
  return "contained";
}

function withMemoryProvenance(
  items: GovernedMemoryItem[],
  context: {
    caseId: string | null;
    executiveRunId: string | null;
    sourceSurface: string;
  },
): GovernedMemoryItem[] {
  return items.map((item) => ({
    ...item,
    provenance: item.provenance?.length
      ? item.provenance
      : normaliseGovernedMemoryItem({
          ...item,
          relatedCaseId: item.relatedCaseId ?? context.caseId,
          relatedSessionId: item.relatedSessionId ?? context.executiveRunId,
        }),
  }));
}

function buildGovernanceMemory(input: {
  canonical: AnyRecord;
  intake: AnyRecord;
  caseId: string | null;
  executiveRunId: string | null;
  purposeAlignmentEvidence?: PurposeAlignmentEvidenceCarryForward | null;
}): ExecutiveReportingPublicResult["governanceEvidenceCarryForward"] {
  const carryForward = mergeAssessmentEvidenceCapture(
    extractAssessmentEvidenceCapture(input.canonical),
    extractAssessmentEvidenceCapture(input.intake),
    extractAssessmentEvidenceCapture(getObject(input.intake.diagnosticsMeta)),
  );

  const executiveMemory = withMemoryProvenance(
    buildGovernedMemoryFromEvidenceCapture({
      evidence: carryForward,
      sourceSurface: "EXECUTIVE_REPORTING",
      relatedCaseId: input.caseId,
      relatedSessionId: input.executiveRunId,
      defaultStatus: {
        decisionDependency: "UNRESOLVED",
        failureCause: "UNRESOLVED",
        priorAttempts: "ACTIVE",
        verificationCriteria: "ACTIVE",
        escalationTrigger: "UNRESOLVED",
      },
    }).filter((item) =>
      ["decisionDependency", "failureCause", "priorAttempts", "verificationCriteria", "escalationTrigger"].includes(item.id),
    ).slice(0, 3),
    {
      caseId: input.caseId,
      executiveRunId: input.executiveRunId,
      sourceSurface: "EXECUTIVE_REPORTING",
    },
  );

  const paItems = input.purposeAlignmentEvidence?.available
    ? convertPurposeAlignmentToGovernedMemory(input.purposeAlignmentEvidence)
    : [];

  const memoryItems = [
    ...withMemoryProvenance(paItems, {
      caseId: input.caseId,
      executiveRunId: input.executiveRunId,
      sourceSurface: "PURPOSE_ALIGNMENT",
    }),
    ...executiveMemory,
  ];

  if (!memoryItems.length) return null;

  const impact = executiveMemory.some((item) => item.id === "decisionDependency")
    ? "The recommendation is being shaped around the unresolved dependency rather than assuming execution authority already exists."
    : executiveMemory.some((item) => item.id === "failureCause" || item.id === "priorAttempts")
      ? "The recommendation has been narrowed to avoid repeating earlier correction logic that was reported to fail or fail to hold."
      : "The recommendation is being shaped against the declared verification standard rather than generic progress language.";

  return {
    title: "Evidence carried forward",
    intro: "This report has inherited prior governance evidence. It affects the recommendation because earlier failure logic, dependency, or proof standards remain relevant.",
    impact,
    items: memoryItems,
  };
}

function buildFinancialProvenance(input: {
  caseId: string | null;
  executiveRunId: string | null;
  generatedAt: string;
  capture: AssessmentEvidenceCapture | null | undefined;
}): FieldProvenance[] {
  const reported = normaliseAssessmentEvidenceCapture(input.capture, {
    sourceSurface: "EXECUTIVE_REPORTING",
    sourceLabel: "Executive Reporting",
    capturedAt: input.generatedAt,
    caseId: input.caseId,
    executiveRunId: input.executiveRunId,
    scopeType: "RUN",
    scopeId: input.executiveRunId ?? input.caseId,
  }).filter((item) =>
    item.fieldKey === "consequenceFinancial" || item.fieldKey === "consequenceTimeline",
  );

  const estimated = [
    createFieldProvenance({
      fieldKey: "estimatedFinancialExposure",
      sourceSurface: "EXECUTIVE_REPORTING",
      sourceLabel: "Executive Reporting financial estimate",
      computedAt: input.generatedAt,
      caseId: input.caseId,
      executiveRunId: input.executiveRunId,
      scopeType: "RUN",
      scopeId: input.executiveRunId ?? input.caseId,
      evidencePosture: "ESTIMATED",
      confidenceLabel: "ESTIMATED",
    }),
  ];

  return [...reported, ...estimated];
}

function buildAiConsequenceSummary(aiAdjustedConsequence: AnyRecord): ExecutiveReportingPublicResult["aiConsequenceSummary"] {
  if (!Object.keys(aiAdjustedConsequence).length) return null;

  const velocityLabel = labelDecisionVelocity(n(aiAdjustedConsequence.decisionVelocityScore));
  const accelerationLabel = labelAccelerationRisk(
    n(aiAdjustedConsequence.projectedAccelerationRisk, n(aiAdjustedConsequence.accelerationRiskScore)),
  );

  return {
    exposureLevel: s(aiAdjustedConsequence.aiExposureLevel, "Estimated"),
    classification: s(aiAdjustedConsequence.classification, "Case estimate"),
    decisionVelocityLabel: velocityLabel,
    accelerationRiskLabel: accelerationLabel,
    narrative: [
      `AI exposure is classified as ${s(aiAdjustedConsequence.classification, "case-estimated").replace(/_/g, " ").toLowerCase()} for this case.`,
      `Decision velocity pressure is currently labelled ${velocityLabel}.`,
      `Acceleration risk is currently labelled ${accelerationLabel}.`,
    ],
    caveat: "This is an estimated projection derived from recorded case conditions. It is not a verified external market fact.",
  };
}

function sanitiseBoardroom(boardroom: ExecutiveReportingPublicInput["boardroom"]): ExecutiveReportingPublicResult["boardroom"] {
  const qualified = Boolean(boardroom?.qualified);
  const dossier = getObject(boardroom?.dossier);
  const rawSections = Array.isArray(dossier.sections) ? dossier.sections : [];
  const rawObjections = Array.isArray(dossier.objectionHandling) ? dossier.objectionHandling : [];
  const rawDecisionPath = Array.isArray(dossier.decisionPath) ? dossier.decisionPath : [];

  return {
    qualified,
    reason: boardroom?.reason ?? null,
    dossier: qualified && rawSections.length
      ? {
          title: s(dossier.title) || null,
          classification: s(dossier.classification) || null,
          generatedAt: s(dossier.generatedAt) || null,
          sections: rawSections.map((section, index) => {
            const record = getObject(section);
            return {
              id: s(record.id, `section-${index + 1}`),
              label: s(record.label, `Section ${index + 1}`),
              content: s(record.content),
              tone: s(record.tone, "factual"),
            };
          }).filter((section) => section.content),
          objectionHandling: rawObjections.map((entry) => {
            const record = getObject(entry);
            return {
              objection: s(record.objection),
              response: s(record.response),
            };
          }).filter((entry) => entry.objection && entry.response),
          decisionPath: rawDecisionPath.map((entry) => {
            const record = getObject(entry);
            return {
              option: s(record.option),
              consequence: s(record.consequence),
              recommended: record.recommended === true,
            };
          }).filter((entry) => entry.option && entry.consequence),
        }
      : null,
  };
}

function buildExecutiveJudgement(input: {
  canonical: AnyRecord;
  intake: AnyRecord;
  journey?: DiagnosticJourneyRecord | null;
  recommendationLedger?: RecommendationOutcomeLedgerEntry[] | null;
  summary: AnyRecord;
  constitution: AnyRecord;
  boardroom: ExecutiveReportingPublicResult["boardroom"];
  route: ExecutiveReportingPublicResult["route"];
  topPriority: string;
  nextAction: string;
  costOfDelayText: string;
  projectedCostOfDelay90: string | null;
  totalExposureFormatted: string | null;
}): ExecutiveReportingPublicResult["executiveJudgement"] {
  const carriedForward = buildExecutiveCaseEvidenceCarryForward({
    canonical: input.canonical,
    intake: input.intake,
    journey: input.journey,
    recommendationLedger: input.recommendationLedger,
  });
  const sourceCount = carriedForward.sourceSurfaces.filter((source) => source !== "executive_intake").length;
  const thresholdMet =
    input.route !== "REJECT" &&
    sourceCount >= 2;
  const evidenceLabels = carriedForward.items.map((item) => item.label).slice(0, 4);
  const priority = input.topPriority || s(input.summary.mandate) || input.nextAction || "Assign accountable ownership before escalation.";
  const sponsorText = s(getObject(input.intake.governance).sponsorNameOrSeat)
    || s(getObject(input.intake.governance).authorityScope)
    || s(input.constitution.authorityType, "Named sponsor required");
  const delayText = input.projectedCostOfDelay90
    ? `Delay keeps the estimated 90-day exposure live at ${input.projectedCostOfDelay90}.`
    : input.totalExposureFormatted
      ? `Delay leaves the current priced exposure live at ${input.totalExposureFormatted}.`
      : input.costOfDelayText
        ? `Delay consequence: ${input.costOfDelayText}`
        : "Delay consequence remains unpriced; treat that as an evidence gap, not as absence of risk.";

  const recommendationStatement = thresholdMet
    ? `Recommendation: ${priority}`
    : "Board-grade recommendation withheld until the carried-forward evidence threshold is met.";

  return {
    title: "Board-grade decision judgement",
    evidenceCarriedForward: carriedForward.items,
    evidenceGaps: carriedForward.gaps,
    decisionOptions: [
      {
        label: "Proceed with governed decision",
        judgement: priority,
        riskBenefit: "Benefit: resolves the named decision constraint. Risk: requires visible owner acceptance and near-term proof.",
        recommended: thresholdMet && input.route !== "REJECT",
      },
      {
        label: "Defer pending missing evidence",
        judgement: carriedForward.gaps[0] || "Use only if authority, team, or enterprise evidence is materially incomplete.",
        riskBenefit: "Benefit: avoids over-claiming. Risk: the consequence of delay remains live and must be explicitly accepted.",
        recommended: !thresholdMet,
      },
      {
        label: "Challenge the judgement",
        judgement: "Introduce contrary evidence against the priority stack before execution starts.",
        riskBenefit: "Benefit: improves decision quality. Risk: challenge without evidence becomes delay by another name.",
        recommended: false,
      },
    ],
    recommendation: {
      available: thresholdMet,
      statement: recommendationStatement,
      rationale: thresholdMet
        ? [
            evidenceLabels.length ? `Evidence carried forward: ${evidenceLabels.join("; ")}.` : "Evidence threshold met from the current executive record.",
            `Route judgement: ${input.route.toLowerCase()}.`,
            `Owner/sponsor condition: ${sponsorText}.`,
          ]
        : [
            "At least two non-intake evidence sources are required before this block claims board-grade recommendation status.",
            carriedForward.gaps[0] || "Evidence remains too thin for final judgement.",
          ],
    },
    riskBenefit: [
      `Primary benefit: ${s(input.summary.mandate, "the decision can move from interpretation into governed action")}.`,
      `Primary risk: ${s(input.summary.headline, "the governing condition remains active")}.`,
      "Residual risk must be tracked through an owner, proof standard, and checkpoint rather than more analysis.",
    ],
    consequenceOfDelay: delayText,
    governanceConditions: [
      `Named owner or sponsor: ${sponsorText}.`,
      `Proof condition: ${s(getObject(input.intake.decisionNeed).verificationCriteria, "define observable evidence before execution is accepted")}.`,
      "Record any challenge as evidence, not preference.",
    ],
    ownerSponsorImplications: [
      "A sponsor must either accept the recommendation, reject it with evidence, or assign a new accountable owner.",
      "If authority is unclear, the next move is ownership clarification before execution work begins.",
    ],
    boardroomDossierStatus: input.boardroom.qualified
      ? "Boardroom qualification earned; dossier material is available in the Boardroom section."
      : input.boardroom.reason || "Boardroom adversarial dossier not generated; qualification has not been earned.",
  };
}

export function toExecutiveReportingPublicResult(
  input: ExecutiveReportingPublicInput,
): ExecutiveReportingPublicResult {
  const viewModel = input.viewModel;
  const canonical = input.canonical;
  const intake = input.intake ?? {};

  const header = getObject(viewModel.header);
  const summary = getObject(viewModel.summary);
  const constitution = getObject(viewModel.constitution);
  const financialExposure = getObject(viewModel.financialExposure);
  const observedOutcomes = getObject(viewModel.observedOutcomes);
  const canonicalSections = getObject(canonical.sections);
  const canonicalConstitution = getObject(canonicalSections.constitutionalPosture);
  const purposeAlignmentEvidence = input.purposeAlignmentEvidence ?? null;
  const decisionObject = Array.isArray(getObject(canonical.evidenceGraph).decisionObjects)
    ? [...(getObject(canonical.evidenceGraph).decisionObjects as AnyRecord[])].reverse()[0] ?? {}
    : {};
  const aiAdjustedConsequence = getObject(canonical.aiAdjustedConsequence);
  const contradictionNodes = Array.isArray(getObject(canonical.evidenceGraph).nodes)
    ? (getObject(canonical.evidenceGraph).nodes as AnyRecord[]).filter((node) => {
        const kind = s(node.kind);
        return kind === "contradiction";
      })
    : [];

  const aiTerrain = assessAITerrain({
    sector: s(intake.sector, s(canonicalConstitution.sector, "professional_services")),
    revenueBand: s(constitution.revenueBand, s(intake.revenueBand)),
    avgDecisionCycleDays: n(canonicalConstitution.decisionCycleDays, 21),
    aiMentionedInProblem: [s(intake.problemStatement), s(intake.decisionQuestion), s(intake.currentConstraint), s(intake.symptoms)]
      .join(" ")
      .toLowerCase()
      .includes("ai"),
    competitorAIAdoption: [s(intake.sector), s(intake.problemStatement)]
      .join(" ")
      .toLowerCase()
      .includes("competitor"),
    blockedDecisionCount: contradictionNodes.length,
    contradictionCount: contradictionNodes.length,
    hasAIGovernance: false,
    aiInOperations: [s(intake.problemStatement), s(intake.currentConstraint)].join(" ").toLowerCase().includes("automat"),
  });

  const consequenceProjection = projectConsequence({
    contradictions: contradictionNodes.map((node) => ({
      severity: s(node.severity, "medium"),
      confidence: n(node.confidence, 0.5),
    })),
    recurrenceCount: 0,
    maxDivergenceGap: 0,
    escalationLevel: n(constitution.escalationLevel, 0),
    daysSinceIdentification: 0,
    revenueBand: s(constitution.revenueBand, s(intake.revenueBand)),
    priorInterventionCount: 0,
  });

  const advantagePath = assessAdvantageTerrain({
    velocityGapPercent: aiTerrain.decisionVelocity.gapPercent,
    aiClassification: aiTerrain.classification,
    contradictionCount: contradictionNodes.length,
    resolvedContradictionCount: 0,
    sector: s(intake.sector, "professional_services"),
    competitorAIAdoption: aiTerrain.decisionVelocity.gapPercent > 30,
    activeDomains: arr(summary.dominantDomains).length ? arr(summary.dominantDomains) : arr(constitution.dominantDomains),
    revenueBand: s(constitution.revenueBand, s(intake.revenueBand)),
  });

  const decisionText =
    s(getObject(decisionObject).decisionText)
    || s(intake.decisionQuestion)
    || s(getObject(canonicalSections.executiveSummary).mandate)
    || s(viewModel.nextAction)
    || s(getObject(viewModel.recommendations).nextAction);
  const constraintText = s(getObject(decisionObject).constraintText) || s(intake.currentConstraint);
  const costOfDelayText = s(intake.whatHappensIfNothingChanges);
  const topPriority = arr(summary.priorityStack)[0]
    || arr(constitution.requiredInterventions)[0]
    || "Address the governing condition.";

  const totalExposureFormatted = s(financialExposure.totalExposureFormatted) || formatCurrency(financialExposure.totalExposure);
  const projectedCostOfDelay90 = consequenceProjection.estimatedExposure.quarterly > 0
    ? `£${consequenceProjection.estimatedExposure.quarterly.toLocaleString()}`
    : totalExposureFormatted;

  const irreversibility = (() => {
    const signalCount = [
      Boolean(totalExposureFormatted),
      consequenceProjection.estimatedExposure.quarterly > 0,
      contradictionNodes.length > 0,
      Boolean(costOfDelayText),
    ].filter(Boolean).length;
    if (signalCount < 2) return null;
    return computeIrreversibilityIndex({
      costAccumulated: n(financialExposure.totalExposure) || consequenceProjection.estimatedExposure.quarterly || undefined,
      costThreshold: consequenceProjection.estimatedExposure.quarterly || n(financialExposure.totalExposure) || undefined,
      daysWithoutAction: costOfDelayText ? 30 : undefined,
      consequenceMaterialised: input.route === "STRATEGY",
      factors: contradictionNodes.length > 0 ? [{
        factor: "TRUST_EROSION",
        contribution: Math.min(25, contradictionNodes.length * 8),
        description: `${contradictionNodes.length} contradiction signal${contradictionNodes.length === 1 ? "" : "s"} remain active in the report evidence.`,
      }] : undefined,
    });
  })();

  const reportedFinancialCapture = mergeAssessmentEvidenceCapture(
    extractAssessmentEvidenceCapture(canonical),
    extractAssessmentEvidenceCapture(intake),
  );
  const financialProvenance = buildFinancialProvenance({
    caseId: input.caseId,
    executiveRunId: input.executiveRunId,
    generatedAt: input.generatedAt,
    capture: reportedFinancialCapture,
  });

  const boardroom = sanitiseBoardroom(input.boardroom);
  const governanceEvidenceCarryForward = buildGovernanceMemory({
    canonical,
    intake,
    caseId: input.caseId,
    executiveRunId: input.executiveRunId,
    purposeAlignmentEvidence,
  });
  const executiveJudgement = buildExecutiveJudgement({
    canonical,
    intake,
    journey: input.journey,
    recommendationLedger: input.recommendationLedger,
    summary,
    constitution,
    boardroom,
    route: input.route,
    topPriority,
    nextAction: s(viewModel.nextAction, s(getObject(viewModel.recommendations).nextAction, s(summary.mandate))),
    costOfDelayText,
    projectedCostOfDelay90,
    totalExposureFormatted,
  });

  return {
    caseId: input.caseId,
    executiveRunId: input.executiveRunId,
    route: input.route,
    checkpointId: input.checkpointId,
    meta: {
      generatedAt: input.generatedAt,
      dataQuality: input.dataQuality,
      evidencePosture: input.evidencePosture,
      provenance: input.provenance,
      provenanceLine: formatFieldProvenanceLine(input.provenance, {
        includeEvidencePosture: true,
        includeScope: true,
      }),
      emptyState: input.emptyState,
    },
    intelligenceScope: input.scope,
    header: {
      reportId: s(header.reportId, input.runKey),
      organisationName: s(header.organisationName, "Prospective Organisation"),
      title: s(header.title, "Executive reporting result"),
      subtitle: s(header.subtitle),
      generatedAt: s(header.generatedAt, input.generatedAt),
      classification: s(header.classification, "RESTRICTED"),
      route: s(header.route, input.route),
      authorityType: s(header.authorityType, s(constitution.authorityType, "UNCLEAR")),
      readinessTier: s(header.readinessTier, s(constitution.readinessTier, "EMERGING")),
      confidence: n(header.confidence, n(constitution.clarityScore)),
    },
    summary: {
      state: s(summary.state, s(constitution.orgState, "DRIFTING")),
      headline: s(summary.headline, "Condition identified"),
      summary: s(summary.summary, "The report has identified a governing condition that now requires a decision."),
      mandate: s(summary.mandate, "Proceed according to the governed recommendation sequence."),
      failureModes: arr(summary.failureModes).length ? arr(summary.failureModes) : arr(constitution.failureModes),
      priorityStack: arr(summary.priorityStack),
      requiredInterventions: arr(summary.requiredInterventions).length ? arr(summary.requiredInterventions) : arr(constitution.requiredInterventions),
      dominantDomains: arr(summary.dominantDomains).length ? arr(summary.dominantDomains) : arr(constitution.dominantDomains),
      rationale: arr(summary.rationale).length ? arr(summary.rationale) : arr(constitution.rationale),
      boardroomReadinessLabel: boardroom.qualified
        ? "Boardroom-ready. A dossier is available for board-level review."
        : boardroom.reason || "Boardroom readiness has not been earned yet.",
      nextAdmittedStep: input.route === "STRATEGY"
        ? "Enter Strategy Room. Execution is admitted and the checkpoint has been created against this report."
        : "No forced paid escalation is being claimed. Strategy Room remains available only if execution conditions are met.",
    },
    constitution: {
      route: s(constitution.route, input.route),
      priority: s(constitution.priority),
      temperature: s(constitution.temperature),
      orgState: s(constitution.orgState, "DRIFTING"),
      posture: s(constitution.posture) || undefined,
      readinessTier: s(constitution.readinessTier, "EMERGING"),
      authorityType: s(constitution.authorityType, "UNCLEAR"),
      revenueBand: s(constitution.revenueBand, s(intake.revenueBand)),
      marketRiskBand: s(constitution.marketRiskBand),
      clarityScore: n(constitution.clarityScore, 0),
      authorityScore: n(constitution.authorityScore, 0),
      governanceScore: n(constitution.governanceScore, 0),
      escalationLevel: constitution.escalationLevel == null ? undefined : n(constitution.escalationLevel, 0),
      revenueScore: n(constitution.revenueScore, 0),
      dominantDomains: arr(constitution.dominantDomains),
      failureModes: arr(constitution.failureModes),
      requiredInterventions: arr(constitution.requiredInterventions),
      sponsorTypes: arr(constitution.sponsorTypes),
      worldviewAnchors: arr(constitution.worldviewAnchors),
      narrativeSummary: s(constitution.narrativeSummary),
      rationale: arr(constitution.rationale),
    },
    financialExposure: totalExposureFormatted || projectedCostOfDelay90
      ? {
          replacementCostFormatted: s(financialExposure.replacementCostFormatted) || formatCurrency(financialExposure.replacementCost),
          executionLossFormatted: s(financialExposure.executionLossFormatted) || formatCurrency(financialExposure.executionLoss),
          totalExposureFormatted,
          projectedCostOfDelay90,
          provenance: financialProvenance,
          provenanceLine: formatFieldProvenanceLine(financialProvenance, {
            includeEvidencePosture: true,
            includeScope: true,
          }),
          caveat: "Financial exposure is estimated from recorded case signals and reported consequence statements. It is not a verified external accounting figure.",
          irreversibilitySummary: irreversibility?.summary ?? null,
          irreversibilityProvenanceLine: irreversibility
            ? formatFieldProvenanceLine([
                createFieldProvenance({
                  fieldKey: "irreversibilityEstimate",
                  sourceSurface: "EXECUTIVE_REPORTING",
                  sourceLabel: "Executive Reporting irreversibility estimate",
                  computedAt: input.generatedAt,
                  caseId: input.caseId,
                  executiveRunId: input.executiveRunId,
                  scopeType: "RUN",
                  scopeId: input.executiveRunId ?? input.caseId,
                  evidencePosture: "ESTIMATED",
                  confidenceLabel: "ESTIMATED",
                }),
              ])
            : null,
        }
      : null,
    observedOutcomes: Object.keys(observedOutcomes).length
      ? {
          title: s(observedOutcomes.title, "Observed Outcomes (System Evidence)"),
          processedDecisionCases: n(observedOutcomes.processedDecisionCases, 0),
          comparableCaseCount: n(observedOutcomes.comparableCaseCount, 0),
          improvedPercent: n(observedOutcomes.improvedPercent, 0),
          averageTimeToImprovementDays: observedOutcomes.averageTimeToImprovementDays == null
            ? null
            : n(observedOutcomes.averageTimeToImprovementDays, 0),
          failureRateWhenIgnored: n(observedOutcomes.failureRateWhenIgnored, 0),
          medianResolutionWindowDays: observedOutcomes.medianResolutionWindowDays == null
            ? null
            : n(observedOutcomes.medianResolutionWindowDays, 0),
          confidence: observedOutcomes.confidence === "directional" || observedOutcomes.confidence === "governed"
            ? observedOutcomes.confidence
            : "insufficient",
          statements: arr(observedOutcomes.statements),
        }
      : null,
    decision: {
      text: decisionText,
      constraintText,
      costOfDelayText,
      topPriority,
    },
    boardActions: arr(viewModel.boardActions).length ? arr(viewModel.boardActions) : arr(summary.priorityStack),
    nextAction: s(viewModel.nextAction, s(getObject(viewModel.recommendations).nextAction, s(summary.mandate))),
    boardSnapshot: {
      primaryContradiction: contradictionNodes[0]
        ? s(getObject(contradictionNodes[0]).summary, s(getObject(contradictionNodes[0]).label, "Structural contradiction detected"))
        : s(summary.headline, "Condition identified — contradiction active"),
      costOfInaction90Days: projectedCostOfDelay90 || totalExposureFormatted || "Requires pricing",
      decisionVelocityRisk: `Recorded decision movement is ${aiTerrain.decisionVelocity.current}d with ${aiTerrain.decisionVelocity.gapPercent}% delay pressure based on this case history.`,
      competitivePosition: advantagePath.competitivePosition.replace(/_/g, " "),
      requiredAction: s(viewModel.nextAction) || arr(summary.priorityStack)[0] || "Action required — see priority stack",
    },
    governanceEvidenceCarryForward,
    executiveJudgement,
    aiTerrain,
    consequenceProjection,
    advantagePath,
    aiConsequenceSummary: buildAiConsequenceSummary(aiAdjustedConsequence),
    sovereignSignals: input.sovereignSignals ?? null,
    boardroom,
  };
}
