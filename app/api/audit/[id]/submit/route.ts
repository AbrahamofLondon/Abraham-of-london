/* app/api/audit/[id]/submit/route.ts — DECISION GOVERNANCE INGESTION */
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { responses, sessionKey, metadata } = body;
    const participantId = params.id;

    if (!participantId || !Array.isArray(responses)) {
      return new NextResponse("Invalid Telemetry Packet", { status: 400 });
    }

    const prisma = await db.getPrismaClient();
    if (!prisma) {
      return new NextResponse("Database Connection Failure", { status: 500 });
    }

    // 1. FETCH CONTEXT & GOVERNANCE RULES
    // We fetch the participant and the 'RESONANCE' metric definition simultaneously
    const [participant, resonanceMetric] = await Promise.all([
      prisma.campaignParticipant.findUnique({
        where: { id: participantId },
        include: { campaign: true }
      }),
      prisma.governanceMetricDefinition.findUnique({
        where: { key: "RESONANCE_THRESHOLD" }
      })
    ]);

    if (!participant) return new NextResponse("Node Not Found", { status: 404 });
    if (participant.status === 'completed') return new NextResponse("Audit State Locked", { status: 409 });

    // 2. TELEMETRY PROCESSING
    const avgResonance = responses.reduce((acc: number, r: any) => acc + (Number(r.resonance) || 0), 0) / responses.length;
    const avgCertainty = responses.reduce((acc: number, r: any) => acc + (Number(r.certainty) || 0), 0) / responses.length;

    // Determine severity based on GovernanceMetricDefinition thresholds
    // Fallback to hardcoded defaults (50/30) if database rule isn't found
    const thresholdLo = resonanceMetric?.thresholdLo ?? 50;
    const criticalThreshold = 30; 

    let severity: "critical" | "warning" | "info" = "info";
    if (avgResonance < criticalThreshold) severity = "critical";
    else if (avgResonance < thresholdLo) severity = "warning";

    // 3. ATOMIC TRANSACTIONAL UPDATES
    await prisma.$transaction(async (tx) => {
      // A. Close the Participant session
      await tx.campaignParticipant.update({
        where: { id: participantId },
        data: { status: 'completed' }
      });

      // B. Record the specific audit responses
      await tx.auditResponse.createMany({
        data: responses.map((r: any) => ({
          campaignId: participant.campaignId,
          domain: String(r.domain || "Strategic Alignment").trim(),
          resonance: Number(r.resonance) || 0,
          certainty: Number(r.certainty) || 0,
        }))
      });

      // C. Update the Signal Registry (the "System Pulse")
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
          assetTitle: participant.campaign.title || "Audit Node",
          assetKind: "CAMPAIGN_NODE",
          contextType: "PARTICIPANT_AUDIT",
          contextValue: participant.id,
          status: "ACTIVE",
          highestSeverity: severity,
          resonanceScore: avgResonance,
          confidenceScore: avgCertainty,
          healthScore: (avgResonance + avgCertainty) / 2,
          metricKey: resonanceMetric?.key, // Link to the definition
          lastEvaluatedAt: new Date(),
          metadata: { ...metadata, sessionKey }
        },
        update: {
          highestSeverity: severity,
          resonanceScore: avgResonance,
          confidenceScore: avgCertainty,
          healthScore: (avgResonance + avgCertainty) / 2,
          lastEvaluatedAt: new Date()
        }
      });

      // D. Generate Alerts if thresholds are breached
      if (severity !== "info") {
        await tx.decisionGovernanceAlert.create({
          data: {
            assetId: participant.campaignId,
            assetTitle: participant.campaign.title || "Audit Node",
            assetKind: "CAMPAIGN_NODE",
            alertType: "GOVERNANCE_BREACH",
            severity: severity.toUpperCase(),
            message: `${severity.toUpperCase()}: Resonance drift in participant ${participant.id} (${avgResonance}%)`,
            currentValue: avgResonance,
            previousValue: resonanceMetric?.thresholdHi ?? 100,
            deltaValue: avgResonance - (resonanceMetric?.thresholdHi ?? 100),
            metadata: { participantId: participant.id, metricKey: resonanceMetric?.key }
          }
        });
      }
    });

    return NextResponse.json({ 
      success: true,
      auditResult: {
        resonance: avgResonance,
        certainty: avgCertainty,
        severity
      }
    });

  } catch (error) {
    console.error("[GOVERNANCE_SUBMIT_FAILURE]", error);
    return new NextResponse("Internal Protocol Error", { status: 500 });
  }
}