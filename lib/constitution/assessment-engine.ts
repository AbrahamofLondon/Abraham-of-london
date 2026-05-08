// lib/constitution/assessment-engine.ts

import {
  evaluateConstitutionalRoute,
  type AuthorityType,
  type OrgPosture,
  type ReadinessTier,
} from "@/lib/constitution/rules";
import { specificityScore, graduatedBonus, matchDensity, matchCount } from "@/lib/scoring-math";
import type {
  AssessmentInput,
  AssessmentReadout,
  AssessmentScores,
  ConstitutionalAssessment,
  FailureModeLabel,
  FailureModeRecord,
} from "@/lib/constitution/assessment-types";

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function toInt(value: number): number {
  return Math.round(clamp(value, 0, 100));
}

function safeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function compact(text: string): string {
  return safeText(text)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\s+/g, " ")
    .trim();
}

function wordCount(text: string): number {
  const clean = compact(text);
  return clean ? clean.split(/\s+/).length : 0;
}

function sentenceCount(text: string): number {
  const clean = compact(text);
  if (!clean) return 0;
  return clean
    .split(/[.!?]+/)
    .map((part) => part.trim())
    .filter(Boolean).length;
}

function includesAny(text: string, patterns: string[]): boolean {
  const hay = text.toLowerCase();
  return patterns.some((pattern) => hay.includes(pattern.toLowerCase()));
}

function scoreLength(text: string, _floor: number, _ceiling: number): number {
  // Replaced pure word-count scoring with specificity-based scoring.
  // A concise 30-word statement with named entities and causal language
  // now scores higher than an 80-word ramble with no specifics.
  return specificityScore(text);
}

function extractPrimaryNarrative(input: AssessmentInput): string {
  return compact(
    [
      input.problemStatement,
      input.mandateDescription,
      input.statedProblem,
      input.symptoms,
      input.desiredOutcome,
      input.currentConstraint,
      input.marketExposure,
    ]
      .filter(Boolean)
      .join("\n\n"),
  );
}

function deriveAuthorityType(input: AssessmentInput, scores: AssessmentScores): AuthorityType {
  const role = [
    input.role,
    input.authorityRole,
    input.authorityScope,
    input.boardInvolved,
  ]
    .map(safeText)
    .join(" ")
    .toLowerCase();

  if (
    includesAny(role, [
      "ceo",
      "founder",
      "owner",
      "managing director",
      "executive director",
      "board chair",
      "chairman",
      "president",
      "principal",
      "decision maker",
      "final approval",
      "board member",
    ])
  ) {
    return "DIRECT";
  }

  if (
    includesAny(role, [
      "advisor",
      "consultant",
      "chief of staff",
      "programme lead",
      "program lead",
      "project lead",
      "operations manager",
      "proxy",
      "delegate",
      "liaison",
      "on behalf",
    ])
  ) {
    return "PROXY";
  }

  if (scores.authorityClarityScore >= 72) return "DIRECT";
  if (scores.authorityClarityScore >= 45) return "PROXY";
  return "UNCLEAR";
}

function derivePosture(scores: AssessmentScores): OrgPosture {
  // Weighted composite replaces AND-gated thresholds.
  // Old logic: coherence=74, friction=34, governance=69 fell to MISALIGNED
  // despite being 1 point from ORDERED on every axis.
  // New logic: composite score produces monotonic degradation.
  const composite = Math.round(
    scores.narrativeCoherence * 0.35 +
    (100 - scores.frictionScore) * 0.30 +
    scores.governanceDiscipline * 0.20 +
    (scores.trustCondition ?? 50) * 0.15,
  );

  if (composite >= 72) return "ORDERED";
  if (composite >= 52) return "DRIFTING";
  if (composite >= 32) return "MISALIGNED";
  return "DISORDERED";
}

