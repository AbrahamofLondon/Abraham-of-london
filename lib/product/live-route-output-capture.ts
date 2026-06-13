import { composeFastDiagnosticGoldResult } from "@/lib/product/fast-diagnostic-gold-composer";
import { composeFreeSignalGoldResult } from "@/lib/product/free-signal-gold-composer";
import { composeTeamAssessmentGoldResult } from "@/lib/product/team-assessment-gold-composer";
import { composeEnterpriseAssessmentGoldResult } from "@/lib/product/enterprise-assessment-gold-composer";
import { composeDecisionInstrumentGoldResult } from "@/lib/product/decision-instrument-gold-composer";
import { composeStrategyRoomSessionGoldReport } from "@/lib/product/strategy-room-session-gold-composer";
import { GOLDEN_DECISION_SCENARIOS } from "@/lib/judgement/golden-decision-scenarios";

export interface LiveRouteOutputCapture {
  productCode: string;
  route: string;
  scenarioId: string;
  inputPayload: Record<string, unknown>;
  renderedOutputText: string;
  renderedSections: string[];
  judgementFieldsDetected: {
    diagnosis: boolean;
    consequence: boolean;
    nextMove: boolean;
    falsification: boolean;
    escalation: boolean;
    executionSequence: boolean;
  };
  usesJudgementEngine: boolean;
  captureMethod: "route_test" | "component_render" | "api_response" | "manual_evidence";
  capturedAt: string;
}

export interface CaseDossierValuePayload {
  productCode: string;
  caseTitle: string;
  signal: string;
  decisionLesson: string;
  evidenceBasis: string[];
  consequence: string;
  nextMove: string;
  limitation: string;
  reuseValue: string;
}

export interface WaveOneRouteDiscovery {
  productCode: string;
  requiredRoute: string;
  discoveredRoute: string;
  routeExists: boolean;
  routeNotes: string[];
}

const SCENARIOS_BY_ID = new Map(GOLDEN_DECISION_SCENARIOS.map((scenario) => [scenario.id, scenario]));

export const WAVE_ONE_ROUTE_DISCOVERY: WaveOneRouteDiscovery[] = [
  {
    productCode: "fast_diagnostic",
    requiredRoute: "/diagnostics/fast",
    discoveredRoute: "/diagnostics/fast -> /foundry/decision-test",
    routeExists: true,
    routeNotes: ["next.config.mjs redirects /diagnostics/fast to the public kernel decision test route."],
  },
  {
    productCode: "team_assessment",
    requiredRoute: "/team-assessment or equivalent",
    discoveredRoute: "/diagnostics/team-assessment",
    routeExists: true,
    routeNotes: ["Customer-facing team assessment route exists as a diagnostics route."],
  },
  {
    productCode: "enterprise_assessment",
    requiredRoute: "/enterprise-assessment or equivalent",
    discoveredRoute: "/diagnostics/enterprise-assessment",
    routeExists: true,
    routeNotes: ["Customer-facing enterprise assessment route exists as a diagnostics route."],
  },
  {
    productCode: "case_dossier_tariff_shock",
    requiredRoute: "/evidence/tariff-shock or equivalent",
    discoveredRoute: "/evidence/tariff-shock-growth-break",
    routeExists: true,
    routeNotes: ["Catalog successPath points to this evidence dossier route."],
  },
  {
    productCode: "case_dossier_team_alignment",
    requiredRoute: "/evidence/team-alignment or equivalent",
    discoveredRoute: "/evidence/team-alignment-illusion",
    routeExists: true,
    routeNotes: ["Catalog successPath points to this evidence dossier route."],
  },
  {
    productCode: "case_dossier_escalation_denied",
    requiredRoute: "/evidence/escalation-denied or equivalent",
    discoveredRoute: "/evidence/escalation-denied-case",
    routeExists: true,
    routeNotes: ["Catalog successPath points to this evidence dossier route."],
  },
  {
    productCode: "personal_decision_audit",
    requiredRoute: "/test-your-decision or decision instrument route",
    discoveredRoute: "/test-your-decision",
    routeExists: true,
    routeNotes: ["The route is currently a routing layer, not a completed paid decision-instrument output route."],
  },
  {
    productCode: "strategy_room",
    requiredRoute: "/consulting/strategy-room or strategy-room session route",
    discoveredRoute: "/strategy-room",
    routeExists: true,
    routeNotes: ["/consulting/strategy-room redirects to /diagnostics; /strategy-room is the active customer-facing strategy room surface."],
  },
];

