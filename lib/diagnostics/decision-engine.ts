import type { PurposeAlignmentContext, PurposeProfileResult } from "@/lib/alignment/types";
import type {
  ConstitutionalDecision,
  AuthorityType,
  OrgPosture,
  ReadinessTier,
} from "@/lib/constitution/rules";

export type DecisionConfidence = "low" | "medium" | "high";

export type DecisionEvidence = {
  signal: string;
  label: string;
  summary: string;
  severity: number;
};

export type DecisionObject = {
  condition: string;
  evidence: DecisionEvidence[];
  decision: string;
  consequence: string;
  action: string;
  signalStrength: DecisionConfidence;
  confidence: DecisionConfidence;
  signalStrengthDisclosure: string;
};

export type DecisionSignal = {
  id: string;
  label: string;
  summary: string;
  severity: number;
  weight?: number;
};

type DecisionArchetype = {
  id: string;
  decision: string;
  defaultConsequence: string;
  defaultAction: string;
};

const ARCHETYPES: Record<string, DecisionArchetype> = {
  mandate_vacuum: {
    id: "mandate_vacuum",
    decision: "Define authority versus delay",
    defaultConsequence:
      "Authority remains ambiguous, so delay will be mistaken for caution and structural drift will continue.",
    defaultAction:
      "Name the decision owner explicitly and write the decision boundary in one sentence.",
  },
  reactive_decision_pattern: {
    id: "reactive_decision_pattern",
    decision: "Commit versus defer",
    defaultConsequence:
      "Pressure will keep setting the sequence, and decisions will remain reactive rather than governed.",
    defaultAction:
      "Choose the decision that has been deferred and force a dated commitment point.",
  },
  structural_inconsistency: {
    id: "structural_inconsistency",
    decision: "Standardise versus fragment",
    defaultConsequence:
      "Different parts of the system will keep operating from different rules, which compounds execution error.",
    defaultAction:
      "Standardise the rule, ownership, or operating cadence at the point where divergence is highest.",
  },
  trust_asymmetry: {
    id: "trust_asymmetry",
    decision: "Centralise trust repair versus distribute assumptions",
    defaultConsequence:
      "Signal quality will keep degrading, and the system will continue acting on beliefs the operating layer does not share.",
    defaultAction:
      "Create one direct signal-recovery path and use it before further escalation.",
  },
  execution_drift: {
    id: "execution_drift",
    decision: "Stabilise ownership versus absorb drift",
    defaultConsequence:
      "Motion will continue without alignment, and variance will harden into operating normality.",
    defaultAction:
      "Tie one measurable outcome to one owner and remove ambiguity around who moves first.",
  },
  governance_failure: {
    id: "governance_failure",
    decision: "Rebuild governance versus absorb friction",
    defaultConsequence:
      "Governance drag will keep turning decision-making into political negotiation rather than ordered execution.",
    defaultAction:
      "Map decision rights for the last few material decisions and correct the first repeated break.",
  },
};

