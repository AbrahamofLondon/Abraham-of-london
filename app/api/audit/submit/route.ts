/* app/api/audit/[id]/submit/route.ts — TELEMETRY INGESTION PROTOCOL */
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { responses } = await req.json();
    const participantId = params.id;

    if (!participantId || !Array.isArray(responses)) {
      return new NextResponse("Invalid Telemetry Packet", { status: 400 });
    }

    // ✅ STEP 1: Get Prisma client first to resolve the "Property does not exist" error
    const prisma = await db.getPrismaClient();
    if (!prisma) {
      return new NextResponse("Database Connection Failure", { status: 500 });
    }

    // ✅ STEP 2: Access models through the prisma instance
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

    // ✅ STEP 3: Atomic Transaction Protocol
    await prisma.$transaction([
      // A. Update Participant Status
      prisma.campaignParticipant.update({
        where: { id: participantId },
        data: { status: 'completed' }
      }),

      // B. Create Anonymized Responses
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
          metadata: { 
            participantId: participant.id,
            timestamp: new Date().toISOString()
          }
        }
      })
    ]);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[TELEMETRY_INGESTION_FAILURE]", error);
    return new NextResponse("Internal Protocol Error", { status: 500 });
  }
}