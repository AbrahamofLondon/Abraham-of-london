// app/api/admin/boardroom-delivery/revoke-access/route.ts
// Admin-only: revoke client access to a Boardroom Dossier.

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { BoardroomDossierService } from "@/lib/boardroom/boardroom-dossier-service";
import { z } from "zod";

const revokeSchema = z.object({
  dossierId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = revokeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") }, { status: 400 });
    }

    const record = await BoardroomDossierService.revokeAccess(
      parsed.data.dossierId,
      auth.email ?? "admin",
    );

    return NextResponse.json({ ok: true, dossier: record });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Revoke failed" }, { status: 500 });
  }
}
