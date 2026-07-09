/**
 * lib/commercial/prerequisite-evaluators.ts
 *
 * Policy-specific prerequisite evaluators.
 * Each evaluator returns {allowed, reason?, recoveryPath?}.
 *
 * Pre-release: logic stays here. Post-release: evaluators are route-specific,
 * not universal gates.
 */

import { getDurableReceipt } from "@/lib/intelligence/gmi-release-store.server";

export interface EvaluationContext {
  email: string;
  userId?: string;
  productCode: string;
}

export interface EvaluationResult {
  allowed: boolean;
  reason?: string;
  recoveryPath?: string;
}

/**
 * RELEASE_RECEIPT: Check that a durable release receipt exists.
 * Used by: GMI Q2 2026
 */
export async function evaluateReleaseReceiptPrerequisite(
  context: EvaluationContext,
): Promise<EvaluationResult> {
  const { productCode } = context;

  // Map product code to edition ID
  let editionId: string | null = null;
  if (productCode === "gmi_q2_2026") editionId = "GMI-Q2-2026";
  // Add other mappings as needed

  if (!editionId) {
    return {
      allowed: false,
      reason: "NO_EDITION_MAPPING",
      recoveryPath: undefined,
    };
  }

  const receipt = await getDurableReceipt(editionId);
  if (!receipt) {
    return {
      allowed: false,
      reason: "RELEASE_PROOF_MISSING",
      recoveryPath: "/intelligence/gmi/q2-2026",  // Link to public record
    };
  }

  return { allowed: true };
}

/**
 * INTELLIGENCE_SPINE: Require completed diagnostic journey.
 * NOT USED for decision instruments or GMI.
 * Kept as reference; only applies if explicitly policy-specified.
 */
export async function evaluateIntelligenceSpinePrerequisite(
  context: EvaluationContext,
): Promise<EvaluationResult> {
  const { email, userId } = context;

  // Check if user/email has completed a qualifying diagnostic
  // (This would query the database for completed assessments)
  // For now: return not allowed (this prerequisite is intentionally rare)

  return {
    allowed: false,
    reason: "PREREQUISITE_REQUIRED",
    recoveryPath: "/diagnostics",
  };
}

/**
 * EXECUTIVE_REPORTING_ADMISSION: Custom evaluator for Executive Reporting.
 * The policy-routed prerequisite just validates the product is configurable.
 * Detailed admission logic happens in the checkout endpoint (pages/api/billing/checkout.ts),
 * which calls evaluateERAdmission() with full diagnostic context.
 * This prerequisite returns allowed: true to let the detailed validation proceed.
 */
export async function evaluateExecutiveReportingAdmission(
  context: EvaluationContext,
): Promise<EvaluationResult> {
  // Executive Reporting has detailed validation in the checkout endpoint.
  // This policy-routed check just confirms the product exists and is purchasable.
  // (Detailed admission logic will validate diagnostic journey, evidence, etc.)
  return { allowed: true };
}

/**
 * BOARDROOM_HANDOFF: Custom evaluator for Boardroom Brief.
 * Currently: always allow (the hardcoded bypass, now made explicit).
 * Owner can introduce specific rules here.
 */
export async function evaluateBoardroomHandoff(
  context: EvaluationContext,
): Promise<EvaluationResult> {
  // Currently: allow all (no prerequisite)
  // Owner can add specific rules: licensing, engagement status, etc.
  return { allowed: true };
}

/**
 * Generic "no prerequisite" evaluator — always allows.
 * Used by: Decision Instruments, Professional, etc.
 */
export function evaluateNonePrerequisite(
  context: EvaluationContext,
): EvaluationResult {
  return { allowed: true };
}

/**
 * Route to the correct evaluator based on prerequisite policy.
 */
export async function evaluateCommercialPrerequisite(
  prerequisitePolicy: string,
  context: EvaluationContext,
): Promise<EvaluationResult> {
  switch (prerequisitePolicy) {
    case "NONE":
      return evaluateNonePrerequisite(context);

    case "RELEASE_RECEIPT":
      return evaluateReleaseReceiptPrerequisite(context);

    case "INTELLIGENCE_SPINE":
      return evaluateIntelligenceSpinePrerequisite(context);

    case "EXECUTIVE_REPORTING_ADMISSION":
      return evaluateExecutiveReportingAdmission(context);

    case "BOARDROOM_HANDOFF":
      return evaluateBoardroomHandoff(context);

    case "CUSTOM":
      // Should not reach here; custom evaluators are called directly
      return {
        allowed: false,
        reason: "CUSTOM_EVALUATOR_NOT_FOUND",
      };

    default:
      return {
        allowed: false,
        reason: "UNKNOWN_PREREQUISITE_POLICY",
      };
  }
}
