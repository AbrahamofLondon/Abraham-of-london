import type { NextApiRequest, NextApiResponse } from "next";

import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import { runRetainedCadenceTick } from "@/lib/product/retained-cadence-scheduler";

function validSecret(req: NextApiRequest) {
  const configured = process.env.RETAINED_CADENCE_TICK_SECRET || process.env.OVERSIGHT_CRON_SECRET;
  if (!configured) return false;
  const presented = req.headers["x-retained-cadence-secret"];
  const token = Array.isArray(presented) ? presented[0] : presented;
  return typeof token === "string" && token === configured;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  let actorId: string | null = null;

  if (!validSecret(req)) {
    const session = await requireAdminServer(req, res, {
      routeKey: "internal-retained-cadence-tick",
    });
    if (!session) return;
    actorId = typeof session.user?.id === "string" ? session.user.id : null;
  }

  const result = await runRetainedCadenceTick({ actorId });
  return res.status(200).json({ ok: true, result });
}
