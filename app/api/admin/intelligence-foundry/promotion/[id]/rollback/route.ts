// app/api/admin/intelligence-foundry/promotion/[id]/rollback/route.ts
// Admin-only: record a promotion rollback.
// Rollback is append-only — it does NOT delete the original promotion.
// It sets rollbackAt + rollbackReason on the FoundryPromotion record.
//
// POST body: { rollbackReason: string }
// Returns:   { ok: true, promotion: PromotionRecord }

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { rollbackPromotion, getPromotion } from "@/lib/research/promotion/promotion-service";
import { prisma } from "@/lib/prisma";
import { notifyPromotionRolledBack } from "@/lib/foundry/webhook-notifier";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  const promotionId = params.id;
  if (!promotionId) {
    return NextResponse.json({ ok: false, error: "Promotion ID required" }, { status: 400 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ ok: false, error: "Request body required" }, { status: 400 });
    }

    const { rollbackReason, rollbackBy: rollbackByBody } = body as { rollbackReason?: string; rollbackBy?: string };
    if (!rollbackReason || typeof rollbackReason !== "string" || !rollbackReason.trim()) {
      return NextResponse.json({ ok: false, error: "rollbackReason is required" }, { status: 400 });
    }

    // Verify promotion exists and is not already rolled back
    const existing = await getPromotion(promotionId);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Promotion not found" }, { status: 404 });
    }
    if (existing.rollbackAt) {
      return NextResponse.json(
        { ok: false, error: "Promotion already rolled back" },
        { status: 409 },
      );
    }

    const actorEmail = auth.email ?? (typeof rollbackByBody === "string" ? rollbackByBody : null) ?? "unknown";

    // Execute rollback (append-only record) — persist actor for accountability
    const result = await rollbackPromotion(promotionId, rollbackReason.trim(), actorEmail);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }
    if (existing.researchRunId) {
      await prisma.foundryAuditEvent.create({
        data: {
          runId:      existing.researchRunId,
          event:      "FOUNDRY_RUN_STATUS_CHANGED",
          actorEmail,
          reason:     `Rollback of promotion ${promotionId}: ${rollbackReason.trim()}`,
          metadata:   JSON.stringify({ promotionId, rollbackReason: rollbackReason.trim() }),
        },
      }).catch(() => {
        // Audit event emission is best-effort; rollback already succeeded
      });
    }

    // Fire-and-forget webhook notification — never blocks the response
    void notifyPromotionRolledBack({
      eventType: existing.eventType,
      fromStage: existing.fromStage,
      toStage: existing.toStage,
      rolledBackBy: actorEmail,
      rollbackReason: rollbackReason.trim(),
    });

    // Return the updated promotion record
    const updated = await getPromotion(promotionId);
    return NextResponse.json({ ok: true, promotion: updated });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Rollback failed" },
      { status: 500 },
    );
  }
}
