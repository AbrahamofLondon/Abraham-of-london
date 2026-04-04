import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scrubParticipantIdentity, isCohortSafe } from "@/lib/alignment/anonymity-service";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Fetch Campaign with completed participants ONLY
    const campaign = await db.alignmentCampaign.findUnique({
      where: { id: params.id },
      include: {
        participants: {
          where: { status: 'completed' },
          select: {
            id: true,
            rawScores: true, // Assuming JSON structure of domain scores
            completedAt: true,
            // We EXCLUDE PII like email and fullName here
          }
        },
        _count: {
          select: { participants: { where: { status: 'completed' } } }
        }
      }
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign Not Found" }, { status: 404 });
    }

    // 2. Discretionary Guard Check (Server-side Enforcement)
    if (!isCohortSafe(campaign._count.participants)) {
      return NextResponse.json({ 
        ok: false, 
        error: "ANONYMITY_VIOLATION: Data points below safety threshold (n < 5)." 
      }, { status: 403 });
    }

    // 3. Execution of the "Scrubber"
    // We map the raw data into a new shape that loses the original ID link
    const intelligenceFindings = campaign.participants.map(p => ({
      hash: scrubParticipantIdentity(p.id, campaign.id),
      data: p.rawScores,
      velocity: p.completedAt
    }));

    // 4. Structural Aggregation (Calculating the 'Dissonance' baseline)
    const domainAverages = aggregateDomainScores(intelligenceFindings.map(f => f.data));

    return NextResponse.json({
      ok: true,
      report: {
        id: campaign.id,
        generatedAt: new Date(),
        cohortSize: campaign._count.participants,
        findings: intelligenceFindings,
        averages: domainAverages,
        resonanceStatus: domainAverages.overall < 60 ? "HIGH_DISSONANCE" : "ALIGNED"
      }
    });

  } catch (error) {
    console.error("[INTELLIGENCE_API_FAILURE]", error);
    return NextResponse.json({ error: "Internal Diagnostic Error" }, { status: 500 });
  }
}

/**
 * UTILITY: AGGREGATE_DOMAIN_SCORES
 * Summarizes the findings into institutional trends without individual outliers.
 */
function aggregateDomainScores(scoresArray: any[]) {
  // Logic to iterate through JSON scores and return means
  // Implementation depends on your EnterpriseAlignmentDomain structure
  return {
    overall: 72, // Mock average
    strategic_intent: 68,
    operational_clarity: 75,
    leadership_trust: 54 // This identifies the friction point
  };
}