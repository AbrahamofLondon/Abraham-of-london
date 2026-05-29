// app/api/admin/intelligence-foundry/promotion/route.ts
// Admin-only: list and create FoundryPromotion records.
//
// GET  ?eventType=X&limit=50&offset=0 — list promotions
// POST body: CreatePromotionInput — create a new promotion

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import {
  listPromotions,
  createPromotion,
  type CreatePromotionInput,
  MATURITY_ORDER,
  isValidPromotion,
} from "@/lib/research/promotion/promotion-service";

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get("eventType") ?? undefined;
    const limit     = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
    const offset    = parseInt(searchParams.get("offset") ?? "0", 10);

    const promotions = await listPromotions({ eventType, limit, offset });
    return NextResponse.json({ ok: true, promotions });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to list promotions" },
      { status: 500 },
    );
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ ok: false, error: "Request body required" }, { status: 400 });
    }

    // ── Input validation ─────────────────────────────────────────────────────
    const { eventType, fromStage, toStage, approvedBy, promotionReason, criteriaMet, blockers, researchRunId } = body as Partial<CreatePromotionInput>;

    if (!eventType || typeof eventType !== "string") {
      return NextResponse.json({ ok: false, error: "eventType is required" }, { status: 400 });
    }
    if (!fromStage || !MATURITY_ORDER.includes(fromStage as typeof MATURITY_ORDER[number])) {
      return NextResponse.json({ ok: false, error: `fromStage must be one of: ${MATURITY_ORDER.join(", ")}` }, { status: 400 });
    }
    if (!toStage || !MATURITY_ORDER.includes(toStage as typeof MATURITY_ORDER[number])) {
      return NextResponse.json({ ok: false, error: `toStage must be one of: ${MATURITY_ORDER.join(", ")}` }, { status: 400 });
    }
    if (!isValidPromotion(fromStage as typeof MATURITY_ORDER[number], toStage as typeof MATURITY_ORDER[number])) {
      return NextResponse.json(
        { ok: false, error: `Invalid transition: ${fromStage} → ${toStage}. Must advance exactly one stage.` },
        { status: 422 },
      );
    }
    if (!approvedBy || typeof approvedBy !== "string") {
      return NextResponse.json({ ok: false, error: "approvedBy is required" }, { status: 400 });
    }
    if (!promotionReason || typeof promotionReason !== "string") {
      return NextResponse.json({ ok: false, error: "promotionReason is required" }, { status: 400 });
    }

    const result = await createPromotion({
      eventType,
      fromStage: fromStage as typeof MATURITY_ORDER[number],
      toStage:   toStage as typeof MATURITY_ORDER[number],
      approvedBy,
      promotionReason,
      criteriaMet: Array.isArray(criteriaMet) ? criteriaMet : undefined,
      blockers:    Array.isArray(blockers) ? blockers : undefined,
      researchRunId: researchRunId ?? undefined,
    });

    if (!result.ok) {
      const status =
        result.error.type === "INVALID_TRANSITION"        ? 422 :
        result.error.type === "EVIDENCE_RUN_REQUIRED"     ? 422 :
        result.error.type === "RUN_HAS_CRITICAL_FINDINGS" ? 422 :
        result.error.type === "RUN_NOT_FOUND"             ? 404 :
        result.error.type === "RUN_ARCHIVED"              ? 409 :
        result.error.type === "DUPLICATE_PENDING"         ? 409 : 500;

      // Surface human-readable message for gate failures
      const errorMsg =
        result.error.type === "EVIDENCE_RUN_REQUIRED"
          ? `Promotion to ${(result.error as { toStage: string }).toStage} requires a linked ResearchRun as evidence.`
          : result.error.type === "RUN_HAS_CRITICAL_FINDINGS"
          ? `Promotion to LIVE_GOVERNED is blocked: linked run has unresolved CRITICAL findings.`
          : result.error;

      return NextResponse.json({ ok: false, error: errorMsg }, { status });
    }

    return NextResponse.json({ ok: true, promotion: result.promotion }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to create promotion" },
      { status: 500 },
    );
  }
}
