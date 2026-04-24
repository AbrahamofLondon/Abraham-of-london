import {
  ALIGNMENT_DOMAIN_LABELS,
  ALIGNMENT_DOMAIN_ORDER,
  PURPOSE_ALIGNMENT_QUESTIONS,
} from "./checklist";
import type {
  AlignmentContradiction,
  AlignmentDomain,
  CanonicalPurposeResponse,
  CoherenceBand,
  DiagnosticSeverity,
  DomainProfile,
  DomainState,
  DomainStateKind,
  DualAxisAnswer,
  DualAxisInput,
  EvidenceQuestion,
  PatternScore,
  PurposeAlignmentContext,
  PurposeAlignmentEvidence,
  PurposePatternId,
  PurposeProfileResult,
  PurposeReportNarrative,
  RoutingRecommendation,
} from "./types";

const QUESTION_BY_ID = new Map(PURPOSE_ALIGNMENT_QUESTIONS.map((q) => [q.id, q]));

function clampAxis(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(10, Math.round(value)));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function severityRank(severity: DiagnosticSeverity): number {
  return { low: 1, medium: 2, high: 3, critical: 4 }[severity];
}

function maxSeverity(...values: DiagnosticSeverity[]): DiagnosticSeverity {
  return values.sort((a, b) => severityRank(b) - severityRank(a))[0] ?? "low";
}

function getCoherenceBand(percent: number): CoherenceBand {
  // Calibrated for geometric mean scoring:
  // 10/10 both axes = 100, 8/8 = 80, 6/6 = 60, 4/4 = 40
  if (percent >= 78) return "SOVEREIGN";
  if (percent >= 58) return "ALIGNED";
  if (percent >= 38) return "DRIFTING";
  return "FRAGMENTED";
}

function evidenceQuestion(
  response: CanonicalPurposeResponse,
  evidenceType: EvidenceQuestion["evidenceType"],
): EvidenceQuestion {
  return {
    questionId: response.questionId,
    domain: response.domain,
    statement: response.statement,
    resonance: response.resonance,
    certainty: response.certainty,
    evidenceType,
  };
}

export function normalizePurposeResponses(
  input: DualAxisInput | { answers: Record<string, DualAxisAnswer | boolean> },
): CanonicalPurposeResponse[] {
  return PURPOSE_ALIGNMENT_QUESTIONS.map((question) => {
    const raw = input.answers[question.id];
    let answer: DualAxisAnswer;

    if (typeof raw === "boolean") {
      // Boolean true/false doesn't carry certainty information.
      // Use moderate certainty (5) rather than assuming high certainty (8).
      // True = somewhat resonant, moderately certain.
      // False = low resonance, slightly more certain (they know it doesn't fit).
      answer = raw
        ? { resonance: 7, certainty: 5 }
        : { resonance: 3, certainty: 6 };
    } else if (raw && typeof raw === "object") {
      answer = {
        resonance: clampAxis(raw.resonance),
        certainty: clampAxis(raw.certainty),
      };
    } else {
      answer = { resonance: 0, certainty: 0 };
    }

    return {
      questionId: question.id,
      domain: question.domain,
      statement: question.statement,
      resonance: answer.resonance,
      certainty: answer.certainty,
    };
  });
}

function domainSeverity(resonanceMean: number, certaintyMean: number, gap: number): DiagnosticSeverity {
  // Composite severity score using both axes + gap, then classify.
  // This eliminates 1-point threshold flips: resonance=2.5 vs 2.6 no longer
  // produces a 2-level severity jump.
  const dualScore = Math.sqrt(Math.max(0, resonanceMean * certaintyMean)) * 10; // 0-100
  const gapPenalty = Math.min(30, Math.abs(gap) * 5); // 0-30 penalty for axis divergence
  const severityScore = Math.max(0, 100 - dualScore - gapPenalty);

  // Smooth classification: 70+ = critical, 50-69 = high, 25-49 = medium, <25 = low
  if (severityScore >= 70) return "critical";
  if (severityScore >= 50) return "high";
  if (severityScore >= 25) return "medium";
  return "low";
}

