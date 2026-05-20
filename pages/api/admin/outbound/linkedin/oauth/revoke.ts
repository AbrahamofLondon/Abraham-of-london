import type { NextApiRequest, NextApiResponse } from "next";

import { requireAdminApi } from "@/lib/access/server";
import { revokeLinkedInConnection } from "@/lib/outbound/linkedin-oauth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const guard = await requireAdminApi(req, res);
  if (!guard) return;

  await revokeLinkedInConnection();
  return res.status(200).json({ ok: true, message: "LinkedIn connection revoked locally." });
}
