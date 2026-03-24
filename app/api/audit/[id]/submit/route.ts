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

    // 1. Validation
    if (typeof resonance !== 'number' || typeof certainty !== 'number') {
      return new NextResponse("Invalid telemetry data", { status: 400 });
    }

    if (resonance < 1 || resonance > 10 || certainty < 1 || certainty > 10) {
      return new NextResponse("Values must be between 1 and 10", { status: 400 });
    }

    // 2. Fetch participant
    const participant = await db.campaignParticipant.findUnique({
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

    if (participant.status === 'completed') {
      return new NextResponse("Already completed", { status: 409 });
    }

    // 3. Atomic transaction
    await db.$transaction([
      db.auditResponse.create({
        data: {
          campaignId: participant.campaignId,
          resonance,
          certainty,
        }
      }),
      db.campaignParticipant.update({
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
    console.error("[AUDIT_SUBMIT]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}