import type { PurposeProfileResult } from "@/lib/alignment/types";

export type DiagnosticLayer =
  | "personal"
  | "constitutional"
  | "team"
  | "enterprise"
  | "executive";

export type DiagnosticSeverity = "low" | "moderate" | "high" | "critical";

export type DiagnosticLayerInput = {
  personal?: PurposeProfileResult | null;
  constitutional?: ConstitutionalLayerInput | null;
  team?: TeamLayerInput | null;
  enterprise?: EnterpriseLayerInput | null;
  executive?: ExecutiveLayerInput | null;
};

export type ConstitutionalLayerInput = {
  authorityClarity: number;
  mandateIntegrity: number;
  decisionRights: number;
  constraintStructure: number;
  governanceAlignment: number;
  posture?: string | null;
};

export type TeamLayerInput = {
  coordinationFriction: number;
  roleCollision: number;
  decisionLatency: number;
  communicationDistortion: number;
  dependencyLock: number;
  executionTrust?: number | null;
};

export type EnterpriseLayerInput = {
  crossTeamFriction: number;
  resourceAllocationDistortion: number;
  strategicDrift: number;
  financialExposure: number;
  institutionalInertia: number;
  scaleFactor?: number | null;
};

export type ExecutiveLayerInput = {
  consequenceExposure: number;
  wrongActionCost: number;
  timeToFailureDays: number;
  urgency: number;
  decisionOwnershipClarity: number;
};

export type LayerState = {
  label: string;
  dimensions: Record<string, number | string>;
  severity: DiagnosticSeverity;
};

export type LayerTension = {
  id: string;
  label: string;
  evidence: string[];
  severity: DiagnosticSeverity;
  escalatesFrom?: DiagnosticLayer | null;
};

export type LayerPatternScore = {
  id: string;
  label: string;
  score: number;
  evidence: string[];
  consequence: string;
  action: string;
};

export type LayerConsequence = {
  statement: string;
  decisionPressure: DiagnosticSeverity;
  escalationMeaning: string;
};

export type LayerAction = {
  directive: string;
  owner: string;
  firstMove: string;
  escalationThreshold: string;
};

export type LayerIntelligenceResult = {
  layer: DiagnosticLayer;
  conditionStatement: string;
  state: LayerState;
  tensions: LayerTension[];
  patternScores: LayerPatternScore[];
  primaryPattern: LayerPatternScore;
  secondaryPattern?: LayerPatternScore | null;
  consequence: LayerConsequence;
  action: LayerAction;
  evidence: string[];
  consumedPriorSignals: string[];
};

export type DiagnosticIntelligenceChain = {
  layers: LayerIntelligenceResult[];
  finalCondition: string;
  finalAction: string;
  executivePressure: DiagnosticSeverity;
};

const DEFAULT_SCORE = 50;

export function buildDiagnosticIntelligenceChain(
  input: DiagnosticLayerInput,
): DiagnosticIntelligenceChain {
  const personal = buildPersonalLayer(input.personal ?? null);
  const constitutional = buildConstitutionalLayer(
    input.constitutional ?? null,
    personal,
  );
  const team = buildTeamLayer(input.team ?? null, constitutional);
  const enterprise = buildEnterpriseLayer(input.enterprise ?? null, team);
  const executive = buildExecutiveLayer(input.executive ?? null, enterprise);

  return {
    layers: [personal, constitutional, team, enterprise, executive],
    finalCondition: executive.conditionStatement,
    finalAction: executive.action.firstMove,
    executivePressure: executive.consequence.decisionPressure,
  };
}