function domainState(resonanceMean: number, certaintyMean: number, gap: number): DomainStateKind {
  if (resonanceMean >= 7.5 && certaintyMean >= 6.5) return "stable_strength";
  if (resonanceMean >= 7 && certaintyMean <= 4.5) return "compensating_strength";
  if (Math.abs(gap) >= 4 || (resonanceMean <= 4 && certaintyMean >= 7)) return "contradiction";
  if (resonanceMean < 5) return "low_alignment";
  if (certaintyMean < 5) return "low_confidence";
  return "mixed";
}

export function buildDomainStates(responses: CanonicalPurposeResponse[]): DomainState[] {
  return ALIGNMENT_DOMAIN_ORDER.map((domain) => {
    const domainResponses = responses.filter((response) => response.domain === domain);
    const resonanceMean = round1(
      domainResponses.reduce((sum, response) => sum + response.resonance, 0) /
        Math.max(1, domainResponses.length),
    );
    const certaintyMean = round1(
      domainResponses.reduce((sum, response) => sum + response.certainty, 0) /
        Math.max(1, domainResponses.length),
    );
    const confidenceGap = round1(resonanceMean - certaintyMean);
    // Geometric mean: both axes must be present for a strong score.
    // R=7,C=2 → 37 (low certainty drags down). R=7,C=8 → 75 (both present).
    const alignmentScore = Math.round(Math.sqrt(Math.max(0, resonanceMean * certaintyMean)) * 10);
    const severity = domainSeverity(resonanceMean, certaintyMean, confidenceGap);
    const state = domainState(resonanceMean, certaintyMean, confidenceGap);
    const weakest = [...domainResponses].sort((a, b) => a.resonance - b.resonance)[0];
    const strongest = [...domainResponses].sort((a, b) => b.resonance - a.resonance)[0];
    const contradiction = [...domainResponses].sort(
      (a, b) => Math.abs(b.resonance - b.certainty) - Math.abs(a.resonance - a.certainty),
    )[0];

    return {
      domain,
      label: ALIGNMENT_DOMAIN_LABELS[domain],
      resonanceMean,
      certaintyMean,
      alignmentScore,
      confidenceGap,
      severity,
      state,
      evidenceQuestions: [
        weakest ? evidenceQuestion(weakest, "weak") : null,
        strongest && strongest.questionId !== weakest?.questionId
          ? evidenceQuestion(strongest, "strong")
          : null,
        contradiction && Math.abs(contradiction.resonance - contradiction.certainty) >= 4
          ? evidenceQuestion(contradiction, "contradiction")
          : null,
      ].filter(Boolean) as EvidenceQuestion[],
    };
  });
}

function byDomain(states: DomainState[], domain: AlignmentDomain): DomainState {
  const found = states.find((state) => state.domain === domain);
  if (!found) throw new Error(`Missing domain state: ${domain}`);
  return found;
}

function contradiction(
  type: AlignmentContradiction["type"],
  severity: DiagnosticSeverity,
  domains: AlignmentDomain[],
  evidence: string,
): AlignmentContradiction {
  return { type, severity, domains, evidence };
}

