// app/api/admin/boardroom-delivery/delivery-log/route.ts
// Admin-only: read the delivery event log for a boardroom dossier.
//
// GET ?dossierId=<id>           → full event log, newest-first
// GET ?dossierId=<id>&summary=1 → summary counts only

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { BoardroomDeliveryLog } from "@/lib/boardroom/boardroom-delivery-log";

export async function GET(request: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(request.url);
  const dossierId = searchParams.get("dossierId");
  const summaryOnly = searchParams.get("summary") === "1";

  if (!dossierId) {
    return NextResponse.json({ ok: false, error: "dossierId required" }, { status: 400 });
  }

  try {
    if (summaryOnly) {
      const summary = await BoardroomDeliveryLog.summary(dossierId);
      return NextResponse.json({ ok: true, dossierId, summary });
    }

    const events = await BoardroomDeliveryLog.forDossier(dossierId);
    return NextResponse.json({ ok: true, dossierId, events, count: events.length });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to fetch delivery log" },
      { status: 500 },
    );
  }
}
