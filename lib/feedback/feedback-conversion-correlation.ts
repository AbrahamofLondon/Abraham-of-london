import { prisma } from "@/lib/prisma.server";
import type { FeedbackEventRecord } from "./feedback-types";

export type FeedbackConversionEventType =
  | "checkout"
  | "save_case"
  | "return_visit"
  | "booked_call"
  | "case_study_consent"
  | "retainer_evaluation"
  | "strategy_room_entry"
  | "boardroom_brief_purchase";

export type FeedbackConversionCorrelation = {
  feedbackId: string;
  eventType: FeedbackConversionEventType;
  observed: boolean;
  windowDays: 14 | 30;
  language: "associated_with" | "followed_by" | "conversion_observed_after_feedback";
  observedAt: string | null;
  source: "system_audit_log" | "access_audit_log" | "provided_event";
};

type CandidateEvent = {
  eventType: FeedbackConversionEventType;
  observedAt: Date | string;
};

const EVENT_ACTIONS: Record<FeedbackConversionEventType, string[]> = {
  checkout: ["CHECKOUT_COMPLETED", "stripe.checkout.completed", "purchase.completed"],
  save_case: ["DECISION_CASE_SAVED", "decision_centre.case_saved"],
  return_visit: ["RETURN_VISIT", "session.returned"],
  booked_call: ["CALL_BOOKED", "sales.call_booked"],
  case_study_consent: ["CASE_STUDY_CONSENT_GRANTED", "case_study.consent_granted"],
  retainer_evaluation: ["FEEDBACK_RETAINER_READINESS_EVALUATION_CREATED", "retainer_readiness.candidate_created"],
  strategy_room_entry: ["STRATEGY_ROOM_STARTED", "strategy_room.entry"],
  boardroom_brief_purchase: ["BOARDROOM_BRIEF_PURCHASED", "boardroom_brief.purchase"],
};

function windowDaysFor(eventType: FeedbackConversionEventType): 14 | 30 {
  return eventType === "case_study_consent" || eventType === "retainer_evaluation" ? 30 : 14;
}

function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function inWindow(feedbackAt: Date, eventAt: Date, days: number): boolean {
  const delta = eventAt.getTime() - feedbackAt.getTime();
  return delta >= 0 && delta <= days * 24 * 60 * 60 * 1000;
}

export function correlateProvidedEvents(
  feedback: FeedbackEventRecord,
  events: CandidateEvent[],
): FeedbackConversionCorrelation[] {
  return events
    .map((event) => {
      const observedAt = asDate(event.observedAt);
      const windowDays = windowDaysFor(event.eventType);
      return {
        feedbackId: feedback.feedbackId,
        eventType: event.eventType,
        observed: inWindow(feedback.createdAt, observedAt, windowDays),
        windowDays,
        language: "conversion_observed_after_feedback" as const,
        observedAt: observedAt.toISOString(),
        source: "provided_event" as const,
      };
    })
    .filter((item) => item.observed);
}

export async function findFeedbackConversionCorrelations(
  feedback: FeedbackEventRecord,
): Promise<FeedbackConversionCorrelation[]> {
  const identityWhere = [
    ...(feedback.email ? [{ actorEmail: feedback.email }] : []),
    ...(feedback.userId ? [{ actorId: feedback.userId }] : []),
    ...(feedback.sessionId ? [{ sessionId: feedback.sessionId }] : []),
  ];
  if (identityWhere.length === 0) return [];

  const actions = Object.values(EVENT_ACTIONS).flat();
  const rows = await prisma.systemAuditLog.findMany({
    where: {
      OR: identityWhere,
      action: { in: actions },
      createdAt: { gte: feedback.createdAt },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: { action: true, createdAt: true },
  }).catch(() => []);

  return rows.flatMap((row) => {
    const eventType = (Object.keys(EVENT_ACTIONS) as FeedbackConversionEventType[])
      .find((key) => EVENT_ACTIONS[key].includes(row.action));
    if (!eventType) return [];
    const windowDays = windowDaysFor(eventType);
    if (!inWindow(feedback.createdAt, row.createdAt, windowDays)) return [];
    return [{
      feedbackId: feedback.feedbackId,
      eventType,
      observed: true,
      windowDays,
      language: "conversion_observed_after_feedback" as const,
      observedAt: row.createdAt.toISOString(),
      source: "system_audit_log" as const,
    }];
  });
}
