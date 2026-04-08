/* app/api/audit/submit/route.ts — CENTRALIZED TELEMETRY INGESTION */
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * Robust endpoint for audit submission when ID is provided in the body.
 * Aligned with GovernanceMetricDefinition and DecisionSignalRegistry.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      participantId, 
      responses, 
      sessionKey, 
      metadata 
    } = body;

    // 1. INTEGRITY CHECK
    if (!participantId || !Array.isArray(responses)) {
      return NextResponse.json({ 
        ok: false, 
        error: "INVALID_PAYLOAD", 
        message: "participantId and responses array are required." 
      }, { status: 400 });
    }

    const prisma = await db.getPrismaClient();
    if (!prisma) {
      return new NextResponse("Database Connection Failure", { status: 500 });
    }

    // 2. FETCH CONTEXT & GOVERNANCE THRESHOLDS
    const [participant, resonanceMetric] = await Promise.all([
      prisma.campaignParticipant.findUnique({
        where: { id: participantId },
        include: { campaign: true }
      }),
      prisma.governanceMetricDefinition.findUnique({
        where: { key: "RESONANCE_THRESHOLD" }
      })
    ]);

    if (!participant) {
      return NextResponse.json({ ok: false, error: "NODE_NOT_FOUND" }, { status: 404 });
    }

    if (participant.status === 'completed') {
      return NextResponse.json({ 
        ok: false, 
        error: "STATE_LOCKED", 
        message: "This audit has already been finalized." 
      }, { status: 409 });
    }

    // 3. TELEMETRY PROCESSING
    const avgResonance = responses.reduce((acc: number, r: any) => acc + (Number(r.resonance) || 0), 0) / responses.length;
    const avgCertainty = responses.reduce((acc: number, r: any) => acc + (Number(r.certainty) || 0), 0) / responses.length;

    // Severity mapping based on GovernanceMetricDefinition
    const thresholdLo = resonanceMetric?.thresholdLo ?? 50;
    const criticalThreshold = 30;

    let severity: "critical" | "warning" | "info" = "info";
    if (avgResonance < criticalThreshold) severity = "critical";
    else if (avgResonance < thresholdLo) severity = "warning";

    // 4. ATOMIC GOVERNANCE TRANSACTION
    await prisma.$transaction(async (tx) => {
      // A. Lock State
      await tx.campaignParticipant.update({
        where: { id: participantId },
        data: { 
          status: 'completed',
          updatedAt: new Date()
        }
      });

      // B. Create Telemetry Records
      await tx.auditResponse.createMany({
        data: responses.map((r: any) => ({
          campaignId: participant.campaignId,
          domain: String(r.domain || "Strategic Alignment").trim(),
          resonance: Number(r.resonance) || 0,
          certainty: Number(r.certainty) || 0,
        }))
      });

      // C. Update Signal Registry
      await tx.decisionSignalRegistry.upsert({
        where: {
          assetId_contextType_contextValue: {
            assetId: participant.campaignId,
            contextType: "PARTICIPANT_AUDIT",
            contextValue: participant.id
          }
        },
        create: {
          registryKey: `audit_${participant.id}_${Date.now()}`,
          assetId: participant.campaignId,
          assetTitle: participant.campaign.title || "Standard Audit Node",
          assetKind: "CAMPAIGN_NODE",
          contextType: "PARTICIPANT_AUDIT",
          contextValue: participant.id,
          status: "ACTIVE",
          highestSeverity: severity,
          resonanceScore: avgResonance,
          confidenceScore: avgCertainty,
          healthScore: (avgResonance + avgCertainty) / 2,
          metricKey: resonanceMetric?.key,
          lastEvaluatedAt: new Date(),
          metadata: { ...metadata, sessionKey, routePath: "/api/audit/submit" }
        },
        update: {
          highestSeverity: severity,
          resonanceScore: avgResonance,
          confidenceScore: avgCertainty,
          healthScore: (avgResonance + avgCertainty) / 2,
          lastEvaluatedAt: new Date(),
          metadata: { ...metadata, sessionKey }
        }
      });

      // D. Governance Alert Logic
      if (severity !== "info") {
        await tx.decisionGovernanceAlert.create({
          data: {
            assetId: participant.campaignId,
            assetTitle: participant.campaign.title || "Standard Audit Node",
            assetKind: "CAMPAIGN_NODE",
            alertType: "THRESHOLD_BREACH",
            severity: severity.toUpperCase(),
            message: `Audit Breach: ${participant.id} scored ${avgResonance}% resonance.`,
            currentValue: avgResonance,
            previousValue: resonanceMetric?.thresholdHi ?? 100,
            deltaValue: avgResonance - (resonanceMetric?.thresholdHi ?? 100),
            metadata: { 
              participantId: participant.id, 
              responses,
              triggeredBy: "audit_submit_route"
            }
          }
        });
      }
    });

    return NextResponse.json({ 
      ok: true, 
      data: {
        severity,
        resonance: avgResonance,
        certainty: avgCertainty
      }
    }, { status: 201 });

  } catch (error) {
    console.error("[CRITICAL_AUDIT_SUBMIT_FAILURE]", error);
    return NextResponse.json({ 
      ok: false, 
      error: "INTERNAL_SERVER_ERROR", 
      message: "The governance engine encountered an unhandled exception." 
    }, { status: 500 });
  }
}