function buildPersonalLayer(
  result: PurposeProfileResult | null,
): LayerIntelligenceResult {
  const domainStates = result?.domainStates ?? [];
  const lowestDomain = [...domainStates].sort(
    (a, b) => a.alignmentScore - b.alignmentScore,
  )[0];
  const strongestDomain = [...domainStates].sort(
    (a, b) => b.alignmentScore - a.alignmentScore,
  )[0];
  const primary = result?.primaryPattern;
  const contradictions = result?.contradictions ?? [];
  const severity = toSeverity(result?.severity ?? "moderate");
  const label = primary?.label ?? "Individual signal unresolved";
  const weakSignal = result?.evidence?.sharpestWeakSignal;
  const stabilisingSignal = result?.evidence?.strongestStabilisingSignal;
  const consequence =
    result?.consequenceLogic ??
    result?.primaryPattern?.consequence ??
    "Individual ambiguity remains unpriced by the wider system.";
  const firstAction =
    result?.firstAction ??
    result?.primaryPattern?.firstAction ??
    "Capture the strongest weak signal before escalating diagnosis.";

  const patterns = rankPatterns([
    pattern(
      primary?.id ?? "individual_signal",
      label,
      primary?.score ?? 50,
      [
        weakSignal?.statement ??
          lowestDomain?.domain ??
          "No canonical Purpose Alignment evidence supplied",
      ],
      consequence,
      firstAction,
    ),
    pattern(
      result?.secondaryPattern?.id ?? "stabilising_signal",
      result?.secondaryPattern?.label ?? "Stabilising personal evidence",
      result?.secondaryPattern?.score ?? strongestDomain?.alignmentScore ?? 35,
      [
        stabilisingSignal?.statement ??
          strongestDomain?.domain ??
          "No stabilising evidence supplied",
      ],
      "Stabilising evidence reduces but does not remove system-level risk.",
      "Carry the stabilising signal forward as a constraint, not a conclusion.",
    ),
  ]);

  return assembleLayer({
    layer: "personal",
    conditionStatement: `Personal signal: ${label}.`,
    state: {
      label,
      dimensions: {
        weakestDomain: lowestDomain?.domain ?? "unknown",
        strongestDomain: strongestDomain?.domain ?? "unknown",
        contradictionCount: contradictions.length,
      },
      severity,
    },
    tensions:
      contradictions.length > 0
        ? contradictions.slice(0, 3).map((contradiction) => ({
            id: contradiction.type,
            label: contradiction.type.replace(/_/g, " "),
            evidence: [contradiction.evidence],
            severity: toSeverity(contradiction.severity),
            escalatesFrom: null,
          }))
        : [
            {
              id: "personal_signal_unclear",
              label: "Personal signal requires higher-layer validation",
              evidence: ["Purpose evidence has not yet exposed a contradiction"],
              severity,
              escalatesFrom: null,
            },
          ],
    patternScores: patterns,
    consequence: {
      statement:
        result?.consequenceLogic ??
        result?.primaryPattern?.consequence ??
        "The personal layer detects signal only; it cannot prove structural cause.",
      decisionPressure: severity,
      escalationMeaning:
        "Escalation tests whether the signal is personal drift or structural failure.",
    },
    action: {
      directive:
        result?.firstAction ??
        result?.primaryPattern?.firstAction ??
        "Isolate the individual weak signal before interpreting system failure.",
      owner: "Individual",
      firstMove:
        result?.firstAction ??
        result?.primaryPattern?.firstAction ??
        "Record the weakest evidence and test it against decision structure.",
      escalationThreshold:
        result?.routingRecommendation?.reason ??
        "Escalate if the same signal appears in authority, team, or enterprise evidence.",
    },
    evidence: [
      weakSignal?.statement ?? "No weak evidence supplied",
      stabilisingSignal?.statement ??
        "No stabilising evidence supplied",
    ],
    consumedPriorSignals: [],
  });
}

