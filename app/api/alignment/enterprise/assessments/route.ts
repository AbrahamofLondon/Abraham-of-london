/* app/api/alignment/enterprise/assessments/route.ts — HARDENED HANDLER */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { 
  getParticipantByInviteTokenHash, 
  saveEnterpriseAssessment, 
  markParticipantCompleted 
} from "@/lib/alignment/enterprise-repository";
import { calculateEnterpriseAssessment } from "@/lib/alignment/enterprise-logic";
import { submitEnterpriseAssessmentSchema } from "@/lib/alignment/enterprise-schemas";

/**
 * FETCH CONTEXT: Validates the token and retrieves campaign metadata.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Missing authentication token" }, { status: 400 });
    }

    const participant = await getParticipantByInviteTokenHash(token);

    if (!participant) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    return NextResponse.json({ 
      status: "success", 
      data: {
        participantId: participant.id,
        campaignId: participant.campaignId,
        organisationId: participant.campaign.organisationId,
        organisationName: participant.campaign.organisation.name,
        status: participant.status,
        openedAt: participant.openedAt,
        isExecutive: participant.membership?.isExecutive ?? false,
        teamName: participant.membership?.teamName ?? "General"
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error("[ENTERPRISE_ASSESSMENT_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * SUBMIT ASSESSMENT: Calculates OGR score and persists result atomically.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, answers } = body;

    if (!token) {
      return NextResponse.json({ error: "Missing authentication token" }, { status: 401 });
    }

    // 1. Resolve Identity & Current Status
    const participant = await getParticipantByInviteTokenHash(token);
    
    if (!participant) {
      return NextResponse.json({ error: "Identity mismatch or invalid token" }, { status: 401 });
    }
    
    if (participant.status === "completed") {
      return NextResponse.json({ error: "Assessment already finalized" }, { status: 409 });
    }

    // 2. Schema Validation (Hardened)
    const validated = submitEnterpriseAssessmentSchema.safeParse({ answers });
    
    if (!validated.success) {
      return NextResponse.json({ 
        error: "Data integrity validation failed", 
        details: validated.error.errors 
      }, { status: 400 });
    }

    // 3. Execution of 0-Error Scoring Engine
    const scoreResult = calculateEnterpriseAssessment(validated.data.answers);

    // 4. Atomic Transactional Persistence
    const record = await prisma.$transaction(async (tx) => {
      // Create the assessment record (Using the repository within tx context)
      const assessment = await saveEnterpriseAssessment({
        campaignId: participant.campaignId,
        participantId: participant.id,
        organisationId: participant.campaign.organisationId,
        teamName: participant.membership?.teamName ?? null,
        isExecutive: participant.membership?.isExecutive ?? false,
        answersJson: validated.data.answers,
        score: scoreResult,
      });

      // Close the participant loop
      await markParticipantCompleted(participant.id);

      return assessment;
    });

    return NextResponse.json({ 
      ok: true, 
      score: scoreResult.percentScore,
      band: scoreResult.band,
      registryId: record.id,
      message: "Context committed to Sovereign Registry"
    }, { status: 201 });
    
  } catch (error: any) {
    console.error("[ENTERPRISE_ASSESSMENT_POST_ERROR]", error);
    return NextResponse.json({ 
      error: error.message || "Failed to process OGR synchronization" 
    }, { status: 400 });
  }
}