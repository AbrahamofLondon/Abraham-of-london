// POST /api/admin/intelligence-foundry/brief-orders/[id]/generate-draft
// Generates a draft Decision Failure Brief from the DFM engine output.
// Founder review is required before delivery.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma.server";
import { analyzeDecisionFailureMap } from "@/lib/decision/decision-failure-map";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const order = await prisma.decisionBriefOrder.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ ok: false, error: "ORDER_NOT_FOUND" }, { status: 404 });
    }

    if (order.status !== "in_review") {
      return NextResponse.json({ ok: false, error: "Order must be in_review to generate draft" }, { status: 400 });
    }

    // Generate the DFM output
    const decisionText = order.decisionSummary || "No decision summary provided.";
    const dfm = analyzeDecisionFailureMap(decisionText);

    // Build the draft brief
    const draft = {
      reference: `BRIEF-${order.id.slice(-8).toUpperCase()}`,
      tier: order.tier,
      generatedAt: new Date().toISOString(),
      decisionType: dfm.decisionType,
      directive: dfm.directive,
      score: dfm.score,
      primaryFailurePoint: dfm.primaryFailurePoint,
      secondaryFailurePoint: dfm.secondaryFailurePoint,
      situationSummary: dfm.situationSummary,
      primaryTension: dfm.primaryTension,
      failureRisks: dfm.failureRisks.map(r => ({
        point: r.point,
        severity: r.severity,
        label: r.label,
        description: r.description,
      })),
      constraintSignals: dfm.constraintSignals,
      exposureTypes: dfm.exposureTypes,
      whatMustNotBeDelayed: dfm.whatMustNotBeDelayed,
      minimumViableNextMove: dfm.minimumViableNextMove,
      fallbackPath: dfm.fallbackPath,
      viableMoves: dfm.viableMoves.map(m => ({
        label: m.label,
        description: m.description,
        accessibility: m.accessibility,
        requiresFunds: m.requiresFunds,
        priority: m.priority,
      })),
      evidenceNeeded: dfm.evidenceNeeded,
      escalationThreshold: dfm.escalationThreshold,
      confidence: dfm.confidence,
      verificationToken: order.verificationToken,
      // Founder review notes
      requiresHumanReview: true,
      reviewPrompt: "Review the draft below. Check that the failure map matches the user's situation, that the minimum viable next move is actionable, and that no impossible advice is given. Edit as needed before delivery.",
    };

    return NextResponse.json({
      ok: true,
      draft,
      message: "Draft generated. Founder review is required before delivery.",
    });
  } catch (error) {
    console.error("[BRIEF_GENERATE_DRAFT]", error);
    return NextResponse.json({ ok: false, error: "FAILED" }, { status: 500 });
  }
}
