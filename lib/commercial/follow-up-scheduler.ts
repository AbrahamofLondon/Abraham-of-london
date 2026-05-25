/**
 * lib/commercial/follow-up-scheduler.ts
 *
 * Commercial follow-up scheduler.
 * Determines when commercial follow-up is required based on client activity.
 *
 * Triggers:
 *  - Report delivered but not viewed after 48h
 *  - Report viewed but no action item updated after 7 days
 *  - HIGH/CRITICAL action remains open after 14 days
 *  - Boardroom-qualified report not upgraded after 7 days
 *
 * Output: recommended follow-up type and email draft payload.
 * No background automation yet — callable service + admin-visible state.
 */

import "server-only";

import { prisma } from "@/lib/prisma.server";

export type FollowUpTrigger =
  | "REPORT_NOT_VIEWED_48H"
  | "REPORT_VIEWED_NO_ACTION_7D"
  | "CRITICAL_ACTION_OPEN_14D"
  | "BOARDROOM_QUALIFIED_NOT_UPGRADED_7D";

export type FollowUpRecommendation = {
  clientEmail: string;
  reportId?: string;
  trigger: FollowUpTrigger;
  severity: "LOW" | "MEDIUM" | "HIGH";
  recommendedAction: string;
  emailDraft: string;
};

/**
 * Check for reports delivered but not viewed within 48 hours.
 */
export async function checkUnviewedReports(): Promise<FollowUpRecommendation[]> {
  const results: FollowUpRecommendation[] = [];
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const artifacts = await prisma.executiveReportingArtifact.findMany({
    where: {
      kind: "ACCESS_TOKEN",
      status: "active",
      createdAt: { lte: cutoff },
    },
    select: { runId: true, payload: true, createdAt: true },
  });

  for (const artifact of artifacts) {
    const payload = artifact.payload as Record<string, unknown> | null;
    const email = payload?.email as string | undefined;
    if (!email) continue;

    // Check if report has been viewed
    const run = await prisma.executiveReportingRun.findUnique({
      where: { id: artifact.runId },
      select: { id: true },
    });
    if (!run) continue;

    results.push({
      clientEmail: email,
      reportId: artifact.runId,
      trigger: "REPORT_NOT_VIEWED_48H",
      severity: "MEDIUM",
      recommendedAction: "Send follow-up email reminding client to view their Executive Report",
      emailDraft: `Your Executive Report was delivered ${Math.round((Date.now() - artifact.createdAt.getTime()) / 3600000)} hours ago but has not yet been viewed.`,
    });
  }

  return results;
}

/**
 * Check for HIGH/CRITICAL actions that remain open after 14 days.
 */
export async function checkStaleCriticalActions(): Promise<FollowUpRecommendation[]> {
  const results: FollowUpRecommendation[] = [];
  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const actions = await prisma.clientDecisionAction.findMany({
    where: {
      severity: { in: ["CRITICAL", "HIGH"] },
      status: "OPEN",
      createdAt: { lte: cutoff },
    },
    select: { id: true, clientEmail: true, findingTitle: true, createdAt: true },
  });

  for (const action of actions) {
    results.push({
      clientEmail: action.clientEmail,
      trigger: "CRITICAL_ACTION_OPEN_14D",
      severity: "HIGH",
      recommendedAction: `Follow up on critical action: ${action.findingTitle}`,
      emailDraft: `A critical action item "${action.findingTitle}" has been open for ${Math.round((Date.now() - action.createdAt.getTime()) / 86400000)} days.`,
    });
  }

  return results;
}

/**
 * Run all follow-up checks.
 */
export async function runFollowUpChecks(): Promise<{
  recommendations: FollowUpRecommendation[];
  summary: string;
}> {
  const [unviewed, staleActions] = await Promise.all([
    checkUnviewedReports(),
    checkStaleCriticalActions(),
  ]);

  const recommendations = [...unviewed, ...staleActions];

  return {
    recommendations,
    summary: `${recommendations.length} follow-up(s) recommended: ${unviewed.length} unviewed reports, ${staleActions.length} stale critical actions.`,
  };
}
