// app/api/leads/fuse/route.ts
// ============================================================================
// SOVEREIGN INGESTION GATEWAY v3.0
// Standardized entry point for lead data fusion.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fuseScores, DealFusionInput } from '@/lib/ai/deal-fusion';

// 1. Institutional Validation Schema
const leadSchema = z.object({
  ruleScore: z.number().min(0).max(100),
  aiScore: z.number().min(0).max(100),
  aiConfidence: z.number().min(0).max(1).optional().default(0.7),
  revenue: z.union([z.number(), z.string()]).transform((val) => {
    if (typeof val === 'number') return val;
    return Number(val.replace(/[^\d.-]/g, '')) || 0;
  }).optional(),
  authority: z.union([z.string(), z.boolean()]).optional(),
  urgency: z.string().optional(),
  problem: z.string().optional(),
  behavioral: z.object({
    sessionDepth: z.number().optional().default(1),
    timeOnSite: z.number().optional().default(0),
    returnVisitor: z.boolean().optional().default(false),
  }).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 2. Parse Incoming Payload
    const json = await req.json();
    const result = leadSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: "Institutional Data Mismatch", details: result.error.format() },
        { status: 422 }
      );
    }

    const { behavioral, ...leadData } = result.data;

    // 3. Map to Fusion Input
    const fusionInput: DealFusionInput = {
      ...leadData,
      sessionDepth: behavioral?.sessionDepth,
      timeOnSite: behavioral?.timeOnSite,
      returnVisitor: behavioral?.returnVisitor,
    };

    // 4. Execute The Sovereign Protocol
    const fusionOutcome = fuseScores(fusionInput);

    // 5. Institutional Response (Includes Original Input for UI Hydration)
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      analysis: fusionOutcome,
      metadata: {
        engineVersion: "3.0.0",
        protocol: "SOVEREIGN",
      }
    }, { 
      status: 200,
      headers: {
        'X-Protocol-Version': '3.0.0',
        'X-Deal-Priority': fusionOutcome.priority
      }
    });

  } catch (error) {
    console.error("[FUSION_ERROR]:", error);
    return NextResponse.json(
      { error: "Internal Gateway Friction", message: (error as Error).message },
      { status: 500 }
    );
  }
}