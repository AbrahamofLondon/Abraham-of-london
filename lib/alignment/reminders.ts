import { prisma } from "@/lib/prisma";
import { buildAlignmentNarrative } from "./report-language";
import { getLatestPurposeAlignmentAssessment } from "./repository";

export async function upsertReminderPreference(params: {
  userId?: string | null;
  sessionKey?: string | null;
  email?: string | null;
  isEnabled: boolean;
  cadenceDays?: number;
}) {
  const where = params.userId
    ? { userId: params.userId }
    : { sessionKey: params.sessionKey ?? undefined };

  const existing = await prisma.purposeAlignmentReminderPreference.findFirst({
    where,
  });

  if (existing) {
    return prisma.purposeAlignmentReminderPreference.update({
      where: { id: existing.id },
      data: {
        email: params.email ?? existing.email,
        isEnabled: params.isEnabled,
        cadenceDays: params.cadenceDays ?? existing.cadenceDays,
      },
    });
  }

  return prisma.purposeAlignmentReminderPreference.create({
    data: {
      userId: params.userId ?? null,
      sessionKey: params.sessionKey ?? null,
      email: params.email ?? null,
      isEnabled: params.isEnabled,
      cadenceDays: params.cadenceDays ?? 30,
    },
  });
}

export async function getReminderStatus(params: {
  userId?: string | null;
  sessionKey?: string | null;
}) {
  const latest = await getLatestPurposeAlignmentAssessment(params);
  if (!latest) {
    return {
      isDue: false,
      nextDueAt: null,
      latestAssessmentAt: null,
      prompt: "No assessment has been recorded yet.",
    };
  }

  const dueDate = new Date(latest.createdAt);
  dueDate.setDate(dueDate.getDate() + 30);

  const now = new Date();
  const isDue = now >= dueDate;

  const narrative = buildAlignmentNarrative(latest);

  return {
    isDue,
    nextDueAt: dueDate.toISOString(),
    latestAssessmentAt: latest.createdAt,
    prompt: narrative.reminderPrompt,
  };
}

export async function runReminderSweep() {
  const prefs = await prisma.purposeAlignmentReminderPreference.findMany({
    where: { isEnabled: true },
  });

  const results = {
    processed: 0,
    queued: 0,
    skipped: 0,
    errors: 0,
  };

  for (const pref of prefs) {
    try {
      const latest = await getLatestPurposeAlignmentAssessment({
        userId: pref.userId,
        sessionKey: pref.sessionKey,
      });

      if (!latest) {
        results.skipped++;
        continue;
      }

      const dueDate = new Date(latest.createdAt);
      dueDate.setDate(dueDate.getDate() + pref.cadenceDays);
      dueDate.setHours(0, 0, 0, 0);

      const now = new Date();
      if (now < dueDate) {
        results.skipped++;
        continue;
      }

      // Check if we already logged a reminder for this assessment period
      const alreadyLogged = await prisma.purposeAlignmentReminderLog.findFirst({
        where: {
          userId: pref.userId,
          sessionKey: pref.sessionKey,
          assessmentId: latest.id,
          scheduledFor: {
            gte: dueDate,
            lt: new Date(dueDate.getTime() + 86400000),
          },
        },
      });

      if (alreadyLogged) {
        results.skipped++;
        continue;
      }

      const narrative = buildAlignmentNarrative(latest);

      await prisma.purposeAlignmentReminderLog.create({
        data: {
          userId: pref.userId,
          sessionKey: pref.sessionKey,
          email: pref.email,
          assessmentId: latest.id,
          status: "queued",
          channel: pref.email ? "email" : "in_app",
          scheduledFor: dueDate,
          payload: JSON.stringify({
            prompt: narrative.reminderPrompt,
            band: latest.band,
            totalScore: latest.totalScore,
            percentScore: latest.percentScore,
          }),
        },
      });

      await prisma.purposeAlignmentReminderPreference.update({
        where: { id: pref.id },
        data: { lastSentAt: now },
      });

      results.queued++;
      results.processed++;
    } catch (error) {
      console.error(`[ReminderSweep] Failed for preference ${pref.id}:`, error);
      results.errors++;
    }
  }

  return results;
}

// Legacy alias for backward compatibility
export const runMonthlyReminderSweep = runReminderSweep;