export function captureRequiredWaveOneLiveRouteOutputs(capturedAt = new Date().toISOString()): LiveRouteOutputCapture[] {
  return [
    captureFastDiagnostic(capturedAt),
    captureTeamAssessment(capturedAt),
    captureEnterpriseAssessment(capturedAt),
    captureCaseDossier(
      "/evidence/tariff-shock-growth-break",
      "tariff-route-proof",
      {
        productCode: "case_dossier_tariff_shock",
        caseTitle: "When Growth Models Broke Under Tariff Shock",
        signal: "Tariff repricing moved faster than consensus allocation models.",
        decisionLesson: "Reclassify the regime before consensus catches up; waiting for confirmation is itself the exposure.",
        evidenceBasis: ["Tariff repricing magnitude", "Consensus positioning data", "Institutional repositioning lag", "Exposure compounding estimate"],
        consequence: "Late movers absorbed avoidable drawdown and reallocated under worse liquidity.",
        nextMove: "Run a regime-break stress test against all growth-dependent allocations and set a 72-hour tariff-event decision protocol.",
        limitation: "Public dossier proof does not expose private source records or regulated financial advice.",
        reuseValue: "Reusable as a board-level test for structural-break decision latency.",
      },
      capturedAt,
    ),
    captureCaseDossier(
      "/evidence/team-alignment-illusion",
      "team-alignment-route-proof",
      {
        productCode: "case_dossier_team_alignment",
        caseTitle: "The Illusion of Team Alignment Under Pressure",
        signal: "Leadership alignment confidence diverged materially from team respondent evidence.",
        decisionLesson: "Do not restructure on leadership self-assessment; measure execution-layer alignment first.",
        evidenceBasis: ["Leadership self-assessment", "Team respondent scores", "OKR/reporting gap analysis", "Restructuring impact projection"],
        consequence: "Proceeding would have amplified divergence and increased dissonance within 90 days.",
        nextMove: "Halt restructuring pending execution-layer alignment measurement for affected units.",
        limitation: "Public dossier proof does not identify private respondents or internal records.",
        reuseValue: "Reusable as a governance check before restructuring, consolidation, or team investment decisions.",
      },
      capturedAt,
    ),
    captureCaseDossier(
      "/evidence/escalation-denied-case",
      "escalation-route-proof",
      {
        productCode: "case_dossier_escalation_denied",
        caseTitle: "Why Escalation Was Denied (And That Saved the System)",
        signal: "Escalation pressure was high while evidence readiness was low.",
        decisionLesson: "Separate urgency from evidence sufficiency; premature escalation can multiply the failure.",
        evidenceBasis: ["Failure mode identification", "Escalation readiness score", "Evidence sufficiency assessment", "Board response projection"],
        consequence: "Premature board escalation would have targeted symptoms and burned escalation credibility.",
        nextMove: "Complete evidence gathering across all active failure domains before board engagement.",
        limitation: "Public dossier proof does not expose source-level records or confidential stakeholder details.",
        reuseValue: "Reusable as an escalation-readiness threshold before high-stakes governance intervention.",
      },
      capturedAt,
    ),
    captureDecisionInstrument(capturedAt),
    captureStrategyRoom(capturedAt),
  ];
}