const SIGNAL_TO_ARCHETYPE: Record<string, string> = {
  mandate_vacuum: "mandate_vacuum",
  authority_conflict: "mandate_vacuum",
  authority_gap: "mandate_vacuum",
  reactive_decision_pattern: "reactive_decision_pattern",
  pressure_override: "reactive_decision_pattern",
  structural_inconsistency: "structural_inconsistency",
  distributed_drift: "structural_inconsistency",
  governance_failure: "governance_failure",
  governance_drag: "governance_failure",
  trust_asymmetry: "trust_asymmetry",
  trust_gap: "trust_asymmetry",
  signal_failure: "trust_asymmetry",
  execution_drift: "execution_drift",
  dependency_lock: "execution_drift",
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function toConfidence(score: number): DecisionConfidence {
  if (score >= 72) return "high";
  if (score >= 42) return "medium";
  return "low";
}

function resolveArchetype(signals: DecisionSignal[]): DecisionArchetype {
  const scores = new Map<string, number>();

  for (const signal of signals) {
    const archetypeId = SIGNAL_TO_ARCHETYPE[signal.id] ?? "structural_inconsistency";
    const weighted = signal.severity * (signal.weight ?? 1);
    scores.set(archetypeId, (scores.get(archetypeId) ?? 0) + weighted);
  }

  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const [winner] = ranked[0] ?? ["structural_inconsistency", 1];
  return ARCHETYPES[winner] ?? ARCHETYPES["structural_inconsistency"]!;
}

export function buildDecisionObjectFromSignals(input: {
  condition: string;
  signals: DecisionSignal[];
  decision?: string;
  consequence?: string;
  action?: string;
}): DecisionObject {
  const evidence = [...input.signals]
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 3)
    .map((signal) => ({
      signal: signal.id,
      label: signal.label,
      summary: signal.summary,
      severity: signal.severity,
    }));

  const archetype = resolveArchetype(input.signals);
  const severities = input.signals.map((signal) => signal.severity);
  const total = severities.reduce((sum, value) => sum + value, 0);
  const strongest = Math.max(...severities, 0);
  const variance =
    severities.length > 1
      ? average(severities.map((value) => Math.abs(value - average(severities))))
      : 0;
  const consistencyScore = clamp(strongest * 14 + total * 3 - variance * 8, 0, 100);

  return {
    condition: input.condition,
    evidence,
    decision: input.decision ?? archetype.decision,
    consequence: input.consequence ?? archetype.defaultConsequence,
    action: input.action ?? archetype.defaultAction,
    signalStrength: toConfidence(consistencyScore),
    confidence: toConfidence(consistencyScore),
    signalStrengthDisclosure:
      "This is a diagnostic signal strength based on response consistency, not a statistical prediction.",
  };
}

export type TeamGapInput = {
  domain: string;
  label: string;
  leaderPct: number;
  realityPct: number;
  gap: number;
  gapSeverity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
};

export type TeamDecisionResult = {
  title: string;
  pattern: string;
  urgentDomain: string | null;
  firstAction: string;
  escalationNote: string;
  route: "ENTERPRISE" | "STRATEGY_ROOM" | "WATCH";
  decisionObject: DecisionObject;
};

