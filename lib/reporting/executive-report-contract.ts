// lib/reporting/executive-report-contract.ts

export type ExecutiveReportRoute = "REJECT" | "DIAGNOSTIC" | "STRATEGY";
export type ExecutiveAuthorityType = "DIRECT" | "PROXY" | "UNCLEAR";
export type ExecutiveReadinessTier =
  | "FRAGILE"
  | "EMERGING"
  | "STABILIZING"
  | "EXECUTION_READY"
  | "SOVEREIGN";
export type ExecutiveOrgPosture =
  | "ORDERED"
  | "DRIFTING"
  | "MISALIGNED"
  | "DISORDERED";

export type ExecutiveReportProductCode =
  | "executive-reporting-sample"
  | "executive-reporting-full"
  | "executive-reporting-boardroom-pdf"
  | "executive-reporting-intervention-export"
  | "strategy-room-private-artifacts";

export interface ExecutiveReportSourceRefs {
  intakeId?: string | null;
  sessionKey?: string | null;
  teamAssessmentId?: string | null;
  enterpriseAssessmentId?: string | null;
  campaignId?: string | null;
  organisationId?: string | null;
}

export interface ExecutiveConstitutionalPosture {
  route: ExecutiveReportRoute;
  confidence: number; // 0..1
  authorityType: ExecutiveAuthorityType;
  readinessTier: ExecutiveReadinessTier;
  posture: ExecutiveOrgPosture;
  escalationAllowed: boolean;
  disqualifiersTriggered: string[];
  recommendedInterventions: string[];
  rationale: string[];
}

export interface ExecutiveSignalProfile {
  clarityScore: number; // 0..100
  narrativeCoherence: number; // 0..100
  interventionReadiness: number; // 0..100
  trustCondition: number; // 0..100
  governanceDiscipline: number; // 0..100
  failureModeCount: number;
  failureModeSeverity: number; // 0..10
  authorityClarity?: number; // 0..100
  frictionIndex?: number; // 0..100
  pressureIndex?: number; // 0..100
}

export interface ExecutiveSummaryBlock {
  headline: string;
  summary: string;
  urgencyStatement: string;
  boardImplication: string;
  nextDecision: string;
}

export interface ExecutiveFailureMode {
  id: string;
  label: string;
  severity: number; // 0..10
  description?: string;
}

export interface ExecutiveRecommendation {
  id: string;
  title: string;
  kind: string;
  score: number;
  reasons: string[];
  href?: string | null;
  productCode?: ExecutiveReportProductCode | null;
}

export interface ExecutiveInterventionPlan {
  immediateActions: string[];
  stabilisationActions: string[];
  strategicActions: string[];
  escalationRecommendation: string;
}

export interface ExecutiveBoardroomMeta {
  presentationTitle: string;
  presentationSubtitle?: string;
  generatedFor?: string | null;
  generatedAt: string;
  classification: string;
  boardroomPdfAvailable: boolean;
}

export interface ExecutiveVisualPayload {
  fragilityHeatmap?: unknown;
  dissonanceMatrix?: unknown;
  contagionMap?: unknown;
  drillDownMatrix?: unknown;
  governanceHistory?: unknown;
  valueRecoveryAudit?: unknown;
  interventionProposal?: unknown;
}

