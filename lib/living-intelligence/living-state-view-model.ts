/**
 * lib/living-intelligence/living-state-view-model.ts
 *
 * Presentation view model for the Living State layer. NOT tied to Boardroom.
 *
 * Named LivingStateViewModel to remain additive and non-colliding with the
 * existing LivingProductViewModel (living-product-view-model.ts), which serves
 * the estate-structure system and is left untouched.
 *
 * The view model is a pure projection of evaluated LivingStateObjects into the
 * shapes the generic UI consumes. It carries the user-facing slice (only what is
 * safe to show a user) separately from the operator-facing slice.
 */

import type {
  LivingStateObject,
  LivingStateSeverity,
} from "@/lib/living-intelligence/living-state-object-contract";
import { summariseMemory } from "@/lib/living-intelligence/living-state-memory";

export type LivingStateDomainRollup = {
  total: number;
  blocked: number;
  awaitingVerification: number;
  awaitingConsent: number;
  artifactIncomplete: number;
  missingRepairRoute: number;
  readyForReview: number;
};

export type LivingStateUserFacing = {
  objectId: string;
  title: string;
  summary: string;
  whatTheSystemHeard?: string[];
  evidenceStatus: string;
  cannotInfer: string[];
  nextActions: string[];
};

export type LivingStateOperatorFacing = {
  objectId: string;
  title: string;
  summary: string;
  blockers: string[];
  nextActions: string[];
  repairRoutes: string[];
  missingRoutes: string[];
};

export type LivingStateViewModel = {
  generatedAt: string;
  engineVersion: string;

  estate: {
    totalObjects: number;
    blocked: number;
    warnings: number;
    governedTensions: number;
    safeToShowUser: number;
    safeToShowOperator: number;
  };

  objects: LivingStateObject[];

  byDomain: Record<string, LivingStateDomainRollup>;

  userFacing: LivingStateUserFacing[];
  operatorFacing: LivingStateOperatorFacing[];

  memory: {
    newIssues: number;
    repeatedIssues: number;
    resolvedIssues: number;
    regressions: number;
    rememberedObjects: number;
  };

  refusedToInfer: string[];
};

export const LIVING_STATE_ENGINE_VERSION = "1.0.0";

function emptyRollup(): LivingStateDomainRollup {
  return {
    total: 0,
    blocked: 0,
    awaitingVerification: 0,
    awaitingConsent: 0,
    artifactIncomplete: 0,
    missingRepairRoute: 0,
    readyForReview: 0,
  };
}

function countSeverity(object: LivingStateObject, severity: LivingStateSeverity): number {
  return object.blockers.filter((b) => b.severity === severity).length;
}

export function buildLivingStateViewModel(
  objects: LivingStateObject[],
  generatedAt: string = new Date().toISOString(),
): LivingStateViewModel {
  const byDomain: Record<string, LivingStateDomainRollup> = {};
  const refusedToInfer = new Set<string>();

  let blocked = 0;
  let warnings = 0;
  let governedTensions = 0;
  let safeToShowUser = 0;
  let safeToShowOperator = 0;

  for (const object of objects) {
    const rollup = byDomain[object.domain] ?? emptyRollup();
    rollup.total += 1;

    const codes = new Set(object.blockers.map((b) => b.code));
    const hasBlocker = object.blockers.some((b) => b.severity === "blocker");
    if (hasBlocker) {
      blocked += 1;
      rollup.blocked += 1;
    }
    warnings += countSeverity(object, "warning");
    governedTensions += countSeverity(object, "governed_tension");
    if (object.safeToShowUser) safeToShowUser += 1;
    if (object.safeToShowOperator) safeToShowOperator += 1;

    if (codes.has("unverified_evidence") || codes.has("verification_not_allowed")) rollup.awaitingVerification += 1;
    if (codes.has("pending_consent") || codes.has("missing_consent")) rollup.awaitingConsent += 1;
    if (codes.has("missing_artifact") || codes.has("stub_artifact_only") || object.artifact.status === "incomplete") rollup.artifactIncomplete += 1;
    if (codes.has("missing_repair_path") || codes.has("route_missing")) rollup.missingRepairRoute += 1;
    if (object.currentStage === "ready_for_review" || object.currentStage === "awaiting_review") rollup.readyForReview += 1;

    byDomain[object.domain] = rollup;

    // The engine refuses to infer outcomes; record what it declined to assume.
    for (const action of object.nextActions) {
      if (action.actionType === "approve_publication") refusedToInfer.add(`Will not infer approval for "${object.title}".`);
      if (action.actionType === "verify_evidence") refusedToInfer.add(`Will not infer verification for "${object.title}".`);
      if (action.actionType === "request_consent") refusedToInfer.add(`Will not infer consent for "${object.title}".`);
      if (action.actionType === "block_publication") refusedToInfer.add(`Will not infer publication permission for "${object.title}".`);
    }
  }

  const userFacing: LivingStateUserFacing[] = objects
    .filter((object) => object.safeToShowUser)
    .map((object) => {
      const whatHeard = object.evidence.supportingEvidence;
      return {
        objectId: object.id,
        title: object.title,
        summary: object.userVisibleSummary,
        ...(whatHeard.length > 0 ? { whatTheSystemHeard: whatHeard } : {}),
        evidenceStatus: object.evidence.status,
        cannotInfer: object.evidence.cannotInfer,
        nextActions: object.nextActions
          .filter((a) => a.owner === "user" || a.owner === "client")
          .map((a) => a.label),
      };
    });

  const operatorFacing: LivingStateOperatorFacing[] = objects
    .filter((object) => object.safeToShowOperator)
    .map((object) => ({
      objectId: object.id,
      title: object.title,
      summary: object.operatorSummary,
      blockers: object.blockers.map((b) => `${b.label} — ${b.requiredAction}`),
      nextActions: object.nextActions.map((a) => a.label),
      repairRoutes: object.blockers
        .map((b) => b.repairRoute)
        .filter((route): route is string => typeof route === "string"),
      missingRoutes: object.blockers
        .filter((b) => b.code === "missing_repair_path" || b.code === "route_missing")
        .map((b) => b.requiredAction),
    }));

  const memory = summariseMemory(objects);

  return {
    generatedAt,
    engineVersion: LIVING_STATE_ENGINE_VERSION,
    estate: {
      totalObjects: objects.length,
      blocked,
      warnings,
      governedTensions,
      safeToShowUser,
      safeToShowOperator,
    },
    objects,
    byDomain,
    userFacing,
    operatorFacing,
    memory,
    refusedToInfer: [...refusedToInfer],
  };
}
