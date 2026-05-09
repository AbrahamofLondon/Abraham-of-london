import type { NextApiRequest, NextApiResponse } from "next";

import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import { buildOperatorCadenceQueue } from "@/lib/product/retained-cadence-service";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await requireAdminServer(req, res, {
    routeKey: "admin-retained-cadence-list",
  });
  if (!session) return;

  const queue = await buildOperatorCadenceQueue().catch(() => null);
  if (!queue) {
    return res.status(500).json({ ok: false, error: "QUEUE_UNAVAILABLE" });
  }

  return res.status(200).json({
    ok: true,
    operatorId: typeof session.user?.id === "string" ? session.user.id : null,
    queue,
  });
}