function captureFastDiagnostic(capturedAt: string): LiveRouteOutputCapture {
  const scenario = mustScenario("pricing-ownership");
  const inputPayload = {
    route: "/diagnostics/fast -> /foundry/decision-test",
    situation: scenario.caseInput.decisionDescription,
    api: "/api/public/kernel-signal",
  };
  const result = composeFastDiagnosticGoldResult({
    productCode: "fast_diagnostic",
    answers: [
      { question: "Decision description", answer: scenario.caseInput.decisionDescription },
      { question: "Evidence", answer: scenario.caseInput.evidenceAvailable.join("; ") },
      { question: "Prior attempts", answer: scenario.caseInput.priorAttempts.join("; ") },
    ],
    dominantFrictionSignal: scenario.caseInput.constraint,
    decisionContext: scenario.caseInput.decisionDescription,
    statedStake: scenario.caseInput.consequenceOfDelay,
    minutesSpentByUser: 6,
    stakeholders: scenario.caseInput.stakeholders,
    deadline: scenario.caseInput.deadline,
    desiredOutcome: scenario.caseInput.desiredOutcome,
    priorAttempts: scenario.caseInput.priorAttempts,
    optionsUnderConsideration: scenario.caseInput.optionsUnderConsideration,
  });

  return buildCapture({
    productCode: "fast_diagnostic",
    route: "/diagnostics/fast -> /foundry/decision-test",
    scenarioId: scenario.id,
    inputPayload,
    sections: {
      diagnosis: result.dominantDecisionFriction,
      consequence: result.likelyCostOfIgnoringThis,
      nextMove: result.recommendedNextStep,
      falsification: result.falsificationChallenge,
      escalation: result.whenToEscalate,
      executionSequence: result.executionSequence.join("\n"),
      limitation: result.whatThisResultDoesNotYetProve,
    },
    usesJudgementEngine: result.patternStatus === "judged",
    captureMethod: "api_response",
    capturedAt,
  });
}

function captureTeamAssessment(capturedAt: string): LiveRouteOutputCapture {
  const scenario = mustScenario("team-misalignment");
  const result = composeTeamAssessmentGoldResult({
    productCode: "team_assessment",
    teamContext: scenario.caseInput.decisionDescription,
    observedFriction: scenario.caseInput.constraint,
    teamEvidence: scenario.caseInput.evidenceAvailable,
    minutesAskedOfUser: 10,
    consequenceOfInaction: scenario.caseInput.consequenceOfDelay,
    stakeholders: scenario.caseInput.stakeholders,
    deadline: scenario.caseInput.deadline,
    desiredOutcome: scenario.caseInput.desiredOutcome,
  });

  return buildCapture({
    productCode: "team_assessment",
    route: "/diagnostics/team-assessment",
    scenarioId: scenario.id,
    inputPayload: scenario.caseInput as unknown as Record<string, unknown>,
    sections: {
      diagnosis: result.dominantTeamFriction,
      consequence: result.commercialConsequence,
      nextMove: result.recommendedNextStep,
      falsification: result.causedByPattern,
      escalation: result.whenToEscalate,
      executionSequence: result.executionSequence.join("\n"),
      limitation: result.whatThisResultDoesNotYetProve,
    },
    usesJudgementEngine: result.patternStatus === "judged",
    captureMethod: "component_render",
    capturedAt,
  });
}