export function buildTeamDecisionResult(input: {
  gaps: TeamGapInput[];
  overallLeader: number;
  overallReality: number;
  purposePct: number | null;
  confidenceBaseline?: number | null;
  falseAssumption?: string | null;
  showScoresReaction?: string | null;
}): TeamDecisionResult {
  const overallGap = input.overallLeader - input.overallReality;
  const criticalGaps = input.gaps.filter((gap) => gap.gapSeverity === "CRITICAL");
  const highGaps = input.gaps.filter((gap) => gap.gapSeverity === "HIGH");
  const largestGap = [...input.gaps].sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))[0];
  const trustGap = input.gaps.find((gap) => gap.domain === "trust");
  const authorityGap = input.gaps.find((gap) => gap.domain === "authority");
  const executionGap = input.gaps.find((gap) => gap.domain === "execution");
  const confidenceGap =
    input.confidenceBaseline !== null && input.confidenceBaseline !== undefined
      ? input.confidenceBaseline - Math.abs(overallGap)
      : null;

  const signals: DecisionSignal[] = [];
  let title = "";
  let pattern = "";
  let firstAction = "";
  let escalationNote = "";
  let route: TeamDecisionResult["route"] = "WATCH";
  let decisionOverride = "";

  if (criticalGaps.length >= 2) {
    title = "Systemic coherence strain";
    pattern =
      `${criticalGaps.length} domains show critical divergence between leadership and estimated team reality. The team is not operating from the same map leadership believes it is.`;
    firstAction =
      "Gather direct, individual signal from 3-5 people before further intervention and compare it to the current leadership reading.";
    escalationNote =
      "The gap is too distributed for local correction alone. The next useful layer is enterprise validation.";
    route = "ENTERPRISE";
    decisionOverride = "Standardise versus fragment";
    signals.push({
      id: "structural_inconsistency",
      label: "Distributed team divergence",
      summary: `Critical gaps across ${criticalGaps.map((gap) => gap.label).join(", ")}.`,
      severity: 9,
      weight: 1.3,
    });
  } else if ((trustGap?.gap ?? 0) >= 20) {
    title = "Trust no longer load-bearing";
    pattern =
      `Trust divergence is ${trustGap?.gap ?? 0} points. Leadership and team reality are no longer operating from the same signal quality.`;
    firstAction =
      "Recover direct signal before trying to correct execution. One-to-one truth gathering matters more than another team meeting.";
    escalationNote =
      "If this trust break is repeated outside one team, treat it as a structural condition rather than a local sentiment issue.";
    route = criticalGaps.length >= 1 ? "ENTERPRISE" : "WATCH";
    decisionOverride = "Centralise trust repair versus distribute assumptions";
    signals.push({
      id: "trust_asymmetry",
      label: "Trust asymmetry",
      summary: `Trust gap of ${trustGap?.gap ?? 0} points between leadership and estimated team reality.`,
      severity: 8,
      weight: 1.25,
    });
  } else if ((authorityGap?.gap ?? 0) >= 20) {
    title = "Authority not sufficiently ordered";
    pattern =
      `Authority divergence is ${authorityGap?.gap ?? 0} points. Leadership assumes clarity that the team does not actually experience.`;
    firstAction =
      "Map the last ten real decisions and compare formal decision rights to how the team experienced them.";
    escalationNote =
      "If this authority mismatch is not corrected quickly, it hardens into recurring governance friction.";
    route = "WATCH";
    decisionOverride = "Define authority versus delay";
    signals.push({
      id: "mandate_vacuum",
      label: "Authority gap",
      summary: `Authority domain diverges by ${authorityGap?.gap ?? 0} points.`,
      severity: 8,
      weight: 1.2,
    });
  } else if ((executionGap?.gap ?? 0) >= 20) {
    title = "Motion without alignment";
    pattern =
      `Execution divergence is ${executionGap?.gap ?? 0} points. The team is carrying activity, but not in a way that faithfully reflects declared priorities.`;
    firstAction =
      "Tie one measurable outcome to one named owner for the next two weeks and review where translation from priority to work breaks.";
    escalationNote =
      "This remains correctable locally until the same drift begins to affect multiple teams or risk posture.";
    route = "WATCH";
    decisionOverride = "Commit versus defer";
    signals.push({
      id: "execution_drift",
      label: "Execution drift",
      summary: `Execution domain diverges by ${executionGap?.gap ?? 0} points.`,
      severity: 7,
      weight: 1.15,
    });
  } else if (overallGap <= -15) {
    title = "Readiness suppressed by deflation";
    pattern =
      "The team is scoring itself materially lower than leadership expects. This points to under-loaded confidence or learned dependency rather than simple overconfidence.";
    firstAction =
      "Use specific evidence of good execution to correct deflation. Generic reassurance will not change the condition.";
    escalationNote =
      "Monitor whether this is contained. Escalate if the same deflation appears across multiple teams.";
    route = "WATCH";
    decisionOverride = "Commit versus defer";
    signals.push({
      id: "reactive_decision_pattern",
      label: "Suppressed readiness",
      summary: "The team's assumed self-reading is materially lower than leadership expectation.",
      severity: 5,
    });
  } else if (overallGap >= 5 && criticalGaps.length === 0 && highGaps.length <= 1) {
    title = "Manageable variance under watch";
    pattern =
      `The overall gap of ${overallGap} points remains inside manageable variance, but the exposed domain still needs monitoring.`;
    firstAction =
      "Repeat the same structured check after a period of pressure or change and track whether the gap narrows or widens.";
    escalationNote =
      "Escalate when variance widens or begins to affect more than one operating domain.";
    route = "WATCH";
    decisionOverride = "Commit versus defer";
    signals.push({
      id: "reactive_decision_pattern",
      label: "Watch variance",
      summary: `Overall gap is ${overallGap} points and does not yet indicate structural failure.`,
      severity: 3,
    });
  } else {
    title = "Coherent team signal";
    pattern =
      "Leadership and estimated team reality are close enough that the current team signal remains usable. The question is whether that holds under pressure.";
    firstAction =
      "Stress-test the same team under change or constraint before declaring the condition stable.";
    escalationNote =
      "Escalation is optional here. Use it when you need to know whether the wider organisation is carrying the same coherence.";
    route = "WATCH";
    decisionOverride = "Commit versus defer";
    signals.push({
      id: "reactive_decision_pattern",
      label: "Coherent but untested",
      summary: "The team signal is coherent enough to self-correct unless pressure reveals otherwise.",
      severity: 2,
    });
  }

  if (input.falseAssumption?.trim()) {
    signals.push({
      id: "trust_asymmetry",
      label: "Leadership false assumption",
      summary: `Named false assumption: ${input.falseAssumption.trim()}`,
      severity: 6,
    });
  }

  if (confidenceGap !== null && confidenceGap < -10) {
    signals.push({
      id: "structural_inconsistency",
      label: "Confidence mismatch",
      summary: `Confidence baseline overstated the measured team gap by ${Math.abs(Math.round(confidenceGap))} points.`,
      severity: 6,
    });
  }

  if (input.showScoresReaction?.trim()) {
    signals.push({
      id: "trust_asymmetry",
      label: "Political sensitivity",
      summary: `Reaction to visibility: ${input.showScoresReaction.trim()}`,
      severity: 5,
    });
  }

  if (input.purposePct !== null) {
    pattern +=
      input.purposePct >= 62
        ? ` Purpose Alignment is ${input.purposePct}%, which suggests the problem is transmission rather than personal clarity.`
        : ` Purpose Alignment is ${input.purposePct}%, which indicates personal drift may also be contributing to the team condition.`;
  }

  return {
    title,
    pattern,
    urgentDomain: largestGap && Math.abs(largestGap.gap) >= 10 ? largestGap.label : null,
    firstAction,
    escalationNote,
    route,
    decisionObject: buildDecisionObjectFromSignals({
      condition: title,
      signals,
      decision: decisionOverride,
      consequence: escalationNote,
      action: firstAction,
    }),
  };
}

