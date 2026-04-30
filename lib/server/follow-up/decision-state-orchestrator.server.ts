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

import { siteConfig } from "@/config/site";
import {
  buildCriticalPatternEmail,
  buildDecisionDriftEmail,
  buildReturnBriefEmail,
  type BuiltDecisionEmail,
} from "@/lib/email/decision-email-builder";
import { sendEmail } from "@/lib/email/core/sendEmail";
import { prisma } from "@/lib/prisma.server";
import { isUnsubscribed } from "@/lib/server/privacy/identity-service.server";
import { generateReturnBrief } from "@/lib/server/strategy-room/return-brief.server";
import {
  computeDecisionState,
  type DecisionStateInput,
  type DecisionStateResult,
} from "./decision-state-engine.server";

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
  diagnostics?: OrchestrationDiagnostic[];
};

type ContactIdentity = {
  userId?: string | null;
  sessionId?: string | null;
  journeyId?: string | null;
};

type ContactTone = {
  emailClass: string;
  toneKey: string;
};

function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (process.env.NODE_ENV === "production") {
      return error.message.slice(0, 200);
    }
    return `${error.message}${error.cause ? ` (cause: ${String(error.cause)})` : ""}`.slice(0, 500);
  }
  return String(error).slice(0, 200);
}

function hoursSince(date: Date): number {
  return (Date.now() - date.getTime()) / (1000 * 60 * 60);
}

function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL?.trim()
    || process.env.NEXT_PUBLIC_SITE_URL?.trim()
    || siteConfig.url
    || "https://www.abrahamoflondon.org"
  ).replace(/\/$/, "");
}

function getDeleteUrl(email?: string | null): string {
  const contactEmail = siteConfig.contact.email || "info@abrahamoflondon.org";
  const subject = encodeURIComponent("Delete my data");
  const body = encodeURIComponent(email ? `Please remove data associated with ${email}.` : "Please remove my data.");
  return `mailto:${contactEmail}?subject=${subject}&body=${body}`;
}

function getUnsubscribeUrl(email?: string | null): string {
  const contactEmail = siteConfig.contact.email || "info@abrahamoflondon.org";
  const subject = encodeURIComponent("Unsubscribe");
  const body = encodeURIComponent(email ? `Please unsubscribe ${email}.` : "Please unsubscribe me.");
  return `mailto:${contactEmail}?subject=${subject}&body=${body}`;
}

async function getLastContact(identity: ContactIdentity): Promise<{ sentAt: Date; severity: string } | null> {
  const where: Record<string, unknown>[] = [];
  if (identity.userId) where.push({ userId: identity.userId });
  if (identity.sessionId) where.push({ sessionId: identity.sessionId });
  if (identity.journeyId) where.push({ journeyId: identity.journeyId });

  if (where.length === 0) return null;

  const last = await prisma.decisionContactLedger.findFirst({
    where: { OR: where },
    orderBy: { sentAt: "desc" },
  });

  return last ? { sentAt: last.sentAt, severity: last.severity } : null;
}

async function hasRecentToneMatch(
  identity: ContactIdentity,
  tone: ContactTone,
  windowHours: number,
): Promise<boolean> {
  const where: Record<string, unknown>[] = [];
  if (identity.userId) where.push({ userId: identity.userId });
  if (identity.sessionId) where.push({ sessionId: identity.sessionId });
  if (identity.journeyId) where.push({ journeyId: identity.journeyId });

  if (where.length === 0) return false;

  const cutoff = new Date(Date.now() - windowHours * 60 * 60 * 1000);
  const recent = await prisma.decisionContactLedger.findMany({
    where: {
      OR: where,
      sentAt: { gte: cutoff },
    },
    orderBy: { sentAt: "desc" },
    take: 12,
    select: { metadata: true },
  });

  return recent.some((entry) => {
    if (!entry.metadata || typeof entry.metadata !== "object" || Array.isArray(entry.metadata)) {
      return false;
    }
    const meta = entry.metadata as Record<string, unknown>;
    return meta.toneKey === tone.toneKey || meta.emailClass === tone.emailClass;
  });
}

