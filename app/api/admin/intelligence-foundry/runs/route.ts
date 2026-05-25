// GET /api/admin/intelligence-foundry/runs
// POST /api/admin/intelligence-foundry/runs
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { ResearchRunRepository } from "@/lib/research/research-run-repository";
import { CreateResearchRunSchema, ResearchRunFiltersSchema } from "@/lib/research/research-run-validation";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const rawFilters = {
      module: searchParams.get("module") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      severity: searchParams.get("severity") ?? undefined,
      isDemo: searchParams.has("isDemo") ? searchParams.get("isDemo") === "true" : undefined,
      actorId: searchParams.get("actorId") ?? undefined,
      includeArchived: searchParams.get("includeArchived") === "true",
      limit: searchParams.has("limit") ? Number(searchParams.get("limit")) : 50,
      offset: searchParams.has("offset") ? Number(searchParams.get("offset")) : 0,
    };

    const filters = ResearchRunFiltersSchema.parse(rawFilters);
    const runs = await ResearchRunRepository.findMany(filters);

    return NextResponse.json({ ok: true, runs });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, error: "Invalid filters", details: error.errors }, { status: 400 });
    }
    console.error("[FOUNDRY_RUNS_GET]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const input = CreateResearchRunSchema.parse(body);

    if (!input.actorId) input.actorId = auth.userId;
    if (!input.actorEmail) input.actorEmail = auth.email ?? undefined;

    const run = await ResearchRunRepository.create(input);
    return NextResponse.json({ ok: true, run }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("[FOUNDRY_RUNS_POST]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