export function detectPurposeContradictions(
  domainStates: DomainState[],
  responses: CanonicalPurposeResponse[],
): AlignmentContradiction[] {
  const out: AlignmentContradiction[] = [];
  const state = (domain: AlignmentDomain) => byDomain(domainStates, domain);
  const pcts = domainStates.map((item) => item.alignmentScore);
  const spread = Math.max(...pcts) - Math.min(...pcts);
  const lowCount = domainStates.filter((item) => item.alignmentScore < 50).length;
  const medianishCount = domainStates.filter(
    (item) => item.alignmentScore >= 40 && item.alignmentScore <= 62,
  ).length;

  if (responses.some((response) => response.resonance >= 7 && response.certainty <= 4)) {
    out.push(
      contradiction(
        "false_alignment",
        "high",
        ["identity", "decision"],
        "High stated alignment appears with low certainty, indicating confidence has not caught up with the claim.",
      ),
    );
  }

  if (responses.some((response) => response.resonance <= 3 && response.certainty >= 7)) {
    out.push(
      contradiction(
        "acknowledged_failure",
        "high",
        ["identity", "decision"],
        "Low alignment appears with high certainty, indicating a known failure rather than an unseen weakness.",
      ),
    );
  }

  if (state("identity").alignmentScore >= 70 && state("decision").alignmentScore < 50) {
    out.push(contradiction("identity_strong_decision_weak", "high", ["identity", "decision"], "Identity is materially stronger than the decisions being made under pressure."));
  }
  if (state("decision").alignmentScore >= 70 && state("behaviour").alignmentScore < 50) {
    out.push(contradiction("decision_strong_behaviour_weak", "medium", ["decision", "behaviour"], "Decision logic is clearer than the daily operating evidence."));
  }
  if (state("behaviour").alignmentScore >= 70 && state("legacy").alignmentScore < 50) {
    out.push(contradiction("behaviour_strong_legacy_weak", "medium", ["behaviour", "legacy"], "Activity is present, but it is not clearly compounding into a durable structure."));
  }
  if (state("environment").alignmentScore < 50 && state("behaviour").alignmentScore < 55) {
    out.push(contradiction("environment_weak_behaviour_weak", "high", ["environment", "behaviour"], "The environment is weak and the behavioural evidence is already degrading."));
  }
  if (state("emotional_order").alignmentScore < 50 && state("decision").alignmentScore < 55) {
    out.push(contradiction("emotional_weak_decision_weak", "high", ["emotional_order", "decision"], "Internal order is weak enough to distort decision quality under pressure."));
  }
  if (state("legacy").alignmentScore >= 70 && state("behaviour").alignmentScore < 50) {
    out.push(contradiction("legacy_strong_execution_weak", "medium", ["legacy", "behaviour"], "Long-horizon intention is stronger than the current execution system."));
  }
  const globallyLowConsistent = lowCount >= 5 && spread <= 18;
  if (globallyLowConsistent) {
    out.push(contradiction("globally_low_consistent", "critical", ALIGNMENT_DOMAIN_ORDER, "Most domains are low without a single dominant fracture, indicating broad systemic depletion."));
  }
  if (spread >= 40) {
    out.push(contradiction("high_variance_split", "high", ALIGNMENT_DOMAIN_ORDER, "The profile contains strong and weak domains far enough apart to make alignment situational rather than structural."));
  } else if (!globallyLowConsistent && medianishCount >= 4 && lowCount >= 2) {
    out.push(contradiction("globally_low_consistent", "medium", ALIGNMENT_DOMAIN_ORDER, "Several domains are mediocre together, indicating distributed drift rather than a single isolated weakness."));
  }

  return out;
}

