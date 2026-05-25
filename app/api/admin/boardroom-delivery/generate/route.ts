// app/api/admin/boardroom-delivery/generate/route.ts
// Admin-only: generate a Boardroom Dossier from an IntelligenceSpine.

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { BoardroomDossierService } from "@/lib/boardroom/boardroom-dossier-service";
import { z } from "zod";

const generateSchema = z.object({
  spineId: z.string().min(1),
  clientEmail: z.string().email().optional(),
  clientName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") }, { status: 400 });
    }

    // For v1, use the qualifying spine fixture as the source
    // In production, this would load a real IntelligenceSpine from the DB
    const { QUALIFYING_SPINE } = await import("@/tests/research/fixtures/boardroom-mode");

    const record = await BoardroomDossierService.generate({
      spine: QUALIFYING_SPINE,
      generatedBy: auth.email ?? "admin",
      clientEmail: parsed.data.clientEmail,
      clientName: parsed.data.clientName,
    });

    return NextResponse.json({ ok: true, dossier: record });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Generation failed" }, { status: 500 });
  }
}
