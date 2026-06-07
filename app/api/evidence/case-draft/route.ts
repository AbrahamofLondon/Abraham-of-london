export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { generateCaseStudyDraft } from "@/lib/evidence/case-study-generator";
import { checkCaseStudyEligibility } from "@/lib/evidence/case-study-generator";
import { prisma } from "@/lib/prisma.server";
import type { CaseStudyGenerationInput } from "@/lib/evidence/case-study-types";

/**
 * POST /api/evidence/case-draft
 *
 * Generate a case study draft from a verified outcome.
 * The draft is never auto-published. Human review is required.
 *
 * Input:
 *   outcomeId: string (required)
 *   anonymisedSector?: string
 *   anonymisedOrganisationSize?: string
 *   anonymisedRegion?: string
 *
 * Output:
 *   Success: { ok: true, draft: CaseStudyDraft }
 *   Failure: { ok: false, reason: string, missingFields?: string[] }
 */
export async function POST(req: Request) {
  // Authentication
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json(
      { ok: false, reason: "Authentication required" },
      { status: 401 },
    );
  }

  // Only ADMIN and OWNER roles may generate case drafts
  const role = (session.user as { role?: string }).role ?? "USER";
  if (role !== "ADMIN" && role !== "OWNER") {
    return NextResponse.json(
      { ok: false, reason: "Insufficient role. ADMIN or OWNER required." },
      { status: 403 },
    );
  }

  // Parse input
  let body: CaseStudyGenerationInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, reason: "Invalid JSON body" },
      { status: 400 },
    );
  }

  if (!body.outcomeId || typeof body.outcomeId !== "string") {
    return NextResponse.json(
      { ok: false, reason: "outcomeId is required" },
      { status: 400 },
    );
  }

  // Check eligibility first
  const eligibility = await checkCaseStudyEligibility(body.outcomeId, {
    anonymisedSector: body.anonymisedSector,
    anonymisedOrganisationSize: body.anonymisedOrganisationSize,
    anonymisedRegion: body.anonymisedRegion,
  });

  if (!eligibility.eligible) {
    return NextResponse.json(
      {
        ok: false,
        reason: eligibility.reason ?? "Eligibility check failed",
        missingFields: eligibility.missingFields,
      },
      { status: 422 },
    );
  }

  // Generate draft
  const result = await generateCaseStudyDraft(body);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, reason: result.reason, missingFields: result.missingFields },
      { status: 422 },
    );
  }

  const caseStudy = await prisma.caseStudy.create({
    data: {
      title: result.draft.title,
      status: "DRAFT",
      publicationAllowed: false,
      anonymised: true,
      anonymisationNotes: result.draft.confidentialityNotes,
      sector: body.anonymisedSector ?? null,
      companySizeBand: body.anonymisedOrganisationSize ?? null,
      region: body.anonymisedRegion ?? null,
      adminVerifiedRecordId: body.outcomeId,
      verificationStatus: "VERIFIED",
      consentStatus: "PENDING",
      narrative: {
        classification: result.draft.classification,
        situation: result.draft.situation,
        contradiction: result.draft.contradiction,
        decision: result.draft.decision,
        intervention: result.draft.intervention,
        outcome: result.draft.outcome,
        implication: result.draft.recommendedPublicStatus,
        integritySeal: result.draft.integritySeal,
      },
      evidence: {
        create: [
          {
            sourceType: "OutcomeVerificationRecord",
            sourceId: body.outcomeId,
            verificationStatus: "VERIFIED",
            notes: result.draft.verificationBasis,
          },
        ],
      },
      outcomes: {
        create: [
          {
            outcomeClass: result.draft.recommendedPublicStatus,
            outcomeSummary: result.draft.outcome,
            verifiedBy: session.user.email,
            verifiedAt: new Date(),
          },
        ],
      },
      consents: {
        create: [
          {
            consentStatus: "PENDING",
            anonymisedAllowed: true,
            publicUseAllowed: false,
            notes: "Case study generated as internal draft. Publication requires explicit consent or approved anonymised-publication basis.",
          },
        ],
      },
    },
    select: { id: true, status: true, publicationAllowed: true },
  });

  return NextResponse.json({
    ok: true,
    caseStudy,
    draft: result.draft,
  });
}
