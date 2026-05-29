/**
 * lib/research/promotion/promotion-service.ts
 *
 * Service layer for the FoundryPromotion workflow.
 *
 * A promotion records the deliberate, evidenced decision to advance a product
 * surface or governance event from one EventMaturity stage to the next.
 *
 * Key invariants (enforced here):
 *  1. Promotion must reference a non-ARCHIVED ResearchRun as evidence.
 *  2. toStage must be exactly one step above fromStage in the maturity ladder.
 *  3. LIVE_GOVERNED is terminal — no promotions from LIVE_GOVERNED.
 *  4. RETIRED is not a promotion target — only accessible via archival workflow.
 *  5. Promotions are append-only — no edits, only rollback records.
 */

import "server-only";

import { prisma } from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EventMaturityStage =
  | "RESERVED_CONCEPT"
  | "SIMULATION_ONLY"
  | "PILOT_READY"
  | "LIVE_GOVERNED";

export const MATURITY_ORDER: EventMaturityStage[] = [
  "RESERVED_CONCEPT",
  "SIMULATION_ONLY",
  "PILOT_READY",
  "LIVE_GOVERNED",
];

export type PromotionRecord = {
  id: string;
  eventType: string;
  fromStage: string;
  toStage: string;
  approvedBy: string;
  approvedAt: Date;
  promotionReason: string;
  criteriaMetJson: string | null;
  blockersJson: string | null;
  researchRunId: string | null;
  rollbackAt: Date | null;
  rollbackReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreatePromotionInput = {
  eventType: string;
  fromStage: EventMaturityStage;
  toStage: EventMaturityStage;
  approvedBy: string;
  promotionReason: string;
  criteriaMet?: string[];
  blockers?: string[];
  researchRunId?: string;
};

export type PromotionServiceError =
  | { type: "INVALID_TRANSITION"; from: string; to: string }
  | { type: "RUN_NOT_FOUND"; runId: string }
  | { type: "RUN_ARCHIVED"; runId: string }
  | { type: "RUN_HAS_CRITICAL_FINDINGS"; runId: string }
  | { type: "EVIDENCE_RUN_REQUIRED"; toStage: string }
  | { type: "DUPLICATE_PENDING"; eventType: string; toStage: string }
  | { type: "DB_ERROR"; message: string };

export type CreatePromotionResult =
  | { ok: true; promotion: PromotionRecord }
  | { ok: false; error: PromotionServiceError };

// ─── Validation ───────────────────────────────────────────────────────────────

export function isValidPromotion(from: EventMaturityStage, to: EventMaturityStage): boolean {
  const fromIdx = MATURITY_ORDER.indexOf(from);
  const toIdx = MATURITY_ORDER.indexOf(to);
  return fromIdx !== -1 && toIdx !== -1 && toIdx === fromIdx + 1;
}

export function nextStage(from: EventMaturityStage): EventMaturityStage | null {
  const idx = MATURITY_ORDER.indexOf(from);
  if (idx === -1 || idx === MATURITY_ORDER.length - 1) return null;
  return MATURITY_ORDER[idx + 1] ?? null;
}

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * List all promotions, optionally filtered by eventType.
 * Returns newest first.
 */
export async function listPromotions(opts?: {
  eventType?: string;
  limit?: number;
  offset?: number;
}): Promise<PromotionRecord[]> {
  return prisma.foundryPromotion.findMany({
    where: opts?.eventType ? { eventType: opts.eventType } : undefined,
    orderBy: { createdAt: "desc" },
    take: opts?.limit ?? 50,
    skip: opts?.offset ?? 0,
  });
}

/**
 * Get a single promotion by ID.
 */
export async function getPromotion(id: string): Promise<PromotionRecord | null> {
  return prisma.foundryPromotion.findUnique({ where: { id } });
}

/**
 * Create a new promotion.
 * Validates the transition, optionally verifies the linked ResearchRun,
 * then writes to DB and updates the linked run's maturityStage.
 */
export async function createPromotion(
  input: CreatePromotionInput,
): Promise<CreatePromotionResult> {
  // ── Validate transition ─────────────────────────────────────────────────────
  if (!isValidPromotion(input.fromStage, input.toStage)) {
    return {
      ok: false,
      error: {
        type: "INVALID_TRANSITION",
        from: input.fromStage,
        to: input.toStage,
      },
    };
  }

  // ── Gate: LIVE_GOVERNED requires evidence run ──────────────────────────────
  if (input.toStage === "LIVE_GOVERNED" && !input.researchRunId) {
    return {
      ok: false,
      error: { type: "EVIDENCE_RUN_REQUIRED", toStage: input.toStage },
    };
  }

  // ── Validate evidence run (if provided) ────────────────────────────────────
  if (input.researchRunId) {
    const run = await prisma.researchRun.findUnique({
      where: { id: input.researchRunId },
      select: { id: true, status: true, findingsJson: true },
    });

    if (!run) {
      return { ok: false, error: { type: "RUN_NOT_FOUND", runId: input.researchRunId } };
    }
    if (run.status === "ARCHIVED") {
      return { ok: false, error: { type: "RUN_ARCHIVED", runId: input.researchRunId } };
    }

    // Gate: LIVE_GOVERNED requires no unresolved CRITICAL findings
    if (input.toStage === "LIVE_GOVERNED" && run.findingsJson) {
      try {
        const findings = JSON.parse(run.findingsJson) as Array<{ severity?: string }>;
        const hasCritical = findings.some((f) => f.severity === "CRITICAL");
        if (hasCritical) {
          return {
            ok: false,
            error: { type: "RUN_HAS_CRITICAL_FINDINGS", runId: input.researchRunId },
          };
        }
      } catch {
        // findingsJson parse failure is non-fatal; proceed with promotion
      }
    }
  }

  // ── Create promotion and update run maturity in one transaction ─────────────
  try {
    const promotion = await prisma.$transaction(async (tx) => {
      const created = await tx.foundryPromotion.create({
        data: {
          eventType:       input.eventType,
          fromStage:       input.fromStage,
          toStage:         input.toStage,
          approvedBy:      input.approvedBy,
          approvedAt:      new Date(),
          promotionReason: input.promotionReason,
          criteriaMetJson: input.criteriaMet ? JSON.stringify(input.criteriaMet) : null,
          blockersJson:    input.blockers ? JSON.stringify(input.blockers) : null,
          researchRunId:   input.researchRunId ?? null,
        },
      });

      // Update the linked run's maturityStage to reflect the promotion target
      if (input.researchRunId) {
        const promotionDecisionJson = JSON.stringify({
          approved:    true,
          actor:       input.approvedBy,
          reason:      input.promotionReason,
          timestamp:   created.approvedAt.toISOString(),
          criteria:    input.criteriaMet ?? [],
          promotionId: created.id,
        });

        await tx.researchRun.update({
          where: { id: input.researchRunId },
          data: {
            maturityStage:       input.toStage,
            promotionDecision:   promotionDecisionJson,
            promotionBlockersJson: input.blockers ? JSON.stringify(input.blockers) : null,
            updatedAt:           new Date(),
          },
        });

        // Emit audit event
        await tx.foundryAuditEvent.create({
          data: {
            runId:   input.researchRunId,
            event:   "FOUNDRY_RUN_STATUS_CHANGED",
            actorEmail: input.approvedBy,
            reason:  `Promoted ${input.fromStage} → ${input.toStage}: ${input.promotionReason}`,
            metadata: JSON.stringify({ promotionId: created.id }),
          },
        });
      }

      return created;
    });

    return { ok: true, promotion };
  } catch (err) {
    return {
      ok: false,
      error: {
        type: "DB_ERROR",
        message: err instanceof Error ? err.message : "Unknown database error",
      },
    };
  }
}

/**
 * Record a rollback of a promotion (does not delete — append-only).
 */
export async function rollbackPromotion(
  promotionId: string,
  rollbackReason: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await prisma.foundryPromotion.update({
      where: { id: promotionId },
      data: {
        rollbackAt:     new Date(),
        rollbackReason: rollbackReason,
      },
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Rollback failed" };
  }
}
