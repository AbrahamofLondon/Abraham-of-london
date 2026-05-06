/* ============================================================================
   FILE: pages/api/admin/jobs/dead-letter/index.ts
   PURPOSE:
   - List dead-letter items
   - Resolve or discard manually from admin surface
============================================================================ */

import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import {
  listDeadLetters,
  markDeadLetterResolved,
  markDeadLetterDiscarded,
} from "@/lib/server/jobs/dead-letter";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";

const querySchema = z.object({
  status: z.string().trim().max(64).optional(),
  queue: z.string().trim().max(128).optional(),
  take: z.coerce.number().int().min(1).max(200).optional().default(100),
}).strict();

const bodySchema = z.object({
  id: z.string().trim().min(1).max(128),
  action: z.enum(["resolve", "discard"]),
  note: z.string().trim().max(1000).optional(),
}).strict();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminServer(req, res, { routeKey: "admin-dead-letter-index" });
  if (!session) return;

  if (req.method === "GET") {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "INVALID_REQUEST" });
    }

    const { status, queue, take } = parsed.data;

    const items = await listDeadLetters({
      status: status as any,
      queue,
      take,
    });

    return res.status(200).json({ ok: true, items });
  }

  if (req.method === "POST") {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "INVALID_REQUEST" });
    }
    const { id, action, note } = parsed.data;

    if (action === "resolve") {
      const item = await markDeadLetterResolved(id, note);
      return res.status(200).json({ ok: true, item });
    }

    if (action === "discard") {
      const item = await markDeadLetterDiscarded(id, note);
      return res.status(200).json({ ok: true, item });
    }

    return res.status(400).json({ ok: false, error: "INVALID_ACTION" });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
}
