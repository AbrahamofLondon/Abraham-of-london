export const dynamic = "force-dynamic";
// app/api/admin/campaigns/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type CampaignRow = {
  id: string;
  title: string | null;
  status: string;
  updatedAt: Date;
  organisation: {
    name: string | null;
  } | null;
  participants: Array<{
    id: string;
    status: string;
  }>;
};

export async function GET() {
  try {
    const prisma =
      typeof db.getPrismaClient === "function"
        ? await db.getPrismaClient()
        : null;

    if (!prisma) {
      return NextResponse.json(
        { ok: false, error: "Database unavailable" },
        { status: 503 },
      );
    }

    const campaigns = (await prisma.alignmentCampaign.findMany({
      include: {
        organisation: true,
        participants: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    })) as CampaignRow[];

    return NextResponse.json({
      ok: true,
      campaigns: campaigns.map((c: CampaignRow) => ({
        id: c.id,
        title: c.title || "Unnamed Campaign",
        organisation: c.organisation?.name || "Unknown",
        status: c.status,
        participantCount: c.participants.length,
        completedCount: c.participants.filter(
          (p) => p.status === "completed",
        ).length,
        updatedAt: c.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[ADMIN_CAMPAIGNS_ROUTE_ERROR]", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load campaigns",
      },
      { status: 500 },
    );
  }
}