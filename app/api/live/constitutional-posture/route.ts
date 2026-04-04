// app/api/live/constitutional-posture/route.ts

import { NextResponse } from "next/server";
import { assembleConstitutionalGuidance } from "@/lib/decision/constitutional-guidance-assembler";

export async function GET() {
  try {
    const result = await assembleConstitutionalGuidance({
      constitution: {
        route: "DIAGNOSTIC",
        priority: "HIGH",
        temperature: "WARM",
        orgState: "DRIFTING",
        readinessTier: "STABILIZING",
        authorityType: "PROXY",
        revenueBand: "ENTERPRISE",
        marketRiskBand: "ELEVATED",
        clarityScore: 68,
        authorityScore: 72,
        governanceScore: 64,
        severityScore: 41,
        revenueScore: 78,
        dominantDomains: ["GOVERNANCE", "EXECUTION", "LEADERSHIP"],
        failureModes: [
          "Decision latency under strain",
          "Execution fragmentation",
          "Mandate ambiguity",
        ],
        requiredInterventions: [
          "Clarify decision rights",
          "Restore operating rhythm",
          "Re-sequence executive priorities",
        ],
        sponsorTypes: ["EXECUTIVE"],
        worldviewAnchors: ["ORDER", "TRUTH", "RESPONSIBILITY"],
        narrativeSummary:
          "The live terminal is reporting a diagnostic constitutional posture, with governance and execution strain requiring intervention before full escalation.",
        rationale: [
          "Live posture seeded from current constitutional telemetry model.",
        ],
      } as any,
      assetLimit: 5,
      minAssetScore: 18,
      source: "live-terminal",
    });

    return NextResponse.json({
      ok: true,
      constitution: result.constitution,
      guidance: result.guidance,
      diagnostics: result.diagnostics,
    });
  } catch (error) {
    console.error("[LIVE_CONSTITUTIONAL_POSTURE_ERROR]", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to load live constitutional posture.",
      },
      { status: 500 }
    );
  }
}