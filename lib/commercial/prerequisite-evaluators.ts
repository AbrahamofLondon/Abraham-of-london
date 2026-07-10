/**
 * lib/commercial/prerequisite-evaluators.ts
 *
 * Policy-specific prerequisite evaluators. Each returns {allowed, reason?, recoveryPath?}.
 *
 * All evaluators that touch persistence accept an injectable `deps` object so they
 * can be unit-tested without a live database. Defaults are the real server-backed
 * implementations. No evaluator is a permanent unconditional allow/deny stub.
 */

import { getDurableReceipt } from "@/lib/intelligence/gmi-release-store.server";
import { GMI_EDITION_REGISTRY } from "@/lib/commercial/gmi/gmi-edition-registry";

export interface EvaluationContext {
  email: string;
  userId?: string;
  productCode: string;
  /** Optional inner-circle handoff token (Boardroom). */
  handoffId?: string;
}

export interface EvaluationResult {
  allowed: boolean;
  reason?: string;
  recoveryPath?: string;
}

/** Injectable dependencies (defaults are real, DB-backed). */
export interface EvaluatorDeps {
  getReceiptForEdition?: (editionId: string) => Promise<unknown | null>;
  hasQualifyingEvidence?: (email: string) => Promise<boolean>;
  isHandoffValid?: (handoffId: string) => Promise<boolean>;
}

// ── Default server-backed lookups ───────────────────────────────────────────

async function defaultHasQualifyingEvidence(email: string): Promise<boolean> {
  const { prisma } = await import("@/lib/prisma.server");
  const journey = await prisma.diagnosticJourney.findFirst({
    where: { email, diagnosticType: "intelligence_spine" },
    orderBy: { updatedAt: "desc" },
  });
  return Boolean(journey);
}

async function defaultIsHandoffValid(handoffId: string): Promise<boolean> {
  if (!/^bh_[a-f0-9]{32}$/i.test(handoffId)) return false;
  const { prisma } = await import("@/lib/prisma.server");
  const rows = await prisma.$queryRaw<Array<{ recommended_route: string; expires_at: Date; used_at: Date | null }>>`
    SELECT recommended_route, expires_at, used_at
    FROM boardroom_bridge_handoffs
    WHERE id = ${handoffId}
    LIMIT 1
  `;
  const row = rows[0];
  return Boolean(row && row.recommended_route === "boardroom-brief" && !row.used_at && row.expires_at > new Date());
}

/** Registry-derived productCode → editionId (issue 5: no hard-coded Q2). */
function resolveEditionForProduct(productCode: string): { editionId: string; slug: string } | null {
  const entry = GMI_EDITION_REGISTRY.find((e) => e.productCode === productCode);
  return entry ? { editionId: entry.editionId, slug: entry.slug } : null;
}

// ── Evaluators ──────────────────────────────────────────────────────────────

/**
 * RELEASE_RECEIPT: a durable release receipt must exist for the edition that maps
 * to this product code — resolved dynamically from the GMI registry, so future
 * edition rollover (Q3, Q4, …) works with no code edits.
 */
export async function evaluateReleaseReceiptPrerequisite(
  context: EvaluationContext,
  deps: EvaluatorDeps = {},
): Promise<EvaluationResult> {
  const edition = resolveEditionForProduct(context.productCode);
  if (!edition) {
    return { allowed: false, reason: "NO_EDITION_MAPPING" };
  }
  const getReceipt = deps.getReceiptForEdition ?? ((id: string) => getDurableReceipt(id));
  const receipt = await getReceipt(edition.editionId);
  if (!receipt) {
    return {
      allowed: false,
      reason: "RELEASE_PROOF_MISSING",
      recoveryPath: `/intelligence/gmi/${edition.slug}`,
    };
  }
  return { allowed: true };
}

/**
 * INTELLIGENCE_SPINE: qualifying diagnostic/evidence must exist (issue 4: real
 * lookup, not a permanent-denial stub).
 */
export async function evaluateIntelligenceSpinePrerequisite(
  context: EvaluationContext,
  deps: EvaluatorDeps = {},
): Promise<EvaluationResult> {
  const lookup = deps.hasQualifyingEvidence ?? defaultHasQualifyingEvidence;
  const hasEvidence = await lookup(context.email);
  if (!hasEvidence) {
    return {
      allowed: false,
      reason: "DIAGNOSTIC_JOURNEY_INCOMPLETE",
      recoveryPath: "/diagnostics",
    };
  }
  return { allowed: true };
}

/**
 * EXECUTIVE_REPORTING_ADMISSION: policy-routed gate is a pass-through; the
 * detailed, evidence-cross-validating admission runs in the checkout endpoint,
 * invoked for ANY product whose policy prerequisite is EXECUTIVE_REPORTING_ADMISSION
 * (issue 3 — not hard-coded to a single product code).
 */
export async function evaluateExecutiveReportingAdmission(
  _context: EvaluationContext,
): Promise<EvaluationResult> {
  return { allowed: true };
}

/**
 * BOARDROOM_HANDOFF: a valid inner-circle handoff token must be present
 * (issue 2: real validation, not an unconditional allow).
 */
export async function evaluateBoardroomHandoff(
  context: EvaluationContext,
  deps: EvaluatorDeps = {},
): Promise<EvaluationResult> {
  if (!context.handoffId) {
    return { allowed: false, reason: "BOARDROOM_HANDOFF_MISSING", recoveryPath: "/inner-circle" };
  }
  const validate = deps.isHandoffValid ?? defaultIsHandoffValid;
  const valid = await validate(context.handoffId);
  if (!valid) {
    return { allowed: false, reason: "BOARDROOM_HANDOFF_MISSING", recoveryPath: "/inner-circle" };
  }
  return { allowed: true };
}

/** NONE — no prerequisite. Used by self-serve decision instruments, professional, etc. */
export function evaluateNonePrerequisite(_context: EvaluationContext): EvaluationResult {
  return { allowed: true };
}

/** Route to the correct evaluator based on prerequisite policy. */
export async function evaluateCommercialPrerequisite(
  prerequisitePolicy: string,
  context: EvaluationContext,
  deps: EvaluatorDeps = {},
): Promise<EvaluationResult> {
  switch (prerequisitePolicy) {
    case "NONE":
      return evaluateNonePrerequisite(context);
    case "RELEASE_RECEIPT":
      return evaluateReleaseReceiptPrerequisite(context, deps);
    case "INTELLIGENCE_SPINE":
      return evaluateIntelligenceSpinePrerequisite(context, deps);
    case "EXECUTIVE_REPORTING_ADMISSION":
      return evaluateExecutiveReportingAdmission(context);
    case "BOARDROOM_HANDOFF":
      return evaluateBoardroomHandoff(context, deps);
    default:
      return { allowed: false, reason: "UNKNOWN_PREREQUISITE_POLICY" };
  }
}