function shouldSuppressContact(
  lastContact: { sentAt: Date; severity: string } | null,
  stateResult: DecisionStateResult,
): boolean {
  if (!lastContact) return false;

  const hours = hoursSince(lastContact.sentAt);
  if (stateResult.severity === "critical" && lastContact.severity !== "critical") {
    return false;
  }

  return hours < stateResult.minimumCooldownHours;
}

async function recordContact(
  input: DecisionStateInput,
  stateResult: DecisionStateResult,
  tone: ContactTone,
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
        emailClass: tone.emailClass,
        toneKey: tone.toneKey,
      },
    },
  });
}

function mapTrajectory(
  trajectory: DecisionStateInput["trajectory"],
): "executing" | "stalled" | "fragile" | "deteriorating" {
  if (trajectory === "DETERIORATING") return "deteriorating";
  if (trajectory === "FRAGILE") return "fragile";
  if (trajectory === "ASCENDING") return "executing";
  return "stalled";
}

async function buildStrategyRoomEmail(
  session: {
    email: string | null;
    sessionKey: string;
    conditionSummary: string | null;
    coreProblem: string | null;
    createdAt: Date;
    decisions: Array<{ updatedAt: Date; status: string }>;
  },
  stateInput: DecisionStateInput,
  stateResult: DecisionStateResult,
): Promise<BuiltDecisionEmail | null> {
  const baseUrl = getBaseUrl();
  const secureLink = `${baseUrl}/briefing/return/${session.sessionKey}`;
  const unsubscribeUrl = getUnsubscribeUrl(session.email);
  const deleteUrl = getDeleteUrl(session.email);
  const brief = await generateReturnBrief(session.sessionKey);

  const decision = session.conditionSummary || "the open decision";
  const pattern = stateResult.reason;
  const lastActivityAt = session.decisions.length > 0
    ? session.decisions.reduce((latest, item) => (item.updatedAt > latest ? item.updatedAt : latest), session.decisions[0]!.updatedAt)
    : session.createdAt;

  if (stateResult.state === "recurring_pattern") {
    return buildCriticalPatternEmail({
      decision,
      pattern,
      trajectory: mapTrajectory(stateInput.trajectory ?? null),
      secureLink,
      unsubscribeUrl,
      deleteUrl,
      contradictionSummary: brief?.challenge ?? brief?.trajectory.reason ?? pattern,
      lastActivityAt,
    });
  }

  if (stateResult.state === "fragile" || stateResult.state === "deteriorating") {
    return buildReturnBriefEmail({
      decision,
      pattern,
      trajectory: mapTrajectory(stateInput.trajectory ?? null),
      secureLink,
      unsubscribeUrl,
      deleteUrl,
      contradictionSummary: brief?.trajectory.reason ?? brief?.challenge ?? pattern,
      lastActivityAt,
    });
  }

  if (stateResult.state === "committed_no_action" || stateResult.state === "stalled") {
    return buildDecisionDriftEmail({
      decision,
      pattern,
      trajectory: mapTrajectory(stateInput.trajectory ?? null),
      secureLink,
      unsubscribeUrl,
      deleteUrl,
      contradictionSummary: brief?.trajectory.reason ?? pattern,
      lastActivityAt,
    });
  }

  return null;
}

