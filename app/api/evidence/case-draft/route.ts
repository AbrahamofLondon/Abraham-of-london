export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { generateCaseStudyDraft } from "@/lib/evidence/case-study-generator";
import { checkCaseStudyEligibility } from "@/lib/evidence/case-study-generator";
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

  return NextResponse.json({
    ok: true,
    draft: result.draft,
  });
}