function buildConstitutionalLayer(
  input: ConstitutionalLayerInput | null,
  prior: LayerIntelligenceResult,
): LayerIntelligenceResult {
  const authority = clamp(input?.authorityClarity ?? DEFAULT_SCORE);
  const mandate = clamp(input?.mandateIntegrity ?? DEFAULT_SCORE);
  const rights = clamp(input?.decisionRights ?? DEFAULT_SCORE);
  const constraints = clamp(input?.constraintStructure ?? DEFAULT_SCORE);
  const governance = clamp(input?.governanceAlignment ?? DEFAULT_SCORE);
  const structureScore = average([
    authority,
    mandate,
    rights,
    constraints,
    governance,
  ]);
  const authorityExecutionGap = Math.max(
    Math.abs(authority - rights),
    Math.abs(mandate - governance),
  );
  const severity = severityFromDeficit(100 - structureScore + authorityExecutionGap / 2);

  const patterns = rankPatterns([
    pattern(
      "authority_breakdown",
      "Authority breakdown",
      100 - authority + authorityExecutionGap,
      [
        `Authority clarity ${authority}`,
        `Decision rights ${rights}`,
        prior.conditionStatement,
      ],
      "Execution becomes negotiable because authority is not sufficiently located.",
      "Name the decision owner and remove competing authority claims.",
    ),
    pattern(
      "mandate_integrity_failure",
      "Mandate integrity failure",
      100 - mandate + Math.max(0, 65 - governance),
      [`Mandate integrity ${mandate}`, `Governance alignment ${governance}`],
      "Teams may comply with activity while avoiding the actual mandate.",
      "Rewrite the mandate as a decision right, constraint, and accountable owner.",
    ),
    pattern(
      "constraint_pathway_failure",
      "Constraint pathway failure",
      100 - constraints + Math.max(0, 65 - rights),
      [`Constraint structure ${constraints}`, `Decision rights ${rights}`],
      "The system cannot distinguish blocked execution from weak execution.",
      "Separate true constraints from preferences before intervention is assigned.",
    ),
  ]);

  const primary = patterns[0]!;

  return assembleLayer({
    layer: "constitutional",
    conditionStatement: `Constitutional condition: ${primary.label}.`,
    state: {
      label: primary.label,
      dimensions: {
        authorityClarity: authority,
        mandateIntegrity: mandate,
        decisionRights: rights,
        constraintStructure: constraints,
        governanceAlignment: governance,
        posture: input?.posture ?? "computed",
      },
      severity,
    },
    tensions: [
      {
        id: "authority_vs_execution",
        label: "Authority and execution pathway mismatch",
        evidence: [`Gap ${authorityExecutionGap}`, primary.evidence[0] ?? primary.label],
        severity,
        escalatesFrom: "personal",
      },
    ],
    patternScores: patterns,
    consequence: {
      statement: primary.consequence,
      decisionPressure: severity,
      escalationMeaning:
        "A personal signal now becomes a structural decision-formation risk.",
    },
    action: {
      directive: primary.action,
      owner: "Decision authority",
      firstMove: "Define the non-negotiable decision pathway before assigning work.",
      escalationThreshold:
        "Escalate to team diagnosis if structure is clear but execution still degrades.",
    },
    evidence: primary.evidence,
    consumedPriorSignals: [prior.conditionStatement],
  });
}

function buildTeamLayer(
  input: TeamLayerInput | null,
  prior: LayerIntelligenceResult,
): LayerIntelligenceResult {
  const friction = clamp(input?.coordinationFriction ?? DEFAULT_SCORE);
  const collision = clamp(input?.roleCollision ?? DEFAULT_SCORE);
  const latency = clamp(input?.decisionLatency ?? DEFAULT_SCORE);
  const distortion = clamp(input?.communicationDistortion ?? DEFAULT_SCORE);
  const dependency = clamp(input?.dependencyLock ?? DEFAULT_SCORE);
  const trust = clamp(input?.executionTrust ?? 100 - average([friction, collision]));
  const executionDrag = average([friction, collision, latency, distortion, dependency]);
  const severity = severityFromDeficit(executionDrag);

  const patterns = rankPatterns([
    pattern(
      "fragmented_execution",
      "Fragmented execution",
      friction + latency + Math.max(0, 55 - trust),
      [`Coordination friction ${friction}`, `Decision latency ${latency}`],
      "Execution energy fragments across unresolved handoffs.",
      "Collapse the first handoff where work repeatedly loses decision clarity.",
    ),
    pattern(
      "authority_shadowing",
      "Authority shadowing",
      collision + distortion + authorityCarry(prior),
      [`Role collision ${collision}`, prior.conditionStatement],
      "Informal authority competes with the stated pathway.",
      "Expose who is actually changing decisions after they are made.",
    ),
    pattern(
      "dependency_lock",
      "Dependency lock",
      dependency + latency + Math.max(0, friction - 40),
      [`Dependency lock ${dependency}`, `Decision latency ${latency}`],
      "The team cannot move at the speed the structure requires.",
      "Remove or resequence the dependency that blocks the first action.",
    ),
  ]);
  const primary = patterns[0]!;

  return assembleLayer({
    layer: "team",
    conditionStatement: `Team condition: ${primary.label}.`,
    state: {
      label: primary.label,
      dimensions: {
        coordinationFriction: friction,
        roleCollision: collision,
        decisionLatency: latency,
        communicationDistortion: distortion,
        dependencyLock: dependency,
        executionTrust: trust,
      },
      severity,
    },
    tensions: [
      {
        id: "structure_vs_interaction",
        label: "Structure degrades through team interaction",
        evidence: [primary.evidence[0] ?? primary.label, prior.conditionStatement],
        severity,
        escalatesFrom: "constitutional",
      },
    ],
    patternScores: patterns,
    consequence: {
      statement: primary.consequence,
      decisionPressure: severity,
      escalationMeaning:
        "A structural condition now becomes measurable coordination cost.",
    },
    action: {
      directive: primary.action,
      owner: "Team lead",
      firstMove: "Assign one intervention to the first blocked team handoff.",
      escalationThreshold:
        "Escalate to enterprise diagnosis if the same blockage repeats across teams.",
    },
    evidence: primary.evidence,
    consumedPriorSignals: [prior.conditionStatement],
  });
}

