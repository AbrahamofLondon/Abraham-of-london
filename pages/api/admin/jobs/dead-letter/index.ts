/* ============================================================================
   FILE: pages/api/admin/jobs/dead-letter/index.ts
   PURPOSE:
   - List dead-letter items
   - Resolve or discard manually from admin surface
============================================================================ */

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  listDeadLetters,
  markDeadLetterResolved,
  markDeadLetterDiscarded,
} from "@/lib/server/jobs/dead-letter";

import { BOOTSTRAP_ADMIN_EMAILS } from "@/lib/access/admin-emails";

function isAdmin(session: any) {
  const email = String(session?.user?.email || "").toLowerCase();
  return BOOTSTRAP_ADMIN_EMAILS.has(email);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !isAdmin(session)) {
    return res.status(403).json({ ok: false, error: "FORBIDDEN" });
  }

  if (req.method === "GET") {
    const status =
      typeof req.query.status === "string" ? req.query.status : undefined;
    const queue =
      typeof req.query.queue === "string" ? req.query.queue : undefined;
    const take =
      typeof req.query.take === "string" ? Number(req.query.take) : 100;

    const items = await listDeadLetters({
      status: status as any,
      queue,
      take: Number.isFinite(take) ? take : 100,
    });

    return res.status(200).json({ ok: true, items });
  }

  if (req.method === "POST") {
    const { id, action, note } = req.body || {};

    if (!id || typeof id !== "string") {
      return res.status(400).json({ ok: false, error: "ID_REQUIRED" });
    }

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