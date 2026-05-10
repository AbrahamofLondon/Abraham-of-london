/**
 * Board Brief Builder — governed instrument engine.
 *
 * Turns a decision record into a board-ready structured brief with
 * risks, objections, evidence posture, and recommended decision posture.
 *
 * This is a premium instrument. Output must be board-presentation grade.
 *
 * Deterministic. Same input → same output.
 */
import { evaluateDecision, type DecisionKernelOutput } from "@/lib/decision/kernel";

export type BoardBriefInput = {
  decisionStatement: string;
  strategicContext: string;
  recommendedDecision: string;
  knownObjections: string[];
  financialExposure: number; // 0-10
  consequenceExposure: number; // 0-10
  evidenceAvailable: number; // 0-10
  authorityClarity: number; // 0-10
  urgency: number; // 0-10
};

export type BoardBriefResult = {
  briefReadiness: "NOT_READY" | "DRAFT" | "REVIEW_READY" | "BOARD_READY";
  readinessScore: number; // 0-100
  decisionPosture: "APPROVE" | "DEFER" | "REJECT" | "ESCALATE" | "INSUFFICIENT_EVIDENCE";
  objectionHandling: Array<{ objection: string; response: string; evidenceBasis: string }>;
  evidenceGaps: string[];
  boardroomReadinessSignal: string;
  executiveSummary: string;
  recommendation: string;
  decisionKernel: DecisionKernelOutput;
  deterministic: true;
  version: "1.0";
};

function clamp(v: number): number {
  return Math.max(0, Math.min(10, Math.round(v)));
}

