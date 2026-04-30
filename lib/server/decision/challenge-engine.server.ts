import "server-only";

/**
 * Challenge Engine — server-only decision quality interrogation.
 *
 * Detects weak, vague, contradictory, or avoidant inputs and returns
 * specific challenge text that forces the user to clarify before proceeding.
 *
 * Rules:
 * - No scores, thresholds, signal names, or engine modes exposed
 * - Challenge text must be specific to the user's input
 * - When shield status is degraded, reduce specificity
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type ChallengeSeverity = "none" | "clarify" | "challenge" | "block";

export type ChallengeType =
  | "vague_decision"
  | "missing_owner"
  | "shared_authority"
  | "weak_consequence"
  | "contradiction"
  | "avoidance_language"
  | "no_action_commitment"
  | "insufficient_evidence";

export type ChallengeResult = {
  severity: ChallengeSeverity;
  type?: ChallengeType;
  challengeText?: string;
  clarificationPrompt?: string;
  suggestedOptions?: string[];
  canProceed: boolean;
};

export type ChallengeInput = {
  assessmentType: "fast" | "purpose" | "team" | "enterprise" | "executive";
  stage: string;
  answers: Record<string, unknown>;
};

export type AssessmentIntegritySignal = {
  shouldDegrade: boolean;
  reasons: Array<"identical_patterns" | "extreme_uniformity" | "unnatural_timing">;
};

// ─── Detection helpers ───────────────────────────────────────────────────────

const VAGUE_PATTERNS = [
  /^(grow|improve|fix|increase|decrease|optimise|optimize|enhance|develop|strengthen|build|expand)\b/i,
  /^be\s+(more|less|better)\b/i,
  /^(make|get)\s+(things?|it|the\s+team|the\s+business)\s+(better|right|working|sorted)/i,
  /^(sort\s+out|deal\s+with|address|tackle|handle)\b/i,
];

const AVOIDANCE_WORDS = [
  "maybe",
  "hopefully",
  "trying to",
  "waiting for",
  "not sure",
  "we'll see",
  "eventually",
  "at some point",
  "when the time is right",
  "if possible",
  "might",
  "perhaps",
  "could potentially",
];

const SHARED_OWNER_PATTERNS = [
  /^(the\s+)?team$/i,
  /^everyone$/i,
  /^(the\s+)?leadership$/i,
  /^(a\s+)?committee$/i,
  /^(the\s+)?board$/i,
  /^(the\s+)?group$/i,
  /^we\s+(all|collectively)/i,
  /^shared$/i,
  /^joint(ly)?$/i,
  /^no\s*one$/i,
  /^unclear$/i,
  /^(not\s+)?sure$/i,
  /^(it'?s\s+)?complicated$/i,
];

const DECISION_OPTIONS = [
  "hire",
  "stop",
  "restructure",
  "invest",
  "exit",
  "delegate",
  "prioritise",
  "escalate",
];

function extractText(answers: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = answers[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return "";
}

function containsAvoidance(text: string): string | null {
  const lower = text.toLowerCase();
  for (const word of AVOIDANCE_WORDS) {
    if (lower.includes(word)) {
      return word;
    }
  }
  return null;
}

function isVague(text: string): boolean {
  if (text.length < 15) return true;
  return VAGUE_PATTERNS.some((pattern) => pattern.test(text.trim()));
}

function isSharedOwner(text: string): boolean {
  return SHARED_OWNER_PATTERNS.some((pattern) => pattern.test(text.trim()));
}

function isWeakConsequence(text: string): boolean {
  if (!text || text.length < 30) return true;
  const lower = text.toLowerCase();
  const weakPhrases = [
    "things will get worse",
    "it won't be good",
    "problems will continue",
    "it will be bad",
    "nothing will change",
    "more of the same",
    "things will stay the same",
  ];
  return weakPhrases.some((phrase) => lower.includes(phrase));
}

function detectTextContradiction(
  decision: string,
  blocker: string,
  consequence: string,
  urgency: string,
): { found: boolean; challengeText: string } {
  const hasDecision = decision.length > 10;
  const hasBlocker = blocker.length > 10;

  if (hasDecision && hasBlocker) {
    return {
      found: true,
      challengeText: `You said the decision is to ${truncate(decision, 80)}, but the blocker is ${truncate(blocker, 80)}. ${truncate(decision, 40)} cannot proceed until ${truncate(blocker, 40)} is resolved. Resolve this contradiction before continuing.`,
    };
  }

  if (hasDecision && urgency.length > 5 && !blocker) {
    return {
      found: true,
      challengeText: `You describe urgency: ${truncate(urgency, 60)}. But no blocker has been named. If the decision is urgent and unblocked, it should already have been made. What is preventing action?`,
    };
  }

  return { found: false, challengeText: "" };
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + "\u2026";
}

// ─── No-challenge result ─────────────────────────────────────────────────────

const PASS: ChallengeResult = { severity: "none", canProceed: true };

// ─── Degraded mode (shield flagged) ─────────────────────────────────────────

function degradeChallenge(result: ChallengeResult): ChallengeResult {
  if (result.severity === "none") return result;
  return {
    severity: result.severity,
    type: result.type,
    challengeText: "This answer requires further clarification before proceeding.",
    clarificationPrompt: "Please revise your answer to be more specific.",
    canProceed: result.severity !== "block",
  };
}

// ─── Stage-specific detectors ────────────────────────────────────────────────

function detectVagueDecision(text: string): ChallengeResult {
  if (!text) {
    return {
      severity: "block",
      type: "vague_decision",
      challengeText: "No decision has been entered.",
      clarificationPrompt: "What exactly must be decided?",
      suggestedOptions: DECISION_OPTIONS,
      canProceed: false,
    };
  }

  if (isVague(text)) {
    return {
      severity: "challenge",
      type: "vague_decision",
      challengeText: `"${truncate(text, 60)}" is not yet a decision. What exactly must be decided?`,
      clarificationPrompt: "Name the specific choice that must be made.",
      suggestedOptions: DECISION_OPTIONS,
      canProceed: false,
    };
  }

  return PASS;
}

function detectAvoidanceLanguage(text: string): ChallengeResult {
  const found = containsAvoidance(text);
  if (!found) return PASS;

  return {
    severity: "clarify",
    type: "avoidance_language",
    challengeText: `This answer contains hesitation language: "${found}". This signals that the decision has not been committed.`,
    clarificationPrompt: "What must become true before you are willing to act?",
    canProceed: true,
  };
}

function detectMissingOwner(text: string): ChallengeResult {
  if (!text || text.trim().length === 0) {
    return {
      severity: "challenge",
      type: "missing_owner",
      challengeText:
        "This decision has no clear authority. A decision without ownership will become discussion.",
      clarificationPrompt: "Who has the power to make this binding?",
      canProceed: false,
    };
  }

  return PASS;
}

function detectSharedAuthority(text: string): ChallengeResult {
  if (isSharedOwner(text)) {
    return {
      severity: "clarify",
      type: "shared_authority",
      challengeText:
        "Shared ownership may explain the delay. When authority is distributed, decisions are deferred.",
      clarificationPrompt: "Who has final authority if others disagree?",
      canProceed: true,
    };
  }

  return PASS;
}

function detectWeakConsequence(text: string): ChallengeResult {
  if (isWeakConsequence(text)) {
    return {
      severity: "clarify",
      type: "weak_consequence",
      challengeText:
        "That consequence is not concrete enough to price risk.",
      clarificationPrompt:
        "What becomes measurably worse if this remains unresolved?",
      canProceed: true,
    };
  }

  return PASS;
}

function detectNoActionCommitment(text: string): ChallengeResult {
  if (!text || text.trim().length < 10) {
    return {
      severity: "challenge",
      type: "no_action_commitment",
      challengeText:
        "No action has been committed. A decision without a first move is not yet a decision.",
      clarificationPrompt: "What is the first irreversible step?",
      canProceed: false,
    };
  }

  return PASS;
}

function detectInsufficientEvidence(text: string, minLength: number): ChallengeResult {
  if (!text || text.trim().length < minLength) {
    return {
      severity: "clarify",
      type: "insufficient_evidence",
      challengeText:
        "This answer does not contain enough detail to proceed with confidence.",
      clarificationPrompt: "Provide more specific information before continuing.",
      canProceed: true,
    };
  }

  return PASS;
}

// ─── Assessment-specific evaluation ──────────────────────────────────────────

function evaluateFast(stage: string, answers: Record<string, unknown>): ChallengeResult {
  if (stage === "decision_input" || stage === "first_input") {
    const decision = extractText(answers, "decision", "decisionQuestion", "problemStatement", "structuralProblem");
    const vagueResult = detectVagueDecision(decision);
    if (vagueResult.severity !== "none") return vagueResult;
    return detectAvoidanceLanguage(decision);
  }

  if (stage === "ownership") {
    const owner = extractText(answers, "owner", "decisionOwner", "authorityScope", "sponsorNameOrSeat");
    const missingResult = detectMissingOwner(owner);
    if (missingResult.severity !== "none") return missingResult;
    return detectSharedAuthority(owner);
  }

  if (stage === "pre_result") {
    const decision = extractText(answers, "decision", "decisionQuestion", "problemStatement");
    const blocker = extractText(answers, "blocker", "currentConstraint", "priorAttempts");
    const consequence = extractText(answers, "consequence", "whatHappensIfNothingChanges");
    const urgency = extractText(answers, "urgency", "whyNow");

    const contradictionResult = detectTextContradiction(decision, blocker, consequence, urgency);
    if (contradictionResult.found) {
      return {
        severity: "challenge",
        type: "contradiction",
        challengeText: contradictionResult.challengeText,
        clarificationPrompt: "Resolve this before continuing.",
        canProceed: false,
      };
    }

    return detectWeakConsequence(consequence);
  }

  return PASS;
}

function evaluatePurpose(stage: string, answers: Record<string, unknown>): ChallengeResult {
  if (stage === "stated_purpose" || stage === "decision_input") {
    const purpose = extractText(answers, "avoidedDecision", "purpose", "decision");
    if (!purpose) return PASS;

    const vagueResult = detectVagueDecision(purpose);
    if (vagueResult.severity !== "none") {
      return {
        ...vagueResult,
        challengeText: `"${truncate(purpose, 60)}" is a direction, not a decision. What must you actually choose?`,
        suggestedOptions: ["commit", "exit", "confront", "defer", "restructure", "accept"],
      };
    }

    return detectAvoidanceLanguage(purpose);
  }

  if (stage === "blocker" || stage === "competing_obligation") {
    const decision = extractText(answers, "avoidedDecision", "decision");
    const blocker = extractText(answers, "blocker", "competingObligation", "competing");
    if (decision && blocker) {
      return {
        severity: "challenge",
        type: "contradiction",
        challengeText: `You are trying to preserve both outcomes. "${truncate(decision, 50)}" and "${truncate(blocker, 50)}" cannot both hold. Which one takes priority?`,
        clarificationPrompt: "Select the outcome that takes precedence.",
        canProceed: false,
      };
    }

    return PASS;
  }

  if (stage === "pre_result") {
    const consequence = extractText(answers, "consequence", "whatHappensIfNothingChanges");
    const weakResult = detectWeakConsequence(consequence);
    if (weakResult.severity !== "none") return weakResult;

    const action = extractText(answers, "action", "commitment", "firstStep");
    return detectNoActionCommitment(action);
  }

  return PASS;
}

function evaluateTeam(stage: string, answers: Record<string, unknown>): ChallengeResult {
  if (stage === "team_issue" || stage === "first_input") {
    const issue = extractText(answers, "issue", "teamIssue", "problemStatement", "notes");
    if (!issue) return PASS;

    if (isVague(issue)) {
      return {
        severity: "challenge",
        type: "vague_decision",
        challengeText: `"${truncate(issue, 60)}" describes symptoms, not the decision that must be made.`,
        clarificationPrompt: "What decision is the team avoiding?",
        canProceed: false,
      };
    }

    return detectAvoidanceLanguage(issue);
  }

  if (stage === "ownership") {
    const owner = extractText(answers, "owner", "decisionOwner", "teamLead");
    const missingResult = detectMissingOwner(owner);
    if (missingResult.severity !== "none") {
      return {
        ...missingResult,
        clarificationPrompt: "If everyone owns it, no one can enforce it. Who owns the next execution cycle?",
      };
    }

    return detectSharedAuthority(owner);
  }

  if (stage === "pre_result") {
    const falseAssumption = extractText(answers, "falseAssumption");
    const showScoresReaction = extractText(answers, "showScoresReaction");

    if (falseAssumption && showScoresReaction) {
      const lower = showScoresReaction.toLowerCase();
      if (lower.includes("agree") || lower.includes("accept") || lower.includes("no issue")) {
        return {
          severity: "clarify",
          type: "contradiction",
          challengeText:
            "Your answers suggest the team agrees publicly but may execute privately. Confirm this reading or revise.",
          clarificationPrompt: "Is the stated agreement reflected in actual execution?",
          canProceed: true,
        };
      }
    }

    return PASS;
  }

  return PASS;
}

function evaluateEnterprise(stage: string, answers: Record<string, unknown>): ChallengeResult {
  if (stage === "enterprise_problem" || stage === "first_input") {
    const problem = extractText(answers, "recentDecision", "problemStatement", "issue");
    if (!problem) return PASS;

    const evidenceResult = detectInsufficientEvidence(problem, 80);
    if (evidenceResult.severity !== "none") return evidenceResult;

    if (isVague(problem)) {
      return {
        severity: "challenge",
        type: "vague_decision",
        challengeText:
          "This is framed as complexity. What decision-control issue sits underneath it?",
        clarificationPrompt: "Name the governance or authority problem that drives this.",
        canProceed: false,
      };
    }

    return PASS;
  }

  if (stage === "governance" || stage === "authority") {
    const authority = extractText(answers, "authority", "executiveAuthority", "sponsor");
    const missingResult = detectMissingOwner(authority);
    if (missingResult.severity !== "none") {
      return {
        ...missingResult,
        challengeText:
          "Growth has exceeded decision discipline.",
        clarificationPrompt:
          "Which executive authority can stop, redirect, or enforce the next move?",
      };
    }

    return detectSharedAuthority(authority);
  }

  if (stage === "pre_result") {
    const consequence = extractText(answers, "consequence", "whatHappensIfNothingChanges", "exposure");
    if (!consequence || consequence.length < 20) {
      return {
        severity: "clarify",
        type: "weak_consequence",
        challengeText:
          "You are describing expansion without naming the control mechanism.",
        clarificationPrompt: "Identify the control mechanism before proceeding.",
        canProceed: true,
      };
    }

    return detectWeakConsequence(consequence);
  }

  return PASS;
}

function evaluateExecutive(stage: string, answers: Record<string, unknown>): ChallengeResult {
  if (stage === "decision_context" || stage === "first_input") {
    const decision = extractText(answers, "decisionQuestion", "decision", "problemStatement");
    if (!decision || isVague(decision)) {
      return {
        severity: "challenge",
        type: "vague_decision",
        challengeText:
          "This is not yet report-ready. A problem statement is not a decision question.",
        clarificationPrompt:
          "What is the decision question the report must answer?",
        canProceed: false,
      };
    }

    return detectAvoidanceLanguage(decision);
  }

  if (stage === "authority") {
    const sponsor = extractText(answers, "sponsorNameOrSeat", "sponsor", "authority");
    const boardInvolved = extractText(answers, "boardInvolved");

    if (!sponsor || sponsor.length < 3) {
      return {
        severity: "challenge",
        type: "missing_owner",
        challengeText:
          "Executive reporting requires authority context. A report without a named sponsor cannot drive action.",
        clarificationPrompt: "Who can act on this report?",
        canProceed: false,
      };
    }

    if (boardInvolved === "UNCERTAIN") {
      return {
        severity: "clarify",
        type: "insufficient_evidence",
        challengeText:
          "Board involvement is unclear. The report scope depends on whether this reaches governance level.",
        clarificationPrompt: "Confirm whether the board is involved or not.",
        canProceed: true,
      };
    }

    return PASS;
  }

  if (stage === "exposure") {
    const consequence = extractText(answers, "whatHappensIfNothingChanges", "consequence", "exposure");
    const weakResult = detectWeakConsequence(consequence);
    if (weakResult.severity !== "none") {
      return {
        ...weakResult,
        challengeText:
          "The exposure is not concrete enough. Generic risk language does not produce actionable reporting.",
        clarificationPrompt:
          "What becomes worse in 90 days if this remains unresolved?",
      };
    }

    return PASS;
  }

  if (stage === "pre_payment" || stage === "pre_result") {
    const commitment = extractText(answers, "commitment", "action", "willingness");
    if (!commitment || commitment.length < 10) {
      return {
        severity: "challenge",
        type: "no_action_commitment",
        challengeText:
          "This report should not proceed unless there is willingness to act on a material finding.",
        clarificationPrompt:
          "Confirm commitment to act before generating the report.",
        canProceed: false,
      };
    }

    return PASS;
  }

  return PASS;
}

// ─── Main dispatcher ─────────────────────────────────────────────────────────

export function evaluateChallenge(
  input: ChallengeInput,
  shieldStatus: "full" | "degraded" = "full",
): ChallengeResult {
  let result: ChallengeResult;

  switch (input.assessmentType) {
    case "fast":
      result = evaluateFast(input.stage, input.answers);
      break;
    case "purpose":
      result = evaluatePurpose(input.stage, input.answers);
      break;
    case "team":
      result = evaluateTeam(input.stage, input.answers);
      break;
    case "enterprise":
      result = evaluateEnterprise(input.stage, input.answers);
      break;
    case "executive":
      result = evaluateExecutive(input.stage, input.answers);
      break;
    default:
      result = PASS;
  }

  if (shieldStatus === "degraded" && result.severity !== "none") {
    return degradeChallenge(result);
  }

  return result;
}

export function detectAssessmentIntegrity(params: {
  answers: Record<string, { resonance: number; certainty: number }>;
  startedAt?: string | null;
  submittedAt?: string | null;
}): AssessmentIntegritySignal {
  const values = Object.values(params.answers);
  const reasons: AssessmentIntegritySignal["reasons"] = [];

  if (values.length === 0) {
    return { shouldDegrade: false, reasons };
  }

  const identicalPairs = new Set(values.map((answer) => `${answer.resonance}:${answer.certainty}`));
  if (identicalPairs.size <= 2) {
    reasons.push("identical_patterns");
  }

  const resonanceSpread = Math.max(...values.map((answer) => answer.resonance)) -
    Math.min(...values.map((answer) => answer.resonance));
  const certaintySpread = Math.max(...values.map((answer) => answer.certainty)) -
    Math.min(...values.map((answer) => answer.certainty));
  const extremeCount = values.filter(
    (answer) =>
      (answer.resonance === 0 || answer.resonance === 10) &&
      (answer.certainty === 0 || answer.certainty === 10),
  ).length;

  if ((resonanceSpread <= 1 && certaintySpread <= 1) || extremeCount >= Math.ceil(values.length * 0.7)) {
    reasons.push("extreme_uniformity");
  }

  if (params.startedAt && params.submittedAt) {
    const started = Date.parse(params.startedAt);
    const submitted = Date.parse(params.submittedAt);

    if (Number.isFinite(started) && Number.isFinite(submitted)) {
      const elapsedMs = submitted - started;
      const msPerResponse = elapsedMs / values.length;

      if (elapsedMs > 0 && msPerResponse < 900) {
        reasons.push("unnatural_timing");
      }
    }
  }

  return {
    shouldDegrade: reasons.length >= 2,
    reasons,
  };
}
