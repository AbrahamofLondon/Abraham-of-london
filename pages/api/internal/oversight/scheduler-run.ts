import type { NextApiRequest, NextApiResponse } from "next";

import { runOversightScheduler } from "@/lib/product/oversight-scheduler-engine";
import { requireOversightRole } from "@/lib/product/operator-role-access";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const accessSession = await requireOversightRole(req, res, {
    routeKey: "internal-oversight-scheduler-run",
    permission: "OVERSIGHT_REVIEW",
  });
  if (!accessSession) return;

  const actorId = typeof accessSession.session.user?.id === "string" ? accessSession.session.user.id : null;
  const generateCycles = req.body?.generateCycles === true;
  const result = await runOversightScheduler({ actorId, generateCycles });
  return res.status(200).json({ ok: true, result });
}