export type EnterpriseSectionScore = {
  id: string;
  title: string;
  pct: number;
};

export type EnterpriseDecisionSignal = {
  clarityScore: number;
  structuralRisk: number;
  signalStrength: number;
};

export type EnterpriseDecisionResult = {
  band: string;
  patternTitle: string;
  primaryReading: string;
  dominantFailure: string | null;
  firstAction: string;
  escalationNote: string;
  route: "EXECUTIVE_REPORTING" | "STRATEGY_ROOM" | "WATCH";
  decisionSignal: EnterpriseDecisionSignal;
  decisionObject: DecisionObject;
};

export function buildEnterpriseDecisionResult(input: {
  totalPct: number;
  sections: EnterpriseSectionScore[];
  teamAlignmentPct: number | null;
  recentDecision: string;
}): EnterpriseDecisionResult {
  const scoreMap = Object.fromEntries(input.sections.map((section) => [section.id, section.pct])) as Record<string, number>;
  const leadership = scoreMap["leadership"] ?? 0;
  const governance = scoreMap["governance"] ?? 0;
  const execution = scoreMap["execution"] ?? 0;
  const risk = scoreMap["risk"] ?? 0;
  const weakest = [...input.sections].sort((a, b) => a.pct - b.pct)[0];
  const band =
    input.totalPct >= 80 ? "STABLE" :
    input.totalPct >= 60 ? "WATCH" :
    input.totalPct >= 40 ? "FRAGILE" :
    "ESCALATE";
  const decisionSignal: EnterpriseDecisionSignal = {
    clarityScore: clamp(leadership, 0, 100),
    structuralRisk: clamp(Math.round(100 - input.totalPct + (100 - governance) * 0.35), 0, 100),
    signalStrength: clamp(Math.round((leadership + governance + execution + (100 - risk)) / 4), 0, 100),
  };

  const signals: DecisionSignal[] = [];
  let patternTitle = "";
  let primaryReading = "";
  let firstAction = "";
  let escalationNote = "";
  let route: EnterpriseDecisionResult["route"] = "WATCH";
  let dominantFailure: string | null = weakest && weakest.pct < 40 ? weakest.title : null;
  let decisionOverride = "";

  if (band === "ESCALATE" || (leadership < 50 && governance < 50 && execution < 50 && risk < 50)) {
    patternTitle = "Distributed constitutional strain";
    primaryReading =
      "Leadership, governance, execution, and risk posture are all below threshold together. This is distributed institutional strain, not an isolated operating defect.";
    firstAction =
      "Pause discretionary strategic work and identify the few decisions that must not proceed until consequence is governed.";
    escalationNote =
      "Executive Reporting should come before intervention sequencing. The condition is already wide enough that ungoverned correction will compound it.";
    route = "EXECUTIVE_REPORTING";
    decisionOverride = "Standardise versus fragment";
    signals.push({
      id: "structural_inconsistency",
      label: "Distributed institutional strain",
      summary: "All major enterprise sections are below threshold at once.",
      severity: 9,
      weight: 1.35,
    });
  } else if (leadership < 50 && governance < 50) {
    patternTitle = "Authority and governance out of order";
    primaryReading =
      "Authority signal and governance reliability are both weak. The institution is moving without a stable governing frame.";
    firstAction =
      "Map the last few material decisions and compare formal governance to how those decisions were actually made.";
    escalationNote =
      "Executive Reporting is needed to determine whether this is executive incoherence, governance failure, or both.";
    route = "EXECUTIVE_REPORTING";
    decisionOverride = "Define authority versus delay";
    signals.push({
      id: "mandate_vacuum",
      label: "Authority and governance gap",
      summary: `Leadership is ${leadership}% and governance is ${governance}%.`,
      severity: 8,
      weight: 1.25,
    });
    signals.push({
      id: "governance_failure",
      label: "Governance no longer load-bearing",
      summary: "Formal governance is not carrying decision order effectively.",
      severity: 7,
    });
  } else if (execution < 50 && risk < 50) {
    patternTitle = "Execution drift under rising pressure";
    primaryReading =
      "Execution consistency and risk posture are both weak, which means pressure is no longer being translated into ordered action.";
    firstAction =
      "Map the highest-variance operating points and tie each to a named decision owner before more pressure accumulates.";
    escalationNote =
      "Executive Reporting will turn this strain into a governed priority stack before pressure takes over sequencing.";
    route = "EXECUTIVE_REPORTING";
    decisionOverride = "Commit versus defer";
    signals.push({
      id: "execution_drift",
      label: "Execution drift under pressure",
      summary: `Execution is ${execution}% and risk posture is ${risk}%.`,
      severity: 8,
      weight: 1.2,
    });
  } else if (leadership < 45) {
    patternTitle = "Leadership signal no longer coherent";
    primaryReading =
      "The executive layer is no longer carrying common judgment strongly enough for the institution to move cleanly.";
    firstAction =
      "Test the few core beliefs leadership holds about the current condition and locate where those beliefs diverge.";
    escalationNote =
      "The next layer should read the leadership condition directly before wider intervention is chosen.";
    route = input.totalPct >= 60 ? "WATCH" : "EXECUTIVE_REPORTING";
    decisionOverride = "Define authority versus delay";
    signals.push({
      id: "mandate_vacuum",
      label: "Leadership coherence weak",
      summary: `Leadership coherence is ${leadership}%.`,
      severity: 7,
    });
  } else if (governance < 45) {
    patternTitle = "Governance no longer carrying order";
    primaryReading =
      "Decision rights and escalation lanes are no longer ordered enough to carry the institution cleanly.";
    firstAction =
      "Map the top classes of institutional decision and force agreement on who decides, who is consulted, and who is informed.";
    escalationNote =
      "Executive Reporting is the next layer when governance reconstruction may be required.";
    route = input.totalPct >= 65 ? "WATCH" : "EXECUTIVE_REPORTING";
    decisionOverride = "Rebuild governance versus absorb friction";
    signals.push({
      id: "governance_failure",
      label: "Governance failure",
      summary: `Governance reliability is ${governance}%.`,
      severity: 7,
      weight: 1.15,
    });
  } else if (execution < 45) {
    patternTitle = "Operating layer drifting from intent";
    primaryReading =
      "There is still some order at the top, but that order is not reaching the operating layer in a stable form.";
    firstAction =
      "Run a focused diagnostic in the highest-variance operating unit and locate where priority translation is failing.";
    escalationNote =
      "Executive Reporting is warranted if this drift is repeated across units or begins to change risk posture.";
    route = "WATCH";
    decisionOverride = "Stabilise ownership versus absorb drift";
    signals.push({
      id: "execution_drift",
      label: "Operating drift",
      summary: `Execution consistency is ${execution}%.`,
      severity: 6,
    });
  } else if (risk < 45) {
    patternTitle = "Risk posture no longer stable";
    primaryReading =
      "The institution is losing room to correct cleanly. Delay is now altering consequence faster than before.";
    firstAction =
      "Define the concrete cost of inaction over the next 90 days instead of using abstract risk language.";
    escalationNote =
      "Executive Reporting is the next layer when consequence must be governed before pressure takes over sequencing.";
    route = input.totalPct >= 70 ? "WATCH" : "EXECUTIVE_REPORTING";
    decisionOverride = "Commit versus defer";
    signals.push({
      id: "reactive_decision_pattern",
      label: "Risk posture weakening",
      summary: `Risk posture is ${risk}%.`,
      severity: 6,
    });
  } else if (band === "STABLE") {
    patternTitle = "Institutional posture remains ordered";
    primaryReading =
      "Leadership, governance, execution, and risk posture are all above threshold. The institution is currently ordered enough to correct without distortion.";
    firstAction =
      "Stress-test the conditions under which this coherence would degrade, rather than escalating immediately.";
    escalationNote =
      "Executive Reporting is optional here and should be used for governed planning rather than crisis correction.";
    route = "WATCH";
    decisionOverride = "Commit versus defer";
    signals.push({
      id: "reactive_decision_pattern",
      label: "Ordered but untested",
      summary: "The institution is stable now, but this has not yet been tested under heavier pressure.",
      severity: 2,
    });
  } else {
    patternTitle = "Watch condition under moderate strain";
    primaryReading =
      "No single domain has fully failed, but enough friction exists that low-grade disorder could be normalized if ignored.";
    firstAction =
      "Name the highest-strain area and assign an owner for correcting it before it spreads.";
    escalationNote =
      "Escalate when the condition begins to alter consequence or repeats across domains.";
    route = "WATCH";
    decisionOverride = "Commit versus defer";
    signals.push({
      id: "reactive_decision_pattern",
      label: "Moderate enterprise strain",
      summary: `Enterprise band is ${band} at ${input.totalPct}%.`,
      severity: 4,
    });
  }

  if (input.teamAlignmentPct !== null && input.teamAlignmentPct < 60) {
    signals.push({
      id: "structural_inconsistency",
      label: "Cross-layer misalignment",
      summary: `Team alignment reading of ${input.teamAlignmentPct}% compounds the enterprise signal.`,
      severity: 6,
    });
    primaryReading += ` Team alignment at ${input.teamAlignmentPct}% compounds this enterprise reading — the same strain is visible across layers.`;
  }

  return {
    band,
    patternTitle,
    primaryReading,
    dominantFailure,
    firstAction,
    escalationNote,
    route,
    decisionSignal,
    decisionObject: buildDecisionObjectFromSignals({
      condition: patternTitle,
      signals,
      decision: decisionOverride,
      consequence: escalationNote,
      action: firstAction,
    }),
  };
}