function deriveReadinessTier(
  scores: AssessmentScores,
  authorityType: AuthorityType,
  posture: OrgPosture,
): ReadinessTier {
  const composite =
    scores.interventionReadiness * 0.35 +
    scores.clarityScore * 0.2 +
    scores.narrativeCoherence * 0.15 +
    scores.governanceDiscipline * 0.15 +
    scores.trustCondition * 0.15;

  if (
    composite >= 86 &&
    authorityType === "DIRECT" &&
    posture === "ORDERED"
  ) {
    return "SOVEREIGN";
  }

  if (
    composite >= 70 &&
    authorityType !== "UNCLEAR" &&
    posture !== "DISORDERED"
  ) {
    return "EXECUTION_READY";
  }

  if (composite >= 56) return "STABILIZING";
  if (composite >= 40) return "EMERGING";
  return "FRAGILE";
}

function failureLabel(code: FailureModeLabel): string {
  switch (code) {
    case "narrative_incoherence":
      return "Narrative incoherence";
    case "sponsor_weakness":
      return "Sponsor weakness";
    case "governance_erosion":
      return "Governance erosion";
    case "trust_erosion":
      return "Trust erosion";
    case "mandate_ambiguity":
      return "Mandate ambiguity";
    case "execution_fragmentation":
      return "Execution fragmentation";
    case "strategic_operational_misalignment":
      return "Strategic-operational misalignment";
    case "decision_owner_ambiguity":
      return "Decision-owner ambiguity";
    case "market_pressure_without_order":
      return "Market pressure without institutional order";
    default:
      return code;
  }
}

function deriveFailureModes(input: AssessmentInput, scores: AssessmentScores): FailureModeRecord[] {
  const narrative = extractPrimaryNarrative(input).toLowerCase();

  const records: Array<{
    code: FailureModeLabel;
    severity: number;
    triggered: boolean;
  }> = [
    {
      code: "narrative_incoherence",
      severity: scores.narrativeCoherence < 25 ? 9 : scores.narrativeCoherence < 45 ? 6 : 2,
      triggered: scores.narrativeCoherence < 50,
    },
    {
      code: "sponsor_weakness",
      severity:
        scores.authorityClarityScore < 30 ? 8 : scores.authorityClarityScore < 50 ? 6 : 2,
      triggered: scores.authorityClarityScore < 50,
    },
    {
      code: "governance_erosion",
      severity:
        scores.governanceDiscipline < 25 ? 9 : scores.governanceDiscipline < 45 ? 7 : 2,
      triggered: scores.governanceDiscipline < 50,
    },
    {
      code: "trust_erosion",
      severity: scores.trustCondition < 25 ? 8 : scores.trustCondition < 45 ? 6 : 2,
      triggered: scores.trustCondition < 50,
    },
    {
      code: "mandate_ambiguity",
      severity:
        scores.clarityScore < 20 ? 9 : scores.clarityScore < 40 ? 7 : 2,
      triggered: scores.clarityScore < 45,
    },
    {
      code: "execution_fragmentation",
      severity:
        scores.frictionScore > 80 ? 8 : scores.frictionScore > 60 ? 6 : 2,
      triggered: scores.frictionScore > 55,
    },
    {
      code: "strategic_operational_misalignment",
      severity:
        scores.clarityScore < 55 && scores.frictionScore > 50 ? 7 : 2,
      triggered: scores.clarityScore < 60 && scores.frictionScore > 50,
    },
    {
      code: "decision_owner_ambiguity",
      severity:
        scores.authorityClarityScore < 25 ? 8 : scores.authorityClarityScore < 45 ? 6 : 2,
      triggered: scores.authorityClarityScore < 45,
    },
    {
      code: "market_pressure_without_order",
      severity:
        scores.pressureScore > 70 && scores.governanceDiscipline < 50 ? 7 : 2,
      triggered: scores.pressureScore > 70 && scores.governanceDiscipline < 55,
    },
  ];

  const lexicalBoosts: Record<FailureModeLabel, string[]> = {
    narrative_incoherence: ["unclear", "confused", "mixed signals", "contradictory"],
    sponsor_weakness: ["no sponsor", "weak sponsor", "no backing", "cannot secure buy-in"],
    governance_erosion: ["no governance", "poor governance", "governance gap"],
    trust_erosion: ["trust breakdown", "mistrust", "politics", "friction"],
    mandate_ambiguity: ["not sure", "undefined", "unclear mandate", "scope creep"],
    execution_fragmentation: ["duplicated", "fragmented", "silos", "handoff failure"],
    strategic_operational_misalignment: ["strategy not executed", "execution gap", "misaligned"],
    decision_owner_ambiguity: ["who decides", "decision unclear", "no owner"],
    market_pressure_without_order: ["market pressure", "investor pressure", "external pressure"],
  };

  return records.map((record) => {
    const lexicalHit = lexicalBoosts[record.code].some((phrase) =>
      narrative.includes(phrase),
    );

    const severity = clamp(record.severity + (lexicalHit ? 1 : 0), 0, 10);

    return {
      code: record.code,
      label: failureLabel(record.code),
      severity,
      triggered: record.triggered || lexicalHit,
    };
  });
}

