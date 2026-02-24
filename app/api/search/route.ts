import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    // 1. Institutional Security Gate
    const session = await getServerSession(authOptions);
    if (!session?.aol?.innerCircleAccess && (session as any)?.role !== "admin") {
      return NextResponse.json({ error: "Clearance Level Insufficient" }, { status: 403 });
    }

    const { query, limit = 5 } = await req.json();
    if (!query) return NextResponse.json({ error: "Query Required" }, { status: 400 });

    // 2. Generate Query Vector with Safety Guard
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });

    // TypeScript Fix: Ensure data[0] exists before accessing embedding
    const firstEmbedding = embeddingResponse.data?.[0]?.embedding;
    
    if (!firstEmbedding) {
      throw new Error("Neural Engine failed to generate vector for this query.");
    }

    const vector = `[${firstEmbedding.join(",")}]`;

    // 3. Semantic Search + Dependency Mapping
    const results: any[] = await prisma.$queryRawUnsafe(`
      SELECT 
        c.id, 
        c.slug, 
        c.title, 
        c."contentType", 
        c.summary,
        1 - (c.embedding <=> $1::vector) as similarity,
        (
          SELECT json_agg(json_build_object('title', t.title, 'slug', t.slug))
          FROM "StrategicLink" sl
          JOIN "ContentMetadata" t ON sl."targetId" = t.id
          WHERE sl."sourceId" = c.id
        ) as dependencies
      FROM "ContentMetadata" c
      WHERE c.embedding IS NOT NULL AND 1 - (c.embedding <=> $1::vector) > 0.3
      ORDER BY similarity DESC
      LIMIT $2
    `, vector, limit);

    return NextResponse.json({ 
      success: true,
      count: results.length, 
      results: results.map(r => ({
        ...r,
        dependencies: r.dependencies || [] // Handle null results from json_agg
      })) 
    });

  } catch (error: any) {
    console.error("🏛️ [SEARCH_FAILURE]:", error.message);
    return NextResponse.json({ 
      error: "Search failed", 
      details: error.message 
    }, { status: 500 });
  }
}