export type ConstitutionalDecisionScores = {
  authority: number;
  coherence: number;
  trust: number;
  pressure: number;
  friction: number;
  seriousness: number;
  governance: number;
  narrative: number;
  interventionReadiness: number;
  severity: number;
  failureModeCount: number;
  authorityType: AuthorityType;
  posture: OrgPosture;
  readinessTier: ReadinessTier;
};

export function buildConstitutionalDecisionObject(input: {
  decision: ConstitutionalDecision;
  scores: ConstitutionalDecisionScores;
  reflections?: {
    structuralProblem?: string | null;
    priorAttempts?: string | null;
    shadowAuthority?: string | null;
  } | null;
}): DecisionObject {
  const signals: DecisionSignal[] = [];

  if (input.scores.authorityType !== "DIRECT" || input.scores.authority < 50) {
    signals.push({
      id: "mandate_vacuum",
      label: "Authority not sufficiently ordered",
      summary: `Authority type is ${input.scores.authorityType.toLowerCase()} with an authority score of ${input.scores.authority}%.`,
      severity: input.scores.authority < 35 ? 9 : 7,
    });
  }

  if (input.scores.governance < 50 || input.decision.disqualifiersTriggered.some((item) => /governance|failure/i.test(item))) {
    signals.push({
      id: "governance_failure",
      label: "Governance weakness",
      summary: `Governance reliability is ${input.scores.governance}%.`,
      severity: input.scores.governance < 35 ? 8 : 6,
    });
  }

  if (input.scores.trust < 50) {
    signals.push({
      id: "trust_asymmetry",
      label: "Trust weakness",
      summary: `Trust condition is ${input.scores.trust}%.`,
      severity: input.scores.trust < 35 ? 7 : 5,
    });
  }

  if (input.scores.coherence < 50 || input.scores.friction >= 60) {
    signals.push({
      id: "structural_inconsistency",
      label: "Structural inconsistency",
      summary: `Coherence is ${input.scores.coherence}% with friction at ${input.scores.friction}%.`,
      severity: input.scores.coherence < 35 || input.scores.friction >= 75 ? 8 : 6,
    });
  }

  if (input.reflections?.shadowAuthority?.trim()) {
    signals.push({
      id: "mandate_vacuum",
      label: "Shadow authority",
      summary: `Shadow authority reported: ${input.reflections.shadowAuthority.trim()}`,
      severity: 8,
      weight: 1.3,
    });
  }

  const condition =
    input.decision.route === "STRATEGY"
      ? "Execution-ready constitutional condition"
      : input.decision.route === "DIAGNOSTIC"
        ? "Constitutional weakness requires governed clarification"
        : "Constitutional signal below escalation threshold";

  const action =
    input.decision.recommendedInterventions[0] ??
    "Clarify authority, governance, and the first constitutional correction before escalation.";
  const consequence =
    input.decision.rationale[0] ??
    "Without constitutional clarification, later decisions will be made on unstable structure.";

  return buildDecisionObjectFromSignals({
    condition,
    signals,
    decision:
      input.decision.route === "STRATEGY"
        ? "Commit to intervention versus defer correction"
        : "Define authority versus delay",
    consequence,
    action,
  });
}

