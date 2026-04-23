import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma.server";

/**
 * GET /api/diagnostics/multi-stakeholder?campaignId=...
 *
 * Computes cross-respondent divergence for a campaign.
 * Returns: shared agreement, critical divergences, highest-cost disagreement.
 */

export async function GET(req: NextRequest) {
  try {
    const campaignId = new URL(req.url).searchParams.get("campaignId");
    if (!campaignId) {
      return NextResponse.json({ ok: false, reason: "CAMPAIGN_ID_REQUIRED" }, { status: 400 });
    }

    // Get all completed participants
    const participants = await prisma.campaignParticipant.findMany({
      where: { campaignId, status: "completed" },
    });

    if (participants.length < 2) {
      return NextResponse.json({ ok: true, hasData: false, respondentCount: participants.length });
    }

    // Get latest assessment per participant
    const participantIds = participants.map((p) => p.id);
    const assessments = await prisma.enterpriseAssessment.findMany({
      where: { participantId: { in: participantIds } },
      orderBy: { submittedAt: "desc" },
    });

    // Build email lookup
    const emailByParticipantId = new Map(participants.map((p) => [p.id, p.email]));

    // Deduplicate to latest per participant
    const latestByParticipant = new Map<string, typeof assessments[0]>();
    for (const a of assessments) {
      if (!latestByParticipant.has(a.participantId)) {
        latestByParticipant.set(a.participantId, a);
      }
    }

    // Extract domain scores from each participant's latest assessment
    type DomainScore = { domain: string; score: number; respondent: string };
    const allScores: DomainScore[] = [];

    for (const [participantId, assessment] of latestByParticipant) {
      const email = emailByParticipantId.get(participantId) ?? "unknown";
      let domains: Record<string, unknown> = {};
      try {
        domains = JSON.parse(assessment.domainScoresJson) as Record<string, unknown>;
      } catch { /* skip malformed */ }

      for (const [domain, value] of Object.entries(domains)) {
        if (typeof value === "number") {
          allScores.push({ domain, score: value, respondent: email });
        }
      }
    }

    if (allScores.length === 0) {
      return NextResponse.json({ ok: true, hasData: false, respondentCount: participants.length });
    }

    // Group scores by domain
    const byDomain: Record<string, Array<{ score: number; respondent: string }>> = {};
    for (const s of allScores) {
      (byDomain[s.domain] ??= []).push({ score: s.score, respondent: s.respondent });
    }

    // Compute divergences
    const divergences: Array<{
      domain: string;
      respondentA: { label: string; score: number };
      respondentB: { label: string; score: number };
      gap: number;
      costImplication: string;
    }> = [];

    const agreements: string[] = [];

    for (const [domain, scores] of Object.entries(byDomain)) {
      if (scores.length < 2) continue;
      const sorted = [...scores].sort((a, b) => b.score - a.score);
      const highest = sorted[0]!;
      const lowest = sorted[sorted.length - 1]!;
      const gap = Math.round(highest.score - lowest.score);

      if (gap >= 20) {
        divergences.push({
          domain,
          respondentA: { label: highest.respondent.split("@")[0] ?? "Respondent A", score: Math.round(highest.score) },
          respondentB: { label: lowest.respondent.split("@")[0] ?? "Respondent B", score: Math.round(lowest.score) },
          gap,
          costImplication: gap >= 35
            ? `${domain} is structurally disputed. Decisions in this domain will produce conflicting execution.`
            : `${domain} divergence will surface under pressure. Coordination cost is accumulating.`,
        });
      } else {
        agreements.push(`${domain}: shared reading (${Math.round(scores.reduce((s, v) => s + v.score, 0) / scores.length)}% average)`);
      }
    }

    // Sort divergences by gap, descending
    divergences.sort((a, b) => b.gap - a.gap);
    const highestCost = divergences[0] ?? null;

    // Persist result
    await prisma.multiStakeholderResult.upsert({
      where: { campaignId_diagnosticType: { campaignId, diagnosticType: "enterprise" } },
      create: {
        campaignId,
        diagnosticType: "enterprise",
        respondentCount: participants.length,
        payload: { agreements, divergences, highestCost },
      },
      update: {
        respondentCount: participants.length,
        payload: { agreements, divergences, highestCost },
      },
    }).catch(() => {});

    // Classify structural contradictions (gap >= 35 = structurally disputed)
    const structuralContradictions = divergences
      .filter((d) => d.gap >= 35)
      .map((d) => ({
        domain: d.domain,
        severity: d.gap >= 50 ? "critical" as const : "high" as const,
        summary: `${d.domain}: ${d.respondentA.label} sees ${d.respondentA.score}%, ${d.respondentB.label} sees ${d.respondentB.score}%. Authority is not operating from the same reality in this domain.`,
        gap: d.gap,
      }));

    return NextResponse.json({
      ok: true,
      hasData: true,
      respondentCount: participants.length,
      sharedAgreement: agreements,
      criticalDivergences: divergences.slice(0, 5),
      highestCostDisagreement: highestCost,
      structuralContradictions,
      organisationalCondition: divergences.length > 2
        ? "Multiple structural disagreements across respondents. The leadership layer is not operating from the same reality."
        : divergences.length > 0
          ? "Targeted disagreement in specific domains. Most of the leadership layer is aligned, but critical gaps exist."
          : "Respondents are broadly aligned. No structural divergence detected.",
      divergenceWorsensCondition: divergences.length > 0
        ? "Each unresolved divergence produces coordination cost. Decisions made under disagreement create conflicting execution streams."
        : "Current alignment supports coherent decision-making.",
    });
  } catch (err) {
    console.error("[multi-stakeholder-api]", err);
    return NextResponse.json({ error: "Failed to compute divergence" }, { status: 500 });
  }
}
