export const dynamic = "force-dynamic";
// app/api/admin/decision/contextual-efficacy/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma.server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";

export async function GET(request: Request) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const url = new URL(request.url);
    const limit = Math.max(
      1,
      Math.min(Number(url.searchParams.get("limit") || 25), 100)
    );

    const rows = await prisma.adminDecisionContextualEfficacy.findMany({
      orderBy: [
        { contextualConversionRate: "desc" },
        { conversionCount: "desc" },
        { totalSessions: "desc" },
      ],
      take: limit,
    });

    return NextResponse.json({
      ok: true,
      rows,
    });
  } catch (error) {
    console.error("[ADMIN_CONTEXTUAL_EFFICACY_ROUTE_ERROR]", error);

    return NextResponse.json(
      { ok: false, error: "Failed to load canonical contextual efficacy." },
      { status: 500 }
    );
  }
}