export function buildPurposeDecisionObject(input: {
  result: PurposeProfileResult;
  context?: PurposeAlignmentContext | null;
}): DecisionObject {
  const result = input.result;
  const reflections = input.context?.reflections ?? null;
  const signals: DecisionSignal[] = [];

  for (const contradiction of result.contradictions ?? []) {
    signals.push({
      id:
        contradiction.type === "false_alignment"
          ? "reactive_decision_pattern"
          : contradiction.type.includes("variance") || contradiction.type.includes("weak")
            ? "structural_inconsistency"
            : contradiction.type === "acknowledged_failure"
              ? "reactive_decision_pattern"
              : "mandate_vacuum",
      label: contradiction.type.replace(/_/g, " "),
      summary: contradiction.evidence,
      severity:
        contradiction.severity === "critical" ? 9 :
        contradiction.severity === "high" ? 7 :
        contradiction.severity === "medium" ? 5 : 3,
    });
  }

  const weak = result.evidence?.sharpestWeakSignal;
  if (weak) {
    signals.push({
      id:
        weak.domain === "identity"
          ? "mandate_vacuum"
          : weak.domain === "decision"
            ? "reactive_decision_pattern"
            : "structural_inconsistency",
      label: `${weak.domain} weak signal`,
      summary: `${weak.statement} (${weak.resonance}/10 resonance, ${weak.certainty}/10 certainty).`,
      severity: 6,
    });
  }

  if (reflections?.dissenter?.trim()) {
    signals.push({
      id: "trust_asymmetry",
      label: "Dissenting evidence",
      summary: reflections.dissenter.trim(),
      severity: 5,
    });
  }

  return buildDecisionObjectFromSignals({
    condition: result.primaryPattern?.label ?? result.coherenceBand,
    signals,
    decision:
      reflections?.avoidedDecision?.trim()
        ? reflections.avoidedDecision.trim()
        : undefined,
    consequence:
      result.consequenceLogic ??
      result.primaryPattern?.consequence ??
      "The same pattern will keep shaping decisions until it is made explicit.",
    action:
      result.firstAction ??
      result.primaryPattern?.firstAction ??
      "Name the avoided decision and correct the first contradiction directly.",
  });
}
