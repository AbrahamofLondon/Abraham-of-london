import type { NextApiRequest, NextApiResponse } from "next";

import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import { runRetainedCadenceTick } from "@/lib/product/retained-cadence-scheduler";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await requireAdminServer(req, res, {
    routeKey: "admin-retained-cadence-run-now",
  });
  if (!session) return;

  const actorId = typeof session.user?.id === "string" ? session.user.id : null;
  const result = await runRetainedCadenceTick({ actorId });
  return res.status(200).json({ ok: true, result });
}