function buildEnterpriseLayer(
  input: EnterpriseLayerInput | null,
  prior: LayerIntelligenceResult,
): LayerIntelligenceResult {
  const crossTeam = clamp(input?.crossTeamFriction ?? DEFAULT_SCORE);
  const resource = clamp(input?.resourceAllocationDistortion ?? DEFAULT_SCORE);
  const drift = clamp(input?.strategicDrift ?? DEFAULT_SCORE);
  const exposure = Math.max(0, input?.financialExposure ?? DEFAULT_SCORE * 1000);
  const inertia = clamp(input?.institutionalInertia ?? DEFAULT_SCORE);
  const scale = Math.max(1, input?.scaleFactor ?? 1);
  const compoundingPressure =
    average([crossTeam, resource, drift, inertia]) + Math.min(45, exposure / 50000) + scale * 3;
  const severity = severityFromDeficit(compoundingPressure);

  const patterns = rankPatterns([
    pattern(
      "decision_congestion",
      "Decision congestion",
      crossTeam + inertia + Math.min(35, scale * 4),
      [`Cross-team friction ${crossTeam}`, `Institutional inertia ${inertia}`],
      "Decisions queue faster than the enterprise can resolve them.",
      "Create a decision-routing constraint before adding more operating activity.",
    ),
    pattern(
      "structural_drag",
      "Structural drag",
      resource + drift + Math.min(35, exposure / 80000),
      [`Resource distortion ${resource}`, `Strategic drift ${drift}`],
      "Resources continue moving after strategic reality has changed.",
      "Freeze one distorted allocation path and reprice it against the current condition.",
    ),
    pattern(
      "exposure_accumulation",
      "Exposure accumulation",
      Math.min(100, exposure / 40000) + drift + inertia,
      [`Financial exposure ${Math.round(exposure)}`, `Strategic drift ${drift}`],
      "Local execution failure has become financial exposure.",
      "Translate the unresolved condition into cost, time, and lost-option exposure.",
    ),
  ]);
  const primary = patterns[0]!;

  return assembleLayer({
    layer: "enterprise",
    conditionStatement: `Enterprise condition: ${primary.label}.`,
    state: {
      label: primary.label,
      dimensions: {
        crossTeamFriction: crossTeam,
        resourceAllocationDistortion: resource,
        strategicDrift: drift,
        financialExposure: Math.round(exposure),
        institutionalInertia: inertia,
        scaleFactor: scale,
      },
      severity,
    },
    tensions: [
      {
        id: "interaction_vs_systemic_cost",
        label: "Team-level friction compounds into enterprise cost",
        evidence: [primary.evidence[0] ?? primary.label, prior.conditionStatement],
        severity,
        escalatesFrom: "team",
      },
    ],
    patternScores: patterns,
    consequence: {
      statement: `${primary.consequence} Estimated exposed value: ${formatCurrency(exposure)}.`,
      decisionPressure: severity,
      escalationMeaning:
        "Execution degradation now has system-wide and economic consequence.",
    },
    action: {
      directive: primary.action,
      owner: "Enterprise owner",
      firstMove:
        "Price the largest unresolved drag before choosing a corrective programme.",
      escalationThreshold:
        "Escalate to executive reporting when exposure requires owner-level decision authority.",
    },
    evidence: primary.evidence,
    consumedPriorSignals: [prior.conditionStatement],
  });
}