export function buildBoardBrief(input: BoardBriefInput): BoardBriefResult {
  const financial = clamp(input.financialExposure);
  const consequence = clamp(input.consequenceExposure);
  const evidence = clamp(input.evidenceAvailable);
  const authority = clamp(input.authorityClarity);
  const urgency = clamp(input.urgency);

  // Readiness score: evidence + authority weight heavily for board readiness
  const readinessScore = Math.round(
    evidence * 0.30 * 10 + authority * 0.25 * 10 + (10 - financial) * 0.15 * 10 + urgency * 0.15 * 10 + consequence * 0.15 * 10,
  );

  const briefReadiness: BoardBriefResult["briefReadiness"] =
    readinessScore >= 75 ? "BOARD_READY"
    : readinessScore >= 55 ? "REVIEW_READY"
    : readinessScore >= 35 ? "DRAFT"
    : "NOT_READY";

  // Decision posture
  const decisionPosture: BoardBriefResult["decisionPosture"] =
    evidence < 3 ? "INSUFFICIENT_EVIDENCE"
    : urgency >= 8 && consequence >= 7 ? "APPROVE"
    : authority < 4 ? "ESCALATE"
    : financial >= 8 && evidence < 6 ? "DEFER"
    : readinessScore >= 60 ? "APPROVE"
    : "DEFER";

  // Objection handling
  const objectionHandling = input.knownObjections.filter((o) => o.trim()).map((objection) => ({
    objection,
    response: generateObjectionResponse(objection, { financial, consequence, evidence, authority, urgency }),
    evidenceBasis: evidence >= 7
      ? "Supported by available evidence"
      : evidence >= 4
        ? "Partially supported — additional evidence would strengthen this position"
        : "Evidence is insufficient to fully counter this objection",
  }));

  // Evidence gaps
  const evidenceGaps: string[] = [];
  if (evidence < 5) evidenceGaps.push("Decision evidence is below the threshold for confident board recommendation.");
  if (authority < 4) evidenceGaps.push("Authority clarity is weak — the board may ask who actually owns this decision.");
  if (financial >= 7 && evidence < 6) evidenceGaps.push("High financial exposure without proportionate evidence. The board will question the basis.");
  if (input.knownObjections.length === 0) evidenceGaps.push("No objections have been anticipated. The board will raise them — prepare responses.");

  const boardroomReadinessSignal = briefReadiness === "BOARD_READY"
    ? "This brief is ready for board presentation. Evidence and authority support the recommended posture."
    : briefReadiness === "REVIEW_READY"
      ? "This brief requires one more review cycle before board presentation. Key gaps have been identified."
      : briefReadiness === "DRAFT"
        ? "This brief is in draft state. Material gaps remain — do not present to the board without addressing them."
        : "This brief is not ready for board presentation. Fundamental evidence or authority gaps must be resolved.";

  const executiveSummary = `Decision: "${input.decisionStatement.slice(0, 100)}". `
    + `Recommended posture: ${decisionPosture.replace(/_/g, " ").toLowerCase()}. `
    + `Evidence strength: ${evidence}/10. Authority clarity: ${authority}/10. `
    + `Financial exposure: ${financial}/10. `
    + (evidenceGaps.length > 0 ? `${evidenceGaps.length} evidence gap${evidenceGaps.length !== 1 ? "s" : ""} identified.` : "No material evidence gaps.");

  const recommendation = briefReadiness === "BOARD_READY"
    ? `Board brief is ready. ${decisionPosture === "APPROVE" ? "Recommend approval" : decisionPosture === "DEFER" ? "Recommend deferral pending additional evidence" : "Recommend escalation"}. Present with objection responses prepared.`
    : `Board brief is ${briefReadiness.replace(/_/g, " ").toLowerCase()}. ${evidenceGaps[0] ?? "Address identified gaps before presentation."}`;

  const decisionKernel = evaluateDecision({
    id: `board-brief:${readinessScore}`,
    source: "strategy_room",
    condition: `board brief ${briefReadiness.replace(/_/g, " ").toLowerCase()} — readiness ${readinessScore}/100`,
    decisionRequired: recommendation,
    evidenceChain: [
      { inputSource: "board_brief_builder", observedPattern: `Evidence available: ${evidence}/10`, weight: 0.3, explanation: "Board readiness depends primarily on evidence quality." },
      { inputSource: "board_brief_builder", observedPattern: `Authority clarity: ${authority}/10`, weight: 0.25, explanation: "Board needs clear authority chain." },
      { inputSource: "board_brief_builder", observedPattern: `Financial exposure: ${financial}/10`, weight: 0.15, explanation: "Board evaluates financial risk." },
      { inputSource: "board_brief_builder", observedPattern: `Urgency: ${urgency}/10`, weight: 0.15, explanation: "Urgency affects decision timeline." },
      { inputSource: "board_brief_builder", observedPattern: `Consequence: ${consequence}/10`, weight: 0.15, explanation: "Consequence of inaction shapes posture." },
    ],
    internalContradictions: evidenceGaps.slice(0, 2),
    scores: { evidence: evidence * 10, authority: authority * 10, financial: financial * 10, urgency: urgency * 10, consequence: consequence * 10 },
    signalStrength: readinessScore >= 60 ? "STRONG" : readinessScore >= 40 ? "MODERATE" : "WEAK",
    sources: [{ type: "system_computed" as const, count: 1 }],
    expectedOutcome: boardroomReadinessSignal,
  });

  return {
    briefReadiness,
    readinessScore,
    decisionPosture,
    objectionHandling,
    evidenceGaps,
    boardroomReadinessSignal,
    executiveSummary,
    recommendation,
    decisionKernel,
    deterministic: true,
    version: "1.0",
  };
}

function generateObjectionResponse(
  objection: string,
  scores: { financial: number; consequence: number; evidence: number; authority: number; urgency: number },
): string {
  const lower = objection.toLowerCase();
  if (/cost|expensive|budget|afford/i.test(lower)) {
    return scores.consequence >= 6
      ? "The cost of inaction exceeds the cost of action. Delay compounds financial exposure."
      : "Cost concerns are noted. However, the current evidence does not support indefinite deferral.";
  }
  if (/risk|dangerous|uncertain/i.test(lower)) {
    return scores.evidence >= 6
      ? "Risk is acknowledged and has been measured. The evidence supports proceeding with governance."
      : "Risk is real but the greater risk is making this decision without sufficient evidence. Recommend evidence strengthening before commitment.";
  }
  if (/authority|who decides|approval/i.test(lower)) {
    return scores.authority >= 6
      ? "Authority chain is clear. The decision owner has been identified and empowered."
      : "Authority requires clarification before the board can approve. This is an addressable gap, not a reason to defer the decision itself.";
  }
  if (/timing|too soon|wait|not ready/i.test(lower)) {
    return scores.urgency >= 7
      ? "Waiting is itself a decision. The current urgency level indicates that delay has material cost."
      : "Timing concerns are valid. The recommendation accounts for current evidence and does not claim urgency where none exists.";
  }
  return "This objection has been noted. The recommended posture accounts for known concerns. Additional evidence may strengthen or modify this response.";
}
