/**
 * lib/living-intelligence/evidence-posture-engine.ts
 *
 * Classifies every finding with an evidence posture.
 * Rules:
 *   - Do not claim certainty from regex alone.
 *   - Do not mark behaviour broken unless source evidence is strong.
 *   - If code pattern is ambiguous, mark `needs_human_review`.
 *   - Every blocker must include direct file/line or structured evidence.
 *   - Every warning must explain what would prove or falsify it.
 */

import type { EvidencePosture } from "./product-doctrine-contract";

export type PosturedFinding = {
  id: string;
  title: string;
  description: string;
  posture: EvidencePosture;
  /** What would prove this finding correct */
  falsificationCondition?: string;
  /** What would prove this finding wrong */
  verificationCondition?: string;
  /** Direct file/line evidence */
  evidence: string[];
  /** Whether this blocks deployment */
  blocksDeployment: boolean;
};

/**
 * Classify a finding's evidence posture based on available evidence.
 */
export function classifyPosture(params: {
  directEvidence: boolean;
  regexEvidence: boolean;
  patternAmbiguous: boolean;
  sourceCodeConfirmed: boolean;
  staleDays?: number;
}): EvidencePosture {
  if (params.directEvidence && params.sourceCodeConfirmed) return "verified";
  if (params.directEvidence && !params.patternAmbiguous) return "strongly_indicated";
  if (params.regexEvidence && !params.patternAmbiguous) return "weakly_indicated";
  if (params.regexEvidence && params.patternAmbiguous) return "inferred";
  if (params.staleDays && params.staleDays > 90) return "stale";
  if (params.patternAmbiguous) return "needs_human_review";
  return "unverified";
}

/**
 * Create a postured finding with falsification/verification conditions.
 */
export function createPosturedFinding(params: {
  id: string;
  title: string;
  description: string;
  posture: EvidencePosture;
  evidence: string[];
  blocksDeployment?: boolean;
}): PosturedFinding {
  const finding: PosturedFinding = {
    id: params.id,
    title: params.title,
    description: params.description,
    posture: params.posture,
    evidence: params.evidence,
    blocksDeployment: params.blocksDeployment ?? false,
  };

  // Add falsification/verification conditions based on posture
  switch (params.posture) {
    case "verified":
      finding.falsificationCondition = "Would be falsified if source code changes or if runtime behaviour contradicts the pattern.";
      break;
    case "strongly_indicated":
      finding.falsificationCondition = "Would be falsified if direct evidence cannot be produced on request.";
      finding.verificationCondition = "Would be verified by confirming runtime behaviour matches code pattern.";
      break;
    case "weakly_indicated":
      finding.falsificationCondition = "Pattern alone is insufficient. Would be falsified by counterexample in runtime behaviour.";
      finding.verificationCondition = "Would be strengthened by direct source evidence or runtime confirmation.";
      break;
    case "inferred":
      finding.falsificationCondition = "Inference only. Would be falsified by any contradictory evidence.";
      finding.verificationCondition = "Would be strengthened by direct evidence or confirmed pattern match.";
      break;
    case "needs_human_review":
      finding.verificationCondition = "Human review required to determine actual behaviour.";
      break;
    case "contradictory":
      finding.falsificationCondition = "Contradictory evidence exists. Would be resolved when sources agree.";
      break;
    case "stale":
      finding.verificationCondition = "Last checked more than 90 days ago. Re-verify before acting on this finding.";
      break;
  }

  return finding;
}