function captureEnterpriseAssessment(capturedAt: string): LiveRouteOutputCapture {
  const scenario = mustScenario("board-disagreement");
  const result = composeEnterpriseAssessmentGoldResult({
    productCode: "enterprise_assessment",
    enterpriseContext: scenario.caseInput.decisionDescription,
    observedFriction: scenario.caseInput.constraint,
    enterpriseEvidence: scenario.caseInput.evidenceAvailable,
    minutesAskedOfUser: 12,
    consequenceOfInaction: scenario.caseInput.consequenceOfDelay,
    stakeholders: scenario.caseInput.stakeholders,
    deadline: scenario.caseInput.deadline,
    desiredOutcome: scenario.caseInput.desiredOutcome,
  });

  return buildCapture({
    productCode: "enterprise_assessment",
    route: "/diagnostics/enterprise-assessment",
    scenarioId: scenario.id,
    inputPayload: scenario.caseInput as unknown as Record<string, unknown>,
    sections: {
      diagnosis: result.dominantEnterpriseFriction,
      consequence: result.strategicConsequence,
      nextMove: result.recommendedNextStep,
      falsification: result.causedByPattern,
      escalation: result.whenToEscalate,
      executionSequence: result.executionSequence.join("\n"),
      limitation: result.whatThisResultDoesNotYetProve,
    },
    usesJudgementEngine: result.patternStatus === "judged",
    captureMethod: "component_render",
    capturedAt,
  });
}

function captureFreeSignal(productCode: string, route: string, scenarioId: string, capturedAt: string): LiveRouteOutputCapture {
  const scenario = mustScenario(scenarioId);
  const result = composeFreeSignalGoldResult({
    productCode,
    observedSignal: scenario.caseInput.decisionDescription,
    signalSource: "live route scenario capture",
    customerSituation: scenario.caseInput.decisionDescription,
    whatItPointsAt: scenario.caseInput.constraint,
    minutesAskedOfUser: 8,
    consequenceOfInaction: scenario.caseInput.consequenceOfDelay,
    stakeholders: scenario.caseInput.stakeholders,
    deadline: scenario.caseInput.deadline,
    desiredOutcome: scenario.caseInput.desiredOutcome,
  });

  return buildCapture({
    productCode,
    route,
    scenarioId: scenario.id,
    inputPayload: scenario.caseInput as unknown as Record<string, unknown>,
    sections: {
      diagnosis: result.oneUsefulInterpretation,
      consequence: result.caseDerivedConsequence,
      nextMove: result.onePracticalNextAction,
      falsification: result.falsificationChallenge,
      escalation: result.oneEscalationCondition,
      executionSequence: result.executionSequence.join("\n"),
      limitation: result.oneHonestLimitation,
    },
    usesJudgementEngine: result.patternStatus === "judged",
    captureMethod: "component_render",
    capturedAt,
  });
}

function captureDecisionInstrument(capturedAt: string): LiveRouteOutputCapture {
  const scenario = mustScenario("budget-cut");
  const result = composeDecisionInstrumentGoldResult({
    productCode: "personal_decision_audit",
    decisionUnderReview: scenario.caseInput.decisionDescription,
    decisionOwner: scenario.caseInput.stakeholders[0] ?? "accountable owner",
    evidenceBasis: scenario.caseInput.evidenceAvailable,
    primaryContradiction: scenario.caseInput.constraint,
    deadlinePressure: scenario.caseInput.deadline,
    irreversibleElements: [scenario.caseInput.consequenceOfDelay],
    desiredOutcome: scenario.caseInput.desiredOutcome,
    priorAttempts: scenario.caseInput.priorAttempts,
    optionsUnderConsideration: scenario.caseInput.optionsUnderConsideration,
  });

  return buildCapture({
    productCode: "personal_decision_audit",
    route: "/test-your-decision",
    scenarioId: scenario.id,
    inputPayload: scenario.caseInput as unknown as Record<string, unknown>,
    sections: {
      diagnosis: result.decisionState,
      consequence: result.costOfDelay,
      nextMove: result.nextMove,
      falsification: result.falsificationChallenge,
      escalation: result.reviewCheckpoint,
      executionSequence: result.executionSequence.join("\n"),
      limitation: result.strategicRisk,
    },
    usesJudgementEngine: result.patternStatus === "judged",
    captureMethod: "component_render",
    capturedAt,
  });
}

