export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { resolveLongitudinalComparison } from "@/lib/diagnostics/longitudinal-comparison";

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const diagnosticType = text(body.diagnosticType);
    if (!diagnosticType) {
      return NextResponse.json(
        { ok: false, error: "diagnosticType is required" },
        { status: 400 },
      );
    }

    const result = await resolveLongitudinalComparison({
      journeyId: text(body.journeyId),
      journeyKey: text(body.journeyKey),
      email: text(body.email),
      subjectKey: text(body.subjectKey),
      organisationKey: text(body.organisationKey),
      diagnosticType,
      persist: body.persist !== false,
    });

    return NextResponse.json({
      ok: true,
      baseline: result.baseline,
      delta: result.delta,
      recurrence: result.recurrence,
      evidenceNodes: result.evidenceNodes,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to resolve re-entry context",
      },
      { status: 400 },
    );
  }
}
