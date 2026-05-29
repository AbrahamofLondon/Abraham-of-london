// app/api/admin/intelligence-foundry/feedback/route.ts
// Durable finding feedback API.
//
// GET  ?runId=xxx          — list all feedback for a run
// POST { runId, findingId, disposition, engineId?, moduleId?, note?, updatedBy? }
//                          — upsert a single finding disposition
// DELETE ?runId=x&findingId=y — clear a disposition

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import {
  upsertFeedback,
  getFeedbackForRun,
  deleteFeedback,
  isValidDisposition,
} from "@/lib/research/feedback/finding-feedback-service";

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(request.url);
  const runId = searchParams.get("runId");

  if (!runId) {
    return NextResponse.json({ ok: false, error: "runId is required" }, { status: 400 });
  }

  try {
    const feedback = await getFeedbackForRun(runId);
    return NextResponse.json({ ok: true, feedback });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to load feedback" },
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

    const { runId, findingId, disposition, engineId, moduleId, note, updatedBy } = body as Record<string, unknown>;

    if (!runId || typeof runId !== "string") {
      return NextResponse.json({ ok: false, error: "runId is required" }, { status: 400 });
    }
    if (!findingId || typeof findingId !== "string") {
      return NextResponse.json({ ok: false, error: "findingId is required" }, { status: 400 });
    }
    if (!isValidDisposition(disposition)) {
      return NextResponse.json(
        { ok: false, error: "disposition must be ACTED | DISMISSED | DEFERRED" },
        { status: 400 },
      );
    }

    const record = await upsertFeedback({
      runId,
      findingId,
      disposition,
      engineId:  typeof engineId  === "string" ? engineId  : undefined,
      moduleId:  typeof moduleId  === "string" ? moduleId  : undefined,
      note:      typeof note      === "string" ? note      : undefined,
      updatedBy: typeof updatedBy === "string" ? updatedBy : undefined,
    });

    return NextResponse.json({ ok: true, feedback: record }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to save feedback" },
      { status: 500 },
    );
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(request.url);
  const runId    = searchParams.get("runId");
  const findingId = searchParams.get("findingId");

  if (!runId || !findingId) {
    return NextResponse.json({ ok: false, error: "runId and findingId are required" }, { status: 400 });
  }

  try {
    const deleted = await deleteFeedback(runId, findingId);
    return NextResponse.json({ ok: deleted });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to delete feedback" },
      { status: 500 },
    );
  }
}
