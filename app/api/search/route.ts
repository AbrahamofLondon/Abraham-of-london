export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma.server";
import OpenAI from "openai";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import type { AoLClaims } from "@/types/auth";
import { Session } from "next-auth";

/**
 * LOCAL TYPE OVERRIDE
 * Forces the compiler to recognize the institutional 'aol' property 
 * regardless of global declaration merging failures.
 */
interface ExtendedSession extends Session {
  aol?: AoLClaims;
}

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "Missing credentials. Please pass an apiKey, or set the OPENAI_API_KEY environment variable.",
    );
  }

  return new OpenAI({ apiKey });
}

export async function POST(req: Request) {
  try {
    // 1. Institutional Security Gate
    // Cast the session to our extended interface to clear the build error
    const session = (await getServerSession(authOptions)) as ExtendedSession | null;

    // Check clearance via custom 'aol' property or administrative role
    const hasAccess = 
      session?.aol?.innerCircleAccess || 
      (session?.user as any)?.role === "owner" || 
      (session?.user as any)?.role === "admin";

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Clearance Level Insufficient" },
        { status: 403 }
      );
    }

    const { query, limit = 5 } = await req.json();
    if (!query) return NextResponse.json({ error: "Query Required" }, { status: 400 });

    // 2. Generate Query Vector
    const embeddingResponse = await getOpenAIClient().embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });

    const firstEmbedding = embeddingResponse.data?.[0]?.embedding;
    
    if (!firstEmbedding) {
      throw new Error("Neural Engine failed to generate vector.");
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
        dependencies: r.dependencies || []
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