const PATTERN_COPY: Record<PurposePatternId, {
  label: string;
  consequence: string;
  firstAction: string;
}> = {
  mandate_fracture: {
    label: "Mandate fracture",
    consequence: "Without a stable mandate, time and commitments will continue to be governed by proximity, pressure, and borrowed expectations.",
    firstAction: "Write the mandate your last 30 days actually prove. Then cancel, defer, or renegotiate one commitment that directly contradicts it.",
  },
  pressure_override: {
    label: "Pressure override",
    consequence: "The person is not directionless; the issue is that pressure is overruling principle at the moment decisions become expensive.",
    firstAction: "List the last five pressure decisions. Mark each as principle-led or pressure-led, then define the rule that would have prevented the weakest one.",
  },
  environmental_drag: {
    label: "Environmental drag",
    consequence: "The surrounding operating context is producing more confusion than the individual system can absorb.",
    firstAction: "Remove or constrain the single recurring input, meeting, relationship, or information source that most reliably diffuses focus.",
  },
  operational_inconsistency: {
    label: "Operational inconsistency",
    consequence: "Stated direction is not yet visible in time allocation, output rhythm, or measurable behavioural evidence.",
    firstAction: "Open the last two weeks of calendar evidence and mark only blocks that served the stated long-term outcome. Rebuild one recurring block around the missing output.",
  },
  emotional_volatility: {
    label: "Emotional volatility",
    consequence: "Strategic judgment is vulnerable because internal recovery and response rhythm are not stable under pressure.",
    firstAction: "Track the moment pressure changes decision quality for seven days: trigger, response delay, decision made, and recovery time.",
  },
  legacy_deferral: {
    label: "Legacy deferral",
    consequence: "Competence is being spent on the present without becoming structure; motion may continue while durable architecture remains absent.",
    firstAction: "Name the structure that must outlast this season. Allocate one protected weekly action to building it before any new optimisation work.",
  },
  false_alignment: {
    label: "False alignment",
    consequence: "The stated self-reading is ahead of the evidence. This creates risk because confidence may be borrowed from aspiration rather than observed behaviour.",
    firstAction: "Choose the highest-resonance, lowest-certainty answer and gather hard evidence for or against it from the last 14 days.",
  },
  acknowledged_failure: {
    label: "Acknowledged failure",
    consequence: "The problem is visible to the respondent. The cost now comes from delay, not ignorance.",
    firstAction: "Take the lowest-resonance, highest-certainty answer and define the smallest irreversible correction that can be completed this week.",
  },
  distributed_drift: {
    label: "Distributed drift",
    consequence: "No single domain explains the condition. Drift is spread widely enough that isolated self-improvement will not hold.",
    firstAction: "Stabilise the root sequence: mandate sentence, one decision rule, one calendar block, one environment removal. Do not optimise beyond those four moves.",
  },
  high_variance_split: {
    label: "High-variance split",
    consequence: "The person is aligned in some contexts and misaligned in others. That inconsistency will feel like capacity while producing unreliable outcomes.",
    firstAction: "Compare the strongest and weakest domains. Identify the condition that lets the strong domain work and the condition that breaks the weak one.",
  },
  compensatory_discipline: {
    label: "Compensatory discipline",
    consequence: "Behavioural control is masking unresolved direction or confidence debt. The system may look disciplined while compounding the wrong aim.",
    firstAction: "Keep the current discipline intact, but redirect one disciplined block toward mandate clarification rather than output production.",
  },
  latent_coherence_under_pressure: {
    label: "Latent coherence under pressure",
    consequence: "The system is broadly coherent. The risk is not collapse; it is failing to protect the conditions that currently make coherence possible.",
    firstAction: "Document the three conditions that made the strongest domain possible, then protect one of them as a non-negotiable operating constraint.",
  },
};

function pattern(
  id: PurposePatternId,
  score: number,
  reasons: string[],
): PatternScore {
  return {
    id,
    label: PATTERN_COPY[id].label,
    score: Math.round(score),
    reasons,
    consequence: PATTERN_COPY[id].consequence,
    firstAction: PATTERN_COPY[id].firstAction,
  };
}

function hasContradiction(contradictions: AlignmentContradiction[], type: AlignmentContradiction["type"]): boolean {
  return contradictions.some((item) => item.type === type);
}