function buildPressureLoopEmail(
  journey: {
    email: string | null;
    journeyKey: string;
    startedAt: Date;
  },
  stateInput: DecisionStateInput,
  stateResult: DecisionStateResult,
  pattern: string,
): BuiltDecisionEmail {
  const baseUrl = getBaseUrl();
  return buildDecisionDriftEmail({
    decision: "the open decision",
    pattern,
    trajectory: mapTrajectory(stateInput.trajectory ?? null),
    secureLink: `${baseUrl}/diagnostics/fast?journeyKey=${encodeURIComponent(journey.journeyKey)}`,
    unsubscribeUrl: getUnsubscribeUrl(journey.email),
    deleteUrl: getDeleteUrl(journey.email),
    lastActivityAt: journey.startedAt,
  });
}

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
      if (await isUnsubscribed(session.email)) {
        result.skippedIdle++;
        continue;
      }

      let canonical: Record<string, unknown> = {};
      try {
        canonical = session.canonicalSnapshot ? JSON.parse(session.canonicalSnapshot) : {};
      } catch {
        canonical = {};
      }
      const execState = canonical.executionState as { trajectory?: string } | undefined;

      const stateInput: DecisionStateInput = {
        userId: session.email,
        sessionId: session.id,
        lastCommitmentAt: session.createdAt,
        lastActionAt: session.decisions.length > 0
          ? session.decisions.reduce((latest, d) => (d.updatedAt > latest ? d.updatedAt : latest), session.decisions[0]!.updatedAt)
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

      const email = await buildStrategyRoomEmail(session, stateInput, stateResult);
      if (!email) {
        result.skippedIdle++;
        continue;
      }

      const identity: ContactIdentity = {
        userId: session.email,
        sessionId: session.id,
      };

      const lastContact = await getLastContact(identity);
      if (shouldSuppressContact(lastContact, stateResult)) {
        result.skippedCooldown++;
        continue;
      }

      if (await hasRecentToneMatch(identity, email, stateResult.minimumCooldownHours)) {
        result.skippedCooldown++;
        continue;
      }

      if (dryRun) {
        result.triggered++;
        continue;
      }

      const emailResult = await sendEmail({
        type: "SYSTEM",
        to: session.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
        meta: {
          userId: session.email,
          journeyId: session.sessionKey,
          source: "decision_state_orchestrator",
        },
      });

      if (emailResult.ok) {
        result.triggered++;
        await recordContact(stateInput, stateResult, email);
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
      if (await isUnsubscribed(journey.email)) {
        result.skippedIdle++;
        continue;
      }

      let loop: Record<string, unknown> = {};
      try {
        loop = journey.mergedTensionThread
          ? (typeof journey.mergedTensionThread === "string"
              ? JSON.parse(journey.mergedTensionThread)
              : journey.mergedTensionThread) as Record<string, unknown>
          : {};
      } catch {
        loop = {};
      }

      const messages = (loop.messages ?? []) as Array<{
        sent?: boolean;
        actionRecorded?: boolean;
        scheduledAt?: string;
        body?: string;
      }>;

      const dueMessage = messages.find(
        (message) => !message.sent && !message.actionRecorded && message.scheduledAt && new Date(message.scheduledAt) <= new Date(),
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

      if (stateResult.allowedSystem !== "pressure_loop" && stateResult.allowedSystem !== "escalation_engine") {
        result.skippedIdle++;
        continue;
      }

      const email = buildPressureLoopEmail(
        journey,
        stateInput,
        stateResult,
        dueMessage.body ?? stateResult.reason,
      );

      const identity: ContactIdentity = {
        userId: journey.email,
        journeyId: journey.id,
      };

      const lastContact = await getLastContact(identity);
      if (shouldSuppressContact(lastContact, stateResult)) {
        result.skippedCooldown++;
        continue;
      }

      if (await hasRecentToneMatch(identity, email, stateResult.minimumCooldownHours)) {
        result.skippedCooldown++;
        continue;
      }

      if (dryRun) {
        result.triggered++;
        continue;
      }

      const emailResult = await sendEmail({
        type: "TRANSACTIONAL",
        to: journey.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
        meta: {
          userId: journey.email,
          journeyId: journey.journeyKey,
          source: "decision_state_orchestrator",
        },
      });

      if (emailResult.ok) {
        result.triggered++;
        dueMessage.sent = true;

        await prisma.diagnosticJourney.update({
          where: { id: journey.id },
          data: { mergedTensionThread: JSON.parse(JSON.stringify(loop)) },
        });

        const allSent = messages.every((message) => message.sent || message.actionRecorded);
        if (allSent) {
          await prisma.diagnosticJourney.update({
            where: { id: journey.id },
            data: { status: "completed" },
          });
        }

        await recordContact(stateInput, stateResult, email);
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
    await scanExecutionSessions(result, dryRun, limit);
    await scanPressureLoopJourneys(result, dryRun, limit);
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

  if (!dryRun) {
    delete result.diagnostics;
  }

  return result;
}
