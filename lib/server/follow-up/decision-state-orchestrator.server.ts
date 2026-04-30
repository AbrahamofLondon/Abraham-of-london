import "server-only";

/**
 * Decision State Orchestrator — the single controlling brain.
 *
 * Scans all active sessions/journeys, computes state, enforces cooldown
 * via DecisionContactLedger, routes to exactly one system, records event.
 *
 * No independent system speaks without going through this orchestrator.
 * The system does not send messages because time passed.
 * It speaks because the decision state changed.
 */

import { prisma } from "@/lib/prisma.server";
import { sendEmail } from "@/lib/email/core/sendEmail";
import {
  computeDecisionState,
  STATE_MESSAGE_MAP,
  type DecisionStateInput,
  type DecisionStateResult,
} from "./decision-state-engine.server";
import { generateReturnBrief } from "@/lib/server/strategy-room/return-brief.server";
import { isUnsubscribed } from "@/lib/server/privacy/identity-service.server";

// ─── Types ───────────────────────────────────────────────────────────────────

export type OrchestrationDiagnostic = {
  stage: string;
  source: "strategy_room_sessions" | "pressure_loop_journeys" | "orchestrator";
  message: string;
};

export type OrchestrationResult = {
  scanned: number;
  triggered: number;
  skippedCooldown: number;
  skippedIdle: number;
  errors: number;
  /** Diagnostic details — included in dry-run responses only */
  diagnostics?: OrchestrationDiagnostic[];
};

// ─── Safe error extraction ───────────────────────────────────────────────────

function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // In production, only return the message. In dev, include more context.
    if (process.env.NODE_ENV === "production") {
      return error.message.slice(0, 200);
    }
    return `${error.message}${error.cause ? ` (cause: ${String(error.cause)})` : ""}`.slice(0, 500);
  }
  return String(error).slice(0, 200);
}

// ─── Cooldown enforcement ────────────────────────────────────────────────────

async function getLastContact(
  userId: string | null | undefined,
  sessionId: string | null | undefined,
  journeyId: string | null | undefined,
): Promise<{ sentAt: Date; severity: string } | null> {
  const where: Record<string, unknown>[] = [];
  if (userId) where.push({ userId });
  if (sessionId) where.push({ sessionId });
  if (journeyId) where.push({ journeyId });

  if (where.length === 0) return null;

  const last = await prisma.decisionContactLedger.findFirst({
    where: { OR: where },
    orderBy: { sentAt: "desc" },
  });

  return last ? { sentAt: last.sentAt, severity: last.severity } : null;
}

function hoursSince(date: Date): number {
  return (Date.now() - date.getTime()) / (1000 * 60 * 60);
}

function shouldSuppressContact(
  lastContact: { sentAt: Date; severity: string } | null,
  stateResult: DecisionStateResult,
): boolean {
  if (!lastContact) return false;

  const hours = hoursSince(lastContact.sentAt);

  // Critical severity can override cooldown
  if (stateResult.severity === "critical" && lastContact.severity !== "critical") {
    return false;
  }

  return hours < stateResult.minimumCooldownHours;
}

// ─── Record contact event ────────────────────────────────────────────────────

async function recordContact(
  input: DecisionStateInput,
  stateResult: DecisionStateResult,
): Promise<void> {
  await prisma.decisionContactLedger.create({
    data: {
      userId: input.userId ?? null,
      sessionId: input.sessionId ?? null,
      journeyId: input.journeyId ?? null,
      state: stateResult.state,
      system: stateResult.allowedSystem,
      channel: stateResult.channel,
      severity: stateResult.severity,
      metadata: {
        reason: stateResult.reason,
        trajectory: input.trajectory ?? null,
        contradictionCount: input.contradictionCount ?? 0,
        blockedDecisionCount: input.blockedDecisionCount ?? 0,
      },
    },
  });
}

// ─── Email composition ───────────────────────────────────────────────────────