function deriveScores(input: AssessmentInput): AssessmentScores {
  const narrative = extractPrimaryNarrative(input);
  const problem = compact(input.problemStatement || input.mandateDescription || input.statedProblem || "");
  const symptoms = compact(input.symptoms || "");
  const outcome = compact(input.desiredOutcome || "");
  const constraint = compact(input.currentConstraint || "");
  const market = compact(input.marketExposure || "");
  const role = compact([input.role, input.authorityRole, input.authorityScope].join(" "));
  const jurisdiction = compact(input.jurisdiction || "");
  const organisation = compact(input.organisation || "");
  const revenueBand = compact(input.revenueBand || input.annualRevenueBand || "");
  const urgencyWindow = compact(input.urgencyWindow || "");
  const boardInvolved = compact(input.boardInvolved || "");

  const problemDepth = scoreLength(problem, 12, 60);
  const symptomDepth = scoreLength(symptoms, 10, 50);
  const outcomeDepth = scoreLength(outcome, 8, 30);
  const constraintDepth = scoreLength(constraint, 6, 24);
  const marketDepth = scoreLength(market, 4, 20);
  const narrativeDepth = scoreLength(narrative, 30, 180);

  const structureBonus =
    (sentenceCount(problem) >= 2 ? 12 : 0) +
    (sentenceCount(symptoms) >= 2 ? 10 : 0) +
    (sentenceCount(outcome) >= 1 ? 8 : 0) +
    (sentenceCount(constraint) >= 1 ? 6 : 0);

  const seriousnessLexical =
    includesAny(narrative, [
      "material",
      "risk",
      "board",
      "cash",
      "reputation",
      "regulatory",
      "investor",
      "strategic",
      "structural",
      "governance",
      "exposure",
      "escalation",
    ])
      ? 12
      : 0;

  const coherencePenalty =
    includesAny(narrative, [
      "not sure",
      "kind of",
      "maybe",
      "roughly",
      "something like",
      "hard to explain",
      "a bit of everything",
    ])
      ? 18
      : 0;

  const clarityScore = toInt(
    problemDepth * 0.34 +
      symptomDepth * 0.22 +
      outcomeDepth * 0.18 +
      constraintDepth * 0.12 +
      marketDepth * 0.06 +
      structureBonus +
      (organisation ? 4 : 0) +
      (jurisdiction ? 2 : 0),
  );

  const seriousnessScore = toInt(
    narrativeDepth * 0.45 +
      problemDepth * 0.2 +
      symptomDepth * 0.1 +
      constraintDepth * 0.1 +
      marketDepth * 0.05 +
      seriousnessLexical +
      (boardInvolved ? 6 : 0) +
      (revenueBand ? 4 : 0),
  );

  // Graduated scoring: keyword matches produce partial credit via sigmoid curve,
  // not binary 34-or-0 jumps. Multiple matches give more credit than one.
  const causalPatterns = ["because", "therefore", "which means", "as a result", "leading to", "causing"];
  const narrativeCoherence = toInt(
    clamp(
      clarityScore * 0.7 +
        graduatedBonus(sentenceCount(narrative), 12, 3) +
        graduatedBonus(matchCount(narrative.toLowerCase(), causalPatterns), 8, 2) -
        coherencePenalty,
      0,
      100,
    ),
  );

  const directAuthority = ["founder", "ceo", "owner", "director", "board", "principal", "chair"];
  const proxyAuthority = ["manager", "lead", "head", "chief of staff", "vp", "partner"];
  const authorityClarityScore = toInt(
    clamp(
      (role ? 30 : 0) +
        (organisation ? 10 : 0) +
        (boardInvolved ? 10 : 0) +
        graduatedBonus(matchCount(role.toLowerCase(), directAuthority), 26, 1) +
        graduatedBonus(matchCount(role.toLowerCase(), proxyAuthority), 14, 1) +
        (input.precomputed?.authorityClarity ?? 0) * 0.2,
      0,
      100,
    ),
  );

  const urgencyPatterns = ["urgent", "immediate", "critical", "at risk", "deadline", "time-sensitive"];
  const stakeholderPatterns = ["board", "investor", "regulator", "customer", "market", "shareholder"];
  const pressureScore = toInt(
    clamp(
      graduatedBonus(matchCount(narrative.toLowerCase(), urgencyPatterns), 28, 2) +
        graduatedBonus(matchCount(narrative.toLowerCase(), stakeholderPatterns), 20, 2) +
        (urgencyWindow ? 16 : 0) +
        marketDepth * 0.2 +
        (input.precomputed?.pressure ?? 0) * 0.4,
      0,
      100,
    ),
  );

  const frictionPatterns = ["friction", "conflict", "duplicated", "silo", "blocked", "misaligned", "overlap"];
  const failurePatterns = ["failed", "stalled", "stuck", "delay", "rework", "collapsed", "broke down"];
  const frictionScore = toInt(
    clamp(
      graduatedBonus(matchCount(narrative.toLowerCase(), frictionPatterns), 34, 2) +
        graduatedBonus(matchCount(narrative.toLowerCase(), failurePatterns), 18, 2) +
        symptomDepth * 0.3 +
        (input.precomputed?.friction ?? 0) * 0.4,
      0,
      100,
    ),
  );

  const distrustPatterns = ["mistrust", "politics", "breakdown", "distrust", "suspicion", "hidden agenda"];
  const trustCondition = toInt(
    clamp(
      (input.precomputed?.trustCondition ?? 55) -
        graduatedBonus(matchCount(narrative.toLowerCase(), distrustPatterns), 22, 1) -
        (frictionPenaltyFromNarrative(narrative) * 0.25),
      0,
      100,
    ),
  );

  const govPositive = ["cadence", "board pack", "governance", "decision rights", "accountability", "review cycle"];
  const govNegative = ["unclear ownership", "scope creep", "decision bottleneck", "no one owns", "vacuum"];
  const governanceDiscipline = toInt(
    clamp(
      (input.precomputed?.governanceDiscipline ?? 55) +
        graduatedBonus(matchCount(narrative.toLowerCase(), govPositive), 12, 2) -
        graduatedBonus(matchCount(narrative.toLowerCase(), govNegative), 16, 1),
      0,
      100,
    ),
  );

  const interventionReadiness = toInt(
    clamp(
      clarityScore * 0.35 +
        seriousnessScore * 0.15 +
        authorityClarityScore * 0.2 +
        governanceDiscipline * 0.15 +
        trustCondition * 0.15 -
        (includesAny(narrative, ["just exploring", "only curious", "early thoughts"]) ? 18 : 0),
      0,
      100,
    ),
  );

  return {
    clarityScore,
    seriousnessScore,
    narrativeCoherence,
    interventionReadiness,
    trustCondition,
    governanceDiscipline,
    authorityClarityScore,
    pressureScore,
    frictionScore,
  };
}