export function rankPurposePatterns(
  domainStates: DomainState[],
  contradictions: AlignmentContradiction[],
): PatternScore[] {
  const s = (domain: AlignmentDomain) => byDomain(domainStates, domain).alignmentScore;
  const c = (domain: AlignmentDomain) => byDomain(domainStates, domain).certaintyMean * 10;
  const low = (domain: AlignmentDomain) => Math.max(0, 70 - s(domain));
  const high = (domain: AlignmentDomain) => Math.max(0, s(domain) - 60);
  const weakCount = domainStates.filter((item) => item.alignmentScore < 55).length;
  const strongCount = domainStates.filter((item) => item.alignmentScore >= 70).length;
  const criticalCount = domainStates.filter((item) => item.alignmentScore < 35).length;
  const spread = Math.max(...domainStates.map((item) => item.alignmentScore)) -
    Math.min(...domainStates.map((item) => item.alignmentScore));

  const scores = [
    pattern("mandate_fracture", low("identity") * 1.7 + low("decision") * 0.9 + (s("identity") < 35 ? 35 : 0), ["Identity and mandate weakness is structurally prior to the rest of the profile."]),
    pattern("pressure_override", high("identity") * 1.0 + low("decision") * 1.8 + (hasContradiction(contradictions, "identity_strong_decision_weak") ? 55 : 0), ["Identity signal is stronger than decision integrity under pressure."]),
    pattern("environmental_drag", low("environment") * 1.5 + low("behaviour") * 1.1 + (hasContradiction(contradictions, "environment_weak_behaviour_weak") ? 55 : 0), ["Environment and behaviour are interacting rather than failing independently."]),
    pattern("operational_inconsistency", low("behaviour") * 1.8 + high("decision") * 0.9 + (hasContradiction(contradictions, "decision_strong_behaviour_weak") ? 50 : 0), ["Declared priorities are not yet visible in operating evidence."]),
    pattern("emotional_volatility", low("emotional_order") * 1.6 + low("decision") * 0.8 + (hasContradiction(contradictions, "emotional_weak_decision_weak") ? 45 : 0), ["Internal order is likely affecting decision quality."]),
    pattern("legacy_deferral", low("legacy") * 1.8 + high("behaviour") * 0.9 + (hasContradiction(contradictions, "behaviour_strong_legacy_weak") ? 55 : 0), ["Activity is not clearly becoming durable structure."]),
    pattern("false_alignment", (hasContradiction(contradictions, "false_alignment") ? 180 : 0) + Math.max(0, 50 - Math.min(...domainStates.map((item) => c(item.domain)))), ["High resonance with low certainty signals unverified self-reading."]),
    pattern("acknowledged_failure", (hasContradiction(contradictions, "acknowledged_failure") ? 35 : 0) + criticalCount * 22 + (hasContradiction(contradictions, "globally_low_consistent") ? 65 : 0), ["Low resonance with high certainty signals a known failure."]),
    pattern("distributed_drift", weakCount * 22 + (hasContradiction(contradictions, "globally_low_consistent") ? 80 : 0), ["Several domains are weak enough that a single-point correction will not explain the condition."]),
    pattern("high_variance_split", spread * 1.2 + (hasContradiction(contradictions, "high_variance_split") ? 20 : 0), ["The distance between strongest and weakest domains is diagnostically significant."]),
    pattern("compensatory_discipline", high("behaviour") * 1.6 + low("identity") * 1.2 + low("legacy") * 0.65 + (s("behaviour") >= 75 && s("identity") < 50 ? 45 : 0), ["Discipline appears stronger than mandate or long-horizon structure."]),
    pattern("latent_coherence_under_pressure", strongCount * 20 + Math.min(...domainStates.map((item) => item.alignmentScore)) * 0.4 - spread * 0.6, ["The profile is broadly coherent and not driven by a single fracture."]),
  ];

  return scores.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
}

function resultSeverity(
  domainStates: DomainState[],
  contradictions: AlignmentContradiction[],
  primaryPattern: PatternScore,
): DiagnosticSeverity {
  const contradictionSeverity = contradictions.map((item) => item.severity);
  const domainSeverityValues = domainStates.map((item) => item.severity);
  if (primaryPattern.score >= 95) return maxSeverity("high", ...contradictionSeverity, ...domainSeverityValues);
  if (primaryPattern.score >= 70) return maxSeverity("medium", ...contradictionSeverity, ...domainSeverityValues);
  return maxSeverity("low", ...contradictionSeverity, ...domainSeverityValues);
}

