export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fuseScores, type DealFusionInput } from "@/lib/ai/deal-fusion";
import { assertPublicRoute } from "@/lib/auth/server";

// Intentionally public — lead scoring ingestion.
// Hardened: input validation, size limits, no internal signal leakage.
assertPublicRoute();

const MAX_BODY_BYTES = 8192;

const leadSchema = z.object({
  ruleScore: z.number().min(0).max(100),
  aiScore: z.number().min(0).max(100),
  aiConfidence: z.number().min(0).max(1).optional().default(0.7),
  revenue: z
    .union([z.number(), z.string()])
    .transform((val) => {
      if (typeof val === "number") return val;
      return Number(val.replace(/[^\d.-]/g, "")) || 0;
    })
    .optional(),
  authority: z.union([z.string(), z.boolean()]).optional(),
  urgency: z.string().max(200).optional(),
  problem: z.string().max(2000).optional(),
  behavioral: z
    .object({
      sessionDepth: z.number().min(0).max(1000).optional().default(1),
      timeOnSite: z.number().min(0).max(86400).optional().default(0),
      returnVisitor: z.boolean().optional().default(false),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const contentLength = req.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const json = await req.json();
    const result = leadSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 422 },
      );
    }

    const { behavioral, ...leadData } = result.data;

    const fusionInput: DealFusionInput = {
      ...leadData,
      sessionDepth: behavioral?.sessionDepth,
      timeOnSite: behavioral?.timeOnSite,
      returnVisitor: behavioral?.returnVisitor,
    };

    const fusionOutcome = fuseScores(fusionInput);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      analysis: fusionOutcome,
    });
  } catch (error) {
    console.error("[FUSION_ERROR]:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