function frictionPenaltyFromNarrative(narrative: string): number {
  return includesAny(narrative, ["friction", "conflict", "politics", "misaligned"]) ? 20 : 0;
}

function buildReadout(
  scores: AssessmentScores,
  authorityType: AuthorityType,
  posture: OrgPosture,
  readinessTier: ReadinessTier,
  failureModes: FailureModeRecord[],
  decision: ReturnType<typeof evaluateConstitutionalRoute>,
): AssessmentReadout {
  const triggeredModes = failureModes.filter((item) => item.triggered);
  const topModes = [...triggeredModes]
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 3);

  const headline =
    decision.route === "STRATEGY"
      ? "The matter is decision-grade and eligible for strategic escalation."
      : decision.route === "DIAGNOSTIC"
        ? "The signal is real, but it still requires disciplined interpretation before escalation."
        : "The current submission does not yet justify governed escalation.";

  const summary =
    decision.route === "STRATEGY"
      ? "Authority, readiness, and coherence are strong enough to support mandate-level work."
      : decision.route === "DIAGNOSTIC"
        ? "The case has consequence, but one or more constitutional conditions remain incomplete."
        : "The case is currently too weak, too unclear, or too incoherent to justify premium escalation.";

  return {
    headline,
    summary,
    routeWhy: decision.rationale,
    visibleAssessment: [
      {
        label: "Authority",
        value: authorityType,
        interpretation:
          authorityType === "DIRECT"
            ? "Decision ownership appears sufficiently direct."
            : authorityType === "PROXY"
              ? "Authority exists, but it is mediated and must be handled carefully."
              : "Decision ownership remains unclear.",
      },
      {
        label: "Posture",
        value: posture,
        interpretation:
          posture === "ORDERED"
            ? "Institutional order is materially intact."
            : posture === "DRIFTING"
              ? "The system still functions, but directional discipline is weakening."
              : posture === "MISALIGNED"
                ? "The issue is structural rather than cosmetic."
                : "Disorder is high enough to act as a constitutional brake.",
      },
      {
        label: "Readiness",
        value: readinessTier,
        interpretation:
          readinessTier === "SOVEREIGN" || readinessTier === "EXECUTION_READY"
            ? "The case is materially capable of intervention."
            : readinessTier === "STABILIZING"
              ? "The case is improving but not yet at clean strategic readiness."
              : readinessTier === "EMERGING"
                ? "Some signal exists, but intervention fit is incomplete."
                : "Foundational stabilisation is still required.",
      },
      {
        label: "Clarity",
        value: `${scores.clarityScore}%`,
        interpretation:
          scores.clarityScore >= 65
            ? "The problem is stated with sufficient substance."
            : scores.clarityScore >= 35
              ? "The signal is usable, but still under-specified."
              : "The signal remains below constitutional clarity minimum.",
      },
      {
        label: "Structural strain",
        value: `${Math.max(...triggeredModes.map((m) => m.severity), 0)}/10`,
        interpretation:
          topModes.length > 0
            ? `Dominant failure modes: ${topModes.map((m) => m.label).join(", ")}.`
            : "No dominant failure mode was strongly triggered.",
      },
    ],
    requiredNextMoves: decision.recommendedInterventions,
  };
}

