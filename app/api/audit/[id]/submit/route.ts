/* app/api/audit/[id]/submit/route.ts — TELEMETRY INGESTION PROTOCOL */
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { resonance, certainty } = body;
    const participantId = params.id;

    // 1. Validation: Hard bounds check
    if (typeof resonance !== 'number' || typeof certainty !== 'number') {
      return new NextResponse("Invalid telemetry data", { status: 400 });
    }

    if (resonance < 1 || resonance > 10 || certainty < 1 || certainty > 10) {
      return new NextResponse("Values must be between 1 and 10", { status: 400 });
    }

    /**
     * ✅ THE FIX: ACCESS THE CLIENT ENGINE
     * Your error log confirmed that 'db' is a wrapper.
     * Models like 'campaignParticipant' live on the result of getPrismaClient().
     */
    const prisma = await db.getPrismaClient();

    if (!prisma) {
      return new NextResponse("Database Connection Failure", { status: 500 });
    }

    // 2. Fetch participant: Includes campaignId for the response link
    // We use 'prisma' here, NOT 'db'
    const participant = await prisma.campaignParticipant.findUnique({
      where: { id: participantId },
      select: {
        id: true,
        campaignId: true,
        status: true,
      }
    });

    if (!participant) {
      return new NextResponse("Participant not found", { status: 404 });
    }

    // Crucial state guard to prevent double-counting
    if (participant.status === 'completed') {
      return new NextResponse("Already completed", { status: 409 });
    }

    // 3. Atomic transaction: Ensures data decoupling and locking
    // We use 'prisma.$transaction', NOT 'db.$transaction'
    await prisma.$transaction([
      prisma.auditResponse.create({
        data: {
          campaignId: participant.campaignId,
          resonance,
          certainty,
        }
      }),
      prisma.campaignParticipant.update({
        where: { id: participantId },
        data: {
          status: 'completed',
          completedAt: new Date()
        }
      })
    ]);

    return NextResponse.json({ 
      success: true 
    });

  } catch (error) {
    console.error("[AUDIT_SUBMIT_CRITICAL]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}