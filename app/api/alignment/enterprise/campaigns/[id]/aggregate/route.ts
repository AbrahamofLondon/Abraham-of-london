import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering — prevents Next.js from trying to statically
// analyze/execute this route at build time, which crashes because the
// enterprise-aggregation chain imports PrismaClient which needs DATABASE_URL.
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    if (!id) {
      return NextResponse.json(
        { error: "Missing campaign identifier" },
        { status: 400 }
      );
    }

    // Dynamic import to avoid build-time evaluation
    const { aggregateEnterpriseCampaign } = await import(
      "@/lib/alignment/enterprise-aggregation"
    );

    const result = await aggregateEnterpriseCampaign(id);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Aggregate] Error:", error);
    return NextResponse.json(
      { error: "Failed to aggregate campaign data" },
      { status: 500 }
    );
  }
}