export function runConstitutionalAssessment(
  input: AssessmentInput,
): ConstitutionalAssessment {
  const scores = deriveScores(input);
  const authorityType = deriveAuthorityType(input, scores);
  const posture = derivePosture(scores);
  const readinessTier = deriveReadinessTier(scores, authorityType, posture);
  const failureModes = deriveFailureModes(input, scores);

  const triggered = failureModes.filter((item) => item.triggered);
  const failureModeCount = triggered.length;
  const failureModeSeverity =
    triggered.length > 0
      ? Math.max(...triggered.map((item) => item.severity))
      : 0;

  const mandateNarrative = extractPrimaryNarrative(input);
  const mandateFit = !includesAny(mandateNarrative, [
    "just curious",
    "testing this out",
    "random question",
    "not urgent",
    "casual advice",
  ]);

  const decision = evaluateConstitutionalRoute({
    clarityScore: scores.clarityScore,
    authorityType,
    readinessTier,
    posture,
    failureModeCount,
    failureModeSeverity,
    narrativeCoherence: scores.narrativeCoherence,
    interventionReadiness: scores.interventionReadiness,
    seriousnessScore: scores.seriousnessScore,
    mandateFit,
    trustCondition: scores.trustCondition,
    governanceDiscipline: scores.governanceDiscipline,
  });

  const readout = buildReadout(
    scores,
    authorityType,
    posture,
    readinessTier,
    failureModes,
    decision,
  );

  return {
    input,
    scores,
    profile: {
      authorityType,
      readinessTier,
      posture,
      failureModeCount,
      failureModeSeverity,
      failureModes,
    },
    decision,
    readout,
    generatedAt: new Date().toISOString(),
  };
}