function buildExecutiveLayer(
  input: ExecutiveLayerInput | null,
  prior: LayerIntelligenceResult,
): LayerIntelligenceResult {
  const exposure = Math.max(0, input?.consequenceExposure ?? 0);
  const wrongActionCost = Math.max(0, input?.wrongActionCost ?? exposure * 0.35);
  const timeToFailureDays = Math.max(1, input?.timeToFailureDays ?? 90);
  const urgency = clamp(input?.urgency ?? urgencyFromTime(timeToFailureDays));
  const ownership = clamp(input?.decisionOwnershipClarity ?? DEFAULT_SCORE);
  const pressure =
    Math.min(100, exposure / 50000) +
    Math.min(65, wrongActionCost / 60000) +
    urgency +
    Math.max(0, 70 - ownership);
  const severity = severityFromDeficit(pressure);

  const patterns = rankPatterns([
    pattern(
      "price_inaction",
      "Cost of inaction requires pricing",
      Math.min(100, exposure / 40000) + urgency,
      [`Consequence exposure ${Math.round(exposure)}`, `Urgency ${urgency}`],
      "Delay now has a price and must be treated as a decision.",
      "Quantify the cost of waiting and assign an owner to accept or reduce it.",
    ),
    pattern(
      "wrong_action_risk",
      "Wrong action risk",
      Math.min(100, wrongActionCost / 35000) + Math.max(0, 70 - ownership),
      [`Wrong-action cost ${Math.round(wrongActionCost)}`, `Ownership clarity ${ownership}`],
      "A premature intervention can cost more than a delayed one.",
      "Sequence intervention only after ownership and constraint tests are explicit.",
    ),
    pattern(
      "urgent_intervention_sequence",
      "Urgent intervention sequence",
      urgency + Math.max(0, 45 - timeToFailureDays) + authorityCarry(prior),
      [`Time-to-failure ${timeToFailureDays} days`, prior.conditionStatement],
      "The condition is inside the decision window.",
      "Select the first reversible intervention and define the escalation threshold now.",
    ),
  ]);
  const primary = patterns[0]!;

  return assembleLayer({
    layer: "executive",
    conditionStatement: `Executive decision position: ${primary.label}.`,
    state: {
      label: primary.label,
      dimensions: {
        consequenceExposure: Math.round(exposure),
        wrongActionCost: Math.round(wrongActionCost),
        timeToFailureDays,
        urgency,
        decisionOwnershipClarity: ownership,
      },
      severity,
    },
    tensions: [
      {
        id: "diagnosis_vs_decision_authority",
        label: "Diagnosis now requires owner-level decision authority",
        evidence: [primary.evidence[0] ?? primary.label, prior.conditionStatement],
        severity,
        escalatesFrom: "enterprise",
      },
    ],
    patternScores: patterns,
    consequence: {
      statement: `${primary.consequence} Exposure: ${formatCurrency(
        exposure,
      )}; wrong-action risk: ${formatCurrency(wrongActionCost)}.`,
      decisionPressure: severity,
      escalationMeaning:
        "The system has moved from diagnosis into priced decision authority.",
    },
    action: {
      directive: primary.action,
      owner: "Executive decision owner",
      firstMove:
        "Choose the first intervention sequence and state the cost of not acting.",
      escalationThreshold:
        "Escalate further if ownership remains unclear or the decision window narrows below 30 days.",
    },
    evidence: primary.evidence,
    consumedPriorSignals: [prior.conditionStatement],
  });
}

function assembleLayer(
  layer: Omit<LayerIntelligenceResult, "primaryPattern" | "secondaryPattern">,
): LayerIntelligenceResult {
  const patternScores = rankPatterns(layer.patternScores);
  return {
    ...layer,
    patternScores,
    primaryPattern: patternScores[0]!,
    secondaryPattern: patternScores[1] ?? null,
  };
}

function pattern(
  id: string,
  label: string,
  score: number,
  evidence: string[],
  consequence: string,
  action: string,
): LayerPatternScore {
  return {
    id,
    label,
    score: Math.round(clamp(score)),
    evidence,
    consequence,
    action,
  };
}

function rankPatterns(patterns: LayerPatternScore[]): LayerPatternScore[] {
  return [...patterns].sort((a, b) =>
    b.score === a.score ? a.id.localeCompare(b.id) : b.score - a.score,
  );
}

function authorityCarry(prior: LayerIntelligenceResult): number {
  return prior.primaryPattern.id.includes("authority") ||
    prior.conditionStatement.toLowerCase().includes("authority")
    ? 18
    : 0;
}

function severityFromDeficit(value: number): DiagnosticSeverity {
  if (value >= 120) return "critical";
  if (value >= 65) return "high";
  if (value >= 40) return "moderate";
  return "low";
}

function toSeverity(value: string): DiagnosticSeverity {
  const normalised = value.toLowerCase();
  if (normalised === "critical") return "critical";
  if (normalised === "high") return "high";
  if (normalised === "low") return "low";
  return "moderate";
}

function urgencyFromTime(days: number): number {
  if (days <= 14) return 95;
  if (days <= 30) return 80;
  if (days <= 60) return 65;
  if (days <= 90) return 45;
  return 25;
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_SCORE;
  return Math.max(0, Math.min(100, value));
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(Math.max(0, value));
}
