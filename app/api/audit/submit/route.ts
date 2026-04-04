/* app/api/audit/submit/route.ts — TELEMETRY INGESTION PROTOCOL */
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { participantId, responses } = await req.json();

    if (!participantId || !Array.isArray(responses)) {
      return new NextResponse("Invalid Telemetry Packet", { status: 400 });
    }

    const prisma = await db.getPrismaClient();
    if (!prisma) {
      return new NextResponse("Database Connection Failure", { status: 500 });
    }

    // 1. VERIFY PARTICIPANT & LOCK STATE
    // We fetch the participant first to ensure they exist and haven't completed the audit.
    const participant = await prisma.campaignParticipant.findUnique({
      where: { id: participantId },
      select: { id: true, status: true, campaignId: true }
    });

    if (!participant) {
      return new NextResponse("Node Not Found", { status: 404 });
    }

    if (participant.status === 'completed') {
      return NextResponse.json({ 
        success: false, 
        message: "Node state is already locked (Audit Completed)." 
      }, { status: 403 });
    }

    // 2. ATOMIC TRANSACTION: UPDATE STATUS & RECORD TELEMETRY
    // This ensures we don't mark them as complete if the data save fails.
    await prisma.$transaction([
      // A. Update Participant Status
      prisma.campaignParticipant.update({
        where: { id: participantId },
        data: { status: 'completed' }
      }),

      // B. Create Anonymized Responses
      // Note: We do NOT link the response to the membershipId, only the campaignId.
      prisma.auditResponse.createMany({
        data: responses.map((r: any) => ({
          campaignId: participant.campaignId,
          domain: String(r.domain || "Strategic Alignment").trim(),
          resonance: Math.max(0, Math.min(100, Number(r.resonance || 0))),
          certainty: Math.max(0, Math.min(100, Number(r.certainty || 0))),
        }))
      }),

      // C. Log the Governance Event
      prisma.governanceLog.create({
        data: {
          action: "NODE_VALIDATED",
          entityId: participant.campaignId,
          metadata: { participantId: participant.id }
        }
      })
    ]);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[TELEMETRY_INGESTION_FAILURE]", error);
    return new NextResponse("Internal Protocol Error", { status: 500 });
  }
}