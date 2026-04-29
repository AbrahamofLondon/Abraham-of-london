import "server-only";

/**
 * Anchor Extractor — extracts user-specific decision anchors from assessment inputs.
 *
 * Four sub-extractors for constitutional, purpose, team, enterprise.
 * Preserves user language verbatim. Normalises only where needed.
 * Anchors are NEVER exposed to the client.
 */

import type {
  DecisionAnchors,
  AnchorAssessmentType,
} from "./anchor-types.server";

import type {
  PurposeAlignmentContext,
  PurposeProfileResult,
  AlignmentDomain,
} from "@/lib/alignment/types";

import type {
  ConstitutionalDecisionScores,
  TeamGapInput,
  TeamDecisionResult,
  EnterpriseSectionScore,
  EnterpriseDecisionResult,
} from "@/lib/diagnostics/decision-engine";

import type { ConstitutionalDecision } from "@/lib/constitution/rules";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clean(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, 500);
}

function collectFragments(...values: unknown[]): string[] {
  return values
    .map(clean)
    .filter((v) => v.length > 0);
}

function ownerClarityFromAuthority(
  authorityType: string,
): DecisionAnchors["ownerClarity"] {
  switch (authorityType) {
    case "DIRECT":
      return "clear";
    case "PROXY":
      return "contested";
    case "UNCLEAR":
      return "absent";
    default:
      return "absent";
  }
}

const DOMAIN_LABELS: Record<AlignmentDomain, string> = {
  identity: "identity and mandate",
  decision: "decision logic under pressure",
  environment: "operating environment",
  behaviour: "daily behavioural evidence",
  emotional_order: "internal order and stability",
  legacy: "long-horizon structure",
};

function domainLabel(domain: AlignmentDomain): string {
  return DOMAIN_LABELS[domain] ?? domain;
}

function priorAttemptClause(outcome: string): string {
  switch (outcome) {
    case "NONE":
      return "no prior correction has been attempted";
    case "PARTIAL":
      return "a prior correction was attempted but only partially completed";
    case "FAILED":
      return "a prior correction was attempted and failed";
    case "WORSENED":
      return "a prior correction was attempted and made the condition worse";
    default:
      return "";
  }
}

// ─── Constitutional anchor extraction ────────────────────────────────────────

export type ConstitutionalAnchorInput = {
  scores: ConstitutionalDecisionScores;
  decision: ConstitutionalDecision;
  reflections?: {
    structuralProblem?: string | null;
    priorAttempts?: string | null;
    shadowAuthority?: string | null;
  } | null;
  /** From AssessmentSuiteIntake if available */
  intake?: {
    problemStatement?: string | null;
    symptoms?: string | null;
    desiredOutcome?: string | null;
    currentConstraint?: string | null;
    decisionNeed?: {
      decisionQuestion?: string | null;
      whatHappensIfNothingChanges?: string | null;
      whyNow?: string | null;
    } | null;
    history?: {
      priorAttemptOutcome?: string | null;
      correctionHistory?: string | null;
    } | null;
    governance?: {
      authorityScope?: string | null;
    } | null;
  } | null;
};

export function extractConstitutionalAnchors(
  input: ConstitutionalAnchorInput,
): DecisionAnchors {
  const { scores, decision, reflections, intake } = input;

  const decisionText =
    clean(intake?.decisionNeed?.decisionQuestion) ||
    clean(reflections?.structuralProblem) ||
    (decision.route === "STRATEGY"
      ? "commit to intervention versus defer correction"
      : "define authority versus delay");

  const attemptedActions: string[] = [];
  const priorText = clean(intake?.history?.correctionHistory);
  if (priorText) attemptedActions.push(priorText);
  const priorClause = priorAttemptClause(intake?.history?.priorAttemptOutcome ?? "");
  if (priorClause) attemptedActions.push(priorClause);
  const reflectionAttempts = clean(reflections?.priorAttempts);
  if (reflectionAttempts) attemptedActions.push(reflectionAttempts);

  const blocker =
    clean(intake?.currentConstraint) ||
    (scores.governance < 50 ? "governance reliability is below threshold" : "") ||
    (scores.authority < 50 ? "authority is not sufficiently ordered" : "");

  const competingPriority =
    clean(intake?.desiredOutcome) ||
    (scores.pressure >= 60 ? "pressure-driven execution" : "") ||
    (scores.friction >= 60 ? "operating friction" : "maintaining current structure");

  return {
    assessmentType: "constitutional",
    decision: decisionText,
    attemptedActions,
    blocker,
    competingPriority,
    ownerClarity: ownerClarityFromAuthority(
      intake?.governance?.authorityScope ?? scores.authorityType,
    ),
    urgency:
      clean(intake?.decisionNeed?.whyNow) ||
      (scores.pressure >= 70 ? "high external pressure" : ""),
    statedConsequence:
      clean(intake?.decisionNeed?.whatHappensIfNothingChanges) ||
      decision.rationale[0] ||
      "",
    verbatimFragments: collectFragments(
      intake?.problemStatement,
      intake?.symptoms,
      reflections?.structuralProblem,
      reflections?.shadowAuthority,
      reflections?.priorAttempts,
    ),
  };
}

