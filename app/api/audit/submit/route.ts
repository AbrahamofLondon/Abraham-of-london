/* app/api/audit/submit/route.ts — STABILIZED INGESTION */
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { participantId, responses, sessionKey, metadata } = body;

    if (!participantId || !Array.isArray(responses)) {
      return NextResponse.json({ ok: false, error: "INVALID_PAYLOAD" }, { status: 400 });
    }

    const prisma = await db.getPrismaClient();
    if (!prisma) return new NextResponse("Database Connection Failure", { status: 500 });

    const [participant, resonanceMetric] = await Promise.all([
      prisma.campaignParticipant.findUnique({
        where: { id: participantId },
        include: { campaign: true }
      }),
      (prisma as any).governanceMetricDefinition?.findUnique({
        where: { key: "RESONANCE_THRESHOLD" }
      }) ?? Promise.resolve(null)
    ]);

    if (!participant) return NextResponse.json({ ok: false, error: "NODE_NOT_FOUND" }, { status: 404 });
    if (participant.status === 'completed') return NextResponse.json({ ok: false, error: "STATE_LOCKED" }, { status: 409 });

    const avgResonance = responses.reduce((acc: number, r: any) => acc + (Number(r.resonance) || 0), 0) / responses.length;
    const avgCertainty = responses.reduce((acc: number, r: any) => acc + (Number(r.certainty) || 0), 0) / responses.length;

    const thresholdLo = resonanceMetric?.thresholdLo ?? 50;
    let severity: "critical" | "warning" | "info" = avgResonance < 30 ? "critical" : avgResonance < thresholdLo ? "warning" : "info";

    await prisma.$transaction(async (tx) => {
      // ✅ FIX: Removed updatedAt as it is not in your schema
      await tx.campaignParticipant.update({
        where: { id: participantId },
        data: { status: 'completed' }
      });

      await tx.auditResponse.createMany({
        data: responses.map((r: any) => ({
          campaignId: participant.campaignId,
          domain: String(r.domain || "Strategic Alignment").trim(),
          resonance: Number(r.resonance) || 0,
          certainty: Number(r.certainty) || 0,
        }))
      });

      await (tx as any).decisionSignalRegistry.upsert({
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
          assetTitle: (participant.campaign as any)?.title || "Audit Node",
          assetKind: "CAMPAIGN_NODE",
          contextType: "PARTICIPANT_AUDIT",
          contextValue: participant.id,
          status: "ACTIVE",
          highestSeverity: severity,
          resonanceScore: avgResonance,
          confidenceScore: avgCertainty,
          healthScore: (avgResonance + avgCertainty) / 2,
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
    });

    return NextResponse.json({ ok: true, severity });
  } catch (error) {
    console.error("[AUDIT_SUBMIT_FAILED]", error);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}