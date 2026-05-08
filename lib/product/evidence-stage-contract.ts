/**
 * lib/product/evidence-stage-contract.ts — Canonical evidence stage types.
 *
 * Domain truth for evidence tier levels, stage status, and stage entries.
 * UI components import from here. Domain contracts import from here.
 * No server/API/data contract should import types from a UI component.
 */

export type EvidenceTierLevel =
  | "insufficient"
  | "single_source"
  | "multi_source"
  | "outcome_verified"
  | "human_reviewed";

export type StageStatus =
  | "completed"
  | "not_started"
  | "pending"
  | "not_applicable";

export type StageEntry = {
  key: string;
  label: string;
  status: StageStatus;
  /** What this stage contributed if completed — bespoke to the case */
  contribution?: string | null;
};

/**
 * Derive evidence tier from completed stage count.
 * Canonical derivation — reusable by any domain consumer.
 */
export function deriveEvidenceTierFromStages(stageCount: number): EvidenceTierLevel {
  if (stageCount >= 4) return "multi_source";
  if (stageCount >= 2) return "multi_source";
  if (stageCount >= 1) return "single_source";
  return "insufficient";
}