// ─── Purpose alignment anchor extraction ─────────────────────────────────────

export type PurposeAnchorInput = {
  result: PurposeProfileResult;
  context?: PurposeAlignmentContext | null;
};

export function extractPurposeAnchors(
  input: PurposeAnchorInput,
): DecisionAnchors {
  const { result, context } = input;
  const reflections = context?.reflections ?? null;

  const avoidedDecision = clean(reflections?.avoidedDecision);
  const lastSevenDays = clean(reflections?.lastSevenDays);
  const dissenter = clean(reflections?.dissenter);

  const weakestDomain = result.weakestDomains[0];
  const weakLabel = weakestDomain ? domainLabel(weakestDomain) : "alignment";
  const weakEvidence = result.evidence?.sharpestWeakSignal;
  const strongEvidence = result.evidence?.strongestStabilisingSignal;

  const decisionText =
    avoidedDecision ||
    (weakEvidence
      ? `resolve ${weakLabel}: "${weakEvidence.statement}"`
      : `correct ${weakLabel}`);

  const attemptedActions: string[] = [];
  if (lastSevenDays) attemptedActions.push(lastSevenDays);

  const primaryContradiction = result.contradictions?.[0];
  const blocker =
    (primaryContradiction
      ? primaryContradiction.evidence
      : "") ||
    `${weakLabel} is structurally weak`;

  const strongestDomain = result.domainProfiles?.[0];
  const strongLabel = strongestDomain
    ? domainLabel(strongestDomain.domain)
    : "current strengths";

  return {
    assessmentType: "purpose",
    decision: decisionText,
    attemptedActions,
    blocker,
    competingPriority: `maintaining ${strongLabel} while ${weakLabel} degrades`,
    ownerClarity: "clear", // Purpose is always personal
    urgency:
      result.severity === "critical"
        ? "the condition is critical and compounding"
        : result.severity === "high"
          ? "visible separation between direction and operation"
          : "drift is present and uncorrected",
    statedConsequence:
      result.primaryPattern?.consequence ||
      `${weakLabel} will continue to degrade without intervention`,
    verbatimFragments: collectFragments(
      avoidedDecision,
      lastSevenDays,
      dissenter,
      weakEvidence?.statement,
      strongEvidence?.statement,
    ),
  };
}

// ─── Team anchor extraction ──────────────────────────────────────────────────

export type TeamAnchorInput = {
  gaps: TeamGapInput[];
  decisionResult: TeamDecisionResult;
  falseAssumption?: string | null;
  showScoresReaction?: string | null;
  purposePct?: number | null;
};

