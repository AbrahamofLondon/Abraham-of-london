/* pages/api/inner-circle/worksheet-action.ts — Phase 4: Worksheet Enforcement */
/* Added: dueDate, completedAt, reminderSentAt, actionStatus, auto-overdue, path step completion */

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { ensureOperatingProfile } from "@/lib/inner-circle/operating-repository.server";
import { consumeRateLimit, buildRateLimitKey } from "@/lib/server/security/rate-limit-provider";

type WorksheetActionItem = {
  id: string;
  task: string;
  response: string | null;
  deadline: string | null;
  status: string;
  note: string | null;
  nextReviewDate: string | null;
  sortOrder: number;
  completedAt: string | null;
  reminderSentAt: string | null;
};

type Response =
  | { ok: true; actions?: WorksheetActionItem[] }
  | { ok: false; error: string };

function safeString(value: unknown, max = 2000): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function safeDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Response>) {
  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return res.status(401).json({ ok: false, error: "AUTH_REQUIRED" });
  }

  await ensureOperatingProfile({
    userId,
    email: session.user?.email ?? null,
    name: session.user?.name ?? null,
  });

  // Rate limit mutations: 30 PATCH requests per user per hour
  if (req.method === "PATCH") {
    const rateLimitKey = buildRateLimitKey("worksheet-action", userId);
    const verdict = await consumeRateLimit({
      key: rateLimitKey,
      limit: 30,
      windowMs: 3600_000,
      failClosed: false,
    });
    if (!verdict.allowed) {
      res.setHeader("Retry-After", Math.ceil(verdict.retryAfterMs / 1000));
      return res.status(429).json({ ok: false, error: "RATE_LIMIT_EXCEEDED" });
    }
  }

  // GET: fetch user's worksheet actions with overdue detection
  if (req.method === "GET") {
    const pathSlug = safeString(req.query?.pathSlug, 80) || "founder-under-pressure";

    // Auto-mark overdue actions
    await prisma.$executeRaw`
      UPDATE inner_circle_worksheet_actions
      SET status = 'overdue', updated_at = NOW()
      WHERE user_id = ${userId}
        AND path_slug = ${pathSlug}
        AND status IN ('not_started', 'in_progress')
        AND deadline IS NOT NULL
        AND deadline < NOW()
    `;

    const actions = await prisma.$queryRaw<Array<{
      id: string;
      task: string;
      response: string | null;
      deadline: Date | null;
      status: string;
      note: string | null;
      next_review_date: Date | null;
      sort_order: number;
      completed_at: Date | null;
      reminder_sent_at: Date | null;
    }>>`
      SELECT id, task, response, deadline, status, note, next_review_date, sort_order, completed_at, reminder_sent_at
      FROM inner_circle_worksheet_actions
      WHERE user_id = ${userId}
        AND path_slug = ${pathSlug}
      ORDER BY sort_order ASC
    `;

    return res.status(200).json({
      ok: true,
      actions: actions.map((a) => ({
        id: a.id,
        task: a.task,
        response: a.response,
        deadline: a.deadline?.toISOString() ?? null,
        status: a.status,
        note: a.note,
        nextReviewDate: a.next_review_date?.toISOString() ?? null,
        sortOrder: a.sort_order,
        completedAt: a.completed_at?.toISOString() ?? null,
        reminderSentAt: a.reminder_sent_at?.toISOString() ?? null,
      })),
    });
  }

  if (req.method !== "PATCH") {
    res.setHeader("Allow", "GET, PATCH");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const actionId = safeString(req.body?.id, 120);
  if (!actionId) {
    return res.status(400).json({ ok: false, error: "ACTION_ID_REQUIRED" });
  }

  const status = safeString(req.body?.status, 40) ?? "not_started";
  const allowedStatus = new Set(["not_started", "in_progress", "completed", "deferred", "overdue"]);
  const finalStatus = allowedStatus.has(status) ? status : "not_started";

  const completedAt = finalStatus === "completed" ? new Date() : safeDate(req.body?.completedAt);

  // Default due dates: +7, +14, +21 days from now if not provided
  let dueDate = safeDate(req.body?.dueDate);
  if (!dueDate && req.body?.dueDateOffsetDays) {
    const offset = parseInt(String(req.body.dueDateOffsetDays), 10);
    if (Number.isFinite(offset)) {
      dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + offset);
    }
  }

  await prisma.$executeRaw`
    UPDATE inner_circle_worksheet_actions
    SET
      response = ${safeString(req.body?.response, 4000)},
      deadline = ${dueDate ?? safeDate(req.body?.deadline)},
      status = ${finalStatus},
      note = ${safeString(req.body?.note, 2000)},
      next_review_date = ${safeDate(req.body?.nextReviewDate)},
      completed_at = ${completedAt},
      updated_at = NOW()
    WHERE id = ${actionId}
      AND user_id = ${userId}
  `;

  // If all actions for this path are completed, mark path step complete
  if (finalStatus === "completed") {
    const pathSlug = safeString(req.body?.pathSlug, 80) || "founder-under-pressure";

    const remaining = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM inner_circle_worksheet_actions
      WHERE user_id = ${userId}
        AND path_slug = ${pathSlug}
        AND status != 'completed'
    `;

    if (Number(remaining[0]?.count ?? 0) === 0) {
      await prisma.$executeRaw`
        UPDATE inner_circle_reading_path_progress
        SET status = 'completed', completed_at = NOW(), updated_at = NOW()
        WHERE user_id = ${userId}
          AND path_slug = ${pathSlug}
      `;
    }
  }

  return res.status(200).json({ ok: true });
}