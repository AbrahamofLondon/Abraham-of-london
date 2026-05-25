/**
 * lib/platform/product-spine-contract.ts
 *
 * Core product spine contract.
 * Every product surface must answer these questions.
 */

import type { AdminDomain } from "./admin-domain-registry";
import type { CanonicalRecordType, SurfaceType, PublicStatus } from "./product-ladder-registry";

/**
 * The seven questions every product surface must answer.
 */
export type ProductSpineAnswers = {
  /** What record does it create? */
  record: CanonicalRecordType;
  /** What admin surface sees it? */
  adminSurface: string;
  /** What Foundry module can test it? */
  foundryModule?: string;
  /** What audit/lineage event does it emit? */
  events: string[];
  /** What entitlement governs it? */
  entitlement?: string;
  /** What outbound/content pathway can surface it? */
  outboundEligible: boolean;
  /** What ResearchRun can improve it? */
  researchRunEligible: boolean;
  /** What happens if it fails? */
  failureMode: string;
};

/**
 * Validate that a product surface has complete spine answers.
 * Returns missing fields as strings.
 */
export function validateSpineAnswers(answers: ProductSpineAnswers): string[] {
  const missing: string[] = [];

  if (!answers.record) missing.push("record");
  if (!answers.adminSurface) missing.push("adminSurface");
  if (!answers.events || answers.events.length === 0) missing.push("events");
  if (!answers.failureMode) missing.push("failureMode");

  return missing;
}

/**
 * Spine stage labels for documentation/tracing.
 */
export const SPINE_STAGES = [
  "user_action",
  "product_event",
  "canonical_record",
  "access_state",
  "audit_event",
  "lineage_event",
  "admin_visibility",
  "foundry_testability",
  "action_escalation",
] as const;

export type SpineStage = (typeof SPINE_STAGES)[number];
