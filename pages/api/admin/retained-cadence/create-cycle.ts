import type { NextApiRequest, NextApiResponse } from "next";

import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import { createNextReviewCycle } from "@/lib/product/retained-cadence-service";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await requireAdminServer(req, res, {
    routeKey: "admin-retained-cadence-create-cycle",
  });
  if (!session) return;

  const body = (req.body ?? {}) as {
    scopeId?: string;
    intervalDays?: number;
    note?: string;
  };

  if (typeof body.scopeId !== "string" || !body.scopeId.trim()) {
    return res.status(400).json({ ok: false, error: "SCOPE_ID_REQUIRED" });
  }

  const intervalDays =
    typeof body.intervalDays === "number" && body.intervalDays > 0
      ? body.intervalDays
      : undefined;

  const operatorId = typeof session.user?.id === "string" ? session.user.id : null;

  const cycle = await createNextReviewCycle(body.scopeId.trim(), {
    intervalDays,
    note: typeof body.note === "string" ? body.note.trim() : undefined,
    operatorId,
  });

  if (!cycle) {
    return res.status(500).json({ ok: false, error: "CYCLE_CREATION_FAILED" });
  }

  return res.status(201).json({ ok: true, cycle });
}
