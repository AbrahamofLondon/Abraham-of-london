import "server-only";

/**
 * Return Brief Trigger Engine — global scan of active sessions.
 *
 * Runs every 6–12 hours. Evaluates trigger conditions. Sends executive
 * interruption notices (not "reminders"). Respects throttling.
 *
 * Escalation sequence:
 *   Day 1  — observational: "Your decision has not progressed."
 *   Day 3  — sharper: "No action has been recorded."
 *   Day 7  — direct challenge: "The structure has not changed."
 *   Day 14 — retainer trigger: "This is now a recurring pattern."
 *
 * Rules:
 *   - No repeat within 72 hours
 *   - Escalation allowed if state worsens
 *   - No daily spam. Authority, not noise.
 */

import { prisma } from "@/lib/prisma.server";
import { sendEmail } from "@/lib/email/core/sendEmail";
import {
  evaluateTrigger,
  generateReturnBrief,
  type ReturnBriefTrigger,
} from "./return-brief.server";

// ─── Escalation levels ───────────────────────────────────────────────────────

export type EscalationLevel = 1 | 2 | 3 | 4;

type EscalationConfig = {
  level: EscalationLevel;
  minDaysSinceCommitment: number;
  subject: string;
  openingOverride: string;
  retainerEligible: boolean;
};

const ESCALATION_SEQUENCE: EscalationConfig[] = [
  {
    level: 1,
    minDaysSinceCommitment: 1,
    subject: "Your decision has not progressed",
    openingOverride: "Your decision has not progressed. The constraint you identified is still active.",
    retainerEligible: false,
  },
  {
    level: 2,
    minDaysSinceCommitment: 3,
    subject: "No action has been recorded",
    openingOverride: "You committed to act. No action has been recorded. The decision remains open.",
    retainerEligible: false,
  },
  {
    level: 3,
    minDaysSinceCommitment: 7,
    subject: "The structure has not changed",
    openingOverride: "The decision remains open. The structure has not changed. The constraint remains active.",
    retainerEligible: false,
  },
  {
    level: 4,
    minDaysSinceCommitment: 14,
    subject: "This is now a recurring pattern",
    openingOverride: "This pattern has now persisted across multiple cycles. Without ongoing enforcement, this will continue to recur.",
    retainerEligible: true,
  },
];

// ─── Throttle check ──────────────────────────────────────────────────────────

const MIN_HOURS_BETWEEN_BRIEFS = 72;

function parseExecutionState(canonical: string | null): {
  trajectory?: string;
  executionRate?: number;
  blockRate?: number;
  lastUpdated?: string;
} | null {
  if (!canonical) return null;
  try {
    const parsed = JSON.parse(canonical);
    return parsed?.executionState ?? null;
  } catch {
    return null;
  }
}

function hoursSince(date: Date): number {
  return (Date.now() - date.getTime()) / (1000 * 60 * 60);
}

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function shouldThrottle(
  lastBriefSentAt: Date | null,
  previousTrajectory: string | null,
  currentTrajectory: string | null,
): boolean {
  if (!lastBriefSentAt) return false; // never sent — don't throttle

  const hoursPassed = hoursSince(lastBriefSentAt);

  // Always allow if state has worsened
  if (previousTrajectory && currentTrajectory) {
    const rank: Record<string, number> = {
      ASCENDING: 1,
      STAGNANT: 2,
      FRAGILE: 3,
      DETERIORATING: 4,
    };
    const prev = rank[previousTrajectory] ?? 0;
    const curr = rank[currentTrajectory] ?? 0;
    if (curr > prev) return false; // state worsened — allow through
  }

  return hoursPassed < MIN_HOURS_BETWEEN_BRIEFS;
}

function determineEscalationLevel(
  daysSinceFirstCommitment: number,
  previousLevel: number,
): EscalationConfig {
  // Find the highest applicable escalation level
  const applicable = ESCALATION_SEQUENCE
    .filter((e) => daysSinceFirstCommitment >= e.minDaysSinceCommitment)
    .sort((a, b) => b.level - a.level);

  const next = applicable[0] ?? ESCALATION_SEQUENCE[0]!;

  // Only escalate, never de-escalate
  if (next.level <= previousLevel && applicable.length > 0) {
    const higher = applicable.find((e) => e.level > previousLevel);
    return higher ?? next;
  }

  return next;
}

// ─── Email body composition ──────────────────────────────────────────────────

function composeEmailBody(
  escalation: EscalationConfig,
  trajectory: string,
  briefUrl: string,
): string {
  const lines = [
    escalation.openingOverride,
    "",
    `Current trajectory: ${trajectory}`,
    "",
    "At this point, delay is no longer neutral.",
    "",
    "This decision is still open.",
    "",
    `View briefing: ${briefUrl}`,
  ];

  return lines.join("\n");
}