function buildEvidence(responses: CanonicalPurposeResponse[]): PurposeAlignmentEvidence {
  const byWeakness = [...responses].sort(
    (a, b) => a.resonance * Math.max(1, a.certainty) - b.resonance * Math.max(1, b.certainty),
  );
  const byStrength = [...responses].sort(
    (a, b) => b.resonance * b.certainty - a.resonance * a.certainty,
  );
  const contradictionEvidence = responses
    .filter((response) => Math.abs(response.resonance - response.certainty) >= 4)
    .sort((a, b) => Math.abs(b.resonance - b.certainty) - Math.abs(a.resonance - a.certainty))
    .slice(0, 3)
    .map((response) => evidenceQuestion(response, "contradiction"));

  return {
    sharpestWeakSignal: byWeakness[0] ? evidenceQuestion(byWeakness[0], "weak") : null,
    strongestStabilisingSignal: byStrength[0] ? evidenceQuestion(byStrength[0], "strong") : null,
    contradictionEvidence,
  };
}

function buildRouting(
  coherenceBand: CoherenceBand,
  primaryPattern: PatternScore,
  contradictions: AlignmentContradiction[],
): RoutingRecommendation {
  const spilloverLikely =
    coherenceBand === "FRAGMENTED" ||
    coherenceBand === "DRIFTING" ||
    primaryPattern.id === "pressure_override" ||
    primaryPattern.id === "environmental_drag" ||
    contradictions.some((item) => item.severity === "high" || item.severity === "critical");

  if (spilloverLikely) {
    return {
      label: "Continue to Constitutional Diagnostic",
      href: "/diagnostics/constitutional-diagnostic?origin=purpose_alignment",
      reason: "The personal pattern may now be affecting structural decision quality.",
      spilloverLikely: true,
    };
  }

  return {
    label: "Verify through Team Assessment",
    href: "/diagnostics/team-alignment?origin=purpose_alignment",
    reason: "The personal pattern is stable enough to test whether surrounding people carry the same standard.",
    spilloverLikely: false,
  };
}

function buildNarrative(params: {
  primaryPattern: PatternScore;
  secondaryPattern: PatternScore | null;
  contradictions: AlignmentContradiction[];
  evidence: PurposeAlignmentEvidence;
  routing: RoutingRecommendation;
  severity: DiagnosticSeverity;
  context?: PurposeAlignmentContext;
}): PurposeReportNarrative {
  const weak = params.evidence.sharpestWeakSignal;
  const strong = params.evidence.strongestStabilisingSignal;
  const reflections = params.context?.reflections ?? null;
  const avoidedDecision = cleanContextText(reflections?.avoidedDecision);
  const lastSevenDays = cleanContextText(reflections?.lastSevenDays);
  const dissenter = cleanContextText(reflections?.dissenter);
  const contextSignals = [
    avoidedDecision ? `Avoided decision: ${avoidedDecision}` : "",
    lastSevenDays ? `Recent behavioural evidence: ${lastSevenDays}` : "",
    dissenter ? `Dissenting evidence: ${dissenter}` : "",
  ].filter(Boolean);
  const contradictionText = params.contradictions.length
    ? params.contradictions
        .slice(0, 2)
        .map((item) => item.evidence)
        .join(" ")
    : "No major contradiction dominates the profile; the reading is governed by domain state and pattern competition.";

  const contextExplanation = contextSignals.length
    ? ` The qualitative evidence changes the reading: ${contextSignals.join(" ")}.`
    : "";
  const decisionAction = avoidedDecision
    ? `Name the avoided decision as a binary choice and record the consequence of choosing neither option: ${avoidedDecision}`
    : params.primaryPattern.firstAction;
  const consequence = [
    params.primaryPattern.consequence,
    lastSevenDays
      ? `The last-seven-days evidence shows how the pattern is already entering behaviour: ${lastSevenDays}`
      : "",
    dissenter
      ? `The dissenter test prevents false certainty: ${dissenter}`
      : "",
  ].filter(Boolean).join(" ");

  return {
    conditionStatement: `Primary condition: ${params.primaryPattern.label}. Severity is ${params.severity}.${avoidedDecision ? ` The live decision under pressure is: ${avoidedDecision}` : ""}`,
    classificationExplanation: `The system selected this condition because ${params.primaryPattern.reasons.join(" ")}${params.secondaryPattern ? ` Secondary pressure: ${params.secondaryPattern.label}.` : ""}${contextExplanation}`,
    contradictionExplanation: contextSignals.length
      ? `${contradictionText} User-supplied evidence: ${contextSignals.join(" ")}.`
      : contradictionText,
    consequenceBlock: consequence,
    firstActionBlock: decisionAction,
    nextStepBlock: `${params.routing.label}. ${params.routing.reason}${weak ? ` Sharpest weak evidence: "${weak.statement}" (${weak.resonance}/10 resonance, ${weak.certainty}/10 certainty).` : ""}${strong ? ` Strongest stabilising evidence: "${strong.statement}" (${strong.resonance}/10 resonance, ${strong.certainty}/10 certainty).` : ""}`,
  };
}

