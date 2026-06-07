// app/api/admin/retainer/oversight-cycles/[id]/intervention/route.ts
//
// Admin: add an intervention to an open or in-progress oversight cycle.

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { z } from "zod";
import {
  addIntervention,
  OversightCycleError,
} from "@/lib/retainer/oversight-cycle-service";

const interventionSchema = z.object({
  interventionType: z.string().min(1),
  description: z.string().min(1),
  performedBy: z.string().min(1),
  outcome: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = interventionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 400 },
    );
  }

  try {
    await addIntervention({
      cycleId: params.id,
      ...parsed.data,
    });

    return NextResponse.json({ ok: true, cycleId: params.id, message: "Intervention logged." });
  } catch (err) {
    if (err instanceof OversightCycleError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 422 });
    }
    throw err;
  }
}
