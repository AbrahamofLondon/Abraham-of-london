// app/api/admin/intelligence-foundry/performance/baseline/route.ts
// Server-side durable performance baseline API.
//
// GET    ?engineId=xxx            — retrieve server baseline for an engine
// GET    (no engineId)            — list all baselines
// POST   { engineId, baselineMs, p95Ms, sampleSize, environment?, notes?, updatedBy? }
//                                 — upsert (overwrite) the baseline for an engine
// DELETE ?engineId=xxx            — clear a baseline

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import {
  upsertBaseline,
  getBaseline,
  listBaselines,
  deleteBaseline,
} from "@/lib/research/performance/performance-baseline-service";

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(request.url);
  const engineId = searchParams.get("engineId");

  try {
    if (engineId) {
      const baseline = await getBaseline(engineId);
      return NextResponse.json({ ok: true, baseline });
    }

    const baselines = await listBaselines();
    return NextResponse.json({ ok: true, baselines });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to load baseline" },
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

    const { engineId, baselineMs, p95Ms, sampleSize, environment, notes, updatedBy } =
      body as Record<string, unknown>;

    if (!engineId || typeof engineId !== "string") {
      return NextResponse.json({ ok: false, error: "engineId is required" }, { status: 400 });
    }
    if (typeof baselineMs !== "number" || baselineMs <= 0) {
      return NextResponse.json(
        { ok: false, error: "baselineMs must be a positive number" },
        { status: 400 },
      );
    }
    if (typeof p95Ms !== "number" || p95Ms <= 0) {
      return NextResponse.json(
        { ok: false, error: "p95Ms must be a positive number" },
        { status: 400 },
      );
    }
    if (typeof sampleSize !== "number" || sampleSize < 1) {
      return NextResponse.json(
        { ok: false, error: "sampleSize must be a positive integer" },
        { status: 400 },
      );
    }

    const record = await upsertBaseline({
      engineId,
      baselineMs,
      p95Ms,
      sampleSize,
      environment:  typeof environment  === "string" ? environment  : undefined,
      notes:        typeof notes        === "string" ? notes        : undefined,
      updatedBy:    typeof updatedBy    === "string" ? updatedBy    :
                    auth.email                       ? auth.email   : undefined,
    });

    return NextResponse.json({ ok: true, baseline: record }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to save baseline" },
      { status: 500 },
    );
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(request.url);
  const engineId = searchParams.get("engineId");

  if (!engineId) {
    return NextResponse.json({ ok: false, error: "engineId is required" }, { status: 400 });
  }

  try {
    const deleted = await deleteBaseline(engineId);
    return NextResponse.json({ ok: deleted });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to delete baseline" },
      { status: 500 },
    );
  }
}
