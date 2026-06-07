import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const snapshots = await prisma.gmiReleaseSnapshot.findMany({
      where: { releaseStatus: "PUBLISHED" },
      distinct: ["editionId"],
      orderBy: { publishedAt: "desc" },
      select: {
        editionId: true,
        editionSlug: true,
        releaseStatus: true,
        publishedAt: true,
        createdAt: true,
      },
    });

    const data = snapshots.map((s) => ({
      editionId: s.editionId,
      editionSlug: s.editionSlug,
      releaseStatus: s.releaseStatus,
      publishedAt: s.publishedAt?.toISOString() ?? null,
    }));

    return NextResponse.json(
      {
        data,
        provenance: {
          generatedAt: new Date().toISOString(),
          source: "db",
          version: "1",
        },
        meta: { version: "1", count: data.length },
      },
      {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
          "X-RateLimit-Limit": "60",
        },
      }
    );
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
