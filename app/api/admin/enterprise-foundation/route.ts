import { NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import {
  getExecutiveRiskSnapshot,
  getFoundationTelemetrySummary,
} from "@/lib/enterprise-foundation/authority-foundation";

export async function GET() {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  const [snapshot, telemetry] = await Promise.all([
    getExecutiveRiskSnapshot(),
    getFoundationTelemetrySummary(),
  ]);

  return NextResponse.json({ ok: true, snapshot, telemetry });
}
