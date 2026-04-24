/**
 * Contradiction Engine — deterministic contradiction detection.
 *
 * Fixed language per contradiction. No templates. No variation.
 */

export type ContradictionKey =
  | "URGENCY_VS_OWNERSHIP"
  | "CLARITY_VS_ACCOUNTABILITY"
  | "URGENCY_VS_STATE";

export type DiagnosticInput = {
  urgency: number;
  ownershipScore: number;
  stateScore: number;
  clarityScore: number;
  accountabilityScore: number;
};

export type ContradictionDefinition = {
  key: ContradictionKey;
  condition: (input: DiagnosticInput) => boolean;
  message: (input: DiagnosticInput) => string;
};

export const CONTRADICTIONS: ContradictionDefinition[] = [
  {
    key: "URGENCY_VS_OWNERSHIP",
    condition: (i) => i.urgency >= 3 && i.ownershipScore >= 3,
    message: () => "High urgency combined with unclear ownership typically results in decisions being made by whoever acts first.",
  },
  {
    key: "CLARITY_VS_ACCOUNTABILITY",
    condition: (i) => i.clarityScore >= 3 && i.accountabilityScore >= 3,
    message: () => "A defined decision without clear accountability usually fails during execution.",
  },
  {
    key: "URGENCY_VS_STATE",
    condition: (i) => i.urgency >= 3 && i.stateScore >= 3,
    message: () => "Urgent decisions that are repeatedly deferred typically become more complex and constrained.",
  },
];
