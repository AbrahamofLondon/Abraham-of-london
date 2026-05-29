// app/api/admin/intelligence-foundry/engines/constitutional-diagnostic/run/route.ts
// Admin-only: run the Constitutional Diagnostic engine.
// POST body: { answers?, useDefaults?, operatorKey? }
//   answers: Record<"q1"|...|"q10", { resonance: 0–10, certainty: 0–10 }>
//   useDefaults: true → uses balanced mid-range 5/5 answers
// Returns: { ok, engineId, engineVersion, result }

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import {
  constitutionalDiagnosticAdapter,
  CONSTITUTIONAL_DIAGNOSTIC_ENGINE_ID,
  CONSTITUTIONAL_DIAGNOSTIC_VERSION,
} from "@/lib/research/engines/constitutional-diagnostic-adapter";

export async function POST(request: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const result = await constitutionalDiagnosticAdapter.run({ payload: body });
    return NextResponse.json({
      ok: true,
      engineId: CONSTITUTIONAL_DIAGNOSTIC_ENGINE_ID,
      engineVersion: CONSTITUTIONAL_DIAGNOSTIC_VERSION,
      result,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Constitutional diagnostic run failed" },
      { status: 500 },
    );
  }
}
