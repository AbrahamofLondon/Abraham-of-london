// POST /api/admin/intelligence-foundry/ci-gate
// CI systems send POST (not GET) to trigger a gate check.
// If FOUNDRY_CI_API_KEY is configured, bearer must match exactly — no fallthrough.
// Returns block: true when either:
//   (a) unresolved CRITICAL/HIGH ResearchRun findings exist, OR
//   (b) any product surface is RED in product health overview.
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ResearchRunRepository } from "@/lib/research/research-run-repository";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { getProductHealthOverview } from "@/lib/research/product-health/product-health-service";
import { notifyReleaseBlocked, notifyProductHealthRed } from "@/lib/foundry/webhook-notifier";

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
    const [metrics, overview] = await Promise.all([
      ResearchRunRepository.getHealthMetrics(),
      Promise.resolve(getProductHealthOverview()),
    ]);

    const criticalUnresolved = metrics.criticalUnresolved;
    const { red, amber, green, grey, releaseBlockers } = overview.summary;
    const block = criticalUnresolved > 0 || red > 0;

    // Parse optional release context from body (best-effort — CI gate still proceeds without it)
    let releaseId = "unknown";
    let branch: string | undefined;
    try {
      const body = await request.json().catch(() => null);
      if (body && typeof body === "object") {
        if (typeof body.releaseId === "string") releaseId = body.releaseId;
        if (typeof body.branch === "string") branch = body.branch;
      }
    } catch { /* non-JSON body is fine — gate does not require a body */ }

    // Dispatch webhooks fire-and-forget — never awaited in the hot path
    if (block) {
      void notifyReleaseBlocked({
        releaseId,
        branch,
        criticalFindingCount: criticalUnresolved,
        highFindingCount: releaseBlockers,
      });
    }
    if (red > 0 && overview.surfaces) {
      const redSurface = overview.surfaces.find((s) => s.overallStatus === "RED");
      if (redSurface) {
        void notifyProductHealthRed({
          surfaceId: redSurface.productSurfaceId,
          surfaceLabel: redSurface.label,
          reason: redSurface.explanation,
          blockerCount: releaseBlockers,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      block,
      criticalUnresolved,
      productHealth: { red, amber, green, grey, releaseBlockers },
      message: block
        ? `CI gate blocked: ${criticalUnresolved} unresolved CRITICAL/HIGH run(s), ${red} RED product surface(s).`
        : "CI gate clear. No blocking runs or RED product surfaces.",
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