export function extractTeamAnchors(
  input: TeamAnchorInput,
): DecisionAnchors {
  const { gaps, decisionResult, falseAssumption, showScoresReaction, purposePct } = input;

  const largestGap = [...gaps].sort(
    (a, b) => Math.abs(b.gap) - Math.abs(a.gap),
  )[0];

  const decisionText = largestGap
    ? `${largestGap.label} requires correction: leadership reads ${largestGap.leaderPct}% while execution reality is ${largestGap.realityPct}%`
    : decisionResult.decisionObject.decision;

  const attemptedActions: string[] = [];
  const assumption = clean(falseAssumption);
  if (assumption) {
    attemptedActions.push(
      `operating under the assumption: "${assumption}"`,
    );
  }

  const blocker = largestGap
    ? `the perception gap in ${largestGap.label} (${Math.abs(largestGap.gap)} points between leadership and team reality)`
    : "unresolved perception gap between leadership and team";

  const reaction = clean(showScoresReaction);
  const politicallySensitive =
    reaction &&
    /concern|worry|careful|sensitive|political|risk/i.test(reaction);

  const criticalCount = gaps.filter((g) => g.gapSeverity === "CRITICAL").length;
  const highCount = gaps.filter((g) => g.gapSeverity === "HIGH").length;

  return {
    assessmentType: "team",
    decision: decisionText,
    attemptedActions,
    blocker,
    competingPriority:
      "maintaining the current leadership reading of the team",
    ownerClarity: politicallySensitive ? "contested" : "clear",
    urgency:
      criticalCount >= 2
        ? `${criticalCount} critical gaps across team domains`
        : highCount >= 2
          ? `${highCount} high-severity gaps detected`
          : "team perception divergence detected",
    statedConsequence:
      decisionResult.escalationNote ||
      "the gap between leadership perception and team reality will harden into operating normality",
    verbatimFragments: collectFragments(
      falseAssumption,
      showScoresReaction,
      ...(largestGap ? [largestGap.label] : []),
    ),
  };
}

// ─── Enterprise anchor extraction ────────────────────────────────────────────

export type EnterpriseAnchorInput = {
  sections: EnterpriseSectionScore[];
  reading: EnterpriseDecisionResult;
  recentDecision?: string | null;
  teamAlignmentPct?: number | null;
};

export function extractEnterpriseAnchors(
  input: EnterpriseAnchorInput,
): DecisionAnchors {
  const { sections, reading, recentDecision, teamAlignmentPct } = input;

  const weakest = [...sections].sort((a, b) => a.pct - b.pct)[0];
  const strongest = [...sections].sort((a, b) => b.pct - a.pct)[0];

  const decisionText = weakest
    ? `${reading.decisionObject.decision} — driven by ${weakest.title} at ${weakest.pct}%`
    : reading.decisionObject.decision;

  const attemptedActions: string[] = [];
  const recent = clean(recentDecision);
  if (recent) {
    attemptedActions.push(`most recent institutional decision: ${recent}`);
  }

  const blocker = reading.dominantFailure
    ? `${reading.dominantFailure} is the dominant failure point`
    : weakest
      ? `${weakest.title} at ${weakest.pct}% is below threshold`
      : "institutional strain is distributed";

  const competingPriority =
    strongest && weakest
      ? `${strongest.title} coherence (${strongest.pct}%) versus ${weakest.title} correction (${weakest.pct}%)`
      : "maintaining institutional momentum while addressing structural weakness";

  const leadershipSection = sections.find(
    (s) => s.id === "leadership" || s.title.toLowerCase().includes("leadership"),
  );

  return {
    assessmentType: "enterprise",
    decision: decisionText,
    attemptedActions,
    blocker,
    competingPriority,
    ownerClarity:
      leadershipSection && leadershipSection.pct < 50 ? "contested" : "clear",
    urgency:
      reading.band === "ESCALATE"
        ? "institutional condition requires immediate escalation"
        : reading.band === "FRAGILE"
          ? "the institution is operating under fragile conditions"
          : "the institutional condition is under watch",
    statedConsequence:
      reading.primaryReading ||
      "institutional strain will compound without governed intervention",
    verbatimFragments: collectFragments(
      recentDecision,
      reading.dominantFailure,
      weakest?.title,
      strongest?.title,
    ),
  };
}

// ─── Dispatcher ──────────────────────────────────────────────────────────────

export type AnchorExtractionInput =
  | { type: "constitutional"; input: ConstitutionalAnchorInput }
  | { type: "purpose"; input: PurposeAnchorInput }
  | { type: "team"; input: TeamAnchorInput }
  | { type: "enterprise"; input: EnterpriseAnchorInput };

export function extractAnchors(
  extraction: AnchorExtractionInput,
): DecisionAnchors {
  switch (extraction.type) {
    case "constitutional":
      return extractConstitutionalAnchors(extraction.input);
    case "purpose":
      return extractPurposeAnchors(extraction.input);
    case "team":
      return extractTeamAnchors(extraction.input);
    case "enterprise":
      return extractEnterpriseAnchors(extraction.input);
  }
}
