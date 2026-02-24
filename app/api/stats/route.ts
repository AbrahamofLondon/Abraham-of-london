// app/api/stats/route.ts
import "server-only";
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getRegistryStats } from "@/lib/pdf/pdf-registry.generated"; // Note the specific import path
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const registryStats = getRegistryStats();
    
    // Aggregate DB stats alongside Registry stats for full portfolio oversight
    const dbStats = await prisma.contentMetadata.aggregate({
      _sum: { totalPrints: true },
      _avg: { engagementScore: true }
    });

    return NextResponse.json({
      success: true,
      ...registryStats,
      engagement: {
        totalPrints: dbStats._sum.totalPrints || 0,
        avgScore: dbStats._avg.engagementScore || 0
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}