function composeEmail(
  stateResult: DecisionStateResult,
  briefUrl: string | null,
): { subject: string; html: string; text: string } {
  const messages =
    stateResult.state !== "idle" && stateResult.state !== "executing"
      ? STATE_MESSAGE_MAP[stateResult.state]
      : null;

  const subject = messages?.subject ?? "Decision update";
  const opening = messages?.opening ?? stateResult.reason;

  const cta = briefUrl
    ? `View briefing: ${briefUrl}`
    : "Return to your session to take action.";

  const text = [
    opening,
    "",
    stateResult.reason,
    "",
    "This decision is still open.",
    "",
    cta,
  ].join("\n");

  const trajectoryColor =
    stateResult.severity === "critical" ? "#FC9999"
    : stateResult.severity === "high" ? "#FC9999"
    : stateResult.severity === "medium" ? "#C9A96E"
    : "#999";

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background-color:#0B0B0B;color:#F5F5F5;font-family:Georgia,serif;">
<div style="max-width:520px;margin:0 auto;padding:48px 24px;">
<p style="font-size:15px;line-height:1.75;color:rgba(255,255,255,0.70);">${opening}</p>
<p style="font-size:14px;line-height:1.7;color:rgba(255,255,255,0.45);margin-top:12px;">${stateResult.reason}</p>
<p style="font-size:15px;line-height:1.7;color:${trajectoryColor};margin-top:16px;"><strong>This decision is still open.</strong></p>
${briefUrl
    ? `<a href="${briefUrl}" style="display:inline-block;margin-top:24px;padding:14px 28px;background:#F5F5F5;color:#0B0B0B;font-family:monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;">View briefing</a>`
    : `<p style="font-size:14px;color:rgba(255,255,255,0.40);margin-top:16px;">Return to your session to take action.</p>`}
<p style="margin-top:32px;font-family:monospace;font-size:9px;letter-spacing:0.06em;color:rgba(255,255,255,0.20);">Abraham of London · Decision Integrity System</p>
<p style="margin-top:8px;font-family:monospace;font-size:8px;color:rgba(255,255,255,0.12);"><a href="${process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.abrahamoflondon.org"}/api/user/unsubscribe" style="color:rgba(255,255,255,0.15);text-decoration:underline;">Unsubscribe</a></p>
</div></body></html>`;

  return { subject, html, text };
}

// ─── Execution session scanner ───────────────────────────────────────────────

async function scanExecutionSessions(
  result: OrchestrationResult,
  dryRun: boolean,
  limit: number,
): Promise<void> {
  let sessions;
  try {
    sessions = await prisma.strategyRoomExecutionSession.findMany({
      where: { status: { in: ["active", "monitoring"] } },
      include: { decisions: true },
      take: limit,
    });
  } catch (queryError) {
    result.errors++;
    result.diagnostics?.push({
      stage: "query",
      source: "strategy_room_sessions",
      message: safeErrorMessage(queryError),
    });
    return;
  }

  for (const session of sessions) {
    try {
      if (!session.email) continue;

      // Privacy check: respect unsubscribe
      if (await isUnsubscribed(session.email)) { result.skippedIdle++; continue; }

      let canonical: Record<string, unknown> = {};
      try { canonical = session.canonicalSnapshot ? JSON.parse(session.canonicalSnapshot) : {}; } catch { /* ignore */ }
      const execState = canonical.executionState as { trajectory?: string } | undefined;

      const stateInput: DecisionStateInput = {
        userId: session.email,
        sessionId: session.id,
        lastCommitmentAt: session.createdAt,
        lastActionAt: session.decisions.length > 0
          ? session.decisions.reduce((latest, d) =>
              d.updatedAt > latest ? d.updatedAt : latest, session.decisions[0]!.updatedAt)
          : null,
        pendingDecisionCount: session.decisions.filter((d) => d.status === "pending").length,
        executedDecisionCount: session.decisions.filter((d) => d.status === "executed").length,
        blockedDecisionCount: session.decisions.filter((d) => d.status === "blocked").length,
        trajectory: (execState?.trajectory as DecisionStateInput["trajectory"]) ?? null,
        contradictionCount: session.decisions.filter((d) => d.status === "blocked").length,
        paidSession: true,
        buyerStatus: "strategy_room",
      };

      const stateResult = computeDecisionState(stateInput);

      if (stateResult.allowedSystem === "none") {
        result.skippedIdle++;
        continue;
      }

      // Cooldown check
      const lastContact = await getLastContact(session.email, session.id, null);
      if (shouldSuppressContact(lastContact, stateResult)) {
        result.skippedCooldown++;
        continue;
      }

      if (dryRun) {
        result.triggered++;
        continue;
      }

      // Generate brief URL if return_brief or retainer_gate
      let briefUrl: string | null = null;
      if (stateResult.allowedSystem === "return_brief" || stateResult.allowedSystem === "retainer_gate") {
        const brief = await generateReturnBrief(session.id);
        if (brief) {
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.abrahamoflondon.org";
          briefUrl = `${baseUrl}/briefing/return/${session.id}`;
        }
      }

      // Send email
      const email = composeEmail(stateResult, briefUrl);
      const emailResult = await sendEmail({
        type: "SYSTEM",
        to: session.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
        meta: { userId: session.email, journeyId: session.sessionKey, source: "decision_state_orchestrator" },
      });

      if (emailResult.ok) {
        result.triggered++;
        await recordContact(stateInput, stateResult);
      } else {
        result.errors++;
        result.diagnostics?.push({
          stage: "send_email",
          source: "strategy_room_sessions",
          message: `Email send failed for session ${session.id}`,
        });
      }
    } catch (sessionError) {
      result.errors++;
      result.diagnostics?.push({
        stage: "process_session",
        source: "strategy_room_sessions",
        message: safeErrorMessage(sessionError),
      });
    }
  }
}

// ─── Pressure loop scanner (free ladder journeys) ────────────────────────────

async function scanPressureLoopJourneys(
  result: OrchestrationResult,
  dryRun: boolean,
  limit: number,
): Promise<void> {
  let journeys;
  try {
    journeys = await prisma.diagnosticJourney.findMany({
      where: { diagnosticType: "pressure_loop", status: "active" },
      take: limit,
    });
  } catch (queryError) {
    result.errors++;
    result.diagnostics?.push({
      stage: "query",
      source: "pressure_loop_journeys",
      message: safeErrorMessage(queryError),
    });
    return;
  }

  for (const journey of journeys) {
    try {
      if (!journey.email) continue;

      // Privacy check: respect unsubscribe
      if (await isUnsubscribed(journey.email)) { result.skippedIdle++; continue; }

      let loop: Record<string, unknown> = {};
      try {
        loop = journey.mergedTensionThread
          ? (typeof journey.mergedTensionThread === "string"
              ? JSON.parse(journey.mergedTensionThread)
              : journey.mergedTensionThread) as Record<string, unknown>
          : {};
      } catch { /* ignore */ }

      const messages = (loop.messages ?? []) as Array<{
        sent?: boolean;
        actionRecorded?: boolean;
        scheduledAt?: string;
        subject?: string;
        body?: string;
      }>;

      const dueMessage = messages.find(
        (m) => !m.sent && !m.actionRecorded && m.scheduledAt && new Date(m.scheduledAt) <= new Date(),
      );

      if (!dueMessage) {
        result.skippedIdle++;
        continue;
      }

      const stateInput: DecisionStateInput = {
        userId: journey.email,
        journeyId: journey.id,
        lastCommitmentAt: journey.startedAt,
        lastActionAt: null,
        buyerStatus: "free",
      };

      const stateResult = computeDecisionState(stateInput);

      if (stateResult.allowedSystem === "none") {
        result.skippedIdle++;
        continue;
      }

      // Only allow pressure_loop system for free ladder
      if (stateResult.allowedSystem !== "pressure_loop" && stateResult.allowedSystem !== "escalation_engine") {
        result.skippedIdle++;
        continue;
      }

      // Cooldown check
      const lastContact = await getLastContact(journey.email, null, journey.id);
      if (shouldSuppressContact(lastContact, stateResult)) {
        result.skippedCooldown++;
        continue;
      }

      if (dryRun) {
        result.triggered++;
        continue;
      }

      // Send the due message
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.abrahamoflondon.org";
      const emailResult = await sendEmail({
        type: "TRANSACTIONAL",
        to: journey.email,
        subject: dueMessage.subject ?? STATE_MESSAGE_MAP.committed_no_action.subject,
        html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background-color:#0B0B0B;color:#F5F5F5;font-family:Georgia,serif;">
<div style="max-width:520px;margin:0 auto;padding:48px 24px;">
<p style="font-size:15px;line-height:1.75;color:rgba(255,255,255,0.70);">${dueMessage.body ?? stateResult.reason}</p>
<p style="font-size:15px;line-height:1.7;color:#C9A96E;margin-top:16px;"><strong>This decision is still open.</strong></p>
<a href="${baseUrl}/diagnostics/fast" style="display:inline-block;margin-top:24px;padding:14px 28px;background:#F5F5F5;color:#0B0B0B;font-family:monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;">Return to diagnostic</a>
<p style="margin-top:32px;font-family:monospace;font-size:9px;letter-spacing:0.06em;color:rgba(255,255,255,0.20);">Abraham of London · Decision Integrity System</p>
<p style="margin-top:8px;font-family:monospace;font-size:8px;color:rgba(255,255,255,0.12);"><a href="${process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.abrahamoflondon.org"}/api/user/unsubscribe" style="color:rgba(255,255,255,0.15);text-decoration:underline;">Unsubscribe</a></p>
</div></body></html>`,
        text: `${dueMessage.body ?? stateResult.reason}\n\nThis decision is still open.\n\nReturn: ${baseUrl}/diagnostics/fast`,
        meta: { userId: journey.email, journeyId: journey.id, source: "decision_state_orchestrator" },
      });

      if (emailResult.ok) {
        result.triggered++;
        dueMessage.sent = true;

        // Update the journey with marked message
        await prisma.diagnosticJourney.update({
          where: { id: journey.id },
          data: { mergedTensionThread: JSON.parse(JSON.stringify(loop)) },
        });

        // Check if all messages sent — mark journey completed
        const allSent = messages.every((m) => m.sent || m.actionRecorded);
        if (allSent) {
          await prisma.diagnosticJourney.update({
            where: { id: journey.id },
            data: { status: "completed" },
          });
        }

        await recordContact(stateInput, stateResult);
      } else {
        result.errors++;
        result.diagnostics?.push({
          stage: "send_email",
          source: "pressure_loop_journeys",
          message: `Email send failed for journey ${journey.id}`,
        });
      }
    } catch (journeyError) {
      result.errors++;
      result.diagnostics?.push({
        stage: "process_journey",
        source: "pressure_loop_journeys",
        message: safeErrorMessage(journeyError),
      });
    }
  }
}

// ─── Main orchestrator ───────────────────────────────────────────────────────

export async function runDecisionStateOrchestrator(options?: {
  dryRun?: boolean;
  limit?: number;
}): Promise<OrchestrationResult> {
  const dryRun = options?.dryRun ?? false;
  const limit = options?.limit ?? 100;

  const diagnostics: OrchestrationDiagnostic[] = [];
  const result: OrchestrationResult = {
    scanned: 0,
    triggered: 0,
    skippedCooldown: 0,
    skippedIdle: 0,
    errors: 0,
    diagnostics,
  };

  try {
    // Scan paid Strategy Room sessions
    await scanExecutionSessions(result, dryRun, limit);

    // Scan free ladder pressure loops
    await scanPressureLoopJourneys(result, dryRun, limit);

    // Count total scanned
    result.scanned = result.triggered + result.skippedCooldown + result.skippedIdle + result.errors;
  } catch (error) {
    console.error("[decision-state-orchestrator]", error);
    result.errors++;
    diagnostics.push({
      stage: "orchestrator_main",
      source: "orchestrator",
      message: safeErrorMessage(error),
    });
  }

  // Only include diagnostics in dry-run responses
  if (!dryRun) {
    delete result.diagnostics;
  }

  return result;
}
