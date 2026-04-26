/**
 * Mandate Clarity Framework — authority classification engine.
 *
 * 4 scoring blocks, 17 structured inputs.
 * Auto-calculated clarity score (0-100).
 * Authority type: DIRECT / PROXY / UNCLEAR.
 * Deterministic. Same input → same output.
 */

export type AuthorityType = "DIRECT" | "PROXY" | "UNCLEAR";

export type MandateBlock = "ownership" | "scope" | "accountability" | "delegation";

export type MandateInput = {
  // Block 1: Ownership (who decides)
  ownerNamed: boolean;
  ownerKnowsTheyOwn: boolean;
  ownerHasAuthority: boolean;
  ownerActsWithoutEscalation: boolean;

  // Block 2: Scope (what is being decided)
  decisionDefined: boolean;
  outcomeMeasurable: boolean;
  stakeholdersAligned: boolean;
  boundariesClear: boolean;
  timelineDefined: boolean;

  // Block 3: Accountability (who answers for outcome)
  consequencesDefined: boolean;
  failureOwned: boolean;
  reportingClear: boolean;
  escalationPathExists: boolean;

  // Block 4: Delegation (how authority flows)
  delegationExplicit: boolean;
  delegateHasCapability: boolean;
  overrideProtocol: boolean;
  informationFlowClear: boolean;
};

export type MandateResult = {
  clarityScore: number;
  authorityType: AuthorityType;
  blockScores: Record<MandateBlock, { score: number; max: number; pct: number }>;
  misalignmentFlags: string[];
  decisionRiskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  recommendation: string;
  deterministic: true;
  version: "1.0";
};

const BLOCK_FIELDS: Record<MandateBlock, (keyof MandateInput)[]> = {
  ownership: ["ownerNamed", "ownerKnowsTheyOwn", "ownerHasAuthority", "ownerActsWithoutEscalation"],
  scope: ["decisionDefined", "outcomeMeasurable", "stakeholdersAligned", "boundariesClear", "timelineDefined"],
  accountability: ["consequencesDefined", "failureOwned", "reportingClear", "escalationPathExists"],
  delegation: ["delegationExplicit", "delegateHasCapability", "overrideProtocol", "informationFlowClear"],
};

const BLOCK_WEIGHTS: Record<MandateBlock, number> = {
  ownership: 0.35,
  scope: 0.25,
  accountability: 0.25,
  delegation: 0.15,
};

export function scoreMandateClarity(input: MandateInput): MandateResult {
  const blockScores: Record<MandateBlock, { score: number; max: number; pct: number }> = {} as any;
  let composite = 0;
  const flags: string[] = [];

  for (const block of Object.keys(BLOCK_FIELDS) as MandateBlock[]) {
    const fields = BLOCK_FIELDS[block];
    const max = fields.length;
    const score = fields.filter((f) => input[f]).length;
    const pct = max > 0 ? Math.round((score / max) * 100) : 0;
    blockScores[block] = { score, max, pct };
    composite += pct * BLOCK_WEIGHTS[block];
  }

  const clarityScore = Math.round(composite);

  // Authority type classification
  let authorityType: AuthorityType;
  if (input.ownerNamed && input.ownerHasAuthority && input.ownerActsWithoutEscalation) {
    authorityType = "DIRECT";
  } else if (input.ownerNamed && (!input.ownerHasAuthority || !input.ownerActsWithoutEscalation)) {
    authorityType = "PROXY";
  } else {
    authorityType = "UNCLEAR";
  }

  // Misalignment flags
  if (input.ownerNamed && !input.ownerKnowsTheyOwn) flags.push("Owner named but does not know they own the decision");
  if (input.ownerHasAuthority && !input.ownerActsWithoutEscalation) flags.push("Has authority but requires escalation to act");
  if (input.decisionDefined && !input.outcomeMeasurable) flags.push("Decision defined but outcome is not measurable");
  if (input.consequencesDefined && !input.failureOwned) flags.push("Consequences defined but failure is not owned");
  if (input.delegationExplicit && !input.delegateHasCapability) flags.push("Delegation explicit but delegate lacks capability");
  if (!input.stakeholdersAligned && input.decisionDefined) flags.push("Decision defined but stakeholders not aligned on outcome");

  const risk: MandateResult["decisionRiskLevel"] =
    clarityScore >= 75 ? "LOW" : clarityScore >= 50 ? "MODERATE" : clarityScore >= 30 ? "HIGH" : "CRITICAL";

  const recs: Record<MandateResult["decisionRiskLevel"], string> = {
    LOW: "Authority structure is clear. Decision can proceed under current mandate.",
    MODERATE: "Authority is partially defined. Clarify ownership gaps before execution.",
    HIGH: `Authority is fragmented. ${flags[0] ?? "Multiple misalignment flags active"}. Mandate must be re-established before decision execution.`,
    CRITICAL: "Authority is unclear across most dimensions. This decision will fail under current mandate structure. Full authority reconstitution required.",
  };

  return {
    clarityScore,
    authorityType,
    blockScores,
    misalignmentFlags: flags,
    decisionRiskLevel: risk,
    recommendation: recs[risk],
    deterministic: true,
    version: "1.0",
  };
}