export interface ExecutiveReportEnvelope {
  reportId: string;
  generatedAt: string;
  source: ExecutiveReportSourceRefs;
  title: string;
  classification: string;
  constitutionalPosture: ExecutiveConstitutionalPosture;
  signalProfile: ExecutiveSignalProfile;
  executiveSummary: ExecutiveSummaryBlock;
  failureModes: ExecutiveFailureMode[];
  recommendations: ExecutiveRecommendation[];
  intervention: ExecutiveInterventionPlan;
  visuals: ExecutiveVisualPayload;
  boardroom: ExecutiveBoardroomMeta;
  commercial: {
    sampleAvailable: boolean;
    fullReportAvailable: boolean;
    boardroomPdfAvailable: boolean;
    interventionExportAvailable: boolean;
    strategyRoomEligible: boolean;
    productCodes: ExecutiveReportProductCode[];
  };
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((x) => asString(x)).filter(Boolean);
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function normalizeExecutiveReportEnvelope(
  raw: unknown,
): ExecutiveReportEnvelope {
  const root = asRecord(raw);
  const posture = asRecord(root.constitutionalPosture);
  const signal = asRecord(root.signalProfile);
  const summary = asRecord(root.executiveSummary);
  const intervention = asRecord(root.intervention);
  const boardroom = asRecord(root.boardroom);
  const commercial = asRecord(root.commercial);
  const source = asRecord(root.source);
  const visuals = asRecord(root.visuals);

  const recommendations = Array.isArray(root.recommendations)
    ? root.recommendations.map((item, index) => {
        const rec = asRecord(item);
        return {
          id: asString(rec.id, `rec-${index + 1}`),
          title: asString(rec.title, "Recommendation"),
          kind: asString(rec.kind, "asset"),
          score: clamp(asNumber(rec.score, 0), 0, 100),
          reasons: asStringArray(rec.reasons),
          href: asString(rec.href) || null,
          productCode:
            (asString(rec.productCode) as ExecutiveReportProductCode) || null,
        };
      })
    : [];

  const failureModes = Array.isArray(root.failureModes)
    ? root.failureModes.map((item, index) => {
        const mode = asRecord(item);
        return {
          id: asString(mode.id, `failure-${index + 1}`),
          label: asString(mode.label, "Failure mode"),
          severity: clamp(asNumber(mode.severity, 0), 0, 10),
          description: asString(mode.description),
        };
      })
    : [];

  return {
    reportId: asString(root.reportId, "report-unknown"),
    generatedAt: asString(root.generatedAt, new Date().toISOString()),
    title: asString(root.title, "Executive Report"),
    classification: asString(root.classification, "RESTRICTED"),
    source: {
      intakeId: asString(source.intakeId) || null,
      sessionKey: asString(source.sessionKey) || null,
      teamAssessmentId: asString(source.teamAssessmentId) || null,
      enterpriseAssessmentId: asString(source.enterpriseAssessmentId) || null,
      campaignId: asString(source.campaignId) || null,
      organisationId: asString(source.organisationId) || null,
    },
    constitutionalPosture: {
      route: (asString(posture.route, "DIAGNOSTIC") as ExecutiveReportRoute),
      confidence: clamp(asNumber(posture.confidence, 0.5), 0, 1),
      authorityType: asString(
        posture.authorityType,
        "UNCLEAR",
      ) as ExecutiveAuthorityType,
      readinessTier: asString(
        posture.readinessTier,
        "EMERGING",
      ) as ExecutiveReadinessTier,
      posture: asString(posture.posture, "DRIFTING") as ExecutiveOrgPosture,
      escalationAllowed: asBoolean(posture.escalationAllowed, false),
      disqualifiersTriggered: asStringArray(posture.disqualifiersTriggered),
      recommendedInterventions: asStringArray(posture.recommendedInterventions),
      rationale: asStringArray(posture.rationale),
    },
    signalProfile: {
      clarityScore: clamp(asNumber(signal.clarityScore, 0), 0, 100),
      narrativeCoherence: clamp(
        asNumber(signal.narrativeCoherence, 0),
        0,
        100,
      ),
      interventionReadiness: clamp(
        asNumber(signal.interventionReadiness, 0),
        0,
        100,
      ),
      trustCondition: clamp(asNumber(signal.trustCondition, 50), 0, 100),
      governanceDiscipline: clamp(
        asNumber(signal.governanceDiscipline, 50),
        0,
        100,
      ),
      failureModeCount: Math.max(0, Math.floor(asNumber(signal.failureModeCount, 0))),
      failureModeSeverity: clamp(
        asNumber(signal.failureModeSeverity, 0),
        0,
        10,
      ),
      authorityClarity: clamp(asNumber(signal.authorityClarity, 0), 0, 100),
      frictionIndex: clamp(asNumber(signal.frictionIndex, 0), 0, 100),
      pressureIndex: clamp(asNumber(signal.pressureIndex, 0), 0, 100),
    },
    executiveSummary: {
      headline: asString(summary.headline, "Executive signal identified"),
      summary: asString(summary.summary, "No summary available."),
      urgencyStatement: asString(
        summary.urgencyStatement,
        "Urgency not yet assessed.",
      ),
      boardImplication: asString(
        summary.boardImplication,
        "Board implication not yet stated.",
      ),
      nextDecision: asString(
        summary.nextDecision,
        "Next decision not yet stated.",
      ),
    },
    failureModes,
    recommendations,
    intervention: {
      immediateActions: asStringArray(intervention.immediateActions),
      stabilisationActions: asStringArray(intervention.stabilisationActions),
      strategicActions: asStringArray(intervention.strategicActions),
      escalationRecommendation: asString(
        intervention.escalationRecommendation,
        "No escalation recommendation available.",
      ),
    },
    visuals: {
      fragilityHeatmap: visuals.fragilityHeatmap,
      dissonanceMatrix: visuals.dissonanceMatrix,
      contagionMap: visuals.contagionMap,
      drillDownMatrix: visuals.drillDownMatrix,
      governanceHistory: visuals.governanceHistory,
      valueRecoveryAudit: visuals.valueRecoveryAudit,
      interventionProposal: visuals.interventionProposal,
    },
    boardroom: {
      presentationTitle: asString(
        boardroom.presentationTitle,
        "Executive Reporting Boardroom Briefing",
      ),
      presentationSubtitle: asString(boardroom.presentationSubtitle),
      generatedFor: asString(boardroom.generatedFor) || null,
      generatedAt: asString(boardroom.generatedAt, new Date().toISOString()),
      classification: asString(boardroom.classification, "RESTRICTED"),
      boardroomPdfAvailable: asBoolean(boardroom.boardroomPdfAvailable, false),
    },
    commercial: {
      sampleAvailable: asBoolean(commercial.sampleAvailable, true),
      fullReportAvailable: asBoolean(commercial.fullReportAvailable, false),
      boardroomPdfAvailable: asBoolean(commercial.boardroomPdfAvailable, false),
      interventionExportAvailable: asBoolean(
        commercial.interventionExportAvailable,
        false,
      ),
      strategyRoomEligible: asBoolean(commercial.strategyRoomEligible, false),
      productCodes: Array.isArray(commercial.productCodes)
        ? commercial.productCodes.filter(
            (x): x is ExecutiveReportProductCode => typeof x === "string",
          )
        : [],
    },
  };
}