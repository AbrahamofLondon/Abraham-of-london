export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma.server";
import { computeDecisionCreditScore } from "@/lib/follow-up/decision-credit-score";
import type { IntelligenceSpine } from "@/lib/decision/intelligence-spine";
import { getCreditProfile } from "@/lib/decision-ledger/ledger-service";

type Band = "EXCELLENT" | "GOOD" | "FAIR" | "POOR";

function scoreToBand(score: number): Band {
  if (score >= 80) return "EXCELLENT";
  if (score >= 60) return "GOOD";
  if (score >= 40) return "FAIR";
  return "POOR";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json(
      { ok: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  const email = session.user.email;

  // Load the most recent intelligence spine from DiagnosticJourney
  const journey = await prisma.diagnosticJourney.findFirst({
    where: {
      email,
      diagnosticType: "intelligence_spine",
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!journey?.mergedTensionThread) {
    // No spine data — return default
    return NextResponse.json({
      ok: true,
      data: {
        score: 50,
        band: "FAIR" as Band,
        trend: "stable" as const,
        components: {
          velocity: 15,
          breaches: 0,
          outcomes: 10,
          recurrence: 10,
        },
        lastAssessed: null,
        note: "No assessment data",
      },
    });
  }

  const currentSpine = journey.mergedTensionThread as unknown as IntelligenceSpine;

  // Load prior spines for trend calculation
  const priorJourneys = await prisma.diagnosticJourney.findMany({
    where: {
      email,
      diagnosticType: "intelligence_spine",
      id: { not: journey.id },
    },
    orderBy: { updatedAt: "asc" },
    take: 5,
  });

  const priorSpines = priorJourneys
    .map((j) => j.mergedTensionThread as unknown as IntelligenceSpine)
    .filter((s) => s && s.id && s.case);

  const dcs = computeDecisionCreditScore(currentSpine, priorSpines.length > 0 ? priorSpines : undefined);
  const profile = await getCreditProfile(email);

  return NextResponse.json({
    ok: true,
    data: {
      score: dcs.score,
      band: scoreToBand(dcs.score),
      trend: dcs.trend,
      components: {
        velocity: dcs.components.followThrough,
        breaches: Math.max(0, 25 - dcs.components.breachPenalty),
        outcomes: dcs.components.impactQuality,
        recurrence: dcs.components.consistency,
      },
      lastAssessed: journey.updatedAt?.toISOString() ?? null,
      reliability: {
        score: dcs.score,
        band: scoreToBand(dcs.score),
      },
      followThrough: {
        score: dcs.components.followThrough,
        fulfilled: profile.fulfilled,
        totalDecisions: profile.totalDecisions,
      },
      delayPattern: {
        penalty: dcs.components.breachPenalty,
        breached: profile.breached,
        disputed: profile.disputed,
      },
      improvementTrend: {
        trend: dcs.trend,
        label: dcs.label,
      },
    },
  });
}