function captureStrategyRoom(capturedAt: string): LiveRouteOutputCapture {
  const scenario = mustScenario("board-disagreement");
  const result = composeStrategyRoomSessionGoldReport({
    productCode: "strategy_room",
    sessionId: "live-route-proof-board-disagreement",
    sessionDate: capturedAt.slice(0, 10),
    participants: scenario.caseInput.stakeholders,
    decisionBeingWorked: scenario.caseInput.decisionDescription,
    evidenceStack: scenario.caseInput.evidenceAvailable,
    primaryTension: scenario.caseInput.constraint,
    executionConstraint: scenario.caseInput.constraint,
    agreedMinimumMove: scenario.caseInput.optionsUnderConsideration[0] ?? scenario.caseInput.desiredOutcome,
    checkpointDate: scenario.caseInput.deadline,
    consequenceOfInaction: scenario.caseInput.consequenceOfDelay,
    desiredOutcome: scenario.caseInput.desiredOutcome,
  });

  return buildCapture({
    productCode: "strategy_room",
    route: "/strategy-room",
    scenarioId: scenario.id,
    inputPayload: scenario.caseInput as unknown as Record<string, unknown>,
    sections: {
      diagnosis: result.strategicDiagnosis,
      consequence: result.riskIfIgnored,
      nextMove: result.minimumViableMove,
      falsification: result.falsificationChallenge,
      escalation: result.followUpCheckpoint,
      executionSequence: result.executionSequence.join("\n"),
      limitation: result.continuityNote,
    },
    usesJudgementEngine: result.patternStatus === "judged",
    captureMethod: "component_render",
    capturedAt,
  });
}

function captureCaseDossier(
  route: string,
  scenarioId: string,
  payload: CaseDossierValuePayload,
  capturedAt: string,
): LiveRouteOutputCapture {
  return buildCapture({
    productCode: payload.productCode,
    route,
    scenarioId,
    inputPayload: payload as unknown as Record<string, unknown>,
    sections: {
      diagnosis: payload.signal,
      consequence: payload.consequence,
      nextMove: payload.nextMove,
      falsification: payload.decisionLesson,
      escalation: payload.reuseValue,
      executionSequence: payload.evidenceBasis.join("\n"),
      limitation: payload.limitation,
    },
    usesJudgementEngine: false,
    captureMethod: "component_render",
    capturedAt,
  });
}

function buildCapture(input: {
  productCode: string;
  route: string;
  scenarioId: string;
  inputPayload: Record<string, unknown>;
  sections: Record<string, string>;
  usesJudgementEngine: boolean;
  captureMethod: LiveRouteOutputCapture["captureMethod"];
  capturedAt: string;
}): LiveRouteOutputCapture {
  const renderedSections = Object.entries(input.sections)
    .filter(([, value]) => value.trim().length > 0)
    .map(([key]) => key);
  const renderedOutputText = Object.values(input.sections).filter((value) => value.trim().length > 0).join("\n");

  return {
    productCode: input.productCode,
    route: input.route,
    scenarioId: input.scenarioId,
    inputPayload: input.inputPayload,
    renderedOutputText,
    renderedSections,
    judgementFieldsDetected: {
      diagnosis: Boolean(input.sections.diagnosis?.trim()),
      consequence: Boolean(input.sections.consequence?.trim()),
      nextMove: Boolean(input.sections.nextMove?.trim()),
      falsification: Boolean(input.sections.falsification?.trim()),
      escalation: Boolean(input.sections.escalation?.trim()),
      executionSequence: Boolean(input.sections.executionSequence?.trim()),
    },
    usesJudgementEngine: input.usesJudgementEngine,
    captureMethod: input.captureMethod,
    capturedAt: input.capturedAt,
  };
}

function mustScenario(id: string) {
  const scenario = SCENARIOS_BY_ID.get(id);
  if (!scenario) throw new Error(`Missing golden scenario: ${id}`);
  return scenario;
}