function cleanContextText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, 280);
}

export function runPurposeAlignmentEngine(
  input: (DualAxisInput | { answers: Record<string, DualAxisAnswer | boolean> }) & {
    context?: PurposeAlignmentContext;
  },
): PurposeProfileResult {
  const rawResponses = normalizePurposeResponses(input);
  const domainStates = buildDomainStates(rawResponses);
  const contradictions = detectPurposeContradictions(domainStates, rawResponses);
  const patternScores = rankPurposePatterns(domainStates, contradictions);
  const primaryPattern = patternScores[0]!;
  const secondaryPattern = patternScores[1] ?? null;
  const severity = resultSeverity(domainStates, contradictions, primaryPattern);
  const evidence = buildEvidence(rawResponses);

  const domainProfiles: DomainProfile[] = domainStates.map((state) => ({
    domain: state.domain,
    label: state.label,
    resonance: Math.round(state.resonanceMean),
    certainty: Math.round(state.certaintyMean),
    weighted: Math.round(state.alignmentScore / 10),
    percent: state.alignmentScore,
  }));

  const totalScore = Math.round(domainStates.reduce((sum, state) => sum + state.alignmentScore, 0) / 10);
  const maxScore = domainStates.length * 10;
  const percent = Math.round(domainStates.reduce((sum, state) => sum + state.alignmentScore, 0) / domainStates.length);
  const coherenceBand = getCoherenceBand(percent);
  const weakestDomains = [...domainStates]
    .sort((a, b) => a.alignmentScore - b.alignmentScore || a.label.localeCompare(b.label))
    .slice(0, 2)
    .map((state) => state.domain);
  const routingRecommendation = buildRouting(coherenceBand, primaryPattern, contradictions);
  const reportNarrative = buildNarrative({
    primaryPattern,
    secondaryPattern,
    contradictions,
    evidence,
    routing: routingRecommendation,
    severity,
    context: input.context,
  });

  return {
    totalScore,
    maxScore,
    percent,
    coherenceBand,
    domainProfiles,
    weakestDomains,
    strengths: domainStates
      .filter((state) => state.state === "stable_strength")
      .map((state) => `${state.label} is a stabilising strength.`),
    corrections: [reportNarrative.firstActionBlock, secondaryPattern?.firstAction].filter(Boolean) as string[],
    narrative: reportNarrative.conditionStatement,
    nextActions: [reportNarrative.firstActionBlock, routingRecommendation.label],
    createdAt: new Date().toISOString(),
    rawResponses,
    domainStates,
    contradictions,
    patternScores,
    primaryPattern,
    secondaryPattern,
    severity,
    consequenceLogic: primaryPattern.consequence,
    firstAction: reportNarrative.firstActionBlock,
    evidence,
    routingRecommendation,
    reportNarrative,
  };
}

export function responseMapFromCanonical(
  responses: CanonicalPurposeResponse[],
): Record<string, DualAxisAnswer> {
  const out: Record<string, DualAxisAnswer> = {};
  for (const response of responses) {
    if (QUESTION_BY_ID.has(response.questionId)) {
      out[response.questionId] = {
        resonance: response.resonance,
        certainty: response.certainty,
      };
    }
  }
  return out;
}
