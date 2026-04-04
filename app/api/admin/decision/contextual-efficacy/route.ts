// app/api/admin/decision/contextual-efficacy/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma.server";

export async function GET(request: Request) {
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