function composeEmailHtml(
  escalation: EscalationConfig,
  trajectory: string,
  briefUrl: string,
): string {
  const trajectoryColor =
    trajectory === "DETERIORATING" ? "#FC9999"
    : trajectory === "FRAGILE" ? "#C9A96E"
    : trajectory === "STAGNANT" ? "#999"
    : "#6EE7B7";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background-color:#0B0B0B;color:#F5F5F5;font-family:Georgia,serif;">
<div style="max-width:520px;margin:0 auto;padding:48px 24px;">
<p style="font-size:15px;line-height:1.75;color:rgba(255,255,255,0.70);">${escalation.openingOverride}</p>
<div style="margin:24px 0;padding:12px 16px;border-left:2px solid ${trajectoryColor};background:rgba(255,255,255,0.03);">
<p style="font-family:monospace;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.40);margin:0 0 4px;">Current trajectory</p>
<p style="font-size:18px;color:${trajectoryColor};margin:0;">${trajectory}</p>
</div>
<p style="font-size:14px;line-height:1.7;color:rgba(255,255,255,0.45);">At this point, delay is no longer neutral.</p>
<p style="font-size:15px;line-height:1.7;color:rgba(255,255,255,0.65);margin-top:16px;"><strong>This decision is still open.</strong></p>
<a href="${briefUrl}" style="display:inline-block;margin-top:24px;padding:14px 28px;background:#F5F5F5;color:#0B0B0B;font-family:monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;">View briefing</a>
<p style="margin-top:32px;font-family:monospace;font-size:9px;letter-spacing:0.06em;color:rgba(255,255,255,0.20);">Abraham of London · Decision Integrity System</p>
</div>
</body>
</html>`;
}

// ─── Main scan function ──────────────────────────────────────────────────────

export type TriggerScanResult = {
  sessionsScanned: number;
  briefsGenerated: number;
  emailsSent: number;
  errors: string[];
};

/**
 * Scan all active execution sessions and fire return briefs where warranted.
 * Call this from a cron endpoint (every 6–12 hours).
 */
export async function runReturnBriefScan(): Promise<TriggerScanResult> {
  const result: TriggerScanResult = {
    sessionsScanned: 0,
    briefsGenerated: 0,
    emailsSent: 0,
    errors: [],
  };

  try {
    // Find all active execution sessions
    const sessions = await prisma.strategyRoomExecutionSession.findMany({
      where: {
        status: { in: ["active", "monitoring"] },
      },
      include: {
        decisions: true,
      },
      take: 200, // safety limit
    });

    result.sessionsScanned = sessions.length;

    for (const session of sessions) {
      try {
        if (!session.email) continue;

        const executionState = parseExecutionState(session.canonicalSnapshot);
        const currentTrajectory = executionState?.trajectory ?? null;

        // Parse metadata for throttling
        let meta: Record<string, unknown> = {};
        try {
          meta = session.canonicalSnapshot ? JSON.parse(session.canonicalSnapshot) : {};
        } catch { /* ignore */ }

        const lastBriefSentAt = meta.lastBriefSentAt
          ? new Date(meta.lastBriefSentAt as string)
          : null;
        const previousTrajectory = (meta.previousTrajectory as string) ?? null;
        const previousEscalationLevel = (meta.escalationLevel as number) ?? 0;

        // Throttle check
        if (shouldThrottle(lastBriefSentAt, previousTrajectory, currentTrajectory)) {
          continue;
        }

        // Evaluate trigger
        const trigger = evaluateTrigger(
          executionState as Parameters<typeof evaluateTrigger>[0],
          session.decisions.map((d) => ({
            status: d.status,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt,
          })),
          session.decisions.filter((d) => d.status === "blocked").length,
        );

        if (!trigger) continue;

        // Generate brief
        const brief = await generateReturnBrief(session.id);
        if (!brief) continue;

        result.briefsGenerated++;

        // Determine escalation level
        const daysSinceCreated = daysSince(session.createdAt);
        const escalation = determineEscalationLevel(daysSinceCreated, previousEscalationLevel);

        // Override brief opening with escalation-specific copy
        brief.opening = escalation.openingOverride;

        // Compose and send email
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.abrahamoflondon.org";
        const briefUrl = `${baseUrl}/briefing/return/${session.id}`;

        const emailResult = await sendEmail({
          type: "SYSTEM",
          to: session.email,
          subject: escalation.subject,
          html: composeEmailHtml(
            escalation,
            currentTrajectory ?? "FRAGILE",
            briefUrl,
          ),
          text: composeEmailBody(
            escalation,
            currentTrajectory ?? "FRAGILE",
            briefUrl,
          ),
          meta: {
            userId: session.email,
            journeyId: session.sessionKey,
            source: "return_brief_trigger",
          },
        });

        if (emailResult.ok) {
          result.emailsSent++;
        } else {
          result.errors.push(`Email failed for ${session.id}: ${emailResult.error}`);
        }

        // Update session metadata with throttle state
        const updatedMeta = {
          ...meta,
          lastBriefSentAt: new Date().toISOString(),
          previousTrajectory: currentTrajectory,
          escalationLevel: escalation.level,
          lastTrigger: trigger,
        };

        await prisma.strategyRoomExecutionSession.update({
          where: { id: session.id },
          data: {
            canonicalSnapshot: JSON.stringify(updatedMeta),
          },
        });
      } catch (sessionError) {
        result.errors.push(
          `Session ${session.id}: ${sessionError instanceof Error ? sessionError.message : "unknown error"}`,
        );
      }
    }
  } catch (scanError) {
    result.errors.push(
      `Scan failed: ${scanError instanceof Error ? scanError.message : "unknown error"}`,
    );
  }

  return result;
}
