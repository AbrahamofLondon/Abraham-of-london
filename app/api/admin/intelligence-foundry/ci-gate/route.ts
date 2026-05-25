// POST /api/admin/intelligence-foundry/ci-gate
// CI systems send POST (not GET) to trigger a gate check.
// If FOUNDRY_CI_API_KEY is configured, bearer must match exactly — no fallthrough.
// Returns block: true with blocking run stubs when unresolved CRITICAL runs exist.
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ResearchRunRepository } from "@/lib/research/research-run-repository";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";

const FOUNDRY_CI_API_KEY = process.env.FOUNDRY_CI_API_KEY ?? process.env.FOUNDRY_API_KEY;

async function authenticate(request: NextRequest): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (FOUNDRY_CI_API_KEY) {
    // Key is configured — bearer must match exactly. No fallthrough to admin session.
    if (bearerToken !== FOUNDRY_CI_API_KEY) {
      return {
        ok: false,
        response: NextResponse.json({ ok: false, error: "Invalid or missing bearer token" }, { status: 401 }),
      };
    }
    return { ok: true };
  }

  // No key configured — require admin session
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) {
    return { ok: false, response: auth.response };
  }
  return { ok: true };
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;

  try {
    const metrics = await ResearchRunRepository.getHealthMetrics();
    const criticalUnresolved = metrics.criticalUnresolved;
    const block = criticalUnresolved > 0;

    return NextResponse.json({
      ok: true,
      block,
      criticalUnresolved,
      message: block
        ? `CI gate blocked: ${criticalUnresolved} unresolved CRITICAL/HIGH run(s) require a decision.`
        : "CI gate clear. No blocking runs.",
    });
  } catch (error) {
    console.error("[FOUNDRY_CI_GATE]", error);
    return NextResponse.json({ ok: false, error: "Gate check failed" }, { status: 500 });
  }
}

// Keep GET for backwards compat with any existing callers — returns 405 to signal deprecation
export async function GET() {
  return NextResponse.json(
    { ok: false, error: "CI gate requires POST. GET is not accepted." },
    { status: 405 },
  );
}
