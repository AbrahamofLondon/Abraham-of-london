// app/api/admin/boardroom-delivery/route.ts
// Admin-only: list all Boardroom Dossiers.

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { BoardroomDossierService } from "@/lib/boardroom/boardroom-dossier-service";

export async function GET() {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const dossiers = await BoardroomDossierService.list();
    return NextResponse.json({ ok: true, dossiers });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "List failed" }, { status: 500 });
  }
}
